import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, interviewAPI, analyticsAPI, Interview, OverviewAnalytics, Resume } from '../services/api';
import { Upload, FileText, Trash2, Play, AlertCircle, Link2, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import Skeleton from '../components/Skeleton';
import { validateFile, formatFileSize } from '../utils/fileValidation';
import {
  AnimatedCard,
  AnimatedProgressBar,
  AnimatedTooltip,
  CountUpNumber,
  GlowBadge,
  MicroButton,
  PulseIndicator,
  StaggerContainer,
} from '../components/motion';

const SkillAnalyticsDashboard = lazy(() => import('../components/SkillAnalyticsDashboard'));

function InterviewSparkline({ value }: { value: number }) {
  const width = 90;
  const height = 28;
  const peak = 10;
  const normalized = Math.max(0.6, Math.min(9.5, value));
  const points = [
    [0, 22],
    [16, 20],
    [32, 16],
    [48, 18],
    [64, Math.max(5, 24 - normalized * (20 / peak))],
    [80, 10],
  ];

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  return (
    <svg width={width} height={height} viewBox="0 0 90 28" className="overflow-visible">
      <path d={path} fill="none" stroke="#3BA2FF" strokeWidth="2" strokeDasharray="220" className="animate-line-draw" />
      <circle cx="80" cy="10" r="2" fill="#39D4AA" className="animate-soft-pulse" />
    </svg>
  );
}

export default function CandidateDashboard() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const completedInterviews = useMemo(
    () => interviews.filter((interview) => interview.status === 'completed'),
    [interviews]
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [resumeData, interviewsData] = await Promise.all([
        resumeAPI.get().catch(() => null),
        interviewAPI.getMyInterviews(),
      ]);
      setResume(resumeData);
      setInterviews(interviewsData);
      const overviewData = await analyticsAPI.getOverviewAnalytics().catch(() => null);
      setOverview(overviewData?.data || null);
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
      setRetryCount(0);
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload resume';
      setUploadError(errorMessage);
      console.error('Resume upload error:', error);

      const isNetworkError = error.message && error.message.includes('timeout');
      const is5xxError = error.response?.status >= 500;
      const isRetryable = isNetworkError || is5xxError;

      if (isRetryable && retryCount < 2) {
        toast.error(`${errorMessage}. Retrying...`);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="convio-glass p-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-4 h-24 w-full" />
              <Skeleton className="mt-4 h-10 w-40" />
            </div>
            <div className="convio-glass p-6">
              <Skeleton className="h-6 w-40" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
          <div className="convio-glass p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const topSkills = resume?.structuredData?.skills?.slice(0, 8) || [];
  const actionCards = [
    { title: 'Practice', subtitle: 'Warm up with targeted drills', path: '/candidate/practice' },
    { title: 'Mock Setup', subtitle: 'Configure coding or theory rounds', path: '/candidate/mock/setup' },
    { title: 'Analytics', subtitle: 'Review growth and weak areas', path: '/candidate/analytics' },
    { title: 'Latest Results', subtitle: 'Open your most recent report', path: completedInterviews[0]?._id ? `/candidate/results/${completedInterviews[0]._id}` : '/candidate/dashboard' }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-zinc-900">Candidate Command Center</h1>
        <p className="mt-1 text-zinc-600">
          Track readiness, AI confidence, and interview outcomes from one adaptive workspace.
        </p>
      </section>

      {overview && (
        <AnimatedCard className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-md" glowOnHover>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-indigo-100">Readiness Score</p>
              <p className="text-5xl font-semibold">{overview.readinessScore}</p>
            </div>
            <div>
              <p className="text-sm text-indigo-100">Status</p>
              <span className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{overview.readinessLevel || 'Improving'}</span>
            </div>
            <div>
              <p className="text-sm text-indigo-100">Strongest Skill</p>
              <p className="mt-2 text-lg font-semibold">{overview.strongestSkill}</p>
            </div>
            <div>
              <p className="text-sm text-indigo-100">Weakest Skill</p>
              <p className="mt-2 text-lg font-semibold">{overview.weakestSkill}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full animate-pulse bg-white/90" style={{ width: `${overview.readinessPercentage || 0}%` }} />
          </div>
        </AnimatedCard>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionCards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-md transition hover:-translate-y-0.5 hover:border-indigo-300"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <ArrowUpRight size={18} className="text-slate-400 transition group-hover:text-indigo-600" />
            </div>
            <p className="mt-2 text-sm text-slate-600">{card.subtitle}</p>
          </button>
        ))}
      </div>

      {topSkills.length > 0 && (
        <AnimatedCard className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Skill Grid</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {topSkills.map((skill, idx) => (
              <div key={skill} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{skill}</span>
                <span className={idx < 2 ? 'text-emerald-600' : 'text-amber-600'}>{idx < 2 ? '↑' : '→'}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AnimatedCard className="p-6" glowOnHover>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-900">
              <FileText size={22} className="text-teal-600" />
              Resume Intelligence
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
                className="inline-flex items-center gap-1 text-sm text-rose-600 transition-colors hover:text-rose-700"
              >
                <Trash2 size={15} />
                Remove
              </button>
            )}
          </div>

          {resume ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{resume.fileName}</h3>
                    <p className="mt-1 text-sm text-zinc-600">Uploaded on {new Date(resume.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {resume.aiValidated && (
                      <>
                        <PulseIndicator label="AI Verified" />
                        <GlowBadge label="validated" />
                      </>
                    )}
                  </div>
                </div>
                {resume.aiValidated && (
                  <p className="mt-3 text-sm text-zinc-700">
                    Confidence: <CountUpNumber value={Math.round(resume.aiConfidence * 100)} suffix="%" className="font-semibold text-zinc-900" />
                  </p>
                )}
              </div>

              {resume.structuredData && (
                <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Primary Domain</p>
                      <p className="convio-link-line mt-1 inline-flex text-sm font-semibold text-cyan-950">
                        {resume.structuredData.primaryDomain || 'General'}
                      </p>
                    </div>
                    {resume.structuredData.experienceYears > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-cyan-700">Experience</p>
                        <p className="text-sm font-semibold text-cyan-950">{resume.structuredData.experienceYears} years</p>
                      </div>
                    )}
                  </div>

                  <div className="my-3 flex items-center gap-2 text-cyan-600">
                    <Link2 size={14} />
                    <div className="h-px flex-1 bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-400" />
                    <span className="text-[10px] uppercase tracking-[0.2em]">Domain to Skills</span>
                  </div>

                  <StaggerContainer className="flex flex-wrap gap-2" delayStepMs={70}>
                    {topSkills.map((skill) => (
                      <span key={skill} className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-cyan-800">
                        {skill}
                      </span>
                    ))}
                  </StaggerContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
              {uploadError && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-left">
                  <AlertCircle className="mt-0.5 flex-shrink-0 text-rose-600" size={18} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rose-900">{uploadError}</p>
                    <button
                      onClick={handleRetryUpload}
                      className="mt-2 text-sm font-medium text-rose-700 underline hover:text-rose-800"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <Upload className="mx-auto mb-4 text-zinc-400" size={44} />
              <h3 className="text-lg font-medium text-zinc-900">Upload a resume to personalize interviews</h3>
              <p className="mb-4 mt-2 text-zinc-600">PDF only, max 5MB.</p>
              <label className="cursor-pointer">
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="inline-flex rounded-xl bg-zinc-900 px-6 py-2 text-white transition-colors hover:bg-zinc-800">
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
        </AnimatedCard>

        <AnimatedCard className="convio-mesh-bg relative overflow-hidden p-6 text-white" glowOnHover>
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/25" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-transparent bg-[linear-gradient(120deg,rgba(255,255,255,0.25),transparent_45%,rgba(255,255,255,0.25))] opacity-70" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-100">Interview Session</p>
            <h2 className="mt-2 text-2xl font-semibold">Ready for the next round?</h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-100/90">
              Launch a timed session with adaptive difficulty and AI evaluation. Progress is auto-saved.
            </p>
            <MicroButton
              onClick={startNewInterview}
              disabled={!resume}
              glow
              className="mt-6 bg-white text-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              <Play size={18} />
              Start New Interview
            </MicroButton>
          </div>
        </AnimatedCard>
      </div>

      {completedInterviews.length > 0 && (
        <AnimatedCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">Performance Analytics</h2>
            <PulseIndicator label="Live Insights" />
          </div>
          <Suspense fallback={<Skeleton className="h-52 w-full" />}>
            <SkillAnalyticsDashboard interviews={interviews} />
          </Suspense>
        </AnimatedCard>
      )}

      <AnimatedCard className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900">Interview History</h2>

        {interviews.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-lg font-medium text-zinc-700">No interviews yet</p>
            <p className="mt-2 text-zinc-500">Kick off a new session to see AI feedback instantly.</p>
          </div>
        ) : (
          <StaggerContainer className="space-y-3" delayStepMs={90}>
            {interviews.map((interview) => {
              const completed = interview.status === 'completed';
              const score = Math.min(100, interview.averageScore * 10);

              return (
                <AnimatedCard
                  key={interview._id}
                  className="group cursor-pointer border border-zinc-200/70 bg-white/75 p-4"
                  onClick={() =>
                    navigate(completed ? `/candidate/results/${interview._id}` : `/candidate/interview/${interview._id}`)
                  }
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {completed ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="text-sm text-zinc-600">{new Date(interview.createdAt).toLocaleDateString()}</span>
                        {completed && (
                          <AnimatedTooltip content="Score trajectory">
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">Sparkline</span>
                          </AnimatedTooltip>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <p className="text-sm text-zinc-700">
                          {interview.answers.length} / {interview.questions.length} questions answered
                        </p>
                        {completed && <InterviewSparkline value={interview.averageScore} />}
                      </div>
                    </div>

                    {completed && (
                      <div className="min-w-[146px] text-right">
                        <p className="text-2xl font-bold text-zinc-900">
                          <CountUpNumber value={interview.averageScore} decimals={1} />
                        </p>
                        <p className="mb-2 text-xs text-zinc-500">Avg Score</p>
                        <AnimatedProgressBar value={score} max={100} showGlowTrail />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 hidden text-xs text-zinc-500 group-hover:block animate-fade-up">
                    Click to open full question-level feedback and adaptive trend details.
                  </div>
                </AnimatedCard>
              );
            })}
          </StaggerContainer>
        )}
      </AnimatedCard>
    </div>
  );
}
