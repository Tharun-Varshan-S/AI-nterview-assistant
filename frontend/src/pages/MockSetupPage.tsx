import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Brain,
  Code2,
  Shuffle,
  Play,
  Target,
  Sparkles,
  TrendingUp,
  Zap,
  BookOpen,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function MockSetupPage() {
  const [mode, setMode] = useState<'theoretical' | 'coding' | 'mixed'>('mixed');
  const [focus, setFocus] = useState<'weak skills' | 'random' | 'specific'>('weak skills');
  const [specificTopic, setSpecificTopic] = useState<string>('');
  const [length, setLength] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const modeOptions = [
    {
      id: 'theoretical',
      name: 'Theoretical',
      description: 'Technical and conceptual questions',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    },
    {
      id: 'coding',
      name: 'Coding',
      description: 'Programming and problem-solving',
      icon: Code2,
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-500/10 to-purple-500/5',
      iconColor: 'text-violet-500',
      borderColor: 'border-violet-500/20 hover:border-violet-500/40',
    },
    {
      id: 'mixed',
      name: 'Mixed',
      description: 'Combination of both types',
      icon: Shuffle,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    },
  ];

  const focusOptions = [
    {
      id: 'weak skills',
      name: 'Focus on Weak Skills',
      description: 'Questions on topics you need improvement in',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    },
    {
      id: 'random',
      name: 'Random Topics',
      description: 'Mix of various interview topics',
      icon: Sparkles,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-500/10 to-rose-500/5',
      iconColor: 'text-pink-500',
      borderColor: 'border-pink-500/20 hover:border-pink-500/40',
    },
    {
      id: 'specific',
      name: 'Specific Topic',
      description: 'Deep dive into a particular topic',
      icon: Target,
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-500/10 to-blue-500/5',
      iconColor: 'text-indigo-500',
      borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
    },
  ];

  const handleStartInterview = async () => {
    if (focus === 'specific' && !specificTopic) {
      toast.error('Please select a specific topic');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        interviewType: mode,
        focus,
        questionCount: length,
      };

      if (focus === 'specific') {
        payload.focusTopics = [specificTopic];
      }

      const interview = await interviewAPI.create(payload);

      if (interview?._id) {
        navigate(`/candidate/interview/${interview._id}`);
        toast.success('Mock interview session started!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start mock interview');
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    'Data Structures',
    'Algorithms',
    'System Design',
    'Database Design',
    'API Design',
    'OOP Concepts',
    'Design Patterns',
    'Web Development',
    'JavaScript/TypeScript',
    'Python',
    'React',
    'Node.js',
    'Microservices',
    'DevOps',
    'Cloud Computing',
  ];

  const currentModeData = modeOptions.find((m) => m.id === mode);
  const currentFocusData = focusOptions.find((f) => f.id === focus);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-20" />
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <Badge className="bg-white/10 text-white border-white/20 uppercase text-[10px] font-bold tracking-widest">
              Mock Interview
            </Badge>
          </div>
          <h1 className="text-4xl font-heading font-bold tracking-tight text-white">Configure Session</h1>
          <p className="mt-2 text-zinc-400 max-w-lg text-sm">
            Customize your mock interview experience for maximum learning and realistic practice.
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Brain className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading font-bold">Interview Mode</CardTitle>
              <CardDescription className="text-xs">Choose the type of questions you want to practice</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = mode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id as any)}
                  className={cn(
                    "relative overflow-hidden text-left p-6 rounded-2xl border-2 transition-all duration-300 group",
                    isSelected
                      ? `${option.borderColor.split(' ')[0]} bg-gradient-to-br ${option.bgGradient} shadow-lg scale-[1.02]`
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                    option.bgGradient
                  )} />
                  <div className="relative">
                    <div className={cn(
                      "p-3 rounded-xl w-fit mb-4 transition-colors",
                      isSelected ? `bg-gradient-to-br ${option.bgGradient}` : "bg-zinc-100 dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800"
                    )}>
                      <Icon className={cn("h-6 w-6", isSelected ? option.iconColor : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300")} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-50">{option.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    {isSelected && (
                      <div className={cn("h-1 w-16 rounded-full mt-4 bg-gradient-to-r", option.gradient)} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Focus Area Selection */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Target className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading font-bold">Focus Area</CardTitle>
              <CardDescription className="text-xs">Select how questions should be tailored</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = focus === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setFocus(option.id as any)}
                  className={cn(
                    "relative overflow-hidden text-left p-6 rounded-2xl border-2 transition-all duration-300 group",
                    isSelected
                      ? `${option.borderColor.split(' ')[0]} bg-gradient-to-br ${option.bgGradient} shadow-lg scale-[1.02]`
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                    option.bgGradient
                  )} />
                  <div className="relative">
                    <div className={cn(
                      "p-3 rounded-xl w-fit mb-4 transition-colors",
                      isSelected ? `bg-gradient-to-br ${option.bgGradient}` : "bg-zinc-100 dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800"
                    )}>
                      <Icon className={cn("h-6 w-6", isSelected ? option.iconColor : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300")} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-50">{option.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    {isSelected && (
                      <div className={cn("h-1 w-16 rounded-full mt-4 bg-gradient-to-r", option.gradient)} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Specific Topic Selection */}
          {focus === 'specific' && (
            <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-4">
                Select Topic
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-48 overflow-y-auto">
                {topics.map((topic) => (
                  <Button
                    key={topic}
                    variant={specificTopic === topic ? "default" : "outline"}
                    onClick={() => setSpecificTopic(topic)}
                    className={cn(
                      "h-auto py-2 px-3 text-xs font-medium justify-start",
                      specificTopic === topic && "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
                    )}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Length */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading font-bold">Interview Length</CardTitle>
              <CardDescription className="text-xs">Select the number of questions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="flex gap-4">
            {[4, 6, 8].map((len) => (
              <button
                key={len}
                onClick={() => setLength(len)}
                className={cn(
                  "flex-1 py-6 rounded-2xl font-bold transition-all duration-300 border-2",
                  length === len
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-xl shadow-violet-500/20 scale-[1.02]"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <span className="text-2xl font-heading">{len}</span>
                <span className="block text-sm font-medium mt-1 opacity-70">Questions</span>
                <span className="block text-xs font-medium mt-2 opacity-50">~{Math.round(len * 5)} min</span>
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Or customize
              </span>
              <Badge variant="outline" className="font-mono font-bold">
                {length} questions
              </Badge>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>3</span>
              <span>10</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary & Start Button */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="pb-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertCircle size={14} /> Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mode</p>
              <div className="flex items-center gap-2">
                {currentModeData && <currentModeData.icon className={cn("h-4 w-4", currentModeData.iconColor)} />}
                <p className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{mode}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Focus</p>
              <div className="flex items-center gap-2">
                {currentFocusData && <currentFocusData.icon className={cn("h-4 w-4", currentFocusData.iconColor)} />}
                <p className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{focus}</p>
              </div>
            </div>
            {focus === 'specific' && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Topic</p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{specificTopic || 'Not selected'}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</p>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{length} questions (~{Math.round(length * 5)} min)</p>
            </div>
          </div>

          <Button
            onClick={handleStartInterview}
            disabled={loading || (focus === 'specific' && !specificTopic)}
            size="lg"
            className={cn(
              "w-full h-16 text-lg font-bold rounded-2xl shadow-xl transition-all",
              "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
              "hover:shadow-2xl hover:scale-[1.01]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">Initializing...</span>
              </>
            ) : (
              <>
                <Play size={20} className="mr-2" />
                Start Mock Interview
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="font-heading font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Pro Tips
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <span><strong className="text-zinc-900 dark:text-zinc-100">Focus on weak skills</strong> helps improve your performance faster based on past analytics</span>
            </li>
            <li className="flex gap-3">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" />
              <span><strong className="text-zinc-900 dark:text-zinc-100">Longer interviews (8 questions)</strong> are more realistic and comprehensive</span>
            </li>
            <li className="flex gap-3">
              <Shuffle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span><strong className="text-zinc-900 dark:text-zinc-100">Mixed mode</strong> gives you a real interview experience with varied question types</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
