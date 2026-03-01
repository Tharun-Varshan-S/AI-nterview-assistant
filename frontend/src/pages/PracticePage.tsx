import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PracticeSession, interviewAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';

type PracticeMode = '' | 'aptitude' | 'coding' | 'technical' | 'behavioral';

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<'modes' | 'history' | 'stats'>('modes');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  const modes = [
    {
      id: 'aptitude',
      name: 'Aptitude Practice',
      description: 'Improve your logical reasoning and problem solving skills',
      icon: '🧮',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'coding',
      name: 'Coding Practice',
      description: 'Practice coding problems with real-time execution',
      icon: '💻',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'technical',
      name: 'Technical Q&A',
      description: 'Test your technical knowledge across domains',
      icon: '⚙️',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'behavioral',
      name: 'Behavioral Practice',
      description: 'Master behavioral and HR interview questions',
      icon: '🎯',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const topics = {
    aptitude: ['Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability', 'Critical Thinking'],
    coding: ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting'],
    technical: ['Data Structures', 'DBMS', 'OOP', 'System Design', 'APIs', 'Web Dev'],
    behavioral: ['Teamwork', 'Leadership', 'Problem Solving', 'Conflict Resolution', 'Motivation'],
  };

  const startPractice = async () => {
    if (!selectedMode || !selectedTopic) {
      toast.error('Please select a mode and topic');
      return;
    }

    setLoading(true);
    try {
      const response = await interviewAPI.startPracticeSession({
        mode: selectedMode as Exclude<PracticeMode, ''>,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        questionCount: 5,
      });

      if (response.data?.sessionId) {
        navigate(`/candidate/practice/${response.data.sessionId}`);
        toast.success('Practice session started');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start practice session');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await interviewAPI.getPracticeSessions({});
      setSessions(response.data?.sessions || []);
    } catch (error: any) {
      toast.error('Failed to load practice history');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await interviewAPI.getPracticeStats({});
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to load practice statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Practice Hub</h1>
          <p className="text-slate-400">Master different interview skills with our comprehensive practice modes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => {
              setActiveTab('modes');
              setSelectedMode('');
            }}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'modes'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Practice Modes
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Session History
          </button>
          <button
            onClick={() => {
              setActiveTab('stats');
              loadStats();
            }}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'stats'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        {activeTab === 'modes' && (
          <div className="space-y-8">
            {/* Mode Selection */}
            {!selectedMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as PracticeMode)}
                    className="group bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-6 hover:border-slate-500 transition-all hover:scale-105"
                  >
                    <div className="text-5xl mb-4">{mode.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{mode.name}</h3>
                    <p className="text-slate-400 text-sm">{mode.description}</p>
                    <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${mode.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-8">
                {/* Mode Header */}
                <div className="mb-8">
                  <button
                    onClick={() => setSelectedMode('')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium mb-4"
                  >
                    ← Back to modes
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {modes.find((m) => m.id === selectedMode)?.name}
                  </h2>
                  <p className="text-slate-400">Configure your practice session</p>
                </div>

                {/* Topic Selection */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3">Select Topic</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(topics[selectedMode as keyof typeof topics] || []).map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedTopic === topic
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div className="mb-8">
                  <label className="block text-white font-semibold mb-3">Select Difficulty</label>
                  <div className="flex gap-3">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedDifficulty(level)}
                        className={`px-6 py-2 rounded-lg font-medium transition-all capitalize ${
                          selectedDifficulty === level
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startPractice}
                  disabled={loading || !selectedTopic}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50"
                >
                  {loading ? <Spinner size="sm" /> : 'Start Practice Session'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <Spinner size="lg" />
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">No practice sessions yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session._id} className="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6 hover:border-slate-500 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {session.topic} ({session.mode})
                      </h3>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>Difficulty: <span className="text-slate-200 font-medium capitalize">{session.difficulty}</span></span>
                        <span>Score: <span className="text-slate-200 font-medium">{Number(session.averageScore).toFixed(1)}/10</span></span>
                        <span>Progress: <span className="text-slate-200 font-medium">{session.questionsAttempted}/{session.totalQuestions}</span></span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                      session.status === 'completed'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {session.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {loading ? (
              <Spinner size="lg" />
            ) : stats ? (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6">
                    <div className="text-slate-400 text-sm font-medium mb-2">Total Sessions</div>
                    <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6">
                    <div className="text-slate-400 text-sm font-medium mb-2">Average Score</div>
                    <div className="text-3xl font-bold text-white">{Number(stats.averageScore).toFixed(1)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6">
                    <div className="text-slate-400 text-sm font-medium mb-2">Best Score</div>
                    <div className="text-3xl font-bold text-white">{Number(stats.bestPerformance).toFixed(1)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6">
                    <div className="text-slate-400 text-sm font-medium mb-2">Weakest Score</div>
                    <div className="text-3xl font-bold text-white">{Number(stats.worstPerformance).toFixed(1)}</div>
                  </div>
                </div>

                {/* Performance by Mode */}
                {Object.keys(stats.sessionsByMode).length > 0 && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Performance by Mode</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.sessionsByMode).map(([mode, data]: [string, any]) => (
                        <div key={mode} className="flex justify-between items-center">
                          <span className="text-slate-300 capitalize font-medium">{mode}</span>
                          <div className="flex items-center gap-3">
                            <div className="text-slate-400 text-sm">{data.count} sessions</div>
                            <div className="w-32 bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(data.avgScore / 10) * 100}%` }}
                              />
                            </div>
                            <div className="text-slate-200 font-semibold w-12 text-right">{Number(data.avgScore).toFixed(1)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">No statistics available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
