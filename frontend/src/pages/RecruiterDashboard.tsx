import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI, Interview, User } from '../services/api';
import { toast } from 'sonner';
import Skeleton from '../components/Skeleton';
import { Users, TrendingUp, Star, AlertTriangle, Eye } from 'lucide-react';
import {
  AnimatedCard,
  AnimatedProgressBar,
  AnimatedStat,
  CountUpNumber,
  MicroButton,
  PulseIndicator,
  StaggerContainer,
} from '../components/motion';

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
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="convio-glass p-6">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="mt-4 h-6 w-20" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filterMeta: Array<{ id: 'all' | 'high' | 'medium' | 'low'; label: string; count: number }> = [
    { id: 'all', label: 'All', count: interviews.length },
    { id: 'high', label: 'High', count: stats.high },
    { id: 'medium', label: 'Medium', count: stats.medium },
    { id: 'low', label: 'Low', count: stats.low },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Recruiter Intelligence Hub</h1>
          <p className="mt-1 text-zinc-600">Review candidate quality, adaptive trends, and score dynamics in real time.</p>
        </div>
        <PulseIndicator label="Live Pipeline" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AnimatedStat label="Total Candidates" value={stats.total} icon={<Users size={19} />} deltaLabel="+3% this week" />
        <AnimatedStat label="Average Score" value={stats.avgScore} decimals={1} suffix="/10" icon={<TrendingUp size={19} />} deltaLabel="+0.4 trend" />
        <AnimatedStat label="High Performers" value={stats.high} icon={<Star size={19} />} deltaLabel="Strong shortlist" />
        <AnimatedStat label="Needs Review" value={stats.low} icon={<AlertTriangle size={19} />} deltaLabel="-2% drop" />
      </div>

      <AnimatedCard className="p-3 sm:p-4">
        <div className="relative flex flex-wrap gap-2">
          {filterMeta.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {item.label} ({item.count})
                {active && (
                  <span className="absolute -bottom-1 left-2 right-2 h-0.5 animate-fade-up rounded-full bg-teal-400" />
                )}
              </button>
            );
          })}
        </div>
      </AnimatedCard>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AnimatedCard className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Low (0-3.9)', value: stats.low, color: 'from-rose-400 to-rose-500' },
              { label: 'Medium (4-6.9)', value: stats.medium, color: 'from-amber-400 to-amber-500' },
              { label: 'High (7-10)', value: stats.high, color: 'from-emerald-400 to-emerald-500' },
            ].map((bucket, index) => {
              const total = Math.max(1, stats.total);
              return (
                <div key={bucket.label} className="animate-fade-up" style={{ animationDelay: `${index * 90}ms`, animationFillMode: 'both' }}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-zinc-600">{bucket.label}</span>
                    <span className="font-semibold text-zinc-900">{bucket.value}</span>
                  </div>
                  <AnimatedProgressBar
                    value={bucket.value}
                    max={total}
                    indicatorClassName={`bg-gradient-to-r ${bucket.color}`}
                    showGlowTrail
                  />
                </div>
              );
            })}
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Quality Signal</h2>
          <div className="space-y-4 text-sm text-zinc-700">
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              Mean score is <CountUpNumber value={stats.avgScore} decimals={1} className="font-semibold text-zinc-900" /> / 10.
            </p>
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              {stats.high} candidates currently match high-performer criteria.
            </p>
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              Use profile-level trajectories to prioritize technical deep-dives.
            </p>
          </div>
        </AnimatedCard>
      </div>

      <AnimatedCard className="overflow-hidden p-0">
        <div className="border-b border-zinc-200/80 p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Candidate List</h2>
        </div>

        {filteredInterviews.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-zinc-700">No candidates in this segment</p>
            <p className="mt-2 text-zinc-500">Try another filter to inspect a broader cohort.</p>
          </div>
        ) : (
          <StaggerContainer className="divide-y divide-zinc-200/70" delayStepMs={70}>
            {filteredInterviews
              .sort((a, b) => b.averageScore - a.averageScore)
              .map((interview) => {
                const user = interview.userId as User;
                const scorePercent = Math.min(100, interview.averageScore * 10);

                return (
                  <div key={interview._id} className="group cursor-pointer p-6 transition-colors hover:bg-zinc-50/70" onClick={() => navigate(`/recruiter/candidate/${interview._id}`)}>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-zinc-900">{user.name}</h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${
                              interview.averageScore >= 7
                                ? 'bg-emerald-100 text-emerald-700'
                                : interview.averageScore >= 4
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                            } group-hover:shadow-convio-glow`}
                          >
                            <CountUpNumber value={interview.averageScore} decimals={1} />
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600">{user.email}</p>
                        <div className="mt-2 flex items-center gap-3 text-sm text-zinc-500">
                          <span>
                            {interview.answers.length} / {interview.questions.length} questions
                          </span>
                          <span>•</span>
                          <span>Completed {new Date(interview.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-3">
                          <AnimatedProgressBar value={scorePercent} max={100} showGlowTrail />
                        </div>
                      </div>

                      <MicroButton className="bg-zinc-900 text-white" title="Open Candidate">
                        <Eye size={16} />
                        View
                      </MicroButton>
                    </div>
                  </div>
                );
              })}
          </StaggerContainer>
        )}
      </AnimatedCard>
    </div>
  );
}
