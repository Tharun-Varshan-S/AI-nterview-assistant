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
  Calendar,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    if (score >= 8) return 'Elite Performance';
    if (score >= 6) return 'Strong Candidate';
    if (score >= 4) return 'Baseline Assessment';
    return 'Action Required';
  };

  const finalEvaluation = interview.finalEvaluation;
  const overallScore = finalEvaluation?.overallScore ?? interview.averageScore ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/recruiter/dashboard')}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Pipeline
        </Button>
        <Badge variant="outline" className="px-3 py-1 font-medium capitalize border-zinc-200 dark:border-zinc-800">
          Interview UID: {interview._id.slice(-6).toUpperCase()}
        </Badge>
      </div>

      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-3xl border bg-zinc-950 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-zinc-900/50 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">{user.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-1.5 text-sm">
                  <Mail size={14} /> {user.email}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <Calendar size={14} /> {new Date(interview.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-zinc-100 text-zinc-950 border-0 hover:bg-zinc-200">
                {interview.questions.length} EVALUATED SEGMENTS
              </Badge>
              <Badge variant="outline" className="text-white border-zinc-700">
                {user.role.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-800">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">AGGREGATE SCORE</p>
              <div className="text-5xl font-heading font-bold lining-nums tracking-tighter">
                {overallScore.toFixed(1)}
              </div>
            </div>
            <Separator orientation="vertical" className="h-12 bg-zinc-800" />
            <div>
              <p className="font-semibold text-zinc-100">{getScoreLabel(overallScore)}</p>
              <p className="text-xs text-zinc-400">System Verified Assessment</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics & Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Breakdown */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-zinc-500" />
                Performance Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-0">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Theoretical Proficiency</p>
                <div className="text-2xl font-heading font-bold">{(interview.theoreticalScore ?? 0).toFixed(1)}</div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-1000 ease-out"
                    style={{ width: `${(interview.theoreticalScore ?? 0) * 10}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Coding Implementation</p>
                <div className="text-2xl font-heading font-bold">{(interview.codingScore ?? 0).toFixed(1)}</div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-1000 ease-out"
                    style={{ width: `${(interview.codingScore ?? 0) * 10}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Communication Quality</p>
                <div className="text-2xl font-heading font-bold">{(interview.averageScore ?? 0).toFixed(1)}</div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-1000 ease-out"
                    style={{ width: `${(interview.averageScore ?? 0) * 10}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-sm font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle size={16} /> CORE STRENGTHS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(finalEvaluation?.strengths && finalEvaluation.strengths.length > 0) ? (
                  finalEvaluation.strengths.map((str, i) => (
                    <div key={i} className="flex gap-2 text-sm text-emerald-900/80 dark:text-emerald-200/80">
                      <span className="shrink-0 text-emerald-500 mt-1">•</span>
                      {str}
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic opacity-50">No distinctive traits identified</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-rose-50/50 dark:bg-rose-950/20 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-sm font-bold flex items-center gap-2 text-rose-800 dark:text-rose-300">
                  <XCircle size={16} /> GROWTH AREAS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(finalEvaluation?.weaknesses && finalEvaluation.weaknesses.length > 0) ? (
                  finalEvaluation.weaknesses.map((weak, i) => (
                    <div key={i} className="flex gap-2 text-sm text-rose-900/80 dark:text-rose-200/80">
                      <span className="shrink-0 text-rose-400 mt-1">•</span>
                      {weak}
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic opacity-50">No major roadblocks detected</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Q&A Log */}
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold tracking-tight">Interview Transcript</h2>
            <div className="space-y-6">
              {interview.answers.map((answer, index) => {
                const question = interview.questions[answer.questionIndex ?? index];
                return (
                  <Card key={index} className="border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-none group">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded font-mono text-[10px]">Q{index + 1}</Badge>
                            {question && <DifficultyBadge difficulty={question.difficulty} />}
                          </div>
                          <h3 className="text-lg font-bold leading-snug text-foreground/90">{answer.question}</h3>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                        <div className="pl-6 py-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Response Analytics</p>
                          <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm italic border-l-0">
                            "{answer.response}"
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Assets */}
        <div className="space-y-8">
          {/* Resume & Documents */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <FileText size={20} className="text-zinc-500" />
                Asset Intel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {resume ? (
                <>
                  <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-bold truncate mb-1">{resume.fileName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider">
                      <Calendar size={10} />
                      PROCESSED {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    className="w-full h-12 gap-2 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-white border-0"
                    onClick={() => window.open(`http://localhost:5000/${resume.filePath}`, '_blank')}
                  >
                    <Download size={16} />
                    View & Retrieve PDF
                  </Button>

                  {resume.extractedText && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Extracted Content Scan</p>
                      <ScrollArea className="h-64 w-full rounded-md border p-4 bg-zinc-50 dark:bg-zinc-950/50">
                        <div className="text-[11px] font-mono leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {resume.extractedText}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm text-muted-foreground italic">No document telemetry found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recruiter Meta */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-sm font-medium">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Interview Evaluation Mode Active
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

