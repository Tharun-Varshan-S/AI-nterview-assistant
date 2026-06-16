# 🚀 AI Interview Platform - Full Stack Application

Complete AI-powered technical interview platform with backend (Node.js/Express/MongoDB) and frontend (React/TypeScript).

---

## ✨ Features

### For Candidates
- 📝 Register & Login
- 📄 Upload Resume (PDF)
- 🎯 Take AI-powered interviews
- 📊 Get instant AI feedback on answers
- 🏆 View scores and evaluations

### For Recruiters
- 👀 View all completed interviews
- 📈 Access candidate details & resumes
- 🔍 Review Q&A with AI scores
- 📊 Make data-driven hiring decisions

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **pdf-parse** - PDF text extraction
- **Gemini API** - AI evaluation

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Sonner** - Toast notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd interview-assistant
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI (already configured!)

# Start backend
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 3. Frontend Setup
```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Setup environment
cp .env.example .env

# Start frontend
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

---

## 📋 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_url
JWT_SECRET=your_jwt_secret_key_change_this_in_production
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🎯 Complete Workflow

### 1. Candidate Flow
```
Register/Login
    ↓
Upload Resume (PDF)
    ↓
Create Interview
    ↓
Answer 6 AI-generated questions
    ↓
Get instant AI evaluation for each answer
    ↓
Complete interview
    ↓
View total score & feedback
```

### 2. Recruiter Flow
```
Register/Login as Recruiter
    ↓
View Dashboard (All completed interviews)
    ↓
Click on candidate
    ↓
View resume + Q&A + AI scores
    ↓
Make hiring decision
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register          Register user
POST   /api/auth/login             Login user
GET    /api/auth/me                Get current user
```

### Resume (Candidate)
```
POST   /api/resume/upload          Upload PDF resume
GET    /api/resume                 Get resume
```

### Interview (Candidate)
```
POST   /api/interview/create       Create interview
GET    /api/interview/my-interviews Get all interviews
GET    /api/interview/:id          Get interview details
POST   /api/interview/:id/submit-answer  Submit answer
PUT    /api/interview/:id/complete Complete interview
```

### Interview (Recruiter)
```
GET    /api/interview/recruiter/all-completed      Get completed interviews
GET    /api/interview/recruiter/:id                Get interview with details
```

---

## 🧪 Testing the Application

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Open Browser
Navigate to `http://localhost:5173`

### 3. Test Candidate Flow
1. Click "Sign Up"
2. Enter details, select "Candidate"
3. Upload a PDF resume
4. Create new interview
5. Answer questions
6. View AI scores

### 4. Test Recruiter Flow
1. Logout
2. Register new account as "Recruiter"
3. View dashboard
4. Click on completed interview
5. Review candidate details

---

## 🔐 Security Features

- ✅ JWT authentication (30-day expiration)
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Protected routes
- ✅ PDF validation (MIME type, 5MB limit)
- ✅ Input validation
- ✅ Error handling

---

## 📊 Database Schema

### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'candidate' | 'recruiter',
  createdAt: Date
}
```

### Resumes
```javascript
{
  userId: ObjectId,
  filePath: String,
  fileName: String,
  extractedText: String,
  createdAt: Date
}
```

### Interviews
```javascript
{
  userId: ObjectId,
  status: 'in-progress' | 'completed',
  questions: [{
    id: String,
    question: String,
    difficulty: 'easy' | 'medium' | 'hard'
  }],
  answers: [{
    questionId: String,
    question: String,
    response: String,
    aiEvaluation: {
      score: Number (0-10),
      technicalAccuracy: String,
      clarity: String,
      depth: String,
      strengths: [String],
      weaknesses: [String],
      improvements: [String]
    }
  }],
  totalScore: Number,
  averageScore: Number,
  createdAt: Date
}
```

---

## 🎨 Frontend Features

- ✅ **Authentication** - Login/Register with role selection
- ✅ **Protected Routes** - Auto-redirect to login
- ✅ **State Management** - Redux Toolkit with persist
- ✅ **API Integration** - Axios with interceptors
- ✅ **Toast Notifications** - Success/error messages
- ✅ **Responsive Design** - Mobile-friendly
- ✅ **Dark Mode** - Theme toggle
- ✅ **User Context** - Display current user info

---

## 🔧 Project Structure

```
interview-assistant/
├── backend/
│   ├── config/              # DB & Multer config
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth & error handling
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── services/            # PDF, Gemini, Questions
│   ├── uploads/             # PDF storage
│   ├── server.js            # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API service layer
│   │   ├── slices/          # Redux slices
│   │   ├── store/           # Redux store
│   │   ├── ui/              # Layout components
│   │   ├── utils/           # Utilities
│   │   ├── views/           # Page components
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json
│   └── .env.example
│
└── README.md                # This file
```

---

## ⚠️ Troubleshooting

### Backend Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Check MONGODB_URI in .env |
| Port 5000 in use | Change PORT in .env or kill process |
| PDF upload fails | Ensure file is PDF, under 5MB |
| Gemini API error | Verify API key in .env |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Cannot connect to backend | Ensure backend is running on port 5000 |
| Login fails | Check backend logs for errors |
| CORS error | Ensure CORS is enabled in backend |
| npm install fails | Use `npm install --legacy-peer-deps` |

---

## 📝 Development Tips

### Backend Development
```bash
cd backend
npm run dev    # Auto-restart on changes
```

### Frontend Development
```bash
cd frontend
npm run dev    # Hot reload enabled
```

### Check Both Servers
```bash
# Backend health check
curl http://localhost:5000/api/health

# Frontend
Open http://localhost:5173 in browser
```

---

## 🚀 Deployment

### Backend (Railway, Render, Heroku)
1. Push to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy

### Frontend (Vercel, Netlify)
1. Push to GitHub
2. Connect to platform
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variable: `VITE_API_BASE_URL`
6. Deploy

---

## 🎯 Key Integration Points

### 1. API Service Layer
Located in `frontend/src/services/api.ts`
- Axios instance with base URL
- Auto token injection
- Response/error interceptors
- Type-safe API methods

### 2. Authentication Flow
- Login/Register → Get JWT token
- Store in localStorage + Redux
- Auto-attach to all requests
- Auto-redirect on 401

### 3. State Management
- Redux Toolkit for global state
- Redux Persist for persistence
- Auth slice for user/token
- Interview slice for interview data

### 4. Protected Routes
- Check token in localStorage
- Redirect to /login if not authenticated
- Role-based navigation (candidate/recruiter)

---

## 📚 API Response Format

All API responses follow this structure:

```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": { ... },
  "token": "..." // (for auth endpoints)
}
```

---

## 🎓 Learn More

- [Express.js Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [React Docs](https://react.dev)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [Vite Docs](https://vitejs.dev)
- [Gemini API Docs](https://ai.google.dev)

---

## ✅ Production Checklist

### Backend
- [ ] Change JWT_SECRET to strong random string
- [ ] Use MongoDB Atlas in production
- [ ] Enable rate limiting
- [ ] Add request logging
- [ ] Set up error tracking (Sentry)
- [ ] Enable HTTPS
- [ ] Validate all inputs
- [ ] Add API monitoring

### Frontend
- [ ] Update API base URL for production
- [ ] Enable production build optimizations
- [ ] Add Google Analytics (optional)
- [ ] Test on multiple devices
- [ ] Optimize images/assets
- [ ] Enable service worker (PWA)

---

## 🎉 You're All Set!

Your full-stack AI Interview Platform is ready to use!

**To run:**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open: `http://localhost:5173`

**First user:** Register as candidate or recruiter and start interviewing! 🚀

---

## 📞 Support

For issues or questions:
1. Check backend logs
2. Check frontend console
3. Review API responses
4. Check MongoDB connection

---

**Built with ❤️ using Node.js, React, MongoDB, and AI**
