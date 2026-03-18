import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, interviewAPI, analyticsAPI, Interview, OverviewAnalytics, Resume } from '../services/api';
import { Upload, FileText, Trash2, Play, AlertCircle, Link2, ArrowUpRight, CheckCircle2, History, Zap, Target, Star, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { validateFile, formatFileSize } from '../utils/fileValidation';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import CountUpNumber from '../components/motion/CountUpNumber';
import { cn } from '@/lib/utils';

const SkillAnalyticsDashboard = lazy(() => import('../components/SkillAnalyticsDashboard'));

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
    () => interviews.filter((interview) => interview.status === 'completed').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
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
      <div className="mx-auto max-w-5xl space-y-8 animate-pulse pt-8">
        <header className="space-y-4">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
        </header>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 h-64 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
          <div className="lg:col-span-2 h-64 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>
    );
  }

  const topSkills = resume?.structuredData?.skills?.slice(0, 8) || [];
  const actionCards = [
    { title: 'Practice Rounds', subtitle: 'Targeted skill drills', path: '/candidate/practice', icon: BrainCircuit },
    { title: 'Mock Setup', subtitle: 'Configure new sessions', path: '/candidate/mock/setup', icon: Zap },
    { title: 'Skill Analytics', subtitle: 'Growth & trajectory', path: '/candidate/analytics', icon: Target },
    { title: 'Latest Report', subtitle: 'Deep-dive feedback', path: completedInterviews[0]?._id ? `/candidate/results/${completedInterviews[0]._id}` : '/candidate/dashboard', icon: FileText }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10 font-sans pb-12 animate-in fade-in duration-700">
      <header className="mt-8 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1.5 text-left">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Candidate Dashboard</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Manage your workspace and track interview readiness.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold tracking-widest text-[10px] px-3">
              ACTIVE SESSION
            </Badge>
          </div>
        </div>
      </header>

      {overview && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
            <div className="flex items-center gap-2">
              <Star className="text-amber-500 w-4 h-4 fill-amber-500" />
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Readiness Protocol</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Overall Score</p>
                <div className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50 lining-nums">
                  <CountUpNumber value={overview.readinessScore} decimals={1} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tier Status</p>
                <Badge variant="secondary" className="mt-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold px-3">
                  {overview.readinessLevel?.toUpperCase() || 'EVALUATING'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Top Competency</p>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{overview.strongestSkill || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Target Focus</p>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{overview.weakestSkill || '—'}</p>
              </div>
            </div>
            <div className="mt-10 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                <span>System Alignment Progress</span>
                <span className="text-zinc-900 dark:text-zinc-100">{overview.readinessPercentage || 0}%</span>
              </div>
              <Progress value={overview.readinessPercentage || 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionCards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-left shadow-sm transition-all hover:border-zinc-900 dark:hover:border-zinc-100 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex w-full items-start justify-between">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-zinc-50 dark:group-hover:text-zinc-950 transition-colors">
                <card.icon size={20} />
              </div>
              <ArrowUpRight size={18} className="text-zinc-300 dark:text-zinc-700 transition-colors group-hover:text-zinc-950 dark:group-hover:text-white" />
            </div>
            <div className="mt-6">
              <h3 className="font-heading font-bold text-zinc-900 dark:text-zinc-50">{card.title}</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">{card.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5 items-stretch">
        <Card className="lg:col-span-3 flex flex-col rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg overflow-hidden">
          <div className="border-b border-zinc-100 dark:border-zinc-900 px-8 py-6 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-zinc-400" />
              <h2 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">Active Resume Scan</h2>
            </div>
            {resume && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Remove this resume context from the platform?')) {
                    setResume(null);
                    toast.info('Resume context removed.');
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-rose-500"
              >
                Clear Context
              </Button>
            )}
          </div>

          <div className="flex-1 p-8">
            {resume ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate max-w-sm">{resume.fileName}</h3>
                    <p className="text-sm font-medium text-zinc-400">Contextualization Complete</p>
                  </div>
                  {resume.aiValidated && (
                    <Badge variant="outline" className="h-8 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      AI VERIFIED ARCHIVE
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-3">Target Domain</span>
                    <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">{resume.structuredData?.primaryDomain || 'Technical Lead'}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-3">Industry Record</span>
                    <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">{resume.structuredData?.experienceYears || '0'} Years Experience</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">Core Competency Graph</span>
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 h-7 font-bold text-[10px] uppercase border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors hover:border-zinc-900 dark:hover:border-zinc-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full space-y-6">
                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-inner flex items-center justify-center">
                  <Upload className="text-zinc-300 dark:text-zinc-700" size={32} />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="font-heading font-bold text-zinc-900 dark:text-zinc-100">Upload Resume Metadata</h3>
                  <p className="text-sm text-zinc-500 font-medium">Standard PDF format, maximum allocation 5MB.</p>
                </div>
                <label className="group relative cursor-pointer pt-4">
                  <input
                    id="resume-file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <span className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-50 px-8 text-sm font-bold text-white dark:text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto">
                    {uploading ? (
                      <><Spinner size="sm" className="mr-3" /> Initializing...</>
                    ) : (
                      'Synchronize Metadata'
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 rounded-3xl bg-zinc-950 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-zinc-100/5 rounded-full blur-3xl pointer-events-none group-hover:bg-zinc-100/10 transition-colors duration-1000" />

          <div className="relative z-10 p-10 space-y-6">
            <div className="space-y-4">
              <Badge className="bg-white/10 dark:bg-white/20 hover:bg-white/20 text-white border-0 text-[10px] font-bold uppercase tracking-[.2em] px-4 rounded-full">
                LIVE INTERFACE
              </Badge>
              <h2 className="font-heading text-4xl font-bold tracking-tight text-white leading-tight">Adaptive Assessment Round</h2>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Our dynamic engine will now synthesize a sequence of targeted scenarios based on your uploaded competency profile.
              </p>
            </div>

            <div className="space-y-4 pt-10">
              <Button
                onClick={startNewInterview}
                disabled={!resume}
                size="lg"
                className="w-full h-14 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all font-bold text-base gap-3 shadow-xl shadow-white/5"
              >
                <Play size={18} fill="currentColor" />
                Initialize Rounds
              </Button>
              <p className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Estimated Round Duration: 25 MIN</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm p-0 shadow-xl overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-900 px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History size={18} className="text-zinc-400" />
            <h2 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-100">Historical Ledger</h2>
          </div>
          <Badge variant="outline" className="rounded-sm font-mono font-bold text-[10px]">{interviews.length} SESSIONS</Badge>
        </div>

        {interviews.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No session telemetry recorded.</p>
            <p className="text-xs text-zinc-500 font-medium">Complete your first round to establish a performance baseline.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {interviews.map((interview) => {
              const completed = interview.status === 'completed';
              return (
                <div
                  key={interview._id}
                  onClick={() => navigate(completed ? `/candidate/results/${interview._id}` : `/candidate/interview/${interview._id}`)}
                  className="group flex flex-col md:flex-row items-center justify-between p-10 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all gap-8"
                >
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("px-3 rounded-full font-bold text-[10px] uppercase tracking-widest",
                        completed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20")}>
                        {completed ? 'METADATA FINALIZED' : 'IN PROGRESS'}
                      </Badge>
                      <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest">
                        {new Date(interview.createdAt).toISOString().split('T')[0].replace(/-/g, ' • ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                      Technical Assessment Protocol
                      <ArrowUpRight size={18} className="text-zinc-300 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {interview.answers.length} Processed Segments / {interview.questions.length} Round Target
                    </p>
                  </div>

                  {completed && (
                    <div className="flex items-center gap-8 w-full md:w-auto justify-between border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-900 pt-8 md:pt-0 md:pl-8">
                      <div className="text-right flex flex-col justify-end">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">AGGREGATE SCORE</span>
                        <p className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50 lining-nums leading-none">
                          {interview.averageScore.toFixed(1)}<span className="text-lg text-zinc-400 font-medium ml-1">/10</span>
                        </p>
                      </div>
                      <CheckCircle2 size={32} className="text-zinc-100 dark:text-zinc-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
