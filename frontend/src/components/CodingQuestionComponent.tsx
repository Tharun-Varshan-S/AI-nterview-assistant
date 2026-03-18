import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle2, PlayCircle, Sparkles, Terminal, Book, ListChecks, Hash, Code2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp';

interface CodingSubmitPayload {
  code: string;
  language: SupportedLanguage;
  questionIndex: number;
  question: string;
}

interface RunCodePayload {
  code: string;
  language: SupportedLanguage;
  questionIndex: number;
}

interface RunCodeResult {
  passed: boolean;
  results: Array<{ input: string; expected: string; actual: string; passed: boolean; description?: string }>;
  error: string | null;
  complexity?: {
    lines: number;
    hasNestedLoops: boolean;
    hasRecursion: boolean;
    estimatedTimeComplexity: string;
    estimatedSpaceComplexity: string;
  };
}

interface CodingQuestionData {
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  template?: string;
}

interface CodingQuestionComponentProps {
  question: string;
  questionIndex: number;
  questionData?: CodingQuestionData;
  storageKeyPrefix: string;
  onSubmit: (payload: CodingSubmitPayload) => void;
  onRun: (payload: RunCodePayload) => Promise<RunCodeResult | null>;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onMetricsChange?: (metrics: { editCount: number; typingDurationMs: number }) => void;
  isSubmitting?: boolean;
  difficultyShift?: 'increased' | 'decreased' | null;
}

const templates: Record<SupportedLanguage, string> = {
  javascript: `function solve(input) {
  // Write your solution
  return input;
}`,
  python: `def solve(input_data):
    # Write your solution
    return input_data`,
  java: `public class Solution {
    public static Object solve(Object input) {
        // Write your solution
        return input;
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

string solve(string input) {
    // Write your solution
    return input;
}`,
};

const languageToMonaco: Record<SupportedLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
};

const getStorageKey = (prefix: string, questionIndex: number) => `${prefix}_${questionIndex}`;

const CodingQuestionComponent = ({
  question,
  questionIndex,
  questionData,
  storageKeyPrefix,
  onSubmit,
  onRun,
  onCodeChange,
  onMetricsChange,
  isSubmitting = false,
  difficultyShift,
}: CodingQuestionComponentProps) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [saveLabel, setSaveLabel] = useState('Sync pending');
  const [editCount, setEditCount] = useState(0);
  const [typingDurationMs, setTypingDurationMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const { theme } = useTheme();

  const typingStartedAtRef = useRef<number | null>(null);
  const storageKey = useMemo(() => getStorageKey(storageKeyPrefix, questionIndex), [storageKeyPrefix, questionIndex]);
  const fallbackTemplate = useMemo(
    () => questionData?.template?.trim() || templates[language],
    [language, questionData?.template]
  );

  useEffect(() => {
    let nextLanguage: SupportedLanguage = 'javascript';
    let nextCode = questionData?.template?.trim() || templates.javascript;
    const savedStateRaw = localStorage.getItem(storageKey);
    if (savedStateRaw) {
      try {
        const parsed = JSON.parse(savedStateRaw);
        if (['javascript', 'python', 'java', 'cpp'].includes(parsed?.language)) {
          nextLanguage = parsed.language;
        }
        if (typeof parsed?.code === 'string' && parsed.code.trim()) {
          nextCode = parsed.code;
        }
      } catch {
        // Ignore invalid local storage
      }
    }

    setLanguage(nextLanguage);
    setCode(nextCode);
    setEditCount(0);
    setTypingDurationMs(0);
    setRunResult(null);
    typingStartedAtRef.current = null;
    onCodeChange?.(nextCode, nextLanguage);
    onMetricsChange?.({ editCount: 0, typingDurationMs: 0 });
  }, [questionIndex, questionData?.template, storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          code,
          language,
          timestamp: new Date().toISOString()
        })
      );
      setSaveLabel(`Verified Sync: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [code, language, storageKey]);

  const handleCodeChange = (value: string | undefined) => {
    const nextCode = value || '';
    const now = Date.now();
    if (typingStartedAtRef.current === null) {
      typingStartedAtRef.current = now;
    }
    const nextEditCount = editCount + 1;
    const nextTypingDuration = now - (typingStartedAtRef.current || now);
    setCode(nextCode);
    setEditCount(nextEditCount);
    setTypingDurationMs(nextTypingDuration);
    onCodeChange?.(nextCode, language);
    onMetricsChange?.({ editCount: nextEditCount, typingDurationMs: nextTypingDuration });
  };

  const handleLanguageChange = (val: string) => {
    const nextLanguage = val as SupportedLanguage;
    const nextCode = templates[nextLanguage];
    setLanguage(nextLanguage);
    setCode(nextCode);
    setRunResult(null);
    onCodeChange?.(nextCode, nextLanguage);
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;
    try {
      setIsRunning(true);
      const result = await onRun({ code, language, questionIndex });
      setRunResult(result);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden bg-white dark:bg-zinc-950/40 backdrop-blur-md">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-6 bg-zinc-50/50 dark:bg-zinc-900/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="h-6 font-mono font-bold text-[10px] tracking-widest px-2 uppercase">
                  Segment {questionIndex + 1}
                </Badge>
                {difficultyShift && (
                  <Badge variant="outline" className={cn(
                    "h-6 font-bold text-[9px] uppercase tracking-widest px-2 border-0",
                    difficultyShift === 'increased' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {difficultyShift === 'increased' ? 'ADAPTING UP' : 'ADAPTING DOWN'}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-heading font-bold tracking-tight">Algorithmic Assessment</CardTitle>
              <CardDescription className="text-sm font-medium text-zinc-500 whitespace-pre-wrap">{question}</CardDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <Save size={10} /> {saveLabel}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Live Session</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-zinc-900">
            {/* Left Panel: Description, Constraints, Examples */}
            <div className="w-full lg:w-[400px] bg-zinc-50/30 dark:bg-transparent overflow-hidden">
              <Tabs defaultValue="description" className="w-full h-full flex flex-col">
                <TabsList className="h-14 w-full justify-start rounded-none bg-zinc-50/50 dark:bg-zinc-900/20 px-6 border-b border-zinc-100 dark:border-zinc-900 gap-6">
                  <TabsTrigger value="description" className="p-0 h-full bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-50 text-[10px] font-bold uppercase tracking-widest gap-2">
                    <Book size={12} /> Description
                  </TabsTrigger>
                  <TabsTrigger value="constraints" className="p-0 h-full bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-50 text-[10px] font-bold uppercase tracking-widest gap-2">
                    <ListChecks size={12} /> Constraints
                  </TabsTrigger>
                  <TabsTrigger value="examples" className="p-0 h-full bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-50 text-[10px] font-bold uppercase tracking-widest gap-2">
                    <Code2 size={12} /> Examples
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 p-8 overflow-y-auto max-h-[600px]">
                  <TabsContent value="description" className="mt-0 space-y-6">
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">{question}</p>
                      {questionData?.inputFormat && (
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Input Specification</span>
                          <p className="text-sm font-semibold">{questionData.inputFormat}</p>
                        </div>
                      )}
                      {questionData?.outputFormat && (
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Output Specification</span>
                          <p className="text-sm font-semibold">{questionData.outputFormat}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="constraints" className="mt-0">
                    <div className="space-y-4">
                      {(questionData?.constraints || ['Operational parameters remain within normal limits.']).map((constraint, idx) => (
                        <div key={idx} className="flex gap-4 items-start group">
                          <div className="mt-1 flex items-center justify-center h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 py-1">{constraint}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="examples" className="mt-0 space-y-6">
                    {(questionData?.examples?.length ? questionData.examples : [{ input: 'N/A', output: 'N/A', explanation: 'Generic case' }]).map((example, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Hash size={12} className="text-zinc-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Example Input {idx + 1}</span>
                        </div>
                        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden font-mono text-[11px]">
                          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500">Input:</span> {example.input}
                          </div>
                          <div className="bg-white dark:bg-zinc-950 px-4 py-3">
                            <span className="text-emerald-500 dark:text-emerald-400 font-bold">Output:</span> {example.output}
                          </div>
                          {example.explanation && (
                            <div className="bg-zinc-50/50 dark:bg-zinc-900/10 px-4 py-3 text-zinc-500 italic scale-95 origin-left">
                              {example.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Right Panel: Editor and Execution */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950/20">
              <div className="h-14 flex items-center justify-between px-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Environment</span>
                  <Select value={language} onValueChange={handleLanguageChange} disabled={isSubmitting || isRunning}>
                    <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-tight">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <SelectItem value="javascript" className="text-[11px] font-medium uppercase">JavaScript</SelectItem>
                      <SelectItem value="python" className="text-[11px] font-medium uppercase">Python</SelectItem>
                      <SelectItem value="java" className="text-[11px] font-medium uppercase">Java</SelectItem>
                      <SelectItem value="cpp" className="text-[11px] font-medium uppercase">C++</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[9px] font-bold text-zinc-400 font-mono tracking-tighter hidden md:inline">
                    EDITS: {editCount} • SYNC: TRUE
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-[460px] relative">
                <Editor
                  height="100%"
                  language={languageToMonaco[language]}
                  value={code || fallbackTemplate}
                  onChange={handleCodeChange}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    padding: { top: 20 },
                    fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace'
                  }}
                />
              </div>

              {/* Execution Summary Overlay */}
              {runResult && (
                <div className="h-44 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 flex flex-col shrink-0 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="h-10 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal size={12} className="text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Execution Telemetry</span>
                    </div>
                    <Badge variant={runResult.passed ? "secondary" : "destructive"} className="h-5 text-[9px] font-bold uppercase tracking-[0.15em] px-2">
                      {runResult.passed ? 'PROTOCOL PASSED' : 'RECOVERY REQUIRED'}
                    </Badge>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Logic Validation</div>
                        <div className="space-y-1.5">
                          {runResult.results.map((r, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", r.passed ? "bg-emerald-500" : "bg-rose-500")} />
                              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">Test_{i + 1}: {r.passed ? 'Success' : 'Failure'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {runResult.complexity && (
                        <div className="space-y-3">
                          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Spectral Complexity</div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              <span className="text-[10px] font-bold text-zinc-400">TIME</span>
                              <code className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{runResult.complexity.estimatedTimeComplexity}</code>
                            </div>
                            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              <span className="text-[10px] font-bold text-zinc-400">SPACE</span>
                              <code className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{runResult.complexity.estimatedSpaceComplexity}</code>
                            </div>
                          </div>
                        </div>
                      )}
                      {runResult.error && (
                        <div className="lg:col-span-1 space-y-3">
                          <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Stack Trace</div>
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 font-mono text-[10px] text-rose-600 dark:text-rose-400 max-h-24 overflow-auto">
                            {runResult.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-white/30 dark:bg-transparent flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleRunCode}
              disabled={isSubmitting || isRunning || !code.trim()}
              className="h-12 px-6 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 group transition-all"
            >
              {isRunning ? (
                <>
                  <div className="h-3 w-3 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mr-3" />
                  Warping...
                </>
              ) : (
                <>
                  <PlayCircle size={16} className="mr-3 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 transition-colors" />
                  Verify Integrity
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={() =>
              onSubmit({
                code,
                language,
                questionIndex,
                question,
              })
            }
            disabled={isSubmitting || !code.trim()}
            className="h-12 px-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-2xl transition-all"
          >
            {isSubmitting ? (
              <>
                <Sparkles size={16} className="mr-3 animate-pulse" />
                Finalizing Data...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-3" />
                Finalize Submission
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-center flex-wrap gap-12 py-4">
        <div className="text-center space-y-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Language Standard</p>
          <div className="text-sm font-bold uppercase">{language}</div>
        </div>
        <Separator orientation="vertical" className="h-12" />
        <div className="text-center space-y-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Session Entropy</p>
          <div className="text-sm font-bold uppercase">{editCount} Blocks</div>
        </div>
        <Separator orientation="vertical" className="h-12" />
        <div className="text-center space-y-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Typing Velocity</p>
          <div className="text-sm font-bold uppercase">{(typingDurationMs / 1000).toFixed(1)}s</div>
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionComponent;
