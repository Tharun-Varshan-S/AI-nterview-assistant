// Type definitions for the code editor component

export interface TestCase {
  input: string;
  expected: string;
  isHidden?: boolean;
  description?: string;
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTime?: string;
  memory?: string;
  error?: string;
  errorType?: "compile" | "runtime" | "timeout" | "wrong_answer";
}

export interface ExecutionResult {
  success: boolean;
  results: TestResult[];
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  status?: "Accepted" | "Failed";
  rawOutput?: string;
  error?: string;
  errorType?: "compile" | "runtime" | "timeout" | "rate_limit" | "quota_exceeded" | "api_error" | "RATE_LIMIT";
  compileOutput?: string;
}

export interface CodingProblem {
  id?: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  testCases: TestCase[];
  hiddenTestCases?: TestCase[];
  topic?: string;
  tags?: string[];
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in MB
}

export interface CodeSubmission {
  code: string;
  languageId: number;
  problemId?: string;
  testCases: TestCase[];
}

export interface EditorState {
  code: string;
  languageId: number;
  theme: "vs-dark" | "light";
  fontSize: number;
}

export interface CodeEditorProps {
  problem: CodingProblem;
  onSubmit?: (result: ExecutionResult, code: string, languageId: number) => void;
  onRun?: (result: ExecutionResult) => void;
  initialCode?: string;
  initialLanguageId?: number;
  readOnly?: boolean;
  showProblemPanel?: boolean;
  autoSave?: boolean;
  storageKey?: string;
}

// API Response types
export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

export interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

export interface BatchSubmissionResponse {
  submissions: Judge0Response[];
}
