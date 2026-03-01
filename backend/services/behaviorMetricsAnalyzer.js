const logger = require('../utils/logger');

/**
 * Behavior Metrics Analyzer
 * 
 * Tracks and analyzes user behavior during interviews:
 * - Response time patterns
 * - Edit/revision patterns
 * - Confidence indicators
 * - Time management
 */

class BehaviorMetricsAnalyzer {
  /**
   * Calculate comprehensive behavior metrics for an answer
   * @param {object} answer - Answer submission data
   * @param {object} question - Question metadata
   * @returns {object} Behavior metrics
   */
  static calculateAnswerBehaviorMetrics(answer, question) {
    const metrics = answer.interactionMetrics || {};
    const timeSpent = metrics.timeSpentSec || 0;
    const editCount = metrics.editCount || 0;
    const timeLimit = question?.timeLimit || 300; // Default 5 minutes

    const behaviorMetrics = {
      timeSpent,
      timeLimit,
      timeUtilization: timeSpent > 0 ? Math.min(100, (timeSpent / timeLimit) * 100) : 0,
      editCount,
      editsPerMinute: timeSpent > 0 ? ((editCount / timeSpent) * 60).toFixed(2) : 0,
      revisionIntensity: this.calculateRevisionIntensity(editCount),
      responseType: this.classifyResponse(answer.response, editCount),
      pauseIndicator: this.detectPauses(metrics),
      confidence: this.estimateConfidence(answer, metrics),
      timeManagement: this.analyzeTimeManagement(timeSpent, timeLimit),
    };

    return behaviorMetrics;
  }

  /**
   * Calculate revision intensity (how much the user revised their answer)
   * @param {number} editCount - Number of edits
   * @returns {string} Intensity level
   */
  static calculateRevisionIntensity(editCount) {
    if (editCount === 0) return 'no-revision';
    if (editCount <= 2) return 'minimal';
    if (editCount <= 5) return 'moderate';
    if (editCount <= 10) return 'high';
    return 'very-high';
  }

  /**
   * Classify response type based on content and edits
   * @param {string} response - Answer text
   * @param {number} editCount - Edit count
   * @returns {string} Response classification
   */
  static classifyResponse(response, editCount) {
    const responseLength = response?.length || 0;

    if (responseLength === 0) return 'empty';
    if (responseLength < 50) return 'minimal';
    if (editCount === 0 && responseLength < 200) return 'brief-first-attempt';
    if (editCount === 0) return 'detailed-first-attempt';
    if (editCount <= 2) return 'refined';
    return 'heavily-revised';
  }

  /**
   * Detect if user took pauses during response
   * @param {object} metrics - Interaction metrics
   * @returns {boolean} Whether pauses detected
   */
  static detectPauses(metrics) {
    const typingDuration = metrics.typingDurationMs || 0;
    const totalTime = metrics.timeSpentSec * 1000 || 0;

    if (totalTime === 0) return false;

    const pauseRatio = (totalTime - typingDuration) / totalTime;
    return pauseRatio > 0.3; // More than 30% idle time
  }

  /**
   * Estimate user confidence from behavioral signals
   * @param {object} answer - Answer data
   * @param {object} metrics - Interaction metrics
   * @returns {number} Confidence score (1-10)
   */
  static estimateConfidence(answer, metrics) {
    let confidence = 5; // Base score

    const responseLength = answer.response?.length || 0;
    if (responseLength > 300) confidence += 1;
    if (responseLength > 500) confidence += 1;

    const editCount = metrics.editCount || 0;
    if (editCount === 0) confidence += 1;
    if (editCount > 10) confidence -= 2;

    const autoSubmitted = metrics.autoSubmitted || false;
    if (autoSubmitted) confidence -= 1;

    const score = answer.aiEvaluation?.score || 0;
    if (score > 7) confidence += 1;
    if (score < 4) confidence -= 1;

    return Math.min(10, Math.max(1, confidence));
  }

  /**
   * Analyze time management for the answer
   * @param {number} timeSpent - Time spent in seconds
   * @param {number} timeLimit - Time limit in seconds
   * @returns {object} Time management analysis
   */
  static analyzeTimeManagement(timeSpent, timeLimit) {
    const percentageUsed = (timeSpent / timeLimit) * 100;

    return {
      timeSpent,
      timeLimit,
      percentageUsed: Number(percentageUsed.toFixed(1)),
      classification:
        percentageUsed < 30
          ? 'rushed'
          : percentageUsed < 70
          ? 'optimal'
          : percentageUsed < 95
          ? 'thorough'
          : 'time-exceeded',
    };
  }

  /**
   * Calculate session-level behavior metrics
   * @param {array} answers - All answers in interview
   * @param {array} questionsAsked - Question metadata
   * @returns {object} Session behavior metrics
   */
  static calculateSessionBehaviorMetrics(answers = [], questionsAsked = []) {
    if (answers.length === 0) {
      return {
        totalTimeSpent: 0,
        averageTimePerQuestion: 0,
        consistencyScore: 0,
        engagementLevel: 'none',
        behaviorPattern: 'no-data',
      };
    }

    const totalTimeSpent = answers.reduce((sum, ans) => sum + (ans.interactionMetrics?.timeSpentSec || 0), 0);
    const averageTimePerQuestion = answers.length > 0 ? totalTimeSpent / answers.length : 0;
    const totalEdits = answers.reduce((sum, ans) => sum + (ans.interactionMetrics?.editCount || 0), 0);
    const timeoutCount = answers.filter((ans) => ans.interactionMetrics?.autoSubmitted).length;

    // Consistency score (how consistent is the user's behavior)
    const times = answers.map((ans) => ans.interactionMetrics?.timeSpentSec || 0);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - Math.min(100, (stdDev / avgTime) * 100));

    return {
      totalTimeSpent: Number(totalTimeSpent.toFixed(2)),
      averageTimePerQuestion: Number(averageTimePerQuestion.toFixed(2)),
      totalEdits,
      averageEditsPerQuestion: Number((totalEdits / answers.length).toFixed(2)),
      timeoutCount,
      consistencyScore: Number(consistencyScore.toFixed(2)),
      engagementLevel: this.classifyEngagementLevel(averageTimePerQuestion, totalEdits, timeoutCount),
      behaviorPattern: this.identifyBehaviorPattern(answers),
    };
  }

  /**
   * Classify engagement level based on metrics
   * @param {number} avgTime - Average time per question
   * @param {number} totalEdits - Total edits
   * @param {number} timeoutCount - Number of timeouts
   * @returns {string} Engagement level
   */
  static classifyEngagementLevel(avgTime, totalEdits, timeoutCount) {
    if (timeoutCount > 2) return 'very-low';
    if (timeoutCount > 0) return 'low';
    if (avgTime < 60 && totalEdits === 0) return 'rushed';
    if (avgTime > 300 && totalEdits > 20) return 'very-high';
    if (avgTime > 200) return 'high';
    if (avgTime > 120) return 'moderate';
    return 'minimal';
  }

  /**
   * Identify behavior pattern from answers
   * @param {array} answers - All answers in interview
   * @returns {string} Behavior pattern
   */
  static identifyBehaviorPattern(answers = []) {
    if (answers.length < 2) return 'insufficient-data';

    const scores = answers.map((ans) => ans.aiEvaluation?.score || 0);
    const edits = answers.map((ans) => ans.interactionMetrics?.editCount || 0);

    // Check for consistency
    const scoreVariance = Math.max(...scores) - Math.min(...scores);
    const editVariance = Math.max(...edits) - Math.min(...edits);

    if (scoreVariance > 5 && editVariance > 5) return 'inconsistent';
    if (scores[scores.length - 1] > scores[0]) return 'improving';
    if (scores[scores.length - 1] < scores[0] - 2) return 'declining';
    if (edits.every((e) => e === 0)) return 'confident';
    if (edits.every((e) => e > 5)) return 'perfectionist';

    return 'stable';
  }

  /**
   * Generate behavior-based recommendations
   * @param {number} behaviorMetrics - Session behavior metrics
   * @param {number} averageScore - Average interview score
   * @returns {array} Recommendations
   */
  static generateBehaviorRecommendations(sessionMetrics, averageScore) {
    const recommendations = [];

    // Time management recommendations
    if (sessionMetrics.engagementLevel === 'rushed') {
      recommendations.push({
        type: 'time-management',
        message: 'You answered questions quickly. Try spending more time to thoroughly think through complex problems.',
        severity: 'medium',
      });
    } else if (sessionMetrics.engagementLevel === 'very-high') {
      recommendations.push({
        type: 'time-management',
        message: 'You spent significant time on questions. Be mindful of time constraints in real interviews.',
        severity: 'low',
      });
    }

    // Revision patterns
    if (sessionMetrics.averageEditsPerQuestion > 10) {
      recommendations.push({
        type: 'confidence',
        message: 'You made many revisions. Try to be more confident in your first responses.',
        severity: 'medium',
      });
    } else if (sessionMetrics.averageEditsPerQuestion === 0) {
      recommendations.push({
        type: 'quality',
        message: 'No revisions detected. Consider reviewing and refining your answers for better quality.',
        severity: 'low',
      });
    }

    // Consistency recommendations
    if (sessionMetrics.behaviorPattern === 'declining') {
      recommendations.push({
        type: 'focus',
        message: 'Your performance declined through the interview. Stay focused and maintain energy levels.',
        severity: 'medium',
      });
    } else if (sessionMetrics.behaviorPattern === 'improving') {
      recommendations.push({
        type: 'positive',
        message: 'Great! Your performance improved throughout the interview.',
        severity: 'positive',
      });
    }

    // Timeout recommendations
    if (sessionMetrics.timeoutCount > 0) {
      recommendations.push({
        type: 'time-management',
        message: `You had ${sessionMetrics.timeoutCount} auto-submissions. Ensure you complete all responses within time limits.`,
        severity: 'high',
      });
    }

    return recommendations;
  }
}

module.exports = BehaviorMetricsAnalyzer;
