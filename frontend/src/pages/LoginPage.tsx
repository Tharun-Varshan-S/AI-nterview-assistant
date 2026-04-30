import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '../components/mode-toggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      login(data.user, data.token);
      toast.success('Access granted. Synchronizing workspace...');

      // Navigate based on role
      if (data.user.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-500">
      {/* Background Micro-details */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-200 dark:bg-zinc-800 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-200 dark:bg-zinc-800 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 space-y-8 animate-in fade-up duration-700">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 flex items-center justify-center rounded-2xl mb-8 shadow-xl border border-zinc-800 dark:border-zinc-200 ring-4 ring-zinc-100 dark:ring-zinc-900 transition-transform hover:scale-110 duration-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2 text-center">
            NeuroPrep <span className="text-zinc-400 font-medium">AI</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Sign in to initialize your secure evaluation session.</p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-10 px-10">
            <CardTitle className="text-xl font-bold tracking-tight">Identity Authentication</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-400">Secure Gateway Access</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Workspace Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition-all"
                  required
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Security Phrase</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition-all"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 font-bold rounded-2xl transition-all shadow-xl hover:shadow-zinc-950/20 dark:hover:shadow-white/10 active:scale-[0.98] mt-4"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-3" />
                    <span className="text-sm">Authenticating...</span>
                  </>
                ) : (
                  <span className="text-sm uppercase tracking-widest">Authorize Access</span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-10 pt-0 flex flex-col space-y-4 items-center">
            <Separator className="w-1/2 opacity-20 mb-4" />
            <p className="text-xs text-zinc-500 font-medium">
              Don't have an archive?{' '}
              <Link to="/register" className="text-zinc-950 dark:text-zinc-100 font-bold underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 transition-colors">
                Apply for Entry
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="flex justify-center pt-4">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
