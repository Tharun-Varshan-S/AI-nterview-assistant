/**
 * Code Execution Routes
 *
 * Provides API endpoints for code execution via local Judge0 instance.
 * Replaces direct RapidAPI calls from frontend for better security and control.
 */

const express = require('express');
const judge0Service = require('../services/judge0Service');

const router = express.Router();
const USE_MOCK = process.env.USE_MOCK === 'true' || false;

const normalizeTestCase = (testCase = {}) => {
  const input = testCase.input !== undefined ? testCase.input : '';
  const expected_output = testCase.expected_output ?? testCase.expectedOutput ?? testCase.output ?? testCase.expected ?? '';
  
  return {
    input: typeof input === 'object' ? JSON.stringify(input) : String(input).trim(),
    expected_output: typeof expected_output === 'object' ? JSON.stringify(expected_output) : String(expected_output).trim()
  };
};

function validateTestCases(question) {
  if (!question || !Array.isArray(question.test_cases) || question.test_cases.length === 0) return false;

  return question.test_cases.every((tc, index) => {
    // Check for existence of input and expected_output
    const hasInput = tc.input !== undefined && tc.input !== null;
    const hasOutput = tc.expected_output !== undefined && tc.expected_output !== null;
    
    if (!hasInput || !hasOutput) {
      console.log('INVALID TEST CASE (Missing Field):', index, tc);
      return false;
    }
    
    return true;
  });
}

const splitOutputBlocks = (stdout, testCasesLength) => {
  const lines = String(stdout || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n');

  if (testCasesLength <= 1) {
    return [lines.join('\n').trim()];
  }

  if (lines.length === testCasesLength) {
    return lines.map((line) => line.trim());
  }

  // If there's extra lines, try to find "===RESULT===" blocks
  const resultBlocks = String(stdout || '').split("===RESULT===").slice(1).map(s => s.trim());
  if (resultBlocks.length >= testCasesLength) {
    return resultBlocks;
  }

  return lines.slice(0, testCasesLength).map((line) => line.trim());
};

const buildEvaluationResponse = ({ testCases, stdout, mode }) => {
  const outputLines = splitOutputBlocks(stdout, testCases.length);
  const results = testCases.map((tc, index) => {
    const expected = String(tc.expected_output || tc.expected || '').trim();
    const actual = String(outputLines[index] || '').trim();
    
    return {
      input: tc.input,
      expected: expected,
      expected_output: expected,
      actual: actual,
      actual_output: actual,
      passed: expected === actual
    };
  });
  const passedCount = results.filter((result) => result.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    status: passedCount === results.length ? 'Accepted' : 'Failed',
    mode,
    rawOutput: String(stdout || '').trim(),
    results
  };
};

/**
 * POST /api/code/run
 *
 * Execute code against local Judge0 instance
 *
 * Request Body:
 * {
 *   source_code: string,    // The code to execute
 *   language_id: number,    // Judge0 language ID
 *   stdin: string           // Standard input (optional)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   output?: string,        // stdout from execution
 *   error?: string,         // Error message if failed
 *   errorType?: string,     // Type of error (compile, runtime, timeout, api_error)
 *   time?: string,          // Execution time
 *   memory?: string,        // Memory usage
 *   status?: string         // Judge0 status description
 * }
 */
router.post('/run', async (req, res) => {
  try {
    const { source_code, language_id, stdin = '' } = req.body;

    // Validate required fields
    if (!source_code) {
      return res.status(400).json({
        success: false,
        error: 'source_code is required',
        errorType: 'validation_error',
      });
    }

    if (!language_id) {
      return res.status(400).json({
        success: false,
        error: 'language_id is required',
        errorType: 'validation_error',
      });
    }

    // Validate language_id is a number
    const langId = parseInt(language_id, 10);
    if (isNaN(langId)) {
      return res.status(400).json({
        success: false,
        error: 'language_id must be a number',
        errorType: 'validation_error',
      });
    }

    console.log(`[Code Route] Executing code - Language: ${langId}, Code length: ${source_code.length}`);

    // Execute code via Judge0 service
    const result = await judge0Service.submitCode({
      source_code,
      language_id: langId,
      stdin: stdin || '',
    });

    // Return result with appropriate status code
    const statusCode = result.success ? 200 : (result.errorType === 'service_unavailable' ? 503 : 200);

    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('[Code Route] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during code execution',
      errorType: 'api_error',
    });
  }
});

/**
 * POST /api/code/batch
 *
 * Execute code with multiple test cases (batched input)
 * Optimized for running multiple test cases in a single call
 *
 * Request Body:
 * {
 *   source_code: string,
 *   language_id: number,
 *   stdin: string           // Combined test case inputs
 * }
 */
router.post('/batch', async (req, res) => {
  try {
    const { source_code, language_id, stdin = '' } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({
        success: false,
        error: 'source_code and language_id are required',
        errorType: 'validation_error',
      });
    }

    const result = await judge0Service.submitCode({
      source_code,
      language_id: parseInt(language_id, 10),
      stdin,
      cpu_time_limit: 10, // Longer timeout for batch operations
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Code Route] Batch execution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during batch execution',
      errorType: 'api_error',
    });
  }
});

router.post('/evaluate', async (req, res) => {
  try {
    const {
      source_code,
      language_id,
      test_cases = [],
      mode = 'submit'
    } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({
        success: false,
        error: 'source_code and language_id are required',
        errorType: 'validation_error'
      });
    }

    const normalizedCases = (Array.isArray(test_cases) ? test_cases : []).map(normalizeTestCase);
    const selectedCases = mode === 'run' ? normalizedCases.slice(0, 2) : normalizedCases;
    const question = { test_cases: selectedCases };

    if (!validateTestCases(question)) {
      return res.status(400).json({
        success: false,
        error: 'test_cases with input and expected output are required',
        errorType: 'validation_error'
      });
    }

    if (USE_MOCK) {
      const mockStdout = selectedCases.map((testCase) => testCase.expected).join('\n');
      return res.status(200).json({
        success: true,
        ...buildEvaluationResponse({ testCases: selectedCases, stdout: mockStdout, mode }),
        mock: true
      });
    }

    // Execute using executeBatch for proper test case isolation and formatting
    const langId = parseInt(language_id, 10);
    const batchResult = await judge0Service.executeBatch(source_code, langId, selectedCases);

    if (batchResult.error && (!batchResult.results || batchResult.results.length === 0)) {
       return res.status(200).json({
         success: false,
         error: batchResult.error,
         errorType: 'compile',
         rawOutput: batchResult.output || ''
       });
    }
    
    // Map back into response object expected by frontend with redundancy
    const results = batchResult.results.map(r => {
      const expected = r.expected || r.expected_output || '';
      const actual = r.actual || r.actual_output || '';
      
      return {
        input: r.input,
        expected: expected,
        expected_output: expected,
        expectedOutput: expected,
        actual: actual,
        actual_output: actual,
        actualOutput: actual,
        passed: r.passed,
        status: r.status,
        stderr: r.stderr,
        compile_output: r.compile_output
      };
    });

    const passedCount = results.filter(r => r.passed).length;
    
    return res.status(200).json({
      success: true,
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      results
    });
  } catch (error) {
    console.error('[Code Route] Evaluation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during evaluation',
      errorType: 'api_error'
    });
  }
});

/**
 * GET /api/code/health
 *
 * Check if Judge0 service is healthy
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await judge0Service.healthCheck();

    if (isHealthy) {
      return res.status(200).json({
        success: true,
        message: 'Judge0 service is running',
        status: 'healthy',
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'Judge0 service is not available',
        status: 'unhealthy',
      });
    }
  } catch (error) {
    console.error('[Code Route] Health check error:', error);
    return res.status(503).json({
      success: false,
      message: 'Failed to check Judge0 service health',
      status: 'error',
    });
  }
});

/**
 * GET /api/code/languages
 *
 * Get list of supported programming languages
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = await judge0Service.getLanguages();

    return res.status(200).json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('[Code Route] Get languages error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch supported languages',
    });
  }
});

module.exports = router;
