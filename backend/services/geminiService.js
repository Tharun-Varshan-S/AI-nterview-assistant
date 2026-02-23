const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const DELAY_MS = 1500;
const RETRY_BACKOFF = [1500, 3000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractJsonObject = (text) => {
  const trimmed = String(text || '').trim();

  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Continue with guarded extraction when model wraps JSON in extra text/fences.
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || start >= end) return null;

  const candidate = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (_) {
    return null;
  }
};

const getExperienceLevelFromYears = (years) => {
  if (years <= 1) return 'junior';
  if (years <= 4) return 'mid';
  return 'senior';
};

const normalizeQuestionsPayload = (payload) => {
  if (!payload || !Array.isArray(payload.questions)) return null;

  const normalized = payload.questions.map((item) => ({
    question: String(item?.question || '').trim(),
    difficulty: String(item?.difficulty || '').toLowerCase(),
    timeLimit: Number(item?.timeLimit),
  }));

  const expectedDifficultyOrder = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
  const isValid =
    normalized.length === 6 &&
    normalized.every((q) =>
      q.question &&
      ['easy', 'medium', 'hard'].includes(q.difficulty) &&
      Number.isFinite(q.timeLimit) &&
      q.timeLimit > 0
    ) &&
    normalized.filter((q) => q.difficulty === 'easy').length === 2 &&
    normalized.filter((q) => q.difficulty === 'medium').length === 2 &&
    normalized.filter((q) => q.difficulty === 'hard').length === 2 &&
    new Set(normalized.map((q) => q.question.toLowerCase())).size === 6;

  if (!isValid) return null;

  const orderByDifficulty = { easy: 0, medium: 1, hard: 2 };
  normalized.sort((a, b) => orderByDifficulty[a.difficulty] - orderByDifficulty[b.difficulty]);
  const corrected = normalized.map((q, idx) => ({
    ...q,
    difficulty: expectedDifficultyOrder[idx],
    timeLimit: expectedDifficultyOrder[idx] === 'easy' ? 20 : expectedDifficultyOrder[idx] === 'medium' ? 40 : 60,
  }));

  return { questions: corrected };
};

/**
 * Core Gemini API Caller with Rate Limiting & Retry Logic
 */
const callGemini = async (prompt, attempt = 0) => {
  // Validate API key before calling
  if (!process.env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY environment variable not set');
    throw new Error('Gemini API key is not configured');
  }

  // Pre-call delay to prevent burst (1.5s)
  await sleep(DELAY_MS);

  try {
    const response = await axios.post(
      GEMINI_API_ENDPOINT,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        },
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        timeout: 30000,
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini response structure');
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const parsed = extractJsonObject(text);
    if (!parsed) {
      throw new Error('Gemini response did not contain valid JSON');
    }
    return parsed;

  } catch (error) {
    const status = error.response?.status;
    const isRateLimit = status === 429;
    const errorMessage = error.message || 'Unknown error';
    const errorData = error.response?.data || error.response?.statusText || 'No response data';

    logger.error(`Gemini API Error [${status || 'NETWORK'}]: ${errorMessage}`, 
      { status, data: errorData });

    if ((isRateLimit || (status >= 500) || !status) && attempt < RETRY_BACKOFF.length) {
      const waitTime = RETRY_BACKOFF[attempt];
      logger.warn(`Retrying Gemini call in ${waitTime}ms... (Attempt ${attempt + 1})`);
      await sleep(waitTime);
      return callGemini(prompt, attempt + 1);
    }

    throw error;
  }
};

/**
 * Stage 2: AI Validation + Structured Extraction
 */
exports.validateAndExtractResume = async (resumeText) => {
  const prompt = `
    You are a professional resume parser. Analyze the provided text.
    Return STRICT JSON ONLY. No explanation.
    
    If it is NOT a resume (e.g., a recipe, a book, random text, or extremely sparse), set isResume=false.
    
    Response format:
    {
      "isResume": true,
      "confidence": 0-100,
      "skills": ["string"],
      "technologies": ["string"],
      "experienceYears": number,
      "education": ["string"],
      "primaryDomain": "string"
    }

    TEXT:
    ${resumeText}
  `;

  try {
    const result = await callGemini(prompt);
    // If structured data suggests it's not a resume, we return null to be handled by controller
    if (result && !result.isResume) return null;
    return result;
  } catch (error) {
    logger.warn('AI Resume Validation failed, falling back to basic metadata recovery');
    return null; // Controller will handle null by storing raw text
  }
};

/**
 * Stage 3: Resume-Aware Question Generation
 */
exports.generateInterviewQuestions = async (context) => {
  const { structuredData, rawText } = context;

  // Logic to build context string
  let domainContext = "";
  if (structuredData) {
    const skills = structuredData.skills?.join(', ') || 'General';
    const technologies = structuredData.technologies?.join(', ') || 'N/A';
    domainContext = `
      Domain: ${structuredData.primaryDomain || 'General'}
      Skills: ${skills}
      Technologies: ${technologies}
      Years of Exp: ${structuredData.experienceYears || 0}
    `;
  } else {
    // Fallback domain mapping if structuredData is null
    domainContext = `Context extracted from raw text: ${rawText.substring(0, 1000)}`;
  }

  const candidateName = 'Candidate';
  const candidateSkills = structuredData
    ? [
      ...(structuredData.skills || []),
      ...(structuredData.technologies || []),
    ].filter(Boolean)
    : [];
  const candidateSkillsText = candidateSkills.length
    ? candidateSkills.join(', ')
    : 'General software engineering';
  const experienceYears = Number(structuredData?.experienceYears || 0);
  const experienceLevel = getExperienceLevelFromYears(experienceYears);

  const prompt = `You are a backend JSON API service for an AI Interview Assistant.

Your job is to generate structured interview questions.

STRICT OUTPUT RULES (MUST FOLLOW):

1. Return ONLY valid raw JSON.
2. Do NOT wrap the response in markdown.
3. Do NOT use \`\`\`json or \`\`\` anywhere.
4. Do NOT add explanations, comments, notes, or extra text.
5. Do NOT say things like "Here is the JSON".
6. The response must start with { and end with } exactly.
7. Use double quotes for all keys and string values.
8. Do NOT include trailing commas.
9. The output must be directly parsable using JSON.parse().
10. If you cannot follow the format, return an empty JSON object: {}.

JSON STRUCTURE (MUST MATCH EXACTLY):

{
  "questions": [
    {
      "question": "string",
      "difficulty": "easy | medium | hard",
      "timeLimit": number
    }
  ]
}

INTERVIEW REQUIREMENTS:

- Generate exactly 6 technical interview questions.
- 2 EASY questions (timeLimit: 20)
- 2 MEDIUM questions (timeLimit: 40)
- 2 HARD questions (timeLimit: 60)
- Questions must match the candidate's skills.
- Do NOT repeat questions.
- Keep questions clear and professional.
- Questions should test real technical understanding.

CANDIDATE INFORMATION:
Name: ${candidateName}
Skills: ${candidateSkillsText}
Experience Level: ${experienceLevel}

Additional Resume Context:
${domainContext}

Generate the questions now.`;

  try {
    const raw = await callGemini(prompt);
    return normalizeQuestionsPayload(raw);
  } catch (error) {
    logger.error('Question generation failed');
    return null;
  }
};

/**
 * Stage 4: Answer Evaluation
 */
exports.evaluateAnswer = async (question, answer) => {
  const prompt = `
    Evaluate the technical interview answer. 
    Question: ${question}
    Answer: ${answer}

    Return STRICT JSON ONLY:
    {
      "score": 0-10,
      "technicalAccuracy": "string",
      "clarity": "string",
      "depth": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "improvements": ["string"]
    }
  `;

  try {
    return await callGemini(prompt);
  } catch (error) {
    logger.error('Answer evaluation failed');
    return null;
  }
};

/**
 * Enhanced: Question Generation with Metadata (topic, domain, difficulty)
 */
exports.generateInterviewQuestionsWithMetadata = async (context) => {
  const { structuredData, rawText, focusTopics = [] } = context;

  let domainContext = "";
  if (structuredData) {
    const skills = structuredData.skills?.join(', ') || 'General';
    const technologies = structuredData.technologies?.join(', ') || 'N/A';
    domainContext = `
      Domain: ${structuredData.primaryDomain || 'General'}
      Skills: ${skills}
      Technologies: ${technologies}
      Years of Exp: ${structuredData.experienceYears || 0}
    `;
  } else {
    domainContext = `Context extracted from raw text: ${rawText.substring(0, 1000)}`;
  }

  const focusTopicsText = focusTopics.length > 0 ? `Prioritize these topics: ${focusTopics.join(', ')}.` : '';

  const prompt = `You are an AI Interview System. Generate adaptive interview questions with detailed metadata.

STRICT OUTPUT RULES:
1. Return ONLY valid JSON without markdown or explanation.
2. Must be directly parsable.
3. All strings use double quotes.

JSON STRUCTURE:
{
  "questions": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "topic": "string (specific skill area)",
      "domain": "string (Frontend/Backend/DevOps/etc)",
      "timeLimit": number
    }
  ]
}

REQUIREMENTS:
- Generate exactly 6 questions.
- 2 EASY (topic: different), 2 MEDIUM (topic: different), 2 HARD (topic: different).
- Each question must have unique topic.
- For each question, specify domain (Frontend, Backend, DevOps, Database, Architecture, etc).
- Match candidate skills: ${structuredData?.skills?.join(', ') || 'General'}
- ${focusTopicsText}

CANDIDATE INFO:
${domainContext}

Generate now.`;

  try {
    const result = await callGemini(prompt);
    if (!result?.questions || result.questions.length !== 6) return null;
    return result;
  } catch (error) {
    logger.error('Enhanced question generation failed');
    return null;
  }
};

/**
 * Evaluate Code Submission
 */
exports.evaluateCodeSubmission = async (question, code, language) => {
  const prompt = `You are a code reviewer for an interview platform. Evaluate this code solution.

Question: ${question}
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Return STRICT JSON ONLY:
{
  "logicScore": 0-10,
  "readabilityScore": 0-10,
  "edgeCaseHandling": "string",
  "timeComplexity": "string (e.g., O(n))",
  "spaceComplexity": "string (e.g., O(1))",
  "improvementSuggestions": ["string"]
}`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    logger.error('Code evaluation failed');
    return null;
  }
};

/**
 * Generate Skill Gap Report
 * Called after 3+ interviews to create personalized roadmap
 */
exports.generateSkillGapReport = async (userSkillSummary) => {
  const {
    strongestSkills = [],
    weakestSkills = [],
    allTopicsAttempted = [],
    averageScore = 0,
    interviewCount = 0
  } = userSkillSummary;

  const prompt = `You are a career development advisor. Based on interview performance, generate a personalized skill gap report.

PERFORMANCE DATA:
- Interviews Completed: ${interviewCount}
- Average Score: ${averageScore}/10
- Strongest Skills: ${strongestSkills.join(', ') || 'None identified'}
- Weakest Skills: ${weakestSkills.join(', ') || 'None identified'}
- Topics Attempted: ${allTopicsAttempted.join(', ') || 'General'}

Return STRICT JSON ONLY:
{
  "strongestSkills": ["string"],
  "weakestSkills": ["string"],
  "recommendedFocusAreas": ["string"],
  "learningSuggestions": ["string"],
  "estimatedRoadmapWeeks": number,
  "summary": "string"
}`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    logger.error('Skill gap report generation failed');
    return null;
  }
};
