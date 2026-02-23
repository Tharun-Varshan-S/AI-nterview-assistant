import React, { useMemo } from 'react';

/**
 * SkillAnalyticsDashboard
 * 
 * Displays:
 * - Overall performance metrics
 * - Skill breakdown by topic
 * - Difficulty distribution
 * - Learning velocity
 * - Performance trends
 */
const SkillAnalyticsDashboard = ({ interviews = [] }) => {
  const metrics = useMemo(() => {
    if (!interviews.length) return null;

    const completed = interviews.filter((i) => i.status === 'completed');
    if (!completed.length) return null;

    // Calculate metrics
    const totalScore = completed.reduce((sum, i) => sum + (i.averageScore || 0), 0);
    const avgScore = totalScore / completed.length;

    const theoreticalScores = completed
      .filter((i) => i.theoreticalScore > 0)
      .map((i) => i.theoreticalScore);
    const theoreticalAvg =
      theoreticalScores.length > 0
        ? theoreticalScores.reduce((a, b) => a + b) / theoreticalScores.length
        : 0;

    const codingScores = completed
      .filter((i) => i.codingScore > 0)
      .map((i) => i.codingScore);
    const codingAvg =
      codingScores.length > 0
        ? codingScores.reduce((a, b) => a + b) / codingScores.length
        : 0;

    // Trend calculation
    const sortedByDate = [...completed].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    const trend = sortedByDate.map((i, idx) => ({ idx: idx + 1, score: i.averageScore }));

    // Skill breakdown
    const topicScores = {};
    completed.forEach((interview) => {
      (interview.questionsAsked || []).forEach((question, idx) => {
        const topic = question.topic || 'General';
        const answer = interview.answers?.[idx];
        if (answer) {
          if (!topicScores[topic]) {
            topicScores[topic] = [];
          }
          const score = answer.isCodingAnswer ? answer.aiEvaluation?.logicScore || 0 : answer.aiEvaluation?.score || 0;
          topicScores[topic].push(score);
        }
      });
    });

    const skillBreakdown = Object.entries(topicScores)
      .map(([topic, scores]) => ({
        topic,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        attempts: scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      interviewCount: completed.length,
      overallScore: Math.round(avgScore * 10) / 10,
      theoreticalScore: Math.round(theoreticalAvg * 10) / 10,
      codingScore: Math.round(codingAvg * 10) / 10,
      trend,
      skillBreakdown,
      lastInterviewDate: completed[completed.length - 1].createdAt
    };
  }, [interviews]);

  if (!metrics) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Complete interviews to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Overall Score"
          value={metrics.overallScore}
          max={10}
          color="blue"
        />
        <MetricCard
          label="Theoretical"
          value={metrics.theoreticalScore}
          max={10}
          color="green"
        />
        <MetricCard
          label="Coding"
          value={metrics.codingScore}
          max={10}
          color="purple"
        />
        <MetricCard
          label="Interviews"
          value={metrics.interviewCount}
          max={null}
          color="orange"
        />
      </div>

      {/* Performance Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance Trend</h3>
        <div className="flex items-end justify-center gap-2 h-40">
          {metrics.trend.map((point, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div
                className="bg-blue-500 rounded-t hover:bg-blue-600 transition"
                style={{
                  width: '20px',
                  height: `${(point.score / 10) * 160}px`,
                  minHeight: '4px'
                }}
                title={`Interview ${point.idx}: ${point.score.toFixed(1)}/10`}
              />
              <span className="text-xs text-gray-600 mt-1">{point.idx}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Skills Performance</h3>
        <div className="space-y-3">
          {metrics.skillBreakdown.length === 0 ? (
            <p className="text-gray-500 text-sm">No skill data available yet</p>
          ) : (
            metrics.skillBreakdown.map((skill, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{skill.topic}</span>
                  <span className="text-sm text-gray-600">
                    {skill.avgScore.toFixed(1)}/10 ({skill.attempts} attempts)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(skill.avgScore / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend & Info */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
        <p className="font-semibold mb-2">📊 Analytics Guide:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Overall Score:</strong> Average of all interview scores
          </li>
          <li>
            <strong>Theoretical:</strong> Performance on conceptual questions
          </li>
          <li>
            <strong>Coding:</strong> Performance on coding challenges
          </li>
          <li>
            <strong>Skills:</strong> Topic-wise mastery levels (8+ is strong)
          </li>
        </ul>
      </div>
    </div>
  );
};

/**
 * MetricCard Component
 */
const MetricCard = ({ label, value, max, color }) => {
  const percentage = max ? (value / max) * 100 : null;
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold">{value}</p>
        {max && <p className="text-sm opacity-60">/ {max}</p>}
      </div>
      {percentage !== null && (
        <div className="mt-2 h-1 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SkillAnalyticsDashboard;
