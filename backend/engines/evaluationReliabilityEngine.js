class EvaluationReliabilityEngine {
  static genericPatternCount(text = '') {
    const patterns = [
      'good answer',
      'it depends',
      'best practice',
      'in general',
      'optimize',
      'scalable',
      'industry standard'
    ];

    const lower = text.toLowerCase();
    return patterns.reduce((count, pattern) => (lower.includes(pattern) ? count + 1 : count), 0);
  }

  static calculateEvaluationReliability({ response = '', attemptScores = [] }) {
    const responseLength = response.trim().length;

    let reliability = 1;

    if (responseLength < 40) reliability -= 0.35;
    else if (responseLength < 100) reliability -= 0.2;

    const genericHits = this.genericPatternCount(response);
    reliability -= Math.min(0.25, genericHits * 0.08);

    if (attemptScores.length > 1) {
      const mean = attemptScores.reduce((sum, s) => sum + s, 0) / attemptScores.length;
      const variance = attemptScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / attemptScores.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 2.5) reliability -= 0.2;
      else if (stdDev > 1.5) reliability -= 0.1;
    }

    const normalized = Math.max(0.1, Math.min(1, reliability));

    return {
      evaluationReliability: Number(normalized.toFixed(2)),
      aiConfidenceScore: Math.round(normalized * 100),
      responseLength
    };
  }
}

module.exports = EvaluationReliabilityEngine;
