const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * GET /api/analytics/overview
 * Get overview analytics (readiness score, strongest skill, weakest skill, etc.)
 */
router.get('/overview', analyticsController.getOverviewAnalytics);

/**
 * GET /api/analytics/full-report
 * Get complete analytics report with charts data
 */
router.get('/full-report', analyticsController.getFullAnalyticsReport);

/**
 * GET /api/analytics/skills
 * Get skill-specific analytics
 * Query: { skill }
 */
router.get('/skills', analyticsController.getSkillAnalytics);

/**
 * GET /api/analytics/resume-consistency
 * Get resume vs performance consistency analysis
 */
router.get('/resume-consistency', analyticsController.getResumeConsistency);

/**
 * GET /api/analytics/timeline/:interviewId
 * Get adaptive difficulty timeline for an interview
 */
router.get('/timeline/:interviewId', analyticsController.getAdaptiveDifficultyTimeline);

module.exports = router;
