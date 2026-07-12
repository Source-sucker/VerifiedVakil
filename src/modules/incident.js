/**
 * Module 2: Incident Command
 * Incident triage and response protocol recommendations
 */

import { callGemini, parseAIResponse } from '../ai/gemini-client.js';
import { INCIDENT_RESPONSE_PROMPT } from '../ai/prompts.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';
import { addInsight } from '../app.js';

export function initIncidentModule() {
  return {
    name: 'Incident Command',
    render: renderIncident
  };
}

function renderIncident(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Incident Command</h2>
    <p class="module-subtitle">Real-time incident triage and response protocols</p>

    <div class="card">
      <h3 class="card-title">Report Incident</h3>
      <form id="incident-form" style="display: grid; gap: 1rem;">
        <div>
          <label for="incident-type" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Incident Type
          </label>
          <select id="incident-type" class="btn" style="width: 100%;" required>
            <option value="">Select type...</option>
            <option value="medical">Medical Emergency</option>
            <option value="fire">Fire/Evacuation</option>
            <option value="security">Security Incident</option        <option value="weather">Weather Event</option>
            <option value="facility">Facility Issue</option>
          </select>
        </div>

        <div>
          <label for="incident-location" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Location
          </label>
          <input type="text" id="incident-location" class="btn" style="width: 100%;"
                 placeholder="e.g., Zone A, Gate 3, Section 105" required>
        </div>

        <div>
          <label for="incident-description" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
            Description
          </label>
          <textarea id="incident-description" class="btn" style="width: 100%; min-height: 80px; resize: vertical; font-family: var(--font-data);"
                    placeholder="Brief description of the incident..." required></textarea>
        </div>

        <button type="submit" class="btn btn-primary">Generate Response Plan</button>
      </form>
    </div>

    <div id="incident-response"></div>

    <div id="incident-log">
      <h3 style="font-family: var(--font-display); font-size: 1.25rem; margin: 2rem 0 1rem;">
        Incident Log
      </h3>
      <div id="incident-list"></div>
    </div>
  `;

  // Render existing incidents
  renderIncidentLog(dataModel);

  // Set up form
  const form = document.getElementById('incident-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleIncidentReport(dataModel);
  });
}

function renderIncidentLog(dataModel) {
  const listEl = document.getElementById('incident-list');

  if (!dataModel.events || dataModel.events.length === 0) {
    listEl.innerHTML = '<p class="card" style="color: var(--text-secondary);">No incidents logged.</p>';
    return;
  }

  // Sort by timestamp descending
  const sorted = [...dataModel.events].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  let html = '';

  sorted.forEach(event => {
    const badgeClass = event.severity === 'critical' ? 'badge-critical' :
                       event.severity === 'high' ? 'badge-high' :
                       event.severity === 'medium' ? 'badge-medium' : 'badge-low';

    const time = new Date(event.timestamp).toLocaleTimeString();

    html += `
      <div class="card">
        <div class="card-header">
          <span class="badge ${badgeClass}">${sanitizeHTML(event.severity)}</span>
          <span class="card-meta">${time}</span>
        </div>
        <div class="card-body">
          <strong>${sanitizeHTML(event.type)}</strong> at ${sanitizeHTML(event.location)}<br>
          <span style="color: var(--text-secondary); font-size: 0.875rem;">
            ${sanitizeHTML(event.description || 'No description')}
          </span>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

async function handleIncidentReport(dataModel) {
  const type = document.getElementById('incident-type').value;
  const location = document.getElementById('incident-location').value;
  const description = document.getElementById('incident-description').value;
  const responseEl = document.getElementById('incident-response');
  const submitBtn = document.querySelector('#incident-form button[type"]');

  if (!type || !location || !description) return;

  // Disable submit
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Generating plan...';

  responseEl.innerHTML = '<div class="card"><span class="loading"></span> Generating response protocol...</div>';

  try {
    // Build prompt
    const prompt = INCIDENT_RESPONSE_PROMPT.build(type, location, description);

    // Call Gemini
    const responseText = await callGemini(prompt, { temperature: 0.7 });

    // Parse JSON
    const response = parseAIResponse(responseText);

    if (!response) {
      throw new Error('Could not parse AI response');
    }

    // Add to event log
    const event = {
      id: `incident-${Date.now()}`,
      type,
      location,
      description,
      severity: response.severity,
      timestamp: new Date().toISOString()
    };
    dataModel.events.push(event);

    // Render response
    renderIncidentResponse(response, responseEl);

    // Refresh log
    renderIncidentLog(dataModel);

    // Add insight
    addInsight(`${type} incident reported at ${location}`,
               response.severity === 'critical' || response.severity === 'high' ? 'critical' : 'warning');

    announce(`Incident response plan generated for ${type} at ${location}`);

    // Reset form
    document.getElementById('incident-form').reset();

  } catch (error) {
    console.error('Incident response error:', error);
    responseEl.innerHTML = `<div class="card" style="border-left-color: var(--accent-signal);">
      <p><strong>Response generation failed:</strong> ${sanitizeHTML(error.message)}</p>
    </div>`;
    announce('Response generation failed');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Generate Response Plan';
  }
}

function renderIncidentResponse(response, container) {
  const badgeClass = response.severity === 'critical' ? 'badge-critical' :
                     response.severity === 'high' ? 'badge-high' :
                     response.severity === 'medium' ? 'badge-medium' : 'badge-low';

  const confidencePercent = Math.round(response.confidence * 100);

  let actionsHTML = '<ol style="margin: 0.5rem 0; padding-left: 1.5rem;">';
  response.immediate_actions.forEach(action => {
    actionsHTML += `<li style="margin-bottom: 0.25rem;">${sanitizeHTML(action)}</li>`;
  });
  actionsHTML += '</ol>';

  let resourcesHTML = '<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">';
  response.resources_needed.forEach(resource => {
    resourcesHTML += `<li style="margin-bottom: 0.25rem;">${sanitizeHTML(resource)}</li>`;
  });
  resourcesHTML += '</ul>';

  container.innerHTML = `
    <div class="ai-response">
      <div class="ai-response-header">
        <span class="ai-label">Response Protocol</span>
        <span class="confidence" aria-label="Confidence level">${confidencePercent}% confident</span>
      </div>

      <div style="margin-bottom: 1rem;">
        <span class="badge ${badgeClass}" role="status">
          ${sanitizeHTML(response.severity.toUpperCase())} SEVERITY
        </span>
      </div>

      <div style="margin-bottom: 1rem;">
        <strong>Immediate Actions:</strong>
        ${actionsHTML}
      </div>

      <div style="margin-bottom: 1rem;">
        <strong>Resources Needed:</strong>
        ${resourcesHTML}
      </div>

      <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-base); border-radius: 2px;">
        <strong>Communication Template:</strong><br>
        <span style="font-size: 0.875rem; font-style: italic;">
          ${sanitizeHTML(response.communication_template)}
        </span>
      </div>

      <div class="supporting-data">
        <strong>Escalation Criteria:</strong><br>
        ${sanitizeHTML(response.escalation_criteria)}
      </div>

      <div class="alternative" style="margin-top: 0.75rem;">
        <strong>Reasoning:</strong> ${sanitizeHTML(response.reasoning)}
      </div>
    </div>
  `;
}
