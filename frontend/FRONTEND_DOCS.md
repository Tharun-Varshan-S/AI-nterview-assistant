# AI Interview Platform - Frontend Documentation

## 🎯 Overview

A modern React frontend for the AI Interview Platform built with React, TypeScript, Vite, TailwindCSS, and React Router.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CountdownTimer.tsx       # Animated countdown timer
│   ├── DashboardLayout.tsx      # Main dashboard layout with nav
│   ├── DifficultyBadge.tsx      # Question difficulty indicator
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   ├── ResumeUpload.tsx         # Resume upload component (legacy)
│   ├── Spinner.tsx              # Loading spinner
│   └── WelcomeBackModal.tsx     # Welcome modal (legacy)
│
├── context/             # React Context providers
│   └── AuthContext.tsx          # Authentication state management
│
├── pages/               # Main application pages
│   ├── CandidateDashboard.tsx   # Candidate home page
│   ├── CandidateDetailView.tsx  # Recruiter view of candidate
│   ├── InterviewResults.tsx     # Interview results for candidate
│   ├── InterviewSession.tsx     # Active interview session
│   ├── LoginPage.tsx            # Login page
│   ├── RecruiterDashboard.tsx   # Recruiter home page
│   └── RegisterPage.tsx         # Registration page
│
├── services/            # API and external services
│   ├── ai.ts                    # AI service (legacy)
│   └── api.ts                   # Backend API integration
│
├── App.tsx              # Main app component with routing
├── main.tsx             # App entry point
└── index.css            # Global styles with Tailwind

```

## 🚀 Features

### Authentication
- **Login/Register**: JWT-based authentication
- **Role-based Access**: Separate flows for candidates and recruiters
- **Protected Routes**: Automatic redirects based on auth state
- **Persistent Sessions**: Token stored in localStorage

### Candidate Flow
1. **Dashboard**
   - Upload resume (PDF only)
   - View interview history
   - Start new interviews
   - See past scores

2. **Interview Session**
   - Real-time countdown timer (3 minutes per question)
   - Auto-submit on timeout
   - Progress indicator
   - Difficulty badges
   - Prevent accidental navigation

3. **Results View**
   - Overall score and performance summary
   - AI evaluation breakdown:
     - Overall Score
     - Technical Accuracy
     - Clarity
     - Depth
   - Strengths, weaknesses, and improvement suggestions
   - Question-by-question analysis

### Recruiter Flow
1. **Dashboard**
   - View all completed interviews
   - Filter by performance (High/Medium/Low)
   - Performance statistics
   - Quick candidate overview

2. **Candidate Detail View**
   - Full interview transcript
   - AI score breakdown per question
   - Resume download
   - Extracted resume text
   - Comprehensive evaluation metrics

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **TailwindCSS 3** - Utility-first CSS
- **Axios** - HTTP client
- **Sonner** - Toast notifications
- **Lucide React** - Icon library

## 📦 Installation

```bash
cd frontend
npm install
```

## ⚙️ Configuration

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🏃 Development

```bash
npm run dev
```

Visit `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
npm run preview  # Preview production build
```

## 🔑 Key Components

### AuthContext
Manages authentication state globally:
```typescript
const { user, token, login, logout, isAuthenticated } = useAuth();
```

### ProtectedRoute
Protects routes based on authentication and role:
```typescript
<ProtectedRoute requiredRole="candidate">
  <CandidateDashboard />
</ProtectedRoute>
```

### API Service
Centralized API calls with interceptors:
```typescript
// Automatically adds JWT token to requests
// Handles 401 errors and redirects to login
import { authAPI, interviewAPI, resumeAPI, recruiterAPI } from './services/api';
```

## 📱 Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page

### Candidate Routes (Protected)
- `/candidate/dashboard` - Main dashboard
- `/candidate/interview/:id` - Active interview session
- `/candidate/results/:id` - Interview results

### Recruiter Routes (Protected)
- `/recruiter/dashboard` - Candidates overview
- `/recruiter/candidate/:id` - Detailed candidate view

## 🎨 UI Highlights

### Design System
- **Color Palette**: Blue primary, gradient backgrounds
- **Typography**: Clean, hierarchical
- **Spacing**: Consistent Tailwind spacing scale
- **Components**: Rounded, shadowed cards with hover states

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Adaptive layouts and navigation

### Loading States
- Spinner component for async operations
- Disabled buttons during submission
- Skeleton screens for data loading

### Error Handling
- Toast notifications for errors
- Form validation
- API error messages
- Fallback UI states

## 🔄 State Management

Uses **React Context API** for global state:
- **AuthContext**: User authentication and session
- Local component state for UI interactions
- No Redux - simplified architecture

## 🛡️ Security Features

- JWT token in localStorage
- Protected routes with role checking
- Automatic token refresh handling
- XSS prevention through React
- CSRF protection via token-based auth

## 📊 API Integration

### Axios Instance
```typescript
// Configured in services/api.ts
- Base URL from environment
- Automatic JWT header injection
- Response/error interceptors
- Type-safe interfaces
```

### API Endpoints
- **Auth**: `/auth/login`, `/auth/register`, `/auth/me`
- **Resume**: `/resume/upload`, `/resume`
- **Interview**: `/interview/create`, `/interview/:id`, `/interview/:id/submit-answer`
- **Recruiter**: `/interview/recruiter/all-completed`, `/interview/recruiter/:id`

## 🧪 Type Safety

Full TypeScript coverage with interfaces:
- `User`, `Interview`, `Question`, `Answer`
- `AIEvaluation`, `Resume`
- `AuthResponse`, API return types

## 🎯 Performance Optimizations

- Code splitting via React Router
- Lazy loading components
- Optimized re-renders with React Context
- Vite's fast HMR
- Production build minification

## 🚨 Error Boundaries

- Toast notifications for user-facing errors
- Graceful degradation
- Redirect to login on 401
- Fallback UI for missing data

## 📝 Best Practices

- **Component Structure**: Functional components with hooks
- **File Organization**: Co-located related code
- **Naming Conventions**: PascalCase for components, camelCase for functions
- **Code Style**: ESLint + Prettier configured
- **Accessibility**: Semantic HTML, ARIA labels where needed

## 🔮 Future Enhancements

- [ ] Dark mode toggle
- [ ] Real-time interview monitoring (WebSocket)
- [ ] Advanced filtering and search
- [ ] Export results as PDF
- [ ] Interview scheduling
- [ ] Video interview integration
- [ ] Analytics dashboard

## 🐛 Common Issues

### 1. API Connection
**Problem**: Cannot connect to backend  
**Solution**: Check `.env` file and ensure backend is running on port 5000

### 2. Login Redirect Loop
**Problem**: Keeps redirecting to login  
**Solution**: Clear localStorage and re-login

### 3. Timer Not Working
**Problem**: Countdown doesn't start  
**Solution**: Check browser console for errors, ensure state updates properly

## 📞 Support

For issues or questions, please check:
1. Backend API is running
2. Environment variables are set
3. Network tab for failed requests
4. Console for JavaScript errors

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [TailwindCSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

Built with ❤️ for AI-powered technical interviews
