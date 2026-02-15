import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function CandidateDetail() {
  const { id } = useParams();
  const candidate = useSelector((s: RootState) => s.interview.candidates.find(c => c.profile.id === id));

  const qa = useMemo(() => {
    if (!candidate) return [] as Array<{ q: string; a: string; score?: number; difficulty: string; }>; 
    const map = new Map(candidate.answers.map(a => [a.questionId, a]));
    return candidate.questions.map(q => ({
      q: q.text,
      a: map.get(q.id)?.answer || '(no answer)',
      score: q.aiScore,
      difficulty: q.difficulty
    }));
  }, [candidate]);

  if (!candidate) {
    return (
      <div className="space-y-3">
        <p className="text-sm">Candidate not found.</p>
        <Link to="/interviewer" className="px-3 py-2 text-sm rounded border">Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{candidate.profile.name}</h2>
          <p className="text-sm text-gray-600">{candidate.profile.email} · {candidate.profile.phone}</p>
        </div>
        <Link to="/interviewer" className="px-3 py-2 text-sm rounded border">Back to list</Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="space-y-3">
          <h3 className="font-semibold">Interview Summary</h3>
          <div className="border rounded p-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded ${candidate.finalScore>=75?'bg-green-100 text-green-700':candidate.finalScore>=50?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{candidate.finalScore}</span>
              <p className="text-sm">{candidate.finalSummary}</p>
            </div>
          </div>

          <h3 className="font-semibold">Q&A History</h3>
          <div className="space-y-3">
            {qa.map((row, i) => (
              <div key={i} className="border rounded p-3">
                <div className="text-xs text-gray-500">Q{i+1} · {row.difficulty}</div>
                <div className="mt-1 font-medium">{row.q}</div>
                <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-800 rounded p-2">{row.a}</div>
                {typeof row.score === 'number' && (
                  <div className="mt-2 text-xs">AI score: {row.score}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="border rounded p-3 min-h-[50vh]">
          <h3 className="font-semibold mb-2">Resume</h3>
          <p className="text-sm text-gray-500">Provide resume URL in profile to preview here.</p>
        </aside>
      </div>
    </div>
  );
}


