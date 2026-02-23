/**
 * Skill Analytics and Scoring Engine
 * 
 * Aggregates interview performance across:
 * - Theoretical knowledge
 * - Coding ability
 * - System design
 * - Topic-level mastery
 * - Difficulty progression
 */

class SkillScoringEngine {
  /**
   * Calculate comprehensive skill breakdown from interview
   */
  static calculateSkillBreakdown(interview) {
    const answers = interview.answers || [];

    if (answers.length === 0) {
      return {
        topicScores: {},
        skillLevels: {},
        averageByTopic: {}
      };
    }

    const topicScores = {};
    const skillLevels = {};

    // Group answers by topic
    answers.forEach((answer) => {
      const questionData = (interview.questionsAsked || []).find(
        (q) => q.question === answer.question
      );

      if (!questionData) return;

      const topic = questionData.topic;
      const difficulty = questionData.difficulty;

      if (!topicScores[topic]) {
        topicScores[topic] = [];
      }

      const score = answer.isCodingAnswer
        ? this.calculateCodingScore(answer.aiEvaluation)
        : answer.aiEvaluation?.score || 0;

      topicScores[topic].push({
        score,
        difficulty,
        timestamp: answer.submittedAt || new Date()
      });
    });

    // Calculate averages and skill levels
    const averageByTopic = {};

    Object.entries(topicScores).forEach(([topic, scores]) => {
      const avgScore = scores.reduce((acc, s) => acc + s.score, 0) / scores.length;
      averageByTopic[topic] = avgScore;

      // Classify skill level based on average
      skillLevels[topic] = this.getSkillLevel(avgScore);
    });

    return {
      topicScores,
      skillLevels,
      averageByTopic
    };
  }

  /**
   * Map numerical score to skill level label
   */
  static getSkillLevel(avgScore) {
    if (avgScore >= 8.5) return 'Expert';
    if (avgScore >= 7) return 'Proficient';
    if (avgScore >= 5.5) return 'Intermediate';
    if (avgScore >= 4) return 'Beginner';
    return 'Novice';
  }

  /**
   * Calculate overall coding score from individual evaluation components
   */
  static calculateCodingScore(evaluation) {
    if (!evaluation) return 0;

    const logicScore = evaluation.logicScore || 0;
    const readabilityScore = evaluation.readabilityScore || 0;

    // 70% logic, 30% readability
    return logicScore * 0.7 + readabilityScore * 0.3;
  }

  /**
   * Aggregate scores across multiple interviews
   */
  static aggregateInterviewScores(interviews) {
    if (!interviews || interviews.length === 0) {
      return {
        overallScore: 0,
        theoreticalScore: 0,
        codingScore: 0,
        systemDesignScore: 0,
        improvementTrend: [],
        interviewCount: 0
      };
    }

    const completedInterviews = interviews.filter((i) => i.status === 'completed');

    if (completedInterviews.length === 0) {
      return {
        overallScore: 0,
        theoreticalScore: 0,
        codingScore: 0,
        systemDesignScore: 0,
        improvementTrend: [],
        interviewCount: 0
      };
    }

    const theoreticalScores = [];
    const codingScores = [];
    const overallScores = [];

    completedInterviews.forEach((interview) => {
      if (interview.theoreticalScore > 0) theoreticalScores.push(interview.theoreticalScore);
      if (interview.codingScore > 0) codingScores.push(interview.codingScore);
      overallScores.push(interview.averageScore);
    });

    const calculateAvg = (scores) =>
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const improvementTrend = overallScores.map((score, idx) => ({
      interviewNumber: idx + 1,
      score,
      date: completedInterviews[idx].createdAt
    }));

    return {
      overallScore: calculateAvg(overallScores),
      theoreticalScore: calculateAvg(theoreticalScores),
      codingScore: calculateAvg(codingScores),
      systemDesignScore: 0, // Will be populated when system design interview mode is added
      improvementTrend,
      interviewCount: completedInterviews.length
    };
  }

  /**
   * Calculate difficulty breakdown (track performance by difficulty)
   */
  static calculateDifficultyBreakdown(interview) {
    const answers = interview.answers || [];
    const breakdown = { easy: [], medium: [], hard: [] };

    answers.forEach((answer) => {
      const questionData = (interview.questionsAsked || []).find(
        (q) => q.question === answer.question
      );

      if (!questionData) return;

      const difficulty = questionData.difficulty;
      const score = answer.isCodingAnswer
        ? this.calculateCodingScore(answer.aiEvaluation)
        : answer.aiEvaluation?.score || 0;

      if (breakdown[difficulty]) {
        breakdown[difficulty].push(score);
      }
    });

    // Convert arrays to averages
    const result = {};
    Object.entries(breakdown).forEach(([difficulty, scores]) => {
      result[difficulty] = {
        attempted: scores.length,
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        maxScore: scores.length > 0 ? Math.max(...scores) : 0,
        minScore: scores.length > 0 ? Math.min(...scores) : 0
      };
    });

    return result;
  }

  /**
   * Identify strengths and weaknesses for skill gap report
   */
  static identifyStrengthsAndWeaknesses(interviews, threshold = 7) {
    if (!interviews || interviews.length === 0) {
      return { strengths: [], weaknesses: [] };
    }

    const skillScoreMap = {};

    interviews.forEach((interview) => {
      const breakdown = this.calculateSkillBreakdown(interview);
      Object.entries(breakdown.averageByTopic).forEach(([topic, score]) => {
        if (!skillScoreMap[topic]) {
          skillScoreMap[topic] = [];
        }
        skillScoreMap[topic].push(score);
      });
    });

    const skillAverages = Object.entries(skillScoreMap).map(([skill, scores]) => ({
      skill,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      consistency: this.calculateConsistency(scores)
    }));

    const strengths = skillAverages
      .filter((s) => s.avgScore >= threshold)
      .sort((a, b) => b.avgScore - a.avgScore);

    const weaknesses = skillAverages
      .filter((s) => s.avgScore < threshold)
      .sort((a, b) => a.avgScore - b.avgScore);

    return { strengths, weaknesses };
  }

  /**
   * Calculate consistency of scores (lower = more stable)
   */
  static calculateConsistency(scores) {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance); // Standard deviation
  }

  /**
   * Calculate learning velocity (improvement rate)
   */
  static calculateLearningVelocity(interviews) {
    if (interviews.length < 2) return 0;

    const completed = interviews
      .filter((i) => i.status === 'completed')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (completed.length < 2) return 0;

    const firstScore = completed[0].averageScore || 0;
    const lastScore = completed[completed.length - 1].averageScore || 0;

    // Velocity: improvement per interview
    return (lastScore - firstScore) / (completed.length - 1);
  }
}

module.exports = SkillScoringEngine;
