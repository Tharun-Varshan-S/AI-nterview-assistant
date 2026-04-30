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
import { ModeToggle } from '../components/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, Briefcase, ChevronRight } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.register(name, email, password, role);
      login(data.user, data.token);
      toast.success('Archive created. Welcome to NeuroPrep AI.');

      // Navigate based on role
      if (data.user.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-500">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-200 dark:bg-zinc-800 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-200 dark:bg-zinc-800 blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] relative z-10 space-y-8 animate-in fade-up duration-700">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 flex items-center justify-center rounded-2xl mb-8 shadow-xl border border-zinc-800 dark:border-zinc-200 ring-4 ring-zinc-100 dark:ring-zinc-900 transition-transform hover:scale-110 duration-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2 text-center">
            New <span className="text-zinc-400 font-medium">Clearance</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Establish your profile within the NeuroPrep AI archive.</p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4 pt-10 px-10">
              <CardTitle className="text-xl font-bold tracking-tight">Identity Registration</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-400">Initialize Workspace Credentials</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-4 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition-all font-medium"
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Assignment Email</Label>
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
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Security Phrase</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition-all"
                    required
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Operational Role</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={cn(
                      "group p-5 rounded-2xl border-2 text-left transition-all duration-300",
                      role === 'candidate'
                        ? "bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950 shadow-xl"
                        : "bg-transparent border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <User size={20} className={cn("mb-3 transition-transform group-hover:scale-110", role === 'candidate' ? "text-zinc-400" : "text-zinc-300")} />
                    <div className="font-bold text-sm">Candidate</div>
                    <div className={cn("text-[9px] font-bold uppercase tracking-tighter mt-1 opacity-60")}>Subject Evaluation</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={cn(
                      "group p-5 rounded-2xl border-2 text-left transition-all duration-300",
                      role === 'recruiter'
                        ? "bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950 shadow-xl"
                        : "bg-transparent border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <Briefcase size={20} className={cn("mb-3 transition-transform group-hover:scale-110", role === 'recruiter' ? "text-zinc-400" : "text-zinc-300")} />
                    <div className="font-bold text-sm">Recruiter</div>
                    <div className={cn("text-[9px] font-bold uppercase tracking-tighter mt-1 opacity-60")}>System Auditor</div>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 font-bold rounded-2xl transition-all shadow-xl hover:shadow-zinc-950/20 dark:hover:shadow-white/10 active:scale-[0.98] mt-6 gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm uppercase tracking-widest">Initialize Account</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="pb-10 pt-0 flex flex-col space-y-4 items-center px-10">
            <Separator className="w-1/2 opacity-20 mb-4" />
            <p className="text-xs text-zinc-500 font-medium">
              Existing clearance record?{' '}
              <Link to="/login" className="text-zinc-950 dark:text-zinc-100 font-bold underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 transition-colors">
                Sign in to Nexus
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="flex justify-center pt-2">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
