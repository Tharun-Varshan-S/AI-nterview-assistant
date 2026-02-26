const axios = require('axios');
const logger = require('../utils/logger');
const {
  resumePrompt,
  questionPrompt,
  evaluationPrompt,
  codingPrompt,
  ensureRequiredKeys,
  buildPromptPayload
} = require('./prompts');

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const DELAY_MS = 1500;
const RETRY_BACKOFF = [1500, 3000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeJsonLikeText = (text) =>
  text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();

const findBalancedJsonSnippet = (text) => {
  const src = String(text || '');
  const startCandidates = [];

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{' || ch === '[') startCandidates.push(i);
  }

  const getClosing = (open) => (open === '{' ? '}' : ']');

  for (const start of startCandidates) {
    const open = src[start];
    const close = getClosing(open);
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < src.length; i += 1) {
      const ch = src[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === open) depth += 1;
      if (ch === close) depth -= 1;

      if (depth === 0) {
        return src.slice(start, i + 1);
      }
    }
  }

  return null;
};

const extractJsonObject = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const cleaned = sanitizeJsonLikeText(raw);

  const attempts = [cleaned, findBalancedJsonSnippet(cleaned), findBalancedJsonSnippet(raw)].filter(Boolean);

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objStart < objEnd) {
    attempts.push(cleaned.slice(objStart, objEnd + 1));
  }

  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrStart < arrEnd) {
    attempts.push(cleaned.slice(arrStart, arrEnd + 1));
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // try next
    }
  }

  return null;
};

const callGemini = async (prompt, attempt = 0) => {
  if (!process.env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY environment variable not set');
    throw new Error('Gemini API key is not configured');
  }

  await sleep(DELAY_MS);

  try {
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    };

    const response = await axios.post(
      GEMINI_API_ENDPOINT,
      requestBody,
      {
        params: { key: process.env.GEMINI_API_KEY },
        timeout: 30000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Invalid Gemini response structure');
    }

    const parsed = extractJsonObject(text);
    if (!parsed) {
      logger.error('Gemini JSON parse failed', {
        preview: String(text).slice(0, 250)
      });
      const parseError = new Error('Gemini response did not contain valid JSON');
      parseError.isParseError = true;
      throw parseError;
    }

    return parsed;
  } catch (error) {
    const status = error.response?.status || (error.isParseError ? 'PARSE' : undefined);
    const isRetryable = status === 429 || status >= 500 || status === 'PARSE' || !status;

    logger.error(`Gemini API Error [${status || 'NETWORK'}]: ${error.message || 'Unknown error'}`, {
      status,
      data: error.response?.data || error.response?.statusText || 'No response data'
    });

    if (isRetryable && attempt < RETRY_BACKOFF.length) {
      const waitTime = RETRY_BACKOFF[attempt];
      logger.warn(`Retrying Gemini call in ${waitTime}ms... (Attempt ${attempt + 1})`);
      await sleep(waitTime);
      return callGemini(prompt, attempt + 1);
    }

    throw error;
  }
};

const callGeminiWithPromptControl = async ({ prompt, promptVersion, schema, fallback }) => {
  try {
    const result = await callGemini(prompt);
    const requiredKeys = schema?.requiredKeys || [];
    if (requiredKeys.length > 0 && !ensureRequiredKeys(result, requiredKeys)) {
      logger.warn('Gemini schema mismatch, applying fallback', { promptVersion, requiredKeys });
      return fallback;
    }

    if (result && typeof result === 'object') {
      return { ...result, promptVersion };
    }

    return fallback;
  } catch (error) {
    logger.error('Gemini call failed with prompt control', { promptVersion, error: error.message });
    return fallback;
  }
};

const normalizeQuestion = (q = {}) => ({
  question: String(q.question || '').trim(),
  difficulty: String(q.difficulty || 'medium').toLowerCase(),
  topic: String(q.topic || 'General').trim(),
  domain: String(q.domain || 'General').trim(),
  timeLimit: Number(q.timeLimit || 60),
  isCoding: Boolean(q.isCoding),
  testCases: Array.isArray(q.testCases)
    ? q.testCases.slice(0, 5).map((tc) => ({
      input: Array.isArray(tc?.input) ? tc.input : [tc?.input],
      expectedOutput: tc?.expectedOutput,
      description: String(tc?.description || 'Generated test case')
    }))
    : []
});

const normalizeQuestionsPayload = (payload) => {
  if (!payload || !Array.isArray(payload.questions)) return null;

  const normalized = payload.questions.map(normalizeQuestion);

  const valid = normalized.length === 6 && normalized.every((q) =>
    q.question && ['easy', 'medium', 'hard'].includes(q.difficulty) && Number.isFinite(q.timeLimit) && q.timeLimit > 0
  );

  if (!valid) return null;

  return { questions: normalized };
};

exports.validateAndExtractResume = async (resumeText) => {
  const payload = buildPromptPayload({
    prompt: resumePrompt.buildResumePrompt(resumeText),
    version: resumePrompt.version,
    schema: resumePrompt.schema,
    fallback: null
  });

  const result = await callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });

  if (result && !result.isResume) return null;
  return result;
};

exports.generateInterviewQuestions = async (context) => {
  const payload = buildPromptPayload({
    prompt: questionPrompt.buildQuestionPrompt(context),
    version: questionPrompt.version,
    schema: questionPrompt.schema,
    fallback: null
  });

  const result = await callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });

  if (!result) return null;
  return normalizeQuestionsPayload(result);
};

exports.generateInterviewQuestionsWithMetadata = async (context) => {
  return exports.generateInterviewQuestions(context);
};

exports.evaluateAnswer = async (question, answer) => {
  const payload = buildPromptPayload({
    prompt: evaluationPrompt.buildAnswerEvaluationPrompt({ question, answer }),
    version: evaluationPrompt.version,
    schema: evaluationPrompt.schema,
    fallback: {
      score: 5,
      technicalAccuracy: 'Not evaluated',
      clarity: 'Not evaluated',
      depth: 'Not evaluated',
      strengths: ['Response provided'],
      weaknesses: ['Evaluation pending'],
      improvements: ['Retry evaluation'],
      genericFlags: [],
      promptVersion: evaluationPrompt.version
    }
  });

  return callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });
};

exports.evaluateCodeSubmission = async (question, code, language) => {
  const payload = buildPromptPayload({
    prompt: codingPrompt.buildCodingEvaluationPrompt({ question, code, language }),
    version: codingPrompt.version,
    schema: codingPrompt.schema,
    fallback: {
      logicScore: 5,
      readabilityScore: 5,
      edgeCaseHandling: 'Not evaluated',
      timeComplexity: 'Not evaluated',
      spaceComplexity: 'Not evaluated',
      improvementSuggestions: ['Retry evaluation'],
      genericFlags: [],
      promptVersion: codingPrompt.version
    }
  });

  return callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });
};

exports.generateExecutionTestCases = async (question, language = 'javascript') => {
  const payload = buildPromptPayload({
    prompt: codingPrompt.buildTestCaseGenerationPrompt({ question, language }),
    version: codingPrompt.version,
    schema: { requiredKeys: ['testCases'] },
    fallback: { testCases: [] }
  });

  const result = await callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });

  return Array.isArray(result?.testCases) ? result.testCases : [];
};

exports.simulateCodeExecution = async (question, code, language, testCases = []) => {
  const payload = buildPromptPayload({
    prompt: codingPrompt.buildExecutionSimulationPrompt({ question, code, language, testCases }),
    version: codingPrompt.version,
    schema: {
      requiredKeys: ['testCasesPassed', 'totalTestCases', 'runtimeError', 'executionTimeMs', 'executionScore']
    },
    fallback: {
      testCasesPassed: 0,
      totalTestCases: testCases.length || 0,
      runtimeError: 'Execution simulation unavailable',
      executionTimeMs: 0,
      executionScore: 0,
      promptVersion: codingPrompt.version
    }
  });

  return callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });
};

exports.generateSkillGapReport = async (userSkillSummary) => {
  const payload = buildPromptPayload({
    prompt: evaluationPrompt.buildSkillGapReportPrompt(userSkillSummary),
    version: evaluationPrompt.version,
    schema: { requiredKeys: ['strongestSkills', 'weakestSkills', 'recommendedFocusAreas', 'learningSuggestions', 'estimatedRoadmapWeeks', 'summary'] },
    fallback: null
  });

  return callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });
};
