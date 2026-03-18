import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { interviewAPI, PracticeSession, Question } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Terminal,
  BrainCircuit,
  Clock,
  Code2,
  Zap,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import Editor from '@monaco-editor/react';

export default function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [session, setSession] = useState<(PracticeSession & { questions: Question[]; answers: any[] }) | null>(null);
  const [answer, setAnswer] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const { theme } = useTheme();

  const currentIndex = useMemo(() => session?.questionsAttempted || 0, [session]);
  const currentQuestion = useMemo(() => session?.questions?.[currentIndex], [session, currentIndex]);
  const isCompleted = session?.status === 'completed' || (session && currentIndex >= session.totalQuestions);
  const progress = session ? (Math.min(currentIndex, session.totalQuestions) / session.totalQuestions) * 100 : 0;

  const loadSession = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const data = await interviewAPI.getPracticeSessionDetails(sessionId);
      setSession(data);
      setQuestionStartTime(Date.now());
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Archival retrieval failed.');
      navigate('/candidate/practice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const submitAnswer = async () => {
    if (!session || !sessionId || !currentQuestion) return;
    if (!answer.trim()) {
      toast.error('Response required for evaluation.');
      return;
    }

    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - questionStartTime) / 1000));
    try {
      setSubmitting(true);
      const result = await interviewAPI.submitPracticeAnswer({
        sessionId,
        questionIndex: currentIndex,
        response: answer,
        language: session.mode === 'coding' ? language : undefined,
        timeTaken: elapsedSeconds
      });

      toast.success(`Segment processed. Accuracy: ${Number(result.score || 0).toFixed(1)}/10`);
      setAnswer('');
      await loadSession();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;
    try {
      setFinishing(true);
      const result = await interviewAPI.completePracticeSession(sessionId);
      toast.success(`Protocol complete. Aggregate Score: ${Number(result.score || 0).toFixed(1)}/10`);
      navigate('/candidate/practice');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'System finalization error.');
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20 pt-4 font-sans animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-1.5 text-left">
          <Button
            variant="ghost"
            onClick={() => navigate('/candidate/practice')}
            className="mb-4 p-0 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 gap-2 h-auto"
          >
            <ArrowLeft size={12} /> Abort Session
          </Button>
          <h1 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Practice Round</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Evaluation in progress: <span className="uppercase text-zinc-900 dark:text-zinc-100 font-bold">{session.mode} • {session.topic}</span></p>
        </div>
        <Badge variant="outline" className="h-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold text-[9px] tracking-widest px-3 uppercase">
          Latency: Normal
        </Badge>
      </header>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white/50 dark:bg-zinc-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Progression Velocity</p>
              <div className="text-2xl font-heading font-bold text-zinc-900 dark:text-zinc-50">
                Segment {Math.min(currentIndex + 1, session.totalQuestions)} <span className="text-zinc-300 dark:text-zinc-700 font-medium">/ {session.totalQuestions}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Archival Score</p>
              <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{Number(session.averageScore || 0).toFixed(1)}</div>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </CardContent>
      </Card>

      {!isCompleted ? (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden bg-white dark:bg-zinc-950/40 backdrop-blur-md rounded-3xl">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900 p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="h-5 px-1.5 rounded-sm font-bold text-[9px] uppercase tracking-widest">Question Profile</Badge>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter flex items-center gap-1.5"><Layers size={10} /> Difficulty: {session.difficulty}</span>
              </div>
              <CardTitle className="text-2xl font-heading font-bold leading-tight max-w-2xl">{currentQuestion?.question}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block ml-1">Composition Interface</label>
              {session.mode === 'coding' ? (
                <div className="space-y-4 border border-zinc-100 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-inner">
                  <div className="h-12 bg-zinc-50/80 dark:bg-zinc-900/50 px-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3">
                      <Terminal size={12} className="text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Editor</span>
                    </div>
                    <Badge variant="outline" className="h-6 font-bold text-[9px] uppercase border-zinc-200 dark:border-zinc-800 text-zinc-400 px-2">Syntax: {language}</Badge>
                  </div>
                  <div className="h-[400px]">
                    <Editor
                      height="100%"
                      language={language}
                      value={answer}
                      onChange={(val) => setAnswer(val || '')}
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 20 },
                        fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true
                      }}
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Record your technical analysis..."
                  className="min-h-[280px] w-full resize-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/20 px-8 py-6 text-zinc-900 dark:text-zinc-100 text-lg leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-0 shadow-inner"
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-2">
            <Button
              onClick={submitAnswer}
              disabled={submitting || !answer.trim()}
              className="w-full h-14 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold rounded-2xl shadow-xl hover:scale-[1.01] transition-all gap-2"
            >
              {submitting ? <Spinner size="sm" /> : (
                <>
                  Finalize Metadata <Send size={16} />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-white rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
          <CardHeader className="p-12 relative z-10 space-y-6">
            <Badge className="bg-emerald-500/20 text-emerald-400 border- emerald-500/30 text-[10px] font-bold uppercase tracking-[.2em] px-4 rounded-full h-8 w-fit">
              CYCLE COMPLETE
            </Badge>
            <CardTitle className="text-4xl font-heading font-bold tracking-tight">Evaluation Cycle Terminated</CardTitle>
            <CardDescription className="text-zinc-400 text-base leading-relaxed font-medium">
              All assessment segments have been successfully processed. Commit this cycle to the persistent archival storage to finalize your proficiency telemetry.
            </CardDescription>
          </CardHeader>
          <CardFooter className="p-12 pt-0 relative z-10">
            <Button
              onClick={completeSession}
              disabled={finishing}
              className="w-full h-16 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-2xl shadow-xl transition-all text-lg gap-3"
            >
              {finishing ? <Spinner size="sm" /> : (
                <>
                  Archive Results <CheckCircle2 size={20} />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="flex justify-center gap-10 opacity-30 group hover:opacity-100 transition-opacity duration-500">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Latency</span>
          <span className="text-[10px] font-mono font-bold">12MS</span>
        </div>
        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Protocol</span>
          <span className="text-[10px] font-mono font-bold uppercase">{session.mode}_v4.0</span>
        </div>
        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Archive</span>
          <span className="text-[10px] font-mono font-bold uppercase">{session._id.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
}
