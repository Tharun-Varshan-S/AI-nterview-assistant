const Resume = require('../models/Resume');
const { extractTextFromPDF } = require('../services/pdfService');
const geminiService = require('../services/geminiService');
const resumeValidationService = require('../services/resumeValidationService');
const logger = require('../utils/logger');

/**
 * POST /api/resume/upload
 * Optimized 2-stage layered validation
 */
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // --- STAGE 1: HARD VALIDATION (MANDATORY) ---

    // 1. MIME Type
    if (!['application/pdf'].includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only PDF files are accepted' });
    }

    // 2. File Size (Multer handles this, but secondary check)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
    }

    // 3. Extract Text
    const text = await extractTextFromPDF(req.file.path);
    const words = text.trim().split(/\s+/);

    // 4. Minimum 150 words
    if (words.length < 150) {
      return res.status(400).json({
        success: false,
        message: 'Resume content too short. Minimum 150 words required.'
      });
    }

    // 5. Keyword Check (Experience, Education, Skills, Projects, Work)
    const criticalKeywords = ["experience", "education", "skills", "projects", "work"];
    const lowerText = text.toLowerCase();
    const foundKeywords = criticalKeywords.filter(k => lowerText.includes(k));

    if (foundKeywords.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume structure. Missing core sections like Experience or Skills.'
      });
    }

    // --- STAGE 2: AI VALIDATION + EXTRACTION ---

    let structuredData = null;
    let aiValidated = false;

    try {
      // Try AI validation first
      structuredData = await geminiService.validateAndExtractResume(text);
      aiValidated = !!structuredData?.isResume;
    } catch (error) {
      logger.warn('AI Resume Validation failed, extracting metadata locally', { error: error.message });
    }

    // Fallback: Extract structured data locally if AI failed
    if (!structuredData) {
      structuredData = resumeValidationService.extractStructuredData(text);
      logger.info('Resume structured data extracted using local validation service');
    }

    const resumeData = {
      userId: req.user.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      extractedText: text,
      structuredData: structuredData || null,
      aiValidated: aiValidated,
      aiConfidence: structuredData?.confidence || 0
    };

    // Update or Create
    const resume = await Resume.findOneAndUpdate(
      { userId: req.user.id },
      resumeData,
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and processed successfully',
      data: resume
    });

  } catch (error) {
    logger.error('Resume upload failed', error);
    next(error);
  }
};

exports.getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
};
