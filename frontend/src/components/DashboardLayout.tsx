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
  Menu,
  Shield,
  Search,
  Bell,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from './mode-toggle';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  const handleLogout = () => {
    if (window.confirm('Terminate current session and logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isCandidate = user?.role === 'candidate';
  const navItems = isCandidate
    ? [
      { to: '/candidate/dashboard', label: 'Overview', icon: Home },
      { to: '/candidate/practice', label: 'Practice Interface', icon: BookOpen },
      { to: '/candidate/mock/setup', label: 'Sync Simulation', icon: FlaskConical },
      { to: '/candidate/analytics', label: 'Telemetry', icon: BarChart3 },
    ]
    : [{ to: '/recruiter/dashboard', label: 'Directory', icon: Users }];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Structural Backdrop */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/50 via-transparent to-transparent dark:from-zinc-900/20" />
      </div>

      <header className="sticky top-0 z-40 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl px-4 h-16 transition-all">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-zinc-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={20} />
              </Button>
              <Link to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center transition-transform group-hover:rotate-6">
                  <Cpu size={18} className="text-white dark:text-zinc-950" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-heading font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">NOVUS</h1>
                  <span className="text-[9px] font-bold uppercase tracking-[.3em] text-zinc-400 -mt-0.5">PROTOCOL</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <Input
                placeholder="Quick command..."
                className="h-9 w-64 pl-9 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 rounded-full text-xs font-medium focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all focus-visible:w-80"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 h-5 flex items-center gap-1 px-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold text-zinc-400 pointer-events-none group-focus-within:opacity-0 transition-opacity">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-500">
                <Bell size={18} />
              </Button>
              <ModeToggle />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 px-1 rounded-full flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <div className="hidden sm:block text-right">
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">{user?.role}</p>
                  </div>
                  <Avatar className="h-8 w-8 ring-1 ring-zinc-200 dark:ring-zinc-800 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 transition-all hover:scale-105">
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-black text-xs uppercase">
                      {user?.name?.slice(0, 1) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 mt-2 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl" align="end">
                <DropdownMenuLabel className="p-4 pt-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-xl">
                      <AvatarFallback className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black text-lg uppercase rounded-xl">
                        {user?.name?.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                      <p className="text-[10px] font-medium text-zinc-400 lowercase">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2 bg-zinc-100 dark:bg-zinc-900" />
                <div className="p-1 space-y-0.5">
                  <DropdownMenuItem onClick={() => navigate(isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard')} className="rounded-lg py-2.5 px-4 cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-900 group">
                    <UserCircle className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                    <span className="text-sm font-semibold">User Matrix Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg py-2.5 px-4 cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-900 group">
                    <Shield className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                    <span className="text-sm font-semibold">Security Vault</span>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="mx-2 bg-zinc-100 dark:bg-zinc-900" />
                <div className="p-1">
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg py-2.5 px-4 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-950/30 group">
                    <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    <span className="text-sm font-bold">Terminate Session</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8 flex gap-10">
        {/* Desktop Navigation Column */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-10">
            <div className="px-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-6 px-1">Navigation_v4</p>
              <nav className="space-y-1.5">
                {navItems.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
                  return (
                    <Link
                      key={to + label}
                      to={to}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                        active
                          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] shadow-zinc-950/20 dark:shadow-white/10 scale-[1.02]"
                          : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                      )}
                    >
                      <Icon className={cn("shrink-0", active ? "text-white dark:text-zinc-950" : "text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-200")} size={16} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="px-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-6 px-1">System Health</p>
              <Card className="p-5 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-zinc-500 uppercase tracking-tighter">Sync Stability</span>
                    <span className="text-emerald-500">99.8%</span>
                  </div>
                  <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[99.8%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-zinc-500 uppercase tracking-tighter">API Latency</span>
                    <span className="text-zinc-900 dark:text-zinc-100">12ms</span>
                  </div>
                  <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-950 dark:bg-zinc-50 w-[12%]" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 pb-20">
          <Outlet />
        </main>
      </div>

      {/* Mobile Control Bar */}
      <div className="fixed inset-x-6 bottom-6 z-40 lg:hidden">
        <Card className="flex items-center justify-around gap-1 p-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-3xl">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={`mobile-${to}`}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 py-3 rounded-2xl transition-all duration-300",
                  active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xl scale-105" : "text-zinc-500"
                )}
              >
                <Icon size={18} />
                <span className="text-[8px] font-black uppercase tracking-widest">{label.split(' ')[0]}</span>
              </Link>
            );
          })}
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-12 w-12 rounded-2xl shrink-0">
            <LogOut size={18} />
          </Button>
        </Card>
      </div>

      {/* Slide-out Mobile Protocol Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md lg:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-[#09090b] p-8 shadow-2xl animate-in slide-in-from-left duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center">
                  <Cpu size={18} className="text-white dark:text-zinc-950" />
                </div>
                <h2 className="font-heading font-black text-lg tracking-tighter">NOVUS</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="rounded-full">
                <ChevronLeft size={20} />
              </Button>
            </div>

            <nav className="space-y-4">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
                return (
                  <Link
                    key={`side-${to}`}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all",
                      active
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xl"
                        : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-10 left-8 right-8">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 text-rose-500 font-bold uppercase tracking-widest text-xs gap-3"
              >
                <LogOut size={16} /> Terminate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
