import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [fullReport, setFullReport] = useState<any>(null);
  const [consistency, setConsistency] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, reportRes, consistencyRes] = await Promise.all([
        analyticsAPI.getOverviewAnalytics(),
        analyticsAPI.getFullAnalyticsReport(),
        analyticsAPI.getResumeConsistency().catch(() => null),
      ]);

      setOverview(overviewRes.data);
      setFullReport(reportRes.data);
      setConsistency(consistencyRes?.data || null);
    } catch (error: any) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics & Insights</h1>
          <p className="text-slate-400">Track your progress and identify improvement areas</p>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2">Readiness Score</div>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-bold text-white">{overview.readinessScore}</div>
                <div className="text-xs text-slate-500 mb-1">/ 100</div>
              </div>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${Math.min(overview.readinessScore, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-3">Overall interview readiness</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2">Strongest Skill</div>
              <div className="text-2xl font-bold text-white truncate">{overview.strongestSkill}</div>
              <p className="text-xs text-slate-400 mt-3">Your top performing skill</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2">Weakest Skill</div>
              <div className="text-2xl font-bold text-white truncate">{overview.weakestSkill}</div>
              <p className="text-xs text-slate-400 mt-3">Focus area for improvement</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2">Total Sessions</div>
              <div className="text-4xl font-bold text-white">{overview.totalSessions}</div>
              <div className="text-xs text-slate-500 mt-2">
                {overview.totalInterviews} interviews, {overview.totalPracticeSessions} practice
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Coding Accuracy</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400">{Number(overview.codingAccuracy).toFixed(1)}</div>
                  <p className="text-slate-400 text-sm mt-1">/ 10</p>
                </div>
              </div>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(overview.codingAccuracy / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Theoretical Knowledge</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400">
                    {Number(overview.theoreticalAccuracy).toFixed(1)}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">/ 10</p>
                </div>
              </div>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(overview.theoreticalAccuracy / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Learning Velocity</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${overview.learningVelocity >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                    {Number(overview.learningVelocity).toFixed(2)}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{overview.learningVelocity >= 0 ? '📈 Improving' : '📉 Needs work'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {fullReport && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skill Growth Over Time */}
            {fullReport.skillGrowth && fullReport.skillGrowth.length > 0 && (
              <div className="min-w-0 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Skill Growth Over Time</h3>
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={280}>
                  <AreaChart data={fullReport.skillGrowth}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Difficulty Breakdown */}
            {fullReport.difficultyBreakdown && (
              <div className="min-w-0 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Difficulty Breakdown</h3>
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Easy', value: fullReport.difficultyBreakdown.easy },
                        { name: 'Medium', value: fullReport.difficultyBreakdown.medium },
                        { name: 'Hard', value: fullReport.difficultyBreakdown.hard },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {colors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Coding vs Theoretical */}
            {fullReport.codingVsTheory && (
              <div className="min-w-0 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Coding vs Theoretical</h3>
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={280}>
                  <BarChart
                    data={[
                      {
                        name: 'Performance',
                        Coding: Number(fullReport.codingVsTheory.coding.average),
                        Theoretical: Number(fullReport.codingVsTheory.theoretical.average),
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                    <Legend />
                    <Bar dataKey="Coding" fill="#3b82f6" />
                    <Bar dataKey="Theoretical" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Topic Performance */}
            {fullReport.topicPerformance && fullReport.topicPerformance.length > 0 && (
              <div className="min-w-0 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Topic Performance</h3>
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={280}>
                  <BarChart data={fullReport.topicPerformance.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="topic" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                    <Bar dataKey="averageScore" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Resume Consistency */}
        {consistency && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Resume Consistency Analysis</h2>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Score</span>
                <div className="text-3xl font-bold text-white">{consistency.resumeConsistencyScore}</div>
                <span className="text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6">
                <div className="text-slate-400 text-sm font-medium mb-2">Verified Strengths</div>
                <div className="text-3xl font-bold text-green-400">{consistency.verifiedStrengths?.length || 0}</div>
                <p className="text-xs text-slate-400 mt-2">Skills claimed and proven</p>
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6">
                <div className="text-slate-400 text-sm font-medium mb-2">Inflated Skills</div>
                <div className="text-3xl font-bold text-red-400">{consistency.inflatedSkills?.length || 0}</div>
                <p className="text-xs text-slate-400 mt-2">Consider removing from resume</p>
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6">
                <div className="text-slate-400 text-sm font-medium mb-2">Hidden Strengths</div>
                <div className="text-3xl font-bold text-blue-400">{consistency.hiddenStrengths?.length || 0}</div>
                <p className="text-xs text-slate-400 mt-2">Not claimed but accomplished</p>
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6">
                <div className="text-slate-400 text-sm font-medium mb-2">Weak Areas</div>
                <div className="text-3xl font-bold text-orange-400">{consistency.weakAreas?.length || 0}</div>
                <p className="text-xs text-slate-400 mt-2">Need improvement</p>
              </div>
            </div>

            {/* Recommendations */}
            {consistency.recommendations && consistency.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-bold">Recommendations</h3>
                {consistency.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      rec.type === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : rec.type === 'warning'
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                    }`}
                  >
                    <p className="font-medium">{rec.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skill Details */}
        {fullReport?.topicPerformance && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Detailed Skill Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Topic</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Score</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Attempts</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {fullReport.topicPerformance.map((topic: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-4 px-4 text-white font-medium">{topic.topic}</td>
                      <td className="py-4 px-4 text-blue-400 font-bold">{Number(topic.averageScore).toFixed(1)}/10</td>
                      <td className="py-4 px-4 text-slate-400">{topic.attempts}</td>
                      <td className="py-4 px-4">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(topic.averageScore / 10) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
