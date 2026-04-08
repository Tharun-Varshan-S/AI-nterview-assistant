// Judge0 API Service
// Handles code execution via backend proxy to local Judge0 instance
// This replaces direct RapidAPI calls for better security and no rate limits

import { TestCase, TestResult, ExecutionResult } from "../types";

// Backend API URL - uses same base as other API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Status codes from Judge0 (for reference)
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

interface Judge0BackendResponse {
  success: boolean;
  output?: string;
  rawOutput?: string;
  error?: string;
  errorType?: string;
  time?: string;
  memory?: string;
  status?: string;
  compileOutput?: string;
  total?: number;
  passed?: number;
  failed?: number;
  results?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
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
 * Combines all test cases into a single batched input
 * Format:
 * <number_of_test_cases>
 * <test_case_1_input>
 * <test_case_2_input>
 * ...
 *
 * This drastically reduces API calls from N to 1
 */
export function combineTestCasesInput(testCases: TestCase[]): string {
  const inputs = testCases.map((tc) => inputToString(tc.input));
  return `${inputs.length}\n${inputs.join("\n")}`;
}

/**
 * Parse batched output into individual test results
 * Splits output by newlines and matches with expected outputs
 */
export function parseBatchedOutput(
  output: string,
  testCases: TestCase[]
): { outputs: string[]; matched: boolean[] } {
  const outputs = output
    .trim()
    .split("\n")
    .map((o) => o.trim());

  // Handle case where output might be multi-line per test case
  const matched = testCases.map((tc, idx) => {
    const expected = inputToString(tc.expected);
    const actual = outputs[idx]?.trim() || "";
    return actual === expected;
  });

  return { outputs, matched };
}

/**
 * Execute code against all test cases with a SINGLE API call via backend proxy
 * This is the key architecture: Frontend → Backend → Local Judge0
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
          errorType: mapTestResultErrorType(result.errorType),
        })),
        passedCount: 0,
        totalCount: testCases.length,
        allPassed: false,
        error: result.error,
        errorType: mapErrorType(result.errorType),
        compileOutput: result.compileOutput,
      };
    }

    const results: TestResult[] = (result.results || []).map((tc) => ({
      input: inputToString(tc.input),
      expected: inputToString(tc.expected),
      actual: inputToString(tc.actual),
      passed: Boolean(tc.passed),
      executionTime: result.time,
      memory: result.memory,
    }));

    const passedCount = typeof result.passed === "number"
      ? result.passed
      : results.filter((r) => r.passed).length;
    const totalCount = typeof result.total === "number" ? result.total : results.length;

    return {
      success: true,
      results,
      passedCount,
      totalCount,
      allPassed: passedCount === totalCount,
      status: result.status === "Accepted" ? "Accepted" : "Failed",
      rawOutput: result.rawOutput || result.output || "",
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
 * Map backend error types to ExecutionResult error types
 */
function mapErrorType(
  backendType?: string
): ExecutionResult["errorType"] | undefined {
  if (!backendType) return undefined;

  const mapping: Record<string, ExecutionResult["errorType"]> = {
    compile: "compile",
    runtime: "runtime",
    timeout: "timeout",
    RATE_LIMIT: "RATE_LIMIT",
    service_unavailable: "api_error",
    api_error: "api_error",
    validation_error: "api_error",
  };

  return mapping[backendType] || "api_error";
}

/**
 * Map backend error types to TestResult error types (more restricted)
 */
function mapTestResultErrorType(
  backendType?: string
): TestResult["errorType"] | undefined {
  if (!backendType) return undefined;

  const mapping: Record<string, TestResult["errorType"]> = {
    compile: "compile",
    runtime: "runtime",
    timeout: "timeout",
  };

  return mapping[backendType] || "runtime"; // Default to runtime for other errors
}

/**
 * Submit code to backend API which proxies to local Judge0
 * This replaces direct RapidAPI calls
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
          // Include auth token if available (for authenticated routes)
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

      // Handle server errors
      if (response.status === 503) {
        // Service unavailable - Judge0 not running
        const data = await response.json();
        return {
          success: false,
          error: data.error || "Judge0 service is not available. Please ensure it is running.",
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
      console.error(`Attempt ${attempt + 1} failed:`, error.message);

      // Network errors - retry with backoff
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("timeout")
      ) {
        if (attempt < retries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Other errors - don't retry
      break;
    }
  }

  return {
    success: false,
    error: lastError?.message || "Execution failed after retries",
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
      test_cases: testCases.map((testCase) => ({
        input: inputToString(testCase.input),
        output: inputToString(testCase.expected),
      })),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 503) {
    return {
      success: false,
      error: data.error || "Judge0 service is not available. Please ensure it is running.",
      errorType: "service_unavailable",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: data.error || `API error: ${response.status}`,
      errorType: data.errorType || "api_error",
      compileOutput: data.compileOutput,
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
 * Useful for simple "Run" without expected output comparison
 */
export async function runSingleExecution(
  sourceCode: string,
  languageId: number,
  stdin: string = ""
): Promise<{
  success: boolean;
  output?: string;
  error?: string;
  time?: string;
  memory?: string;
}> {
  const result = await submitToBackend(sourceCode, languageId, stdin);
  return {
    success: result.success,
    output: result.output,
    error: result.error,
    time: result.time,
    memory: result.memory,
  };
}

export default {
  executeCode,
  runTestCases,
  submitSolution,
  combineTestCasesInput,
  parseBatchedOutput,
  checkJudge0Health,
  runSingleExecution,
};
