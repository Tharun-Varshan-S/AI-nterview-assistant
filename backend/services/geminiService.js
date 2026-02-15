const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Gemini API Configuration
 * Model: gemini-2.5-flash
 * API Version: v1
 * Endpoint: https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt) => {
  const delay = Math.min(
    RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  return delay;
};

/**
 * Determine if error is retryable
 */
const isRetryableError = (error) => {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Server errors (5xx)
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Too many requests
  if (error.response && error.response.status === 429) {
    return true;
  }

  // Request timeout
  if (error.code === 'ECONNABORTED') {
    return true;
  }

  return false;
};

/**
 * Clean JSON response from Gemini API
 * Removes markdown code blocks and extracts pure JSON
 */
const cleanJsonResponse = (text) => {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Extract JSON object if surrounded by other text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return cleaned;
};

/**
 * Safely parse JSON with error handling
 */
const safeJsonParse = (text) => {
  try {
    const cleaned = cleanJsonResponse(text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ JSON Parse Error:', error.message);
    console.error('📄 Raw text:', text);
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
};

/**
 * Core Gemini API call with retry logic
 */
const callGeminiAPI = async (prompt, attempt = 0) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    logger.gemini(`Calling Gemini API (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`);

    const response = await axios.post(
      GEMINI_API_ENDPOINT,
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
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    logger.debug('✅ Gemini API Response received', { status: response.status });

    // Extract content from response
    if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const content = response.data.candidates[0].content.parts[0].text;
    return content;
  } catch (error) {
    // Log retry or throw
    if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
      const retryDelay = getRetryDelay(attempt);
      logger.warn(`Retryable error (attempt ${attempt + 1}). Retrying in ${retryDelay}ms...`, {
        errorCode: error.code,
        status: error.response?.status,
        message: error.message,
      });

      await sleep(retryDelay);
      return callGeminiAPI(prompt, attempt + 1);
    }

    // Non-retryable or max retries exceeded
    logger.error('Gemini API Error', error);
    if (error.response) {
      logger.debug('Response data', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    throw error;
  }
};

/**
 * Evaluate candidate answer using Gemini 2.5 Flash
 * 
 * @param {string} question - Interview question
 * @param {string} answer - Candidate's answer
 * @param {string} resumeText - Candidate's resume context
 * @returns {Promise<Object>} Evaluation object with scores and feedback
 */
const evaluateAnswerWithGemini = async (question, answer, resumeText) => {
  const prompt = `You are a senior technical interviewer.

Evaluate the following answer.

Question:
${question}

Candidate Answer:
${answer}

Resume Context:
${resumeText}

Provide the following in strict JSON format:

{
  "overallScore": number (0-10),
  "technicalAccuracy": number (0-10),
  "clarity": number (0-10),
  "depth": number (0-10),
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1", "point2"],
  "improvementSuggestions": ["point1", "point2"]
}

Return ONLY the JSON object. No markdown, no extra text, no code blocks.`;

  try {
    // Call with retry logic
    const content = await callGeminiAPI(prompt);
    logger.debug('Raw Gemini response', { content: content.substring(0, 100) });

    // Parse and validate JSON
    const evaluation = safeJsonParse(content);

    // Validate required fields
    const requiredFields = ['overallScore', 'technicalAccuracy', 'clarity', 'depth', 'strengths', 'weaknesses', 'improvementSuggestions'];
    const missingFields = requiredFields.filter((field) => !(field in evaluation));

    if (missingFields.length > 0) {
      throw new Error(`Gemini response missing fields: ${missingFields.join(', ')}`);
    }

    logger.info('✅ Interview evaluation completed', {
      overallScore: evaluation.overallScore,
      technicalAccuracy: evaluation.technicalAccuracy,
    });

    return evaluation;
  } catch (error) {
    // Transform specific errors for client
    if (error.response?.status === 404) {
      throw new Error('Gemini: Model endpoint not found.');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Gemini: Invalid API key.');
    } else if (error.response?.status === 429) {
      throw new Error('Gemini: Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Gemini: Request timeout. Please try again.');
    }

    // Re-throw with context
    throw new Error(`Gemini API Error: ${error.message}`);
  }
};

module.exports = { evaluateAnswerWithGemini };
