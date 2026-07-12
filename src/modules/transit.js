/**
 * Module 4: Transit Intelligence
 * Transit delay monitoring and rerouting suggestions
 */

import { callGemini, parseAIResponse } from '../ai/gemini-client.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';

export function initTransitModule() {
  return {
    name: 'Transit Intelligence',
    render: renderTransit
  };
}

function renderTransit(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Transit Intelligence</h2>
    <p class="module-subtitle">Real-time transit status and routing advisories</p>

    <div class="card">
      <h3 class="card-title">Report Transit Delay</h3>
      <form id="transit-form" style="display: grid; gap: 1rem;">
        <div>
          <label for="transit-line" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Line/Route
          </label>
          <input type="text" id="transit-line" class="btn" style="width: 100%;"
                 placeholder="e.g., Metro Line 2, Shuttle A" required>
        </div>

        <div>
          <label for="transit-delay" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Delay (minutes)
          </label>
          <input type="number" id="transit-delay" class="btn" style="width: 100%;"
                 min="0" max="120" placeholder="0" required>
        </div>

        <button type="submit" class="btn btn-primary">Generate Advisory</button>
      </form>
    </div>

    <div id="transit-advisory"></div>

    <div id="transit-status" style="margin-top: 2rem;">
      <h3 style="font-family: var(--font-display); font-size: 1.25rem; margin-bottom: 1rem;">
        Transit Status
      </h3>
      <div id="transit-list"></div>
    </div>
  `;

  renderTransitStatus(dataModel);

  const form = document.getElementById('transit-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleTransitDelay();
  });
}

function renderTransitStatus(dataModel) {
  const listEl = document.getElementById('transit-list');

  // Mock transit data - in production would come from uploaded data
  const transitLines = [
    { line: 'Metro Line 1', delay: 0, status: 'On time' },
    { line: 'Metro Line 2', delay: 5, status: 'Minor delays' },
    { line: 'Shuttle A', delay: 0, status: 'On time' },
    { line: 'Shuttle B', delay: 15, status: 'Significant delays' }
  ];

  let html = '';

  transitLines.forEach(transit => {
    const badgeClass = transit.delay === 0 ? 'badge-low' :
                       transit.delay < 10 ? 'badge-medium' : 'badge-high';

    html += `
      <div class="card">
        <div class="card-header">
          <span class="card-title" style="font-size: 1rem;">${sanitizeHTML(transit.line)}</span>
          <span class="badge ${badgeClass}">${transit.delay} min</span>
        </div>
        <div class="card-body">
          <span style="color: var(--text-secondary); font-size: 0.875rem;">
            ${sanitizeHTML(transitatus)}
          </span>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

async function handleTransitDelay() {
  const line = document.getElementById('transit-line').value;
  const delay = parseInt(document.getElementById('transit-delay').value);
  const advisoryEl = document.getElementById('transit-advisory');
  const submitBtn = document.querySelector('#transit-form button[type="submit"]');

  if (!line || delay < 0) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Generating advisory...';

  advisoryEl.innerHTML = '<div class="card"><span class="loading"></span> Generating transit advisory...</div>';

  try {
    const prompt = `You are the Transit Operations AI for FIFA World Cup 2026.

Transit delay reported:
- Line: ${line}
- Delay: ${delay} minutes

Generate a JSON response with:
1. Fan-facing advisory (brief, clear message for stadium displays)
2. Ops-facing rerouting suggestion (alternative routes or actions for staff)
3. Severity assessment

Output format:
{
  "fan_advisory": string,
  "ops_suggestion": string,
  "severity": "low" | "medium" | "high",
  "confidence": number
}`;

    const responseText = await callGemini(prompt, { temperature: 0.7 });
    const advisory = parseAIResponse(responseText);

    if (!advisory) {
      throw new Error('Could not parse AI response');
    }

    renderTransitAdvisory(advisory, line, delay, advisoryEl);
    announce(`Transit advisory generated for ${line}`);

  } catch (error) {
    console.error('Transit advisory error:', error);
    advisoryEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Advisory generation failed:</strong> ${sanitizeHTML(error.message)}</p>
    </div>`;
    announce('Advisory generation failed');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Generate Advisory';
  }
}

function renderTransitAdvisory(advisory, line, delay, container) {
  const badgeClass = advisory.severity === 'high' ? 'badge-high' :
                     advisory.severity === 'medium' ? 'badge-medium' : 'badge-low';
  const confidencePercent = Math.round(advisory.confidence * 100);

  container.innerHTML = `
    <div class="ai-response">
      <div class="ai-response-header">
        <span class="ai-label">Transit Advisory</span>
        <span class="confidence">${confidencePercent}% confident</span>
      </div>

      <div style="margin-bottom: 1rem;">
        <strong>${sanitizeHTML(line)}</strong> - ${delay} minute delay
        <span class="badge ${badgeClass}" style="margin-left: 0.5rem;">${advisory.severity.toUpperCase()}</span>
      </div>

      <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-panel); border-left: 3px solid var(--accent-gold); border-radius: 2px;">
        <strong style="color: var(--accent-gold); font-size: 0.75rem; text-transform: uppercase;">Fan Advisory</strong>
        <p style="margin: 0.5rem 0 0; font-size: 0.9375rem;">
          ${sanitizeHTML(advisory.fan_advisory)}
        </p>
      </div>

      <div class="supporting-data">
        <strong>Operations Suggestion:</strong><br>
        ${sanitizeHTML(advisory.ops_suggestion)}
      </div>
    </div>
  `;
}
