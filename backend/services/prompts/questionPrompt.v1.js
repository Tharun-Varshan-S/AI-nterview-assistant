const version = 'question.v1';

const buildQuestionPrompt = ({ structuredData, rawText, focusTopics = [] }) => {
  let domainContext = '';
  if (structuredData) {
    const skills = structuredData.skills?.join(', ') || 'General';
    const technologies = structuredData.technologies?.join(', ') || 'N/A';
    domainContext = `Domain: ${structuredData.primaryDomain || 'General'}\nSkills: ${skills}\nTechnologies: ${technologies}\nYears of Exp: ${structuredData.experienceYears || 0}`;
  } else {
    domainContext = `Context extracted from raw text: ${(rawText || '').substring(0, 1000)}`;
  }

  const focusTopicsText = focusTopics.length > 0 ? `Prioritize these topics: ${focusTopics.join(', ')}.` : '';

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
      "difficulty": "easy|medium|hard",
      "topic": "string",
      "domain": "string",
      "timeLimit": number,
      "isCoding": boolean,
      "testCases": [
        { "input": ["any"], "expectedOutput": "any", "description": "string" }
      ]
    }
  ]
}

REQUIREMENTS:
- Generate exactly 6 questions.
- Difficulty split: 2 easy, 2 medium, 2 hard.
- Each question must have a unique topic.
- Keep each question under 35 words.
- Keep topic under 4 words.
- isCoding should be true for at most 2 questions.
- For isCoding=true, include exactly 2 concise testCases.
- For isCoding=false, return an empty testCases array.
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
