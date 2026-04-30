import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import InterviewSession from './pages/InterviewSession';
import InterviewResults from './pages/InterviewResults';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDetailView from './pages/CandidateDetailView';
import PracticePage from './pages/PracticePage';
import PracticeSessionPage from './pages/PracticeSessionPage';
import PracticeResultsDetail from './components/PracticeResultsDetail';
import MockSetupPage from './pages/MockSetupPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIInterviewPage from './pages/AIInterviewPage';

function LegacyInterviewRedirect({ targetPrefix }: { targetPrefix: string }) {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`${targetPrefix}/${id || ''}`} replace />;
}

import { TooltipProvider } from './components/ui/tooltip';

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/ai-interview" element={<AIInterviewPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Candidate Routes */}
            <Route
              path="/candidate"
              element={
                <ProtectedRoute requiredRole="candidate">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/candidate/dashboard" replace />} />
              <Route path="dashboard" element={<CandidateDashboard />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="practice/:sessionId" element={<PracticeSessionPage />} />
              <Route path="practice-results/:sessionId" element={<PracticeResultsDetail />} />
              <Route path="mock/setup" element={<MockSetupPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="interview/:id" element={<InterviewSession />} />
              <Route path="results/:id" element={<InterviewResults />} />
            </Route>

            {/* Recruiter Routes */}
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
              <Route path="dashboard" element={<RecruiterDashboard />} />
              <Route path="candidate/:id" element={<CandidateDetailView />} />
            </Route>

            {/* Default Route */}
            <Route path="/dashboard" element={<Navigate to="/candidate/dashboard" replace />} />
            <Route path="/practice" element={<Navigate to="/candidate/practice" replace />} />
            <Route path="/mock/setup" element={<Navigate to="/candidate/mock/setup" replace />} />
            <Route path="/mock/:id" element={<LegacyInterviewRedirect targetPrefix="/candidate/interview" />} />
            <Route path="/analytics" element={<Navigate to="/candidate/analytics" replace />} />
            <Route path="/interview/:id/results" element={<LegacyInterviewRedirect targetPrefix="/candidate/results" />} />
            <Route path="/" element={<Navigate to="/ai-interview" replace />} />
            <Route path="*" element={<Navigate to="/ai-interview" replace />} />
          </Routes>

          <Toaster position="top-right" richColors expand={false} />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
