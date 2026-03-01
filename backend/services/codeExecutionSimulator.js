const { VM } = require('vm2');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

/**
 * Code Execution Simulator
 * 
 * Simulates code execution for visual feedback in coding practice
 * - Node.js: Uses VM sandbox for actual execution
 * - Other languages: Uses Gemini for analysis
 */

class CodeExecutionSimulator {
  /**
   * Execute JavaScript code safely with test cases
   * @param {string} code - User's code
   * @param {array} testCases - Test cases with input and expected output
   * @returns {object} Execution results
   */
  static async executeJavaScript(code, testCases = []) {
    const results = {
      passed: false,
      testResults: [],
      runtimeError: null,
      output: '',
    };

    try {
      const vm = new VM({
        timeout: 5000,
        sandbox: {
          console: {
            log: (...args) => {
              results.output += args.join(' ') + '\n';
            },
          },
        },
      });

      // Run the code to define functions
      vm.run(code);

      // Extract function name (common pattern)
      const functionMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionMatch && testCases.length > 0) {
        return {
          ...results,
          runtimeError:
            'No function definition found. Expected: function functionName(params) { ... }',
        };
      }

      const functionName = functionMatch ? functionMatch[1] : null;

      // Run test cases
      if (testCases.length === 0) {
        results.testResults = [
          {
            input: 'No test cases',
            expected: 'N/A',
            actual: 'Code executed without errors',
            passed: true,
          },
        ];
        results.passed = true;
        return results;
      }

      let passCount = 0;
      for (const testCase of testCases) {
        try {
          const func = vm.run(functionName);
          const actual = functionName
            ? func(...(Array.isArray(testCase.input) ? testCase.input : [testCase.input]))
            : vm.run(`(${code})(${JSON.stringify(testCase.input)})`);

          const passed = JSON.stringify(actual) === JSON.stringify(testCase.expectedOutput);

          results.testResults.push({
            input: JSON.stringify(testCase.input),
            expected: JSON.stringify(testCase.expectedOutput),
            actual: JSON.stringify(actual),
            passed,
            description: testCase.description || '',
          });

          if (passed) passCount++;
        } catch (err) {
          results.testResults.push({
            input: JSON.stringify(testCase.input),
            expected: JSON.stringify(testCase.expectedOutput),
            actual: 'ERROR',
            passed: false,
            description: err.message,
          });
        }
      }

      results.passed = passCount === testCases.length;
      return results;
    } catch (err) {
      logger.error('JavaScript execution error:', err);
      return {
        ...results,
        runtimeError: err.message || 'Runtime error occurred',
      };
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
    const results = {
      passed: false,
      testResults: [],
      runtimeError: null,
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

      const response = await geminiService.analyzeWithGemini(prompt);
      let parsed = JSON.parse(response);

      return {
        passed: parsed.passed || false,
        testResults: parsed.testResults || results.testResults,
        runtimeError: parsed.runtimeError || null,
        output: parsed.output || '',
      };
    } catch (err) {
      logger.error('Gemini code analysis error:', err);
      return {
        ...results,
        runtimeError: 'Failed to analyze code: ' + err.message,
      };
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
    if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
      return this.executeJavaScript(code, testCases);
    }

    // For other languages, use Gemini
    return this.executeWithGemini(code, language, testCases);
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
