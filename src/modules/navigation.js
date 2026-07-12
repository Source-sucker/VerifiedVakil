/**
 * Module 3: Wayfinding & Navigation
 * AI-generated accessible directions
 */

import { callGemini, parseAIResponse } from '../ai/gemini-client.js';
import { WAYFINDING_PROMPT } from '../ai/prompts.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';

export function initNavigationModule() {
  return {
    name: 'Wayfinding & Navigation',
    render: renderNavigation
  };
}

function renderNavigation(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Wayfinding & Navigation</h2>
    <p class="module-subtitle">AI-powered accessible routing for fans and staff</p>

    <div class="card">
      <h3 class="card-title">Generate Directions</h3>
      <form id="navigation-form" style="display: grid; gap: 1rem;">
        <div>
          <label for="nav-from" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            From
          </label>
          <input type="text" id="nav-from" class="btn" style="width: 100%;"
                 placeholder="e.g., Gate 5, Main Entrance" required>
        </div>

        <div>
          <label for="nav-to" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            To
          </label>
          <input type="text" id="nav-to" class="btn" style="width: 100%;"
                 placeholder="e.g., Section 105, Medical Station, Concession A" required>
        </div>

        <div>
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="nav-accessible" style="width: 16px; height: 16px;">
            <span style="font-weight: 500;">Wheelchair accessible route</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary">Get Directions</button>
      </form>
    </div>

    <div id="navigation-result"></div>
  `;

  // Set up form
  const form = document.getElementById('navigation-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleNavigationRequest();
  });
}

async function handleNavigationRequest() {
  const from = document.getElementById('nav-from').value;
  const to = document.getElementById('nav-to').value;
  const accessible = document.getElementById('nav-accessible').checked;
  const resultEl = document.getElementById('navigation-result');
  const submitBtn = document.querySelector('#navigation-form button[type="submit"]');

  if (!from || !to) return;

  // Disable submit
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Calculating route...';

  resultEl.innerHTML = '<div class="card"><span class="loading"></span> Generating directions...</div>';

  try {
    // Build prompt
    const accessibilityNeeds = accessible ? 'wheelchair accessible, avoid stairs' : null;
    const prompt = WAYFINDING_PROMPT.build(from, to, accessibilityNeeds);

    // Call Gemini
    const responseText = await callGemini(prompt, { temperature: 0.8 });

    // Parse JSON
    const directions = parseAIResponse(responseText);

    if (!directions) {
      throw new Error('Could not parse AI response');
    }

    // Render directions
    renderDirections(directions, from, to, resultEl);

    announce(`Directions generated from ${from} to ${to}`);

  } catch (error) {
    console.error('Navigation error:', error);
    resultEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Direction generation failed:</strong> ${sanitizeHTML(error.message)}</p>
    </div>`;
    announce('Direction generation failed');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get Directions';
  }
}

function renderDirections(directions, from, to, container) {
  const confidencePercent = Math.round(directions.confidence * 100);

  let stepsHTML = '<ol style="margin: 1rem 0; padding-left: 1.5rem; line-height: 1.8;">';
  directions.steps.forEach((step, index) => {
    stepsHTML += `<li style="margin-bottom: 0.75rem; font-size: 0.9375rem;">${sanitizeHTML(step)}</li>`;
  });
  stepsHTML += '</ol>';

  const accessibilityNote = directions.accessibility_notes
    ? `<div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-panel); border-left: 3px solid var(--accent-turf); border-radius: 2px;">
         <strong style="color: var(--accent-turf);">♿ Accessibility:</strong><br>
         <span style="font-size: 0.875rem;">${sanitizeHTML(directions.accessibility_notes)}</span>
       </div>`
    : '';

  container.innerHTML = `
    <div class="ai-response">
      <div class="ai-response-header">
        <span class="ai-label">Directions</span>
        <span class="confidence" aria-label="Confidence level">${confidencePercent}% confident</span>
      </div>

      <div style="margin-bottom: 1rem;">
        <strong style="font-size: 1rem;">From:</strong> ${sanitizeHTML(from)}<br>
        <strong style="font-size: 1rem;">To:</strong> ${sanitizeHTML(to)}<br>
        <span style="color: var(--text-secondary); font-size: 0.875rem;">
          Estimated time: ${directions.estimated_minutes} minutes
        </span>
      </div>

      ${stepsHTML}

      ${accessibilityNote}
    </div>
  `;
}
