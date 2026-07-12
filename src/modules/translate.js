/**
 * Module 8: Multilingual Fan Assistance
 * AI translation and accessibility features
 */

import { callGemini, parseAIResponse } from '../ai/gemini-client.js';
import { TRANSLATION_PROMPT } from '../ai/prompts.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';

export function initTranslateModule() {
  return {
    name: 'Multilingual Fan Assistance',
    render: renderTranslate
  };
}

function renderTranslate(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Multilingual Fan Assistance</h2>
    <p class="module-subtitle">AI-powered translation and accessibility support</p>

    <div class="card">
      <h3 class="card-title">Translate Message</h3>
      <form id="translate-form" style="display: grid; gap: 1rem;">
        <div>
          <label for="translate-text" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Message to Translate
          </label>
          <textarea id="translate-text" class="btn" style="width: 100%; min-height: 100px; resize: vertical; font-family: var(--font-data);"
                    placeholder="Enter announcement, wayfinding instruction, or safety message..." required></textarea>
        </div>

        <div>
          <label for="translate-language" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Target Language
          </label>
          <select id="translate-language" class="btn" style="width: 100%;" required>
            <option value="">Select language...</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="Portuguese">Portuguese</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Arabic">Arabic</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Mandarin Chinese">Mandarin Chinese</option>
            <option value="Russian">Russian</option>
          </select>
        </div>

        <div>
          <label for="translate-context" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Context
          </label>
          <select id="translate-context" class="btn" style="width: 100%;">
            <option value="general">General announcement</option>
            <option value="emergency">Emergency/Safety</option>
            <option value="wayfinding">Wayfinding/Directions</option>
            <option value="amenity">Amenities/Services</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary">Translate</button>
      </form>
    </div>

    <div id="translation-result"></div>
  `;

  // Set up form
  const form = document.getElementById('translate-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleTranslation();
  });
}

async function handleTranslation() {
  const text = document.getElementById('translate-text').value;
  const language = document.getElementById('translate-language').value;
  const context = document.getElementById('translate-context').value;
  const resultEl = document.getElementById('translation-result');
  const submitBtn = document.querySelector('#translate-form button[type="submit"]');

  if (!text || !language) return;

  // Disable submit
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Translating...';

  resultEl.innerHTML = '<div class="card"><span class="loading"></span> Translating message...</div>';

  try {
    // Build prompt
    const prompt = TRANSLATION_PROMPT.build(text, language, context);

    // Call Gemini
    const responseText = await callGemini(prompt, { temperature: 0.7 });

    // Parse JSON
    const translation = parseAIResponse(responseText);

    if (!translation) {
      throw new Error('Could not parse AI response');
    }

    // Render translation
    renderTranslation(translation, text, language, resultEl);

    announce(`Message translated to ${language}`);

  } catch (error) {
    console.error('Translation error:', error);
    resultEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Translation failed:</strong> ${sanitizeHTML(error.message)}</p>
    </div>`;
    announce('Translation failed');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Translate';
  }
}

function renderTranslation(translation, originalText, language, container) {
  const confidencePercent = Math.round(translation.confidence * 100);
  const urgentBadge = translation.is_urgent
    ? '<span class="badge badge-high" style="margin-left: 0.5rem;">URGENT</span>'
    : '';

  container.innerHTML = `
    <div class="ai-response">
      <diclass="ai-response-header">
        <div>
          <span class="ai-label">Translation</span>
          ${urgentBadge}
        </div>
        <span class="confidence" aria-label="Confidence level">${confidencePercent}% confident</span>
      </div>

      <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-base); border-radius: 2px;">
        <strong style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
          Original (English)
        </strong>
        <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--text-secondary);">
          ${sanitizeHTML(originalText)}
        </p>
      </div>

      <div style="padding: 1rem; background: var(--bg-panel); border-left: 3px solid var(--accent-turf); border-radius: 2px;">
        <strong style="color: var(--accent-turf); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
          ${sanitizeHTML(language)}
        </strong>
        <p style="margin: 0.5rem 0 0; font-size: 1.125rem; line-height: 1.6;" lang="${language.toLowerCase()}">
          ${sanitizeHTML(translation.translated_text)}
        </p>
      </div>

      ${translation.is_urgent ? `
        <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-base); border-left: 3px solid var(--accent-signal); border-radius: 2px;">
          <strong style="color: var(--accent-signal);">⚠ Urgent Message</strong><br>
          <span style="font-size: 0.875rem; color: var(--text-secondary);">
            This message contains safety or time-critical information. Ensure immediate delivery.
          </span>
        </div>
      ` : ''}
    </div>
  `;
}
