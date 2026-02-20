import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, Interview } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import DifficultyBadge from '../components/DifficultyBadge';
import { interviewStateStorage } from '../utils/interviewStateStorage';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const QUESTION_TIME_LIMIT = 180; // 3 minutes per question

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeKey, setTimeKey] = useState(0);
  const [wasRefreshed, setWasRefreshed] = useState(false);
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
          questionId: a.questionId,
          response: a.response,
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

  const handleSubmitAnswer = async (autoSubmit = false) => {
    if (submitting) {
      return;
    }
    if (!answer.trim() && !autoSubmit) {
      toast.error('Please enter your answer');
      return;
    }

    const currentQuestion = interview!.questions[currentQuestionIndex];

    try {
      setSubmitting(true);
      const { interview: updatedInterview } = await interviewAPI.submitAnswer(
        id!,
        currentQuestion.id,
        answer.trim() || '(No answer provided)'
      );

      setInterview(updatedInterview);
      setAnswer('');

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
      handleSubmitAnswer(true);
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
  const progress = ((currentQuestionIndex) / interview.questions.length) * 100;

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
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
            <span className="text-gray-600 text-sm">Question {currentQuestionIndex + 1}</span>
          </div>
          <CountdownTimer
            key={timeKey}
            seconds={QUESTION_TIME_LIMIT}
            onTimeout={handleTimeout}
          />
        </div>

        {/* Question */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer Input */}
        <div className="mb-6">
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
          <button
            onClick={() => handleSubmitAnswer(false)}
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
