import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';

export default function MockSetupPage() {
  const [mode, setMode] = useState<'theoretical' | 'coding' | 'mixed'>('mixed');
  const [focus, setFocus] = useState<'weak skills' | 'random' | 'specific'>('weak skills');
  const [specificTopic, setSpecificTopic] = useState<string>('');
  const [length, setLength] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const modeOptions = [
    {
      id: 'theoretical',
      name: 'Theoretical',
      description: 'Technical and conceptual questions',
      icon: '📚',
    },
    {
      id: 'coding',
      name: 'Coding',
      description: 'Programming and problem-solving',
      icon: '💻',
    },
    {
      id: 'mixed',
      name: 'Mixed',
      description: 'Combination of both types',
      icon: '🎯',
    },
  ];

  const focusOptions = [
    {
      id: 'weak skills',
      name: 'Focus on Weak Skills',
      description: 'Questions on topics you need improvement in',
      icon: '📈',
    },
    {
      id: 'random',
      name: 'Random Topics',
      description: 'Mix of various interview topics',
      icon: '🎲',
    },
    {
      id: 'specific',
      name: 'Specific Topic',
      description: 'Deep dive into a particular topic',
      icon: '🎯',
    },
  ];

  const handleStartInterview = async () => {
    if (focus === 'specific' && !specificTopic) {
      toast.error('Please select a specific topic');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        interviewType: mode,
        focus,
        questionCount: length,
      };

      if (focus === 'specific') {
        payload.focusTopics = [specificTopic];
      }

      const interview = await interviewAPI.create(payload);

      if (interview?._id) {
        navigate(`/candidate/interview/${interview._id}`);
        toast.success('Mock interview session started!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start mock interview');
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    'Data Structures',
    'Algorithms',
    'System Design',
    'Database Design',
    'API Design',
    'OOP Concepts',
    'Design Patterns',
    'Web Development',
    'JavaScript/TypeScript',
    'Python',
    'React',
    'Node.js',
    'Microservices',
    'DevOps',
    'Cloud Computing',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Setup Your Mock Interview</h1>
          <p className="text-slate-400 text-lg">Customize your interview experience for maximum learning</p>
        </div>

        {/* Main Setup Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-8 space-y-12">
          {/* Mode Selection */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Interview Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id as any)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    mode === option.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <h3 className="font-bold text-white mb-1">{option.name}</h3>
                  <p className="text-sm text-slate-400">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Selection */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Focus Area</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {focusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFocus(option.id as any)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    focus === option.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <h3 className="font-bold text-white mb-1">{option.name}</h3>
                  <p className="text-sm text-slate-400">{option.description}</p>
                </button>
              ))}
            </div>

            {/* Specific Topic Selection */}
            {focus === 'specific' && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6">
                <label className="block text-white font-semibold mb-4">Select Topic</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSpecificTopic(topic)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        specificTopic === topic
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interview Length */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Interview Length</h2>
            <div className="space-y-4">
              <div className="flex gap-6">
                {[4, 6, 8].map((len) => (
                  <button
                    key={len}
                    onClick={() => setLength(len)}
                    className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                      length === len
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {len} Questions
                    <div className="text-sm font-normal text-slate-300 mt-1">
                      ~{Math.round(len * 5)} min
                    </div>
                  </button>
                ))}
              </div>

              {/* Slider for custom length */}
              <div className="mt-8">
                <label className="block text-slate-400 text-sm font-medium mb-3">
                  Or customize: {length} questions
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
            <h3 className="text-white font-bold mb-4">Interview Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Mode</p>
                <p className="text-white font-semibold capitalize">{mode}</p>
              </div>
              <div>
                <p className="text-slate-400">Focus</p>
                <p className="text-white font-semibold capitalize">{focus}</p>
              </div>
              {focus === 'specific' && (
                <div>
                  <p className="text-slate-400">Topic</p>
                  <p className="text-white font-semibold">{specificTopic || 'Not selected'}</p>
                </div>
              )}
              <div>
                <p className="text-slate-400">Questions</p>
                <p className="text-white font-semibold">{length}</p>
              </div>
              <div>
                <p className="text-slate-400">Est. Duration</p>
                <p className="text-white font-semibold">~{Math.round(length * 5)} min</p>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={loading || (focus === 'specific' && !specificTopic)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Starting Interview...
              </>
            ) : (
              <>
                <span>🚀</span>
                Start Mock Interview
              </>
            )}
          </button>

          {/* Tips */}
          <div className="border-t border-slate-600 pt-8">
            <h3 className="text-white font-bold mb-4">Interview Tips</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">💡</span>
                <span>Focus on weak skills helps improve your performance faster</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">⏱️</span>
                <span>Longer interviews (8 questions) are more realistic and comprehensive</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">🎯</span>
                <span>Mixed mode gives you a real interview experience</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
