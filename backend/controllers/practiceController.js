const PracticeSession = require('../models/PracticeSession');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');
const CodeExecutionSimulator = require('../services/codeExecutionSimulator');
const SkillScoringEngine = require('../engines/skillScoringEngine');
const logger = require('../utils/logger');

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const FALLBACK_QUESTIONS = {
  aptitude: [
    'Explain how you would approach a ratio and proportion problem under time pressure.',
    'Solve a percentages question and explain each step clearly.',
    'How do you eliminate wrong options quickly in logical reasoning?'
  ],
  coding: [
    'Write a function to return the first non-repeating character in a string.',
    'Write a function to merge two sorted arrays.',
    'Write a function to detect if an array contains duplicates.'
  ],
  technical: [
    'What is normalization in DBMS and why is it important?',
    'Explain the difference between stack and queue with use cases.',
    'What are RESTful APIs and common HTTP methods?'
  ],
  behavioral: [
    'Describe a time you handled conflict in a team.',
    'Tell me about a challenging deadline and how you managed it.',
    'Describe a mistake you made and what you learned from it.'
  ]
};

const APTITUDE_MCQ_BANK = {
  quantitative: [
    {
      question: 'A value increases from 200 to 260. What is the percentage increase?',
      options: ['20%', '25%', '30%', '35%'],
      correctAnswer: '30%',
      explanation: 'Increase is 60 on base 200, so (60/200) * 100 = 30%.',
    },
    {
      question: 'If 12 workers complete a task in 15 days, how many days will 18 workers take (same efficiency)?',
      options: ['8', '10', '12', '14'],
      correctAnswer: '10',
      explanation: 'Work is constant: 12 * 15 = 180 worker-days, so 180 / 18 = 10 days.',
    },
    {
      question: 'A train covers 180 km in 2.5 hours. What is its average speed?',
      options: ['60 km/h', '68 km/h', '72 km/h', '75 km/h'],
      correctAnswer: '72 km/h',
      explanation: 'Speed = distance/time = 180 / 2.5 = 72 km/h.',
    },
  ],
  logical: [
    {
      question: 'All coders are problem-solvers. Some problem-solvers are mentors. Which conclusion is valid?',
      options: ['All coders are mentors', 'Some coders are mentors', 'No coders are mentors', 'No definite conclusion'],
      correctAnswer: 'No definite conclusion',
      explanation: 'The statements do not force any overlap between coders and mentors.',
    },
    {
      question: 'Find the next number: 2, 6, 12, 20, 30, ?',
      options: ['36', '40', '42', '44'],
      correctAnswer: '42',
      explanation: 'Pattern is n(n+1): 1*2, 2*3, 3*4, 4*5, 5*6, so next is 6*7 = 42.',
    },
    {
      question: 'If A is taller than B, B taller than C, and C taller than D, who is shortest?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'D',
      explanation: 'By transitive order A > B > C > D, so D is shortest.',
    },
  ],
  analytical: [
    {
      question: 'A team has 5 developers and 3 testers. Two people are chosen at random. What is the probability both are developers?',
      options: ['5/14', '3/7', '10/28', '2/7'],
      correctAnswer: '5/14',
      explanation: 'Total pairs C(8,2)=28, developer pairs C(5,2)=10, so 10/28 = 5/14.',
    },
    {
      question: 'A report has 40% backend, 35% frontend, and rest DevOps tasks. What percent is DevOps?',
      options: ['15%', '20%', '25%', '30%'],
      correctAnswer: '25%',
      explanation: 'Remaining percentage is 100 - (40 + 35) = 25%.',
    },
  ],
};

const defaultTestCases = [
  { input: [1], expectedOutput: 1, description: 'Basic case' },
  { input: [0], expectedOutput: 0, description: 'Edge case' }
];

const pickUniqueItems = (list = [], count = 1, offsetSeed = Date.now()) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const size = Math.max(1, Math.min(count, list.length));
  const start = Math.abs(Number(offsetSeed || 0)) % list.length;
  const selected = [];

  for (let i = 0; i < size; i += 1) {
    selected.push(list[(start + i) % list.length]);
  }

  return selected;
};

const buildAptitudeMCQs = ({ topic = 'Aptitude', difficulty = 'medium', questionCount = 5 }) => {
  const seed = Date.now();
  const selected = [
    ...pickUniqueItems(APTITUDE_MCQ_BANK.quantitative, 2, seed),
    ...pickUniqueItems(APTITUDE_MCQ_BANK.logical, 2, seed + 3),
    ...pickUniqueItems(APTITUDE_MCQ_BANK.analytical, 1, seed + 7),
  ].slice(0, questionCount);

  return selected.map((mcq, idx) => ({
    type: 'mcq',
    question: mcq.question,
    options: mcq.options,
    correctAnswer: mcq.correctAnswer,
    explanation: mcq.explanation,
    difficulty,
    topic,
    domain: 'aptitude',
    timeLimit: 90,
    isCoding: false,
    testCases: [],
    questionIndex: idx,
  }));
};

const buildPracticeQuestions = async ({ mode, topic, difficulty, questionCount }) => {
  try {
    if (mode === 'aptitude') {
      return buildAptitudeMCQs({ topic, difficulty, questionCount });
    }

    // For coding mode, use the specialized topic-specific generator
    if (mode === 'coding') {
      const topicResult = await geminiService.generateTopicCodingQuestion({
        topic,
        difficulty,
        count: questionCount
      });

      if (topicResult && Array.isArray(topicResult.questions) && topicResult.questions.length > 0) {
        return topicResult.questions.map((q, idx) => ({
          ...q,
          type: 'coding',
          questionIndex: idx,
          topic: q.topic || topic,
          difficulty: q.difficulty || difficulty,
          isCoding: true,
          // Ensure test cases have the right structure for execution
          testCases: Array.isArray(q.testCases)
            ? q.testCases.map((tc) => {
                const expected = tc.expected ?? tc.output ?? tc.expected_output ?? tc.expectedOutput ?? '';
                return {
                  input: tc.input,
                  expected: expected,
                  output: expected,
                  expected_output: expected,
                  expectedOutput: expected,
                  isHidden: tc.isHidden || false,
                  description: tc.description || (tc.isHidden ? 'Hidden test case' : 'Visible test case')
                };
              })
            : (Array.isArray(q.test_cases) 
               ? q.test_cases.map(tc => {
                  const expected = tc.output ?? tc.expected ?? '';
                  return {
                    input: tc.input,
                    expected: expected,
                    output: expected,
                    expected_output: expected,
                    isHidden: tc.isHidden || false
                  };
               })
               : defaultTestCases),
          examples: Array.isArray(q.examples)
            ? q.examples.map(ex => {
                const out = ex.output ?? ex.expected ?? '';
                return {
                  input: ex.input,
                  output: out,
                  expected: out,
                  explanation: ex.explanation || ''
                };
              })
            : (Array.isArray(q.testCases) ? q.testCases.slice(0, 2).map(tc => ({
                input: tc.input,
                output: tc.expected ?? tc.output ?? '',
                explanation: tc.description || ''
              })) : [])
        }));
      }
    }

    // Fallback to general question generation for non-coding or if topic-specific fails
    const generated = await geminiService.generateInterviewQuestionsWithMetadata({
      structuredData: {
        skills: [topic],
        technologies: [],
        experienceYears: 0,
        primaryDomain: mode
      },
      rawText: `Practice mode: ${mode}. Topic: ${topic}.`,
      focusTopics: [topic],
      questionCount,
      interviewType: mode === 'coding' ? 'coding' : 'theoretical'
    });

    const questions = Array.isArray(generated?.questions) ? generated.questions : [];
    const modeFiltered = mode === 'coding'
      ? questions.filter((q) => q.isCoding)
      : questions.filter((q) => !q.isCoding);

    const selected = (modeFiltered.length > 0 ? modeFiltered : questions).slice(0, questionCount);

    if (selected.length > 0) {
      return selected.map((q, idx) => ({
        ...q,
        type: mode === 'coding' ? 'coding' : 'theoretical',
        questionIndex: idx,
        topic: q.topic || topic,
        difficulty: q.difficulty || difficulty,
        isCoding: mode === 'coding',
        testCases: mode === 'coding' && (!Array.isArray(q.testCases) || q.testCases.length === 0)
          ? defaultTestCases
          : (q.testCases || [])
      }));
    }
  } catch (error) {
    logger.warn('Practice question generation fallback triggered', { mode, topic, error: error.message });
  }

  const templates = FALLBACK_QUESTIONS[mode] || FALLBACK_QUESTIONS.technical;
  return Array.from({ length: questionCount }).map((_, idx) => ({
    type: mode === 'coding' ? 'coding' : 'theoretical',
    question: templates[idx % templates.length],
    difficulty,
    topic,
    domain: mode,
    timeLimit: 90,
    isCoding: mode === 'coding',
    testCases: mode === 'coding' ? defaultTestCases : [],
    questionIndex: idx
  }));
};

/**
 * Practice Controller
 * Handles practice sessions for different modes
 */

exports.startPracticeSession = asyncHandler(async (req, res, next) => {
  const { mode, topic, difficulty = 'medium', questionCount = 5 } = req.body;

  if (!['aptitude', 'coding', 'technical', 'behavioral'].includes(mode)) {
    return next(new AppError('Invalid practice mode', 400));
  }

  // Create practice session
  const session = await PracticeSession.create({
    userId: req.user.id,
    mode,
    topic,
    difficulty,
    totalQuestions: questionCount,
    status: 'in-progress',
  });

  // Generate practice questions using existing Gemini flow with safe fallback
  const questions = await buildPracticeQuestions({ mode, topic, difficulty, questionCount });

  session.questions = questions;
  await session.save();

  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      mode: session.mode,
      topic: session.topic,
      difficulty: session.difficulty,
      totalQuestions: session.totalQuestions,
      questions: questions,
    },
  });
});

exports.submitPracticeAnswer = asyncHandler(async (req, res, next) => {
  const { sessionId, questionIndex, response, language, timeTaken } = req.body;

  const session = await PracticeSession.findById(sessionId);
  if (!session) {
    return next(new AppError('Practice session not found', 404));
  }

  if (session.userId.toString() !== req.user.id) {
    return next(new AppError('Unauthorized', 403));
  }

  const question = session.questions[questionIndex];
  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  const existingIndex = session.answers.findIndex((ans) => ans.questionIndex === questionIndex);
  if (existingIndex !== -1) {
    return next(new AppError('Answer for this question already submitted', 400));
  }

  let executionResult = null;
  if (session.mode === 'coding' && question.isCoding) {
    executionResult = await CodeExecutionSimulator.execute(response, language || 'javascript', question.testCases);
  }

  const complexity = session.mode === 'coding'
    ? CodeExecutionSimulator.analyzeComplexity(response || '')
    : null;

  // Add answer to session
  const answer = {
    questionIndex,
    question: question.question,
    response,
    isCodingAnswer: session.mode === 'coding',
    language: language || 'text',
    score: 0,
    aiEvaluation: { pending: true },
    executionResult,
    feedback: 'Pending final evaluation after all answers are submitted.',
    timeTaken: timeTaken || 0,
    submittedAt: new Date(),
  };

  session.answers.push(answer);
  session.questionsAttempted = session.answers.length;

  // Keep score pending until session completion
  session.averageScore = 0;

  await session.save();

  res.json({
    success: true,
    data: {
      score: 0,
      feedback: 'Answer recorded. Evaluation will run after all questions are submitted.',
      execution: executionResult,
      complexity,
      averageScore: session.averageScore,
      questionsAttempted: session.questionsAttempted,
      totalQuestions: session.totalQuestions,
    },
  });
});

exports.completePracticeSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.body;

  const session = await PracticeSession.findById(sessionId);
  if (!session) {
    return next(new AppError('Practice session not found', 404));
  }

  if (session.userId.toString() !== req.user.id) {
    return next(new AppError('Unauthorized', 403));
  }

  if (session.answers.length < session.totalQuestions) {
    return res.status(400).json({
      success: false,
      error: 'Evaluation requires all answers'
    });
  }

  const mistakes = [];
  const perQuestionScore = [];

  for (const answer of session.answers) {
    const q = session.questions[answer.questionIndex] || {};

    if (session.mode === 'aptitude' || q.type === 'mcq') {
      const isCorrect = String(answer.response || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
      const score = isCorrect ? 10 : 0;
      answer.score = score;
      answer.aiEvaluation = {
        pending: false,
        score,
        strengths: isCorrect ? ['Correct option selected.'] : [],
        weaknesses: isCorrect ? [] : ['Incorrect option selected.'],
        improvements: isCorrect ? [] : ['Review the concept and elimination strategy for similar MCQs.'],
        issue: isCorrect ? 'No issue.' : 'Wrong option selected.',
        correctConcept: q.explanation || 'Use the underlying formula/logic carefully.',
      };

      perQuestionScore.push({ questionId: answer.questionIndex + 1, score, feedback: answer.aiEvaluation.correctConcept });
      if (!isCorrect) {
        mistakes.push({
          question: answer.question,
          userAnswer: answer.response,
          issue: 'Incorrect MCQ answer.',
          correctConcept: q.explanation || 'Revisit the core reasoning for this aptitude pattern.',
          improvement: 'Solve 3 similar MCQs and verify each elimination step.',
        });
      }
      continue;
    }

    if (session.mode === 'coding' || answer.isCodingAnswer) {
      const evaluation = await geminiService.evaluateCodeSubmission(answer.question, answer.response, answer.language || 'javascript');
      const score = Number(evaluation?.finalCodingScore || evaluation?.logicScore || 0);
      answer.score = score;
      answer.aiEvaluation = { ...evaluation, pending: false };
      perQuestionScore.push({
        questionId: answer.questionIndex + 1,
        score,
        feedback: Array.isArray(evaluation?.improvementSuggestions) && evaluation.improvementSuggestions.length > 0
          ? evaluation.improvementSuggestions[0]
          : 'Improve code readability, edge-case handling, and complexity analysis.',
      });
      mistakes.push({
        question: answer.question,
        userAnswer: answer.response,
        issue: 'Coding response needs optimization or stronger edge-case handling.',
        correctConcept: `Expected complexity considerations: ${evaluation?.timeComplexity || 'N/A'} time, ${evaluation?.spaceComplexity || 'N/A'} space.`,
        improvement: Array.isArray(evaluation?.improvementSuggestions) && evaluation.improvementSuggestions.length > 0
          ? evaluation.improvementSuggestions.join(' ')
          : 'Add boundary checks and simplify control flow.',
      });
      continue;
    }

    const evaluation = await geminiService.evaluateAnswer(answer.question, answer.response);
    const score = Number(evaluation?.score || 0);
    answer.score = score;
    answer.aiEvaluation = { ...evaluation, pending: false };
    perQuestionScore.push({
      questionId: answer.questionIndex + 1,
      score,
      feedback: Array.isArray(evaluation?.improvements) && evaluation.improvements.length > 0
        ? evaluation.improvements[0]
        : 'Add technical depth and clearer structure.',
    });
    mistakes.push({
      question: answer.question,
      userAnswer: answer.response,
      issue: evaluation?.issue || (Array.isArray(evaluation?.weaknesses) ? evaluation.weaknesses[0] : 'Conceptual gap found.'),
      correctConcept: evaluation?.correctConcept || 'Answer should include concept, rationale, and practical example.',
      improvement: Array.isArray(evaluation?.improvements) && evaluation.improvements.length > 0
        ? evaluation.improvements.join(' ')
        : 'Use structured steps and include a relevant use case.',
    });
  }

  const totalScore = session.answers.reduce((sum, ans) => sum + Number(ans.score || 0), 0);
  session.averageScore = session.answers.length > 0 ? totalScore / session.answers.length : 0;

  session.status = 'completed';
  session.completedAt = new Date();

  // Calculate time spent
  if (session.answers.length > 0) {
    const firstAnswer = session.answers[0];
    const lastAnswer = session.answers[session.answers.length - 1];
    session.timeSpent = Math.round((new Date(lastAnswer.submittedAt) - new Date(firstAnswer.submittedAt)) / 1000);
  }

  // Identify skills improved
  session.skillsImproved = [session.topic];
  session.evaluationSummary = {
    score: session.averageScore,
    summary: session.averageScore >= 7
      ? 'Strong practice performance. Continue with harder sets.'
      : 'Good start. Focus on identified weak concepts before the next round.',
    strengths: session.answers
      .flatMap((ans) => ans.aiEvaluation?.strengths || [])
      .slice(0, 5),
    weaknesses: session.answers
      .flatMap((ans) => ans.aiEvaluation?.weaknesses || [])
      .slice(0, 5),
    mistakes,
    perQuestionScore,
  };

  await session.save();

  res.json({
    success: true,
    data: {
      sessionId: session._id,
      status: session.status,
      score: session.averageScore,
      totalQuestions: session.totalQuestions,
      questionsAttempted: session.questionsAttempted,
      timeSpent: session.timeSpent,
      skillsImproved: session.skillsImproved,
      evaluationSummary: session.evaluationSummary,
    },
  });
});

exports.getPracticeSessionDetails = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await PracticeSession.findById(sessionId);
  if (!session) {
    return next(new AppError('Practice session not found', 404));
  }

  if (session.userId.toString() !== req.user.id) {
    return next(new AppError('Unauthorized', 403));
  }

  const sessionObj = session.toObject();
  
  // Dynamically normalize questions to ensure redundant field mapping
  if (Array.isArray(sessionObj.questions)) {
    sessionObj.questions = sessionObj.questions.map(q => {
      if (q.isCoding || q.type === 'coding') {
        const testCases = (Array.isArray(q.testCases) ? q.testCases : (Array.isArray(q.test_cases) ? q.test_cases : [])).map(tc => {
          const expected = tc.expected ?? tc.output ?? tc.expected_output ?? tc.expectedOutput ?? '';
          return {
            ...tc,
            expected,
            output: expected,
            expected_output: expected,
            expectedOutput: expected
          };
        });

        const examples = (Array.isArray(q.examples) ? q.examples : (testCases.length > 0 ? testCases.slice(0, 2) : [])).map(ex => {
          const out = ex.output ?? ex.expected ?? ex.expected_output ?? '';
          return {
            ...ex,
            output: out,
            expected: out,
            expected_output: out
          };
        });

        return { ...q, testCases, examples };
      }
      return q;
    });
  }

  res.json({
    success: true,
    data: sessionObj,
  });
});

exports.getPracticeSessions = asyncHandler(async (req, res, next) => {
  const { mode, topic, limit = 10, page = 1 } = req.query;

  let query = { userId: req.user.id };
  if (mode) query.mode = mode;
  if (topic) query.topic = new RegExp(topic, 'i');

  const sessions = await PracticeSession.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await PracticeSession.countDocuments(query);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

exports.getPracticeStats = asyncHandler(async (req, res, next) => {
  const { mode, topic } = req.query;

  let query = { userId: req.user.id, status: 'completed' };
  if (mode) query.mode = mode;
  if (topic) query.topic = new RegExp(topic, 'i');

  const sessions = await PracticeSession.find(query);

  const stats = {
    totalSessions: sessions.length,
    averageScore: 0,
    sessionsByMode: {},
    sessionsByTopic: {},
    bestPerformance: 0,
    worstPerformance: 0,
  };

  if (sessions.length === 0) {
    return res.json({
      success: true,
      data: stats,
    });
  }

  let totalScore = 0;
  const scores = [];

  sessions.forEach((session) => {
    totalScore += session.averageScore;
    scores.push(session.averageScore);

    // Group by mode
    if (!stats.sessionsByMode[session.mode]) {
      stats.sessionsByMode[session.mode] = { count: 0, avgScore: 0 };
    }
    stats.sessionsByMode[session.mode].count += 1;

    // Group by topic
    if (!stats.sessionsByTopic[session.topic]) {
      stats.sessionsByTopic[session.topic] = { count: 0, avgScore: 0 };
    }
    stats.sessionsByTopic[session.topic].count += 1;
  });

  stats.averageScore = totalScore / sessions.length;
  stats.bestPerformance = Math.max(...scores);
  stats.worstPerformance = Math.min(...scores);

  // Calculate averages by mode and topic
  Object.keys(stats.sessionsByMode).forEach((mode) => {
    const modeSessions = sessions.filter((s) => s.mode === mode);
    stats.sessionsByMode[mode].avgScore =
      modeSessions.reduce((sum, s) => sum + s.averageScore, 0) / modeSessions.length;
  });

  Object.keys(stats.sessionsByTopic).forEach((topic) => {
    const topicSessions = sessions.filter((s) => s.topic === topic);
    stats.sessionsByTopic[topic].avgScore =
      topicSessions.reduce((sum, s) => sum + s.averageScore, 0) / topicSessions.length;
  });

  res.json({
    success: true,
    data: stats,
  });
});

module.exports = exports;
