import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview, ResumeConsistencyReport, AdaptiveHistoryEvent } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import DifficultyBadge from '../components/DifficultyBadge';
import {
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowLeft,
  AlertCircle,
  Code2,
  FileText,
  Zap,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// Helper component for safe score display
const ScoreCard = ({ score, label, icon: Icon, description }: { score?: number; label: string; icon: any; description?: string }) => {
  const displayScore = score ?? 0;
  const formattedScore = typeof displayScore === 'number' ? displayScore.toFixed(1) : '0.0';

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md bg-white dark:bg-zinc-950/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
        <Icon size={14} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-heading font-bold lining-nums">{formattedScore}</div>
        {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default function InterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consistency, setConsistency] = useState<ResumeConsistencyReport | null>(null);
  const [adaptiveHistory, setAdaptiveHistory] = useState<AdaptiveHistoryEvent[]>([]);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await interviewAPI.getInterviewById(id!);
      const [consistencyData, historyData] = await Promise.all([
        interviewAPI.getConsistency(id!).catch(() => null),
        interviewAPI.getAdaptiveHistory(id!).catch(() => []),
      ]);

      if (data.status !== 'completed') {
        setError('Evaluation engine processing. Please check back in a few moments.');
        return;
      }

      setInterview(data);
      setConsistency(consistencyData);
      setAdaptiveHistory(historyData || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load repository data';
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
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="p-12 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <AlertCircle className="mx-auto mb-4 text-zinc-400" size={48} />
          <h2 className="text-2xl font-heading font-bold mb-2">Issue Loading Results</h2>
          <p className="text-muted-foreground mb-8">{error || 'The requested evaluation could not be retrieved.'}</p>
          <Button onClick={() => navigate('/candidate/dashboard')} variant="outline" className="rounded-xl px-8">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8.5) return 'Exceptional';
    if (score >= 7) return 'Above Benchmark';
    if (score >= 5) return 'Baseline Met';
    return 'Room for Growth';
  };

  const finalEvaluation = interview.finalEvaluation;
  const consistencyReport = consistency || finalEvaluation?.resumeConsistency;
  const trajectory = finalEvaluation?.skillTrajectory || [];
  const overallScore = interview.averageScore || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Meta */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/candidate/dashboard')}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Workspace Analytics
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">Performance Summary</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(interview.updatedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Target size={14} /> REC ID: {interview._id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-lg px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] border-zinc-200 dark:border-zinc-800">
            {interview.interviewType || 'THEORETICAL'}
          </Badge>
          <Badge variant="secondary" className="rounded-lg px-3 py-1.5 font-bold uppercase tracking-wider text-[10px]">
            VERIFIED
          </Badge>
        </div>
      </section>

      {/* Aggregate Score Section */}
      <Card className="overflow-hidden border-0 bg-zinc-950 text-white shadow-2xl relative">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-zinc-500/30 to-transparent" />
        </div>

        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex-1 space-y-8 w-full">
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">System Percentile Proficiency</span>
                  <span className="text-2xl font-heading font-bold lining-nums">{(overallScore * 10).toFixed(0)}%</span>
                </div>
                <Progress value={overallScore * 10} className="h-2 bg-zinc-900" indicatorClassName="bg-white" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Theoretical</p>
                  <p className="text-2xl font-heading font-bold">{interview.theoreticalScore?.toFixed(1) || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Coding</p>
                  <p className="text-2xl font-heading font-bold">{interview.codingScore?.toFixed(1) || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Segments</p>
                  <p className="text-2xl font-heading font-bold">{interview.questions?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50 min-w-[280px]">
              <div className="text-center">
                <Award size={48} className="mx-auto mb-3 text-zinc-400" />
                <div className="text-6xl font-heading font-bold tracking-tighter lining-nums">
                  {overallScore.toFixed(1)}
                </div>
                <p className="text-sm font-semibold text-zinc-300 mt-1">{getScoreLabel(overallScore)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intelligence & Analytics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Consistency Scan */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-none bg-zinc-50/50 dark:bg-zinc-950/20 overflow-hidden">
            <CardHeader className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-transparent pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                <Target size={16} className="text-zinc-500" /> Resume Alignment Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {consistencyReport ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-widest">Score Accuracy</p>
                      <div className="text-4xl font-heading font-bold mb-1">{consistencyReport.resumeClaimAccuracy}%</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Statistical correlation between self-reported skills and evaluation performance.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block">Verified Competencies</span>
                      <div className="flex flex-wrap gap-2">
                        {consistencyReport.verifiedStrengths?.map(s => <Badge key={s} variant="secondary" className="text-[10px] uppercase font-bold">{s}</Badge>)}
                      </div>
                    </div>
                    {consistencyReport.inflatedSkills?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-rose-500 tracking-widest block">Accuracy Gaps</span>
                        <div className="flex flex-wrap gap-2">
                          {consistencyReport.inflatedSkills.map(s => <Badge key={s} variant="outline" className="text-[10px] uppercase font-bold border-rose-200 dark:border-rose-900 text-rose-600">{s}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">No alignment data generated for this session.</p>
              )}
            </CardContent>
          </Card>

          {/* Qualitative Evaluation */}
          {finalEvaluation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-0 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                    <CheckCircle size={14} /> Core Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {finalEvaluation.strengths?.map((str, i) => (
                    <div key={i} className="flex gap-3 text-sm text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                      <span className="text-emerald-500 font-bold">✓</span> {str}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 bg-rose-50/50 dark:bg-rose-950/20 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 text-rose-800 dark:text-rose-300 uppercase tracking-widest">
                    <XCircle size={14} /> Roadblocks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {finalEvaluation.weaknesses?.map((weak, i) => (
                    <div key={i} className="flex gap-3 text-sm text-rose-900/80 dark:text-rose-200/80 leading-relaxed">
                      <span className="text-rose-400 font-bold">!</span> {weak}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2 border-0 bg-zinc-100 dark:bg-zinc-800 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
                    <Lightbulb size={14} className="text-amber-500" /> Strategic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {finalEvaluation.recommendations?.map((rec, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 font-medium">
                      {rec}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar Analytics */}
        <aside className="space-y-8">
          {/* Skill Trajectory */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Proficiency Helix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                  {trajectory.length > 0 ? (
                    trajectory.map((entry, idx) => (
                      <div key={idx} className="group space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold truncate max-w-[140px]">{entry.topic}</span>
                          <Badge variant="outline" className="text-[9px] font-bold border-zinc-300 dark:border-zinc-700">{entry.currentLevel.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-tighter">
                          <span>Growth: {entry.growthRate}</span>
                          <span>Trend: {entry.improvementTrend}</span>
                        </div>
                        {entry.plateauDetected && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-500">
                            <span className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" /> SATURATION REACHED
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-8">Baseline established. Subsequent sessions will build trajectory intel.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Adaptive Engine History */}
          {adaptiveHistory.length > 0 && (
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Adaptive Load Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {adaptiveHistory.slice(-5).map((event, idx) => (
                  <div key={idx} className="text-[11px] leading-relaxed p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-medium">
                    <span className="text-muted-foreground mr-1">Q{event.questionIndex + 1}:</span>
                    <span className="capitalize">{event.previousDifficulty}</span> → <span className="capitalize font-bold text-zinc-900 dark:text-zinc-100">{event.newDifficulty}</span>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{event.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Transcript Log */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-heading font-bold tracking-tight">Interview Ledger</h2>
          <Badge variant="secondary" className="px-3 rounded-full font-mono text-xs">{interview.answers?.length} ENTRIES</Badge>
        </div>

        <div className="grid gap-8">
          {interview.answers?.map((answer, index) => {
            const question = interview.questions?.[index];
            return (
              <Card key={index} className="border-0 shadow-sm overflow-hidden bg-white dark:bg-zinc-950/50">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-3 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-mono rounded">S-{index + 1}</Badge>
                        {question && <DifficultyBadge difficulty={question.difficulty} />}
                        {question?.topic && <Badge variant="outline" className="text-[10px] uppercase font-bold text-zinc-400 border-zinc-200 dark:border-zinc-800">{question.topic}</Badge>}
                      </div>
                      <h3 className="text-xl font-heading font-bold leading-tight">{answer.question}</h3>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Response Captured</p>
                      <div className={`p-6 rounded-2xl text-sm leading-relaxed border ${answer.isCodingAnswer
                          ? 'bg-zinc-950 text-emerald-400 font-mono border-zinc-800'
                          : 'bg-zinc-50 dark:bg-zinc-900 text-foreground border-zinc-200/50 dark:border-zinc-800/50'
                        }`}>
                        {answer.response || "NO INPUT COLLECTED"}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      {answer.aiEvaluation && (
                        <div className={`h-full rounded-2xl p-6 border ${answer.isCodingAnswer
                            ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30'
                            : 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30'
                          }`}>
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Evaluation Analytics</span>
                            <div className="flex items-center gap-1.5 transition-all hover:scale-110">
                              <span className="text-[10px] font-bold">SCORE</span>
                              <span className="text-2xl font-heading font-bold lining-nums text-primary">{(answer.aiEvaluation.score || answer.aiEvaluation.finalCodingScore || 0).toFixed(1)}</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {answer.isCodingAnswer ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[9px] font-bold uppercase opacity-50 mb-1">Time complexity</p>
                                  <code className="text-xs font-mono text-purple-700 dark:text-purple-400">{answer.aiEvaluation.timeComplexity || '—'}</code>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase opacity-50 mb-1">Space complexity</p>
                                  <code className="text-xs font-mono text-purple-700 dark:text-purple-400">{answer.aiEvaluation.spaceComplexity || '—'}</code>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold opacity-60">
                                  <span>Technical Accuracy</span>
                                  <span className="text-blue-600 dark:text-blue-400">{answer.aiEvaluation.technicalAccuracy}%</span>
                                </div>
                                <Progress value={Number(answer.aiEvaluation.technicalAccuracy) || 0} className="h-1" />
                              </div>
                            )}

                            <Separator className="opacity-20" />

                            <div className="space-y-2">
                              <p className="text-[9px] font-bold uppercase opacity-50">Segment Insight</p>
                              <p className="text-xs leading-relaxed font-medium">
                                {answer.aiEvaluation.depth || answer.aiEvaluation.logicScore || 'Evaluation metrics computed successfully.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

