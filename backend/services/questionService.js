const questions = {
  easy: [
    'What is the difference between let, const, and var in JavaScript?',
    'Explain what a closure is with a simple example.',
    'What is the difference between == and === in JavaScript?',
  ],
  medium: [
    'Explain how promises work and what is callback hell?',
    'What is event delegation in JavaScript?',
    'Explain the concept of hoisting in JavaScript.',
  ],
  hard: [
    'Explain how the event loop works in JavaScript.',
    'What is the difference between call, apply, and bind?',
    'Explain what is async/await and how it works under the hood.',
  ],
};

const generatePlaceholderQuestions = () => {
  const selectedQuestions = [];

  // Pick 2 easy questions
  const easyQuestions = getRandomQuestions(questions.easy, 2);
  selectedQuestions.push(
    ...easyQuestions.map((q) => ({
      id: Math.random().toString(36),
      question: q,
      difficulty: 'easy',
    }))
  );

  // Pick 2 medium questions
  const mediumQuestions = getRandomQuestions(questions.medium, 2);
  selectedQuestions.push(
    ...mediumQuestions.map((q) => ({
      id: Math.random().toString(36),
      question: q,
      difficulty: 'medium',
    }))
  );

  // Pick 2 hard questions
  const hardQuestions = getRandomQuestions(questions.hard, 2);
  selectedQuestions.push(
    ...hardQuestions.map((q) => ({
      id: Math.random().toString(36),
      question: q,
      difficulty: 'hard',
    }))
  );

  return selectedQuestions;
};

const getRandomQuestions = (questionArray, count) => {
  const shuffled = [...questionArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

module.exports = { generatePlaceholderQuestions };
