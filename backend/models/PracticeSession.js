const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mode: {
      type: String,
      enum: ['aptitude', 'coding', 'technical', 'behavioral'],
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    questions: [
      {
        questionId: String,
        type: {
          type: String,
          enum: ['mcq', 'theoretical', 'coding'],
          default: 'theoretical'
        },
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
        difficulty: String,
        topic: String,
        domain: String,
        timeLimit: Number,
        isCoding: Boolean,
        testCases: [
          {
            input: [mongoose.Schema.Types.Mixed],
            expectedOutput: mongoose.Schema.Types.Mixed,
            description: String,
          },
        ],
        questionIndex: Number,
      },
    ],
    answers: [
      {
        questionIndex: Number,
        question: String,
        response: String,
        isCodingAnswer: Boolean,
        language: String,
        score: Number,
        aiEvaluation: mongoose.Schema.Types.Mixed,
        executionResult: {
          testCasesPassed: Number,
          totalTestCases: Number,
          runtimeError: String,
          output: String,
        },
        feedback: String,
        timeTaken: Number,
        submittedAt: Date,
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    questionsAttempted: {
      type: Number,
      default: 0,
    },
    skillsImproved: [String],
    evaluationSummary: {
      score: Number,
      summary: String,
      strengths: [String],
      weaknesses: [String],
      mistakes: [
        {
          question: String,
          userAnswer: String,
          issue: String,
          correctConcept: String,
          improvement: String,
        },
      ],
      perQuestionScore: [
        {
          questionId: Number,
          score: Number,
          feedback: String,
        },
      ],
    },
    timeSpent: {
      type: Number,
      default: 0, // in seconds
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries
practiceSessionSchema.index({ userId: 1, createdAt: -1 });
practiceSessionSchema.index({ userId: 1, mode: 1 });
practiceSessionSchema.index({ userId: 1, topic: 1 });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);
