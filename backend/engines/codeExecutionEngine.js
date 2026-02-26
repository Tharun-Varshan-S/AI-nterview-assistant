const vm = require('vm');

class CodeExecutionEngine {
  static normalizeTestCases(testCases = []) {
    if (!Array.isArray(testCases)) return [];

    return testCases
      .filter((tc) => tc && Object.prototype.hasOwnProperty.call(tc, 'input'))
      .map((tc) => ({
        input: Array.isArray(tc.input) ? tc.input : [tc.input],
        expectedOutput: tc.expectedOutput,
        description: tc.description || 'Generated test'
      }));
  }

  static compareOutputs(actual, expected) {
    if (typeof expected === 'number' && typeof actual === 'number') {
      return Math.abs(actual - expected) < 1e-9;
    }
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  static resolveExecutableFunction(code) {
    const sandbox = {
      module: { exports: {} },
      exports: {},
      console: { log: () => {} },
      __result: null
    };

    vm.createContext(sandbox);

    const extractorScript = new vm.Script(
      `
${code}
__result =
  (typeof solve === 'function' && solve) ||
  (typeof solution === 'function' && solution) ||
  (typeof main === 'function' && main) ||
  (typeof module !== 'undefined' && typeof module.exports === 'function' && module.exports) ||
  (typeof module !== 'undefined' && module.exports && typeof module.exports.solve === 'function' && module.exports.solve) ||
  null;
`
    );

    extractorScript.runInContext(sandbox, { timeout: 1000 });

    if (typeof sandbox.__result !== 'function') {
      throw new Error('No executable function found. Define solve() or export a function.');
    }

    return sandbox.__result;
  }

  static runJavaScript(code, testCases = []) {
    const normalizedCases = this.normalizeTestCases(testCases);
    const cases = normalizedCases.length > 0
      ? normalizedCases
      : [{ input: [], expectedOutput: undefined, description: 'Smoke test' }];

    const start = process.hrtime.bigint();
    let runtimeError = null;
    let passed = 0;

    try {
      const executableFn = this.resolveExecutableFunction(code);

      for (const testCase of cases) {
        let actual;
        try {
          actual = executableFn(...testCase.input);
        } catch (err) {
          runtimeError = `Runtime error on test '${testCase.description}': ${err.message}`;
          break;
        }

        if (typeof testCase.expectedOutput === 'undefined') {
          if (typeof actual !== 'undefined') {
            passed += 1;
          }
        } else if (this.compareOutputs(actual, testCase.expectedOutput)) {
          passed += 1;
        }
      }
    } catch (err) {
      runtimeError = err.message;
    }

    const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1000000));
    const total = cases.length;
    const score = total > 0 ? Math.round((passed / total) * 10) : 0;

    return {
      testCasesPassed: passed,
      totalTestCases: total,
      runtimeError,
      executionTimeMs: durationMs,
      executionScore: runtimeError ? Math.min(score, 3) : score
    };
  }

  static async runNonJavaScript({ question, code, language, testCases = [], geminiService }) {
    if (!geminiService?.simulateCodeExecution) {
      return {
        testCasesPassed: 0,
        totalTestCases: testCases.length || 0,
        runtimeError: 'Execution simulator unavailable',
        executionTimeMs: 0,
        executionScore: 0
      };
    }

    const result = await geminiService.simulateCodeExecution(question, code, language, testCases);
    return {
      testCasesPassed: Number(result?.testCasesPassed || 0),
      totalTestCases: Number(result?.totalTestCases || testCases.length || 0),
      runtimeError: result?.runtimeError || null,
      executionTimeMs: Number(result?.executionTimeMs || 0),
      executionScore: Number(result?.executionScore || 0)
    };
  }

  static async executeCodeSubmission({ question, code, language, testCases = [], geminiService }) {
    if ((language || '').toLowerCase() === 'javascript') {
      return this.runJavaScript(code, testCases);
    }

    return this.runNonJavaScript({ question, code, language, testCases, geminiService });
  }
}

module.exports = CodeExecutionEngine;
