const CodeExecutionSimulator = require('../services/codeExecutionSimulator');

/**
 * Code Execution Engine
 * 
 * Centralized engine for executing and scoring code submissions.
 * Now delegates to CodeExecutionSimulator (Judge0) for deterministic execution.
 */
class CodeExecutionEngine {
  /**
   * Main entry point for evaluating code submissions during interview
   */
  static async executeCodeSubmission({ question, code, language, testCases = [], geminiService }) {
    // Standardize test cases to ensure they have input and expected_output
    const normalizedCases = (testCases || []).map(tc => ({
      input: tc.input,
      expected_output: tc.expectedOutput ?? tc.expected_output ?? tc.expected ?? tc.output ?? '',
      description: tc.description || 'Test case'
    }));

    // If no test cases, provided by Gemini if possible or use a default one
    const finalCases = normalizedCases.length > 0 ? normalizedCases : [
      { input: '', expected_output: '', description: 'Default evaluation case' }
    ];

    return await CodeExecutionSimulator.execute(code, language, finalCases);
  }

  /**
   * Utility to calculate overall coding score (legacy support for CodingEvaluationEngine)
   */
  static calculateOverallCodingScore(logic, readability, edgeCases) {
    return Math.round((logic * 0.5) + (readability * 0.2) + (edgeCases * 0.3));
  }

  /**
   * Utility to score edge case handling (legacy support)
   */
  static scoreEdgeCaseHandling(feedback) {
    if (!feedback) return 5;
    const lower = feedback.toLowerCase();
    if (lower.includes('all') || lower.includes('robust')) return 10;
    if (lower.includes('most') || lower.includes('good')) return 8;
    if (lower.includes('partially') || lower.includes('some')) return 5;
    return 3;
  }
}

module.exports = CodeExecutionEngine;
