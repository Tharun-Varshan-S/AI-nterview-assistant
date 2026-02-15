const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    aiEvaluation: {
      overallScore: {
        type: Number,
        min: 0,
        max: 10,
      },
      technicalAccuracy: {
        type: Number,
        min: 0,
        max: 10,
      },
      clarity: {
        type: Number,
        min: 0,
        max: 10,
      },
      depth: {
        type: Number,
        min: 0,
        max: 10,
      },
      strengths: [String],
      weaknesses: [String],
      improvementSuggestions: [String],
    },
    evaluatedAt: Date,
  },
  { timestamps: true }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    questions: [
      {
        id: String,
        question: String,
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
        },
      },
    ],
    answers: [answerSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
