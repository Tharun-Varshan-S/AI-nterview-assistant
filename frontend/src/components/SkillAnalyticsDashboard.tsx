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
import { CountUpNumber } from './motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';

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
  const { theme } = useTheme();

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
    return <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">Complete interviews to see analytics.</div>;
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const labelColor = isDark ? '#a1a1aa' : '#71717a';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Interviews" value={metrics.interviewCount} />
        <MetricCard label="Overall Avg" value={metrics.overallScore} suffix="/10" decimals={1} />
        <MetricCard label="Theory Avg" value={metrics.theoreticalScore} suffix="/10" decimals={1} />
        <MetricCard label="Coding Avg" value={metrics.codingScore} suffix="/10" decimals={1} />
        <MetricLabel label="Strongest" value={metrics.strongestSkill} highlight="positive" />
        <MetricLabel label="Growth Need" value={metrics.weakestSkill} highlight="negative" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold">Technical Trajectory</CardTitle>
            <CardDescription className="text-xs">Performance score over sequential sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke={labelColor} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: isDark ? '1px solid #3f3f46' : '1px solid #e4e4e7',
                      background: isDark ? '#18181b' : '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                    labelStyle={{ color: labelColor, marginBottom: '4px' }}
                    formatter={(value: number | undefined) => [`${(value || 0).toFixed(1)}/10`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={isDark ? '#fafafa' : '#18181b'}
                    strokeWidth={2}
                    dot={{ r: 3, fill: isDark ? '#fafafa' : '#18181b', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold">Adaptive Load</CardTitle>
            <CardDescription className="text-xs">Distribution of questions by difficulty level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.difficultyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="level" stroke={labelColor} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={labelColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: isDark ? '#27272a' : '#f4f4f5', opacity: 0.4 }}
                    contentStyle={{
                      borderRadius: 8,
                      border: isDark ? '1px solid #3f3f46' : '1px solid #e4e4e7',
                      background: isDark ? '#18181b' : '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="attempted" radius={[4, 4, 0, 0]} animationDuration={800} barSize={40}>
                    {metrics.difficultyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={isDark ? '#52525b' : '#a1a1aa'}
                        className="hover:fill-zinc-950 dark:hover:fill-zinc-100 transition-colors duration-200"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

function MetricCard({ label, value, suffix = '', decimals = 0 }: { label: string; value: number; suffix?: string; decimals?: number }) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950/50">
      <CardContent className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-heading font-bold text-foreground">
          <CountUpNumber value={value} decimals={decimals} suffix={suffix} />
        </p>
      </CardContent>
    </Card>
  );
}

function MetricLabel({ label, value, highlight }: { label: string; value: string; highlight: 'positive' | 'negative' }) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950/50">
      <CardContent className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className={`text-sm font-semibold truncate ${highlight === 'positive' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
