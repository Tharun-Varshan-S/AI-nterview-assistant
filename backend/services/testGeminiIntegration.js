// Load environment variables from .env file
require('dotenv').config();

const { evaluateAnswerWithGemini } = require('./geminiService');

/**
 * Test Gemini API Integration
 * Run this to verify your Gemini API setup
 * 
 * Usage: node services/testGeminiIntegration.js
 */

async function testGeminiIntegration() {
  console.log('\n🧪 Testing Gemini API Integration...\n');
  console.log('=' .repeat(60));

  // Test data
  const question = 'What is the difference between let, const, and var in JavaScript?';
  const answer = `Let and const are block-scoped variables introduced in ES6, while var is function-scoped. 
  Const creates immutable bindings - you cannot reassign the variable, though the object it points to can be mutated. 
  Let allows reassignment within its scope. Var is hoisted to the top of its function and can lead to unexpected behavior.`;
  const resumeText = 'Experience: 3 years JavaScript development, React, Node.js';

  try {
    console.log('📝 Question:', question);
    console.log('\n💬 Answer:', answer.substring(0, 100) + '...');
    console.log('\n📄 Resume:', resumeText);
    console.log('\n' + '='.repeat(60));
    console.log('\n⏳ Calling Gemini API...\n');

    const evaluation = await evaluateAnswerWithGemini(question, answer, resumeText);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SUCCESS! Evaluation received:\n');
    console.log(JSON.stringify(evaluation, null, 2));
    console.log('\n' + '='.repeat(60));

    // Validation
    console.log('\n📊 Validation:');
    console.log('  ✓ Overall Score:', evaluation.overallScore, '/ 10');
    console.log('  ✓ Technical Accuracy:', evaluation.technicalAccuracy, '/ 10');
    console.log('  ✓ Clarity:', evaluation.clarity, '/ 10');
    console.log('  ✓ Depth:', evaluation.depth, '/ 10');
    console.log('  ✓ Strengths:', evaluation.strengths.length, 'points');
    console.log('  ✓ Weaknesses:', evaluation.weaknesses.length, 'points');
    console.log('  ✓ Suggestions:', evaluation.improvementSuggestions.length, 'points');

    console.log('\n✅ All tests passed! Gemini integration is working correctly.\n');
    return true;

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.log('\n📋 Troubleshooting Steps:');
    console.log('  1. Check your .env file has GEMINI_API_KEY set');
    console.log('  2. Verify your API key is valid at https://makersuite.google.com/app/apikey');
    console.log('  3. Ensure you have enabled the Gemini API in Google Cloud Console');
    console.log('  4. Check your internet connection');
    console.log('  5. Review the error details above');
    console.log('\n');
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testGeminiIntegration()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testGeminiIntegration };
