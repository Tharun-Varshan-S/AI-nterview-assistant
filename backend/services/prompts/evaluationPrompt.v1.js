const version = 'evaluation.v1';

const buildAnswerEvaluationPrompt = ({ question, answer }) => `You are an interview evaluator.\nQuestion: ${question}\nAnswer: ${answer}\n\nRules:\n1) Return STRICT JSON only.\n2) Evaluate this answer independently.\n3) If answer is incomplete, clearly state missing concepts.\n4) Include one concrete issue and one correct concept explanation.\n\nJSON:\n{\n  "score": 0-10,\n  "technicalAccuracy": "string",\n  "clarity": "string",\n  "depth": "string",\n  "strengths": ["string"],\n  "weaknesses": ["string"],\n  "improvements": ["string"],\n  "issue": "string",\n  "correctConcept": "string",\n  "genericFlags": ["string"]\n}\n\nIf uncertain, return: {"fallback": true}`;

const buildSkillGapReportPrompt = ({ strongestSkills = [], weakestSkills = [], allTopicsAttempted = [], averageScore = 0, interviewCount = 0 }) => `You are a career development advisor. Based on interview performance, generate a personalized skill gap report.\n\nPERFORMANCE DATA:\n- Interviews Completed: ${interviewCount}\n- Average Score: ${averageScore}/10\n- Strongest Skills: ${strongestSkills.join(', ') || 'None identified'}\n- Weakest Skills: ${weakestSkills.join(', ') || 'None identified'}\n- Topics Attempted: ${allTopicsAttempted.join(', ') || 'General'}\n\nReturn STRICT JSON ONLY:\n{\n  "strongestSkills": ["string"],\n  "weakestSkills": ["string"],\n  "recommendedFocusAreas": ["string"],\n  "learningSuggestions": ["string"],\n  "estimatedRoadmapWeeks": number,\n  "summary": "string"\n}`;

const schema = {
  requiredKeys: ['score', 'technicalAccuracy', 'clarity', 'depth', 'strengths', 'weaknesses', 'improvements', 'issue', 'correctConcept']
};

module.exports = {
  version,
  buildAnswerEvaluationPrompt,
  buildSkillGapReportPrompt,
  schema
};
