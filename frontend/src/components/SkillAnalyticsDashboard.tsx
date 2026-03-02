import { memo, useMemo, useState } from 'react';
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
  Cell,
} from 'recharts';
import { Interview, SkillPerformance, DifficultyBreakdown } from '../services/api';
import { AnimatedCard, CountUpNumber } from './motion';

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

function normalizeSkillPerformance(skillPerformance: Interview['skillPerformance']): Record<string, SkillPerformance> {
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

export default memo(function SkillAnalyticsDashboard({ interviews }: SkillAnalyticsDashboardProps) {
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);

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
    return <div className="p-8 text-center text-zinc-500">Complete interviews to see analytics.</div>;
  }

  const skillSignals = [metrics.strongestSkill, metrics.weakestSkill].filter((skill) => skill && skill !== 'N/A');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total Interviews" value={metrics.interviewCount} />
        <MetricCard label="Overall Average" value={metrics.overallScore} suffix="/10" decimals={1} />
        <MetricCard label="Theoretical Avg" value={metrics.theoreticalScore} suffix="/10" decimals={1} />
        <MetricCard label="Coding Avg" value={metrics.codingScore} suffix="/10" decimals={1} />
        <MetricLabel label="Strongest Skill" value={metrics.strongestSkill} highlight="positive" />
        <MetricLabel label="Weakest Skill" value={metrics.weakestSkill} highlight="negative" pulse />
      </div>

      {skillSignals.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Skill Relationship</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {skillSignals.map((skill, index) => (
              <button
                key={skill}
                onMouseEnter={() => setHoverSkill(skill)}
                onMouseLeave={() => setHoverSkill(null)}
                className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                  hoverSkill === skill
                    ? 'border-cyan-300 bg-cyan-100 text-cyan-800 shadow-convio-glow'
                    : 'border-zinc-200 bg-white text-zinc-700'
                }`}
              >
                {skill}
              </button>
            ))}
            <span className="h-px w-12 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400" />
            <span className="text-zinc-500">Hover highlights connected skill focus.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnimatedCard className="min-w-0 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Performance Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <LineChart data={metrics.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e4e4e7',
                    background: 'rgba(255,255,255,0.94)',
                    boxShadow: '0 10px 35px rgba(2, 6, 23, 0.12)',
                    transform: 'scale(0.98)',
                    transition: 'opacity 180ms ease, transform 180ms ease',
                  }}
                  formatter={(value: number | string | undefined) => `${Number(value || 0).toFixed(1)}/10`}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3BA2FF"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#39D4AA' }}
                  activeDot={{ r: 6, fill: '#0EA5E9' }}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>

        <AnimatedCard className="min-w-0 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Difficulty Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={metrics.difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="level" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e4e4e7',
                    background: 'rgba(255,255,255,0.94)',
                    boxShadow: '0 10px 35px rgba(2, 6, 23, 0.12)',
                  }}
                />
                <Bar dataKey="attempted" radius={[7, 7, 0, 0]} isAnimationActive animationDuration={760}>
                  {metrics.difficultyData.map((entry, index) => (
                    <Cell
                      key={`${entry.level}-${index}`}
                      fill={entry.level === 'Hard' ? '#F43F5E' : entry.level === 'Medium' ? '#F59E0B' : '#39D4AA'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
});

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}

function MetricCard({ label, value, suffix = '', decimals = 0 }: MetricCardProps) {
  return (
    <AnimatedCard className="p-3" glowOnHover>
      <p className="text-xs font-medium text-zinc-600">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900 break-words">
        <CountUpNumber value={value} decimals={decimals} suffix={suffix} />
      </p>
    </AnimatedCard>
  );
}

function MetricLabel({
  label,
  value,
  highlight,
  pulse = false,
}: {
  label: string;
  value: string;
  highlight: 'positive' | 'negative';
  pulse?: boolean;
}) {
  return (
    <AnimatedCard className="p-3" glowOnHover>
      <p className="text-xs font-medium text-zinc-600">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold break-words ${
          highlight === 'positive' ? 'text-emerald-700' : 'text-rose-700'
        } ${pulse ? 'animate-soft-pulse' : ''}`}
      >
        {value}
      </p>
    </AnimatedCard>
  );
}
