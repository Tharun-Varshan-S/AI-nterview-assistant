const version = 'coding.v1';

const buildCodingEvaluationPrompt = ({ question, code, language }) => `You are a code reviewer for an interview platform. Evaluate this code solution.\n\nQuestion: ${question}\nLanguage: ${language}\nCode:\n${code}\n\nReturn STRICT JSON ONLY:\n{\n  "logicScore": 0-10,\n  "readabilityScore": 0-10,\n  "edgeCaseHandling": "string",\n  "timeComplexity": "string",\n  "spaceComplexity": "string",\n  "improvementSuggestions": ["string"],\n  "genericFlags": ["string"]\n}`;

const buildExecutionSimulationPrompt = ({ question, code, language, testCases = [] }) => `You are a strict execution simulator for code interview answers in languages that cannot be executed directly.\n\nQuestion: ${question}\nLanguage: ${language}\nCode:\n${code}\n\nTest cases:\n${JSON.stringify(testCases)}\n\nReturn STRICT JSON ONLY:\n{\n  "testCasesPassed": number,\n  "totalTestCases": number,\n  "runtimeError": "string|null",\n  "executionTimeMs": number,\n  "executionScore": 0-10\n}`;

const buildTestCaseGenerationPrompt = ({ question, language }) => `Generate test cases for this coding question.\nQuestion: ${question}\nLanguage: ${language}\n\nReturn STRICT JSON ONLY:\n{\n  "testCases": [\n    {\n      "input": ["any"],\n      "expectedOutput": "any",\n      "description": "string"\n    }\n  ]\n}`;

const schema = {
  requiredKeys: ['logicScore', 'readabilityScore', 'edgeCaseHandling', 'timeComplexity', 'spaceComplexity', 'improvementSuggestions']
};

module.exports = {
  version,
  buildCodingEvaluationPrompt,
  buildExecutionSimulationPrompt,
  buildTestCaseGenerationPrompt,
  schema
};
