const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeLearningVelocity = (velocity) => {
  const scaled = ((Number(velocity) || 0) + 5) * 10;
  return clamp(scaled, 0, 100);
};

const getLevel = (readinessScore) => {
  if (readinessScore >= 70) return 'Ready';
  if (readinessScore >= 45) return 'Improving';
  return 'Not Ready';
};

const calculate = ({
  avgInterviewScore = 0,
  codingAccuracy = 0,
  consistencyScore = 0,
  learningVelocity = 0
}) => {
  const avgInterviewPercent = clamp((Number(avgInterviewScore) || 0) * 10, 0, 100);
  const codingPercent = clamp((Number(codingAccuracy) || 0) * 10, 0, 100);
  const consistencyPercent = clamp((Number(consistencyScore) || 0) * 10, 0, 100);
  const learningVelocityNormalized = normalizeLearningVelocity(learningVelocity);

  const readinessScore = Math.round(
    (0.4 * avgInterviewPercent) +
    (0.3 * codingPercent) +
    (0.2 * consistencyPercent) +
    (0.1 * learningVelocityNormalized)
  );

  return {
    readinessScore,
    level: getLevel(readinessScore),
    learningVelocityNormalized: Number(learningVelocityNormalized.toFixed(2))
  };
};

module.exports = {
  calculate
};
