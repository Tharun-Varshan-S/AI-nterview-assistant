import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PracticeSession, interviewAPI } from '../services/api';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Brain,
  Code2,
  Settings,
  UserCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  History,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  Clock,
  Trophy,
  Sparkles,
  ChevronRight
} from 'lucide-react';

type PracticeMode = '' | 'aptitude' | 'coding' | 'technical' | 'behavioral';

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<'modes' | 'history' | 'stats'>('modes');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  const modes = [
    {
      id: 'aptitude',
      name: 'Aptitude',
      description: 'Logical reasoning, quantitative and verbal skills',
      icon: Brain,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    },
    {
      id: 'coding',
      name: 'Coding',
      description: 'DSA problems with real-time code execution',
      icon: Code2,
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-500/10 to-purple-500/5',
      iconColor: 'text-violet-500',
      borderColor: 'border-violet-500/20 hover:border-violet-500/40',
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Core CS concepts, system design, and more',
      icon: Settings,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/5',
      iconColor: 'text-orange-500',
      borderColor: 'border-orange-500/20 hover:border-orange-500/40',
    },
    {
      id: 'behavioral',
      name: 'Behavioral',
      description: 'HR questions and soft skill assessment',
      icon: UserCircle,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    },
  ];

  const topics = {
    aptitude: ['Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability', 'Critical Thinking'],
    coding: ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting & Searching'],
    technical: ['Data Structures', 'DBMS', 'OOP Concepts', 'System Design', 'REST APIs', 'Web Development'],
    behavioral: ['Teamwork', 'Leadership', 'Problem Solving', 'Conflict Resolution', 'Motivation'],
  };

  const startPractice = async () => {
    if (!selectedMode || !selectedTopic) {
      toast.error('Please select a mode and topic');
      return;
    }

    setLoading(true);
    try {
      const response = await interviewAPI.startPracticeSession({
        mode: selectedMode as Exclude<PracticeMode, ''>,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        questionCount: 5,
      });

      if (response.data?.sessionId) {
        navigate(`/candidate/practice/${response.data.sessionId}`);
        toast.success('Practice session started');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start practice session');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await interviewAPI.getPracticeSessions({});
      setSessions(response.data?.sessions || []);
    } catch (error: any) {
      toast.error('Failed to load practice history');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await interviewAPI.getPracticeStats({});
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to load practice statistics');
    } finally {
      setLoading(false);
    }
  };

  const selectedModeData = modes.find((m) => m.id === selectedMode);

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
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <Badge className="bg-white/10 text-white border-white/20 uppercase text-[10px] font-bold tracking-widest">
              Skill Building
            </Badge>
          </div>
          <h1 className="text-4xl font-heading font-bold tracking-tight text-white">Practice Hub</h1>
          <p className="mt-2 text-zinc-400 max-w-lg text-sm">
            Master interview skills across aptitude, coding, technical, and behavioral domains with AI-powered feedback.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="modes" className="space-y-6">
        <TabsList className="h-12 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <TabsTrigger
            value="modes"
            onClick={() => {
              setActiveTab('modes');
              setSelectedMode('');
            }}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg gap-2 px-6"
          >
            <Target size={16} />
            Practice Modes
          </TabsTrigger>
          <TabsTrigger
            value="history"
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg gap-2 px-6"
          >
            <History size={16} />
            History
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            onClick={() => {
              setActiveTab('stats');
              loadStats();
            }}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg gap-2 px-6"
          >
            <BarChart3 size={16} />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Practice Modes Tab */}
        <TabsContent value="modes" className="space-y-6 mt-0">
          {!selectedMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Card
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as PracticeMode)}
                    className={cn(
                      "relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group",
                      "border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl",
                      mode.borderColor
                    )}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", mode.bgGradient)} />
                    <CardHeader className="relative pb-2">
                      <div className="flex items-start justify-between">
                        <div className={cn("p-3 rounded-2xl bg-gradient-to-br", mode.bgGradient)}>
                          <Icon className={cn("h-6 w-6", mode.iconColor)} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-2">
                      <CardTitle className="text-xl font-heading font-bold">{mode.name}</CardTitle>
                      <CardDescription className="text-sm">{mode.description}</CardDescription>
                      <div className={cn("h-1 w-16 rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all", mode.gradient)} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMode('')}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    {selectedModeData && (
                      <div className={cn("p-2 rounded-xl bg-gradient-to-br", selectedModeData.bgGradient)}>
                        <selectedModeData.icon className={cn("h-5 w-5", selectedModeData.iconColor)} />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg font-heading font-bold">{selectedModeData?.name} Practice</CardTitle>
                      <CardDescription className="text-xs">Configure your session</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                {/* Topic Selection */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Select Topic
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(topics[selectedMode as keyof typeof topics] || []).map((topic) => (
                      <Button
                        key={topic}
                        variant={selectedTopic === topic ? "default" : "outline"}
                        onClick={() => setSelectedTopic(topic)}
                        className={cn(
                          "h-auto py-3 px-4 justify-start font-medium transition-all",
                          selectedTopic === topic && "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                        )}
                      >
                        {topic}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Difficulty Level
                  </label>
                  <div className="flex gap-3">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <Button
                        key={level}
                        variant={selectedDifficulty === level ? "default" : "outline"}
                        onClick={() => setSelectedDifficulty(level)}
                        className={cn(
                          "flex-1 h-auto py-3 capitalize font-semibold transition-all",
                          selectedDifficulty === level && "shadow-lg",
                          level === 'easy' && selectedDifficulty === level && "bg-emerald-600 hover:bg-emerald-700",
                          level === 'medium' && selectedDifficulty === level && "bg-amber-600 hover:bg-amber-700",
                          level === 'hard' && selectedDifficulty === level && "bg-rose-600 hover:bg-rose-700"
                        )}
                      >
                        {level === 'easy' && <Zap size={16} className="mr-2" />}
                        {level === 'medium' && <Target size={16} className="mr-2" />}
                        {level === 'hard' && <Trophy size={16} className="mr-2" />}
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <Button
                  onClick={startPractice}
                  disabled={loading || !selectedTopic}
                  size="lg"
                  className={cn(
                    "w-full h-14 text-lg font-bold rounded-2xl shadow-xl transition-all",
                    "bg-gradient-to-r hover:shadow-2xl hover:scale-[1.01]",
                    selectedModeData ? selectedModeData.gradient : "from-violet-600 to-blue-600"
                  )}
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Play size={20} className="mr-2" />
                      Start Practice Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
              <CardContent className="py-16 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">No practice sessions yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Start practicing to see your history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card
                  key={session._id}
                  className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          modes.find((m) => m.id === session.mode)?.bgGradient || "bg-zinc-100 dark:bg-zinc-800"
                        )}>
                          {(() => {
                            const Icon = modes.find((m) => m.id === session.mode)?.icon || Brain;
                            return <Icon className={cn("h-5 w-5", modes.find((m) => m.id === session.mode)?.iconColor || "text-zinc-500")} />;
                          })()}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg">{session.topic}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 capitalize">
                              <Target size={12} />
                              {session.mode}
                            </span>
                            <span className="flex items-center gap-1 capitalize">
                              <Zap size={12} />
                              {session.difficulty}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              {session.questionsAttempted}/{session.totalQuestions}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-heading font-bold">{Number(session.averageScore).toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">out of 10</p>
                        </div>
                        <Badge
                          variant={session.status === 'completed' ? 'default' : 'secondary'}
                          className={cn(
                            "capitalize",
                            session.status === 'completed' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {session.status}
                        </Badge>
                        <Button
                          onClick={() => navigate(`/candidate/practice-results/${session._id}`)}
                          variant="ghost"
                          size="sm"
                          className="gap-1 ml-auto"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Sessions</p>
                      <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                        <History className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                    </div>
                    <p className="text-4xl font-heading font-bold">{stats.totalSessions}</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Average Score</p>
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-4xl font-heading font-bold">{Number(stats.averageScore).toFixed(1)}</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Best Score</p>
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                        <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-4xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(stats.bestPerformance).toFixed(1)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Needs Work</p>
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                        <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <p className="text-4xl font-heading font-bold text-amber-600 dark:text-amber-400">
                      {Number(stats.worstPerformance).toFixed(1)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance by Mode */}
              {Object.keys(stats.sessionsByMode || {}).length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="font-heading font-bold flex items-center gap-2">
                      <BarChart3 size={20} />
                      Performance by Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(stats.sessionsByMode).map(([mode, data]: [string, any]) => {
                      const modeData = modes.find((m) => m.id === mode);
                      return (
                        <div key={mode} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {modeData && (
                                <div className={cn("p-2 rounded-lg", modeData.bgGradient)}>
                                  <modeData.icon className={cn("h-4 w-4", modeData.iconColor)} />
                                </div>
                              )}
                              <span className="font-medium capitalize">{mode}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{data.count} sessions</span>
                              <span className="font-bold">{Number(data.avgScore).toFixed(1)}/10</span>
                            </div>
                          </div>
                          <Progress value={(data.avgScore / 10) * 100} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">No statistics available</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Complete some practice sessions first</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
