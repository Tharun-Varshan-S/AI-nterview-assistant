import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import DifficultyBadge from '../components/DifficultyBadge';
import { Award, TrendingUp, CheckCircle, XCircle, Lightbulb, ArrowLeft, AlertCircle } from 'lucide-react';

// Helper component for safe score display
const ScoreDisplay = ({ score, label, color = 'blue' }: { score?: number; label: string; color?: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  
  const displayScore = score ?? '—';
  const formattedScore = typeof displayScore === 'number' ? displayScore.toFixed(1) : displayScore;
  
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

// Fallback UI for missing evaluation
const EvaluationFallback = () => (
  <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
    <AlertCircle className="mx-auto mb-3 text-yellow-600" size={32} />
    <p className="text-sm font-medium text-yellow-800">Evaluation Not Available</p>
    <p className="text-xs text-yellow-700 mt-2">
      The final evaluation is still being processed. Please refresh the page in a few moments.
    </p>
  </div>
);

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
  const overallScore = finalEvaluation?.overallScore ?? interview.averageScore ?? 0;
  const hasEvaluation = finalEvaluation && Object.keys(finalEvaluation).length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/candidate/dashboard')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interview Results</h1>
            <p className="text-slate-200">
              Completed on {new Date(interview.updatedAt).toLocaleString()}
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${Math.min(100, overallScore * 10)}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <Award size={48} className="mx-auto mb-2" />
            <div className="text-5xl font-bold">{overallScore.toFixed(1)}</div>
            <p className="text-lg mt-1">{getScoreLabel(overallScore)}</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <ScoreDisplay
            score={interview.questions.length}
            label="Total Questions"
            color="blue"
          />
          <ScoreDisplay
            score={finalEvaluation?.technicalAccuracy}
            label="Technical Accuracy"
            color="blue"
          />
          <ScoreDisplay
            score={finalEvaluation?.clarity}
            label="Clarity"
            color="emerald"
          />
          <ScoreDisplay
            score={finalEvaluation?.depth}
            label="Depth"
            color="purple"
          />
          <ScoreDisplay
            score={finalEvaluation?.problemSolving}
            label="Problem Solving"
            color="amber"
          />
        </div>
      </div>

      {/* Final Evaluation */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Final Evaluation</h2>
        {hasEvaluation ? (
          <div className="space-y-6">
            {/* Evaluation Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Technical Accuracy</p>
                <div className="text-2xl font-bold text-blue-700 mt-2">
                  {finalEvaluation?.technicalAccuracy?.toFixed(1) ?? '—'}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Clarity</p>
                <div className="text-2xl font-bold text-emerald-700 mt-2">
                  {finalEvaluation?.clarity?.toFixed(1) ?? '—'}
                </div>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Depth</p>
                <div className="text-2xl font-bold text-purple-700 mt-2">
                  {finalEvaluation?.depth?.toFixed(1) ?? '—'}
                </div>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Problem Solving</p>
                <div className="text-2xl font-bold text-amber-700 mt-2">
                  {finalEvaluation?.problemSolving?.toFixed(1) ?? '—'}
                </div>
              </div>
            </div>

            {/* Strengths, Weaknesses, Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Strengths
                </h4>
                {finalEvaluation?.strengths && finalEvaluation.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {finalEvaluation.strengths.map((strength, i) => (
                      <ListItem key={i} text={strength} icon="✓" color="text-emerald-600" />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No strengths available</p>
                )}
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <XCircle size={18} className="text-rose-600" />
                  Weaknesses
                </h4>
                {finalEvaluation?.weaknesses && finalEvaluation.weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {finalEvaluation.weaknesses.map((weakness, i) => (
                      <ListItem key={i} text={weakness} icon="✗" color="text-rose-600" />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No weaknesses identified</p>
                )}
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Lightbulb size={18} className="text-yellow-600" />
                  Improvements
                </h4>
                {finalEvaluation?.improvements && finalEvaluation.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {finalEvaluation.improvements.map((improvement, i) => (
                      <ListItem key={i} text={improvement} icon="💡" color="text-yellow-600" />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No improvements suggested</p>
                )}
              </div>
            </div>

            {/* Hiring Recommendation */}
            <div className="rounded-xl border border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100 p-6">
              <p className="text-sm font-medium text-slate-600 mb-2">Hiring Recommendation</p>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {finalEvaluation?.hiringRecommendation?.replace('-', ' ') ?? 'No Decision'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Based on comprehensive evaluation of technical skills, communication, and problem-solving ability.
              </p>
            </div>
          </div>
        ) : (
          <EvaluationFallback />
        )}
      </div>

      {/* Interview Q&A */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Interview Q&A</h2>
        <div className="space-y-6">
          {interview.answers && interview.answers.length > 0 ? (
            interview.answers.map((answer, index) => {
              const question = interview.questions?.find((q) => q.id === answer.questionId);
              return (
                <div key={answer.questionId} className="border border-slate-200 rounded-xl p-6 bg-white/80 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                        {question && <DifficultyBadge difficulty={question.difficulty} />}
                      </div>
                      <h3 className="text-base font-medium text-slate-900">{answer.question}</h3>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Your Answer:</h4>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-800 border border-slate-200">
                      {answer.response || 'No response provided'}
                    </div>
                  </div>
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
