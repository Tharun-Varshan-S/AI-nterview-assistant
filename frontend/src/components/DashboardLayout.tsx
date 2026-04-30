import { useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  Cpu,
  FlaskConical,
  Home,
  LogOut,
  Menu,
  Search,
  Shield,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Terminate current session and logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isCandidate = user?.role === 'candidate';
  const navItems: NavItem[] = isCandidate
    ? [
      { to: '/candidate/dashboard', label: 'Overview', icon: Home },
      { to: '/candidate/practice', label: 'Practice Interface', icon: BookOpen },
      { to: '/candidate/mock/setup', label: 'Sync Simulation', icon: FlaskConical },
      { to: '/candidate/analytics', label: 'Telemetry', icon: BarChart3 },
    ]
    : [{ to: '/recruiter/dashboard', label: 'Directory', icon: Users }];

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-zinc-900 selection:text-white dark:bg-[#09090b] dark:selection:bg-white dark:selection:text-zinc-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-full w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/50 via-transparent to-transparent dark:from-zinc-900/20" />
      </div>

      <header className="sticky top-0 z-40 h-16 border-b border-zinc-200/50 bg-white/70 px-4 backdrop-blur-xl transition-all dark:border-zinc-800/50 dark:bg-zinc-950/70">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-500 lg:hidden"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <Menu size={20} />
              </Button>

              <Link
                to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}
                className="group flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 transition-transform group-hover:rotate-6 dark:bg-white">
                  <Cpu size={18} className="text-white dark:text-zinc-950" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-heading text-sm leading-none font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                    NEUROPREP AI
                  </h1>
                  <span className="-mt-0.5 text-[9px] font-bold uppercase tracking-[.3em] text-zinc-400">
                    PROTOCOL
                  </span>
                </div>
              </Link>
            </div>

            <div className="group relative hidden items-center md:flex">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" size={14} />
              <Input
                placeholder="Quick command..."
                className="h-9 w-64 rounded-full border-zinc-200/50 bg-zinc-50/50 pl-9 text-xs font-medium transition-all focus-visible:w-80 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-900/50"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-3 flex h-5 -translate-y-1/2 items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 text-[10px] font-bold text-zinc-400 transition-opacity group-focus-within:opacity-0 dark:border-zinc-800 dark:bg-zinc-950">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="mr-2 hidden items-center gap-1.5 sm:flex">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-500">
                <Bell size={18} />
              </Button>
              <ModeToggle />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex h-9 items-center gap-2 rounded-full px-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] leading-none font-bold text-zinc-900 dark:text-zinc-100">
                      {user?.name?.split(' ')[0] ?? 'User'}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-tighter text-zinc-400">
                      {user?.role ?? 'guest'}
                    </p>
                  </div>
                  <Avatar className="h-8 w-8 ring-1 ring-zinc-200 ring-offset-2 ring-offset-white transition-all hover:scale-105 dark:ring-zinc-800 dark:ring-offset-zinc-950">
                    <AvatarFallback className="bg-zinc-100 text-xs font-black uppercase text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                      {user?.name?.slice(0, 1) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="mt-2 w-64 rounded-2xl border-zinc-200 p-2 shadow-2xl dark:border-zinc-800"
                align="end"
              >
                <DropdownMenuLabel className="p-4 pt-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-xl">
                      <AvatarFallback className="rounded-xl bg-zinc-950 text-lg font-black text-white dark:bg-white dark:text-zinc-950">
                        {user?.name?.slice(0, 1) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {user?.name ?? 'Unknown user'}
                      </p>
                      <p className="text-[10px] font-medium lowercase text-zinc-400">
                        {user?.email ?? 'no-email'}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="mx-2 bg-zinc-100 dark:bg-zinc-900" />

                <div className="space-y-0.5 p-1">
                  <DropdownMenuItem
                    onClick={() => navigate(isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard')}
                    className="group cursor-pointer rounded-lg px-4 py-2.5 focus:bg-zinc-50 dark:focus:bg-zinc-900"
                  >
                    <UserCircle className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                    <span className="text-sm font-semibold">User Matrix Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="group cursor-pointer rounded-lg px-4 py-2.5 focus:bg-zinc-50 dark:focus:bg-zinc-900">
                    <Shield className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                    <span className="text-sm font-semibold">Security Vault</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-2 bg-zinc-100 dark:bg-zinc-900" />

                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="group cursor-pointer rounded-lg px-4 py-2.5 text-rose-500 focus:bg-rose-50 focus:text-rose-500 dark:focus:bg-rose-950/30"
                  >
                    <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    <span className="text-sm font-bold">Terminate Session</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-10">
            <div className="px-4">
              <p className="mb-6 px-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                Navigation_v4
              </p>
              <nav className="space-y-1.5">
                {navItems.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);

                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-300',
                        active
                          ? 'scale-[1.02] bg-zinc-950 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] shadow-zinc-950/20 dark:bg-white dark:text-zinc-950 dark:shadow-white/10'
                          : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-950 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200'
                      )}
                    >
                      <Icon
                        size={16}
                        className={cn(
                          'shrink-0',
                          active
                            ? 'text-white dark:text-zinc-950'
                            : 'text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-200'
                        )}
                      />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="px-4">
              <p className="mb-6 px-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                System Health
              </p>
              <Card className="space-y-4 rounded-2xl border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase tracking-tighter text-zinc-500">Sync Stability</span>
                    <span className="text-emerald-500">99.8%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-[99.8%] bg-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase tracking-tighter text-zinc-500">API Latency</span>
                    <span className="text-zinc-900 dark:text-zinc-100">12ms</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-[12%] bg-zinc-950 dark:bg-zinc-50" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-6 bottom-6 z-40 lg:hidden">
        <Card className="flex items-center justify-around gap-1 rounded-3xl border-zinc-200 bg-white/80 p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/80">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);

            return (
              <Link
                key={`mobile-${to}`}
                to={to}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-2xl py-3 transition-all duration-300',
                  active ? 'scale-105 bg-zinc-950 text-white shadow-xl dark:bg-white dark:text-zinc-950' : 'text-zinc-500'
                )}
              >
                <Icon size={18} />
                <span className="text-[8px] font-black uppercase tracking-widest">{label.split(' ')[0]}</span>
              </Link>
            );
          })}

          <div className="mx-1 h-8 w-px bg-zinc-200 dark:bg-zinc-800" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-12 w-12 shrink-0 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <LogOut size={18} />
          </Button>
        </Card>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 animate-in fade-in bg-zinc-950/80 duration-300 backdrop-blur-md lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm animate-in slide-in-from-left bg-white p-8 shadow-2xl duration-500 ease-out dark:bg-[#09090b]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-12 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 dark:bg-white">
                  <Cpu size={18} className="text-white dark:text-zinc-950" />
                </div>
                <h2 className="font-heading text-lg font-black tracking-tighter">NEUROPREP AI</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full"
              >
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
                      'flex items-center gap-4 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all',
                      active
                        ? 'bg-zinc-950 text-white shadow-2xl dark:bg-white dark:text-zinc-950'
                        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    )}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="absolute right-8 bottom-10 left-8">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="h-14 w-full gap-3 rounded-2xl border-zinc-200 text-xs font-bold uppercase tracking-widest text-rose-500 dark:border-zinc-800"
              >
                <LogOut size={16} />
                Terminate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
