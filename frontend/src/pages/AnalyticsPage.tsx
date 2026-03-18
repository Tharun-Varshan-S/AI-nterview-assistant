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
  ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Book } from 'lucide-react';

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
      { difficulty: 'Easy', count: Number(fullReport.difficultyBreakdown.easy || 0) },
      { difficulty: 'Medium', count: Number(fullReport.difficultyBreakdown.medium || 0) },
      { difficulty: 'Hard', count: Number(fullReport.difficultyBreakdown.hard || 0) }
    ];
  }, [fullReport]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-md">
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-indigo-100">Track readiness and performance trend across interviews.</p>
      </div>

      {overview && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Readiness Score</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{overview.readinessScore}</p>
            <p className="mt-1 text-xs text-slate-500">{overview.readinessLevel || 'Improving'}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${overview.readinessPercentage || 0}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Coding Accuracy</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{Number(overview.codingAccuracy || 0).toFixed(1)}</p>
            <p className="mt-1 text-xs text-slate-500">Out of 10</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Strongest Skill</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{overview.strongestSkill}</p>
            <p className="mt-4 text-sm text-slate-500">Weakest: <span className="font-medium text-amber-600">{overview.weakestSkill}</span></p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Learning Velocity</p>
            <p className={`mt-2 text-4xl font-semibold ${overview.learningVelocity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(overview.learningVelocity || 0).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{overview.learningVelocity >= 0 ? 'Improving' : 'Needs correction'}</p>
          </div>
        </div>
      )}

      {fullReport && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Skill Growth</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fullReport.skillGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Skill Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis domain={[0, 10]} />
                <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Difficulty Performance</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="difficulty" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Coding vs Theoretical</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Coding</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-800">{Number(fullReport.codingVsTheory?.coding?.average || 0).toFixed(1)}</p>
                <p className="text-xs text-slate-500">Attempts: {fullReport.codingVsTheory?.coding?.attempts || 0}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Theoretical</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-800">{Number(fullReport.codingVsTheory?.theoretical?.average || 0).toFixed(1)}</p>
                <p className="text-xs text-slate-500">Attempts: {fullReport.codingVsTheory?.theoretical?.attempts || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
