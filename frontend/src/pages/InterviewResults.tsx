import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import DifficultyBadge from '../components/DifficultyBadge';
import { Award, TrendingUp, CheckCircle, XCircle, Lightbulb, ArrowLeft, AlertCircle, Code2, FileText, Zap } from 'lucide-react';

// Helper component for safe score display
const ScoreDisplay = ({ score, label, color = 'blue' }: { score?: number; label: string; color?: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  
  const displayScore = score ?? 0;
  const formattedScore = typeof displayScore === 'number' ? displayScore.toFixed(1) : '0.0';
  
  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
      <div className="text-2xl font-bold">{formattedScore}</div>
    </div>
  );
};

// Helper component for list items
const ListItem = ({ text, icon, color }: { text: string; icon: string; color: string }) => (
  <li className="text-sm flex items-start gap-2">
    <span className={`mt-1 ${color}`}>{icon}</span>
    <span className="text-slate-700">{text}</span>
  </li>
);

// Interview Type Badge Component
const InterviewTypeBadge = ({ type }: { type?: string }) => {
  const typeConfig = {
    theoretical: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText },
    coding: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Code2 },
    mixed: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Zap },
  };
  
  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.theoretical;
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
      <Icon size={16} />
      <span className="capitalize">{type || 'theoretical'}</span>
    </div>
  );
};

export default function InterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await interviewAPI.getInterviewById(id!);
      
      if (data.status !== 'completed') {
        setError('Interview is not completed yet');
        return;
      }
      
      setInterview(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load results';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/candidate/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-600" size={32} />
          <p className="text-sm font-medium text-red-800">{error || 'Failed to load results'}</p>
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const finalEvaluation = interview.finalEvaluation;
  const overallScore = interview.averageScore || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/candidate/dashboard')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      {/* Overall Score Card with Interview Type */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interview Results</h1>
            <p className="text-slate-200">
              Completed on {new Date(interview.updatedAt).toLocaleString()}
            </p>
          </div>
          <InterviewTypeBadge type={interview.interviewType} />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mt-4 h-2 rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${Math.min(100, overallScore * 10)}%` }}
              />
            </div>
          </div>
          <div className="text-center ml-8">
            <Award size={48} className="mx-auto mb-2" />
            <div className="text-5xl font-bold">{overallScore.toFixed(1)}</div>
            <p className="text-lg mt-1">{getScoreLabel(overallScore)}</p>
</div>
        </div>
      </div>

      {/* Score Breakdown - 3 Distinct Blocks */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ScoreDisplay
            score={overallScore}
            label="Overall Score"
            color="blue"
          />
          <ScoreDisplay
            score={interview.theoreticalScore}
            label="Theoretical Score"
            color="emerald"
          />
          <ScoreDisplay
            score={interview.codingScore}
            label="Coding Score"
            color="purple"
          />
          <ScoreDisplay
            score={interview.questions?.length || 0}
            label="Total Questions"
            color="amber"
          />
        </div>
      </div>

      {/* Final Evaluation Summary */}
      {finalEvaluation && (
        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold mb-4">Final Evaluation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600" />
                Strengths
              </h4>
              {finalEvaluation.strengths && finalEvaluation.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {finalEvaluation.strengths.map((strength, i) => (
                    <ListItem key={i} text={strength} icon="✓" color="text-emerald-600" />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No strengths available</p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <XCircle size={18} className="text-rose-600" />
                Weaknesses
              </h4>
              {finalEvaluation.weaknesses && finalEvaluation.weaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {finalEvaluation.weaknesses.map((weakness, i) => (
                    <ListItem key={i} text={weakness} icon="✗" color="text-rose-600" />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No weaknesses identified</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-yellow-600" />
                Recommendations
              </h4>
              {finalEvaluation.recommendations && finalEvaluation.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {finalEvaluation.recommendations.map((rec, i) => (
                    <ListItem key={i} text={rec} icon="💡" color="text-yellow-600" />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No recommendations available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Q&A with Conditional Evaluation Panels */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Interview Q&A</h2>
        <div className="space-y-6">
          {interview.answers && interview.answers.length > 0 ? (
            interview.answers.map((answer, index) => {
              const question = interview.questions?.[index];
              return (
                <div key={index} className="border border-slate-200 rounded-xl p-6 bg-white/80 hover:shadow-md transition-shadow">
                  {/* Question Header with Metadata */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                        {question && <DifficultyBadge difficulty={question.difficulty} />}
                        {question?.topic && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {question.topic}
                          </span>
                        )}
                        {question?.domain && (
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">
                            {question.domain}
                          </span>
                        )}
                        {answer.isCodingAnswer && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                            <Code2 size={12} />
                            Coding Question
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-medium text-slate-900">{answer.question}</h3>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Your Answer:</h4>
                    <div className={`rounded-lg p-4 text-sm border ${
                      answer.isCodingAnswer 
                        ? 'bg-slate-900 text-slate-100 border-slate-700 font-mono' 
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}>
                      {answer.response || 'No response provided'}
                    </div>
                    {answer.isCodingAnswer && answer.language && (
                      <p className="text-xs text-slate-500 mt-1">Language: {answer.language}</p>
                    )}
                  </div>

                  {/* Conditional Evaluation Panel */}
                  {answer.aiEvaluation && (
                    answer.isCodingAnswer ? (
                      /* CODING METRICS PANEL */
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <Code2 size={16} />
                          Coding Evaluation
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Logic Score</p>
                            <p className="text-lg font-bold text-purple-900">
                              {answer.aiEvaluation.logicScore?.toFixed(1) || '—'}/10
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Readability</p>
                            <p className="text-lg font-bold text-purple-900">
                              {answer.aiEvaluation.readabilityScore?.toFixed(1) || '—'}/10
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Time Complexity</p>
                            <p className="text-sm font-mono text-purple-900">
                              {answer.aiEvaluation.timeComplexity || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Space Complexity</p>
                            <p className="text-sm font-mono text-purple-900">
                              {answer.aiEvaluation.spaceComplexity || '—'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-purple-600 font-medium">Edge Case Handling</p>
                            <p className="text-sm text-purple-900">
                              {answer.aiEvaluation.edgeCaseHandling || 'Not evaluated'}
                            </p>
                          </div>
                        </div>
                        {answer.aiEvaluation.improvementSuggestions && answer.aiEvaluation.improvementSuggestions.length > 0 && (
                          <div className="border-t border-purple-200 pt-3 mt-3">
                            <p className="text-xs text-purple-600 font-medium mb-2">Improvement Suggestions:</p>
                            <ul className="space-y-1">
                              {answer.aiEvaluation.improvementSuggestions.map((suggestion, i) => (
                                <li key={i} className="text-sm text-purple-900 flex items-start gap-2">
                                  <span className="text-purple-400">→</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* THEORETICAL METRICS PANEL */
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <FileText size={16} />
                          Theoretical Evaluation
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Score</p>
                            <p className="text-lg font-bold text-blue-900">
                              {answer.aiEvaluation.score?.toFixed(1) || '—'}/10
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Technical Accuracy</p>
                            <p className="text-sm text-blue-900">
                              {answer.aiEvaluation.technicalAccuracy || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Clarity</p>
                            <p className="text-sm text-blue-900">
                              {answer.aiEvaluation.clarity || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Depth</p>
                            <p className="text-sm text-blue-900">
                              {answer.aiEvaluation.depth || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-blue-200 pt-3">
                          {answer.aiEvaluation.strengths && answer.aiEvaluation.strengths.length > 0 && (
                            <div>
                              <p className="text-xs text-blue-600 font-medium mb-1">Strengths:</p>
                              <ul className="space-y-1">
                                {answer.aiEvaluation.strengths.map((strength, i) => (
                                  <li key={i} className="text-xs text-blue-900 flex items-start gap-1">
                                    <span className="text-emerald-500">✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {answer.aiEvaluation.weaknesses && answer.aiEvaluation.weaknesses.length > 0 && (
                            <div>
                              <p className="text-xs text-blue-600 font-medium mb-1">Weaknesses:</p>
                              <ul className="space-y-1">
                                {answer.aiEvaluation.weaknesses.map((weakness, i) => (
                                  <li key={i} className="text-xs text-blue-900 flex items-start gap-1">
                                    <span className="text-rose-500">✗</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {answer.aiEvaluation.improvements && answer.aiEvaluation.improvements.length > 0 && (
                            <div>
                              <p className="text-xs text-blue-600 font-medium mb-1">Improvements:</p>
                              <ul className="space-y-1">
                                {answer.aiEvaluation.improvements.map((improvement, i) => (
                                  <li key={i} className="text-xs text-blue-900 flex items-start gap-1">
                                    <span className="text-yellow-500">💡</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No Q&A recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
