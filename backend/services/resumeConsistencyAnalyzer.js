const logger = require('../utils/logger');

/**
 * Resume Consistency Analyzer
 * 
 * Compares resume skills claims with actual interview performance
 * Identifies:
 * - Inflated skills (claimed but underperformed)
 * - Verified strengths (claimed and proven)
 * - Hidden strengths (not claimed but demonstrated)
 * - Weak areas (underperformance on claimed skills)
 */

class ResumeConsistencyAnalyzer {
  /**
   * Analyze resume vs interview performance
   * @param {object} resume - User's resume data
   * @param {array} interviews - Array of completed interviews
   * @returns {object} Consistency analysis
   */
  static analyzeConsistency(resume, interviews = []) {
    if (!resume || !resume.structuredData || !resume.structuredData.skills) {
      return {
        resumeConsistencyScore: 0,
        inflatedSkills: [],
        verifiedStrengths: [],
        hiddenStrengths: [],
        weekAreas: [],
        analysis: 'No resume data available',
      };
    }

    const resumeSkills = resume.structuredData.skills || [];
    const skillPerformance = this.aggregateSkillPerformance(interviews);

    const analysis = {
      resumeConsistencyScore: 0,
      inflatedSkills: [],
      verifiedStrengths: [],
      hiddenStrengths: [],
      weakAreas: [],
      skillComparison: {},
    };

    // Analyze each resume skill
    resumeSkills.forEach((skill) => {
      const normalizedSkill = skill.toLowerCase().trim();
      const performanceData = this.findSkillPerformance(normalizedSkill, skillPerformance);

      if (!performanceData) {
        // Skill claimed but not tested
        analysis.skillComparison[skill] = {
          claimed: true,
          tested: false,
          averageScore: 'N/A',
          category: 'untested',
        };
        return;
      }

      const avgScore = performanceData.averageScore;

      analysis.skillComparison[skill] = {
        claimed: true,
        tested: true,
        averageScore: avgScore,
        attempts: performanceData.attempts,
        category: this.categorizePerformance(avgScore, true),
      };

      if (avgScore < 5) {
        analysis.inflatedSkills.push({
          skill,
          averageScore: Number(avgScore.toFixed(1)),
          attempts: performanceData.attempts,
          recommendation: 'Remove or study before interviews',
        });
      } else if (avgScore >= 7.5) {
        analysis.verifiedStrengths.push({
          skill,
          averageScore: Number(avgScore.toFixed(1)),
          attempts: performanceData.attempts,
        });
      } else if (avgScore >= 5 && avgScore < 7.5) {
        analysis.weakAreas.push({
          skill,
          averageScore: Number(avgScore.toFixed(1)),
          attempts: performanceData.attempts,
          recommendation: 'Needs improvement',
        });
      }
    });

    // Find hidden strengths (skills not claimed but demonstrated)
    Object.entries(skillPerformance).forEach(([skill, performanceData]) => {
      const isClaimedSkill = resumeSkills.some((s) => s.toLowerCase().trim() === skill.toLowerCase());
      if (!isClaimedSkill && performanceData.averageScore >= 7.5) {
        analysis.hiddenStrengths.push({
          skill,
          averageScore: Number(performanceData.averageScore.toFixed(1)),
          recommendation: 'Consider adding to resume',
        });
      }
    });

    // Calculate consistency score
    analysis.resumeConsistencyScore = this.calculateConsistencyScore(analysis);

    return analysis;
  }

  /**
   * Aggregate skill performance from all interviews
   * @param {array} interviews - Array of completed interviews
   * @returns {object} Skill performance data
   */
  static aggregateSkillPerformance(interviews = []) {
    const skillPerformance = {};

    interviews.forEach((interview) => {
      const answers = interview.answers || [];

      answers.forEach((answer) => {
        const questionData = (interview.questionsAsked || []).find(
          (q) => q.question === answer.question
        );

        if (!questionData || !questionData.topic) return;

        const topic = questionData.topic.toLowerCase().trim();
        const score = answer.aiEvaluation?.score || answer.score || 0;

        if (!skillPerformance[topic]) {
          skillPerformance[topic] = {
            scores: [],
            attempts: 0,
            averageScore: 0,
          };
        }

        skillPerformance[topic].scores.push(score);
        skillPerformance[topic].attempts += 1;
      });
    });

    // Calculate averages
    Object.entries(skillPerformance).forEach(([skill, data]) => {
      const average = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
      skillPerformance[skill].averageScore = average;
    });

    return skillPerformance;
  }

  /**
   * Find skill performance data matching a skill name
   * @param {string} skillName - Normalized skill name
   * @param {object} skillPerformance - Performance data
   * @returns {object|null} Matching performance data
   */
  static findSkillPerformance(skillName, skillPerformance) {
    // Exact match
    if (skillPerformance[skillName]) {
      return skillPerformance[skillName];
    }

    // Partial match
    const lowerSkill = skillName.toLowerCase();
    for (const [key, value] of Object.entries(skillPerformance)) {
      if (key.toLowerCase().includes(lowerSkill) || lowerSkill.includes(key.toLowerCase())) {
        return value;
      }
    }

    return null;
  }

  /**
   * Categorize performance level
   * @param {number} score - Performance score
   * @param {boolean} isClaimed - Whether skill was claimed on resume
   * @returns {string} Performance category
   */
  static categorizePerformance(score, isClaimed = false) {
    if (score >= 8) return isClaimed ? 'exceptional' : 'outstanding';
    if (score >= 7) return isClaimed ? 'verified' : 'strong';
    if (score >= 5) return 'needs-improvement';
    return isClaimed ? 'inflated' : 'weak';
  }

  /**
   * Calculate overall consistency score (0-100)
   * @param {object} analysis - Analysis object
   * @returns {number} Consistency score
   */
  static calculateConsistencyScore(analysis) {
    let score = 100;

    // Deduct for inflated skills
    score -= analysis.inflatedSkills.length * 15;

    // Add bonus for verified strengths
    score += analysis.verifiedStrengths.length * 10;

    // Deduct for weak areas
    score -= analysis.weakAreas.length * 8;

    // Add bonus for hidden strengths
    score += analysis.hiddenStrengths.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate improvement recommendations
   * @param {object} analysis - Analysis object
   * @returns {array} Recommendations
   */
  static generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.inflatedSkills.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `Remove or study these inflated skills: ${analysis.inflatedSkills.map((s) => s.skill).join(', ')}`,
      });
    }

    if (analysis.weakAreas.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `Focus on improving: ${analysis.weakAreas.map((s) => s.skill).join(', ')}`,
      });
    }

    if (analysis.hiddenStrengths.length > 0) {
      recommendations.push({
        type: 'suggestion',
        message: `Consider adding to resume: ${analysis.hiddenStrengths.map((s) => s.skill).join(', ')}`,
      });
    }

    if (analysis.resumeConsistencyScore < 50) {
      recommendations.push({
        type: 'critical',
        message: 'Low consistency between resume claims and demonstrated performance. Consider updating your resume.',
      });
    }

    return recommendations;
  }
}

module.exports = ResumeConsistencyAnalyzer;
