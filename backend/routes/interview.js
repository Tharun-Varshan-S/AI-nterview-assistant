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
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/auth');

// Candidate routes
router.post('/create', protect, authorize('candidate'), createInterview);
router.get('/my-interviews', protect, authorize('candidate'), getCandidateInterviews);
router.get('/:id', protect, getInterview);
router.post('/:id/submit-answer', protect, authorize('candidate'), submitAnswer);
router.put('/:id/complete', protect, authorize('candidate'), completeInterview);

// Recruiter routes
router.get('/recruiter/all-completed', protect, authorize('recruiter'), getAllCompletedInterviews);
router.get('/recruiter/:id', protect, authorize('recruiter'), getInterviewWithDetails);

module.exports = router;
