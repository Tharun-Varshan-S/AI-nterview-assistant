import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Retry configuration for failed requests
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ERR_NETWORK'],
};

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 401 (unauthorized) - clear auth and redirect
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Determine if error is retryable
    const isRetryable =
      RETRY_CONFIG.retryableStatusCodes.includes(error.response?.status) ||
      RETRY_CONFIG.retryableErrors.includes(error.code) ||
      error.message.includes('timeout');

    // Only retry GET, POST, PUT requests (not DELETE)
    const shouldRetry =
      isRetryable &&
      config &&
      config.method !== 'delete' &&
      (!config.retryCount || config.retryCount < RETRY_CONFIG.maxRetries);

    if (shouldRetry) {
      config.retryCount = (config.retryCount || 0) + 1;
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, config.retryCount - 1); // Exponential backoff

      console.warn(
        `📍 Retry attempt ${config.retryCount}/${RETRY_CONFIG.maxRetries} after ${delay}ms`,
        { method: config.method, url: config.url }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Resume {
  _id: string;
  userId: string;
  filePath: string;
  fileName: string;
  extractedText: string;
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIEvaluation {
  overallScore: number;
  technicalAccuracy: number;
  clarity: number;
  depth: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
}

export interface Answer {
  questionId: string;
  question: string;
  response: string;
  aiEvaluation?: AIEvaluation;
  evaluatedAt?: string;
}

export interface Interview {
  _id: string;
  userId: string | User;
  status: 'in-progress' | 'completed';
  questions: Question[];
  answers: Answer[];
  totalScore: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string, role: 'candidate' | 'recruiter') => {
    const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
    return data.user;
  },
};

// Resume API
export const resumeAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const { data } = await api.post<{ success: boolean; resume: Resume }>('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.resume;
  },

  get: async () => {
    const { data } = await api.get<{ success: boolean; resume: Resume }>('/resume');
    return data.resume;
  },
};

// Interview API
export const interviewAPI = {
  create: async () => {
    const { data } = await api.post<{ success: boolean; interview: Interview }>('/interview/create');
    return data.interview;
  },

  getMyInterviews: async () => {
    const { data } = await api.get<{ success: boolean; interviews: Interview[] }>('/interview/my-interviews');
    return data.interviews;
  },

  getInterviewById: async (id: string) => {
    const { data } = await api.get<{ success: boolean; interview: Interview }>(`/interview/${id}`);
    return data.interview;
  },

  submitAnswer: async (interviewId: string, questionId: string, response: string) => {
    const { data } = await api.post<{ success: boolean; answer: Answer; interview: Interview }>(
      `/interview/${interviewId}/submit-answer`,
      { questionId, response }
    );
    return data;
  },

  completeInterview: async (interviewId: string) => {
    const { data } = await api.put<{ success: boolean; interview: Interview }>(
      `/interview/${interviewId}/complete`
    );
    return data.interview;
  },
};

// Recruiter API
export const recruiterAPI = {
  getAllCompletedInterviews: async () => {
    const { data } = await api.get<{ success: boolean; interviews: Interview[] }>('/interview/recruiter/all-completed');
    return data.interviews;
  },

  getInterviewWithDetails: async (id: string) => {
    const { data } = await api.get<{ success: boolean; interview: Interview; resume: Resume }>(
      `/interview/recruiter/${id}`
    );
    return data;
  },
};

export default api;
