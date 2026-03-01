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

const defaultTestCases = [
  { input: [1], expectedOutput: 1, description: 'Basic case' },
  { input: [0], expectedOutput: 0, description: 'Edge case' }
];

const buildPracticeQuestions = async ({ mode, topic, difficulty, questionCount }) => {
  try {
    const generated = await geminiService.generateInterviewQuestionsWithMetadata({
      structuredData: {
        skills: [topic],
        technologies: [],
        experienceYears: 0,
        primaryDomain: mode
      },
      rawText: `Practice mode: ${mode}. Topic: ${topic}.`,
      focusTopics: [topic]
    });

    const questions = Array.isArray(generated?.questions) ? generated.questions : [];
    const modeFiltered = mode === 'coding'
      ? questions.filter((q) => q.isCoding)
      : questions.filter((q) => !q.isCoding);

    const selected = (modeFiltered.length > 0 ? modeFiltered : questions).slice(0, questionCount);

    if (selected.length > 0) {
      return selected.map((q, idx) => ({
        ...q,
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

  let evaluation;
  let executionResult = null;

  // Handle coding practice
  if (session.mode === 'coding' && question.isCoding) {
    // Execute code
    executionResult = await CodeExecutionSimulator.execute(response, language || 'javascript', question.testCases);

    // Get AI evaluation
    evaluation = await geminiService.evaluateCodeSubmission(
      question.question,
      response,
      language || 'javascript'
    );
  } else {
    // Handle other modes
    evaluation = await geminiService.evaluateAnswer(question.question, response);
  }

  const score = Number(evaluation?.finalCodingScore || evaluation?.score || 0);
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
    score,
    aiEvaluation: evaluation,
    executionResult,
    feedback: evaluation.feedback || evaluation.suggestions,
    timeTaken: timeTaken || 0,
    submittedAt: new Date(),
  };

  session.answers.push(answer);
  session.questionsAttempted = session.answers.length;

  // Calculate average score
  const totalScore = session.answers.reduce((sum, ans) => sum + (ans.score || 0), 0);
  session.averageScore = totalScore / session.answers.length;

  await session.save();

  res.json({
    success: true,
    data: {
      score,
      feedback: evaluation.feedback || evaluation.suggestions,
      execution: executionResult,
      complexity,
      averageScore: session.averageScore,
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

  res.json({
    success: true,
    data: session,
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
