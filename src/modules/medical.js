/**
 * Module 5: Medical Ops
 * Medical incident tracking and resource allocation
 */

import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';

export function initMedicalModule() {
  return {
    name: 'Medical Ops',
    render: renderMedical
  };
}

function renderMedical(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Medical Ops</h2>
    <p class="module-subtitle">Medical resource allocation and response coordination</p>

    <div class="card">
      <h3 class="card-title">Medical Resources</h3>
      <div style="display: grid; gap: 0.75rem;">
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-base); border-radius: 2px;">
          <span>EMTs Available</span>
          <span style="font-family: var(--font-data); font-weight: 600;">8</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-base); border-radius: 2px;">
          <span>Medical Stations</span>
          <span style="font-family: var(--font-data); font-weight: 600;">4</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-base); border-radius: 2px;">
          <span>Ambulances on Standby</span>
          <span style="font-family: var(--font-data); font-weight: 600;">2</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">Response Guidelines</h3>
      <div style="font-size: 0.875rem; line-height: 1.6;">
        <p style="margin-bottom: 0.5rem;"><strong>Priority 1:</strong> Life-threatening - 90 seconds</p>
        <p style="margin-bottom: 0.5rem;"><strong>Priority 2:</strong> Urgent - 5 minutes</p>
        <p><strong>Priority 3:</strong> Standard - 15 minutes</p>
      </div>
    </div>

    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 1rem;">
      Medical incidents are logged through the Incident Command module.
    </p>
  `;

  announce('Medical ops module loaded');
}
