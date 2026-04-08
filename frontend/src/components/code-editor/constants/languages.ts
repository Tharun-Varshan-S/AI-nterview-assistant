// Judge0 Language Definitions
// Language IDs compatible with local self-hosted Judge0 instance

export interface Language {
  id: number;
  name: string;
  label: string;
  value: string;
  monacoLanguage: string;
}

// Primary languages for interview platform (most commonly used)
export const PRIMARY_LANGUAGES: Language[] = [
  {
    id: 71,
    name: "Python (3.8.1)",
    label: "Python 3",
    value: "python3",
    monacoLanguage: "python",
  },
  {
    id: 63,
    name: "JavaScript (Node.js 12.14.0)",
    label: "JavaScript",
    value: "javascript",
    monacoLanguage: "javascript",
  },
  {
    id: 62,
    name: "Java (OpenJDK 13.0.1)",
    label: "Java",
    value: "java",
    monacoLanguage: "java",
  },
  {
    id: 54,
    name: "C++ (GCC 9.2.0)",
    label: "C++",
    value: "cpp",
    monacoLanguage: "cpp",
  },
  {
    id: 50,
    name: "C (GCC 9.2.0)",
    label: "C",
    value: "c",
    monacoLanguage: "c",
  },
  {
    id: 74,
    name: "TypeScript (3.7.4)",
    label: "TypeScript",
    value: "typescript",
    monacoLanguage: "typescript",
  },
];

// Extended languages (if needed)
export const ALL_LANGUAGES: Language[] = [
  ...PRIMARY_LANGUAGES,
  {
    id: 60,
    name: "Go (1.13.5)",
    label: "Go",
    value: "go",
    monacoLanguage: "go",
  },
  {
    id: 72,
    name: "Ruby (2.7.0)",
    label: "Ruby",
    value: "ruby",
    monacoLanguage: "ruby",
  },
  {
    id: 73,
    name: "Rust (1.40.0)",
    label: "Rust",
    value: "rust",
    monacoLanguage: "rust",
  },
  {
    id: 78,
    name: "Kotlin (1.3.70)",
    label: "Kotlin",
    value: "kotlin",
    monacoLanguage: "kotlin",
  },
  {
    id: 83,
    name: "Swift (5.2.3)",
    label: "Swift",
    value: "swift",
    monacoLanguage: "swift",
  },
  {
    id: 51,
    name: "C# (Mono 6.6.0.161)",
    label: "C#",
    value: "csharp",
    monacoLanguage: "csharp",
  },
];

// Helper function to get language by id
export const getLanguageById = (id: number): Language | undefined => {
  return ALL_LANGUAGES.find((lang) => lang.id === id);
};

// Helper function to get language by value
export const getLanguageByValue = (value: string): Language | undefined => {
  return ALL_LANGUAGES.find((lang) => lang.value === value);
};

// Default language
export const DEFAULT_LANGUAGE = PRIMARY_LANGUAGES[0]; // Python 3
