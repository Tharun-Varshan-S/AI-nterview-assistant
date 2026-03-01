import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import MockSetupPage from './pages/MockSetupPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster position="top-right" richColors expand={false} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
