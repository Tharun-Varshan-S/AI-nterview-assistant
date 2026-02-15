import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, FileText, Users } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    const confirmed = window.confirm('Sign out from your workspace? You can log back in anytime.');
    if (!confirmed) {
      return;
    }
    logout();
    navigate('/login');
  };

  const isCandidate = user?.role === 'candidate';
  const isRecruiter = user?.role === 'recruiter';

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}>
                <h1 className="text-xl font-bold text-slate-900">Novus Interview</h1>
                <p className="text-xs text-slate-500 -mt-1">AI Interview Platform</p>
              </Link>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                Workspace
              </p>
              <nav className="space-y-2">
                {isCandidate && (
                  <Link
                    to="/candidate/dashboard"
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                      location.pathname === '/candidate/dashboard'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Home size={18} />
                    Dashboard
                  </Link>
                )}
                {isRecruiter && (
                  <Link
                    to="/recruiter/dashboard"
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                      location.pathname === '/recruiter/dashboard'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={18} />
                    Candidates
                  </Link>
                )}
              </nav>
              <div className="mt-6 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 text-xs text-slate-500">
                Tip: Use filters to focus on your top-performing candidates.
              </div>
            </div>
          </aside>
          <div>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
