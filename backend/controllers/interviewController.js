const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');
const AdaptiveEngine = require('../engines/adaptiveEngine');
const SkillScoringEngine = require('../engines/skillScoringEngine');
const CodingEvaluationEngine = require('../engines/codingEvaluationEngine');
const logger = require('../utils/logger');

/**
 * POST /api/interview/create
 * Enhanced: Resume-aware question generation with adaptive difficulty
 */
exports.createInterview = async (req, res, next) => {
  try {
    const { interviewType = 'theoretical', focusTopics = [] } = req.body;

    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(400).json({ success: false, message: 'Please upload a resume first' });
    }

    // Get user's previous interviews to identify weak topics
    const previousInterviews = await Interview.find({
      userId: req.user.id,
      status: 'completed'
    });

    // Build skill performance map from previous interviews
    const skillPerformanceMap = new Map();
    previousInterviews.forEach((prev) => {
      if (prev.skillPerformance) {
        prev.skillPerformance.forEach((value, key) => {
          skillPerformanceMap.set(key, value);
        });
      }
    });

    const weakTopics = previousInterviews.length > 0
      ? AdaptiveEngine.recommendNextTopics(skillPerformanceMap, previousInterviews, 3)
      : [];

    // Generate questions with metadata
    const questionsResult = await geminiService.generateInterviewQuestionsWithMetadata({
      structuredData: resume.structuredData,
      rawText: resume.extractedText,
      focusTopics: focusTopics.length > 0 ? focusTopics : weakTopics
    });

    if (!questionsResult?.questions || questionsResult.questions.length !== 6) {
      return res.status(500).json({
        success: false,
        message: 'AI temporarily unavailable. Please retry later.'
      });
    }

    // Initialize skill performance tracking
    const skillPerformance = new Map();
    questionsResult.questions.forEach((q) => {
      if (!skillPerformance.has(q.topic)) {
        skillPerformance.set(q.topic, {
          topicName: q.topic,
          score: 0,
          timestamps: []
        });
      }
    });

    // Create interview session
    const interview = await Interview.create({
      userId: req.user.id,
      resumeId: resume._id,
      interviewType,
      questions: questionsResult.questions,
      questionsAsked: [],
      currentDifficulty: 'medium',
      skillPerformance,
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
 * Enhanced: With adaptive difficulty and skill tracking
 */
exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionIndex, question, response, isCodingAnswer = false, language = null } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let evaluation;

    // Route to appropriate evaluation based on question type
    if (isCodingAnswer && language) {
      // Code evaluation
      evaluation = await geminiService.evaluateCodeSubmission(question, response, language);
      if (!evaluation) {
        // Fallback evaluation if Gemini fails
        evaluation = {
          logicScore: 5,
          readabilityScore: 5,
          edgeCaseHandling: 'Unable to evaluate - AI service temporarily unavailable',
          timeComplexity: 'Not evaluated',
          spaceComplexity: 'Not evaluated',
          improvementSuggestions: ['Code evaluation pending - please retry later']
        };
        logger.warn('Using fallback evaluation for code submission', { questionIndex, language });
      }
    } else {
      // Theoretical evaluation
      evaluation = await geminiService.evaluateAnswer(question, response);
      if (!evaluation) {
        // Fallback evaluation if Gemini fails
        evaluation = {
          score: 5,
          technicalAccuracy: 'Unable to evaluate - AI service temporarily unavailable',
          clarity: 'Not evaluated',
          depth: 'Not evaluated',
          strengths: ['Response provided'],
          weaknesses: ['Evaluation pending'],
          improvements: ['Please retry later for detailed feedback']
        };
        logger.warn('Using fallback evaluation for answer', { questionIndex });
      }
    }

    // Extract question metadata
    const questionMetadata = interview.questions[questionIndex] || {};

    // Create answer record with submission time
    const answer = {
      questionIndex,
      question,
      response,
      isCodingAnswer,
      language: isCodingAnswer ? language : null,
      aiEvaluation: evaluation,
      submittedAt: new Date()
    };

    interview.answers.push(answer);
    interview.questionsAsked.push(questionMetadata);

    // Update skill performance
    const topic = questionMetadata.topic || 'General';
    if (!interview.skillPerformance.has(topic)) {
      interview.skillPerformance.set(topic, {
        topicName: topic,
        score: 0,
        timestamps: []
      });
    }

    const topicData = interview.skillPerformance.get(topic);
    const currentScore = isCodingAnswer
      ? CodingEvaluationEngine.calculateOverallCodingScore(
        evaluation.logicScore,
        evaluation.readabilityScore,
        CodingEvaluationEngine.scoreEdgeCaseHandling(evaluation.edgeCaseHandling)
      )
      : evaluation.score;

    topicData.score = currentScore;
    topicData.timestamps.push(new Date());

    // Update adaptive difficulty for next question
    interview.currentDifficulty = AdaptiveEngine.getNextDifficulty(
      interview.currentDifficulty,
      currentScore
    );

    // Auto-complete if all answered
    if (interview.answers.length === interview.questions.length) {
      interview.status = 'completed';

      // Calculate final scores
      const theoreticalAnswers = interview.answers.filter((a) => !a.isCodingAnswer);
      const codingAnswers = interview.answers.filter((a) => a.isCodingAnswer);

      const theoreticalTotal = theoreticalAnswers.reduce(
        (acc, curr) => acc + (curr.aiEvaluation?.score || 0),
        0
      );
      interview.theoreticalScore =
        theoreticalAnswers.length > 0 ? theoreticalTotal / theoreticalAnswers.length : 0;

      const codingTotal = codingAnswers.reduce((acc, curr) => {
        const codingScore = curr.aiEvaluation
          ? CodingEvaluationEngine.calculateOverallCodingScore(
            curr.aiEvaluation.logicScore || 5,
            curr.aiEvaluation.readabilityScore || 5,
            CodingEvaluationEngine.scoreEdgeCaseHandling(curr.aiEvaluation.edgeCaseHandling || 'Not evaluated')
          )
          : 5;
        return acc + codingScore;
      }, 0);
      interview.codingScore =
        codingAnswers.length > 0 ? codingTotal / codingAnswers.length : 0;

      const totalAllAnswers = interview.answers.reduce((acc, curr) => {
        // Check the answer's own isCodingAnswer flag, not the outer scope variable
        if (curr.isCodingAnswer && curr.aiEvaluation) {
          const codingScore = CodingEvaluationEngine.calculateOverallCodingScore(
            curr.aiEvaluation.logicScore || 5,
            curr.aiEvaluation.readabilityScore || 5,
            1
          );
          return acc + codingScore;
        } else {
          return acc + (curr.aiEvaluation?.score || 5);
        }
      }, 0);

      interview.totalScore = totalAllAnswers;
      interview.averageScore = interview.answers.length > 0 ? totalAllAnswers / interview.answers.length : 0;

      // Set final evaluation for frontend
      interview.finalEvaluation = {
        overallScore: interview.averageScore,
        strengths: interview.answers
          .filter((a) => a.aiEvaluation?.strengths?.length > 0)
          .slice(0, 3)
          .flatMap((a) => a.aiEvaluation.strengths || [])
          .slice(0, 5),
        weaknesses: interview.answers
          .filter((a) => a.aiEvaluation?.weaknesses?.length > 0)
          .slice(0, 3)
          .flatMap((a) => a.aiEvaluation.weaknesses || [])
          .slice(0, 5),
        recommendations: interview.answers
          .filter((a) => a.aiEvaluation?.improvements?.length > 0)
          .slice(0, 2)
          .flatMap((a) => a.aiEvaluation.improvements || [])
          .slice(0, 5),
        evaluatedAt: new Date()
      };
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        answer,
        interview,
        currentDifficulty: interview.currentDifficulty,
        sessionMetrics: AdaptiveEngine.calculateSessionMetrics(interview)
      },
      status: interview.status
    });

  } catch (error) {
    logger.error('Answer submission failed', error);
    next(error);
  }
};

/**
 * POST /api/interview/:id/skill-gap-report
 * Generate personalized skill gap report after 3+ interviews
 */
exports.generateSkillGapReport = async (req, res, next) => {
  try {
    const interviews = await Interview.find({
      userId: req.user.id,
      status: 'completed'
    }).sort({ createdAt: -1 });

    if (interviews.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Complete at least 3 interviews to generate a skill gap report.'
      });
    }

    // Aggregate skill data
    const { strengths, weaknesses } = SkillScoringEngine.identifyStrengthsAndWeaknesses(
      interviews,
      7
    );

    const aggregated = SkillScoringEngine.aggregateInterviewScores(interviews);

    const skillSummary = {
      strongestSkills: strengths.slice(0, 3).map((s) => s.skill),
      weakestSkills: weaknesses.slice(0, 3).map((w) => w.skill),
      allTopicsAttempted: Array.from(new Set(interviews.flatMap((i) =>
        (i.questionsAsked || []).map((q) => q.topic)
      ))),
      averageScore: aggregated.overallScore,
      interviewCount: interviews.length
    };

    // Generate report from Gemini
    const report = await geminiService.generateSkillGapReport(skillSummary);

    if (!report) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report. Please try again.'
      });
    }

    res.json({
      success: true,
      data: {
        report,
        skillSummary,
        performanceMetrics: aggregated
      }
    });

  } catch (error) {
    logger.error('Skill gap report generation failed', error);
    next(error);
  }
};

/**
 * GET /api/interview/:id
 * Get single interview details
 */
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/user/:userId
 * Get all interviews for a user
 */
exports.getCandidateInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const aggregated = SkillScoringEngine.aggregateInterviewScores(interviews);

    res.json({
      success: true,
      data: {
        interviews,
        aggregatedMetrics: aggregated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview
 * Get all completed interviews (for recruiters)
 */
exports.getAllCompletedInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ status: 'completed' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/:id/details
 * Get interview with full details
 */
exports.getInterviewWithDetails = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('userId', 'name email');
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const resume = await Resume.findOne({ userId: interview.userId._id });
    const skillBreakdown = SkillScoringEngine.calculateSkillBreakdown(interview);
    const difficultyBreakdown = SkillScoringEngine.calculateDifficultyBreakdown(interview);
    const metrics = AdaptiveEngine.calculateSessionMetrics(interview);

    res.json({
      success: true,
      data: {
        interview,
        resume,
        metrics,
        analytics: {
          skillBreakdown,
          difficultyBreakdown
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/interview/:id/complete
 * Mark interview as completed
 */
exports.completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    interview.status = 'completed';
    await interview.save();

    res.json({
      success: true,
      message: 'Interview completed',
      data: interview
    });
  } catch (error) {
    next(error);
  }
};
