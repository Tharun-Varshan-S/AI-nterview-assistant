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
    interviewType: {
      type: String,
      enum: ['theoretical', 'coding', 'mixed'],
      default: 'theoretical',
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    currentDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      description: 'Tracks adaptive difficulty for next question'
    },
    questionsAsked: [
      {
        question: String,
        difficulty: String,
        topic: String,
        domain: String,
        timeLimit: Number,
        questionIndex: Number,
      },
    ],
    questions: [
      {
        question: String,
        difficulty: String,
        topic: String,
        domain: String,
        timeLimit: Number
      },
    ],
    answers: [
      {
        questionIndex: Number,
        question: String,
        response: String,
        isCodingAnswer: Boolean,
        language: String,
        aiEvaluation: {
          score: Number,
          technicalAccuracy: String,
          clarity: String,
          depth: String,
          strengths: [String],
          weaknesses: [String],
          improvements: [String],
          // Coding-specific fields
          logicScore: Number,
          readabilityScore: Number,
          edgeCaseHandling: String,
          timeComplexity: String,
          spaceComplexity: String
        },
        submittedAt: Date
      }
    ],
    skillPerformance: {
      type: Map,
      of: {
        topicName: String,
        score: Number,
        timestamps: [Date]
      },
      default: new Map()
    },
    difficultyBreakdown: {
      easy: { attempted: Number, avgScore: Number },
      medium: { attempted: Number, avgScore: Number },
      hard: { attempted: Number, avgScore: Number }
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    theoreticalScore: {
      type: Number,
      default: 0,
    },
    codingScore: {
      type: Number,
      default: 0,
    },
    systemDesignScore: {
      type: Number,
      default: 0,
    },
    finalEvaluation: {
      overallScore: Number,
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      evaluatedAt: Date
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
