class SkillTrajectoryEngine {
  static getMasteryLevel(score) {
    if (score >= 8.5) return 'Expert';
    if (score >= 7) return 'Advanced';
    if (score >= 5.5) return 'Intermediate';
    if (score >= 4) return 'Beginner';
    return 'Novice';
  }

  static linearSlope(values = []) {
    if (!Array.isArray(values) || values.length < 2) return 0;

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;
    values.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) * (x - xMean);
    });

    return denominator === 0 ? 0 : numerator / denominator;
  }

  static detectPlateau(values = []) {
    if (values.length < 3) return false;
    const recent = values.slice(-3);
    const max = Math.max(...recent);
    const min = Math.min(...recent);
    return max - min < 0.4;
  }

  static computeTopicTrajectory(topic, scores = []) {
    const rollingWindow = scores.slice(-5);
    const rollingAverage = rollingWindow.length
      ? rollingWindow.reduce((sum, s) => sum + s, 0) / rollingWindow.length
      : 0;

    const slope = this.linearSlope(scores);
    const plateauDetected = this.detectPlateau(scores);

    return {
      topic,
      currentLevel: this.getMasteryLevel(rollingAverage),
      growthRate: Number(slope.toFixed(2)),
      plateauDetected,
      improvementTrend: slope > 0.1 ? 'Upward' : slope < -0.1 ? 'Declining' : 'Stable',
      rollingAverage: Number(rollingAverage.toFixed(2))
    };
  }

  static buildForInterviewHistory(interviews = []) {
    const topicScores = {};

    const completed = interviews
      .filter((i) => i.status === 'completed')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    completed.forEach((interview) => {
      const performance = interview.skillPerformance instanceof Map
        ? Object.fromEntries(interview.skillPerformance.entries())
        : (interview.skillPerformance || {});

      Object.entries(performance).forEach(([topic, data]) => {
        if (!topicScores[topic]) topicScores[topic] = [];
        topicScores[topic].push(Number(data?.score || 0));
      });
    });

    return Object.entries(topicScores).map(([topic, scores]) =>
      this.computeTopicTrajectory(topic, scores)
    );
  }
}

module.exports = SkillTrajectoryEngine;
