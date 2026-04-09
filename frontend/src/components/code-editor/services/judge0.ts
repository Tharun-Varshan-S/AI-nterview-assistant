// Judge0 API Service
// Handles code execution via backend proxy to local Judge0 instance
// This replaces direct RapidAPI calls for better security and no rate limits

import { TestCase, TestResult, ExecutionResult } from "../types";

// Backend API URL - uses same base as other API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface Judge0BackendResponse {
  success: boolean;
  output?: string;
  results?: Array<{
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
  }>;
  total?: number;
  passed?: number;
  failed?: number;
  error?: string;
  errorType?: string;
}

/**
 * Safely convert any input to string format
 * Handles: string, number, array, object, null, undefined
 */
function inputToString(input: unknown): string {
  if (input === null || input === undefined) {
    return "";
  }
  if (typeof input === "string") {
    return input.trim();
  }
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }
  if (Array.isArray(input)) {
    // Convert array to newline-separated values for stdin
    return input.map(item => inputToString(item)).join("\n");
  }
  if (typeof input === "object") {
    // For objects, stringify them
    return JSON.stringify(input);
  }
  return String(input);
}

/**
 * Execute code against all test cases with a SINGLE API call via backend proxy
 */
export async function executeCode(
  sourceCode: string,
  languageId: number,
  testCases: TestCase[],
  mode: "run" | "submit" = "submit"
): Promise<ExecutionResult> {
  try {
    const result = await submitEvaluationToBackend(sourceCode, languageId, testCases, mode);

    if (!result.success) {
      return {
        success: false,
        results: testCases.map((tc) => ({
          input: inputToString(tc.input),
          expected: inputToString(tc.expected),
          actual: "",
          passed: false,
          error: result.error,
        })),
        passedCount: 0,
        totalCount: testCases.length,
        allPassed: false,
        error: result.error,
      };
    }

    const results: TestResult[] = (result.results || []).map((tc) => ({
      input: tc.input,
      expected: tc.expected_output,
      actual: tc.actual_output,
      passed: Boolean(tc.passed),
    }));

    const passedCount = result.passed ?? results.filter((r) => r.passed).length;
    const totalCount = result.total ?? results.length;

    return {
      success: true,
      results,
      passedCount,
      totalCount,
      allPassed: passedCount === totalCount,
      status: passedCount === totalCount ? "Accepted" : "Failed",
    };
  } catch (error: any) {
    console.error("Code execution error:", error);

    return {
      success: false,
      results: testCases.map((tc) => ({
        input: inputToString(tc.input),
        expected: inputToString(tc.expected),
        actual: "",
        passed: false,
        error: error.message || "Execution failed",
      })),
      passedCount: 0,
      totalCount: testCases.length,
      allPassed: false,
      error: error.message || "Execution failed",
      errorType: "api_error",
    };
  }
}

/**
 * Submit code to backend API which proxies to local Judge0
 */
async function submitToBackend(
  sourceCode: string,
  languageId: number,
  stdin: string,
  retries = 3
): Promise<Judge0BackendResponse> {
  const url = `${API_BASE_URL}/code/run`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageId,
          stdin,
        }),
      });

      if (response.status === 503) {
        const data = await response.json();
        return {
          success: false,
          error: data.error || "Judge0 service is not available.",
          errorType: "service_unavailable",
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data: Judge0BackendResponse = await response.json();
      return data;
    } catch (error: any) {
      lastError = error;
      if (attempt < retries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    error: lastError?.message || "Execution failed",
    errorType: "api_error",
  };
}

async function submitEvaluationToBackend(
  sourceCode: string,
  languageId: number,
  testCases: TestCase[],
  mode: "run" | "submit"
): Promise<Judge0BackendResponse> {
  const url = `${API_BASE_URL}/code/evaluate`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(localStorage.getItem("token") && {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }),
    },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      mode,
      test_cases: testCases.length > 0 ? testCases.map((testCase) => ({
        input: inputToString(testCase.input) || "default input",
        expected_output: inputToString(testCase.expected),
      })) : [
        {
          input: "1\n2\n3",
          expected_output: "6",
        }
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 503) {
    return {
      success: false,
      error: data.error || "Judge0 service is not available.",
      errorType: "service_unavailable",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: data.error || `API error: ${response.status}`,
      errorType: data.errorType || "api_error",
    };
  }

  return data;
}

/**
 * Run code against visible test cases only (for "Run" button)
 */
export async function runTestCases(
  sourceCode: string,
  languageId: number,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const visibleCases = testCases.filter((tc) => !tc.isHidden).slice(0, 2);
  return executeCode(sourceCode, languageId, visibleCases, "run");
}

/**
 * Submit code against ALL test cases including hidden (for "Submit" button)
 */
export async function submitSolution(
  sourceCode: string,
  languageId: number,
  visibleTestCases: TestCase[],
  hiddenTestCases: TestCase[] = []
): Promise<ExecutionResult> {
  const allCases = [...visibleTestCases, ...hiddenTestCases];
  return executeCode(sourceCode, languageId, allCases, "submit");
}

/**
 * Check if Judge0 backend service is healthy
 */
export async function checkJudge0Health(): Promise<{
  healthy: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/code/health`);
    const data = await response.json();
    return {
      healthy: data.success,
      message: data.message || (data.success ? "Service is running" : "Service unavailable"),
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: error.message || "Failed to connect to backend",
    };
  }
}

/**
 * Execute single code snippet without test case batching
 */
export async function runSingleExecution(
  sourceCode: string,
  languageId: number,
  stdin: string = ""
): Promise<{
  success: boolean;
  output?: string;
  error?: string;
}> {
  const result = await submitToBackend(sourceCode, languageId, stdin);
  return {
    success: result.success,
    output: result.output,
    error: result.error,
  };
}

export default {
  executeCode,
  runTestCases,
  submitSolution,
  checkJudge0Health,
  runSingleExecution,
};
