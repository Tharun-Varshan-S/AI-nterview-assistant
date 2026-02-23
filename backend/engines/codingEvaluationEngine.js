/**
 * Coding Interview Evaluation Engine
 * 
 * Evaluates code solutions for:
 * - Logical correctness
 * - Code quality and readability
 * - Time/space complexity analysis
 * - Edge case handling
 */

class CodingEvaluationEngine {

  /**
   * Parse code complexity from Gemini evaluation
   */
  static parseComplexity(complexityString) {
    if (!complexityString) return { time: 'Unknown', space: 'Unknown' };

    const timeMatch = complexityString.match(/O\([^)]*\)/);
    const spaceMatch = complexityString.match(/O\([^)]*\)/);

    return {
      time: timeMatch ? timeMatch[0] : 'Not specified',
      space: spaceMatch ? spaceMatch[0] : 'Not specified'
    };
  }

  /**
   * Calculate overall coding score from component scores
   * 
   * Weights:
   * - Logic: 50%
   * - Readability: 30%
   * - Edge case handling: 20%
   */
  static calculateOverallCodingScore(logicScore, readabilityScore, edgeCaseScore) {
    if (!logicScore && !readabilityScore && !edgeCaseScore) return 0;

    const logic = logicScore || 0;
    const readability = readabilityScore || 0;
    const edgeCase = edgeCaseScore || 5; // Default to 5 if not assessed

    return Math.round(logic * 0.5 + readability * 0.3 + edgeCase * 0.2);
  }

  /**
   * Determine edge case score from text description
   * Maps qualitative assessment to numeric score
   */
  static scoreEdgeCaseHandling(edgeCaseText) {
    if (!edgeCaseText) return 5;

    const text = edgeCaseText.toLowerCase();

    if (text.includes('comprehensive') || text.includes('excellent')) return 9;
    if (text.includes('good') || text.includes('handles major')) return 7;
    if (text.includes('partial') || text.includes('some')) return 5;
    if (text.includes('minimal') || text.includes('few')) return 3;
    if (text.includes('none') || text.includes('missing')) return 1;

    return 5; // Default middle score
  }

  /**
   * Validate code submission metadata
   */
  static validateCodeSubmission(submission) {
    return (
      submission.code &&
      submission.language &&
      ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'].includes(
        submission.language.toLowerCase()
      )
    );
  }

  /**
   * Aggregate coding performance from multiple submissions
   */
  static aggregateCodingPerformance(codingAnswers) {
    if (!codingAnswers || codingAnswers.length === 0) {
      return {
        avgLogicScore: 0,
        avgReadabilityScore: 0,
        avgOverallScore: 0,
        languageBreakdown: {},
        commonIssues: []
      };
    }

    const logicScores = [];
    const readabilityScores = [];
    const overallScores = [];
    const languageStats = {};
    const issueFrequency = {};

    codingAnswers.forEach((answer) => {
      const evaluation = answer.aiEvaluation || {};

      if (evaluation.logicScore) logicScores.push(evaluation.logicScore);
      if (evaluation.readabilityScore) readabilityScores.push(evaluation.readabilityScore);

      const overall = this.calculateOverallCodingScore(
        evaluation.logicScore,
        evaluation.readabilityScore,
        this.scoreEdgeCaseHandling(evaluation.edgeCaseHandling)
      );
      overallScores.push(overall);

      // Language stats
      const lang = answer.language || 'unknown';
      if (!languageStats[lang]) {
        languageStats[lang] = { attempts: 0, avgScore: 0, scores: [] };
      }
      languageStats[lang].attempts += 1;
      languageStats[lang].scores.push(overall);

      // Track common issues
      if (evaluation.improvementSuggestions) {
        evaluation.improvementSuggestions.forEach((suggestion) => {
          issueFrequency[suggestion] = (issueFrequency[suggestion] || 0) + 1;
        });
      }
    });

    // Calculate language averages
    Object.keys(languageStats).forEach((lang) => {
      const stats = languageStats[lang];
      stats.avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
    });

    // Get top issues
    const commonIssues = Object.entries(issueFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, frequency: count }));

    const avgLogicScore = logicScores.length > 0 ? logicScores.reduce((a, b) => a + b, 0) / logicScores.length : 0;
    const avgReadabilityScore =
      readabilityScores.length > 0
        ? readabilityScores.reduce((a, b) => a + b, 0) / readabilityScores.length
        : 0;
    const avgOverallScore =
      overallScores.length > 0 ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length : 0;

    return {
      avgLogicScore: Math.round(avgLogicScore),
      avgReadabilityScore: Math.round(avgReadabilityScore),
      avgOverallScore: Math.round(avgOverallScore),
      languageBreakdown: languageStats,
      commonIssues
    };
  }

  /**
   * Identify most used programming language
   */
  static getPreferredLanguage(codingAnswers) {
    if (!codingAnswers || codingAnswers.length === 0) return null;

    const languageCounts = {};
    codingAnswers.forEach((answer) => {
      const lang = answer.language || 'unknown';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    return Object.entries(languageCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
  }

  /**
   * Check if code solution complexity is good
   * Scores time complexity from Gemini output
   */
  static rateComplexity(timeComplexity, problemType = 'general') {
    if (!timeComplexity) return { rating: 'Unknown', feedback: 'No complexity analysis provided' };

    const complexity = timeComplexity.toUpperCase();

    // Problem type expectations (rough)
    const expectations = {
      sorting: 'O(N LOG N)',
      searching: 'O(LOG N)',
      general: 'O(N)' // Varies
    };

    // Simple O notation scoring
    if (complexity.includes('O(1)')) {
      return { rating: 'Excellent', feedback: 'Constant time - optimal for this scenario' };
    }
    if (complexity.includes('O(LOG')) {
      return { rating: 'Very Good', feedback: 'Logarithmic time complexity' };
    }
    if (complexity.includes('O(N)') && !complexity.includes('O(N LOG')) {
      return { rating: 'Good', feedback: 'Linear time complexity' };
    }
    if (complexity.includes('O(N LOG')) {
      return { rating: 'Good', feedback: 'Linearithmic time complexity' };
    }
    if (complexity.includes('O(N^2)')) {
      return { rating: 'Fair', feedback: 'Quadratic - consider optimization opportunities' };
    }
    if (complexity.includes('O(2^N)') || complexity.includes('O(N!)')) {
      return { rating: 'Poor', feedback: 'Exponential/factorial complexity - significant room for improvement' };
    }

    return { rating: 'Unknown', feedback: 'Complexity ratings unclear from analysis' };
  }
}

module.exports = CodingEvaluationEngine;
