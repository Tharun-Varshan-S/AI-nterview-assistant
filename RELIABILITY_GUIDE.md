# Reliability & Error Handling Guide

## Overview
This document covers all improvements made to handle edge cases and failures across the AI Interview Platform.

---

## Backend Improvements

### 1. Centralized Error Handler (`middleware/errorHandler.js`)
Enhanced error handling middleware that catches and formats all errors consistently.

**Handles:**
- MongoDB validation errors
- Mongoose CastError (bad ObjectId)
- Duplicate key errors (11000)
- JWT errors (invalid, expired)
- Multer file upload errors (size, file type)
- Network timeouts
- Gemini API specific errors

**Response Format:**
```json
{
  "success": false,
  "message": "User-friendly error message",
  "errorCode": "ERROR_TYPE_CODE",
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 2. Gemini API Retry Logic (`services/geminiService.js`)
Automatic retry mechanism with exponential backoff for Gemini API calls.

**Configuration:**
- Max retries: 3 attempts
- Initial delay: 1 second
- Backoff multiplier: 2x (1s → 2s → 4s)
- Max delay: 10 seconds

**Retryable Errors:**
- Network errors (ECONNREFUSED, ECONNRESET, ETIMEDOUT)
- Server errors (5xx)
- Rate limit errors (429)
- Request timeouts (ECONNABORTED)

**Non-Retryable Errors:**
- Authentication errors (401, 403)
- Bad requests (400)
- Not found (404)

**Example Flow:**
```
Attempt 1 (fail) → Wait 1s 
→ Attempt 2 (fail) → Wait 2s 
→ Attempt 3 (fail) → Wait 4s 
→ Attempt 4 (success or final error)
```

### 3. File Upload Validation (`config/multer.js`)
Enhanced multer configuration with proper constraints.

**Limits:**
- Max file size: 5MB
- File types: PDF only
- Max files: 1 at a time

**Error Messages:**
- File size error: "File is too large. Maximum size is 5MB"
- File type error: "Only PDF files are allowed"
- Multiple files error: "Too many files uploaded"

### 4. Resume Parsing Error Handling (`controllers/resumeController.js`)
Graceful handling of PDF parsing failures.

**Validation Steps:**
1. Check file exists
2. Extract text from PDF
3. Validate extracted text is not empty
4. Check resume doesn't already exist
5. Save or update resume

**Error Handling:**
- Empty PDF detection: "Resume appears empty"
- Parse failure: "Failed to parse resume. Please ensure it's a valid PDF file."
- Database errors: Pass to error handler

### 5. Logging Utility (`utils/logger.js`)
Structured logging across the application.

**Log Levels:**
- `logger.error(message, error)` - Always shown, includes stack trace
- `logger.warn(message, extra)` - Warning messages with context
- `logger.info(message, data)` - Important events
- `logger.debug(message, data)` - Dev environment only
- `logger.apiRequest(method, path, statusCode, duration)` - API request logging
- `logger.gemini(message, data)` - Gemini API specific logging

**Example:**
```javascript
logger.error('Resume upload error', pdfError);
logger.warn(`Gemini API Error: ${message}`);
logger.info('✅ Interview evaluation completed', { overallScore });
```

### 6. Async Error Handler (`utils/asyncHandler.js`)
Wrapper to eliminate try-catch boilerplate in route handlers.

**Usage:**
```javascript
router.post('/upload', asyncHandler(uploadResume));
```

Instead of:
```javascript
exports.uploadResume = async (req, res, next) => {
  try { ... } catch (error) { next(error); }
}
```

### 7. Custom Error Class (`utils/AppError.js`)
Standardized error format for consistent error handling.

**Usage:**
```javascript
throw new AppError('User-friendly message', 400, 'VALIDATION_ERROR');
```

---

## Frontend Improvements

### 1. Error Boundary Component (`components/ErrorBoundary.tsx`)
React error boundary that catches and displays component errors.

**Features:**
- Catches all React render errors
- Shows user-friendly error message
- Provides "Try Again" button
- Tracks error count
- Safe navigation to home or retry

**Wrapped in `main.tsx`:**
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. Error UI Components (`components/ErrorUI.tsx`)
Reusable error UI components for consistent error display.

**Components:**
- `ErrorAlert` - Inline error messages with optional retry
- `EmptyState` - State placeholder with call-to-action
- `LoadingError` - Loading failure state with retry

**Usage:**
```tsx
<ErrorAlert 
  message="Upload failed"
  description="Please check your file and try again"
  onRetry={() => handleRetry()}
  isNetworkError={true}
/>
```

### 3. API Retry Mechanism (`services/api.ts`)
Automatic retry logic with exponential backoff for failed API requests.

**Configuration:**
- Max retries: 3 attempts
- Initial delay: 1 second (1s → 2s → 4s)
- Retryable status codes: 408, 429, 500, 502, 503, 504
- Retryable error codes: ECONNABORTED, ECONNRESET, ETIMEDOUT, ERR_NETWORK

**Retry Logic:**
- Only retries GET and POST (not DELETE)
- Uses exponential backoff
- Logs retry attempts
- Skips 401 errors (auth handled separately)

**Example:**
```
POST request fails → Wait 1s → Retry
Retry fails → Wait 2s → Retry
Retry2 fails → Wait 4s → Retry
Retry3 fails → Show error to user
Success on any attempt → Return response
```

### 4. Interview State Persistence (`utils/interviewStateStorage.ts`)
Save and restore interview state from localStorage to handle page refresh.

**Features:**
- Auto-saves interview state after each question
- Restores state on page refresh
- Detects stale state (>30 min)
- Clears state after completion

**Usage:**
```typescript
// Save state
interviewStateStorage.saveState(interviewId, {
  currentQuestionIndex,
  answers
});

// Load state
const state = interviewStateStorage.loadState(interviewId);

// Check if stale
if (interviewStateStorage.isStateStale(interviewId)) {
  // Don't use stale state
}

// Clear after completion
interviewStateStorage.clearState(interviewId);
```

### 5. File Validation Utility (`utils/fileValidation.ts`)
Client-side file validation before upload.

**Validations:**
- File size (max 5MB)
- File type (PDF only)
- File extension (.pdf)
- File name length (max 255 chars)

**Usage:**
```typescript
const validation = validateFile(file);
if (!validation.valid) {
  toast.error(validation.error);
  return;
}
```

### 6. Enhanced Interview Session (`pages/InterviewSession.tsx`)
Improved reliability during interview sessions.

**Features:**
- Auto-saves state after each submission
- Restores state on refresh
- Shows "Interview Restored" banner
- Prevents double submissions
- Graceful Gemini timeout handling
- Updated tips about state persistence

**Restoration Flow:**
1. Page refreshes during interview
2. Loads interview data from server
3. Checks localStorage for saved state
4. If valid state exists → Restore to that point
5. Shows notification banner
6. Continues interview

### 7. Enhanced Candidate Dashboard (`pages/CandidateDashboard.tsx`)
Improved resume upload with validation and retry.

**Features:**
- File size/type validation before upload
- User-friendly error messages
- Auto-retry on network/server errors (2 retries)
- Retry button if upload fails
- Shows retry count
- Formats file size for display

**Error Handling:**
```
Validation fail → Show error message
Upload fails (network) → Auto-retry after 2s
Upload fails after retries → Show error + retry button
Upload succeeds → Clear state
```

### 8. Error Boundary Wrapping (`main.tsx`)
App wrapped with ErrorBoundary for global error protection.

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Edge Cases Handled

### 1. Refresh During Interview
- **Problem:** User loses place when refreshing during interview
- **Solution:** State saved to localStorage, restored on page load
- **User Experience:** Notification banner shows interview was restored

### 2. Double Answer Submission
- **Problem:** User can submit answer twice (normal + timeout)
- **Solution:** Guard in `handleSubmitAnswer()` prevents double execution
- **Test:** Submit answer, it auto-submits on timeout only after first completes

### 3. Gemini API Failure
- **Problem:** Timeout or service unavailable
- **Solution:** Automatic retry with exponential backoff (3 attempts)
- **User Experience:** "Evaluating your answer..." banner with spinner

### 4. Network Errors
- **Problem:** Connection drops during request
- **Solution:** API retries network errors automatically
- **Affected Requests:** GET, POST (resume upload, answer submission)
- **Not Retried:** DELETE requests

### 5. Resume Parsing Failure
- **Problem:** Invalid or corrupted PDF file
- **Solution:** 
  - Client: Validate file size/type before upload
  - Server: Try-catch on PDF extraction
  - Show specific error message
  - User can retry upload

### 6. Unauthorized Access
- **Problem:** Token expired or invalid
- **Solution:**
  - API interceptor catches 401
  - Clears localStorage
  - Redirects to login (guarded against loops)

### 7. Invalid Token
- **Problem:** Stored token is corrupted
- **Solution:** Error boundary catches JWT errors
- **Result:** User redirected to login

### 8. Large PDF Upload
- **Problem:** File exceeds 5MB
- **Solution:**
  - Multer rejects (backend)
  - Client validation shows before upload
  - Clear error message: "File is too large"

### 9. Interview Timeout
- **Problem:** User doesn't submit before 3min timer ends
- **Solution:**
  - Auto-submit handler checks `!submitting` guard
  - Prevents double submission
  - Shows "Time up! Auto-submitted" message
  - Moves to next question

---

## Testing Checklist

### Backend
- [ ] Upload invalid file type (non-PDF)
- [ ] Upload file >5MB (should reject)
- [ ] Upload empty/corrupted PDF
- [ ] Submit answer during Gemini timeout
- [ ] Kill Gemini API endpoint (test retry)
- [ ] Invalid auth token (should get 401)
- [ ] Missing required fields in request

### Frontend
- [ ] Refresh during interview (should restore)
- [ ] Submit answer twice rapidly (should block second)
- [ ] Disable network → Try upload (should show retry)
- [ ] Close browser tab during upload → Open again
- [ ] Submit answer → Timeout occurs (should not double submit)
- [ ] Error component render (Error Boundary should catch)
- [ ] File validation (large file, wrong type)

---

## Logging Output Examples

### Successful Flow
```
ℹ️  [2024-02-15T10:30:00.000Z] INFO: Resume upload started
📍 [2024-02-15T10:30:01.000Z] Uploading resume_2024.pdf
🐛 [2024-02-15T10:30:02.000Z] DEBUG: PDF text extraction successful
ℹ️  [2024-02-15T10:30:05.000Z] INFO: Answer submitted successfully
🔑 [2024-02-15T10:30:06.000Z] GEMINI: Calling Gemini API (attempt 1/4)...
ℹ️  [2024-02-15T10:30:10.000Z] INFO: Interview evaluation completed
```

### Error Flow with Retry
```
🔑 [2024-02-15T10:30:00.000Z] GEMINI: Calling Gemini API (attempt 1/4)...
❌ [2024-02-15T10:30:02.000Z] ERROR: Socket hangup
⚠️  [2024-02-15T10:30:02.000Z] WARN: Retryable error. Retrying in 1000ms...
🔑 [2024-02-15T10:30:03.000Z] GEMINI: Calling Gemini API (attempt 2/4)...
❌ [2024-02-15T10:30:05.000Z] ERROR: Socket hangup
⚠️  [2024-02-15T10:30:05.000Z] WARN: Retryable error. Retrying in 2000ms...
🔑 [2024-02-15T10:30:07.000Z] GEMINI: Calling Gemini API (attempt 3/4)...
ℹ️  [2024-02-15T10:30:11.000Z] INFO: Interview evaluation completed
```

---

## Configuration Guide

### Backend Error Handler
Located in `middleware/errorHandler.js`

**To customize error messages:**
```javascript
if (err.name === 'CastError') {
  message = 'Your custom message'; // Change this
}
```

### Gemini Retry Config
Located in `services/geminiService.js`

```javascript
const RETRY_CONFIG = {
  maxRetries: 3,              // Change this to retry more/less
  initialDelayMs: 1000,       // Initial retry delay in ms
  maxDelayMs: 10000,          // Maximum retry delay in ms
  backoffMultiplier: 2,       // Exponential backoff multiplier
};
```

### API Retry Config
Located in `frontend/src/services/api.ts`

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ERR_NETWORK'],
};
```

### Interview State TTL
Located in `frontend/src/utils/interviewStateStorage.ts`

```typescript
isStateStale: (interviewId: string, maxAgeMs = 30 * 60 * 1000) => {
  // maxAgeMs = 30 minutes (default)
  // Change this to adjust state expiration
}
```

---

## Monitoring & Debugging

### Enable Debug Logging
```bash
# Backend
DEBUG=true npm run dev

# Frontend
localStorage.debug = 'interview-assistant:*'
```

### Check Stored State
```javascript
// In browser console
localStorage.getItem('interview_state_<interviewId>')
// Returns: { currentQuestionIndex, answers, timestamp }
```

### Gemini API Debugging
1. Check `.env` has valid `GEMINI_API_KEY`
2. Test with: `node backend/services/testGeminiIntegration.js`
3. Check logs for retry attempts

### API Interceptor Debugging
```typescript
// Add to api.ts for debugging
api.interceptors.request.use(config => {
  console.log('📍 Request:', config.method, config.url);
  return config;
});
```

---

## Best Practices

1. **Always provide user feedback during retries**
   - Show spinner/loading state
   - Display retry count or message
   - Allow manual retry if auto-retry fails

2. **Log errors with context**
   - Include userId for privacy concerns
   - Log HTTP status codes and error codes
   - Include request path/method

3. **Graceful degradation**
   - Show cached data if fresh fetch fails
   - Allow basic functionality even if Gemini is down
   - Don't show technical error messages to users

4. **Test edge cases**
   - Slow networks (simulate in DevTools)
   - Offline scenarios
   - Server errors / timeouts
   - Invalid file uploads

5. **Monitor production errors**
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Alert on repeated errors
   - Track retry success rates

---

## Summary

The platform now has:
✅ Centralized error handling
✅ Automatic API retries with exponential backoff
✅ Interview state persistence across refreshes
✅ File validation and upload retry
✅ Global error boundary for React errors
✅ User-friendly error messages
✅ Comprehensive logging
✅ Protection against double submissions
✅ Graceful failures with retry UI

All edge cases are handled with sensible defaults, but remain configurable for different environments.
