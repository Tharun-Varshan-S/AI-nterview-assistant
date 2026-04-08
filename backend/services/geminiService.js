const axios = require('axios');
const logger = require('../utils/logger');
const {
  resumePrompt,
  questionPrompt,
  evaluationPrompt,
  codingPrompt,
  topicCodingPrompt,
  ensureRequiredKeys,
  buildPromptPayload
} = require('./prompts');
const {
  getFallbackCodingQuestion,
  getFallbackCodingQuestions,
  getFallbackTheoreticalQuestion,
  getFallbackTheoreticalQuestions
} = require('./fallbackQuestions');

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const DELAY_MS = 1500;
const RETRY_BACKOFF = [1500, 3000];
const USE_MOCK = process.env.USE_MOCK === 'true' || false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeJsonLikeText = (text) =>
  text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();

function validateTestCases(question) {
  if (!question || !Array.isArray(question.test_cases) || question.test_cases.length === 0) return false;

  return question.test_cases.every((tc) =>
    tc &&
    typeof tc.input === 'string' &&
    typeof tc.output === 'string' &&
    tc.input.trim() !== '' &&
    tc.output.trim() !== ''
  );
}

const isRateLimitError = (error) => {
  const status = Number(error?.response?.status);
  const message = String(error?.message || '').toLowerCase();
  const payload = JSON.stringify(error?.response?.data || {}).toLowerCase();
  return status === 429 || message.includes('quota') || message.includes('limit') || payload.includes('quota') || payload.includes('limit');
};

const getRateLimitResponse = () => ({
  errorType: 'RATE_LIMIT',
  message: 'API limit reached'
});

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
  if (USE_MOCK) {
    throw new Error('Mock mode enabled');
  }

  if (!process.env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY environment variable not set');
    throw new Error('Gemini API key is not configured');
  }

  await sleep(DELAY_MS);

  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
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
    if (isRateLimitError(error)) {
      return {
        ...(fallback && typeof fallback === 'object' ? fallback : {}),
        ...getRateLimitResponse()
      };
    }
    return fallback;
  }
};

const normalizeGeneratedCodingQuestion = (q = {}, topic = 'Arrays', difficulty = 'medium') => {
  const normalizedTestCases = (Array.isArray(q.test_cases) ? q.test_cases : Array.isArray(q.testCases) ? q.testCases : [])
    .map((tc) => ({
      input: String(tc?.input ?? '').trim(),
      output: String(tc?.output ?? tc?.expected ?? tc?.expectedOutput ?? '').trim()
    }));

  return {
    title: String(q.title || '').trim(),
    description: String(q.description || q.question || '').trim(),
    input_format: String(q.input_format || q.inputFormat || '').trim(),
    output_format: String(q.output_format || q.outputFormat || '').trim(),
    constraints: Array.isArray(q.constraints)
      ? q.constraints.map(String)
      : String(q.constraints || '').trim(),
    function_signature: String(q.function_signature || q.functionSignature || 'def solve():').trim(),
    test_cases: normalizedTestCases,
    difficulty: String(q.difficulty || difficulty).toLowerCase(),
    topic: String(q.topic || topic).trim(),
    tags: Array.isArray(q.tags) ? q.tags.map(String) : [String(q.topic || topic).trim()]
  };
};

const toPlatformQuestion = (question) => {
  const mappedTestCases = question.test_cases.map((tc, index) => ({
    input: tc.input,
    expected: tc.output,
    isHidden: index >= 2,
    description: index < 2 ? 'Visible generated test case' : 'Hidden generated test case'
  }));

  return {
    title: question.title,
    description: question.description,
    question: question.description,
    type: 'coding',
    difficulty: question.difficulty,
    topic: question.topic,
    domain: 'Data Structures & Algorithms',
    timeLimit: 180,
    isCoding: true,
    input_format: question.input_format,
    output_format: question.output_format,
    function_signature: question.function_signature,
    inputFormat: question.input_format,
    outputFormat: question.output_format,
    constraints: Array.isArray(question.constraints)
      ? question.constraints
      : String(question.constraints || '').trim()
        ? [String(question.constraints).trim()]
        : [],
    examples: question.test_cases.slice(0, 2).map((tc) => ({
      input: tc.input,
      output: tc.output,
      explanation: 'Generated example'
    })),
    test_cases: question.test_cases.map((tc, index) => ({
      input: tc.input,
      output: tc.output,
      isHidden: index >= 2
    })),
    testCases: mappedTestCases,
    hiddenTestCases: mappedTestCases.filter((tc) => tc.isHidden),
    tags: question.tags
  };
};

const normalizeQuestion = (q = {}) => {
  const type = String(q.type || (q.isCoding ? 'coding' : 'theoretical')).toLowerCase() === 'coding'
    ? 'coding'
    : 'theoretical';
  const isCoding = type === 'coding';
  return {
    question: String(q.question || '').trim(),
    type,
    difficulty: String(q.difficulty || 'medium').toLowerCase(),
    topic: String(q.topic || 'General').trim(),
    domain: String(q.domain || 'General').trim(),
    timeLimit: Number(q.timeLimit || 60),
    isCoding,
    inputFormat: isCoding ? String(q.inputFormat || '').trim() : '',
    outputFormat: isCoding ? String(q.outputFormat || '').trim() : '',
    constraints: isCoding && Array.isArray(q.constraints)
      ? q.constraints.slice(0, 8).map((c) => String(c))
      : [],
    examples: isCoding && Array.isArray(q.examples)
      ? q.examples.slice(0, 3).map((ex) => ({
        input: String(ex?.input ?? ''),
        output: String(ex?.output ?? ''),
        explanation: String(ex?.explanation ?? '')
      }))
      : [],
    template: isCoding ? String(q.template || '').trim() : '',
    testCases: isCoding && Array.isArray(q.testCases)
      ? q.testCases.slice(0, 5).map((tc) => ({
        input: Array.isArray(tc?.input) ? tc.input : [tc?.input],
        expectedOutput: tc?.expectedOutput,
        description: String(tc?.description || 'Generated test case')
      }))
      : []
  };
};

const normalizeQuestionsPayload = (payload, expectedCount = 6) => {
  if (!payload || !Array.isArray(payload.questions)) return null;

  const normalized = payload.questions.map(normalizeQuestion);

  const safeCount = Number.isFinite(Number(expectedCount))
    ? Math.max(3, Math.min(10, Number(expectedCount)))
    : 6;
  const valid = normalized.length === safeCount && normalized.every((q) =>
    q.question && ['easy', 'medium', 'hard'].includes(q.difficulty) && Number.isFinite(q.timeLimit) && q.timeLimit > 0
  );

  if (!valid) return null;

  // Validate that any coding question has valid test cases
  for (const q of normalized) {
    const normalizedQuestion = {
      test_cases: Array.isArray(q.testCases)
        ? q.testCases.map((tc) => ({
            input: Array.isArray(tc?.input) ? String(tc.input[0] ?? '') : String(tc?.input ?? ''),
            output: String(tc?.expectedOutput ?? '')
          }))
        : []
    };

    if (q.isCoding && !validateTestCases(normalizedQuestion)) {
      logger.warn('AI generated coding question failed test cases validation', { question: q.question });
      return null; // Will trigger fallback
    }
  }

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
  try {
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

    if (!result) {
      logger.warn('Interview question generation failed, using fallback', { context });
      // Build fallback questions based on context
      const fallbackQuestions = buildFallbackInterviewQuestions(context);
      return fallbackQuestions;
    }
    const normalized = normalizeQuestionsPayload(result, context?.questionCount || 6);
    if (!normalized) {
      logger.warn('Interview question payload invalid, using fallback', { context });
      return buildFallbackInterviewQuestions(context);
    }
    return normalized;
  } catch (error) {
    logger.error('generateInterviewQuestions error, using fallback', { error: error.message });
    const fallbackQuestions = buildFallbackInterviewQuestions(context);
    return fallbackQuestions;
  }
};

// Helper function to build fallback interview questions
const buildFallbackInterviewQuestions = (context) => {
  const count = context?.questionCount || 6;
  const topics = context?.focusTopics || ['Arrays', 'Data Structures', 'Algorithms'];

  if (context?.interviewType === 'coding') {
    const topic = topics[0] || 'Arrays';
    return { questions: getFallbackCodingQuestions({ topic, difficulty: 'medium', count }) };
  }

  if (context?.interviewType === 'mixed') {
    const codingCount = Math.max(1, Math.floor(count / 2));
    const theoryCount = Math.max(1, count - codingCount);
    const codingTopic = topics[0] || 'Arrays';
    const codingQuestions = getFallbackCodingQuestions({ topic: codingTopic, difficulty: 'medium', count: codingCount });
    const theoryQuestions = getFallbackTheoreticalQuestions({ topics, count: theoryCount });
    return { questions: [...codingQuestions, ...theoryQuestions].slice(0, count) };
  }

  return {
    questions: getFallbackTheoreticalQuestions({ topics, count })
  };
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
      issue: 'Final evaluator unavailable.',
      correctConcept: 'Provide a structured answer covering core concept, reasoning, and example.',
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

exports.analyzeWithGemini = async (prompt) => {
  const result = await callGemini(prompt);
  return JSON.stringify(result);
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

/**
 * Generate topic-specific coding problems
 * This is the key function for practice mode coding questions
 *
 * @param {Object} options
 * @param {string} options.topic - The DSA topic (e.g., "dp", "trees", "graphs")
 * @param {string} options.difficulty - "easy" | "medium" | "hard"
 * @param {number} options.count - Number of questions to generate (default: 1)
 * @returns {Object} - { questions: [...] } with LeetCode-style problems
 */
exports.generateTopicCodingQuestion = async ({ topic, difficulty = 'medium', count = 1 }) => {
  const fallbackQuestions = getFallbackCodingQuestions({ topic, difficulty, count });

  if (USE_MOCK) {
    console.log('QUESTION:', fallbackQuestions[0]?.title);
    console.log('TEST CASES:', fallbackQuestions[0]?.test_cases);
    return { questions: fallbackQuestions, isFallback: true, mock: true };
  }

  try {
    // Use deterministic local question bank as primary source to avoid random or repeated AI-generated coding prompts.
    // Gemini is retained as helper for code evaluation, not for coding prompt generation.
    return { questions: fallbackQuestions, isFallback: true };
  } catch (error) {
    console.warn('AI failed, using fallback', error);
    logger.error('generateTopicCodingQuestion error, using fallback', { error: error.message, topic, difficulty });
    if (isRateLimitError(error)) {
      return { questions: fallbackQuestions, isFallback: true, rateLimit: getRateLimitResponse() };
    }
    return { questions: fallbackQuestions, isFallback: true };
  }
};
