import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Home,
  Users,
  BookOpen,
  FlaskConical,
  BarChart3,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { GlassContainer, MicroButton } from './motion';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderElevated(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const navItems = isCandidate
    ? [
        { to: '/candidate/dashboard', label: 'Dashboard', icon: Home },
        { to: '/candidate/practice', label: 'Practice', icon: BookOpen },
        { to: '/candidate/mock/setup', label: 'Mock Interview', icon: FlaskConical },
        { to: '/candidate/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/candidate/dashboard', label: 'Profile', icon: UserCircle },
      ]
    : [{ to: '/recruiter/dashboard', label: 'Candidates', icon: Users }];

  return (
    <div className="relative min-h-screen bg-transparent">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-[38rem] w-[38rem] rounded-full bg-teal-300/15 blur-[110px] parallax-soft" />
        <div className="absolute right-0 top-[10%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[120px] parallax-soft" />
      </div>

      <header
        className={`sticky top-0 z-40 border-b border-white/30 bg-white/72 px-4 backdrop-blur-xl transition-shadow duration-300 sm:px-6 lg:px-8 ${
          headerElevated ? 'shadow-convio-card' : ''
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3">
          <Link to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}>
            <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">Novus Interview</h1>
            <p className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">AI Interview Platform</p>
          </Link>

          <div className="relative group flex items-center gap-3">
            <button className="touch-target flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 transition-all duration-300 hover:shadow-convio-card-hover">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-medium text-zinc-900">{user?.name}</span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500">{user?.role}</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-semibold uppercase text-white">
                {user?.name?.slice(0, 1) || 'U'}
              </span>
            </button>

            <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] w-44 rounded-xl border border-zinc-200 bg-white/95 p-2 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:animate-float-in">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <aside className="hidden lg:block">
            <GlassContainer className={`relative p-4 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-60'}`}>
              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="absolute -right-3 top-4 grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-transform duration-300 hover:scale-105"
                aria-label="Toggle Sidebar"
              >
                {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>

              <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 ${sidebarCollapsed ? 'sr-only' : ''}`}>
                Workspace
              </p>
              <nav className="space-y-1.5">
                {navItems.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);

                  return (
                    <Link
                      key={to + label}
                      to={to}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                        active
                          ? 'bg-zinc-900 text-white shadow-convio-card'
                          : 'text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900'
                      }`}
                    >
                      {active && <span className="absolute bottom-0 left-0 top-0 w-1 animate-slide-in-left rounded-r bg-teal-400" />}
                      <Icon className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105 group-hover:rotate-[-3deg]'}`} size={18} />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </Link>
                  );
                })}
              </nav>

              {!sidebarCollapsed && (
                <div className="mt-5 rounded-xl border border-zinc-200/70 bg-zinc-100/70 p-3 text-xs text-zinc-600">
                  Motion is optimized for transform and opacity to keep interactions at 60fps.
                </div>
              )}
            </GlassContainer>
          </aside>

          <div>
            <Outlet />
          </div>
        </div>
      </main>

      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden animate-fade-up">
        <div className="convio-glass flex items-center justify-between gap-2 px-2 py-1.5">
          {navItems.slice(0, 4).map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={`mobile-${to}-${label}`}
                to={to}
                className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-2 py-2 text-[11px] transition-colors ${
                  active ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                }`}
              >
                <Icon size={16} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
          <MicroButton
            className="bg-zinc-900 px-3 py-2 text-white"
            onClick={handleLogout}
            title="Quick Logout"
            aria-label="Quick Logout"
          >
            <LogOut size={14} />
          </MicroButton>
        </div>
      </div>
    </div>
  );
}
