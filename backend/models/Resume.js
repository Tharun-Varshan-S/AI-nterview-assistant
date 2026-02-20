const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    structuredData: {
      skills: [String],
      technologies: [String],
      experienceYears: Number,
      education: [String],
      primaryDomain: String
    },
    aiValidated: {
      type: Boolean,
      default: false
    },
    aiConfidence: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
