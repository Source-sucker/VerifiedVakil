/**
 * Module 9: AI Morning Brief & Analytics
 * Synthesis capstone - reads across all modules
 */

import { callGemini, parseAIResponse } from '../ai/gemini-client.js';
import { MORNING_BRIEF_PROMPT } from '../ai/prompts.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';
import { addInsight } from '../app.js';

export function initBriefModule() {
  return {
    name: 'AI Morning Brief & Analytics',
    render: renderBrief
  };
}

function renderBrief(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">AI Morning Brief & Analytics</h2>
    <p class="module-subtitle">Synthesized operational intelligence across all dimensions</p>

    <div class="card" style="background: var(--bg-panel); border-left: 3px solid var(--accent-gold);">
      <p style="font-size: 0.9375rem; line-height: 1.6; margin-bottom: 1rem;">
        This synthesis module analyzes current state across <strong>all operational dimensions</strong>:
        crowd management, incidents, transit, medical resources, volunteer staffing, sustainability,
        and generates a unified strategic brief.
      </p>
      <button class="btn btn-primary" id="generate-brief">
        Generate Morning Brief
      </button>
    </div>

    <div id="brief-result"></div>
  `;

  const briefBtn = document.getElementById('generate-brief');
  briefBtn.addEventListener('click', () => generateBrief(dataModel));
}

async function generateBrief(dataModel) {
  const resultEl = document.getElementById('brief-result');
  const briefBtn = document.getElementById('generate-brief');

  briefBtn.disabled = true;
  briefBtn.innerHTML = '<span class="loading"></span> Synthesizing...';

  resultEl.innerHTML = '<div class="card"><span class="loading"></span> Analyzing operational state across all modules...</div>';

  try {
    const prompt = MORNING_BRIEF_PROMPT.build(dataModel);
    const responseText = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 1024 });
    const brief = par('Could not parse AI response');
    }

    renderBriefResult(brief, resultEl);
    addInsight('Morning brief generated', 'info');
    announce('Morning operational brief generated');

  } catch (error) {
    console.error('Brief generation error:', error);
    resultEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Brief generation failed:</strong> ${sanitizeHTML(error.message)}</p>
    </div>`;
    announce('Brief generation failed');
  } finally {
    briefBtn.disabled = false;
    briefBtn.textContent = 'Generate Morning Brief';
  }
}

function renderBriefResult(brief, container) {
  const confidencePercent = Math.round(brief.confidence * 100);

  let prioritiesHTML = '<ol style="margin: 0.75rem 0; padding-left: 1.5rem; line-height: 1.8;">';
  brief.top_priorities.forEach(priority => {
    prioritiesHTML += `<li style="margin-bottom: 0.5rem; font-size: 0.9375rem;"><strong>${sanitizeHTML(priority)}</strong></li>`;
  });
  prioritiesHTML += '</ol>';

  let risksHTML = '<ul style="margin: 0.75rem 0; padding-left: 1.5rem;">';
  brief.risk_factors.forEach(risk => {
    risksHTML += `<li style="margin-bottom: 0.5rem; font-size: 0.875rem;">${sanitizeHTML(risk)}</li>`;
  });
  risksHTML += '</ul>';

  container.innerHTML = `
    <div class="ai-response" style="border-left-color: var(--accent-gold);">
      <div class="ai-response-header">
        <span class="ai-label" style="color: var(--accent-gold);">Morning Brief</span>
        <span class="confidence">${confidencePercent}% confident</span>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.125rem; margin-bottom: 0.75rem; color: var(--accent-gold);">
          Executive Summary
        </h3>
        <p style="font-size: 0.9375rem; line-height: 1.7;">
          ${sanitief.summary)}
        </p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.125rem; margin-bottom: 0.75rem;">
          Top 3 Priorities
        </h3>
        ${prioritiesHTML}
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.125rem; margin-bottom: 0.75rem;">
          Risk Factors
        </h3>
        ${risksHTML}
      </div>

      <div class="supporting-data">
        <strong>Strategic Recommendations:</strong><br>
        ${sanitizeHTML(brief.recommendations)}
      </div>
    </div>
  `;
}
