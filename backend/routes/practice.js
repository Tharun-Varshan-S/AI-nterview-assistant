const express = require('express');
const practiceController = require('../controllers/practiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * POST /api/practice/start
 * Start a new practice session
 * Body: { mode, topic, difficulty, questionCount }
 */
router.post('/start', practiceController.startPracticeSession);

/**
 * POST /api/practice/answer
 * Submit an answer to a practice question
 * Body: { sessionId, questionIndex, response, language, timeTaken }
 */
router.post('/answer', practiceController.submitPracticeAnswer);

/**
 * POST /api/practice/complete
 * Complete/finish a practice session
 * Body: { sessionId }
 */
router.post('/complete', practiceController.completePracticeSession);

/**
 * GET /api/practice/sessions
 * Get all practice sessions for user
 * Query: { mode, topic, limit, page }
 */
router.get('/sessions', practiceController.getPracticeSessions);

/**
 * GET /api/practice/sessions/:sessionId
 * Get specific practice session details
 */
router.get('/sessions/:sessionId', practiceController.getPracticeSessionDetails);

/**
 * GET /api/practice/stats
 * Get practice statistics
 * Query: { mode, topic }
 */
router.get('/stats', practiceController.getPracticeStats);

module.exports = router;
