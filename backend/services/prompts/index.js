const resumePrompt = require('./resumePrompt.v1');
const questionPrompt = require('./questionPrompt.v1');
const evaluationPrompt = require('./evaluationPrompt.v1');
const codingPrompt = require('./codingPrompt.v1');

const ensureRequiredKeys = (obj, requiredKeys = []) => {
  if (!obj || typeof obj !== 'object') return false;
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(obj, key));
};

const buildPromptPayload = ({ prompt, version, schema, fallback = null }) => ({
  prompt,
  version,
  schema,
  fallback
});

module.exports = {
  resumePrompt,
  questionPrompt,
  evaluationPrompt,
  codingPrompt,
  ensureRequiredKeys,
  buildPromptPayload
};
