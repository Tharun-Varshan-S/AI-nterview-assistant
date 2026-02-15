# Complete Backend - Quick Start Guide

## What's Built

✅ **Authentication**
- User registration with role-based access (candidate/recruiter)
- JWT-based login
- Password hashing with bcryptjs
- Protected routes with middleware

✅ **Resume Management**
- PDF upload (max 5MB)
- Automatic text extraction using pdf-parse
- Resume storage in MongoDB

✅ **Interview System**
- Create interview sessions with 6 auto-generated questions (2 easy, 2 medium, 2 hard)
- Submit answers to questions
- Track interview status (in-progress/completed)
- Real-time AI scoring using Gemini API

✅ **AI Evaluation**
- Gemini API integration for intelligent answer evaluation
- Receives score (0-10), technical accuracy, clarity, depth
- Identifies strengths, weaknesses, and improvements
- Falls back gracefully if API fails

✅ **Recruiter Dashboard**
- View all completed interviews
- Access candidate details and resume
- View full Q&A with AI scores

## File Structure Created

```
backend/
├── config/
│   ├── db.js                  # MongoDB connection
│   └── multer.js              # PDF upload config
├── models/
│   ├── User.js                # User (name, email, password, role)
│   ├── Resume.js              # Resume (userId, filePath, extractedText)
│   └── Interview.js           # Interview & Answer schemas
├── controllers/
│   ├── authController.js      # Register, Login, Get User
│   ├── resumeController.js    # Upload, Get Resume
│   └── interviewController.js # All interview operations
├── routes/
│   ├── auth.js                # /api/auth routes
│   ├── resume.js              # /api/resume routes
│   └── interview.js           # /api/interview routes
├── middleware/
│   ├── auth.js                # JWT verification & authorization
│   └── errorHandler.js        # Centralized error handling
├── services/
│   ├── pdfService.js          # PDF text extraction
│   ├── geminiService.js       # Gemini API calls
│   └── questionService.js     # Question generation
├── uploads/                   # PDF storage (git-ignored)
├── server.js                  # Express app setup
├── package.json               # Dependencies
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── README.md                  # Full documentation
├── POSTMAN_COLLECTION.json    # Postman requests
└── QUICK_START.md            # This file
```

## 3-Step Quick Start

### Step 1: Install & Setup
```bash
# Install dependencies
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/interview-assistant
```

### Step 2: Ensure MongoDB is Running
```bash
# Check if MongoDB is running, start if needed
mongod

# Or if using MongoDB Atlas, just ensure connection string is correct in .env
```

### Step 3: Start Server
```bash
# Development (with auto-reload)
npm run dev

# Or production
npm start
```

✅ Server will run on `http://localhost:5000`

## Testing Quick Flow

### 1. Register Candidate
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "candidate"
  }'
```

### 2. Take the token and create an interview
```bash
curl -X POST http://localhost:5000/api/interview/create \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Submit an answer (the AI will evaluate it automatically)
```bash
curl -X POST http://localhost:5000/api/interview/INTERVIEW_ID/submit-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "QUESTION_ID",
    "response": "Your answer here"
  }'
```

### 4. View results with AI evaluation
```bash
curl -X GET http://localhost:5000/api/interview/INTERVIEW_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interview-assistant
JWT_SECRET=your_jwt_secret_key_change_this_in_production
GEMINI_API_KEY=AIzaSyB8LiszMBcZiLkHuwV_sYeLwI85Ha41E0Y
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` in production!

## Key Features

### ✅ Error Handling
- Centralized error middleware catches all errors
- Proper HTTP status codes
- Detailed error messages

### ✅ Security
- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with 30-day expiration
- Role-based access control
- File validation (PDF only, 5MB max)

### ✅ Performance
- Async/await throughout
- Efficient MongoDB queries
- File streaming for uploads

### ✅ Code Quality
- Clean modular structure
- Single responsibility principle
- Consistent error handling
- Production-ready code

## API Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": { ... }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to MongoDB" | Ensure MongoDB is running: `mongod` |
| "Port 5000 already in use" | Change PORT in .env or: `lsof -i :5000` |
| "PDF upload fails" | Check file is PDF, under 5MB, and uploads folder exists |
| "Gemini API error" | Verify API key in .env |
| "JWT token invalid" | Make sure to include `Authorization: Bearer <token>` header |

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Setup `.env` file with MongoDB URI
3. ✅ Start MongoDB
4. ✅ Run server: `npm run dev`
5. ✅ Test with Postman collection
6. ✅ Connect your frontend to `http://localhost:5000`

## Frontend Integration

The frontend can now connect to:
- **Base URL**: `http://localhost:5000/api`
- **All endpoints** documented in README.md
- **Authentication**: Include JWT token in `Authorization: Bearer <token>` header

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'candidate' | 'recruiter',
  createdAt: Date
}
```

### Resumes Collection
```javascript
{
  userId: ObjectId,
  filePath: String,
  fileName: String,
  extractedText: String,
  createdAt: Date
}
```

### Interviews Collection
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
    },
    evaluatedAt: Date
  }],
  totalScore: Number,
  averageScore: Number,
  createdAt: Date
}
```

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas or managed MongoDB service
- [ ] Configure CORS properly for your frontend domain
- [ ] Set up environment-specific `.env` files
- [ ] Add request logging
- [ ] Set up monitoring/error tracking
- [ ] Enable rate limiting
- [ ] Validate all file uploads
- [ ] Use HTTPS in production

---

**Everything is ready to go! 🚀**

Start with: `npm run dev`
