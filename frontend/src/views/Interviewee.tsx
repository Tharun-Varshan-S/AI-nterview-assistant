import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setActiveCandidate, setQuestions, submitAnswer, decrementTimer, setTimer, resetInterview, setFinalResults } from '../slices/interviewSlice';
import { useEffect, useRef, useState } from 'react';
import ResumeUpload from '../components/ResumeUpload';
import WelcomeBackModal from '../components/WelcomeBackModal';
import { toast } from 'sonner';
import { generateQuestions, scoreAnswers } from '../services/ai';

 

export default function Interviewee() {
  const dispatch = useDispatch();
  const { activeCandidate, questions, currentIndex, timerRemaining, answers, completedAt, lastTimerUpdatedAt } = useSelector((s: RootState) => s.interview);
  const [name, setName] = useState(activeCandidate?.name ?? '');
  const [email, setEmail] = useState(activeCandidate?.email ?? '');
  const [phone, setPhone] = useState(activeCandidate?.phone ?? '');
  const [input, setInput] = useState('');
  const [resumeUrl, setResumeUrl] = useState<string | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!questions.length) return;
    if (completedAt) return;
    if (intervalRef.current) return;
    intervalRef.current = window.setInterval(() => dispatch(decrementTimer()), 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [questions.length, completedAt, dispatch]);

  // On mount, restore timer considering elapsed time
  useEffect(() => {
    if (!questions.length || completedAt) return;
    if (!lastTimerUpdatedAt) return;
    const elapsed = Math.floor((Date.now() - lastTimerUpdatedAt) / 1000);
    if (elapsed <= 0) return;
    const newRemaining = Math.max(0, timerRemaining - elapsed);
    if (newRemaining !== timerRemaining) {
      dispatch(setTimer(newRemaining));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!questions.length) return;
    if (timerRemaining === 0 && !completedAt) {
      dispatch(submitAnswer({ answer: input || '(no answer)', durationSeconds: questions[currentIndex].seconds }));
      setInput('');
      toast.warning("Time's up! Auto-submitted and moved to the next question.");
    }
  }, [timerRemaining, questions, currentIndex, completedAt, input, dispatch]);

  useEffect(() => {
    const run = async () => {
      if (!questions.length) return;
      if (completedAt && answers.length === questions.length && typeof window !== 'undefined') {
        const res = await scoreAnswers(
          questions.map(q => ({ text: q.text, difficulty: q.difficulty })),
          answers.map(a => a.answer)
        );
        dispatch(setFinalResults({ score: res.score, summary: res.summary }));
      }
    };
    run();
  }, [completedAt, answers.length, questions.length, dispatch]);

  async function onStart() {
    const profile = { id: crypto.randomUUID(), name, email, phone };
    dispatch(setActiveCandidate(profile));
    const qs = await generateQuestions();
    dispatch(setQuestions(qs as any));
    dispatch(setTimer(qs[0].seconds));
    toast.success('Great! I\'ve extracted your details. Starting the interview.');
  }

  const current = questions[currentIndex];
  const progress = questions.length ? ((currentIndex) / questions.length) * 100 : 0;

  useEffect(() => {
    if (activeCandidate && questions.length && !completedAt) {
      setShowWelcome(true);
    }
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-4 pb-16 md:pb-0">
      <WelcomeBackModal
        open={showWelcome}
        name={activeCandidate?.name}
        progressText={`${Math.min(currentIndex + 1, 6)}/6 questions completed`}
        onContinue={() => setShowWelcome(false)}
        onRestart={() => { setShowWelcome(false); dispatch(resetInterview()); setName(''); setEmail(''); setPhone(''); }}
      />
      <section className="space-y-4">
        <div className="sticky top-[60px] z-[5] bg-background/95 backdrop-blur p-3 rounded border">
          <div className="h-2 bg-gray-200 rounded">
            <div className="h-2 bg-blue-500 rounded" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>Question {Math.min(currentIndex + 1, 6)}/6</span>
            {current && <span className="font-mono">{timerRemaining}s</span>}
          </div>
        </div>

        {!questions.length ? (
          <div className="space-y-3 p-4 border rounded">
            <h2 className="text-lg font-semibold">Welcome! Let's get started with your interview 🚀</h2>
            <ResumeUpload onExtract={({ name: n, email: e, phone: p, url })=>{ if(n) setName(n); if(e) setEmail(e); if(p) setPhone(p); setResumeUrl(url); }} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
              <input className="border rounded px-3 py-2 sm:col-span-2" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <button disabled={!name || !email || !phone} onClick={onStart} className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 touch-target">Start Interview</button>
            <p className="text-xs text-gray-500">If any field is missing, I'll ask before starting.</p>
          </div>
        ) : (
          <div className="flex flex-col h-[60vh] border rounded overflow-hidden">
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {answers.map((a, i)=> (
                <div key={i} className="max-w-[90%] bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded self-end ml-auto">{a.answer}</div>
              ))}
              {current && (
                <div className="max-w-[90%] bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded">{current.text}</div>
              )}
            </div>
            {!completedAt && (
              <div className="p-3 border-t flex gap-2">
                <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Type your answer..." />
                <button onClick={()=>{ if(current) { 
                  // manual submit allowed before timer
                  const spent = current.seconds - timerRemaining;
                  dispatch(submitAnswer({ answer: input || '(no answer)', durationSeconds: Math.max(1, spent) }));
                  setInput('');
                } }} className="px-4 py-2 rounded bg-blue-600 text-white touch-target">Send</button>
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="hidden lg:block border rounded p-4 min-h-[60vh]">
        <h3 className="font-semibold mb-2">Resume Preview</h3>
        {resumeUrl ? (
          <iframe title="resume" src={resumeUrl} className="w-full h-[70vh] rounded" />
        ) : (
          <p className="text-sm text-gray-500">Upload a resume to preview here.</p>
        )}
      </aside>
    </div>
  );
}


