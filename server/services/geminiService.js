import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Prioritized list of active Google Gemini models.
 * If the primary model experiences high demand (HTTP 503) or rate limits,
 * it automatically cascades to the next resilient model in milliseconds.
 */
export const GEMINI_MODEL_CASCADE = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

/**
 * Construct GoogleGenerativeAI instance from environment.
 */
export const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

export const isGeminiConfigured = () => {
  return Boolean((process.env.GEMINI_API_KEY || '').trim());
};

// Cache the last verified working model in-memory so subsequent requests do not pay waterfall latency
let preferredModel = null;

/**
 * Execute Gemini content generation with multi-model automatic fallback.
 * @param {string|Array} prompt - Prompt string or contents array
 * @param {Object} options - Optional generation configuration
 * @returns {Promise<{ text: string, modelUsed: string, response: any }>}
 */
export const generateGeminiContent = async (prompt, options = {}) => {
  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment variables.');
  }

  let lastError = null;
  const modelsToTry = preferredModel
    ? [preferredModel, ...GEMINI_MODEL_CASCADE.filter((m) => m !== preferredModel)]
    : GEMINI_MODEL_CASCADE;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: options.generationConfig,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Remember working model to avoid fallback delays on future calls
      preferredModel = modelName;

      return {
        text,
        modelUsed: modelName,
        response,
        rawResult: result,
      };
    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      console.warn(`[GeminiCascade] Model "${modelName}" failed (${msg.slice(0, 100)}). Cascading to next fallback model...`);
    }
  }

  throw lastError || new Error('All Gemini models in cascade failed to generate content.');
};

/**
 * Test live Gemini connectivity and return active model diagnostics.
 */
export const testGeminiConnection = async () => {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      status: 'unconfigured',
      message: 'GEMINI_API_KEY is not configured in environment variables.',
    };
  }

  try {
    const startTime = Date.now();
    const result = await generateGeminiContent('Ping: Respond with single word "PONG".');
    const latencyMs = Date.now() - startTime;

    return {
      configured: true,
      status: 'ready',
      activeModel: result.modelUsed,
      sampleResponse: result.text.trim(),
      latencyMs,
      message: `Gemini AI operational via ${result.modelUsed} (${latencyMs}ms).`,
    };
  } catch (error) {
    return {
      configured: true,
      status: 'error',
      message: `Gemini API call failed: ${error.message}`,
    };
  }
};

export default {
  getGeminiClient,
  isGeminiConfigured,
  generateGeminiContent,
  testGeminiConnection,
  GEMINI_MODEL_CASCADE,
};
