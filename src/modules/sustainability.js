/**
 * Module 7: Sustainability Telemetry
 * Resource usage monitoring and efficiency recommendations
 */

import { callGemini, parseAIResponse } from '../ai/gemini-client.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';

export function initSustainabilityModule() {
  return {
    name: 'Sustainability Telemetry',
    render: renderSustainability
  };
}

function renderSustainability(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Sustainability Telemetry</h2>
    <p class="module-subtitle">Resource efficiency and environmental impact monitoring</p>

    <div style="display: grid; gap: 1rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Water Usage</h3>
          <span class="badge badge-low">NOMINAL</span>
        </div>
        <div class="card-body">
          <div style="font-family: var(--font-data); font-size: 1.5rem; margin-bottom: 0.5rem;">
            14,250 <span style="font-size: 0.875rem; color: var(--text-secondary);">liters/hour</span>
          </div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            Target: 15,000 L/h | Variance: -5%
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Energy Consumption</h3>
          <span class="badge badge-medium">ELEVATED</span>
        </div>
        <div class="card-body">
          <div style="font-family: var-data); font-size: 1.5rem; margin-bottom: 0.5rem;">
            1,850 <span style="font-size: 0.875rem; color: var(--text-secondary);">kWh</span>
          </div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            Target: 1,700 kWh | Variance: +8.8%
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Waste Generation</h3>
          <span class="badge badge-low">NOMINAL</span>
        </div>
        <div class="card-body">
          <div style="font-family: var(--font-data); font-size: 1.5rem; margin-bottom: 0.5rem;">
            420 <span style="font-size: 0.875rem; color: var(--text-secondary);">kg/hour</span>
          </div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            Target: 450 kg/h | Variance: -6.7%
          </div>
        </div>
      </div>
    </div>

    <button class="btn btn-primary" id="sustainability-suggest" style="margin-top: 1rem;">
      Generate Efficiency Recommendations
    </button>

    <div id="sustainability-suggestions"></div>
  `;

  const suggestBtn = document.getElementById('sustainability-suggest');
  suggestBtn.addEventListener('click', () => generateSuggestions());

  announce('Sustainability telemetry module loaded');
}

async function generateSuggestions() {
  const suggestionsEl = document.getElementById('sustainability-suggestions');
  const suggestBtn = document.getElementById('sustainability-suggest');

  suggestBtn.disabled = true;
  suggestBtn.innerHTML = '<span class="loading"></span> Generating...';

  suggestionsEl.innerHTML = '<div class="card"><span class="loading"></span> Analyzing resource usage patterns...</div>';

  try {
    const prompt = `You are the Sustainability AI for FIFA World Cup 2026 stadium operations.

Current resource usage:
- Water: 14,250 L/h (target: 15,000 L/h, -5%)
- Energy: 1,850 kWh (target: 1,700 kWh, +8.8%)
- Waste: 420 kg/h (target: 450 kg/h, -6.7%)

Generate 3 specific, actionable efficiency recommendations.

Output JSON:
{
  "recommendations": [
    {"area": string, "action": string, "estimated_savings": string}
  ],
  "confidence": number
}`;

    const responseText = await callGemini(prompt, { temperature: 0.8 });
    const suggestions = parseAIResponse(responseText);

    if (!suggestions) {
      throw new Error('Could not parse AI response');
    }

    renderSuggestions(suggestions, suggestionsEl);
    announce('Sustainability recommendations generated');

  } catch (error) {
    console.error('Sustainability error:', error);
    suggestionsEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Generation failed:</strong> ${sanitizeHTML(error.message)}</p>
    </div>`;
    announce('Recommendation generation failed');
  } finally {
    suggestBtn.disabled = false;
    suggestBtn.textContent = 'Generate Efficiency Recommendations';
  }
}

function renderSuggesns(suggestions, container) {
  const confidencePercent = Math.round(suggestions.confidence * 100);

  let recsHTML = '';
  suggestions.recommendations.forEach((rec, index) => {
    recsHTML += `
      <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-panel); border-left: 3px solid var(--accent-turf); border-radius: 2px;">
        <strong style="color: var(--accent-turf);">${index + 1}. ${sanitizeHTML(rec.area)}</strong><br>
        <span style="font-size: 0.9375rem; margin: 0.5rem 0; display: block;">
          ${sanitizeHTML(rec.action)}
        </span>
        <span style="font-size: 0.8125rem; color: var(--text-secondary);">
          Est. savings: ${sanitizeHTML(rec.estimated_savings)}
        </span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="ai-response">
      <div class="ai-response-header">
        <span class="ai-label">Efficiency Recommendations</span>
        <span class="confidence">${confidencePercent}% confident</span>
      </div>
      ${recsHTML}
    </div>
  `;
}
