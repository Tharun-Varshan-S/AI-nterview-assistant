# 🎨 Frontend Component Architecture

## 📦 Component Breakdown

### Core Components (`src/components/`)

#### 1. **CountdownTimer.tsx**
**Purpose**: Animated countdown timer for interview questions

**Props**:
```typescript
{
  seconds: number;        // Total seconds
  onTimeout: () => void;  // Callback when timer reaches 0
}
```

**Features**:
- Auto-decrement every second
- Color changes based on time remaining (green → yellow → red)
- Animated pulse effect when low
- MM:SS format display

---

#### 2. **DashboardLayout.tsx**
**Purpose**: Main application layout with navigation and header

**Features**:
- Responsive header with logo
- Role-based navigation (candidate/recruiter)
- User info display
- Logout functionality
- Sticky positioning
- Nested routing support via `<Outlet />`

---

#### 3. **DifficultyBadge.tsx**
**Purpose**: Visual indicator for question difficulty

**Props**:
```typescript
{
  difficulty: 'easy' | 'medium' | 'hard';
}
```

**Styling**:
- Easy: Green background
- Medium: Yellow background
- Hard: Red background

---

#### 4. **ProtectedRoute.tsx**
**Purpose**: Route wrapper for authentication and role-based access

**Props**:
```typescript
{
  children: ReactNode;
  requiredRole?: 'candidate' | 'recruiter';
}
```

**Logic**:
- Check authentication status
- Redirect to login if not authenticated
- Verify user role if `requiredRole` specified
- Redirect to appropriate dashboard if role mismatch

---

#### 5. **Spinner.tsx**
**Purpose**: Loading indicator

**Props**:
```typescript
{
  size?: 'sm' | 'md' | 'lg';
}
```

**Sizes**:
- sm: 16px (w-4 h-4)
- md: 32px (w-8 h-8)
- lg: 48px (w-12 h-12)

---

### Pages (`src/pages/`)

#### 1. **LoginPage.tsx**
**Purpose**: User authentication

**State**:
- email, password
- loading

**Flow**:
1. Form submission
2. Call `authAPI.login()`
3. Store token in context
4. Redirect based on role

---

#### 2. **RegisterPage.tsx**
**Purpose**: New user registration

**State**:
- name, email, password, role
- loading

**Features**:
- Role selection UI (Candidate vs Recruiter)
- Visual role cards
- Form validation

---

#### 3. **CandidateDashboard.tsx**
**Purpose**: Candidate home page

**State**:
- resume
- interviews
- loading, uploading

**Sections**:
- Resume upload/management
- "Start Interview" button
- Interview history list

**API Calls**:
- `resumeAPI.get()`
- `interviewAPI.getMyInterviews()`
- `resumeAPI.upload(file)`
- `interviewAPI.create()`

---

#### 4. **InterviewSession.tsx**
**Purpose**: Active interview session

**State**:
- interview
- currentQuestionIndex
- answer
- submitting
- timeKey (for timer reset)

**Features**:
- Progress bar
- Question display
- Answer textarea
- Submit button
- Auto-submit on timeout
- Prevent navigation during interview

**API Calls**:
- `interviewAPI.getInterviewById(id)`
- `interviewAPI.submitAnswer(id, questionId, answer)`
- `interviewAPI.completeInterview(id)`

**Timer Logic**:
- 180 seconds per question
- Key-based component reset
- Callback on timeout triggers auto-submit

---

#### 5. **InterviewResults.tsx**
**Purpose**: Display candidate's interview results

**State**:
- interview
- loading

**Sections**:
1. Overall score card
2. Performance summary (total, avg, count)
3. Question-by-question analysis:
   - Question text + difficulty
   - Candidate's answer
   - AI evaluation scores
   - Strengths, weaknesses, suggestions

**Score Visualization**:
- Overall score (large display)
- Dimension scores (technical, clarity, depth)
- Color-coded badges

---

#### 6. **RecruiterDashboard.tsx**
**Purpose**: Recruiter's candidate overview

**State**:
- interviews
- filter ('all' | 'high' | 'medium' | 'low')
- loading

**Features**:
- Statistics cards
- Performance filter buttons
- Candidate list with scores
- Click to view details

**Filter Logic**:
- High: score >= 7
- Medium: 4 <= score < 7
- Low: score < 4

**API Calls**:
- `recruiterAPI.getAllCompletedInterviews()`

---

#### 7. **CandidateDetailView.tsx**
**Purpose**: Detailed view of a candidate for recruiters

**State**:
- interview
- resume
- loading

**Layout**:
- Left column (2/3): Interview analysis
- Right column (1/3): Resume sidebar

**Sections**:
- Candidate header with score
- Performance metrics
- Question-by-question breakdown
- Resume download button
- Extracted resume text

**API Calls**:
- `recruiterAPI.getInterviewWithDetails(id)`

---

### Context (`src/context/`)

#### **AuthContext.tsx**
**Purpose**: Global authentication state

**State**:
```typescript
{
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
```

**Methods**:
```typescript
{
  login(user: User, token: string): void;
  logout(): void;
}
```

**Storage**:
- Uses `localStorage` for persistence
- Auto-loads on mount

**Usage**:
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

---

### Services (`src/services/`)

#### **api.ts**
**Purpose**: Backend API integration

**Axios Instance**:
- Base URL from environment
- JWT token interceptor (request)
- 401 error interceptor (response)

**Exports**:
- `authAPI`: register, login, getCurrentUser
- `resumeAPI`: upload, get
- `interviewAPI`: create, getMyInterviews, getInterviewById, submitAnswer, completeInterview
- `recruiterAPI`: getAllCompletedInterviews, getInterviewWithDetails

**Type Definitions**:
- User, Resume, Interview, Question, Answer, AIEvaluation
- AuthResponse

---

## 🎯 Component Communication

### Data Flow

```
App.tsx (Router)
  ├─ AuthProvider (Context)
  │   └─ User state, login/logout functions
  │
  ├─ LoginPage / RegisterPage
  │   └─ Calls authAPI → Updates AuthContext
  │
  ├─ DashboardLayout (Protected)
  │   ├─ Reads AuthContext (user info)
  │   └─ Renders child routes via <Outlet />
  │
  ├─ CandidateDashboard
  │   ├─ Fetches data via API
  │   └─ Navigates to InterviewSession
  │
  ├─ InterviewSession
  │   ├─ Fetches interview data
  │   ├─ Uses CountdownTimer component
  │   ├─ Submits answers via API
  │   └─ Navigates to InterviewResults
  │
  └─ RecruiterDashboard
      ├─ Fetches completed interviews
      └─ Navigates to CandidateDetailView
```

### State Management Strategy

1. **Global State**: AuthContext for user/token
2. **Local State**: Component-level for UI and data
3. **API State**: Fetched on mount, stored in component state
4. **No Redux**: Simplified architecture using Context API

---

## 🔄 Key Patterns

### 1. **Protected Routes**
```typescript
<ProtectedRoute requiredRole="candidate">
  <CandidateDashboard />
</ProtectedRoute>
```

### 2. **Layout Pattern**
```typescript
<DashboardLayout>
  <Outlet /> {/* Nested routes render here */}
</DashboardLayout>
```

### 3. **API Pattern**
```typescript
// In component:
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await someAPI.method();
      setData(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### 4. **Form Submission Pattern**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await api.method(data);
    toast.success('Success!');
    navigate('/somewhere');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 🎨 Styling Approach

### TailwindCSS Utility Classes

**Common Patterns**:
```css
/* Cards */
.bg-white .rounded-xl .shadow-sm .border .p-6

/* Buttons */
.bg-blue-600 .text-white .px-6 .py-3 .rounded-lg .hover:bg-blue-700

/* Inputs */
.w-full .px-4 .py-3 .border .rounded-lg .focus:ring-2

/* Layout */
.max-w-7xl .mx-auto .px-4 .space-y-6
```

**Responsive Design**:
- Mobile-first
- Breakpoints: `md:`, `lg:`
- Grid: `grid .grid-cols-1 .md:grid-cols-2`

---

## 🚀 Performance Considerations

1. **Code Splitting**: React Router handles route-based splitting
2. **Lazy Loading**: Can add `React.lazy()` for pages
3. **Memoization**: Use `useMemo` for expensive calculations
4. **Debouncing**: Can add for search/filter inputs
5. **Optimized Re-renders**: Context split by concern

---

## 🧪 Testing Strategy (Future)

**Unit Tests**:
- Individual components
- Utility functions
- API service functions

**Integration Tests**:
- User flows
- Protected routes
- API integration

**E2E Tests**:
- Complete user journeys
- Interview flow
- Recruiter flow

---

## 📝 Best Practices Used

1. ✅ TypeScript for type safety
2. ✅ Functional components with hooks
3. ✅ Custom hooks for reusable logic
4. ✅ Error boundaries via try-catch
5. ✅ Loading and error states
6. ✅ Responsive design
7. ✅ Accessibility (semantic HTML)
8. ✅ Clean code organization

---

**Component architecture designed for scalability and maintainability** 🎯
