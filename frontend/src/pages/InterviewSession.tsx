import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview, SessionMetrics } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import DifficultyBadge from '../components/DifficultyBadge';
import CodingQuestionComponent from '../components/CodingQuestionComponent';
import { interviewStateStorage } from '../utils/interviewStateStorage';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import {
  AnimatedCard,
  AnimatedProgressBar,
  GlowBadge,
  MicroButton,
  PulseIndicator,
} from '../components/motion';

const QUESTION_TIME_LIMIT = 180;

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
  const [codingMetrics, setCodingMetrics] = useState({ editCount: 0, typingDurationMs: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadInterview();
  }, [id]);

  useEffect(() => {
    textareaRef.current?.focus();
    setQuestionStartTime(Date.now());
    setFirstTypingTime(null);
    setNonCodingEditCount(0);
    setCodingMetrics({ editCount: 0, typingDurationMs: 0 });
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
              ? codingMetrics.typingDurationMs
              : firstTypingTime
                ? Date.now() - firstTypingTime
                : 0,
            editCount: responsePayload.isCodingAnswer ? codingMetrics.editCount : nonCodingEditCount,
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
      handleSubmitAnswer(
        {
          response: isCoding ? codingAnswer : answer,
          isCodingAnswer: isCoding,
          language: isCoding ? codingLanguage : undefined,
        },
        true
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!interview) return null;

  const currentQuestion = interview.questions[currentQuestionIndex];
  const isCoding = isCodingQuestion(currentQuestion);
  const progress = (currentQuestionIndex / interview.questions.length) * 100;
  const questionTimeLimit = currentQuestion.timeLimit ?? QUESTION_TIME_LIMIT;
  const targetingWeakSkill =
    Boolean(currentQuestion.targetingWeakSkill) ||
    (Boolean(targetWeakTopic) && currentQuestion.topic === targetWeakTopic);

  function isCodingQuestion(question: Interview['questions'][0]) {
    const questionAny = question as { isCoding?: boolean; topic?: string; domain?: string; question?: string };
    if (questionAny?.isCoding) return true;
    if (interview?.interviewType === 'coding') return true;
    if (interview?.interviewType === 'theoretical') return false;

    const text = `${questionAny?.topic || ''} ${questionAny?.domain || ''} ${questionAny?.question || ''}`.toLowerCase();
    const codingKeywords = ['coding', 'programming', 'algorithm', 'data structure', 'implement', 'function', 'code'];
    return codingKeywords.some((keyword) => text.includes(keyword));
  }

  const remainingQuestions = interview.questions.length - currentQuestionIndex - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {wasRefreshed && (
        <AnimatedCard className="flex items-start gap-3 border border-cyan-200 bg-cyan-50/80 p-4">
          <AlertCircle className="mt-0.5 flex-shrink-0 text-cyan-700" size={20} />
          <div>
            <h3 className="font-semibold text-cyan-900">Interview Restored</h3>
            <p className="text-sm text-cyan-800">We restored your interview to your last submitted answer.</p>
          </div>
        </AnimatedCard>
      )}

      <AnimatedCard className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-zinc-700">
            Question {currentQuestionIndex + 1} of {interview.questions.length}
          </span>
          <span className="text-sm text-zinc-600">{progress.toFixed(0)}% complete</span>
        </div>
        <AnimatedProgressBar value={progress} max={100} showGlowTrail className="h-3" />
      </AnimatedCard>

      <AnimatedCard key={currentQuestionIndex} className="animate-fade-up p-6 sm:p-8" glowOnHover>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
            <span className="text-sm text-zinc-600">Question {currentQuestionIndex + 1}</span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
              Adaptive Level: {interview.currentDifficulty || currentQuestion.difficulty}
            </span>
            {difficultyChange === 'increased' && (
              <GlowBadge label="Difficulty Increased" className="bg-emerald-100/90 text-emerald-700 shadow-none" />
            )}
            {difficultyChange === 'decreased' && (
              <GlowBadge label="Difficulty Decreased" className="bg-amber-100/90 text-amber-700 shadow-none" />
            )}
            {targetingWeakSkill && <GlowBadge label="Targeting weak skill" className="bg-rose-100/90 text-rose-700 shadow-none" />}
          </div>

          <CountdownTimer key={timeKey} seconds={questionTimeLimit} onTimeout={handleTimeout} />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold leading-relaxed text-zinc-900">{currentQuestion.question}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {currentQuestion.topic && <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">Topic: {currentQuestion.topic}</span>}
            {currentQuestion.domain && <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-700">Domain: {currentQuestion.domain}</span>}
            <PulseIndicator label="Adaptive Live" />
          </div>
          {sessionMetrics && (
            <p className="mt-3 text-xs text-zinc-500">
              Session score trend: {sessionMetrics.averageScore.toFixed(1)}/10 after {sessionMetrics.answeredCount} answered
            </p>
          )}
        </div>

        <div className="mb-6">
          {isCoding ? (
            <CodingQuestionComponent
              question={currentQuestion.question}
              questionIndex={currentQuestionIndex}
              isSubmitting={submitting}
              difficultyShift={difficultyChange}
              onCodeChange={(code: string, language: string) => {
                setCodingAnswer(code);
                setCodingLanguage(language);
              }}
              onMetricsChange={({ editCount, typingDurationMs }) => {
                setCodingMetrics({ editCount, typingDurationMs });
              }}
              onSubmit={({ code, language }: { code: string; language: string }) =>
                handleSubmitAnswer(
                  { response: code, isCodingAnswer: true, language },
                  false
                )
              }
            />
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium text-zinc-700">Your Answer</label>
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
                placeholder="Type your answer here..."
                className="h-48 w-full resize-none rounded-lg border border-zinc-300 px-4 py-3 transition-all duration-300 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                disabled={submitting}
              />
              <p className="mt-2 text-sm text-zinc-500">
                {answer.length} characters | {nonCodingEditCount} edits
              </p>
            </>
          )}
        </div>

        {submitting && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 animate-fade-up">
            <Spinner size="sm" />
            Submitting your answer. This may take a few seconds.
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600">{remainingQuestions} questions remaining</p>
          {!isCoding && (
            <MicroButton
              onClick={() =>
                handleSubmitAnswer(
                  { response: answer, isCodingAnswer: false },
                  false
                )
              }
              disabled={submitting || !answer.trim()}
              glow
              className={`text-white ${
                submitting
                  ? 'bg-cyan-500'
                  : currentQuestionIndex + 1 === interview.questions.length
                    ? 'bg-emerald-600'
                    : 'bg-zinc-900'
              }`}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  Submitting...
                </>
              ) : currentQuestionIndex + 1 === interview.questions.length ? (
                <>
                  <CheckCircle size={18} />
                  Complete Interview
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit & Next
                </>
              )}
            </MicroButton>
          )}
        </div>
      </AnimatedCard>

      <AnimatedCard className="border border-cyan-200 bg-cyan-50/70 p-4">
        <h3 className="mb-2 font-medium text-cyan-900">Interview Tips</h3>
        <ul className="space-y-1 text-sm text-cyan-800">
          <li>Be specific and provide examples where possible.</li>
          <li>Structure your response to make reasoning clear.</li>
          <li>Progress is saved after each answer submission.</li>
          <li>If time expires, your answer auto-submits safely.</li>
        </ul>
      </AnimatedCard>
    </div>
  );
}
