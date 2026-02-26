const version = 'evaluation.v1';

const buildAnswerEvaluationPrompt = ({ question, answer }) => `Evaluate the technical interview answer.\nQuestion: ${question}\nAnswer: ${answer}\n\nReturn STRICT JSON ONLY:\n{\n  "score": 0-10,\n  "technicalAccuracy": "string",\n  "clarity": "string",\n  "depth": "string",\n  "strengths": ["string"],\n  "weaknesses": ["string"],\n  "improvements": ["string"],\n  "genericFlags": ["string"]\n}`;

const buildSkillGapReportPrompt = ({ strongestSkills = [], weakestSkills = [], allTopicsAttempted = [], averageScore = 0, interviewCount = 0 }) => `You are a career development advisor. Based on interview performance, generate a personalized skill gap report.\n\nPERFORMANCE DATA:\n- Interviews Completed: ${interviewCount}\n- Average Score: ${averageScore}/10\n- Strongest Skills: ${strongestSkills.join(', ') || 'None identified'}\n- Weakest Skills: ${weakestSkills.join(', ') || 'None identified'}\n- Topics Attempted: ${allTopicsAttempted.join(', ') || 'General'}\n\nReturn STRICT JSON ONLY:\n{\n  "strongestSkills": ["string"],\n  "weakestSkills": ["string"],\n  "recommendedFocusAreas": ["string"],\n  "learningSuggestions": ["string"],\n  "estimatedRoadmapWeeks": number,\n  "summary": "string"\n}`;

const schema = {
  requiredKeys: ['score', 'technicalAccuracy', 'clarity', 'depth', 'strengths', 'weaknesses', 'improvements']
};

module.exports = {
  version,
  buildAnswerEvaluationPrompt,
  buildSkillGapReportPrompt,
  schema
};
