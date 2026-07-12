/**
 * Vercel serverless function - Gemini API proxy
 * Keeps API key server-side, never exposed to client
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const MAX_REQUESTS_PER_MINUTE = 30;
const MAX_PAYLOAD_SIZE = 100000; // 100KB

// Simple in-memory rate limiting (resets on cold start)
const requestCounts = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = `${ip}-${minute}`;

  const count = requestCounts.get(key) || 0;
  if (count >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  requestCounts.set(key, count + 1);

  // Payload size validation
  const payloadSize = JSON.stringify(req.body).length;
  if (payloadSize > MAX_PAYLOAD_SIZE) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  // API key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { contents, generationConfig } = req.body;

    if (!contents || !AArray(contents)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
         temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return res.status(response.status).json({ error: 'Gemini API request failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
