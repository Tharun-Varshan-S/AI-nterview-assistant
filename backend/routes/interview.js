const express = require('express');
const router = express.Router();
const {
  createInterview,
  getInterview,
  submitAnswer,
  completeInterview,
  getCandidateInterviews,
  getAllCompletedInterviews,
  getInterviewWithDetails,
  generateSkillGapReport
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/auth');

// Candidate routes - specific routes first
router.post('/create', protect, authorize('candidate'), createInterview);
router.get('/my-interviews', protect, authorize('candidate'), getCandidateInterviews);
router.post('/skill-gap-report', protect, authorize('candidate'), generateSkillGapReport);

// Dynamic routes - must come after specific routes
router.get('/:id', protect, getInterview);
router.get('/:id/details', protect, getInterviewWithDetails);
router.post('/:id/submit-answer', protect, authorize('candidate'), submitAnswer);
router.patch('/:id/complete', protect, authorize('candidate'), completeInterview);

// Recruiter routes
router.get('/recruiter/all', protect, authorize('recruiter'), getAllCompletedInterviews);

module.exports = router;
