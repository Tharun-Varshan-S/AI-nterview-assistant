import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview, SessionMetrics } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import DifficultyBadge from '../components/DifficultyBadge';
import CodingQuestionComponent from '../components/CodingQuestionComponent';
import { interviewStateStorage } from '../utils/interviewStateStorage';
import { Send, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Target } from 'lucide-react';

const QUESTION_TIME_LIMIT = 180; // 3 minutes per question

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadInterview();
  }, [id]);

  useEffect(() => {
    // Focus on textarea when question changes
    textareaRef.current?.focus();
  }, [currentQuestionIndex]);

  // Save state after each question submission
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

  // Prevent back navigation during interview
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

      // Check if there's saved state (interview was refreshed)
      const savedState = interviewStateStorage.loadState(id!);
      const isStale = interviewStateStorage.isStateStale(id!);

      if (savedState && !isStale && data.answers.length < data.questions.length) {
        // Restore state from before refresh
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setWasRefreshed(true);
        toast.info('Interview restored from where you left off');

        // Auto-dismiss after 3 seconds
        setTimeout(() => setWasRefreshed(false), 3000);
      } else if (data.status === 'completed') {
        // Interview already completed
        navigate(`/candidate/results/${id}`);
        return;
      } else {
        // Continue from where server has answers
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
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeKey((prev) => prev + 1);
        toast.success(autoSubmit ? 'Time up! Auto-submitted' : 'Answer submitted!');
      } else {
        // Final evaluation happens server-side after the last answer
        interviewStateStorage.clearState(id!); // Clear saved state
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!interview) return null;

  const currentQuestion = interview.questions[currentQuestionIndex];
  const isCoding = isCodingQuestion(currentQuestion);
  const progress = ((currentQuestionIndex) / interview.questions.length) * 100;
  const questionTimeLimit = currentQuestion.timeLimit ?? QUESTION_TIME_LIMIT;
  const targetingWeakSkill =
    Boolean(currentQuestion.targetingWeakSkill) ||
    (Boolean(targetWeakTopic) && currentQuestion.topic === targetWeakTopic);

  function isCodingQuestion(question: Interview['questions'][0]) {
    const questionAny = question as { isCoding?: boolean; topic?: string; domain?: string; question?: string };
    if (questionAny?.isCoding) return true;
    if (interview?.interviewType === 'coding') return true;
    if (interview?.interviewType === 'theoretical') return false;

    const text = `${questionAny?.topic || ''} ${questionAny?.domain || ''} ${questionAny?.question || ''}`
      .toLowerCase();
    const codingKeywords = ['coding', 'programming', 'algorithm', 'data structure', 'implement', 'function', 'code'];
    return codingKeywords.some((keyword) => text.includes(keyword));
  }

  return (
    <div className="max-w-4xl mx-auto">
      {wasRefreshed && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">Interview Restored</h3>
            <p className="text-sm text-blue-800">
              We've restored your interview to the last submitted answer. You may continue from where you left off.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {interview.questions.length}
          </span>
          <span className="text-sm text-gray-600">{progress.toFixed(0)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Interview Card */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
            <span className="text-gray-600 text-sm">Question {currentQuestionIndex + 1}</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Current Adaptive Level: {interview.currentDifficulty || currentQuestion.difficulty}
            </span>
            {difficultyChange === 'increased' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                <TrendingUp size={12} />
                Difficulty Increased
              </span>
            )}
            {difficultyChange === 'decreased' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                <TrendingDown size={12} />
                Difficulty Decreased
              </span>
            )}
            {targetingWeakSkill && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                <Target size={12} />
                Targeting weak skill
              </span>
            )}
          </div>
          <CountdownTimer
            key={timeKey}
            seconds={questionTimeLimit}
            onTimeout={handleTimeout}
          />
        </div>

        {/* Question */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
            {currentQuestion.question}
          </h2>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {currentQuestion.topic && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                Topic: {currentQuestion.topic}
              </span>
            )}
            {currentQuestion.domain && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
                Domain: {currentQuestion.domain}
              </span>
            )}
          </div>
          {sessionMetrics && (
            <p className="text-xs text-slate-500 mt-3">
              Session score trend: {sessionMetrics.averageScore.toFixed(1)}/10 after {sessionMetrics.answeredCount} answered
            </p>
          )}
        </div>

        {/* Answer Input */}
        <div className="mb-6">
          {isCoding ? (
            <CodingQuestionComponent
              question={currentQuestion.question}
              questionIndex={currentQuestionIndex}
              isSubmitting={submitting}
              onCodeChange={(code: string, language: string) => {
                setCodingAnswer(code);
                setCodingLanguage(language);
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={submitting}
              />
              <p className="text-sm text-gray-500 mt-2">
                {answer.length} characters | Be clear and concise
              </p>
            </>
          )}
        </div>

        {submitting && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Spinner size="sm" />
            Submitting your answer. This can take a few seconds.
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {interview.questions.length - currentQuestionIndex - 1} questions remaining
          </p>
          {!isCoding && (
            <button
              onClick={() =>
                handleSubmitAnswer(
                  { response: answer, isCodingAnswer: false },
                  false
                )
              }
              disabled={submitting || !answer.trim()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  Submitting...
                </>
              ) : currentQuestionIndex + 1 === interview.questions.length ? (
                <>
                  <CheckCircle size={20} />
                  Complete Interview
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit & Next
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Interview Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific and provide examples when possible</li>
          <li>• Structure your answer clearly</li>
          <li>• Your progress is saved after each answer</li>
          <li>• Don't worry if time runs out - your answer will auto-submit</li>
        </ul>
      </div>
    </div>
  );
}
