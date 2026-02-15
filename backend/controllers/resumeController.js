const Resume = require('../models/Resume');
const { extractTextFromPDF } = require('../services/pdfService');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// @route   POST /api/resume/upload
// @desc    Upload resume PDF with validation and error handling
// @access  Private (Candidate only)
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    logger.info('Resume upload started', { fileName: req.file.originalname, size: req.file.size });

    // Extract text from PDF with error handling
    let extractedText;
    try {
      extractedText = await extractTextFromPDF(req.file.path);
      
      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        logger.warn('Resume PDF appears empty or unreadable');
        return res.status(400).json({
          success: false,
          message: 'Resume appears empty. Please upload a valid resume PDF.',
        });
      }
      
      logger.debug('PDF text extraction successful', { textLength: extractedText.length });
    } catch (pdfError) {
      logger.error('Resume PDF parsing failed', pdfError);
      
      // Check if it's a specific PDF error type
      if (pdfError.message && pdfError.message.includes('PDF')) {
        return res.status(400).json({
          success: false,
          message: 'Failed to parse resume. Please ensure it\'s a valid PDF file.',
        });
      }
      
      throw new AppError('Resume parsing failed. Please try again.', 500, 'RESUME_PARSE_ERROR');
    }

    // Check if user already has a resume
    const existingResume = await Resume.findOne({ userId: req.user.id });
    if (existingResume) {
      // Update existing resume
      existingResume.filePath = req.file.path;
      existingResume.fileName = req.file.originalname;
      existingResume.extractedText = extractedText;
      await existingResume.save();

      logger.info('Resume updated successfully', { userId: req.user.id });
      return res.status(200).json({
        success: true,
        message: 'Resume updated successfully',
        resume: existingResume,
      });
    }

    // Create new resume
    const resume = await Resume.create({
      userId: req.user.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      extractedText,
    });

    logger.info('Resume created successfully', { userId: req.user.id, resumeId: resume._id });
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume,
    });
  } catch (error) {
    logger.error('Resume upload error', error);
    next(error);
  }
};

// @route   GET /api/resume
// @desc    Get candidate's resume
// @access  Private
exports.getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    next(error);
  }
};
