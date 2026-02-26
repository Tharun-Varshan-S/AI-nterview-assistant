import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Interview, SkillPerformance, DifficultyBreakdown } from '../services/api';

interface SkillAnalyticsDashboardProps {
  interviews: Interview[];
}

interface AggregatedMetrics {
  interviewCount: number;
  overallScore: number;
  theoreticalScore: number;
  codingScore: number;
  strongestSkill: string;
  weakestSkill: string;
  trend: Array<{ name: string; score: number }>;
  difficultyData: Array<{ level: string; attempted: number }>;
}

function normalizeSkillPerformance(
  skillPerformance: Interview['skillPerformance']
): Record<string, SkillPerformance> {
  if (!skillPerformance) return {};
  if (skillPerformance instanceof Map) {
    return Object.fromEntries(skillPerformance.entries());
  }
  return skillPerformance as Record<string, SkillPerformance>;
}

function normalizeDifficultyBreakdown(
  difficultyBreakdown: DifficultyBreakdown | undefined
): Required<DifficultyBreakdown> {
  return {
    easy: difficultyBreakdown?.easy || { attempted: 0, avgScore: 0 },
    medium: difficultyBreakdown?.medium || { attempted: 0, avgScore: 0 },
    hard: difficultyBreakdown?.hard || { attempted: 0, avgScore: 0 },
  };
}

export default function SkillAnalyticsDashboard({ interviews }: SkillAnalyticsDashboardProps) {
  const metrics = useMemo<AggregatedMetrics | null>(() => {
    const completed = interviews
      .filter((i) => i.status === 'completed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (!completed.length) return null;

    const overallScore = completed.reduce((sum, i) => sum + (i.averageScore || 0), 0) / completed.length;

    const theoreticalValues = completed.map((i) => i.theoreticalScore || 0).filter((s) => s > 0);
    const theoreticalScore = theoreticalValues.length
      ? theoreticalValues.reduce((sum, s) => sum + s, 0) / theoreticalValues.length
      : 0;

    const codingValues = completed.map((i) => i.codingScore || 0).filter((s) => s > 0);
    const codingScore = codingValues.length
      ? codingValues.reduce((sum, s) => sum + s, 0) / codingValues.length
      : 0;

    const topicMap: Record<string, number[]> = {};
    completed.forEach((interview) => {
      const skills = normalizeSkillPerformance(interview.skillPerformance);
      Object.entries(skills).forEach(([topic, data]) => {
        if (!topicMap[topic]) {
          topicMap[topic] = [];
        }
        topicMap[topic].push(data.score || 0);
      });
    });

    const topicAverages = Object.entries(topicMap).map(([topic, scores]) => ({
      topic,
      avg: scores.reduce((sum, s) => sum + s, 0) / Math.max(scores.length, 1),
    }));

    topicAverages.sort((a, b) => b.avg - a.avg);

    const difficultyTotals = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    completed.forEach((interview) => {
      const breakdown = normalizeDifficultyBreakdown(interview.difficultyBreakdown);
      difficultyTotals.easy += breakdown.easy.attempted || 0;
      difficultyTotals.medium += breakdown.medium.attempted || 0;
      difficultyTotals.hard += breakdown.hard.attempted || 0;
    });

    return {
      interviewCount: completed.length,
      overallScore: Number(overallScore.toFixed(1)),
      theoreticalScore: Number(theoreticalScore.toFixed(1)),
      codingScore: Number(codingScore.toFixed(1)),
      strongestSkill: topicAverages[0]?.topic || 'N/A',
      weakestSkill: topicAverages[topicAverages.length - 1]?.topic || 'N/A',
      trend: completed.map((interview, index) => ({
        name: `I${index + 1}`,
        score: Number((interview.averageScore || 0).toFixed(1)),
      })),
      difficultyData: [
        { level: 'Easy', attempted: difficultyTotals.easy },
        { level: 'Medium', attempted: difficultyTotals.medium },
        { level: 'Hard', attempted: difficultyTotals.hard },
      ],
    };
  }, [interviews]);

  if (!metrics) {
    return <div className="p-8 text-center text-gray-500">Complete interviews to see analytics</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Total Interviews" value={metrics.interviewCount.toString()} />
        <MetricCard label="Overall Average" value={`${metrics.overallScore}/10`} />
        <MetricCard label="Theoretical Avg" value={`${metrics.theoreticalScore}/10`} />
        <MetricCard label="Coding Avg" value={`${metrics.codingScore}/10`} />
        <MetricCard label="Strongest Skill" value={metrics.strongestSkill} />
        <MetricCard label="Weakest Skill" value={metrics.weakestSkill} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Performance Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value: number | string | undefined) => `${Number(value || 0)}/10`} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Difficulty Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="level" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="attempted" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mt-1 break-words">{value}</p>
    </div>
  );
}
