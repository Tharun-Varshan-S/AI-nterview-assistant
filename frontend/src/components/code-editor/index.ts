// Code Editor Module Exports
// Single entry point for all code editor components and utilities

export { default as LeetCodeEditor } from "./LeetCodeEditor";

// Constants
export { PRIMARY_LANGUAGES, ALL_LANGUAGES, DEFAULT_LANGUAGE, getLanguageById, getLanguageByValue } from "./constants/languages";
export type { Language } from "./constants/languages";

export { getBoilerplate, getSimpleBoilerplate, BOILERPLATES, SIMPLE_BOILERPLATES } from "./constants/boilerplates";

// Services
export { executeCode, runTestCases, submitSolution, combineTestCasesInput, parseBatchedOutput } from "./services/judge0";

// Types
export type {
  TestCase,
  TestResult,
  ExecutionResult,
  CodingProblem,
  CodeSubmission,
  EditorState,
  CodeEditorProps,
} from "./types";
