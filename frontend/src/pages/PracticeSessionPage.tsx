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
  ChevronRight,
  Loader2,
  Upload
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

// Import the LeetCode-style editor
import { LeetCodeEditor } from '@/components/code-editor';
import type { CodingProblem, ExecutionResult } from '@/components/code-editor/types';

export default function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [lastScore, setLastScore] = useState<number | null>(null);
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

  // Convert question to CodingProblem format for LeetCodeEditor
  const codingProblem = useMemo((): CodingProblem | null => {
    if (!currentQuestion || session?.mode !== 'coding') return null;

    const q = currentQuestion as any;

    // Get all test cases (both visible and hidden)
    const allTestCases = Array.isArray(q.testCases)
      ? q.testCases.map((tc: any) => ({
          input: tc.input ?? '',
          expected: tc.expected ?? tc.expectedOutput ?? tc.expected_output ?? tc.output ?? '',
          isHidden: tc.isHidden ?? false,
          description: tc.description ?? ''
        }))
      : [];

    // Get visible test cases for running
    const testCases = allTestCases.filter((tc: any) => !tc.isHidden);

    // Build examples - use actual examples first, then fall back to visible test cases
    let examples = [];
    if (Array.isArray(q.examples) && q.examples.length > 0) {
      examples = q.examples.map((ex: any) => ({
        input: ex.input ?? '',
        output: ex.output ?? ex.expected ?? ex.expected_output ?? ex.expectedOutput ?? '',
        explanation: ex.explanation ?? ''
      }));
    } else if (testCases.length > 0) {
      // Use first 2 visible test cases as examples if no examples provided
      examples = testCases.slice(0, 2).map((tc: any) => ({
        input: tc.input,
        output: tc.expected,
        explanation: tc.description || ''
      }));
    } else if (allTestCases.length > 0) {
      // Absolute fallback: use first test cases (even if hidden)
      examples = allTestCases.slice(0, 2).map((tc: any) => ({
        input: tc.input,
        output: tc.expected,
        explanation: tc.description || ''
      }));
    }

    return {
      id: `practice_${sessionId}_${currentIndex}`,
      title: q.title || `Problem ${currentIndex + 1}`,
      description: q.question || '',
      difficulty: (q.difficulty || session?.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
      inputFormat: q.inputFormat || '',
      outputFormat: q.outputFormat || '',
      constraints: Array.isArray(q.constraints) ? q.constraints : [],
      examples,
      testCases,
      hiddenTestCases: allTestCases.filter((tc: any) => tc.isHidden).length > 0
        ? allTestCases.filter((tc: any) => tc.isHidden).map((tc: any) => ({
            input: tc.input ?? '',
            expected: tc.expected ?? tc.expectedOutput ?? '',
            isHidden: true,
            description: tc.description ?? ''
          }))
        : (Array.isArray(q.hiddenTestCases) && q.hiddenTestCases.length > 0
          ? q.hiddenTestCases.map((tc: any) => ({
              input: tc.input ?? '',
              expected: tc.expected ?? tc.expectedOutput ?? '',
              isHidden: true
            }))
          : []),
      topic: q.topic || session?.topic,
      tags: q.tags || [session?.topic || 'Coding'],
      timeLimit: q.timeLimit || 180
    };
  }, [currentQuestion, session, sessionId, currentIndex]);

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

      toast.success(`Segment ${result.questionsAttempted || currentIndex + 1}/${result.totalQuestions || session.totalQuestions} recorded.`);
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
      toast.error(error.response?.data?.message || error.response?.data?.error || 'System finalization error.');
    } finally {
      setFinishing(false);
    }
  };

  // Handle code submission from LeetCodeEditor
  const handleCodeSubmit = async (result: ExecutionResult, code: string, languageId: number) => {
    if (!session || !sessionId || !currentQuestion) return;

    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - questionStartTime) / 1000));
    try {
      setSubmitting(true);
      setSubmissionStatus('submitting');

      // Map languageId to language name
      const languageMap: Record<number, string> = {
        71: 'python', 63: 'javascript', 62: 'java', 54: 'cpp', 50: 'c', 74: 'typescript'
      };
      const langName = languageMap[languageId] || 'javascript';

      const apiResult = await interviewAPI.submitPracticeAnswer({
        sessionId,
        questionIndex: currentIndex,
        response: code,
        language: langName,
        timeTaken: elapsedSeconds
      });

      setLastScore(apiResult.score || 0);
      setSubmissionStatus('success');

      if (result.allPassed) {
        toast.success('All tests passed. Submission recorded for final evaluation.');
      } else {
        toast.info(`Submitted with ${result.passedCount}/${result.totalCount} tests passed. Final score will be computed after completion.`);
      }

      // Reset status after showing success
      setTimeout(() => {
        setSubmissionStatus('idle');
        setLastScore(null);
      }, 2000);

      await loadSession();
    } catch (error: any) {
      setSubmissionStatus('error');
      toast.error(error.response?.data?.message || 'Submission failed.');
      setTimeout(() => setSubmissionStatus('idle'), 2000);
    } finally {
      setSubmitting(false);
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
        session.mode === 'coding' && codingProblem ? (
          // LeetCode-style coding interface with submission status overlay
          <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
            {/* Submission Status Overlay */}
            {submissionStatus !== 'idle' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  {submissionStatus === 'submitting' && (
                    <>
                      <div className="relative">
                        <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mx-auto" />
                        <Upload className="h-5 w-5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">Submitting Solution...</p>
                        <p className="text-sm text-zinc-400">Evaluating your code with AI</p>
                      </div>
                    </>
                  )}
                  {submissionStatus === 'success' && (
                    <>
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                      <div>
                        <p className="text-lg font-bold text-white">Submission Successful!</p>
                        <p className="text-sm text-emerald-300">Recorded for final evaluation.</p>
                      </div>
                    </>
                  )}
                  {submissionStatus === 'error' && (
                    <>
                      <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <span className="text-2xl">❌</span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">Submission Failed</p>
                        <p className="text-sm text-zinc-400">Please try again</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <LeetCodeEditor
              problem={codingProblem}
              onSubmit={handleCodeSubmit}
              storageKey={`practice_code_${sessionId}_${currentIndex}`}
              showProblemPanel={true}
              autoSave={true}
              className="h-[700px]"
            />
          </div>
        ) : (
          // Non-coding question interface
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
                {currentQuestion?.type === 'mcq' && Array.isArray((currentQuestion as any).options) ? (
                  <div className="space-y-3">
                    {(currentQuestion as any).options.map((option: string, idx: number) => {
                      const optionLabel = `${String.fromCharCode(65 + idx)}. ${option}`;
                      const checked = answer === option;
                      return (
                        <button
                          type="button"
                          key={optionLabel}
                          onClick={() => setAnswer(option)}
                          className={cn(
                            "w-full text-left rounded-xl border px-4 py-3 transition-all",
                            checked
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                              : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20 hover:border-zinc-400"
                          )}
                        >
                          <span className="text-sm font-semibold">{optionLabel}</span>
                        </button>
                      );
                    })}
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
        )
      ) : (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-white rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] pointer-events-none" />
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
            <div className="w-full space-y-6">
              {session.evaluationSummary && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                  <div className="text-sm font-bold">Final Score: {Number(session.evaluationSummary.score || 0).toFixed(1)}/10</div>
                  <p className="text-xs text-zinc-300">{session.evaluationSummary.summary}</p>
                  {Array.isArray(session.evaluationSummary.mistakes) && session.evaluationSummary.mistakes.length > 0 && (
                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                      {session.evaluationSummary.mistakes.slice(0, 5).map((mistake, idx) => (
                        <div key={`${mistake.question}-${idx}`} className="rounded-lg border border-zinc-800 p-3 bg-zinc-950/60">
                          <p className="text-[11px] font-semibold text-zinc-300 mb-1">Q{idx + 1}: {mistake.question}</p>
                          <p className="text-[11px] text-red-300">Issue: {mistake.issue}</p>
                          <p className="text-[11px] text-zinc-300">Correct Concept: {mistake.correctConcept}</p>
                          <p className="text-[11px] text-emerald-300">Improve: {mistake.improvement}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
            </div>
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
