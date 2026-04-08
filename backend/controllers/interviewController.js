const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');
const AdaptiveEngine = require('../engines/adaptiveEngine');
const SkillScoringEngine = require('../engines/skillScoringEngine');
const CodingEvaluationEngine = require('../engines/codingEvaluationEngine');
const CodeExecutionEngine = require('../engines/codeExecutionEngine');
const CodeExecutionSimulator = require('../services/codeExecutionSimulator');
const ResumeConsistencyEngine = require('../engines/resumeConsistencyEngine');
const SkillTrajectoryEngine = require('../engines/skillTrajectoryEngine');
const EvaluationReliabilityEngine = require('../engines/evaluationReliabilityEngine');
const logger = require('../utils/logger');

const ensureInterviewAccess = (interview, user) => {
  if (!interview) return { ok: false, status: 404, message: 'Interview not found' };
  if (user.role === 'recruiter') return { ok: true };
  if (interview.userId.toString() !== user.id) {
    return { ok: false, status: 403, message: 'Unauthorized' };
  }
  return { ok: true };
};

const deriveAdaptiveReason = (previousDifficulty, newDifficulty, score) => {
  if (previousDifficulty === newDifficulty) return `Difficulty retained due to stable score (${score.toFixed(1)})`;
  if (score > 8) return 'High performance';
  if (score < 4) return 'Low performance';
  return 'Adaptive rebalance based on latest response';
};

const calculateBehaviorMetrics = (answers = []) => {
  if (!answers.length) {
    return {
      averageResponseTime: 0,
      averageEditCount: 0,
      timeoutCount: 0,
      fastResponseFlag: false
    };
  }

  const totalResponseTime = answers.reduce((sum, ans) => sum + Number(ans.interactionMetrics?.timeSpentSec || 0), 0);
  const totalEdits = answers.reduce((sum, ans) => sum + Number(ans.interactionMetrics?.editCount || 0), 0);
  const timeoutCount = answers.filter((ans) => ans.interactionMetrics?.autoSubmitted).length;
  const avgResponse = totalResponseTime / answers.length;

  return {
    averageResponseTime: Number(avgResponse.toFixed(1)),
    averageEditCount: Number((totalEdits / answers.length).toFixed(1)),
    timeoutCount,
    fastResponseFlag: avgResponse > 0 && avgResponse < 20
  };
};

const getProvisionalScore = ({ response = '', isCodingAnswer = false, executionResult = null }) => {
  if (isCodingAnswer && executionResult) {
    return Number(executionResult.executionScore || 5);
  }

  const length = String(response || '').trim().length;
  if (length === 0) return 2;
  if (length < 40) return 4;
  if (length < 120) return 6;
  if (length < 260) return 7;
  return 8;
};

const buildPendingEvaluation = (isCodingAnswer) => {
  if (isCodingAnswer) {
    return {
      pending: true,
      logicScore: 0,
      readabilityScore: 0,
      edgeCaseHandling: 'Pending final evaluation',
      timeComplexity: 'Pending final evaluation',
      spaceComplexity: 'Pending final evaluation',
      improvementSuggestions: ['Submit all answers to unlock full coding evaluation'],
      finalCodingScore: 0,
      promptVersion: 'deferred.v1'
    };
  }

  return {
    pending: true,
    score: 0,
    technicalAccuracy: 'Pending final evaluation',
    clarity: 'Pending final evaluation',
    depth: 'Pending final evaluation',
    strengths: [],
    weaknesses: [],
    improvements: ['Submit all answers to unlock full evaluation'],
    issue: 'Final evaluation is triggered only after all questions are answered.',
    correctConcept: 'Complete the interview to receive concept-wise corrections.',
    promptVersion: 'deferred.v1'
  };
};

const evaluateAllAnswersAfterCompletion = async (interview) => {
  const mistakes = [];
  const perQuestionScore = [];

  for (const answer of interview.answers) {
    const questionMeta = interview.questions?.[answer.questionIndex] || {};
    let evaluated;

    if (answer.isCodingAnswer) {
      evaluated = await geminiService.evaluateCodeSubmission(
        answer.question,
        answer.response,
        answer.language || 'javascript'
      );

      const finalCodingScore = Number(
        evaluated?.finalCodingScore ||
        CodingEvaluationEngine.calculateOverallCodingScore(
          evaluated?.logicScore || 5,
          evaluated?.readabilityScore || 5,
          CodingEvaluationEngine.scoreEdgeCaseHandling(evaluated?.edgeCaseHandling || 'Partially handled')
        )
      );

      evaluated = {
        ...evaluated,
        finalCodingScore,
        pending: false,
      };

      const feedback = Array.isArray(evaluated?.improvementSuggestions)
        ? evaluated.improvementSuggestions.join(' ')
        : (evaluated?.edgeCaseHandling || 'Improve edge-case handling and complexity analysis.');

      perQuestionScore.push({
        questionId: Number(answer.questionIndex) + 1,
        score: finalCodingScore,
        feedback,
      });

      mistakes.push({
        question: answer.question,
        userAnswer: answer.response,
        issue: 'Code quality gaps detected by evaluator.',
        correctConcept: `Target complexity: ${evaluated?.timeComplexity || 'N/A'} time, ${evaluated?.spaceComplexity || 'N/A'} space.`,
        improvement: feedback,
      });
    } else {
      evaluated = await geminiService.evaluateAnswer(answer.question, answer.response);
      evaluated = { ...evaluated, pending: false };

      const score = Number(evaluated?.score || 0);
      const feedback = Array.isArray(evaluated?.improvements) && evaluated.improvements.length > 0
        ? evaluated.improvements[0]
        : 'Provide clearer explanation with concrete technical examples.';

      perQuestionScore.push({
        questionId: Number(answer.questionIndex) + 1,
        score,
        feedback,
      });

      mistakes.push({
        question: answer.question,
        userAnswer: answer.response,
        issue: evaluated?.issue || (Array.isArray(evaluated?.weaknesses) ? evaluated.weaknesses[0] : 'Conceptual gap identified.'),
        correctConcept: evaluated?.correctConcept || 'Review core concept and provide structured reasoning with examples.',
        improvement: feedback,
      });
    }

    answer.aiEvaluation = evaluated;
    answer.promptVersion = evaluated?.promptVersion || answer.promptVersion;
    answer.evaluationTimestamp = new Date();
  }

  return { mistakes, perQuestionScore };
};

const enforceInterviewTypeComposition = ({ questions = [], interviewType = 'theoretical' }) => {
  const normalizedQuestions = Array.isArray(questions) ? questions : [];

  const coding = normalizedQuestions.filter((q) => q?.isCoding || q?.type === 'coding');
  const theory = normalizedQuestions.filter((q) => !(q?.isCoding || q?.type === 'coding'));

  if (interviewType === 'coding') {
    const safe = coding.length > 0 ? coding : normalizedQuestions;
    return safe.map((q) => ({
      ...q,
      type: 'coding',
      isCoding: true
    }));
  }

  if (interviewType === 'theoretical') {
    const safe = theory.length > 0 ? theory : normalizedQuestions;
    return safe.map((q) => ({
      ...q,
      type: 'theoretical',
      isCoding: false,
      testCases: [],
      template: '',
      inputFormat: '',
      outputFormat: '',
      constraints: [],
      examples: []
    }));
  }

  const targetCodingCount = Math.max(1, Math.round(normalizedQuestions.length / 2));
  const mixed = [...coding.slice(0, targetCodingCount), ...theory.slice(0, normalizedQuestions.length - targetCodingCount)];
  const fallback = mixed.length === normalizedQuestions.length ? mixed : normalizedQuestions;
  return fallback.map((q) => ({
    ...q,
    type: q?.isCoding || q?.type === 'coding' ? 'coding' : 'theoretical',
    isCoding: Boolean(q?.isCoding || q?.type === 'coding')
  }));
};

exports.createInterview = async (req, res, next) => {
  try {
    const { 
      interviewType = 'theoretical', 
      focusTopics = [],
      focus = 'random',
      questionCount = 6
    } = req.body;

    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(400).json({ success: false, message: 'Please upload a resume first' });
    }

    const previousInterviews = await Interview.find({ userId: req.user.id, status: 'completed' });

    const skillPerformanceMap = new Map();
    previousInterviews.forEach((prev) => {
      if (prev.skillPerformance) {
        prev.skillPerformance.forEach((value, key) => {
          skillPerformanceMap.set(key, value);
        });
      }
    });

    // Determine topics based on focus parameter
    let topicsToFocus = focusTopics;
    if (focus === 'weak skills' && previousInterviews.length > 0) {
      topicsToFocus = AdaptiveEngine.recommendNextTopics(skillPerformanceMap, previousInterviews, Math.ceil(questionCount / 2));
    } else if (focus === 'random') {
      topicsToFocus = [];
    }
    
    const weakTopics = previousInterviews.length > 0
      ? AdaptiveEngine.recommendNextTopics(skillPerformanceMap, previousInterviews, 3)
      : [];

    const questionsResult = await geminiService.generateInterviewQuestionsWithMetadata({
      structuredData: resume.structuredData,
      rawText: resume.extractedText,
      focusTopics: topicsToFocus.length > 0 ? topicsToFocus : weakTopics,
      questionCount: Math.min(questionCount, 10),
      interviewType
    });

    if (!questionsResult?.questions || questionsResult.questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI temporarily unavailable. Please retry later.'
      });
    }

    const filteredQuestions = enforceInterviewTypeComposition({
      questions: questionsResult.questions,
      interviewType
    });

    const skillPerformance = new Map();
    filteredQuestions.forEach((q) => {
      if (!skillPerformance.has(q.topic)) {
        skillPerformance.set(q.topic, {
          topicName: q.topic,
          score: 0,
          timestamps: []
        });
      }
    });

    const interview = await Interview.create({
      userId: req.user.id,
      resumeId: resume._id,
      interviewType,
      questions: filteredQuestions,
      questionsAsked: [],
      currentDifficulty: 'medium',
      skillPerformance,
      adaptiveHistory: [],
      sessionMetrics: {
        averageResponseTime: 0,
        averageEditCount: 0,
        timeoutCount: 0,
        fastResponseFlag: false
      },
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

exports.submitAnswer = async (req, res, next) => {
  try {
    const {
      questionIndex,
      question,
      response,
      isCodingAnswer = false,
      language = null,
      interactionMetrics = {}
    } = req.body;

    const interview = await Interview.findById(req.params.id);
    const access = ensureInterviewAccess(interview, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const evaluation = buildPendingEvaluation(Boolean(isCodingAnswer));
    let executionResult = null;

    const questionMetadata = interview.questions[questionIndex] || {};

    if (isCodingAnswer && language) {
      const providedCases = Array.isArray(questionMetadata.testCases) ? questionMetadata.testCases : [];
      const generatedCases = providedCases.length === 0
        ? await geminiService.generateExecutionTestCases(question, language)
        : [];
      const testCases = providedCases.length > 0 ? providedCases : generatedCases;

      executionResult = await CodeExecutionEngine.executeCodeSubmission({
        question,
        code: response,
        language,
        testCases,
        geminiService
      });

    }

    const priorSameQuestionScores = (interview.answers || [])
      .filter((a) => a.questionIndex === questionIndex)
      .map((a) => Number(a.aiEvaluation?.score || a.aiEvaluation?.finalCodingScore || 0));

    const currentScore = getProvisionalScore({ response, isCodingAnswer, executionResult });

    const reliability = EvaluationReliabilityEngine.calculateEvaluationReliability({
      response,
      attemptScores: [...priorSameQuestionScores, currentScore]
    });

    const previousDifficulty = interview.currentDifficulty || questionMetadata.difficulty || 'medium';
    const newDifficulty = AdaptiveEngine.getNextDifficulty(previousDifficulty, currentScore);

    const answer = {
      questionIndex,
      question,
      response,
      isCodingAnswer,
      language: isCodingAnswer ? language : null,
      promptVersion: evaluation?.promptVersion || null,
      responseLength: reliability.responseLength,
      aiConfidenceScore: reliability.aiConfidenceScore,
      evaluationReliability: reliability.evaluationReliability,
      evaluationTimestamp: new Date(),
      executionResult,
      interactionMetrics: {
        timeSpentSec: Number(interactionMetrics.timeSpentSec || 0),
        typingDurationMs: Number(interactionMetrics.typingDurationMs || 0),
        editCount: Number(interactionMetrics.editCount || 0),
        autoSubmitted: Boolean(interactionMetrics.autoSubmitted)
      },
      aiEvaluation: {
        ...evaluation,
        score: Number(currentScore || 0),
        finalCodingScore: isCodingAnswer ? Number(currentScore || 0) : evaluation.finalCodingScore
      },
      submittedAt: new Date()
    };

    interview.answers.push(answer);
    interview.questionsAsked.push(questionMetadata);

    const topic = questionMetadata.topic || 'General';
    if (!interview.skillPerformance.has(topic)) {
      interview.skillPerformance.set(topic, {
        topicName: topic,
        score: 0,
        timestamps: []
      });
    }

    const topicData = interview.skillPerformance.get(topic);
    const existingCount = topicData.timestamps?.length || 0;
    const updatedScore = existingCount === 0
      ? currentScore
      : ((topicData.score * existingCount) + currentScore) / (existingCount + 1);

    topicData.score = Number(updatedScore.toFixed(2));
    topicData.timestamps.push(new Date());

    interview.currentDifficulty = newDifficulty;
    interview.adaptiveHistory.push({
      questionIndex,
      previousScore: currentScore,
      previousDifficulty,
      newDifficulty,
      reason: deriveAdaptiveReason(previousDifficulty, newDifficulty, currentScore),
      timestamp: new Date()
    });

    interview.sessionMetrics = calculateBehaviorMetrics(interview.answers);

    if (interview.answers.length === interview.questions.length) {
      interview.status = 'completed';

      const { mistakes, perQuestionScore } = await evaluateAllAnswersAfterCompletion(interview);

      const theoreticalAnswers = interview.answers.filter((a) => !a.isCodingAnswer);
      const codingAnswers = interview.answers.filter((a) => a.isCodingAnswer);

      const theoreticalTotal = theoreticalAnswers.reduce((acc, curr) => acc + Number(curr.aiEvaluation?.score || 0), 0);
      interview.theoreticalScore = theoreticalAnswers.length > 0 ? theoreticalTotal / theoreticalAnswers.length : 0;

      const codingTotal = codingAnswers.reduce((acc, curr) => {
        const codingScore = Number(
          curr.aiEvaluation?.finalCodingScore ||
          CodingEvaluationEngine.calculateOverallCodingScore(
            curr.aiEvaluation?.logicScore || 5,
            curr.aiEvaluation?.readabilityScore || 5,
            CodingEvaluationEngine.scoreEdgeCaseHandling(curr.aiEvaluation?.edgeCaseHandling || 'Not evaluated')
          )
        );
        return acc + codingScore;
      }, 0);

      interview.codingScore = codingAnswers.length > 0 ? codingTotal / codingAnswers.length : 0;

      const totalAllAnswers = interview.answers.reduce((acc, curr) => {
        if (curr.isCodingAnswer) {
          return acc + Number(curr.aiEvaluation?.finalCodingScore || 5);
        }
        return acc + Number(curr.aiEvaluation?.score || 5);
      }, 0);

      interview.totalScore = totalAllAnswers;
      interview.averageScore = interview.answers.length > 0 ? totalAllAnswers / interview.answers.length : 0;
      interview.difficultyBreakdown = SkillScoringEngine.calculateDifficultyBreakdown(interview);

      const resume = await Resume.findById(interview.resumeId);
      const resumeConsistency = ResumeConsistencyEngine.calculate(interview, resume);

      const historical = await Interview.find({ userId: req.user.id, status: 'completed' });
      const trajectory = SkillTrajectoryEngine.buildForInterviewHistory([...historical, interview]);

      interview.finalEvaluation = {
        overallScore: interview.averageScore,
        summary: interview.averageScore >= 7
          ? 'Strong performance with good interview readiness.'
          : 'Foundational performance with clear areas to improve.',
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
        mistakes,
        perQuestionScore,
        resumeConsistency,
        skillTrajectory: trajectory,
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
        sessionMetrics: AdaptiveEngine.calculateSessionMetrics(interview),
        adaptiveEvent: interview.adaptiveHistory[interview.adaptiveHistory.length - 1]
      },
      status: interview.status
    });
  } catch (error) {
    logger.error('Answer submission failed', error);
    next(error);
  }
};

exports.runCode = async (req, res, next) => {
  try {
    const { questionIndex, code, language = 'javascript' } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const interview = await Interview.findById(req.params.id);
    const access = ensureInterviewAccess(interview, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const index = Number(questionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= interview.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    const questionMetadata = interview.questions[index] || {};
    const providedCases = Array.isArray(questionMetadata.testCases) ? questionMetadata.testCases : [];
    const generatedCases = providedCases.length === 0
      ? await geminiService.generateExecutionTestCases(questionMetadata.question, language)
      : [];
    const testCases = providedCases.length > 0 ? providedCases : generatedCases;

    const execution = await CodeExecutionSimulator.execute(code, language, testCases);
    const complexity = CodeExecutionSimulator.analyzeComplexity(code);

    res.json({
      success: true,
      data: {
        passed: Boolean(execution.passed),
        results: Array.isArray(execution.results) ? execution.results : [],
        error: execution.error || null,
        output: execution.output || '',
        complexity
      }
    });
  } catch (error) {
    logger.error('Run code failed', error);
    next(error);
  }
};

exports.generateSkillGapReport = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id, status: 'completed' }).sort({ createdAt: -1 });

    if (interviews.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Complete at least 3 interviews to generate a skill gap report.'
      });
    }

    const { strengths, weaknesses } = SkillScoringEngine.identifyStrengthsAndWeaknesses(interviews, 7);
    const aggregated = SkillScoringEngine.aggregateInterviewScores(interviews);

    const skillSummary = {
      strongestSkills: strengths.slice(0, 3).map((s) => s.skill),
      weakestSkills: weaknesses.slice(0, 3).map((w) => w.skill),
      allTopicsAttempted: Array.from(new Set(interviews.flatMap((i) => (i.questionsAsked || []).map((q) => q.topic)))),
      averageScore: aggregated.overallScore,
      interviewCount: interviews.length
    };

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

exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    const access = ensureInterviewAccess(interview, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

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
          difficultyBreakdown,
          adaptiveHistory: interview.adaptiveHistory || [],
          resumeConsistency: interview.finalEvaluation?.resumeConsistency || null,
          skillTrajectory: interview.finalEvaluation?.skillTrajectory || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getConsistency = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    const access = ensureInterviewAccess(interview, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    let consistency = interview.finalEvaluation?.resumeConsistency;
    if (!consistency) {
      const resume = await Resume.findById(interview.resumeId);
      consistency = ResumeConsistencyEngine.calculate(interview, resume);
    }

    res.json({ success: true, data: consistency });
  } catch (error) {
    next(error);
  }
};

exports.getAdaptiveHistory = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    const access = ensureInterviewAccess(interview, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    res.json({ success: true, data: interview.adaptiveHistory || [] });
  } catch (error) {
    next(error);
  }
};

exports.completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    const access = ensureInterviewAccess(interview, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    interview.status = 'completed';
    await interview.save();

    res.json({ success: true, message: 'Interview completed', data: interview });
  } catch (error) {
    next(error);
  }
};
