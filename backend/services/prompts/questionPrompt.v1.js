const version = 'question.v2';

const buildQuestionPrompt = ({ structuredData, rawText, focusTopics = [], interviewType = 'theoretical', questionCount = 6 }) => {
  let domainContext = '';
  if (structuredData) {
    const skills = structuredData.skills?.join(', ') || 'General';
    const technologies = structuredData.technologies?.join(', ') || 'N/A';
    domainContext = `Domain: ${structuredData.primaryDomain || 'General'}\nSkills: ${skills}\nTechnologies: ${technologies}\nYears of Exp: ${structuredData.experienceYears || 0}`;
  } else {
    domainContext = `Context extracted from raw text: ${(rawText || '').substring(0, 1000)}`;
  }

  const focusTopicsText = focusTopics.length > 0 ? `Prioritize these topics: ${focusTopics.join(', ')}.` : '';
  const safeCount = Number.isFinite(Number(questionCount)) ? Math.max(3, Math.min(10, Number(questionCount))) : 6;
  const typeMode = ['theoretical', 'coding', 'mixed'].includes(interviewType) ? interviewType : 'theoretical';

  const compositionRule = typeMode === 'coding'
    ? '- ALL questions must be coding questions.\n- type must always be "coding".\n- isCoding must always be true.'
    : typeMode === 'theoretical'
      ? '- ALL questions must be conceptual/theoretical.\n- type must always be "theoretical".\n- isCoding must always be false.\n- testCases must be empty arrays.'
      : '- Mixed mode: exactly 3 coding and 3 theoretical when questionCount is 6. If questionCount differs, keep ~50/50 split.\n- Coding questions use type="coding", theoretical use type="theoretical".';

  return `You are an AI Interview System. Generate adaptive interview questions with detailed metadata.

STRICT OUTPUT RULES:
1. Return ONLY valid JSON.
2. Do NOT include markdown.
3. Do NOT include code fences.
4. Response must be directly parsable by JSON.parse().
5. Use only double-quoted strings.

JSON STRUCTURE:
{
  "questions": [
    {
      "question": "string",
      "type": "coding|theoretical",
      "difficulty": "easy|medium|hard",
      "topic": "string",
      "domain": "string",
      "timeLimit": number,
      "isCoding": boolean,
      "inputFormat": "string",
      "outputFormat": "string",
      "constraints": ["string"],
      "examples": [
        { "input": "string", "output": "string", "explanation": "string" }
      ],
      "template": "string",
      "testCases": [
        { "input": ["any"], "expectedOutput": "any", "description": "string" }
      ]
    }
  ]
}

REQUIREMENTS:
- Generate exactly ${safeCount} questions.
- Difficulty split should be balanced across easy/medium/hard.
- Each question must have a unique topic.
- Keep each question under 80 words.
- Keep topic under 4 words.
- ${compositionRule}
- For coding questions:
  - Provide problem statement, inputFormat, outputFormat, constraints, at least 1 example, template.
  - Include 2-4 testCases with machine-readable input and expectedOutput.
- For theoretical questions:
  - inputFormat="", outputFormat="", constraints=[], examples=[], template="".
  - testCases must be [].
- Match candidate skills: ${structuredData?.skills?.join(', ') || 'General'}
- ${focusTopicsText}

CANDIDATE INFO:
${domainContext}`;
};

const schema = {
  requiredKeys: ['questions']
};

module.exports = {
  version,
  buildQuestionPrompt,
  schema
};
