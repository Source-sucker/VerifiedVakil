/**
 * Gemini API client
 * Calls /api/gemini proxy - never exposes API key to client
 */

const API_ENDPOINT = '/api/gemini';
const REQUEST_TIMEOUT = 30000; // 30s

/**
 * Call Gemini API through server proxy
 */
export async function callGemini(prompt, config = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxOutputTokens || 2048,
          ...config
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();

    // Extract text from Gemini response structure
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Unexpected API response format');

  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - try again');
    }

    throw error;
  }
}

/**
 * Parse JSON from AI response with fallback
 */
export function parseAIResponse(text) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);

    if (jsonMatch) {
      return rse AI response as JSON:', error);
    return null;
  }
}

/**
 * Cache for recent requests (simple deduplication)
 */
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

export function cacheKey(prompt) {
  return prompt.substring(0, 200); // Use first 200 chars as key
}

export function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

export function setCache(key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now()
  });

  // Limit cache size
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}
