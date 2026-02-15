import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
  seconds: number;
  aiScore?: number;
}

export interface AnswerEntry {
  questionId: string;
  answer: string;
  durationSeconds: number;
  submittedAt: number;
}

export interface CandidateProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
}

export interface InterviewState {
  activeCandidate?: CandidateProfile;
  questions: Question[];
  currentIndex: number;
  answers: AnswerEntry[];
  timerRemaining: number;
  lastTimerUpdatedAt?: number;
  startedAt?: number;
  completedAt?: number;
  finalScore?: number;
  finalSummary?: string;
  candidates: Array<{
    profile: CandidateProfile;
    finalScore: number;
    finalSummary: string;
    answers: AnswerEntry[];
    questions: Question[];
    createdAt: number;
  }>;
}

const initialState: InterviewState = {
  questions: [],
  currentIndex: 0,
  answers: [],
  timerRemaining: 0,
  lastTimerUpdatedAt: undefined,
  candidates: []
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setActiveCandidate(state, action: PayloadAction<CandidateProfile | undefined>) {
      state.activeCandidate = action.payload;
    },
    setQuestions(state, action: PayloadAction<Question[]>) {
      state.questions = action.payload;
      state.currentIndex = 0;
      state.answers = [];
      state.finalScore = undefined;
      state.finalSummary = undefined;
      state.timerRemaining = action.payload[0]?.seconds ?? 0;
      state.lastTimerUpdatedAt = Date.now();
      state.startedAt = Date.now();
      state.completedAt = undefined;
    },
    decrementTimer(state) {
      state.timerRemaining = Math.max(0, state.timerRemaining - 1);
      state.lastTimerUpdatedAt = Date.now();
    },
    setTimer(state, action: PayloadAction<number>) {
      state.timerRemaining = action.payload;
      state.lastTimerUpdatedAt = Date.now();
    },
    submitAnswer(state, action: PayloadAction<{ answer: string; durationSeconds: number }>) {
      const question = state.questions[state.currentIndex];
      if (!question) return;
      state.answers.push({
        questionId: question.id,
        answer: action.payload.answer,
        durationSeconds: action.payload.durationSeconds,
        submittedAt: Date.now()
      });
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex += 1;
        state.timerRemaining = state.questions[state.currentIndex].seconds;
      } else {
        state.completedAt = Date.now();
      }
    },
    setFinalResults(state, action: PayloadAction<{ score: number; summary: string }>) {
      state.finalScore = action.payload.score;
      state.finalSummary = action.payload.summary;
      if (state.activeCandidate && state.questions.length) {
        state.candidates.push({
          profile: state.activeCandidate,
          finalScore: state.finalScore,
          finalSummary: state.finalSummary,
          answers: state.answers,
          questions: state.questions,
          createdAt: Date.now()
        });
      }
    },
    computeAndSetFinalResults(state) {
      const perQuestionScores = state.answers.map((a) => {
        const q = state.questions.find(q => q.id === a.questionId);
        if (!q) return 0;
        const base = q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 20 : 35;
        const lengthBonus = Math.min(35, Math.floor((a.answer || '').split(/\s+/).length / 3));
        const score = Math.min(100, base + lengthBonus);
        q.aiScore = score;
        return score;
      });
      const total = perQuestionScores.reduce((s, n) => s + n, 0);
      const max = state.questions.reduce((s, q) => s + (q.difficulty === 'easy' ? 45 : q.difficulty === 'medium' ? 55 : 70), 0);
      const final = Math.round((total / Math.max(1, max)) * 100);
      const summary = final >= 75 ? 'Strong performance' : final >= 50 ? 'Decent performance' : 'Needs improvement';
      state.finalScore = final;
      state.finalSummary = summary;
      if (state.activeCandidate && state.questions.length) {
        state.candidates.push({
          profile: state.activeCandidate,
          finalScore: final,
          finalSummary: summary,
          answers: state.answers,
          questions: state.questions,
          createdAt: Date.now()
        });
      }
    },
    resetInterview(state) {
      state.questions = [];
      state.currentIndex = 0;
      state.answers = [];
      state.timerRemaining = 0;
      state.startedAt = undefined;
      state.completedAt = undefined;
      state.finalScore = undefined;
      state.finalSummary = undefined;
    }
  }
});

export const {
  setActiveCandidate,
  setQuestions,
  decrementTimer,
  setTimer,
  submitAnswer,
  setFinalResults,
  computeAndSetFinalResults,
  resetInterview
} = interviewSlice.actions;

export default interviewSlice.reducer;


