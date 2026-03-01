import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { interviewAPI, PracticeSession, Question } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';

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

  const currentIndex = useMemo(() => session?.questionsAttempted || 0, [session]);
  const currentQuestion = useMemo(() => session?.questions?.[currentIndex], [session, currentIndex]);
  const isCompleted = session?.status === 'completed' || (session && currentIndex >= session.totalQuestions);

  const loadSession = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const data = await interviewAPI.getPracticeSessionDetails(sessionId);
      setSession(data);
      setQuestionStartTime(Date.now());
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load practice session');
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
      toast.error('Please enter your answer');
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

      toast.success(`Answer submitted. Score: ${Number(result.score || 0).toFixed(1)}/10`);
      setAnswer('');
      await loadSession();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;
    try {
      setFinishing(true);
      const result = await interviewAPI.completePracticeSession(sessionId);
      toast.success(`Practice completed. Final score: ${Number(result.score || 0).toFixed(1)}/10`);
      navigate('/candidate/practice');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete practice session');
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Practice Session</h1>
          <p className="text-slate-600">
            {session.mode} • {session.topic} • {session.difficulty}
          </p>
        </div>
        <button
          onClick={() => navigate('/candidate/practice')}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-600">
            Progress: {Math.min(currentIndex, session.totalQuestions)}/{session.totalQuestions}
          </p>
          <p className="text-sm font-semibold text-slate-700">
            Avg Score: {Number(session.averageScore || 0).toFixed(1)}/10
          </p>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-600"
            style={{
              width: `${session.totalQuestions > 0 ? (Math.min(currentIndex, session.totalQuestions) / session.totalQuestions) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {isCompleted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-emerald-800">All questions completed</h2>
          <p className="text-emerald-700">Finalize this session to update your practice history and analytics.</p>
          <button
            onClick={completeSession}
            disabled={finishing}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {finishing ? 'Completing...' : 'Complete Session'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <p className="text-sm font-medium text-blue-700">
            Question {currentIndex + 1} of {session.totalQuestions}
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{currentQuestion?.question}</h2>

          {session.mode === 'coding' && (
            <div>
              <label className="text-sm font-medium text-slate-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Your Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={session.mode === 'coding' ? 12 : 6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder={session.mode === 'coding' ? 'Write your solution...' : 'Write your answer...'}
            />
          </div>

          <button
            onClick={submitAnswer}
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
