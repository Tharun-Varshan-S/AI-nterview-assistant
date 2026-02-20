const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const DELAY_MS = 1500;
const RETRY_BACKOFF = [1500, 3000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core Gemini API Caller with Rate Limiting & Retry Logic
 */
const callGemini = async (prompt, attempt = 0) => {
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
    return JSON.parse(text);

  } catch (error) {
    const status = error.response?.status;
    const isRateLimit = status === 429;

    logger.error(`Gemini API Error [${status || 'NETWORK'}]: ${error.message}`,
      error.response?.data || 'No response data');

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

  const prompt = `
    You are a senior technical interviewer. Generate exactly 6 questions based on this resume context.
    
    STRICT REQUIREMENTS:
    - Generate EXACTLY 6 questions.
    - 2 Easy, 2 Medium, 2 Hard.
    - 1 question MUST be scenario-based.
    - 1 question MUST be debugging-based.
    - 1 question MUST be system-design-level (hard).
    - Questions must be personalized to the candidate's actual skills.
    
    Response format (STRICT JSON ONLY):
    {
      "questions": [
        {
          "question": "string",
          "difficulty": "easy|medium|hard",
          "topic": "string"
        }
      ]
    }

    CANDIDATE CONTEXT:
    ${domainContext}
  `;

  try {
    return await callGemini(prompt);
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
