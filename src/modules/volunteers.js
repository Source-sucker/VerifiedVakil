/**
 * Module 6: Volunteer Coordination
 * Volunteer roster and reallocation suggestions
 */

import { sanitizeHTML } from '../utils/sanitize.js';
import { announce } from '../utils/a11y.js';

export function initVolunteersModule() {
  return {
    name: 'Volunteer Coordination',
    render: renderVolunteers
  };
}

function renderVolunteers(container, dataModel) {
  container.innerHTML = `
    <h2 class="module-title">Volunteer Coordination</h2>
    <p class="module-subtitle">Volunteer staffing and zone allocation</p>

    <div class="card">
      <h3 class="card-title">Volunteer Roster</h3>
      <div id="volunteer-roster"></div>
    </div>

    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 1rem;">
      Upload a CSV file with volunteer data (role, status, zone) to enable AI-powered reallocation suggestions based on crowd risk levels.
    </p;

  renderVolunteerRoster(dataModel);
  announce('Volunteer coordination module loaded');
}

function renderVolunteerRoster(dataModel) {
  const rosterEl = document.getElementById('volunteer-roster');

  // Mock volunteer data
  const volunteers = [
    { id: 'V001', role: 'Usher', zone: 'Zone A', status: 'Active' },
    { id: 'V002', role: 'Usher', zone: 'Zone B', status: 'Active' },
    { id: 'V003', role: 'Security', zone: 'Gate 3', status: 'Active' },
    { id: 'V004', role: 'Info Desk', zone: 'Main Entrance', status: 'Break' },
    { id: 'V005', role: 'Usher', zone: 'Zone C', status: 'Active' }
  ];

  let html = '<table style="width: 100%; font-size: 0.875rem; border-collapse: collapse;">';
  html += `
    <thead>
      <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
        <th style="padding: 0.5rem 0;">ID</th>
        <th style="padding: 0.5rem 0;">Role</th>
        <th style="padding: 0.5rem 0;">Zone</th>
        <th style="padding: 0.5rem 0;">Status</th>
      </tr>
    </thead>
    <tbody>
  `;

  volunteers.forEach(v => {
    const badgeClass === 'Active' ? 'badge-low' : 'badge-medium';

    html += `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.5rem 0; font-family: var(--font-data);">${sanitizeHTML(v.id)}</td>
        <td style="padding: 0.5rem 0;">${sanitizeHTML(v.role)}</td>
        <td style="padding: 0.5rem 0;">${sanitizeHTML(v.zone)}</td>
        <td style="padding: 0.5rem 0;"><span class="badge ${badgeClass}">${sanitizeHTML(v.status)}</span></td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  rosterEl.innerHTML = html;
}
