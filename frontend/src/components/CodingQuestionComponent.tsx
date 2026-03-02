import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { GlowBadge, MicroButton, PulseIndicator } from './motion';

type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp';

interface CodingSubmitPayload {
  code: string;
  language: SupportedLanguage;
  questionIndex: number;
  question: string;
}

interface CodingQuestionComponentProps {
  question: string;
  questionIndex: number;
  onSubmit: (payload: CodingSubmitPayload) => void;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onMetricsChange?: (metrics: { editCount: number; typingDurationMs: number }) => void;
  isSubmitting?: boolean;
  difficultyShift?: 'increased' | 'decreased' | null;
}

const templates: Record<SupportedLanguage, string> = {
  javascript: `// Write your JavaScript solution here
function solve() {
  // Your code here
  return result;
}

// Test your code
console.log(solve());`,
  python: `# Write your Python solution here
def solve():
    # Your code here
    return result

# Test your code
if __name__ == "__main__":
    print(solve())`,
  java: `// Write your Java solution here
public class Solution {
    public void solve() {
        // Your code here
    }

    public static void main(String[] args) {
        new Solution().solve();
    }
}`,
  cpp: `// Write your C++ solution here
#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
};

const CodingQuestionComponent = ({
  question,
  questionIndex,
  onSubmit,
  onCodeChange,
  onMetricsChange,
  isSubmitting = false,
  difficultyShift,
}: CodingQuestionComponentProps) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [showTips, setShowTips] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [typingStartedAt, setTypingStartedAt] = useState<number | null>(null);
  const [flashEditor, setFlashEditor] = useState(false);

  const saveLabel = useMemo(() => {
    if (!savedAt) return 'Auto-save pending';
    return `Saved ${savedAt.toLocaleTimeString()}`;
  }, [savedAt]);

  useEffect(() => {
    const nextCode = templates[language] || templates.javascript;
    setCode(nextCode);
    setEditCount(0);
    setTypingStartedAt(null);
    setFlashEditor(true);
    window.setTimeout(() => setFlashEditor(false), 380);
    onMetricsChange?.({ editCount: 0, typingDurationMs: 0 });
    onCodeChange?.(nextCode, language);
  }, [language, onCodeChange, onMetricsChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        `coding_answer_${questionIndex}`,
        JSON.stringify({ code, language, timestamp: new Date().toISOString() })
      );
      setSavedAt(new Date());
    }, 1800);

    return () => clearTimeout(timer);
  }, [code, language, questionIndex]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as SupportedLanguage;
    setLanguage(newLanguage);
    const template = templates[newLanguage] || '';
    setCode(template);
    onCodeChange?.(template, newLanguage);
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      alert('Please write some code before submitting');
      return;
    }

    onSubmit({
      code,
      language,
      questionIndex,
      question,
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/75 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Coding Question {questionIndex + 1}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{question}</p>
        </div>
        <div className="flex items-center gap-2">
          <PulseIndicator label="Auto-save" />
          {difficultyShift && (
            <GlowBadge label={difficultyShift === 'increased' ? 'difficulty up' : 'difficulty down'} />
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-medium text-zinc-700">
          Language:
          <select
            value={language}
            onChange={handleLanguageChange}
            disabled={isSubmitting}
            className="ml-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </label>

        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-soft-pulse" />
          {saveLabel}
        </div>
      </div>

      <div
        className={`mb-5 overflow-hidden rounded-xl border border-zinc-300 ${
          flashEditor ? 'ring-2 ring-cyan-300/60 transition duration-300' : ''
        }`}
        style={{ height: '400px' }}
      >
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => {
            const nextCode = value || '';
            const now = Date.now();
            if (typingStartedAt === null) {
              setTypingStartedAt(now);
            }
            const nextEditCount = editCount + 1;
            setEditCount(nextEditCount);
            setCode(nextCode);
            const typingDurationMs = now - (typingStartedAt ?? now);
            onMetricsChange?.({ editCount: nextEditCount, typingDurationMs });
            onCodeChange?.(nextCode, language);
          }}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <MicroButton
          onClick={handleSubmit}
          disabled={isSubmitting || !code.trim()}
          className="bg-zinc-900 text-white disabled:bg-zinc-400"
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

        <MicroButton
          onClick={() => setShowTips((prev) => !prev)}
          className="border border-zinc-300 bg-white text-zinc-700"
        >
          {showTips ? 'Hide Tips' : 'Show Tips'}
        </MicroButton>
      </div>

      {showTips && (
        <div className="mt-4 animate-fade-up rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-cyan-900">Code Writing Tips</h4>
          <ul className="space-y-1 text-sm text-cyan-800">
            <li>Think through edge cases before coding.</li>
            <li>Use clear naming and readable structure.</li>
            <li>Describe complexity briefly in comments.</li>
            <li>Validate with sample inputs before submit.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodingQuestionComponent;
