import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store/store';

export default function Interviewer() {
  const candidates = useSelector((s: RootState) => s.interview.candidates);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'score'|'date'>('score');

  const filtered = useMemo(()=>{
    const q = query.toLowerCase();
    let arr = candidates.filter(c => (c.profile.name||'').toLowerCase().includes(q) || (c.profile.email||'').toLowerCase().includes(q));
    if (sort === 'score') arr.sort((a,b)=> b.finalScore - a.finalScore);
    else arr.sort((a,b)=> b.createdAt - a.createdAt);
    return arr;
  }, [candidates, query, sort]);

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email" className="border rounded px-3 py-2 w-full md:max-w-sm" />
        <select value={sort} onChange={e=>setSort(e.target.value as any)} className="border rounded px-3 py-2 w-full md:w-auto">
          <option value="score">Sort by score</option>
          <option value="date">Sort by date</option>
        </select>
      </div>

      {/* Mobile cards */}
      <div className="grid sm:grid-cols-2 lg:hidden gap-3">
        {filtered.map((c)=> (
          <div key={c.profile.id} className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.profile.name||'Unknown'}</div>
                <div className="text-xs text-gray-500">{c.profile.email}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${c.finalScore>=75?'bg-green-100 text-green-700':c.finalScore>=50?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{c.finalScore}</span>
            </div>
            <p className="text-sm line-clamp-2">{c.finalSummary}</p>
            <Link to={`/interviewer/${c.profile.id}`} className="px-3 py-2 text-sm rounded border text-center touch-target">View Details</Link>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left p-2 border-r">Name</th>
              <th className="text-left p-2 border-r">Email</th>
              <th className="text-left p-2 border-r">Score</th>
              <th className="text-left p-2 border-r">Summary</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.profile.id} className="border-t">
                <td className="p-2 border-r">{c.profile.name||'Unknown'}</td>
                <td className="p-2 border-r">{c.profile.email}</td>
                <td className="p-2 border-r">
                  <span className={`text-xs px-2 py-1 rounded ${c.finalScore>=75?'bg-green-100 text-green-700':c.finalScore>=50?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{c.finalScore}</span>
                </td>
                <td className="p-2 border-r max-w-[500px]">{c.finalSummary}</td>
                <td className="p-2"><Link to={`/interviewer/${c.profile.id}`} className="px-3 py-2 text-sm rounded border inline-block touch-target">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


