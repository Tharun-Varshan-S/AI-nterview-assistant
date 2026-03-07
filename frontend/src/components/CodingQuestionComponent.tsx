import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import { GlowBadge, MicroButton, PulseIndicator } from './motion';

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
  const [saveLabel, setSaveLabel] = useState('Auto-save pending');
  const [editCount, setEditCount] = useState(0);
  const [typingDurationMs, setTypingDurationMs] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'constraints' | 'examples'>('description');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);

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
        // Ignore invalid local storage content
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
      setSaveLabel(`Saved ${new Date().toLocaleTimeString()}`);
    }, 2000);

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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = e.target.value as SupportedLanguage;
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Coding Question {questionIndex + 1}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{question}</p>
        </div>
        <div className="flex items-center gap-2">
          <PulseIndicator label="Auto-save" />
          {difficultyShift && (
            <GlowBadge label={difficultyShift === 'increased' ? 'difficulty up' : 'difficulty down'} />
          )}
        </div>
      </div>

      <div className="mb-5 flex gap-2 rounded-xl bg-slate-100 p-1">
        {(['description', 'constraints', 'examples'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {activeTab === 'description' && (
          <div className="space-y-2">
            <p>{question}</p>
            {questionData?.inputFormat && <p><span className="font-semibold">Input:</span> {questionData.inputFormat}</p>}
            {questionData?.outputFormat && <p><span className="font-semibold">Output:</span> {questionData.outputFormat}</p>}
          </div>
        )}
        {activeTab === 'constraints' && (
          <ul className="list-disc space-y-1 pl-5">
            {(questionData?.constraints || ['No explicit constraints provided.']).map((constraint, idx) => (
              <li key={`${constraint}-${idx}`}>{constraint}</li>
            ))}
          </ul>
        )}
        {activeTab === 'examples' && (
          <div className="space-y-3">
            {(questionData?.examples?.length ? questionData.examples : [{ input: 'N/A', output: 'N/A', explanation: '' }]).map(
              (example, idx) => (
                <div key={`${example.input}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p><span className="font-semibold">Input:</span> {example.input}</p>
                  <p><span className="font-semibold">Output:</span> {example.output}</p>
                  {example.explanation && <p className="text-slate-600">Explanation: {example.explanation}</p>}
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,70%)_minmax(0,30%)]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-700">
              Language:
              <select
                value={language}
                onChange={handleLanguageChange}
                disabled={isSubmitting || isRunning}
                className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </label>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">{saveLabel}</div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-300" style={{ height: '400px' }}>
            <Editor
              height="100%"
              language={languageToMonaco[language]}
              value={code || fallbackTemplate}
              onChange={handleCodeChange}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                readOnly: false
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{editCount} edits | {(typingDurationMs / 1000).toFixed(1)}s typing time</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Execution Panel</h4>
          {!runResult && <p className="text-xs text-slate-600">Run code to view test results, errors, and complexity.</p>}
          {runResult && (
            <div className="space-y-3">
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${runResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {runResult.passed ? 'Passed' : 'Failed'}
              </div>
              {runResult.error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{runResult.error}</div>
              )}
              <div className="max-h-44 space-y-2 overflow-auto pr-1">
                {runResult.results.map((result, idx) => (
                  <div key={`${result.input}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
                    <p className="font-medium text-slate-700">Test {idx + 1}: {result.passed ? 'Pass' : 'Fail'}</p>
                    <p>Input: {result.input}</p>
                    <p>Expected: {result.expected}</p>
                    <p>Actual: {result.actual}</p>
                  </div>
                ))}
              </div>
              {runResult.complexity && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-xs text-indigo-700">
                  <p>Time: {runResult.complexity.estimatedTimeComplexity}</p>
                  <p>Space: {runResult.complexity.estimatedSpaceComplexity}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <MicroButton
          onClick={handleRunCode}
          disabled={isSubmitting || isRunning || !code.trim()}
          className="border border-indigo-300 bg-white text-indigo-700 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <PlayCircle size={16} />
          {isRunning ? 'Running...' : 'Run Code'}
        </MicroButton>

        <MicroButton
          onClick={() =>
            onSubmit({
              code,
              language,
              questionIndex,
              question,
            })
          }
          disabled={isSubmitting || !code.trim()}
          className="bg-slate-900 text-white disabled:bg-slate-400"
          glow
        >
          {isSubmitting ? (
            <>
              <Sparkles size={16} className="animate-soft-pulse" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Submit Code
            </>
          )}
        </MicroButton>
      </div>
    </div>
  );
};

export default CodingQuestionComponent;
