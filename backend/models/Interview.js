const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    questions: [
      {
        question: String,
        difficulty: String,
        topic: String,
        timeLimit: Number
      },
    ],
    answers: [
      {
        question: String,
        response: String,
        aiEvaluation: {
          score: Number,
          technicalAccuracy: String,
          clarity: String,
          depth: String,
          strengths: [String],
          weaknesses: [String],
          improvements: [String]
        }
      }
    ],
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
