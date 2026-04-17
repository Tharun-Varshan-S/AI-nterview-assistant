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
let GEMINI_DISABLED_FOR_RUNTIME = false;
let GEMINI_DISABLE_NOTICE_LOGGED = false;
const SHOULD_LOG_QUESTION_DEBUG = process.env.NODE_ENV !== 'production';

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

const isPermissionDeniedError = (error) => {
  const status = Number(error?.response?.status);
  const payload = JSON.stringify(error?.response?.data || {}).toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return status === 403 || payload.includes('permission_denied') || message.includes('permission denied') || payload.includes('denied access');
};

const getRateLimitResponse = () => ({
  errorType: 'RATE_LIMIT',
  message: 'API limit reached'
});

const isMeaninglessAnswer = (answer = '') => {
  const raw = String(answer || '').trim();
  if (!raw) return true;
  if (raw.length < 3) return true;
  if (/^[a-z]{1,4}$/i.test(raw) && !/[aeiou]/i.test(raw)) return true;
  if (/^(ds|asd|fghtfh|test|ok|hi)$/i.test(raw)) return true;
  return false;
};

const localEvaluateAnswer = (question, answer) => {
  const q = String(question || '').toLowerCase();
  const a = String(answer || '').trim();

  if (isMeaninglessAnswer(a)) {
    return {
      score: 0,
      technicalAccuracy: 'Invalid or missing answer',
      clarity: 'Invalid or missing answer',
      depth: 'Invalid or missing answer',
      strengths: [],
      weaknesses: ['Invalid or missing answer'],
      improvements: ['Provide a complete technical answer with concept, reasoning, and example.'],
      issue: 'Invalid or missing answer',
      correctConcept: 'Answer should include core concept, why it works, and one practical example.',
      genericFlags: ['LOCAL_EVAL_FALLBACK'],
      promptVersion: `${evaluationPrompt.version}.local-fallback`
    };
  }

  const words = a.split(/\s+/).filter(Boolean);
  const lowerA = a.toLowerCase();
  const hasStructure = /\b(first|second|third|because|therefore|for example|example)\b/.test(lowerA);

  const rubric = {
    conceptUnderstanding: 0,
    accuracy: 0,
    completeness: 0,
    clarity: 0
  };

  // Base scoring by substance
  rubric.completeness = Math.min(25, Math.floor(words.length / 4));
  rubric.clarity = hasStructure ? 20 : 12;

  // Topic-aware checks
  if (q.includes('react')) {
    const hasUseState = /\busestate\b/.test(lowerA);
    const hasUseEffect = /\buseeffect\b/.test(lowerA);
    const hasFunctional = /\bfunctional component|function component|hooks\b/.test(lowerA);
    rubric.conceptUnderstanding = hasUseState || hasUseEffect ? 18 : 10;
    rubric.accuracy = (hasUseState ? 8 : 0) + (hasUseEffect ? 8 : 0) + (hasFunctional ? 6 : 0);
  } else if (q.includes('git')) {
    const hasBranch = /\bbranch|feature branch\b/.test(lowerA);
    const hasMerge = /\bmerge\b/.test(lowerA);
    const hasRebase = /\brebase\b/.test(lowerA);
    rubric.conceptUnderstanding = hasBranch ? 18 : 10;
    rubric.accuracy = (hasBranch ? 8 : 0) + (hasMerge ? 8 : 0) + (hasRebase ? 6 : 0);
  } else if (q.includes('rest')) {
    const hasStateless = /\bstateless\b/.test(lowerA);
    const hasMethods = /\bget|post|put|patch|delete\b/.test(lowerA);
    const hasClientServer = /\bclient|server\b/.test(lowerA);
    rubric.conceptUnderstanding = hasStateless ? 20 : 12;
    rubric.accuracy = (hasStateless ? 10 : 0) + (hasMethods ? 8 : 0) + (hasClientServer ? 6 : 0);
  } else if (q.includes('typescript') || q.includes('js vs ts')) {
    const hasTyping = /\bstatic type|typing|types\b/.test(lowerA);
    const hasCompile = /\bcompile|compile-time\b/.test(lowerA);
    const hasScale = /\blarge|scal|maintain|refactor\b/.test(lowerA);
    rubric.conceptUnderstanding = hasTyping ? 20 : 12;
    rubric.accuracy = (hasTyping ? 10 : 0) + (hasCompile ? 8 : 0) + (hasScale ? 6 : 0);
  } else {
    rubric.conceptUnderstanding = words.length > 20 ? 18 : 12;
    rubric.accuracy = words.length > 30 ? 18 : 12;
  }

  rubric.accuracy = Math.min(25, rubric.accuracy);
  rubric.conceptUnderstanding = Math.min(25, rubric.conceptUnderstanding);
  rubric.completeness = Math.min(25, rubric.completeness);
  rubric.clarity = Math.min(25, rubric.clarity);

  const total = rubric.conceptUnderstanding + rubric.accuracy + rubric.completeness + rubric.clarity;

  return {
    score: Number((total / 10).toFixed(1)),
    technicalAccuracy: `Local rubric score ${rubric.accuracy}/25`,
    clarity: `Local rubric score ${rubric.clarity}/25`,
    depth: `Local rubric score ${rubric.completeness}/25`,
    strengths: ['Answer submitted and evaluated with local rubric fallback.'],
    weaknesses: total < 55 ? ['Add clearer structure and include concrete technical points.'] : [],
    improvements: [
      'Use concept -> reasoning -> example format.',
      'Cover key terms expected by the topic.'
    ],
    issue: total < 55 ? 'Partial coverage of expected technical points.' : 'No major issue detected.',
    correctConcept: 'Include core concept, technical accuracy, completeness, and clear explanation.',
    breakdown: rubric,
    maxScore: 100,
    confidence: total >= 75 ? 'HIGH' : total >= 50 ? 'MEDIUM' : 'LOW',
    genericFlags: ['LOCAL_EVAL_FALLBACK'],
    promptVersion: `${evaluationPrompt.version}.local-fallback`
  };
};

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

  if (GEMINI_DISABLED_FOR_RUNTIME) {
    const disabledError = new Error('Gemini temporarily disabled for this runtime due to permission denial');
    disabledError.geminiDisabled = true;
    throw disabledError;
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

    const apiKey = encodeURIComponent(process.env.GEMINI_API_KEY);
    const endpointWithKey = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;

    const response = await axios.post(
      endpointWithKey,
      requestBody,
      {
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
    const isRetryable = status >= 500 || status === 'PARSE' || !status;

    if (isPermissionDeniedError(error)) {
      GEMINI_DISABLED_FOR_RUNTIME = true;
      if (!GEMINI_DISABLE_NOTICE_LOGGED) {
        logger.warn('Gemini access denied (403). Disabling Gemini calls for this runtime and using local fallbacks.');
        GEMINI_DISABLE_NOTICE_LOGGED = true;
      }
    }

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
    if (error?.geminiDisabled || isPermissionDeniedError(error)) {
      return {
        ...(fallback && typeof fallback === 'object' ? fallback : {}),
        errorType: 'PERMISSION_DENIED',
        message: 'Gemini access denied. Please contact support.'
      };
    }

    logger.error('Gemini call failed with prompt control', { promptVersion, error: error.message });
    if (isRateLimitError(error)) {
      logger.warn('GEMINI_RATE_LIMIT_NOTIFY: Gemini returned 429/quota limit. Using fallback response.', {
        promptVersion
      });
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

    if (SHOULD_LOG_QUESTION_DEBUG) {
      console.log('RAW_OUTPUT:');
      console.log(result);
    }

    if (!result) {
      logger.warn('Interview question generation failed', { context });
      if (context?.interviewType === 'coding') {
        return {
          ...buildFallbackInterviewQuestions(context),
          source: 'fallback',
          fallbackReason: 'gemini_unavailable'
        };
      }
      return {
        questions: [],
        source: 'fallback',
        fallbackReason: 'gemini_unavailable'
      };
    }

    if (result?.errorType === 'RATE_LIMIT') {
      if (context?.interviewType === 'coding') {
        return {
          ...buildFallbackInterviewQuestions(context),
          source: 'fallback',
          fallbackReason: 'gemini_rate_limit',
          errorType: 'RATE_LIMIT'
        };
      }
      return {
        questions: [],
        source: 'fallback',
        fallbackReason: 'gemini_rate_limit',
        errorType: 'RATE_LIMIT'
      };
    }

    if (result?.errorType === 'PERMISSION_DENIED') {
      if (context?.interviewType === 'coding') {
        return {
          ...buildFallbackInterviewQuestions(context),
          source: 'fallback',
          fallbackReason: 'gemini_permission_denied',
          errorType: 'PERMISSION_DENIED'
        };
      }
      return {
        questions: [],
        source: 'fallback',
        fallbackReason: 'gemini_permission_denied',
        errorType: 'PERMISSION_DENIED'
      };
    }

    const normalized = normalizeQuestionsPayload(result, context?.questionCount || 6);
    if (!normalized) {
      logger.warn('Interview question payload invalid', { context });
      if (context?.interviewType === 'coding') {
        return {
          ...buildFallbackInterviewQuestions(context),
          source: 'fallback',
          fallbackReason: 'invalid_gemini_payload'
        };
      }
      return {
        questions: [],
        source: 'fallback',
        fallbackReason: 'invalid_gemini_payload'
      };
    }

    if (SHOULD_LOG_QUESTION_DEBUG) {
      console.log('JSON_OUTPUT:');
      console.log(JSON.stringify(normalized, null, 2));
    }

    return {
      ...normalized,
      source: 'gemini'
    };
  } catch (error) {
    logger.error('generateInterviewQuestions error', { error: error.message });
    if (context?.interviewType === 'coding') {
      return {
        ...buildFallbackInterviewQuestions(context),
        source: 'fallback',
        fallbackReason: 'generation_exception'
      };
    }
    return {
      questions: [],
      source: 'fallback',
      fallbackReason: 'generation_exception'
    };
  }
};

// Helper function to interleave questions starting with theoretical
const interleaveMixedQuestions = (coding, theory, totalCount) => {
  const result = [];
  let codingIndex = 0;
  let theoryIndex = 0;

  for (let i = 0; i < totalCount; i++) {
    if (i % 2 === 0) {
      // Even indices (0, 2, 4...): take from theory
      if (theoryIndex < theory.length) {
        result.push(theory[theoryIndex]);
        theoryIndex++;
      } else if (codingIndex < coding.length) {
        result.push(coding[codingIndex]);
        codingIndex++;
      }
    } else {
      // Odd indices (1, 3, 5...): take from coding
      if (codingIndex < coding.length) {
        result.push(coding[codingIndex]);
        codingIndex++;
      } else if (theoryIndex < theory.length) {
        result.push(theory[theoryIndex]);
        theoryIndex++;
      }
    }
  }

  return result;
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
    const interleavedQuestions = interleaveMixedQuestions(codingQuestions, theoryQuestions, count);
    return { questions: interleavedQuestions };
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

  const result = await callGeminiWithPromptControl({
    prompt: payload.prompt,
    promptVersion: payload.version,
    schema: payload.schema,
    fallback: payload.fallback
  });

  if (result?.errorType === 'RATE_LIMIT' || result?.errorType === 'PERMISSION_DENIED') {
    return localEvaluateAnswer(question, answer);
  }

  // If fallback produced "Not evaluated" content, force deterministic local evaluation.
  if (String(result?.technicalAccuracy || '').toLowerCase().includes('not evaluated')) {
    return localEvaluateAnswer(question, answer);
  }

  return result;
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
