import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview, SessionMetrics } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import DifficultyBadge from '../components/DifficultyBadge';
import { interviewStateStorage } from '../utils/interviewStateStorage';
import { Send, CheckCircle, AlertCircle, Terminal, Zap, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LeetCodeEditor } from '@/components/code-editor';
import type { CodingProblem, ExecutionResult } from '@/components/code-editor/types';

const QUESTION_TIME_LIMIT = 180;
const DIFFICULTY_TIME_LIMITS: Record<string, number> = {
  easy: 60,
  medium: 120,
  hard: 180
};

const JUDGE0_TO_APP_LANGUAGE: Record<number, string> = {
  71: 'python',
  63: 'javascript',
  62: 'java',
  54: 'cpp',
  50: 'c',
  74: 'typescript'
};

const getInterviewCodingStorageKey = (interviewId: string, questionIndex: number) =>
  `interview_code_${interviewId}_${questionIndex}`;

const getStoredCodingDraft = (storageKey: string) => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return { code: '', language: 'javascript' };
    const parsed = JSON.parse(saved);
    const code = typeof parsed?.code === 'string' ? parsed.code : '';
    const language = JUDGE0_TO_APP_LANGUAGE[Number(parsed?.languageId)] || 'javascript';
    return { code, language };
  } catch {
    return { code: '', language: 'javascript' };
  }
};

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [codingAnswer, setCodingAnswer] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [timeKey, setTimeKey] = useState(0);
  const [wasRefreshed, setWasRefreshed] = useState(false);
  const [difficultyChange, setDifficultyChange] = useState<'increased' | 'decreased' | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [targetWeakTopic, setTargetWeakTopic] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [firstTypingTime, setFirstTypingTime] = useState<number | null>(null);
  const [nonCodingEditCount, setNonCodingEditCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadInterview();
  }, [id]);

  useEffect(() => {
    textareaRef.current?.focus();
    setQuestionStartTime(Date.now());
    setFirstTypingTime(null);
    setNonCodingEditCount(0);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (interview && id) {
      interviewStateStorage.saveState(id, {
        currentQuestionIndex,
        answers: interview.answers.map((a) => ({
          questionIndex: a.questionIndex,
          response: a.response,
          isCodingAnswer: a.isCodingAnswer,
          language: a.language,
        })),
      });
    }
  }, [currentQuestionIndex, interview, id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (interview?.status === 'in-progress' && interview.answers.length < interview.questions.length) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [interview]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await interviewAPI.getInterviewById(id!);
      setInterview(data);

      const savedState = interviewStateStorage.loadState(id!);
      const isStale = interviewStateStorage.isStateStale(id!);

      if (savedState && !isStale && data.answers.length < data.questions.length) {
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setWasRefreshed(true);
        toast.info('Interview restored from where you left off');
        setTimeout(() => setWasRefreshed(false), 3000);
      } else if (data.status === 'completed') {
        navigate(`/candidate/results/${id}`);
        return;
      } else {
        setCurrentQuestionIndex(data.answers.length);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load interview';
      toast.error(errorMessage);
      console.error('Interview load error:', error);
      navigate('/candidate/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (
    responsePayload: { response: string; isCodingAnswer?: boolean; language?: string },
    autoSubmit = false
  ) => {
    if (submitting) {
      return;
    }
    if (!responsePayload.response.trim() && !autoSubmit) {
      toast.error('Please enter your answer');
      return;
    }

    const currentQuestion = interview!.questions[currentQuestionIndex];

    try {
      setSubmitting(true);
      const previousDifficulty = interview?.currentDifficulty;
      const { interview: updatedInterview, currentDifficulty, sessionMetrics: nextSessionMetrics } = await interviewAPI.submitAnswer(
        id!,
        {
          questionIndex: currentQuestionIndex,
          question: currentQuestion.question,
          response: responsePayload.response.trim() || '(No answer provided)',
          isCodingAnswer: responsePayload.isCodingAnswer,
          language: responsePayload.language,
          interactionMetrics: {
            timeSpentSec: Math.max(0, Math.round((Date.now() - questionStartTime) / 1000)),
            typingDurationMs: responsePayload.isCodingAnswer
              ? 0
              : firstTypingTime
                ? Date.now() - firstTypingTime
                : 0,
            editCount: responsePayload.isCodingAnswer ? 0 : nonCodingEditCount,
            autoSubmitted: autoSubmit,
          },
        }
      );

      setInterview(updatedInterview);
      setSessionMetrics(nextSessionMetrics || null);
      if (nextSessionMetrics?.weakTopics?.length) {
        setTargetWeakTopic(nextSessionMetrics.weakTopics[0].topic);
      }
      if (previousDifficulty && currentDifficulty && previousDifficulty !== currentDifficulty) {
        const order = ['easy', 'medium', 'hard'];
        const previousIndex = order.indexOf(previousDifficulty);
        const currentIndex = order.indexOf(currentDifficulty);
        setDifficultyChange(currentIndex > previousIndex ? 'increased' : 'decreased');
      } else {
        setDifficultyChange(null);
      }
      setAnswer('');
      setCodingAnswer('');

      if (currentQuestionIndex + 1 < interview!.questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeKey((prev) => prev + 1);
        toast.success(autoSubmit ? 'Time up! Auto-submitted' : 'Answer submitted!');
      } else {
        interviewStateStorage.clearState(id!);
        if (updatedInterview.status === 'completed') {
          toast.success('Interview completed!');
          navigate(`/candidate/results/${id}`);
        } else {
          toast.info('Final evaluation in progress. Redirecting to results...');
          navigate(`/candidate/results/${id}`);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit answer';
      toast.error(errorMessage);
      console.error('Submit answer error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeout = () => {
    if (interview?.status === 'in-progress' && !submitting) {
      const isCoding = isCodingQuestion(interview.questions[currentQuestionIndex]);
      const draftKey = id ? getInterviewCodingStorageKey(id, currentQuestionIndex) : '';
      const storedDraft = isCoding && draftKey ? getStoredCodingDraft(draftKey) : null;
      handleSubmitAnswer(
        {
          response: isCoding ? (storedDraft?.code || codingAnswer) : answer,
          isCodingAnswer: isCoding,
          language: isCoding ? (storedDraft?.language || codingLanguage) : undefined,
        },
        true
      );
    }
  };

  const currentQuestion = interview?.questions?.[currentQuestionIndex];

  function isCodingQuestion(question?: Interview['questions'][0]) {
    if (!question) return false;
    const questionAny = question as { isCoding?: boolean; type?: string; topic?: string; domain?: string; question?: string };
    if (questionAny?.isCoding) return true;
    if (questionAny?.type === 'coding') return true;
    if (interview?.interviewType === 'coding') return true;
    if (interview?.interviewType === 'theoretical') return false;

    const text = `${questionAny?.topic || ''} ${questionAny?.domain || ''} ${questionAny?.question || ''}`.toLowerCase();
    const codingKeywords = ['coding', 'programming', 'algorithm', 'data structure', 'implement', 'function', 'code'];
    return codingKeywords.some((keyword) => text.includes(keyword));
  }

  const isCoding = isCodingQuestion(currentQuestion);
  const progress = interview ? (currentQuestionIndex / interview.questions.length) * 100 : 0;
  const questionTimeLimit = Math.max(
    15,
    Number(
      currentQuestion?.timeLimit ||
      DIFFICULTY_TIME_LIMITS[String(currentQuestion?.difficulty || '').toLowerCase()] ||
      QUESTION_TIME_LIMIT
    )
  );
  const targetingWeakSkill =
    Boolean(currentQuestion?.targetingWeakSkill) ||
    (Boolean(targetWeakTopic) && currentQuestion?.topic === targetWeakTopic);

  const remainingQuestions = interview ? (interview.questions.length - currentQuestionIndex - 1) : 0;

  const codingProblem = useMemo((): CodingProblem | null => {
    if (!isCoding || !currentQuestion || !id) return null;

    const questionAny = currentQuestion as any;
    const allTestCases = Array.isArray(questionAny.testCases)
      ? questionAny.testCases.map((tc: any) => ({
          input: tc.input ?? '',
          expected: tc.expected ?? tc.expectedOutput ?? tc.expected_output ?? tc.output ?? '',
          isHidden: tc.isHidden ?? false,
          description: tc.description ?? ''
        }))
      : [];

    const visibleTestCases = allTestCases.filter((tc: any) => !tc.isHidden);

    let examples = [];
    if (Array.isArray(questionAny.examples) && questionAny.examples.length > 0) {
      examples = questionAny.examples.map((ex: any) => ({
        input: ex.input ?? '',
        output: ex.output ?? ex.expected ?? ex.expected_output ?? ex.expectedOutput ?? '',
        explanation: ex.explanation ?? ''
      }));
    } else if (visibleTestCases.length > 0) {
      examples = visibleTestCases.slice(0, 2).map((tc: any) => ({
        input: tc.input,
        output: tc.expected,
        explanation: tc.description || ''
      }));
    } else if (allTestCases.length > 0) {
      examples = allTestCases.slice(0, 2).map((tc: any) => ({
        input: tc.input,
        output: tc.expected,
        explanation: tc.description || ''
      }));
    }

    return {
      id: `interview_${id}_${currentQuestionIndex}`,
      title: questionAny.title || `Problem ${currentQuestionIndex + 1}`,
      description: currentQuestion.question || '',
      difficulty: (questionAny.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
      inputFormat: questionAny.inputFormat || '',
      outputFormat: questionAny.outputFormat || '',
      constraints: Array.isArray(questionAny.constraints) ? questionAny.constraints : [],
      examples,
      testCases: visibleTestCases,
      hiddenTestCases: allTestCases
        .filter((tc: any) => tc.isHidden)
        .map((tc: any) => ({
          input: tc.input ?? '',
          expected: tc.expected ?? '',
          isHidden: true,
          description: tc.description ?? ''
        })),
      topic: questionAny.topic || 'Coding',
      tags: questionAny.tags || [questionAny.topic || 'Coding'],
      timeLimit: Number(questionAny.timeLimit || 180)
    };
  }, [currentQuestion, currentQuestionIndex, id, isCoding]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!interview) return null;
  if (!currentQuestion) return null;

  const handleCodingSubmit = async (_result: ExecutionResult, code: string, languageId: number) => {
    const mappedLanguage = JUDGE0_TO_APP_LANGUAGE[languageId] || 'javascript';
    setCodingAnswer(code);
    setCodingLanguage(mappedLanguage);

    await handleSubmitAnswer(
      { response: code, isCodingAnswer: true, language: mappedLanguage },
      false
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12 animate-in fade-in duration-500">
      {wasRefreshed && (
        <Alert className="border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-heading font-semibold text-zinc-900 dark:text-zinc-100">Session Restored</AlertTitle>
          <AlertDescription className="text-zinc-600 dark:text-zinc-400">
            We restored your interview to your last submitted answer.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Current Progress</p>
              <h3 className="font-heading font-bold text-2xl text-zinc-900 dark:text-zinc-100 leading-none">
                Question {currentQuestionIndex + 1} <span className="text-zinc-400 dark:text-zinc-600 text-lg font-medium ml-1">/ {interview.questions.length}</span>
              </h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">{progress.toFixed(0)}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
            <Badge variant="outline" className="h-7 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-1.5 items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Level:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{interview.currentDifficulty || currentQuestion.difficulty}</span>
            </Badge>

            {difficultyChange && (
              <Badge variant="secondary" className="h-7 flex gap-1.5 items-center animate-in zoom-in duration-300">
                <Zap className="h-3 w-3" />
                <span className="font-bold">Difficulty {difficultyChange}</span>
              </Badge>
            )}

            {targetingWeakSkill && (
              <Badge variant="secondary" className="h-7 flex gap-1.5 items-center border-amber-200/50 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                <Target className="h-3 w-3" />
                <span className="font-bold">Adaptive Focus</span>
              </Badge>
            )}
          </div>

          <CountdownTimer key={timeKey} seconds={questionTimeLimit} onTimeout={handleTimeout} />
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-zinc-950/80">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 px-8 py-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-sm border-zinc-300 dark:border-zinc-700 text-[10px] font-bold tracking-widest uppercase py-0 px-2 h-5">Question</Badge>
                {currentQuestion.topic && <span className="text-xs font-medium text-muted-foreground/80">@{currentQuestion.topic}</span>}
              </div>
              <CardTitle className="font-heading text-3xl font-bold leading-[1.15] text-zinc-900 dark:text-zinc-50 max-w-3xl tracking-tight">
                {currentQuestion.question}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {currentQuestion.domain && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50">
                    <Terminal className="h-3 w-3" />
                    {currentQuestion.domain}
                  </span>
                )}
                {sessionMetrics && (
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-1">
                    AVG. SCORE
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono text-sm leading-none bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{sessionMetrics.averageScore.toFixed(1)}</span>
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="min-h-[300px]">
              {isCoding ? (
                codingProblem ? (
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <LeetCodeEditor
                      problem={codingProblem}
                      onSubmit={handleCodingSubmit}
                      storageKey={getInterviewCodingStorageKey(id!, currentQuestionIndex)}
                      showProblemPanel={true}
                      autoSave={true}
                      className="h-[700px]"
                    />
                  </div>
                ) : null
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Your Response</label>
                    <span className="text-[10px] font-bold font-mono text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {answer.length} characters
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={(e) => {
                      if (firstTypingTime === null) {
                        setFirstTypingTime(Date.now());
                      }
                      setNonCodingEditCount((prev) => prev + 1);
                      setAnswer(e.target.value);
                    }}
                    placeholder="Enter your detailed technical response here..."
                    className="min-h-[320px] w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 px-6 py-5 text-zinc-900 dark:text-zinc-100 text-lg leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none focus:ring-0 disabled:opacity-60 shadow-inner"
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {submitting && (
              <div className="mt-8 flex items-center justify-center p-8 gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 border-dashed animate-pulse">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-bounce"></div>
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Synchronizing Response Analysis...</span>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Remaining</span>
                <Badge variant="outline" className="font-mono font-bold">{remainingQuestions}</Badge>
              </div>

              {!isCoding && (
                <Button
                  onClick={() =>
                    handleSubmitAnswer(
                      { response: answer, isCodingAnswer: false },
                      false
                    )
                  }
                  size="lg"
                  disabled={submitting || !answer.trim()}
                  className="rounded-full px-8 h-12 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-zinc-900/10 dark:shadow-none bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                >
                  {submitting ? (
                    'Processing...'
                  ) : currentQuestionIndex + 1 === interview.questions.length ? (
                    <span className="flex items-center gap-2">Complete Interview <CheckCircle className="h-4 w-4" /></span>
                  ) : (
                    <span className="flex items-center gap-2">Submit Answer <Send className="h-4 w-4" /></span>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!isCoding && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Evaluation Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 font-medium">
              <li className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-1.5 shrink-0" />
                <span>Technical accuracy and depth of architectural decisions.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-1.5 shrink-0" />
                <span>Clarity of communication and problem-solving efficiency.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400">AI Evaluator Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400">Environment Secure</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}

