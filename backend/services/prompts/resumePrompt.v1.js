const version = 'resume.v1';

const buildResumePrompt = (resumeText) => `You are a professional resume parser. Analyze the provided text.\nReturn STRICT JSON ONLY. No explanation.\n\nIf it is NOT a resume (e.g., a recipe, a book, random text, or extremely sparse), set isResume=false.\n\nResponse format:\n{\n  "isResume": true,\n  "confidence": 0-100,\n  "skills": ["string"],\n  "technologies": ["string"],\n  "experienceYears": number,\n  "education": ["string"],\n  "primaryDomain": "string"\n}\n\nTEXT:\n${resumeText}`;

const schema = {
  requiredKeys: ['isResume', 'confidence', 'skills', 'technologies', 'experienceYears', 'education', 'primaryDomain']
};

module.exports = {
  version,
  buildResumePrompt,
  schema
};
