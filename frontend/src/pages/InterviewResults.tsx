import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import DifficultyBadge from '../components/DifficultyBadge';
import { Award, TrendingUp, CheckCircle, XCircle, Lightbulb, ArrowLeft } from 'lucide-react';

export default function InterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await interviewAPI.getInterviewById(id!);
      
      if (data.status !== 'completed') {
        toast.error('Interview is not completed yet');
        navigate(`/candidate/interview/${id}`);
        return;
      }
      
      setInterview(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load results');
      navigate('/candidate/dashboard');
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

  if (!interview) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

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
                style={{ width: `${Math.min(100, interview.averageScore * 10)}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <Award size={48} className="mx-auto mb-2" />
            <div className="text-5xl font-bold">{interview.averageScore.toFixed(1)}</div>
            <p className="text-lg mt-1">{getScoreLabel(interview.averageScore)}</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">{interview.questions.length}</div>
            <p className="text-slate-600">Total Questions</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{interview.answers.length}</div>
            <p className="text-slate-600">Answered</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">
              {interview.totalScore.toFixed(1)}
            </div>
            <p className="text-slate-600">Total Score</p>
          </div>
        </div>
      </div>

      {/* Question-by-Question Analysis */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
        <div className="space-y-6">
          {interview.answers.map((answer, index) => {
            const evaluation = answer.aiEvaluation;
            
            return (
              <div key={answer.questionId} className="border border-slate-200 rounded-xl p-6 bg-white/80">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                      <DifficultyBadge
                        difficulty={
                          interview.questions.find((q) => q.id === answer.questionId)?.difficulty ||
                          'medium'
                        }
                      />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">{answer.question}</h3>
                  </div>
                  {evaluation && (
                    <div className="text-right ml-4">
                      <div className={`text-3xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                        {evaluation.overallScore.toFixed(1)}
                      </div>
                      <p className="text-sm text-slate-500">Score</p>
                      <div className="mt-2 h-2 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, evaluation.overallScore * 10)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Your Answer */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Your Answer:</h4>
                  <div className="bg-slate-50 rounded-lg p-4 text-slate-800">
                    {answer.response}
                  </div>
                </div>

                {/* AI Evaluation */}
                {evaluation && (
                  <div className="space-y-4">
                    {/* Score Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-blue-600">Technical Accuracy</p>
                            <div className="text-lg font-semibold text-blue-700">
                              {evaluation.technicalAccuracy.toFixed(1)}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                            {Math.round(evaluation.technicalAccuracy * 10)}%
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-blue-100">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${Math.min(100, evaluation.technicalAccuracy * 10)}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-emerald-600">Clarity</p>
                            <div className="text-lg font-semibold text-emerald-700">
                              {evaluation.clarity.toFixed(1)}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-semibold">
                            {Math.round(evaluation.clarity * 10)}%
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-emerald-100">
                          <div
                            className="h-2 rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(100, evaluation.clarity * 10)}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-purple-600">Depth</p>
                            <div className="text-lg font-semibold text-purple-700">
                              {evaluation.depth.toFixed(1)}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                            {Math.round(evaluation.depth * 10)}%
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-purple-100">
                          <div
                            className="h-2 rounded-full bg-purple-600"
                            style={{ width: `${Math.min(100, evaluation.depth * 10)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Strengths */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600" />
                        Strengths
                      </h4>
                      {evaluation.strengths.length > 0 ? (
                        <ul className="space-y-1">
                          {evaluation.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-emerald-600 mt-1">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">No strengths were highlighted for this answer.</p>
                      )}
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <XCircle size={16} className="text-rose-600" />
                        Areas to Improve
                      </h4>
                      {evaluation.weaknesses.length > 0 ? (
                        <ul className="space-y-1">
                          {evaluation.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-rose-600 mt-1">✗</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">No improvement areas were flagged.</p>
                      )}
                    </div>

                    {/* Improvement Suggestions */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-600" />
                        Next-step Suggestions
                      </h4>
                      {evaluation.improvementSuggestions.length > 0 ? (
                        <ul className="space-y-1">
                          {evaluation.improvementSuggestions.map((suggestion, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-amber-600 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">No suggestions were provided.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={() => navigate('/candidate/dashboard')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
