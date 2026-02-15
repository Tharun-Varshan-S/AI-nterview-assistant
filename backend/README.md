# 🚀 AI Interview Platform - Backend

Complete, production-ready backend for an AI-powered technical interview platform.

## ⚡ Quick Start (3 Steps)

### 1. Install & Setup
```bash
cd backend
npm install
cp .env.example .env
```

### 2. Configure MongoDB
Edit `.env` and add your MongoDB URI:
```env
MONGODB_URI=mongodb://localhost:27017/interview-assistant
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/interview-assistant
```

### 3. Run Server
```bash
npm run dev
```

✅ Server running on `http://localhost:5000/api`

---

## 📋 Prerequisites

- Node.js v14+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - free)
- npm or yarn

---

## 🎯 Features

### ✅ Authentication
- User registration with role-based access (candidate/recruiter)
- JWT token login (30-day expiration)
- Password hashing with bcryptjs
- Protected routes & authorization

### ✅ Resume Management
- PDF upload (max 5MB, PDF only)
- Automatic text extraction
- Resume storage in MongoDB
- Update/retrieve resume

### ✅ Interview System
- Create interview sessions
- 6 auto-generated questions (2 easy, 2 medium, 2 hard)
- Submit answers
- Track interview status (in-progress/completed)
- Score aggregation

### ✅ AI Evaluation (Gemini API)
- Real-time answer evaluation
- Score (0-10), technical accuracy, clarity, depth
- Identify strengths, weaknesses, improvements
- Context-aware using resume text
- JSON response format

### ✅ Recruiter Dashboard
- View all completed interviews
- Access candidate details
- View full Q&A with scores
- Resume access

---

## 📦 Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |
| pdf-parse | PDF text extraction |
| Gemini API | AI evaluation |

---

## 🏗️ Project Structure

```
backend/
├── config/              # Configuration
│   ├── db.js           # MongoDB connection
│   └── multer.js       # File upload config
├── models/             # Database schemas
│   ├── User.js         # User model
│   ├── Resume.js       # Resume model
│   └── Interview.js    # Interview model
├── controllers/        # Business logic
│   ├── authController.js
│   ├── resumeController.js
│   └── interviewController.js
├── routes/            # API endpoints
│   ├── auth.js
│   ├── resume.js
│   └── interview.js
├── middleware/        # Request processing
│   ├── auth.js        # JWT & authorization
│   └── errorHandler.js # Error handling
├── services/          # Reusable logic
│   ├── pdfService.js
│   ├── geminiService.js
│   └── questionService.js
├── uploads/           # PDF storage (git-ignored)
└── server.js          # Express app entry
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          Register user
POST   /api/auth/login             Login user
GET    /api/auth/me                Get current user (Protected)
```

### Resume (Candidate)
```
POST   /api/resume/upload          Upload PDF (Protected)
GET    /api/resume                 Get resume (Protected)
```

### Interview (Candidate)
```
POST   /api/interview/create       Create interview (Protected)
GET    /api/interview/my-interviews Get all interviews (Protected)
GET    /api/interview/:id          Get interview details (Protected)
POST   /api/interview/:id/submit-answer  Submit answer (Protected)
PUT    /api/interview/:id/complete Complete interview (Protected)
```

### Interview (Recruiter)
```
GET    /api/recruiter/all-completed     Get completed interviews (Protected)
GET    /api/recruiter/:id               Get interview with details (Protected)
```

---

## 📋 Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interview-assistant
JWT_SECRET=your_jwt_secret_key_change_this_in_production
GEMINI_API_KEY=AIzaSyB8LiszMBcZiLkHuwV_sYeLwI85Ha41E0Y
NODE_ENV=development
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview-assistant?retryWrites=true&w=majority
```

---

## 💾 Database Setup

### Option A: Local MongoDB

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download from https://www.mongodb.com/try/download/community and run installer.

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create M0 cluster
4. Setup database user
5. Allow network access
6. Get connection string
7. Add to `.env`

---

## 🚀 Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

**Check if running:**
```bash
curl http://localhost:5000/api/health
# Response: {"success": true, "message": "Server is running"}
```

---

## 🧪 Testing APIs

### 1. Register Candidate
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "candidate"
  }'
```

**Response:** `{success: true, token: "...", user: {...}}`

Save the token for next requests.

### 2. Create Interview
```bash
curl -X POST http://localhost:5000/api/interview/create \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** Interview with 6 questions

### 3. Submit Answer
```bash
curl -X POST http://localhost:5000/api/interview/INTERVIEW_ID/submit-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "QUESTION_ID",
    "response": "Your detailed answer here"
  }'
```

**Response:** Answer with AI evaluation (score, feedback, etc.)

### 4. Complete Interview
```bash
curl -X PUT http://localhost:5000/api/interview/INTERVIEW_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Register Recruiter
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@recruiter.com",
    "password": "password123",
    "role": "recruiter"
  }'
```

### 6. Get Completed Interviews (Recruiter)
```bash
curl -X GET http://localhost:5000/api/recruiter/all-completed \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

---

## 📊 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'candidate' | 'recruiter',
  createdAt: Date
}
```

### Resume
```javascript
{
  userId: ObjectId,
  filePath: String,
  fileName: String,
  extractedText: String,
  createdAt: Date
}
```

### Interview
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

---

## 🔐 Security Features

- ✅ JWT authentication (30-day expiration)
- ✅ Password hashing (bcryptjs, 10 salt rounds)
- ✅ Role-based authorization
- ✅ Protected routes
- ✅ PDF validation (MIME type, file size)
- ✅ Input validation
- ✅ Error handling (no sensitive info leaked)

---

## 📄 Response Format

All endpoints return:

```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": { ... }
}
```

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Ensure MongoDB is running; check MONGODB_URI in .env |
| Port 5000 in use | Change PORT in .env or: `lsof -i :5000` then kill process |
| PDF upload fails | Ensure file is PDF, under 5MB, `/uploads` directory exists |
| Gemini API error | Verify API key in .env |
| JWT token invalid | Include `Authorization: Bearer <token>` header |
| "Cannot find module" | Run `npm install` again |

---

## 📚 File Uploads

Uploaded PDFs go to `/uploads` directory (git-ignored).

**Max size:** 5MB  
**Allowed format:** PDF only

---

## 🎯 AI Evaluation Workflow

1. Candidate answers question
2. Backend sends to Gemini API with:
   - Question text
   - Candidate's answer
   - Candidate's resume (context)
3. Gemini evaluates and returns JSON:
   ```json
   {
     "score": 8,
     "technicalAccuracy": "Good understanding",
     "clarity": "Clear explanation",
     "depth": "Good depth",
     "strengths": ["..."],
     "weaknesses": ["..."],
     "improvements": ["..."]
   }
   ```
4. Backend saves evaluation to database
5. Scores aggregated (total & average)

---

## 🧪 Postman Testing

Import `POSTMAN_COLLECTION.json` into Postman for ready-to-use API requests.

---

## 📝 Example Workflow

```
1. Candidate registers
   → Login
   → Upload resume (PDF)
   → Create interview
     → View 6 questions
       → Answer Q1 → AI evaluates → Score 8
       → Answer Q2 → AI evaluates → Score 7
       → Answer Q3 → AI evaluates → Score 9
       → ... (6 questions total)
     → Complete interview
       
2. Recruiter logs in
   → View all completed interviews
   → Click on interview
   → See candidate profile
   → View resume
   → See Q&A with scores
   → Make hiring decision ✅
```

---

## 🔄 Error Handling

Errors are centralized in `middleware/errorHandler.js`:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

---

## 💡 Key Features

✅ **Modular Architecture** - Clean separation of concerns  
✅ **Error Handling** - Centralized, consistent error responses  
✅ **Async/Await** - Modern JavaScript patterns  
✅ **Input Validation** - Request validation at controller level  
✅ **Security** - JWT, password hashing, role-based access  
✅ **File Handling** - Safe PDF uploads with validation  
✅ **API Integration** - Seamless Gemini API integration  
✅ **Database** - MongoDB with Mongoose ODM  
✅ **Production-Ready** - Clean, scalable code  

---

## 🎓 Learning Resources

- Express.js: https://expressjs.com
- MongoDB: https://docs.mongodb.com
- JWT: https://jwt.io
- Gemini API: https://makersuite.google.com/app

---

## 📞 API Base URL

```
http://localhost:5000/api
```

---

## 🚀 Deployment Ready

This backend is ready for production deployment on:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS
- Google Cloud

Just configure environment variables and MongoDB connection string.

---

## ©️ Notes

- Passwords are hashed and never stored in plain text
- JWT tokens expire after 30 days
- All endpoints require authentication (except register/login)
- Role-based access control enforced
- AI evaluations are generated on-demand

---

## 🎉 Ready to Go!

Your backend is fully functional. Start testing with curl or Postman!

Questions? Check logs for debugging:
```bash
npm run dev
# Watch terminal for detailed logs
```
