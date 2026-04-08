import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Brain,
  Code2,
  Settings,
  UserCircle,
  TrendingUp,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { interviewAPI } from '@/services/api';
import Spinner from './Spinner';

interface MistakeEntry {
  question: string;
  userAnswer: string;
  issue: string;
  correctConcept: string;
  improvement: string;
}

interface PerQuestionScore {
  questionId: number;
  score: number;
  feedback: string;
}

export default function PracticeResultsDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!sessionId) return;
      try {
        setLoading(true);
        const response = await interviewAPI.getPracticeSessionDetail(sessionId);
        setSession(response);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load session details');
        console.error('Error loading session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSessionDetails();
  }, [sessionId]);

  const modeIcons: Record<string, React.ReactNode> = {
    aptitude: <Brain size={20} />,
    coding: <Code2 size={20} />,
    technical: <Settings size={20} />,
    behavioral: <UserCircle size={20} />,
  };

  const difficultyColor: Record<string, string> = {
    easy: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    medium: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    hard: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
          <CardContent className="pt-6">
            <p className="text-rose-600 dark:text-rose-400">{error || 'Session not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const evaluation = session.evaluationSummary;
  const mistakes = evaluation?.mistakes || [];
  const perQuestionScores = evaluation?.perQuestionScore || [];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/candidate/practice')}
            className="mb-4 gap-2"
          >
            <ArrowLeft size={16} />
            Back to Practice
          </Button>
          <h1 className="text-4xl font-bold">{session.topic}</h1>
          <div className="flex items-center gap-4 mt-3">
            <Badge className="gap-2">
              {modeIcons[session.mode]}
              <span className="capitalize">{session.mode}</span>
            </Badge>
            <Badge variant="outline" className={cn('border', difficultyColor[session.difficulty])}>
              {session.difficulty}
            </Badge>
            {session.status === 'completed' && (
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Completed
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {Number(evaluation?.score || 0).toFixed(1)}
          </div>
          <p className="text-muted-foreground text-sm mt-1">out of 10</p>
        </div>
      </div>

      {/* Summary */}
      {evaluation?.summary && (
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={20} className="text-yellow-500" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{evaluation.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Questions</p>
                <p className="text-2xl font-bold mt-2">{session.totalQuestions}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Attempted</p>
                <p className="text-2xl font-bold mt-2">{session.questionsAttempted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Duration</p>
                <p className="text-2xl font-bold mt-2">{Math.floor((session.timeSpent || 0) / 60)}m</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Status</p>
                <p className="text-2xl font-bold mt-2 capitalize">{session.status}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mistakes Breakdown */}
      {mistakes && mistakes.length > 0 && (
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-500" />
              Mistakes & Corrections ({mistakes.length})
            </CardTitle>
            <CardDescription>Learn from your errors and understand the correct concepts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mistakes.map((mistake: MistakeEntry, idx: number) => (
              <div
                key={idx}
                className="rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">Q{idx + 1}: {mistake.question}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Your Answer */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Your Answer
                    </label>
                    <div className="bg-background border border-rose-200 dark:border-rose-800/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-rose-600 dark:text-rose-400 font-mono break-words">
                        {mistake.userAnswer || '(no response)'}
                      </p>
                    </div>
                  </div>

                  {/* What Went Wrong */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Issue / What Went Wrong
                    </label>
                    <div className="bg-background border border-rose-200 dark:border-rose-800/30 rounded-lg p-3">
                      <p className="text-sm text-rose-600 dark:text-rose-400">{mistake.issue}</p>
                    </div>
                  </div>
                </div>

                {/* Correct Concept */}
                <div className="space-y-2 border-t border-rose-200 dark:border-rose-800/30 pt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    ✓ Correct Concept
                  </label>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{mistake.correctConcept}</p>
                  </div>
                </div>

                {/* How to Improve */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    💡 How to Improve
                  </label>
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">{mistake.improvement}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per-Question Scores */}
      {perQuestionScores && perQuestionScores.length > 0 && (
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Per-Question Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {perQuestionScores.map((q: PerQuestionScore, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Q{q.questionId + 1}</span>
                    <p className="text-sm text-muted-foreground max-w-md">{q.feedback}</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    {Number(q.score).toFixed(1)}/10
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Based on your performance, here's what to focus on:</p>
          <ul className="space-y-2">
            {mistakes.length > 0 && (
              <li className="text-sm flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Review the correct concepts for questions you missed</span>
              </li>
            )}
            <li className="text-sm flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Practice similar {session.mode} problems to reinforce learning</span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Track your progress over multiple practice sessions</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate('/candidate/practice')} className="w-full">
            Continue Practicing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
