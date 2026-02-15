const express = require('express');
const router = express.Router();
const { uploadResume, getResume } = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/multer');

router.post('/upload', protect, authorize('candidate'), upload.single('resume'), uploadResume);
router.get('/', protect, getResume);

module.exports = router;
