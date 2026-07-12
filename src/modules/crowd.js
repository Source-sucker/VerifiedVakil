/**
 * Module 1: Crowd Intelligence
 * Real-time crowd density analysis with AI recommendations
 */

import { callGemini, parseAIResponse, cacheKey, getCached, setCache } from '../ai/gemini-client.js';
import { CROWD_ANALYSIS_PROMPT } from '../ai/prompts.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';
import { addInsight } from '../app.js';

export function initCrowdModule() {
  return {
    name: 'Crowd Intelligence',
    render: renderCrowd
  };
}

function renderCrowd(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Crowd Intelligence</h2>
    <p class="module-subtitle">Real-time gate occupancy and crowd flow analysis</p>

    <div id="crowd-status"></div>

    <button class="btn btn-primary" id="analyze-crowd">
      Analyze Crowd Risk
    </button>

    <div id="crowd-analysis"></div>
  `;

  // Render current status
  renderCrowdStatus(dataModel);

  // Set up analyze button
  const analyzeBtn = document.getElementById('analyze-crowd');
  analyzeBtn.addEventListener('click', () => analyzeCrowd(dataModel));
}

functietElementById('crowd-status');

  if (!dataModel.gates || dataModel.gates.length === 0) {
    statusEl.innerHTML = '<p class="card">No gate data loaded. Upload a CSV file to begin.</p>';
    return;
  }

  let html = '<div class="card"><div class="card-header"><h3 class="card-title">Gate Status</h3></div><div class="card-body">';

  // Sort by percentage descending
  const sorted = [...dataModel.gates].sort((a, b) => b.percentage - a.percentage);

  sorted.forEach(gate => {
    const badgeClass = gate.percentage >= 90 ? 'badge-high' :
                       gate.percentage >= 75 ? 'badge-medium' : 'badge-low';

    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
        <span>Gate ${sanitizeHTML(String(gate.id))}</span>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-family: var(--font-data); font-size: 1rem;">${gate.percentage.toFixed(1)}%</span>
          <span class="badge ${badgeClass}" role="status" aria-label="Gate ${gate.id} status">
            ${gate.current}/${gate.capacity}
          </span>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  statusEl.innerHTML = html;
}

async function analyzeCrowd(dataModel) {
  const analysisEl = document.getElementById('crowd-analysis');
  const analyzeBtn = document.getElementById('analyze-crowd');

  if (!dataModel.gates || dataModel.gates.length === 0) {
    analysisEl.innerHTML = '<p class="card">No gate data to analyze.</p>';
    return;
  }

  // Disable button
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="loading"></span> Analyzing...';

  analysisEl.innerHTML = '<div class="card"><span class="loading"></span> Analyzing crowd patterns...</div>';

  try {
    // Build prompt
    const prompt = CROWD_ANALYSIS_PROMPT.build(dataModel.gates);
    const key = cacheKey(prompt);

    // Check cache
    let responseText = getCached(key);

    if (!responseText) {
      // Call Gemini
      responseText = await callGemini(prompt, { temperature: 0.7 });
      setCache(key, responseText);
    }

    // Parse JSON
    const analysis = parseAIResponse(responseText);

    if (!analysis) {
      throw new Error('Could not parse AI response');
    }

    // Render analysis
    renderAnalysis(analysis, analysisEl);

    // Add to insights
    const riskLabel = analysis.risk_level.toUpperCase();
    addInsight(`Crowd analysis: ${riskLabel} risk - ${analysis.recommendation}`,
               analysis.risk_level === 'high' ? 'critical' : analysis.risk_level === 'medium' ? 'warning' : 'info');

    announce(`Crowd analysis complete: ${analysis.risk_level} risk level`);

  } catch (error) {
    console.error('Crowd analysis error:', error);
    analysisEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Analysis failed:</strong> ${sanitizeHTML(error.message)}</p>
      <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
        Check console for details or try again.
      </p>
    </div>`;
    announce('Crowd analysis failed');
  } finally {
    // Re-enable button
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Crowd Risk';
  }
}

function renderAnalysis(analysis, container) {
  const badgeClass = analysis.risk_level === 'high' ? 'badge-high' :
                     analysis.risk_level === 'medium' ? 'badge-medium' : 'badge-low';

  const confidencePercent = Math.round(analysis.confidence * 100);

  container.innerHTML = `
    <div class="ai-response">
      <div class="ai-response-header">
        <span class="ai-label">AI Analysis</span>
        <span class="confidence" aria-label="Confidence level">${confidencePercent}% confident</span>
      </div>

      <div style="margin-bottom: 1rem;">
        <span class="badge ${badgeClass}" role="status">
          ${sanitizeHTML(analysis.risk_level.toUpperCase())} RISK
        </span>
        ${analysis.eta_minutes ? `<span style     ETA: ${analysis.eta_minutes} min
        </span>` : ''}
      </div>

      <div class="recommendation">
        <strong>Recommendation:</strong><br>
        ${sanitizeHTML(analysis.recommendation)}
      </div>

      <div class="supporting-data">
        <strong>Supporting Data:</strong><br>
        ${sanitizeHTML(analysis.supporting_data)}
      </div>

      <div class="alternative">
        <strong>Alternative:</strong> ${sanitizeHTML(analysis.alternative_action)}
      </div>
    </div>
  `;
}
