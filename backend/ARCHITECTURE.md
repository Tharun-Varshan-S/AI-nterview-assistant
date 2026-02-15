# Backend Architecture & Workflow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTP Requests with JWT
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      Express Server (server.js)                      │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│ │  Auth Router     │  │  Resume Router   │  │ Interview Router │  │
│ ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│ │ POST /register   │  │ POST /upload     │  │ POST /create     │  │
│ │ POST /login      │  │ GET /            │  │ POST /:id/answer │  │
│ │ GET /me          │  │                  │  │ PUT /:id/complete│  │
│ └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│         │                    │                       │              │
│         ▼                    ▼                       ▼              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│   │ Auth         │  │ Resume       │  │ Interview            │   │
│   │ Controller   │  │ Controller   │  │ Controller           │   │
│   └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                    │                       │              │
│         ▼                    ▼                       ▼              │
│    ┌─────────────────────────────────────────────────────────┐    │
│    │              Services Layer                             │    │
│    ├─────────────────────────────────────────────────────────┤    │
│    │ • pdfService (Extract text)                             │    │
│    │ • geminiService (AI Evaluation)                         │    │
│    │ • questionService (Generate Q&A)                        │    │
│    └─────────────────────────────────────────────────────────┘    │
│                             │                                      │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ MongoDB  │   │  Gemini  │   │  File Upload │
        │ Database │   │   API    │   │   (Multer)   │
        └──────────┘   └──────────┘   └──────────────┘
```

## Data Flow Diagram

### 1. User Registration & Login
```
User Input
    ↓
POST /auth/register → authController.register()
    ↓
Hash password (bcryptjs) → Save to MongoDB
    ↓
Generate JWT token
    ↓
Return token + user data
```

### 2. Resume Upload
```
File Upload (PDF)
    ↓
POST /resume/upload → resumeController.uploadResume()
    ↓
Validate: PDF only, ≤5MB
    ↓
Multer saves file to /uploads
    ↓
Extract text using pdf-parse
    ↓
Save to MongoDB (Resume model)
    ↓
Return success + resume data
```

### 3. Interview Flow
```
POST /interview/create
    ↓
questionService.generatePlaceholderQuestions()
    ↓
Returns 6 questions (2 easy, 2 medium, 2 hard)
    ↓
Store in Interview document
    ↓
Return interview with questions
```

### 4. Answer Evaluation (Key Feature)
```
POST /interview/:id/submit-answer
    ↓
Validate answer & question
    ↓
Get candidate's resume text from MongoDB
    ↓
Send to Gemini API:
  • Question
  • Candidate answer
  • Resume context
    ↓
Gemini returns JSON evaluation:
  {
    score: 0-10,
    technicalAccuracy,
    clarity,
    depth,
    strengths[],
    weaknesses[],
    improvements[]
  }
    ↓
Store evaluation in Interview.answers
    ↓
Calculate totalScore and averageScore
    ↓
Return answer with evaluation
```

### 5. Recruiter Dashboard
```
GET /recruiter/all-completed
    ↓
Query completed interviews from MongoDB
    ↓
Populate user data (candidate info)
    ↓
Return all interviews with scores
    ↓
    
GET /recruiter/:id
    ↓
Get specific interview with full details
    ↓
Include candidate resume
    ↓
Include all Q&A with evaluations
```

## Request/Response Cycle with Example

### Example: Submit Answer

**Request:**
```bash
POST /api/interview/507f1f77bcf86cd799439011/submit-answer
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "questionId": "q123",
  "response": "A closure is a function that has access to variables from its own scope, the outer scope, and the global scope..."
}
```

**Processing:**
1. Auth middleware verifies JWT token
2. Auth middleware checks role is "candidate"
3. Controller validates input
4. Retrieves interview from DB
5. Retrieves resume text from DB
6. Calls `geminiService.evaluateAnswerWithGemini()`
7. Gemini API processes and returns evaluation
8. Controller saves answer with evaluation to DB
9. Recalculates interview scores

**Response:**
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "answer": {
    "questionId": "q123",
    "question": "What is a closure?",
    "response": "A closure is a function that has access to variables from its own scope...",
    "aiEvaluation": {
      "score": 9,
      "technicalAccuracy": "Excellent explanation of closure mechanics",
      "clarity": "Very clear and well-structured",
      "depth": "Great depth with proper JavaScript context",
      "strengths": [
        "Accurate technical definition",
        "Clear explanation of scoping"
      ],
      "weaknesses": [
        "Could mention practical examples"
      ],
      "improvements": [
        "Show a practical code example"
      ]
    },
    "evaluatedAt": "2024-02-14T10:30:00Z"
  },
  "interview": {
    "id": "507f1f77bcf86cd799439011",
    "status": "in-progress",
    "totalScore": 17,
    "averageScore": 8.5,
    "answers": [...] // All submitted answers
  }
}
```

## Middleware Flow

```
Request
    ↓
Body Parser (JSON)
    ↓
Auth Middleware (JWT verification)
    ├─ Check token exists
    ├─ Verify signature
    └─ Extract user data
    ↓
Authorization Middleware (Role check)
    ├─ For protected routes
    └─ Check user.role
    ↓
Route Handler (Controller)
    ├─ Business logic
    └─ Service calls
    ↓
Response
    ↓
[IF ERROR] → Error Handler Middleware
    ├─ Log error
    ├─ Format response
    └─ Send with proper status
```

## Error Handling Flow

```
Any Error in Route/Controller
        ↓
next(error) called
        ↓
Error Handler Middleware Catches It
        ├─ Check error type
        ├─ Set appropriate status code
        ├─ Format error message
        └─ Log to console
        ↓
Send JSON response:
{
  "success": false,
  "message": "Error description"
}
```

## Security Layers

```
Request Security:
┌─────────────────────────────────────────────────┐
│ 1. CORS checking                                 │
│ 2. Rate limiting (can be added)                 │
│ 3. Request validation                           │
│ 4. JWT verification                             │
│ 5. Role-based authorization                     │
│ 6. File upload validation (PDF, 5MB)            │
│ 7. SQL/NoSQL injection prevention (Mongoose)   │
└─────────────────────────────────────────────────┘

Data Security:
┌─────────────────────────────────────────────────┐
│ 1. Passwords hashed with bcrypt (salt rounds: 10)│
│ 2. JWT tokens signed with secret                 │
│ 3. Tokens expire in 30 days                      │
│ 4. Sensitive data not included in responses     │
│ 5. File paths sanitized                          │
└─────────────────────────────────────────────────┘
```

## Database Relationships

```
User (1) ──→ (Many) Resume
User (1) ──→ (Many) Interview
Interview (1) ──→ (Many) Answer

User
├─ _id (ObjectId)
├─ name
├─ email (unique)
├─ password (hashed)
├─ role
└─ createdAt

Resume
├─ _id (ObjectId)
├─ userId (ref: User)
├─ filePath
├─ fileName
├─ extractedText
└─ createdAt

Interview
├─ _id (ObjectId)
├─ userId (ref: User)
├─ questions[] (array of objects)
├─ answers[] (array of nested objects)
├─ status
├─ totalScore
├─ averageScore
└─ createdAt

Answer (embedded in Interview)
├─ questionId
├─ question
├─ response
├─ aiEvaluation (object with score, analysis, etc)
└─ evaluatedAt
```

## Environment Variables Explained

```env
PORT=5000
  → Server port

MONGODB_URI=mongodb://localhost:27017/interview-assistant
  → MongoDB connection string (local or Atlas)

JWT_SECRET=your_jwt_secret_key_change_this_in_production
  → Secret key for signing JWT tokens (MUST BE STRONG & UNIQUE)

GEMINI_API_KEY=AIzaSyB8LiszMBcZiLkHuwV_sYeLwI85Ha41E0Y
  → Google Gemini API key for AI evaluation

NODE_ENV=development
  → Environment mode (development/production)
```

## File Organization Principles

```
config/          → Configuration (DB, Multer)
models/          → MongoDB schemas
controllers/     → Business logic & request handling
routes/          → API endpoints
middleware/      → Request processing (Auth, Error)
services/        → Reusable logic (PDF, Gemini, Questions)
uploads/         → Uploaded files (git-ignored)
server.js        → Express app entry point
```

## Performance Considerations

- ✅ Async/await prevents blocking
- ✅ Mongoose indexes on frequently queried fields (email, userId)
- ✅ JWT verification is fast
- ✅ PDF extraction happens once during upload
- ✅ Gemini API calls happen only on submit (not blocking)
- ✅ File streaming for large uploads

## Scalability Notes

For production scaling:
- Add caching layer (Redis) for frequently accessed data
- Implement request rate limiting
- Add database connection pooling
- Use CDN for PDF files
- Implement job queue (Bull) for async Gemini calls
- Add API monitoring and logging
- Use message queue for real-time updates
