const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * POST /api/interview/create
 * Resume-aware question generation
 */
exports.createInterview = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(400).json({ success: false, message: 'Please upload a resume first' });
    }

    // Step 1: Generate 6 questions (personalized)
    const result = await geminiService.generateInterviewQuestions({
      structuredData: resume.structuredData,
      rawText: resume.extractedText
    });

    if (!result?.questions || result.questions.length !== 6) {
      return res.status(500).json({
        success: false,
        message: 'AI temporarily unavailable. Please retry later.'
      });
    }

    // Step 2: Create interview session
    const interview = await Interview.create({
      userId: req.user.id,
      resumeId: resume._id,
      questions: result.questions,
      status: 'in-progress'
    });

    res.status(201).json({
      success: true,
      message: 'Interview session created',
      data: interview
    });

  } catch (error) {
    logger.error('Interview creation failed', error);
    next(error);
  }
};

/**
 * POST /api/interview/:id/submit-answer
 * One Gemini call per answer for evaluation
 */
exports.submitAnswer = async (req, res, next) => {
  try {
    const { question, response } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // AI Evaluation
    const evaluation = await geminiService.evaluateAnswer(question, response);

    if (!evaluation) {
      return res.status(500).json({ success: false, message: 'Evaluation failed. Please try again.' });
    }

    const answer = {
      question,
      response,
      aiEvaluation: evaluation
    };

    interview.answers.push(answer);

    // Auto-complete if all answered
    if (interview.answers.length === interview.questions.length) {
      interview.status = 'completed';
      const total = interview.answers.reduce((acc, curr) => acc + (curr.aiEvaluation.score || 0), 0);
      interview.totalScore = total;
      interview.averageScore = total / interview.questions.length;
    }

    await interview.save();

    res.json({ success: true, data: { answer, interview }, status: interview.status });

  } catch (error) {
    logger.error('Answer submission failed', error);
    next(error);
  }
};

exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

exports.getCandidateInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: interviews });
  } catch (error) {
    next(error);
  }
};

exports.getAllCompletedInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ status: 'completed' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: interviews });
  } catch (error) {
    next(error);
  }
};

exports.getInterviewWithDetails = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('userId', 'name email');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    const resume = await Resume.findOne({ userId: interview.userId._id });
    res.json({ success: true, data: { interview, resume } });
  } catch (error) {
    next(error);
  }
};

exports.completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    interview.status = 'completed';
    await interview.save();
    res.json({ success: true, message: 'Interview completed', data: interview });
  } catch (error) {
    next(error);
  }
};
