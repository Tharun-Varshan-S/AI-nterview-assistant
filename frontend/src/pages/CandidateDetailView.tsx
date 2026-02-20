import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recruiterAPI, Interview, Resume, User } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import DifficultyBadge from '../components/DifficultyBadge';
import {
  ArrowLeft,
  FileText,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  Download,
} from 'lucide-react';

export default function CandidateDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidateDetails();
  }, [id]);

  const loadCandidateDetails = async () => {
    try {
      setLoading(true);
      const data = await recruiterAPI.getInterviewWithDetails(id!);
      setInterview(data.interview);
      setResume(data.resume);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load candidate details');
      navigate('/recruiter/dashboard');
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

  const user = interview.userId as User;
  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const finalEvaluation = interview.finalEvaluation;
  const overallScore = finalEvaluation?.overallScore ?? interview.averageScore ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/recruiter/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      {/* Candidate Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
            <p className="text-blue-100 mb-4">{user.email}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {interview.questions.length} Questions
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Completed {new Date(interview.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-center bg-white/20 rounded-xl p-6">
            <Award size={48} className="mx-auto mb-2" />
            <div className="text-5xl font-bold">{overallScore.toFixed(1)}</div>
            <p className="text-lg mt-1">{getScoreLabel(overallScore)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Interview Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={24} />
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {finalEvaluation ? finalEvaluation.technicalAccuracy.toFixed(1) : '—'}
                </div>
                <p className="text-sm text-gray-600">Technical Accuracy</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {finalEvaluation ? finalEvaluation.clarity.toFixed(1) : '—'}
                </div>
                <p className="text-sm text-gray-600">Clarity</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {finalEvaluation ? finalEvaluation.depth.toFixed(1) : '—'}
                </div>
                <p className="text-sm text-gray-600">Depth</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {finalEvaluation ? finalEvaluation.problemSolving.toFixed(1) : '—'}
                </div>
                <p className="text-sm text-gray-600">Problem Solving</p>
              </div>
            </div>
          </div>

          {/* Final Evaluation */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Final Evaluation</h2>
            {finalEvaluation && Object.keys(finalEvaluation).length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs font-medium text-blue-600 mb-1">Technical Accuracy</p>
                    <div className="text-2xl font-bold text-blue-700">
                      {finalEvaluation?.technicalAccuracy?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-600 mb-1">Clarity</p>
                    <div className="text-2xl font-bold text-emerald-700">
                      {finalEvaluation?.clarity?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-xs font-medium text-purple-600 mb-1">Depth</p>
                    <div className="text-2xl font-bold text-purple-700">
                      {finalEvaluation?.depth?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-600 mb-1">Problem Solving</p>
                    <div className="text-2xl font-bold text-amber-700">
                      {finalEvaluation?.problemSolving?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      Strengths
                    </h4>
                    {finalEvaluation?.strengths && finalEvaluation.strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {finalEvaluation.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No strengths recorded</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <XCircle size={16} className="text-rose-600" />
                      Weaknesses
                    </h4>
                    {finalEvaluation?.weaknesses && finalEvaluation.weaknesses.length > 0 ? (
                      <ul className="space-y-2">
                        {finalEvaluation.weaknesses.map((weakness, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-rose-600 mt-0.5">✗</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No weaknesses identified</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-600" />
                      Improvements
                    </h4>
                    {finalEvaluation?.improvements && finalEvaluation.improvements.length > 0 ? (
                      <ul className="space-y-2">
                        {finalEvaluation.improvements.map((improvement, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">💡</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No suggestions available</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-2">Hiring Recommendation</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {finalEvaluation?.hiringRecommendation?.replace('-', ' ') ?? 'No Decision'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">Evaluation data not available</p>
              </div>
            )}
          </div>

          {/* Interview Q&A */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Interview Q&A</h2>
            <div className="space-y-6">
              {interview.answers.map((answer, index) => {
                const question = interview.questions.find((q) => q.id === answer.questionId);

                return (
                  <div key={answer.questionId} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Question {index + 1}
                          </span>
                          {question && <DifficultyBadge difficulty={question.difficulty} />}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{answer.question}</h3>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Candidate's Answer:
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                        {answer.response}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Resume */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText size={24} />
              Resume
            </h2>

            {resume ? (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">{resume.fileName}</p>
                  <p className="text-xs text-gray-600">
                    Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <a
                  href={`http://localhost:5000/${resume.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  Download Resume
                </a>

                {resume.extractedText && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Extracted Text</h3>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto text-xs text-gray-700">
                      {resume.extractedText}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No resume uploaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
