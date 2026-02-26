import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

/**
 * CodingQuestionComponent
 * 
 * Handles coding interview questions with:
 * - Language selection (JavaScript, Python, Java, C++)
 * - Monaco editor for code writing
 * - Auto-save functionality
 * - Code submission
 */
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
  isSubmitting?: boolean;
}

const CodingQuestionComponent = ({
  question,
  questionIndex,
  onSubmit,
  onCodeChange,
  isSubmitting = false
}: CodingQuestionComponentProps) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [showOutput, setShowOutput] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Language templates
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
}`
  };

  // Initialize with template
  useEffect(() => {
    const nextCode = templates[language] || templates.javascript;
    setCode(nextCode);
    if (onCodeChange) {
      onCodeChange(nextCode, language);
    }
  }, [language, onCodeChange]);

  // Auto-save to local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        `coding_answer_${questionIndex}`,
        JSON.stringify({ code, language, timestamp: new Date() })
      );
      setSavedAt(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, language, questionIndex]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as SupportedLanguage;
    setLanguage(newLanguage);
    setCode(templates[newLanguage] || '');
    if (onCodeChange) {
      onCodeChange(templates[newLanguage] || '', newLanguage);
    }
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
      question
    });
  };

  return (
    <div className="coding-question-container p-6 bg-gray-50 rounded-lg">
      {/* Question Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Question {questionIndex + 1}
        </h3>
        <p className="text-gray-700 whitespace-pre-wrap">{question}</p>
      </div>

      {/* Language Selector */}
      <div className="mb-4 flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Language:
          <select
            value={language}
            onChange={handleLanguageChange}
            disabled={isSubmitting}
            className="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </label>

        <div className="text-sm text-gray-500">
          {savedAt ? `Auto-saved at ${savedAt.toLocaleTimeString()}` : ''}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => {
            const nextCode = value || '';
            setCode(nextCode);
            if (onCodeChange) {
              onCodeChange(nextCode, language);
            }
          }}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false
          }}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !code.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Code'}
        </button>

        <button
          onClick={() => setShowOutput(!showOutput)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          {showOutput ? 'Hide' : 'Show'} Code Tips
        </button>
      </div>

      {/* Code Tips */}
      {showOutput && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Code Writing Tips:</h4>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Think about edge cases (empty input, negative numbers, etc.)</li>
            <li>Write clean, readable code with proper indentation</li>
            <li>Add comments to explain your approach</li>
            <li>Consider time and space complexity</li>
            <li>Test your logic with sample inputs before submitting</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodingQuestionComponent;
