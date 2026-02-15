// EXAMPLE: How to use Gemini API in detail

const axios = require('axios');

// Example 1: Basic Gemini API Call
async function callGeminiAPI() {
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: 'Explain JavaScript closures in simple terms',
              },
            ],
          },
        ],
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.candidates[0].content.parts[0].text;
    console.log('Gemini Response:', content);
  } catch (error) {
    console.error('Error calling Gemini:', error.message);
  }
}

// Example 2: Evaluating Interview Answer
async function evaluateInterviewAnswer() {
  const question = 'What is the difference between let, const, and var?';
  const candidateAnswer =
    'Let and const are block-scoped, while var is function-scoped. Const cannot be reassigned, let can be. Var is hoisted.';
  const resumeText = 'Experience: 3 years JavaScript development...';

  const prompt = `You are a technical interviewer. Evaluate this answer:
  
Question: ${question}
Answer: ${candidateAnswer}
Resume: ${resumeText}

Respond with ONLY this JSON (no other text):
{
  "score": <0-10>,
  "technicalAccuracy": "<assessment>",
  "clarity": "<assessment>",
  "depth": "<assessment>",
  "strengths": ["<strength>"],
  "weaknesses": ["<weakness>"],
  "improvements": ["<suggestion>"]
}`;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.candidates[0].content.parts[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch[0]);

    console.log('Evaluation:', evaluation);
    return evaluation;
  } catch (error) {
    console.error('Error evaluating:', error.message);
  }
}

// Example Response Format
const exampleEvaluation = {
  score: 8,
  technicalAccuracy:
    'Good understanding of scoping rules. Correctly identified key differences.',
  clarity: 'Clear and concise explanation with good differentiation.',
  depth: 'Covered the main points but could mention hoisting behavior.',
  strengths: [
    'Accurate scoping explanation',
    'Good distinction between var/let/const',
  ],
  weaknesses: ['Did not mention hoisting for var'],
  improvements: ['Explain memory implications', 'Mention practical use cases'],
};

console.log('Example Gemini Evaluation:', exampleEvaluation);

// To test this:
// 1. Install axios: npm install axios
// 2. Set GEMINI_API_KEY in .env
// 3. Run: node services/GEMINI_API_EXAMPLE.js
