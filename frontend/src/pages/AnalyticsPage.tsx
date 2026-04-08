import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Code2,
  BookOpen,
  Zap,
  Award,
  AlertTriangle,
  BarChart3,
  Activity,
  Sparkles
} from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [fullReport, setFullReport] = useState<any>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [overviewRes, reportRes] = await Promise.all([
          analyticsAPI.getOverviewAnalytics(),
          analyticsAPI.getFullAnalyticsReport()
        ]);
        setOverview(overviewRes.data);
        setFullReport(reportRes.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const radarData = useMemo(() => {
    const topics = fullReport?.topicPerformance || [];
    return topics.slice(0, 6).map((topic: any) => ({
      skill: topic.topic,
      score: Number(topic.averageScore || 0)
    }));
  }, [fullReport]);

  const difficultyData = useMemo(() => {
    if (!fullReport?.difficultyBreakdown) return [];
    return [
      { difficulty: 'Easy', count: Number(fullReport.difficultyBreakdown.easy || 0), fill: '#10b981' },
      { difficulty: 'Medium', count: Number(fullReport.difficultyBreakdown.medium || 0), fill: '#f59e0b' },
      { difficulty: 'Hard', count: Number(fullReport.difficultyBreakdown.hard || 0), fill: '#ef4444' }
    ];
  }, [fullReport]);

  // Transform skill growth data for smooth area chart
  const skillGrowthData = useMemo(() => {
    if (!fullReport?.skillGrowth) return [];
    return fullReport.skillGrowth.map((item: any, idx: number) => ({
      ...item,
      index: idx,
      score: Number(item.score || 0)
    }));
  }, [fullReport]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const readinessScore = Number(overview?.readinessScore || 0);
  const readinessPercentage = Number(overview?.readinessPercentage || 0);
  const learningVelocity = Number(overview?.learningVelocity || 0);
  const isImproving = learningVelocity >= 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-20" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-6 w-6" />
            <Badge className="bg-white/20 text-white border-white/30 uppercase text-[10px] font-bold tracking-widest">
              Performance Insights
            </Badge>
          </div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="mt-2 text-indigo-100/80 max-w-lg text-sm">
            Track your interview readiness, skill distribution, and performance trends across all practice sessions.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {overview && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Readiness Score Card */}
          <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Readiness Score
                </CardTitle>
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                  <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-heading font-bold text-zinc-900 dark:text-zinc-50">
                  {readinessScore}
                </span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{overview.readinessLevel || 'Building'}</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">{readinessPercentage}%</span>
                </div>
                <Progress value={readinessPercentage} className="h-2 bg-violet-100 dark:bg-violet-900/30" />
              </div>
            </CardContent>
          </Card>

          {/* Coding Accuracy Card */}
          <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Coding Accuracy
                </CardTitle>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Code2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-heading font-bold text-zinc-900 dark:text-zinc-50">
                  {Number(overview.codingAccuracy || 0).toFixed(1)}
                </span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Average score across coding challenges
              </p>
            </CardContent>
          </Card>

          {/* Strongest/Weakest Skills Card */}
          <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Skill Focus
                </CardTitle>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">Strongest:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{overview.strongestSkill || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-muted-foreground">Focus on:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{overview.weakestSkill || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Velocity Card */}
          <Card className={cn(
            "relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group",
            isImproving ? "ring-1 ring-emerald-500/20" : "ring-1 ring-rose-500/20"
          )}>
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
              isImproving ? "from-emerald-500/5 to-transparent" : "from-rose-500/5 to-transparent"
            )} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Learning Velocity
                </CardTitle>
                <div className={cn(
                  "p-2 rounded-xl",
                  isImproving ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"
                )}>
                  {isImproving ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-5xl font-heading font-bold",
                  isImproving ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {isImproving ? '+' : ''}{learningVelocity.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isImproving ? 'Keep up the great progress!' : 'Focus on weak areas to improve'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      {fullReport && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Skill Growth Chart */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                    <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="font-heading font-bold">Skill Growth Trend</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">
                  Timeline
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={skillGrowthData}>
                  <defs>
                    <linearGradient id="skillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickLine={{ stroke: 'currentColor' }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickLine={{ stroke: 'currentColor' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#skillGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skill Distribution Radar */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="font-heading font-bold">Skill Distribution</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">
                  Radar
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <PolarAngleAxis
                    dataKey="skill"
                    className="text-xs"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                  />
                  <PolarRadiusAxis domain={[0, 10]} className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Difficulty Performance */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="font-heading font-bold">Difficulty Distribution</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">
                  Breakdown
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={difficultyData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis
                    dataKey="difficulty"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickLine={{ stroke: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickLine={{ stroke: 'currentColor' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[8, 8, 0, 0]}
                    fill="currentColor"
                    className="fill-zinc-900 dark:fill-zinc-100"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coding vs Theoretical */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <CardTitle className="font-heading font-bold">Coding vs Theoretical</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">
                  Compare
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Coding */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 dark:from-indigo-500/20 dark:to-indigo-500/5 p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                  <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        Coding
                      </span>
                    </div>
                    <p className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50">
                      {Number(fullReport.codingVsTheory?.coding?.average || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fullReport.codingVsTheory?.coding?.attempts || 0} attempts
                    </p>
                  </div>
                </div>

                {/* Theoretical */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5 p-6 border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Theoretical
                      </span>
                    </div>
                    <p className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50">
                      {Number(fullReport.codingVsTheory?.theoretical?.average || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fullReport.codingVsTheory?.theoretical?.attempts || 0} attempts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
