/**
 * Simple utility to persist interview state to localStorage
 * Allows recovery of interview state on page refresh
 */

interface InterviewState {
  currentQuestionIndex: number;
  answers: Array<{
    questionIndex: number;
    response: string;
    isCodingAnswer?: boolean;
    language?: string;
  }>;
  timestamp: number;
}

const INTERVIEW_STATE_KEY = (interviewId: string) => `interview_state_${interviewId}`;

export const interviewStateStorage = {
  /**
   * Save interview state to localStorage
   */
  saveState: (interviewId: string, state: Partial<InterviewState>) => {
    try {
      const key = INTERVIEW_STATE_KEY(interviewId);
      const existingState = localStorage.getItem(key);
      const baseState = existingState ? JSON.parse(existingState) : { answers: [], currentQuestionIndex: 0 };

      const newState: InterviewState = {
        ...baseState,
        ...state,
        timestamp: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(newState));
      console.debug('📍 Interview state saved', { interviewId, questionIndex: state.currentQuestionIndex });
    } catch (error) {
      console.error('Failed to save interview state:', error);
    }
  },

  /**
   * Load interview state from localStorage
   */
  loadState: (interviewId: string): InterviewState | null => {
    try {
      const key = INTERVIEW_STATE_KEY(interviewId);
      const state = localStorage.getItem(key);
      if (state) {
        console.debug('📍 Interview state loaded', { interviewId });
        return JSON.parse(state);
      }
      return null;
    } catch (error) {
      console.error('Failed to load interview state:', error);
      return null;
    }
  },

  /**
   * Clear interview state after completion
   */
  clearState: (interviewId: string) => {
    try {
      const key = INTERVIEW_STATE_KEY(interviewId);
      localStorage.removeItem(key);
      console.debug('📍 Interview state cleared', { interviewId });
    } catch (error) {
      console.error('Failed to clear interview state:', error);
    }
  },

  /**
   * Check if state is stale (older than 30 minutes)
   */
  isStateStale: (interviewId: string, maxAgeMs = 30 * 60 * 1000): boolean => {
    const state = interviewStateStorage.loadState(interviewId);
    if (!state) return false;

    const age = Date.now() - state.timestamp;
    return age > maxAgeMs;
  },
};
