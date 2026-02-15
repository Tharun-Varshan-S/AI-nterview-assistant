const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { generatePlaceholderQuestions } = require('../services/questionService');
const { evaluateAnswerWithGemini } = require('../services/geminiService');

// @route   POST /api/interview/create
// @desc    Create a new interview session
// @access  Private (Candidate only)
exports.createInterview = async (req, res, next) => {
  try {
    // Generate placeholder questions
    const questions = generatePlaceholderQuestions();

    // Create interview
    const interview = await Interview.create({
      userId: req.user.id,
      questions,
      status: 'in-progress',
    });

    res.status(201).json({
      success: true,
      message: 'Interview session created',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/interview/:id
// @desc    Get interview details
// @access  Private
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user has access
    if (interview.userId.toString() !== req.user.id && req.user.role === 'candidate') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/interview/:id/submit-answer
// @desc    Submit answer to a question
// @access  Private (Candidate only)
exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionId, response } = req.body;

    if (!questionId || !response) {
      return res.status(400).json({ success: false, message: 'Please provide questionId and response' });
    }

    // Get interview
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user has access
    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find the question
    const question = interview.questions.find((q) => q.id === questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Get candidate's resume
    const resume = await Resume.findOne({ userId: req.user.id });

    // Evaluate answer with Gemini
    let aiEvaluation = null;
    try {
      aiEvaluation = await evaluateAnswerWithGemini(question.question, response, resume?.extractedText || '');
    } catch (error) {
      console.error('Gemini evaluation failed:', error);
      // Continue without evaluation - allow fallback
      aiEvaluation = {
        overallScore: 0,
        technicalAccuracy: 0,
        clarity: 0,
        depth: 0,
        strengths: [],
        weaknesses: [],
        improvementSuggestions: [],
      };
    }

    // Add answer to interview
    const answer = {
      questionId,
      question: question.question,
      response,
      aiEvaluation,
      evaluatedAt: new Date(),
    };

    interview.answers.push(answer);

    // Recalculate scores
    const validScores = interview.answers
      .filter((a) => a.aiEvaluation && a.aiEvaluation.overallScore)
      .map((a) => a.aiEvaluation.overallScore);

    if (validScores.length > 0) {
      interview.totalScore = validScores.reduce((a, b) => a + b, 0);
      interview.averageScore = interview.totalScore / validScores.length;
    }

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      answer,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/interview/:id/complete
// @desc    Mark interview as completed
// @access  Private (Candidate only)
exports.completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user has access
    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    interview.status = 'completed';
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview completed',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/interview
// @desc    Get candidate's interviews
// @access  Private (Candidate only)
exports.getCandidateInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id });

    res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/recruiter/interviews
// @desc    Get all completed interviews
// @access  Private (Recruiter only)
exports.getAllCompletedInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ status: 'completed' }).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/recruiter/interview/:id
// @desc    Get interview with candidate details
// @access  Private (Recruiter only)
exports.getInterviewWithDetails = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('userId', 'name email');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Get candidate's resume
    const resume = await Resume.findOne({ userId: interview.userId._id });

    res.status(200).json({
      success: true,
      interview,
      resume,
    });
  } catch (error) {
    next(error);
  }
};
