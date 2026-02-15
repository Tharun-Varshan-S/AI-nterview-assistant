import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI, Interview, User } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import Skeleton from '../components/Skeleton';
import { Users, TrendingUp, Filter, Eye } from 'lucide-react';

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

  const filteredInterviews = interviews.filter((interview) => {
    if (filter === 'all') return true;
    const score = interview.averageScore;
    if (filter === 'high') return score >= 7;
    if (filter === 'medium') return score >= 4 && score < 7;
    if (filter === 'low') return score < 4;
    return true;
  });

  const stats = {
    total: interviews.length,
    avgScore: interviews.length > 0
      ? interviews.reduce((sum, i) => sum + i.averageScore, 0) / interviews.length
      : 0,
    high: interviews.filter((i) => i.averageScore >= 7).length,
    medium: interviews.filter((i) => i.averageScore >= 4 && i.averageScore < 7).length,
    low: interviews.filter((i) => i.averageScore < 4).length,
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="mt-4 h-6 w-20" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Recruiter Command Center</h1>
        <p className="text-slate-600 mt-1">Track performance trends and review AI interview results in one place.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-sm text-slate-600">Total Candidates</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <TrendingUp className="text-indigo-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.avgScore.toFixed(1)}</div>
              <p className="text-sm text-slate-600">Average Score</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <div className="text-green-600 text-2xl font-bold">{stats.high}</div>
            </div>
            <div>
              <p className="text-sm text-slate-600">High Performers</p>
              <p className="text-xs text-slate-500">(Score ≥ 7)</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <div className="text-yellow-600 text-2xl font-bold">{stats.medium}</div>
            </div>
            <div>
              <p className="text-sm text-slate-600">Medium Performers</p>
              <p className="text-xs text-slate-500">(Score 4-7)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Performance Analytics</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Last 30 days</span>
          </div>
          <div className="h-48 rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="flex h-full items-end gap-4">
              {[
                { label: 'Low', value: stats.low, color: 'bg-rose-500' },
                { label: 'Mid', value: stats.medium, color: 'bg-amber-500' },
                { label: 'High', value: stats.high, color: 'bg-emerald-500' },
              ].map((bucket) => {
                const total = Math.max(1, stats.total);
                const height = Math.max(8, (bucket.value / total) * 120);
                return (
                  <div key={bucket.label} className="flex-1">
                    <div className="flex h-32 items-end">
                      <div className={`w-full rounded-xl ${bucket.color}`} style={{ height }} />
                    </div>
                    <div className="mt-3 text-center text-xs font-semibold text-slate-600">
                      {bucket.label}
                    </div>
                    <div className="text-center text-xs text-slate-400">{bucket.value} candidates</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Top Insights</h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">Average score climbed to <span className="font-semibold text-slate-900">{stats.avgScore.toFixed(1)}</span>.</p>
              <p className="text-xs text-slate-500 mt-1">Compare cohorts and identify high-potential talent.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">{stats.high} candidates exceed the high-performer threshold.</p>
              <p className="text-xs text-slate-500 mt-1">Consider scheduling deeper technical rounds.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-slate-600" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({interviews.length})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'high'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              High ({stats.high})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Medium ({stats.medium})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'low'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Low ({stats.low})
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 backdrop-blur">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Candidates</h2>
        </div>

        {filteredInterviews.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-700 text-lg font-medium">No candidates here yet</p>
            <p className="text-slate-500 mt-2">
              {filter === 'all'
                ? 'Once candidates complete interviews, their profiles will appear here.'
                : `No candidates currently match the ${filter} performance filter.`}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredInterviews
              .sort((a, b) => b.averageScore - a.averageScore)
              .map((interview) => {
                const user = interview.userId as User;
                
                return (
                  <div
                    key={interview._id}
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/recruiter/candidate/${interview._id}`)}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {user.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getScoreColor(
                              interview.averageScore
                            )}`}
                          >
                            {interview.averageScore.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm">{user.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span>
                            {interview.answers.length} / {interview.questions.length} questions
                          </span>
                          <span>•</span>
                          <span>Completed {new Date(interview.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, interview.averageScore * 10)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/recruiter/candidate/${interview._id}`);
                        }}
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
