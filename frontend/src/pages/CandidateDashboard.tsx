import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, interviewAPI, Interview, Resume } from '../services/api';
import { Upload, FileText, Trash2, Play, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import Skeleton from '../components/Skeleton';
import SkillAnalyticsDashboard from '../components/SkillAnalyticsDashboard';
import { validateFile, formatFileSize } from '../utils/fileValidation';

export default function CandidateDashboard() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [resumeData, interviewsData] = await Promise.all([
        resumeAPI.get().catch(() => null),
        interviewAPI.getMyInterviews(),
      ]);
      setResume(resumeData);
      setInterviews(interviewsData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load dashboard';
      toast.error(errorMessage);
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      toast.error(validation.error);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      console.debug('📍 Uploading resume', { fileName: file.name, size: formatFileSize(file.size) });

      const uploadedResume = await resumeAPI.upload(file);
      setResume(uploadedResume);
      setRetryCount(0); // Reset retry count on success
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload resume';
      setUploadError(errorMessage);
      console.error('Resume upload error:', error);

      // Determine if error is retryable
      const isNetworkError = error.message && error.message.includes('timeout');
      const is5xxError = error.response?.status >= 500;
      const isRetryable = isNetworkError || is5xxError;

      if (isRetryable && retryCount < 2) {
        toast.error(`${errorMessage}. Retrying...`);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          // Retry upload after a delay
          handleFileUpload(e);
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    setRetryCount(0);
    // Trigger file input again
    const input = document.getElementById('resume-file-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const startNewInterview = async () => {
    if (!resume) {
      toast.error('Add your resume first so we can tailor the questions.');
      return;
    }

    try {
      const interview = await interviewAPI.create();
      toast.success('Interview session created. You can start right away.');
      navigate(`/candidate/interview/${interview._id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Unable to start interview right now.';
      toast.error(errorMessage);
      console.error('Interview creation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-4 h-24 w-full" />
              <Skeleton className="mt-4 h-10 w-40" />
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <Skeleton className="h-6 w-40" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-600 mt-1">Your interview workspace is ready. Keep your resume updated and continue where you left off.</p>
      </div>

      {/* Resume Section */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900">
            <FileText size={24} />
            Resume Profile
          </h2>
          {resume && (
            <button
              onClick={() => {
                const confirmed = window.confirm('Remove this resume? You can upload a new one anytime.');
                if (!confirmed) {
                  return;
                }
                setResume(null);
                toast.info('Resume removed. Upload an updated version when ready.');
              }}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 size={16} />
              Remove
            </button>
          )}
        </div>

        {resume ? (
          <div className="space-y-4">
            {/* Resume File Info */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="text-emerald-600 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{resume.fileName}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Uploaded on {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {resume.aiValidated && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Validated</span>
                    <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                      {Math.round(resume.aiConfidence * 100)}% confidence
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resume Intelligence */}
            {resume.structuredData && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Resume Intelligence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Domain */}
                  {resume.structuredData.primaryDomain && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium mb-1">Primary Domain</p>
                      <p className="text-sm text-blue-900 font-semibold">
                        {resume.structuredData.primaryDomain}
                      </p>
                    </div>
                  )}

                  {/* Experience Years */}
                  {resume.structuredData.experienceYears > 0 && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium mb-1">Experience</p>
                      <p className="text-sm text-blue-900 font-semibold">
                        {resume.structuredData.experienceYears} {resume.structuredData.experienceYears === 1 ? 'year' : 'years'}
                      </p>
                    </div>
                  )}

                  {/* Top Skills */}
                  {resume.structuredData.skills && resume.structuredData.skills.length > 0 && (
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-xs text-blue-600 font-medium mb-2">Top Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {resume.structuredData.skills.slice(0, 6).map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full border border-blue-200 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.structuredData.skills.length > 6 && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            +{resume.structuredData.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Technologies */}
                  {resume.structuredData.technologies && resume.structuredData.technologies.length > 0 && (
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-xs text-blue-600 font-medium mb-2">Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {resume.structuredData.technologies.slice(0, 6).map((tech: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                        {resume.structuredData.technologies.length > 6 && (
                          <span className="px-3 py-1 bg-indigo-200 text-indigo-800 text-xs rounded-full font-medium">
                            +{resume.structuredData.technologies.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-white/60">
            {uploadError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-3">
                <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-rose-900">{uploadError}</p>
                  <button
                    onClick={handleRetryUpload}
                    className="mt-2 text-sm font-medium text-rose-700 hover:text-rose-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
            <Upload className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Upload a resume to personalize interviews</h3>
            <p className="text-slate-600 mb-4">PDF only, max 5MB. We use it to tune the questions and evaluation.</p>
            <label className="cursor-pointer">
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <span className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:bg-gray-400">
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {retryCount > 0 ? `Retrying (${retryCount})...` : 'Uploading...'}
                  </span>
                ) : (
                  'Choose File'
                )}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Start Interview Button */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Ready for the next round?</h2>
        <p className="text-slate-200 mb-4">
          Launch a timed interview session with AI evaluation. Your progress is saved automatically.
        </p>
        <button
          onClick={startNewInterview}
          disabled={!resume}
          className="bg-white text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors disabled:bg-slate-400 disabled:text-white disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          <Play size={20} />
          Start New Interview
        </button>
      </div>

      {/* Performance Analytics */}
      {interviews.filter((i) => i.status === 'completed').length > 0 && (
        <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Performance Analytics</h2>
          <SkillAnalyticsDashboard interviews={interviews} />
        </div>
      )}

      {/* Interview History */}
      <div className="bg-white/80 rounded-2xl shadow-sm border border-white/60 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Your Interviews</h2>

        {interviews.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-700 text-lg font-medium">No interviews yet</p>
            <p className="text-slate-500 mt-2">Kick off a new session to see AI feedback instantly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => (
              <div
                key={interview._id}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-white/70"
                onClick={() => {
                  if (interview.status === 'in-progress') {
                    navigate(`/candidate/interview/${interview._id}`);
                  } else {
                    navigate(`/candidate/results/${interview._id}`);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          interview.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      <span className="text-slate-600 text-sm">
                        {new Date(interview.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-2">
                      {interview.answers.length} / {interview.questions.length} questions answered
                    </p>
                  </div>
                  {interview.status === 'completed' && (
                    <div className="text-right min-w-[120px]">
                      <div className="text-2xl font-bold text-slate-900">
                        {interview.averageScore.toFixed(1)}
                      </div>
                      <p className="text-sm text-slate-500">Avg Score</p>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, interview.averageScore * 10)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
