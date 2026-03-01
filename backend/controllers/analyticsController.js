const Interview = require('../models/Interview');
const PracticeSession = require('../models/PracticeSession');
const Resume = require('../models/Resume');
const SkillScoringEngine = require('../engines/skillScoringEngine');
const SkillTrajectoryEngine = require('../engines/skillTrajectoryEngine');
const ResumeConsistencyAnalyzer = require('../services/resumeConsistencyAnalyzer');
const logger = require('../utils/logger');

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Helper Functions
const calculateLearningVelocity = (interviews) => {
  if (interviews.length < 2) return 0;

  const scores = interviews
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((i) => i.averageScore || 0);

  if (scores.length === 0) return 0;

  let velocity = 0;
  for (let i = 1; i < scores.length; i++) {
    velocity += scores[i] - scores[i - 1];
  }

  return velocity / (scores.length - 1);
};

const calculateConsistencyScore = (interviews) => {
  if (interviews.length === 0) return 0;

  const scores = interviews.map((i) => i.averageScore || 0);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  return Math.max(0, 10 - stdDev);
};

const aggregateSkillPerformance = (interviews) => {
  const skillData = {};

  interviews.forEach((interview) => {
    (interview.answers || []).forEach((answer) => {
      const question = (interview.questionsAsked || []).find((q) => q.question === answer.question);
      if (!question || !question.topic) return;

      const topic = question.topic;
      const score = answer.aiEvaluation?.score || answer.score || 0;

      if (!skillData[topic]) {
        skillData[topic] = { scores: [], count: 0, avgScore: 0 };
      }

      skillData[topic].scores.push(score);
      skillData[topic].count += 1;
    });
  });

  Object.keys(skillData).forEach((skill) => {
    const scores = skillData[skill].scores;
    skillData[skill].avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });

  return skillData;
};

const calculateSkillGrowthOverTime = (interviews, practiceSessions) => {
  const allSessions = [
    ...interviews.map((i) => ({ ...i, type: 'interview', date: i.createdAt })),
    ...practiceSessions.map((p) => ({ ...p, type: 'practice', date: p.createdAt })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const cumulativeScores = [];
  let runningSum = 0;
  let count = 0;

  allSessions.forEach((session) => {
    const score = session.averageScore || session.score || 0;
    runningSum += score;
    count += 1;

    cumulativeScores.push({
      date: new Date(session.date).toLocaleDateString(),
      score: Number((runningSum / count).toFixed(2)),
      type: session.type,
    });
  });

  return cumulativeScores;
};

const calculateDifficultyBreakdown = (interviews) => {
  const breakdown = { easy: 0, medium: 0, hard: 0 };

  interviews.forEach((interview) => {
    (interview.questionsAsked || []).forEach((question) => {
      const diff = question.difficulty || 'medium';
      breakdown[diff]++;
    });
  });

  return breakdown;
};

const calculateCodingVsTheory = (interviews) => {
  let codingTotal = 0;
  let codingCount = 0;
  let theoryTotal = 0;
  let theoryCount = 0;

  interviews.forEach((interview) => {
    (interview.answers || []).forEach((answer) => {
      const score = answer.aiEvaluation?.score || answer.score || 0;
      if (answer.isCodingAnswer) {
        codingTotal += score;
        codingCount += 1;
      } else {
        theoryTotal += score;
        theoryCount += 1;
      }
    });
  });

  return {
    coding: {
      average: codingCount > 0 ? Number((codingTotal / codingCount).toFixed(2)) : 0,
      attempts: codingCount,
    },
    theoretical: {
      average: theoryCount > 0 ? Number((theoryTotal / theoryCount).toFixed(2)) : 0,
      attempts: theoryCount,
    },
  };
};

const calculateTrajectorySlope = (interviews) => {
  if (interviews.length < 2) return 0;

  const scores = interviews
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((i) => i.averageScore || 0);

  const n = scores.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
};

const getSkillDetails = (interviews, skillName) => {
  const data = {
    skill: skillName,
    scores: [],
    attempts: 0,
    averageScore: 0,
    improvementTrend: 0,
    lastAttemptScore: 0,
  };

  let scores = [];

  interviews
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((interview) => {
      (interview.answers || []).forEach((answer) => {
        const question = (interview.questionsAsked || []).find((q) => q.question === answer.question);
        if (!question || !question.topic) return;

        if (question.topic.toLowerCase() !== skillName.toLowerCase()) return;

        const score = answer.aiEvaluation?.score || answer.score || 0;
        scores.push({
          score,
          date: new Date(answer.submittedAt).toLocaleDateString(),
          difficulty: question.difficulty,
        });
      });
    });

  if (scores.length > 0) {
    data.scores = scores;
    data.attempts = scores.length;
    data.averageScore = Number((scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(2));
    data.lastAttemptScore = scores[scores.length - 1].score;

    if (scores.length > 1) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b.score, 0) / secondHalf.length;
      data.improvementTrend = Number((secondAvg - firstAvg).toFixed(2));
    }
  }

  return data;
};

const getDifficultyChangeReason = (index, questionsAsked, answers) => {
  if (index === 0) return 'Initial question';

  const prevScore = answers[index - 1]?.aiEvaluation?.score || answers[index - 1]?.score || 0;
  const prevDifficulty = questionsAsked[index - 1]?.difficulty || 'medium';
  const currDifficulty = questionsAsked[index]?.difficulty || 'medium';

  if (prevScore > 8 && currDifficulty > prevDifficulty) {
    return 'Increased due to high performance';
  }
  if (prevScore < 4 && currDifficulty < prevDifficulty) {
    return 'Decreased due to low performance';
  }
  if (prevDifficulty === currDifficulty) {
    return 'Difficulty maintained';
  }

  return 'Adaptive adjustment';
};

// Controllers
exports.getOverviewAnalytics = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const interviews = await Interview.find({ userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .lean();

  const practiceSessions = await PracticeSession.find({ userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .lean();

  let readinessScore = 0;
  let avgInterviewScore = 0;
  let codingAccuracy = 0;
  let theoreticalAccuracy = 0;

  if (interviews.length > 0) {
    const interviewScores = interviews.map((i) => i.averageScore || 0);
    avgInterviewScore = interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length;

    let codingScores = [];
    let theoreticalScores = [];

    interviews.forEach((interview) => {
      (interview.answers || []).forEach((answer) => {
        const score = answer.aiEvaluation?.score || answer.score || 0;
        if (answer.isCodingAnswer) {
          codingScores.push(score);
        } else {
          theoreticalScores.push(score);
        }
      });
    });

    if (codingScores.length > 0) {
      codingAccuracy = codingScores.reduce((a, b) => a + b, 0) / codingScores.length;
    }
    if (theoreticalScores.length > 0) {
      theoreticalAccuracy = theoreticalScores.reduce((a, b) => a + b, 0) / theoreticalScores.length;
    }
  }

  const learningVelocity = calculateLearningVelocity(interviews);
  const consistencyScore = calculateConsistencyScore(interviews);

  readinessScore =
    0.4 * avgInterviewScore + 0.3 * codingAccuracy + 0.2 * consistencyScore + 0.1 * learningVelocity;

  const skillBreakdown = aggregateSkillPerformance(interviews);
  const skillsArray = Object.entries(skillBreakdown).map(([skill, data]) => ({
    skill,
    score: data.avgScore,
  }));

  skillsArray.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    data: {
      readinessScore: Math.round(readinessScore),
      readinessPercentage: Math.min(100, Math.round(readinessScore * 10)),
      strongestSkill: skillsArray.length > 0 ? skillsArray[0].skill : 'N/A',
      weakestSkill: skillsArray.length > 0 ? skillsArray[skillsArray.length - 1].skill : 'N/A',
      totalSessions: interviews.length + practiceSessions.length,
      totalInterviews: interviews.length,
      totalPracticeSessions: practiceSessions.length,
      averageScore: Number(avgInterviewScore.toFixed(2)),
      codingAccuracy: Number(codingAccuracy.toFixed(2)),
      theoreticalAccuracy: Number(theoreticalAccuracy.toFixed(2)),
      learningVelocity: Number(learningVelocity.toFixed(2)),
      consistencyScore: Number(consistencyScore.toFixed(2)),
    },
  });
});

exports.getFullAnalyticsReport = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const interviews = await Interview.find({ userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  const practiceSessions = await PracticeSession.find({ userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  const skillGrowthData = calculateSkillGrowthOverTime(interviews, practiceSessions);
  const difficultyBreakdown = calculateDifficultyBreakdown(interviews);
  const codingVsTheory = calculateCodingVsTheory(interviews);
  const consistencyScore = calculateConsistencyScore(interviews);
  const trajectorySlope = calculateTrajectorySlope(interviews);
  const topicPerformance = aggregateSkillPerformance(interviews);

  res.json({
    success: true,
    data: {
      skillGrowth: skillGrowthData,
      difficultyBreakdown,
      codingVsTheory,
      consistencyScore: Number(consistencyScore.toFixed(2)),
      trajectorySlope: Number(trajectorySlope.toFixed(2)),
      topicPerformance: Object.entries(topicPerformance).map(([topic, data]) => ({
        topic,
        averageScore: Number(data.avgScore.toFixed(2)),
        attempts: data.count,
      })),
      totalInterviews: interviews.length,
      totalPracticeSessions: practiceSessions.length,
    },
  });
});

exports.getSkillAnalytics = asyncHandler(async (req, res, next) => {
  const { skill } = req.query;
  const userId = req.user.id;

  const interviews = await Interview.find({ userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  const skillData = getSkillDetails(interviews, skill);

  res.json({
    success: true,
    data: skillData,
  });
});

exports.getResumeConsistency = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const resume = await Resume.findOne({ userId });
  if (!resume) {
    return next(new AppError('Resume not found', 404));
  }

  const interviews = await Interview.find({ userId, status: 'completed' }).lean();

  const analysis = ResumeConsistencyAnalyzer.analyzeConsistency(resume, interviews);
  const recommendations = ResumeConsistencyAnalyzer.generateRecommendations(analysis);

  res.json({
    success: true,
    data: {
      ...analysis,
      recommendations,
    },
  });
});

exports.getAdaptiveDifficultyTimeline = asyncHandler(async (req, res, next) => {
  const { interviewId } = req.params;
  const userId = req.user.id;

  const interview = await Interview.findById(interviewId).lean();
  if (!interview) {
    return next(new AppError('Interview not found', 404));
  }

  if (interview.userId.toString() !== userId) {
    return next(new AppError('Unauthorized', 403));
  }

  const timeline = (interview.questionsAsked || []).map((question, index) => ({
    questionNumber: index + 1,
    difficulty: question.difficulty,
    score: interview.answers[index]?.aiEvaluation?.score || interview.answers[index]?.score || 0,
    reason: getDifficultyChangeReason(index, interview.questionsAsked, interview.answers),
  }));

  res.json({
    success: true,
    data: timeline,
  });
});

module.exports = exports;
