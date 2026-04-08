// LeetCode-Style Code Editor Component
// A professional, production-ready coding environment

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Cpu,
  FileCode2,
  ListChecks,
  BookOpen,
  Terminal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Loader2,
  Code2,
  Lightbulb,
} from "lucide-react";

// Local imports
import {
  PRIMARY_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageById,
  Language,
} from "./constants/languages";
import { getBoilerplate, getSimpleBoilerplate } from "./constants/boilerplates";
import { executeCode, runTestCases, submitSolution } from "./services/judge0";
import type { CodingProblem, TestCase, TestResult, ExecutionResult } from "./types";

interface LeetCodeEditorProps {
  problem: CodingProblem;
  onSubmit?: (result: ExecutionResult, code: string, languageId: number) => void;
  onRun?: (result: ExecutionResult) => void;
  initialCode?: string;
  initialLanguageId?: number;
  readOnly?: boolean;
  showProblemPanel?: boolean;
  autoSave?: boolean;
  storageKey?: string;
  className?: string;
}

const LeetCodeEditor: React.FC<LeetCodeEditorProps> = ({
  problem,
  onSubmit,
  onRun,
  initialCode,
  initialLanguageId = DEFAULT_LANGUAGE.id,
  readOnly = false,
  showProblemPanel = true,
  autoSave = true,
  storageKey,
  className,
}) => {
  const { theme } = useTheme();

  // Editor state
  const [code, setCode] = useState<string>(() => {
    if (initialCode) return initialCode;
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.code || getBoilerplate(initialLanguageId);
        } catch {
          return getBoilerplate(initialLanguageId);
        }
      }
    }
    return getBoilerplate(initialLanguageId);
  });

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const lang = getLanguageById(parsed.languageId);
          if (lang) return lang;
        } catch {}
      }
    }
    return getLanguageById(initialLanguageId) || DEFAULT_LANGUAGE;
  });

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isSubmissionResult, setIsSubmissionResult] = useState(false); // Track if result is from submission
  const [activeTab, setActiveTab] = useState<"testcases" | "results">("testcases");

  // UI state
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(280);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);

  // Custom test cases
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);

  // All visible test cases
  const visibleTestCases = useMemo(() => {
    const examples = problem.examples.map((ex) => ({
      input: ex.input,
      expected: ex.output,
      description: ex.explanation,
    }));
    return [...examples, ...customTestCases];
  }, [problem.examples, customTestCases]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && storageKey) {
      const timer = setTimeout(() => {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            code,
            languageId: selectedLanguage.id,
            timestamp: Date.now(),
          })
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, selectedLanguage.id, autoSave, storageKey]);

  // Handle language change
  const handleLanguageChange = useCallback((value: string) => {
    const lang = PRIMARY_LANGUAGES.find((l) => l.value === value);
    if (lang) {
      setSelectedLanguage(lang);
      // Reset code to new language template if code is default
      const currentBoiler = getBoilerplate(selectedLanguage.id);
      if (code === currentBoiler || code.trim() === "") {
        setCode(getBoilerplate(lang.id));
      }
    }
  }, [code, selectedLanguage.id]);

  // Reset code to template
  const handleResetCode = useCallback(() => {
    setCode(getBoilerplate(selectedLanguage.id));
    setExecutionResult(null);
    setActiveTab("testcases");
  }, [selectedLanguage.id]);

  // Run visible test cases only
  const handleRun = useCallback(async () => {
    if (isRunning || isSubmitting) return;

    setIsRunning(true);
    setExecutionResult(null);
    setIsSubmissionResult(false); // This is a run, not a submission
    setActiveTab("results");

    try {
      const result = await runTestCases(code, selectedLanguage.id, visibleTestCases);
      setExecutionResult(result);
      onRun?.(result);
    } catch (error: any) {
      setExecutionResult({
        success: false,
        results: [],
        passedCount: 0,
        totalCount: visibleTestCases.length,
        allPassed: false,
        error: error.message || "Execution failed",
        errorType: "api_error",
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, selectedLanguage.id, visibleTestCases, isRunning, isSubmitting, onRun]);

  // Submit with all test cases (including hidden)
  const handleSubmit = useCallback(async () => {
    if (isRunning || isSubmitting) return;

    setIsSubmitting(true);
    setExecutionResult(null);
    setIsSubmissionResult(true); // This is a submission
    setActiveTab("results");

    try {
      const result = await submitSolution(
        code,
        selectedLanguage.id,
        visibleTestCases,
        problem.hiddenTestCases || []
      );
      setExecutionResult(result);
      onSubmit?.(result, code, selectedLanguage.id);
    } catch (error: any) {
      const totalTests = visibleTestCases.length + (problem.hiddenTestCases?.length || 0);
      setExecutionResult({
        success: false,
        results: [],
        passedCount: 0,
        totalCount: totalTests,
        allPassed: false,
        error: error.message || "Submission failed",
        errorType: "api_error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, selectedLanguage.id, visibleTestCases, problem.hiddenTestCases, isRunning, isSubmitting, onSubmit]);

  // Difficulty color mapping
  const difficultyColor = {
    easy: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    hard: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className={cn("flex h-full min-h-[700px] bg-background", className)}>
      {/* Left Panel - Problem Description */}
      {showProblemPanel && (
        <div className="w-[420px] border-r border-border flex flex-col bg-card/50">
          <Tabs defaultValue="description" className="flex-1 flex flex-col">
            <TabsList className="h-12 w-full justify-start rounded-none border-b bg-muted/30 px-4 gap-2">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-xs font-medium"
              >
                <BookOpen size={14} />
                Description
              </TabsTrigger>
              <TabsTrigger
                value="hints"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-xs font-medium"
              >
                <Lightbulb size={14} />
                Hints
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="description" className="mt-0 space-y-6">
                {/* Title and Difficulty */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold leading-tight">
                      {problem.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 font-semibold capitalize",
                        difficultyColor[problem.difficulty]
                      )}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>
                  {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] font-medium"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Problem Description */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {problem.description}
                  </p>
                </div>

                {/* Input/Output Format */}
                {(problem.inputFormat || problem.outputFormat) && (
                  <div className="space-y-4">
                    {problem.inputFormat && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileCode2 size={14} className="text-primary" />
                          Input Format
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                          {problem.inputFormat}
                        </p>
                      </div>
                    )}
                    {problem.outputFormat && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Terminal size={14} className="text-primary" />
                          Output Format
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                          {problem.outputFormat}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Examples */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Code2 size={14} className="text-primary" />
                    Examples
                  </h4>
                  {problem.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-muted/30 overflow-hidden"
                    >
                      <div className="px-4 py-2 bg-muted/50 border-b">
                        <span className="text-xs font-medium text-muted-foreground">
                          Example {idx + 1}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Input:
                          </span>
                          <pre className="text-sm font-mono bg-background p-2 rounded border overflow-x-auto">
                            {example.input}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Output:
                          </span>
                          <pre className="text-sm font-mono bg-background p-2 rounded border text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                            {example.output}
                          </pre>
                        </div>
                        {example.explanation && (
                          <div className="space-y-1 pt-2 border-t">
                            <span className="text-xs font-medium text-muted-foreground">
                              Explanation:
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {example.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ListChecks size={14} className="text-primary" />
                      Constraints
                    </h4>
                    <ul className="space-y-2">
                      {problem.constraints.map((constraint, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-primary mt-1.5">•</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                            {constraint}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hints" className="mt-0">
                <div className="text-center py-12 text-muted-foreground">
                  <Lightbulb className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">No hints available for this problem.</p>
                  <p className="text-xs mt-1">Try solving it on your own first!</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}

      {/* Right Panel - Editor + Test Cases */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Select
              value={selectedLanguage.value}
              onValueChange={handleLanguageChange}
              disabled={readOnly}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.id} value={lang.value} className="text-xs">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetCode}
              disabled={readOnly}
              className="h-7 text-xs gap-1.5"
            >
              <RotateCcw size={12} />
              Reset
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div
          className="flex-1 min-h-0"
          style={{ height: `calc(100% - 48px - ${isBottomPanelCollapsed ? 40 : bottomPanelHeight}px)` }}
        >
          <Editor
            height="100%"
            language={selectedLanguage.monacoLanguage}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme={theme === "dark" ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              readOnly,
              padding: { top: 16 },
              fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
              renderLineHighlight: "all",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
            }}
          />
        </div>

        {/* Bottom Panel - Test Cases & Results */}
        <div
          className="border-t bg-card/50 flex flex-col shrink-0"
          style={{ height: isBottomPanelCollapsed ? 40 : bottomPanelHeight }}
        >
          {/* Panel Header with Toggle */}
          <div className="h-10 flex items-center justify-between px-4 bg-muted/30 border-b shrink-0">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1"
                onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
              >
                {isBottomPanelCollapsed ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </Button>

              <div className="flex gap-1">
                <Button
                  variant={activeTab === "testcases" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setActiveTab("testcases")}
                >
                  Test Cases
                </Button>
                <Button
                  variant={activeTab === "results" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setActiveTab("results")}
                >
                  Results
                  {executionResult && (
                    <span
                      className={cn(
                        "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                        executionResult.allPassed
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-rose-500/20 text-rose-500"
                      )}
                    >
                      {executionResult.passedCount}/{executionResult.totalCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                disabled={isRunning || isSubmitting || !code.trim()}
                className="h-7 text-xs gap-1.5"
              >
                {isRunning ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                Run
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting || !code.trim()}
                className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                Submit
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          {!isBottomPanelCollapsed && (
            <div className="flex-1 overflow-hidden">
              {activeTab === "testcases" ? (
                <TestCasesPanel
                  testCases={visibleTestCases}
                  selectedIndex={selectedTestCase}
                  onSelectTestCase={setSelectedTestCase}
                />
              ) : (
                <ResultsPanel result={executionResult} isLoading={isRunning || isSubmitting} isSubmission={isSubmissionResult} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Test Cases Panel Component
interface TestCasesPanelProps {
  testCases: TestCase[];
  selectedIndex: number;
  onSelectTestCase: (index: number) => void;
}

const TestCasesPanel: React.FC<TestCasesPanelProps> = ({
  testCases,
  selectedIndex,
  onSelectTestCase,
}) => {
  const currentCase = testCases[selectedIndex];

  return (
    <div className="h-full flex">
      {/* Test case tabs */}
      <div className="w-32 border-r bg-muted/20 p-2 space-y-1 overflow-y-auto">
        {testCases.map((_, idx) => (
          <Button
            key={idx}
            variant={selectedIndex === idx ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start h-7 text-xs"
            onClick={() => onSelectTestCase(idx)}
          >
            Case {idx + 1}
          </Button>
        ))}
      </div>

      {/* Selected test case details */}
      <div className="flex-1 p-4 overflow-y-auto">
        {currentCase && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Input
              </label>
              <pre className="text-sm font-mono bg-muted/50 p-3 rounded-lg border overflow-x-auto">
                {currentCase.input}
              </pre>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Expected Output
              </label>
              <pre className="text-sm font-mono bg-muted/50 p-3 rounded-lg border text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                {currentCase.expected}
              </pre>
            </div>
            {currentCase.description && (
              <p className="text-xs text-muted-foreground">
                {currentCase.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Results Panel Component
interface ResultsPanelProps {
  result: ExecutionResult | null;
  isLoading: boolean;
  isSubmission?: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, isLoading, isSubmission = false }) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{isSubmission ? "Submitting your solution..." : "Running your code..."}</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Terminal className="mx-auto h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">Run your code to see results</p>
        </div>
      </div>
    );
  }

  // Error state
  if (result.errorType && !result.success) {
    return (
      <div className="h-full p-4 overflow-y-auto">
        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <span className="font-semibold text-rose-600 dark:text-rose-400 capitalize">
              {result.errorType === "RATE_LIMIT" ? "API Limit Reached" : `${result.errorType.replace("_", " ")} Error`}
            </span>
          </div>
          <pre className="text-sm font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap overflow-x-auto">
            {result.errorType === "RATE_LIMIT"
              ? "API limit reached. Try again later."
              : result.error || result.compileOutput}
          </pre>
        </div>
      </div>
    );
  }

  // Success state with test results
  return (
    <div className="h-full p-4 overflow-y-auto">
      {/* Submission Status Banner */}
      {isSubmission && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 mb-4 flex items-center gap-3 border",
            result.allPassed
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
          )}
        >
          {result.allPassed ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ✅ Submission Accepted
                </p>
                <p className="text-xs text-emerald-500 dark:text-emerald-300">
                  All test cases passed! Your solution has been submitted successfully.
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-rose-600 dark:text-rose-400">
                  ❌ Submission Failed
                </p>
                <p className="text-xs text-rose-500 dark:text-rose-300">
                  {result.totalCount - result.passedCount} test case(s) failed. Please review and resubmit.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Summary */}
      <div
        className={cn(
          "rounded-lg px-4 py-3 mb-4 flex items-center justify-between",
          result.allPassed
            ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
            : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
        )}
      >
        <div className="flex items-center gap-3">
          {result.allPassed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          <span
            className={cn(
              "font-semibold",
              result.allPassed
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {result.allPassed ? "All Tests Passed!" : "Some Tests Failed"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Status: {result.status || (result.allPassed ? "Accepted" : "Failed")}</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            {result.passedCount} passed
          </span>
          {result.totalCount - result.passedCount > 0 && (
            <span className="flex items-center gap-1">
              <XCircle size={12} className="text-rose-500" />
              {result.totalCount - result.passedCount} failed
            </span>
          )}
        </div>
      </div>

      {!isSubmission && typeof result.rawOutput === "string" && (
        <div className="rounded-lg border bg-muted/30 p-4 mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">Raw Output</div>
          <pre className="text-sm font-mono bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap">
            {result.rawOutput || "(no output)"}
          </pre>
        </div>
      )}

      {/* Individual test results */}
      <div className="space-y-2">
        {result.results.map((testResult, idx) => (
          <div
            key={idx}
            className={cn(
              "rounded-lg border p-3",
              testResult.passed
                ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                : "border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {testResult.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )}
                <span className="text-sm font-medium">Test Case {idx + 1}</span>
              </div>
              {testResult.executionTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {testResult.executionTime}s
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Input</span>
                <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                  {testResult.input}
                </pre>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Expected Output</span>
                <pre className="text-xs font-mono bg-background p-2 rounded border text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                  {testResult.expected}
                </pre>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Your Output</span>
                <pre className={cn(
                  "text-xs font-mono bg-background p-2 rounded border overflow-x-auto",
                  testResult.passed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}>
                  {testResult.actual || "(no output)"}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeetCodeEditor;
