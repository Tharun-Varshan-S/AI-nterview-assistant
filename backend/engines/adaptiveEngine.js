const logger = require('../utils/logger');

/**
 * Adaptive Interview Engine
 * 
 * Tracks interview progress and adapts difficulty based on:
 * - Answer scores (> 8 = increase, < 4 = decrease)
 * - Weak skills (targets were not attempted)
 * - Topic diversity (avoids repeating same skill)
 */

class AdaptiveEngine {
  /**
   * Determine next difficulty level based on recent performance
   * 
   * Algorithm:
   * - Score > 8: attempt harder difficulty next
   * - Score 4-8: maintain current difficulty
   * - Score < 4: decrease difficulty
   * - Never go below 'easy' or above 'hard'
   */
  static getNextDifficulty(currentDifficulty, lastAnswerScore) {
    const difficultyHierarchy = ['easy', 'medium', 'hard'];
    const currentIndex = difficultyHierarchy.indexOf(currentDifficulty || 'medium');

    if (lastAnswerScore > 8 && currentIndex < 2) {
      return difficultyHierarchy[currentIndex + 1];
    }

    if (lastAnswerScore < 4 && currentIndex > 0) {
      return difficultyHierarchy[currentIndex - 1];
    }

    return currentDifficulty || 'medium';
  }

  /**
   * Identify weak skills (topics with consistently low scores)
   * Returns topics that should be targeted in future interviews
   */
  static identifyWeakSkills(skillPerformance, threshold = 5) {
    const weakSkills = [];

    for (const [topic, data] of skillPerformance) {
      if (data.score < threshold) {
        weakSkills.push({
          topic,
          score: data.score,
          attemptCount: data.timestamps?.length || 1,
          lastAttempt: data.timestamps?.[data.timestamps.length - 1] || new Date()
        });
      }
    }

    // Sort by score (lowest first) and attempt count (most recent first)
    return weakSkills.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.lastAttempt - a.lastAttempt;
    });
  }

  /**
   * Check if a topic has been recently asked
   * Prevents asking similar questions in quick succession
   */
  static shouldAvoidTopic(questionsAsked, topic, recentWindowQCount = 3) {
    const recentQuestions = questionsAsked.slice(-recentWindowQCount);
    return recentQuestions.some((q) => q.topic === topic);
  }

  /**
   * Calculate progress metrics for interview session
   */
  static calculateSessionMetrics(interview) {
    const answers = interview.answers || [];
    
    if (answers.length === 0) {
      return {
        answeredCount: 0,
        averageScore: 0,
        theoreticalAvg: 0,
        codingAvg: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
        strongTopics: [],
        weakTopics: []
      };
    }

    const theoreticalAnswers = answers.filter((a) => !a.isCodingAnswer);
    const codingAnswers = answers.filter((a) => a.isCodingAnswer);

    const difficultyDistribution = {
      easy: (interview.questionsAsked || []).filter((q) => q.difficulty === 'easy').length,
      medium: (interview.questionsAsked || []).filter((q) => q.difficulty === 'medium').length,
      hard: (interview.questionsAsked || []).filter((q) => q.difficulty === 'hard').length,
    };

    const topicScores = {};
    answers.forEach((answer) => {
      const topic = interview.questionsAsked?.find((q) => q.question === answer.question)?.topic || 'General';
      if (!topicScores[topic]) {
        topicScores[topic] = { scores: [], count: 0 };
      }
      topicScores[topic].scores.push(answer.aiEvaluation?.score || 0);
      topicScores[topic].count += 1;
    });

    const topicAverages = Object.entries(topicScores).map(([topic, data]) => ({
      topic,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      attemptCount: data.count
    }));

    const strongTopics = topicAverages
      .filter((t) => t.avgScore >= 7)
      .sort((a, b) => b.avgScore - a.avgScore);

    const weakTopics = topicAverages
      .filter((t) => t.avgScore < 7)
      .sort((a, b) => a.avgScore - b.avgScore);

    return {
      answeredCount: answers.length,
      averageScore:
        answers.reduce((acc, ans) => acc + (ans.aiEvaluation?.score || 0), 0) / answers.length,
      theoreticalAvg:
        theoreticalAnswers.length > 0
          ? theoreticalAnswers.reduce((acc, ans) => acc + (ans.aiEvaluation?.score || 0), 0) /
            theoreticalAnswers.length
          : 0,
      codingAvg:
        codingAnswers.length > 0
          ? codingAnswers.reduce((acc, ans) => acc + (ans.aiEvaluation?.logicScore || 0), 0) /
            codingAnswers.length
          : 0,
      difficultyDistribution,
      strongTopics,
      weakTopics,
      topicPerformance: topicAverages
    };
  }

  /**
   * Recommend topics for next interview based on weak areas
   */
  static recommendNextTopics(skillPerformance, interviewHistory = [], count = 3) {
    const weakSkills = this.identifyWeakSkills(skillPerformance);
    const recentlyAskedTopics = new Set(
      interviewHistory.slice(-2).flatMap((interview) =>
        (interview.questionsAsked || []).map((q) => q.topic)
      )
    );

    const recommendations = weakSkills
      .filter((skill) => !recentlyAskedTopics.has(skill.topic))
      .slice(0, count);

    return recommendations.map((rec) => rec.topic);
  }

  /**
   * Validate question metadata structure
   */
  static validateQuestionMetadata(question) {
    return (
      question.question &&
      ['easy', 'medium', 'hard'].includes(question.difficulty) &&
      question.topic &&
      question.domain &&
      Number.isFinite(question.timeLimit) &&
      question.timeLimit > 0
    );
  }
}

module.exports = AdaptiveEngine;
