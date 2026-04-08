const { VM } = require('vm2');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

const judge0Service = require('./judge0Service');

/**
 * Code Execution Simulator
 * 
 * Simulates code execution for visual feedback in coding practice
 * Now uses Judge0 batch execution for deterministic single-run behavior.
 */

class CodeExecutionSimulator {
  static toLegacyShape(response) {
    return {
      ...response,
      testResults: response.results,
      runtimeError: response.error
    };
  }

  /**
   * Execute JavaScript code safely with test cases
   * @param {string} code - User's code
   * @param {array} testCases - Test cases with input and expected output
   * @returns {object} Execution results
   */
  static async executeJavaScript(code, testCases = []) {
    const baseResponse = {
      passed: false,
      results: [],
      error: null,
      output: ''
    };

    try {
      const vm = new VM({
        timeout: 5000,
        sandbox: {
          console: {
            log: (...args) => {
              baseResponse.output += args.join(' ') + '\n';
            },
          },
        },
      });

      // Run the code to define functions
      vm.run(code);

      const solveFn = vm.run(`
        (typeof solve === 'function' && solve) ||
        (typeof solution === 'function' && solution) ||
        (typeof main === 'function' && main) ||
        null
      `);
      if (typeof solveFn !== 'function' && testCases.length > 0) {
        return this.toLegacyShape({
          ...baseResponse,
          error: 'No callable function found. Define solve(), solution(), or main().'
        });
      }

      // Run test cases
      if (testCases.length === 0) {
        return this.toLegacyShape({
          ...baseResponse,
          passed: true,
          results: [
            {
              input: 'No test cases',
              expected: 'N/A',
              actual: 'Code executed without errors',
              passed: true,
            },
          ]
        });
      }

      let passCount = 0;
      const perCaseResults = [];
      for (const testCase of testCases) {
        try {
          const args = Array.isArray(testCase.input) ? testCase.input : [testCase.input];
          const actual = solveFn(...args);

          const passed = JSON.stringify(actual) === JSON.stringify(testCase.expectedOutput ?? null);

          perCaseResults.push({
            input: JSON.stringify(testCase.input),
            expected: JSON.stringify(testCase.expectedOutput),
            actual: JSON.stringify(actual),
            passed,
            description: testCase.description || '',
          });

          if (passed) passCount++;
        } catch (err) {
          perCaseResults.push({
            input: JSON.stringify(testCase.input),
            expected: JSON.stringify(testCase.expectedOutput),
            actual: 'ERROR',
            passed: false,
            description: err.message,
          });
        }
      }

      return this.toLegacyShape({
        ...baseResponse,
        passed: passCount === testCases.length,
        results: perCaseResults
      });
    } catch (err) {
      logger.error('JavaScript execution error:', err);
      return this.toLegacyShape({
        ...baseResponse,
        error: err.message || 'Runtime error occurred'
      });
    }
  }

  /**
   * Execute code for other languages using Gemini analysis
   * @param {string} code - User's code
   * @param {string} language - Programming language
   * @param {array} testCases - Test cases
   * @returns {object} Analysis results
   */
  static async executeWithGemini(code, language, testCases = []) {
    const baseResponse = {
      passed: false,
      results: [],
      error: null,
      output: '',
    };

    try {
      const testCaseDescriptions = testCases
        .map(
          (tc, idx) =>
            `Test ${idx + 1}: Input: ${JSON.stringify(tc.input)}, Expected: ${JSON.stringify(tc.expectedOutput)}`
        )
        .join('\n');

      const prompt = `
Analyze this ${language} code for correctness:

\`\`\`${language}
${code}
\`\`\`

Test Cases:
${testCaseDescriptions}

For each test case, determine if the code would produce the expected output.
Respond with a JSON object exactly in this format:
{
  "passed": true/false,
  "testResults": [
    {"input": "...", "expected": "...", "actual": "...", "passed": true/false}
  ],
  "runtimeError": null or error message
}
`;

      const response = await geminiService.simulateCodeExecution('Coding simulation', code, language, testCases);
      const totalCases = Number(response?.totalTestCases || testCases.length || 0);
      const passedCases = Number(response?.testCasesPassed || 0);
      const simulatedResults = testCases.map((tc, index) => {
        const passed = index < passedCases;
        return {
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expectedOutput),
          actual: passed ? JSON.stringify(tc.expectedOutput) : 'Mismatch',
          passed,
          description: tc.description || `Test case ${index + 1}`
        };
      }).slice(0, totalCases || testCases.length);

      return this.toLegacyShape({
        ...baseResponse,
        passed: passedCases === totalCases && !response?.runtimeError,
        results: simulatedResults,
        error: response?.runtimeError || null
      });
    } catch (err) {
      logger.error('Gemini code analysis error:', err);
      return this.toLegacyShape({
        ...baseResponse,
        error: 'Failed to analyze code: ' + err.message
      });
    }
  }

  /**
   * Execute code with appropriate engine based on language
   * @param {string} code - User's code
   * @param {string} language - Programming language
   * @param {array} testCases - Test cases
   * @returns {object} Execution results
   */
  static async execute(code, language = 'javascript', testCases = []) {
    let languageId = judge0Service.LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      if (language.toLowerCase() === 'js') languageId = 63;
      else if (language.toLowerCase() === 'python3') languageId = 71;
      else languageId = 63; // fallback
    }
    
    try {
        const batchResult = await judge0Service.executeBatch(code, languageId, testCases);
        return {
            passed: batchResult.passed,
            results: batchResult.results,
            error: batchResult.error,
            output: batchResult.output,
            // also provide testResults, runtimeError for legacy shape compatibility
            testResults: batchResult.results,
            runtimeError: batchResult.error
        };
    } catch (err) {
        logger.error('Batch execution error:', err);
        return {
            passed: false,
            results: [],
            error: err.message,
            output: '',
            testResults: [],
            runtimeError: err.message
        };
    }
  }

  /**
   * Simulate code complexity analysis
   * @param {string} code - User's code
   * @returns {object} Complexity metrics
   */
  static analyzeComplexity(code) {
    const lines = code.split('\n').length;
    const hasNestedLoops = /for\s*\([^)]*for\s*\(/.test(code);
    const hasRecursion = /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*\1\s*\(/.test(code);

    let timeComplexity = 'O(n)';
    let spaceComplexity = 'O(1)';

    if (hasNestedLoops) {
      timeComplexity = 'O(n²)';
    }
    if (hasRecursion) {
      spaceComplexity = 'O(n)';
    }

    return {
      lines,
      hasNestedLoops,
      hasRecursion,
      estimatedTimeComplexity: timeComplexity,
      estimatedSpaceComplexity: spaceComplexity,
    };
  }
}

module.exports = CodeExecutionSimulator;
