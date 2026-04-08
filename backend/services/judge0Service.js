/**
 * Judge0 Service - Local Self-Hosted Instance
 *
 * Handles code execution via local Judge0 Docker instance.
 * Replaces RapidAPI Judge0 calls for unlimited, free code execution.
 *
 * Endpoint: http://localhost:2358
 */

const axios = require('axios');

// Configuration
const JUDGE0_BASE_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Judge0 Status Codes
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

// Language ID mapping (for reference)
const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
  go: 60,
  ruby: 72,
  rust: 73,
  kotlin: 78,
  swift: 83,
  csharp: 51,
};

/**
 * Encode string to base64 (handles Unicode)
 */
function encodeBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Decode base64 string (handles Unicode)
 */
function decodeBase64(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

/**
 * Submit code to local Judge0 instance
 *
 * @param {Object} params - Submission parameters
 * @param {string} params.source_code - The source code to execute
 * @param {number} params.language_id - Judge0 language ID
 * @param {string} [params.stdin] - Standard input for the program
 * @param {string} [params.expected_output] - Expected output for comparison
 * @param {number} [params.cpu_time_limit] - CPU time limit in seconds
 * @param {number} [params.memory_limit] - Memory limit in KB
 * @returns {Promise<Object>} Judge0 response with execution result
 */
async function submitCode({
  source_code,
  language_id,
  stdin = '',
  expected_output = null,
  cpu_time_limit = 5,
  memory_limit = 128000,
}) {
  console.log(`[Judge0] Submitting code - Language ID: ${language_id}`);
  console.log(`[Judge0] Base URL: ${JUDGE0_BASE_URL}`);
  console.log(`[Judge0] Code length: ${source_code?.length || 0} chars`);
  console.log(`[Judge0] Stdin length: ${stdin?.length || 0} chars`);

  try {
    // Use base64 encoding to handle all characters properly
    const response = await axios.post(
      `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: encodeBase64(source_code),
        language_id,
        stdin: encodeBase64(stdin || ''),
        expected_output: expected_output ? encodeBase64(expected_output) : null,
        cpu_time_limit,
        memory_limit,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      }
    );

    console.log(`[Judge0] Response status: ${response.status}`);
    console.log(`[Judge0] Execution status: ${response.data?.status?.description}`);

    return parseJudge0Response(response.data, true); // true = base64 encoded
  } catch (error) {
    console.error('[Judge0] Submission error:', error.message);

    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Judge0 service is not running. Please start the Docker container.',
        errorType: 'service_unavailable',
      };
    }

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return {
        success: false,
        error: 'Code execution timed out. Your code may have an infinite loop.',
        errorType: 'timeout',
      };
    }

    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Unknown error';

      return {
        success: false,
        error: `Judge0 error (${statusCode}): ${errorMessage}`,
        errorType: 'api_error',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to execute code',
      errorType: 'api_error',
    };
  }
}

/**
 * Parse Judge0 response and extract meaningful result
 *
 * @param {Object} data - Raw Judge0 response
 * @param {boolean} isBase64 - Whether the response is base64 encoded
 * @returns {Object} Parsed execution result
 */
function parseJudge0Response(data, isBase64 = true) {
  if (!data) {
    return {
      success: false,
      error: 'No response from Judge0',
      errorType: 'api_error',
    };
  }

  const statusId = data.status?.id;
  const statusDesc = data.status?.description || 'Unknown';

  // Extract and decode outputs
  const stdout = isBase64 ? decodeBase64(data.stdout) : (data.stdout || '');
  const stderr = isBase64 ? decodeBase64(data.stderr) : (data.stderr || '');
  const compileOutput = isBase64 ? decodeBase64(data.compile_output) : (data.compile_output || '');
  const message = data.message || '';

  // Compilation Error
  if (statusId === STATUS.COMPILATION_ERROR) {
    return {
      success: false,
      error: compileOutput || 'Compilation error',
      errorType: 'compile',
      compileOutput,
      status: statusDesc,
    };
  }

  // Time Limit Exceeded
  if (statusId === STATUS.TIME_LIMIT_EXCEEDED) {
    return {
      success: false,
      error: 'Time limit exceeded. Your code took too long to execute.',
      errorType: 'timeout',
      time: data.time,
      status: statusDesc,
    };
  }

  // Runtime Errors (SIGSEGV, SIGFPE, SIGABRT, NZEC, etc.)
  if (statusId >= STATUS.RUNTIME_ERROR_SIGSEGV && statusId <= STATUS.RUNTIME_ERROR_OTHER) {
    let errorMessage = stderr || message || 'Runtime error';

    // Provide more descriptive error messages
    if (statusId === STATUS.RUNTIME_ERROR_SIGSEGV) {
      errorMessage = `Segmentation fault: ${errorMessage}`;
    } else if (statusId === STATUS.RUNTIME_ERROR_SIGFPE) {
      errorMessage = `Floating point exception (division by zero?): ${errorMessage}`;
    } else if (statusId === STATUS.RUNTIME_ERROR_SIGABRT) {
      errorMessage = `Program aborted: ${errorMessage}`;
    }

    return {
      success: false,
      error: errorMessage,
      errorType: 'runtime',
      stderr,
      time: data.time,
      memory: data.memory ? `${data.memory}KB` : null,
      status: statusDesc,
    };
  }

  // Internal Error
  if (statusId === STATUS.INTERNAL_ERROR) {
    return {
      success: false,
      error: message || 'Internal Judge0 error',
      errorType: 'api_error',
      status: statusDesc,
    };
  }

  // Execution Format Error
  if (statusId === STATUS.EXEC_FORMAT_ERROR) {
    return {
      success: false,
      error: 'Execution format error. The program could not be executed.',
      errorType: 'runtime',
      status: statusDesc,
    };
  }

  // Accepted (successful execution)
  if (statusId === STATUS.ACCEPTED) {
    return {
      success: true,
      output: stdout.trim(),
      time: data.time,
      memory: data.memory ? `${data.memory}KB` : null,
      status: statusDesc,
    };
  }

  // Wrong Answer (code ran but output doesn't match expected)
  if (statusId === STATUS.WRONG_ANSWER) {
    return {
      success: true, // Code executed, we can compare output
      output: stdout.trim(),
      time: data.time,
      memory: data.memory ? `${data.memory}KB` : null,
      status: statusDesc,
    };
  }

  // In Queue or Processing (shouldn't happen with wait=true but handle anyway)
  if (statusId === STATUS.IN_QUEUE || statusId === STATUS.PROCESSING) {
    return {
      success: false,
      error: 'Code execution is still in progress. Please try again.',
      errorType: 'api_error',
      status: statusDesc,
    };
  }

  // Unknown status - return output if available
  if (stdout) {
    return {
      success: true,
      output: stdout.trim(),
      time: data.time,
      memory: data.memory ? `${data.memory}KB` : null,
      status: statusDesc,
    };
  }

  return {
    success: false,
    error: stderr || message || 'Unknown execution error',
    errorType: 'api_error',
    status: statusDesc,
  };
}

/**
 * Check if Judge0 service is healthy
 *
 * @returns {Promise<boolean>} True if service is running
 */
async function healthCheck() {
  try {
    const response = await axios.get(`${JUDGE0_BASE_URL}/about`, {
      timeout: 5000,
    });
    console.log('[Judge0] Health check passed:', response.data?.version);
    return true;
  } catch (error) {
    console.error('[Judge0] Health check failed:', error.message);
    return false;
  }
}

/**
 * Get list of supported languages from Judge0
 *
 * @returns {Promise<Array>} List of supported languages
 */
async function getLanguages() {
  try {
    const response = await axios.get(`${JUDGE0_BASE_URL}/languages`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('[Judge0] Failed to get languages:', error.message);
    return [];
  }
}

/**
 * Execute code and process single/multiple test cases
 * Helper function that handles the full execution flow
 *
 * @param {string} sourceCode - Source code to execute
 * @param {number} languageId - Language ID
 * @param {string} stdin - Input for the program
 * @returns {Promise<Object>} Processed execution result
 */
async function executeCode(sourceCode, languageId, stdin = '') {
  return submitCode({
    source_code: sourceCode,
    language_id: languageId,
    stdin,
  });
}

/**
 * Execute code mapping multiple test cases to a single Judge0 execution.
 * @param {string} sourceCode - The user's source code
 * @param {number} languageId - Judge0 language ID
 * @param {Array} testCases - Array of test case objects {input, expectedOutput, description}
 * @returns {Promise<Object>} Formatted result mapping output lines to test cases
 */
async function executeBatch(sourceCode, languageId, testCases = []) {
  if (!testCases || testCases.length === 0) {
    return { passed: true, results: [], error: null, output: '' };
  }

  const DELIMITER = "___TEST_CASE_DELIMITER___";
  const stdin = testCases.map(tc => {
    return typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input);
  }).join(`\n${DELIMITER}\n`);

  let wrappedCode = sourceCode;

  // Wrap JavaScript
  if (languageId === 63 || languageId === 74) {
    wrappedCode = `
${sourceCode}

const fs = require('fs');
const DELIMITER = "${DELIMITER}";
try {
  const allInput = fs.readFileSync(0, 'utf-8').trim();
  if (!allInput) process.exit(0);

  const cases = allInput.split(DELIMITER).map(s => s.trim());
  const targetFn = (typeof solve === 'function' ? solve : (typeof solution === 'function' ? solution : (typeof main === 'function' ? main : null)));

  if (!targetFn) {
      console.error("No callable function found. Define solve(), solution(), or main().");
      process.exit(1);
  }

  for (let i = 0; i < cases.length; i++) {
      try {
          let input = cases[i];
          let actual = targetFn(input);
          console.log("===RESULT===");
          console.log(typeof actual === 'object' ? JSON.stringify(actual) : actual);
      } catch(err) {
          console.log("===RESULT===");
          console.log("ERROR: " + err.message);
      }
  }
} catch(e) {
  console.error("Wrapper execution failed: " + e.message);
}
`;
  } else if (languageId === 71) {
    // Wrap Python
    wrappedCode = `
import sys
import json

${sourceCode}

def __run_tests():
    DELIMITER = "${DELIMITER}"
    all_input = sys.stdin.read().strip()
    if not all_input:
        return
        
    cases = [s.strip() for s in all_input.split(DELIMITER)]
    
    target_fn = None
    if 'solve' in globals(): target_fn = solve
    elif 'solution' in globals(): target_fn = solution
    elif 'main' in globals(): target_fn = main
    
    if not target_fn:
        print("No callable function found. Define solve(), solution(), or main().", file=sys.stderr)
        sys.exit(1)
        
    for tc in cases:
        try:
            actual = target_fn(tc)
            print("===RESULT===")
            if isinstance(actual, (dict, list)):
                print(json.dumps(actual))
            else:
                print(actual)
        except Exception as e:
            print("===RESULT===")
            print("ERROR: " + str(e))

if __name__ == "__main__":
    __run_tests()
`;
  } else if (languageId === 62) {
      // For Java, we can't easily append a wrapper class if they define 'public class Solution'.
      // Java execution relies on whatever they typed. So we skip wrapping and let their code read stdin.
  } else if (languageId === 54) {
      // Same for C++.
  }

  const result = await submitCode({
    source_code: wrappedCode,
    language_id: languageId,
    stdin: stdin
  });

  if (!result.success && result.errorType === 'compile') {
    return {
      passed: false,
      results: [],
      error: 'Compilation Error: ' + result.error,
      output: result.output || ''
    };
  }
  
  if (!result.success && ['timeout', 'service_unavailable'].includes(result.errorType)) {
    return {
      passed: false,
      results: [],
      error: result.error,
      output: ''
    };
  }

  const rawOutput = (result.output || '').trim();
  const rawStderr = (result.stderr || '').trim();
  
  if (!result.success && (result.errorType === 'runtime' || result.errorType === 'api_error')) {
     if (rawOutput.indexOf("===RESULT===") === -1) {
       return {
         passed: false,
         results: [],
         error: 'Execution Error: ' + result.error + (rawStderr ? '\\nStderr: ' + rawStderr : ''),
         output: rawOutput
       };
     }
  }

  // Parse outputs by splitting uniquely on "===RESULT==="
  const outputBlocks = rawOutput.split("===RESULT===").slice(1).map(s => s.trim());
  let allPassed = true;
  const mappedResults = testCases.map((tc, idx) => {
    let actualStr = idx < outputBlocks.length ? outputBlocks[idx] : "No output";
    let isError = actualStr.startsWith("ERROR: ");
    
    let expectedStr = tc.expectedOutput !== undefined ? String(tc.expectedOutput) : String(tc.expected);
    
    let passed = false;
    if (!isError) {
      // Try loose comparison
      passed = actualStr === expectedStr || 
               actualStr.replace(/\\s+/g, '') === expectedStr.replace(/\\s+/g, '');
    }
    
    if (!passed) allPassed = false;
    
    return {
      input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input),
      expected: expectedStr,
      actual: actualStr,
      passed: passed,
      description: tc.description || `Test case ${idx + 1}`
    };
  });

  return {
    passed: allPassed,
    results: mappedResults,
    error: result.success ? null : (result.error || rawStderr || null),
    output: rawOutput
  };
}

module.exports = {
  submitCode,
  executeCode,
  executeBatch,
  healthCheck,
  getLanguages,
  parseJudge0Response,
  encodeBase64,
  decodeBase64,
  STATUS,
  LANGUAGE_IDS,
};
