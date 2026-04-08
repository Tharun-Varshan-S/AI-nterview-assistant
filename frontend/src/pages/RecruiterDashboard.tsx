import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI, Interview, User } from '../services/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Star, AlertTriangle, Eye, ArrowUpRight, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CountUpNumber from '../components/motion/CountUpNumber';
import { cn } from '@/lib/utils';

export default function RecruiterDashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = await recruiterAPI.getAllCompletedInterviews();
      setInterviews(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = interviews.length;
    const avgScore = total > 0 ? interviews.reduce((sum, i) => sum + i.averageScore, 0) / total : 0;
    const high = interviews.filter((i) => i.averageScore >= 7).length;
    const medium = interviews.filter((i) => i.averageScore >= 4 && i.averageScore < 7).length;
    const low = interviews.filter((i) => i.averageScore < 4).length;

    return { total, avgScore, high, medium, low };
  }, [interviews]);

  const filteredInterviews = useMemo(
    () =>
      interviews.filter((interview) => {
        if (filter === 'all') return true;
        const score = interview.averageScore;
        if (filter === 'high') return score >= 7;
        if (filter === 'medium') return score >= 4 && score < 7;
        if (filter === 'low') return score < 4;
        return true;
      }),
    [interviews, filter]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 py-8 animate-pulse">
        <header className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const filterMeta: Array<{ id: 'all' | 'high' | 'medium' | 'low'; label: string; count: number }> = [
    { id: 'all', label: 'All Candidates', count: interviews.length },
    { id: 'high', label: 'High Performers', count: stats.high },
    { id: 'medium', label: 'Mid Tier', count: stats.medium },
    { id: 'low', label: 'Needs Review', count: stats.low },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-4 font-sans pb-20 animate-in fade-in duration-700">
      <header className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Recruiter Intel</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Coordinate talent acquisition with data-driven performance metrics.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 dark:bg-zinc-100 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-950 dark:bg-zinc-100"></span>
          </span>
          <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 tracking-widest uppercase">Live Repository</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Scanned', value: stats.total, icon: Users, color: 'text-zinc-500', trend: '+12% growth' },
          { label: 'Mean Proficiency', value: stats.avgScore, decimals: 1, suffix: '/10', icon: TrendingUp, color: 'text-zinc-500', trend: '+0.2 shift' },
          { label: 'Verified High', value: stats.high, icon: Star, color: 'text-amber-500', trend: 'Priority queue' },
          { label: 'Critical Review', value: stats.low, icon: AlertTriangle, color: 'text-rose-500', trend: 'Requires attention' },
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <stat.icon size={16} className={stat.color} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50 tracking-tighter">
                  <CountUpNumber value={stat.value} decimals={stat.decimals || 0} suffix={stat.suffix || ''} />
                </span>
              </div>
              <p className="mt-2 text-[10px] font-medium text-zinc-400 uppercase tracking-tighter">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp size={14} /> Proficiency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {[
              { label: 'System Baseline (0-3.9)', value: stats.low, color: 'bg-zinc-200 dark:bg-zinc-800' },
              { label: 'Core Competency (4-6.9)', value: stats.medium, color: 'bg-zinc-500 dark:bg-zinc-600' },
              { label: 'Expert Trajectory (7-10)', value: stats.high, color: 'bg-zinc-950 dark:bg-zinc-100' },
            ].map((bucket, index) => {
              const percentage = stats.total > 0 ? (bucket.value / stats.total) * 100 : 0;
              return (
                <div key={index} className="space-y-2.5">
                  <div className="flex items-end justify-between">
                    <span className="text-xs font-bold text-zinc-500 tracking-tight">{bucket.label}</span>
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">{bucket.value} ENV</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" indicatorClassName={bucket.color} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg bg-zinc-950 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] pointer-events-none" />
          <CardHeader className="relative z-10 border-b border-zinc-900 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400">Signal Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6 relative z-10">
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <TrendingUp size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Aggregate Velocity</span>
              </div>
              <p className="text-sm font-medium text-zinc-300 leading-relaxed">
                Platform-wide technical proficiency is averaging <span className="text-zinc-50 font-bold px-1">{stats.avgScore.toFixed(1)}/10</span>, suggesting a stable talent baseline.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Star size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">High Contrast</span>
              </div>
              <p className="text-sm font-medium text-zinc-300 leading-relaxed">
                Currently tracking <span className="text-zinc-50 font-bold px-1">{stats.high} elite trajectories</span>. Prioritize deep-dive sessions for this cohort.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm p-0">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-transparent flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <h2 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-100">Candidate Registry</h2>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {filterMeta.map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
                      active
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    {item.label} <span className="ml-1 opacity-40">[{item.count}]</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-[11px] font-medium w-64 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/10">
              <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                <TableHead className="w-[300px] text-[10px] font-bold uppercase tracking-widest text-zinc-400">Identity Record</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Final Score</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Progression</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Session Status</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400 pr-8">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center">
                        <Users className="text-zinc-300 dark:text-zinc-700" size={20} />
                      </div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No matching telemetry found.</p>
                      <p className="text-xs text-zinc-500 font-medium">Reset filters to view active registry.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterviews
                  .sort((a, b) => b.averageScore - a.averageScore)
                  .map((interview) => {
                    const user = interview.userId as User;
                    const score = interview.averageScore;
                    return (
                      <TableRow
                        key={interview._id}
                        className="group cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-zinc-100 dark:border-zinc-900 transition-colors"
                        onClick={() => navigate(`/recruiter/candidate/${interview._id}`)}
                      >
                        <TableCell className="py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
                              {user.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                              <p className="text-[10px] font-medium text-zinc-400 font-mono tracking-tighter truncate">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-heading font-bold text-zinc-900 dark:text-zinc-100 lining-nums">
                              {score.toFixed(1)}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400">/10</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[180px]">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
                              <span>Efficiency</span>
                              <span>{Math.round(score * 10)}%</span>
                            </div>
                            <Progress value={score * 10} className="h-1" indicatorClassName={cn(
                              score >= 7 ? "bg-zinc-900 dark:bg-zinc-100" : score >= 4 ? "bg-zinc-500" : "bg-zinc-300 dark:bg-zinc-700"
                            )} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2.5 h-6",
                            score >= 7
                              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-0 shadow-sm"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                          )}>
                            {score >= 7 ? 'ELITE SIGNAL' : score >= 4 ? 'STABLE' : 'EVAL PENDING'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                            <ArrowUpRight size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
