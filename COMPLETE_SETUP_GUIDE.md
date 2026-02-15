# 🚀 AI Interview Platform - Complete Setup Guide

## 📋 Overview

This is a complete full-stack AI-powered interview platform with:
- **Backend**: Node.js + Express + MongoDB + Gemini AI
- **Frontend**: React + TypeScript + Vite + TailwindCSS

## 🏗️ Architecture

```
interview-assistant/
├── backend/              # Node.js Express API
│   ├── config/          # Database & Multer configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # AI & business logic
│   └── uploads/         # Resume uploads
│
└── frontend/            # React TypeScript SPA
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── context/     # React Context (Auth)
    │   ├── pages/       # Main application pages
    │   └── services/    # API integration
    └── public/
```

## ⚙️ Prerequisites

- **Node.js** 18+ 
- **MongoDB** 4.4+
- **npm** or **yarn**
- **Gemini API Key** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

## 🔧 Backend Setup

### 1. Navigate to Backend

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/interview-assistant

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Service
GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**OR MongoDB Atlas:**
- Use your MongoDB Atlas connection string in `MONGO_URI`

### 5. Start Backend Server

```bash
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB connected successfully
```

## 🎨 Frontend Setup

### 1. Navigate to Frontend

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env` file (or use existing):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start Development Server

```bash
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## 🧪 Testing the Application

### 1. Access the Application

Open browser: `http://localhost:5173`

### 2. Create Accounts

**Create a Candidate Account:**
1. Click "Sign up"
2. Fill in details
3. Select "Candidate" role
4. Register

**Create a Recruiter Account:**
1. Click "Sign up"
2. Fill in details
3. Select "Recruiter" role
4. Register

### 3. Test Candidate Flow

1. **Login as Candidate**
2. **Upload Resume** (PDF file)
3. **Start Interview**
4. **Answer Questions** (3 minutes per question)
5. **Complete Interview**
6. **View Results** with AI evaluation

### 4. Test Recruiter Flow

1. **Login as Recruiter**
2. **View Candidates** on dashboard
3. **Filter by Performance** (High/Medium/Low)
4. **View Candidate Details** with full AI analysis
5. **Download Resume**

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Resume
- `POST /api/resume/upload` - Upload resume (PDF)
- `GET /api/resume` - Get user's resume

### Interview (Candidate)
- `POST /api/interview/create` - Create interview session
- `GET /api/interview/my-interviews` - Get user's interviews
- `GET /api/interview/:id` - Get interview by ID
- `POST /api/interview/:id/submit-answer` - Submit answer
- `PUT /api/interview/:id/complete` - Complete interview

### Interview (Recruiter)
- `GET /api/interview/recruiter/all-completed` - Get all completed interviews
- `GET /api/interview/recruiter/:id` - Get interview with resume

## 🎯 Key Features

### AI Evaluation System
Each answer is evaluated on:
- **Overall Score** (0-10)
- **Technical Accuracy** (0-10)
- **Clarity** (0-10)
- **Depth** (0-10)
- **Strengths** (array)
- **Weaknesses** (array)
- **Improvement Suggestions** (array)

### Interview Flow
1. Candidate uploads resume
2. System creates interview with 6 questions
3. 3-minute timer per question
4. Auto-submit on timeout
5. AI evaluates each answer
6. Comprehensive results with analytics

### Recruiter Dashboard
- View all completed interviews
- Filter by performance level
- Detailed AI score breakdown
- Resume download
- Candidate comparison

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- File upload validation
- CORS configuration
- Input sanitization

## 🎨 UI Features

### Design Elements
- Clean SaaS-style interface
- Responsive mobile-first design
- Animated countdown timer
- Loading states
- Error handling
- Toast notifications
- Difficulty badges
- Progress indicators

### User Experience
- Prevent back navigation during interview
- Auto-save functionality
- Session persistence
- Real-time feedback
- Intuitive navigation

## 📝 Sample Test Data

### Test Candidate
```
Name: John Doe
Email: candidate@test.com
Password: password123
Role: Candidate
```

### Test Recruiter
```
Name: Jane Smith
Email: recruiter@test.com
Password: password123
Role: Recruiter
```

## 🐛 Troubleshooting

### Backend Issues

**Cannot connect to MongoDB:**
```bash
# Check if MongoDB is running
mongosh

# Or check logs
tail -f /var/log/mongodb/mongod.log
```

**Port 5000 already in use:**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env
PORT=5001
```

**Gemini API errors:**
- Verify API key is correct
- Check API quota limits
- Ensure internet connection

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running on port 5000
- Check `VITE_API_BASE_URL` in frontend/.env
- Check browser console for CORS errors

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Restart TypeScript server in VSCode
Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

## 📦 Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Output in dist/ folder

# Preview production build
npm run preview
```

## 🚀 Deployment

### Backend (Node.js)
- **Platforms**: Heroku, Railway, Render, AWS EC2
- Configure environment variables
- Use MongoDB Atlas for database
- Set `NODE_ENV=production`

### Frontend (Static)
- **Platforms**: Vercel, Netlify, GitHub Pages
- Build with `npm run build`
- Deploy `dist/` folder
- Update `VITE_API_BASE_URL` to production API

## 📚 Tech Stack Details

### Backend
- **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **Gemini AI** - Answer evaluation
- **pdf-parse** - Resume text extraction

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router 6** - Routing
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Sonner** - Notifications
- **Lucide React** - Icons

## 🎓 Next Steps

1. ✅ Set up backend and frontend
2. ✅ Test core functionality
3. 📝 Customize interview questions
4. 🎨 Brand the UI
5. 🔐 Add more security features
6. 📊 Implement analytics
7. 🚀 Deploy to production

## 📞 Support

For issues:
1. Check logs (backend console, browser console)
2. Verify environment variables
3. Ensure all services are running
4. Check API connectivity

## 📄 License

ISC

---

**Built with ❤️ using modern web technologies**
