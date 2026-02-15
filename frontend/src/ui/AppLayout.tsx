import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut } from 'lucide-react';
import { logout } from '../slices/authSlice';
import { RootState } from '../store/store';

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isDark, setIsDark] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Broadcast simple sync events across tabs
  useEffect(() => {
    const bc = new BroadcastChannel('interview-sync');
    bcRef.current = bc;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'theme') {
        setIsDark(Boolean(e.data.value));
      }
    };
    bc.addEventListener('message', handler);
    return () => { bc.removeEventListener('message', handler); bc.close(); };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">AI Interview Assistant</h1>
            {user && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name} ({user.role})
              </span>
            )}
          </div>
          <nav className="hidden md:flex gap-4 text-sm items-center">
            {user?.role === 'candidate' && (
              <Link className={`px-3 py-2 rounded ${pathname==='/interviewee'?'bg-gray-200 dark:bg-gray-700':''}`} to="/interviewee">My Interviews</Link>
            )}
            {user?.role === 'recruiter' && (
              <Link className={`px-3 py-2 rounded ${pathname.startsWith('/interviewer')?'bg-gray-200 dark:bg-gray-700':''}`} to="/interviewer">Dashboard</Link>
            )}
            <button className="px-3 py-2 text-sm rounded border" onClick={() => { const next = !isDark; setIsDark(next); bcRef.current?.postMessage({ type: 'theme', value: next }); }}>{isDark? 'Light':'Dark'}</button>
            <button onClick={handleLogout} className="px-3 py-2 text-sm rounded border flex items-center gap-2 hover:bg-red-50 hover:text-red-600">
              <LogOut size={16} /> Logout
            </button>
          </nav>
          <div className="md:hidden flex gap-2">
            <button className="px-3 py-2 text-sm rounded border" onClick={() => { const next = !isDark; setIsDark(next); }}>{isDark? '☀️':'🌙'}</button>
            <button onClick={handleLogout} className="px-3 py-2 text-sm rounded border">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      {user?.role === 'candidate' && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur">
          <Link to="/interviewee" className={`block text-center py-3 ${pathname==='/interviewee'?'font-semibold':''}`}>My Interviews</Link>
        </nav>
      )}
    </div>
  );
}


