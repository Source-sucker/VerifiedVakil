/**
 * Main app - router, state management, initialization
 * Vanilla JS, no framework
 */

import { initAnnouncer, announce } from './utils/a11y.js';
import { ingestFile, validateFile, updateDataModel, dataModel } from './modules/ingest.js';
import { initCrowdModule } from './modules/crowd.js';
import { initIncidentModule } from './modules/incident.js';
import { initNavigationModule } from './modules/navigation.js';
import { initTransitModule } from './modules/transit.js';
import { initMedicalModule } from './modules/medical.js';
import { initVolunteersModule } from './modules/volunteers.js';
import { initSustainabilityModule } from './modules/sustainability.js';
import { initTranslateModule } from './modules/translate.js';
import { initBriefModule } from './modules/brief.js';

// App state
const state = {
  currentModule: 'crowd',
  dataLoaded: false,
  modules: {}
};

/**
 * Initialize app
 */
function init() {
  console.log('Concourse initializing...');

  // Initialize accessibility
  initAnnouncer();

  // Initialize modules
  state.modules = {
    crowd: initCrowdModule(),
    incident: initIncidentModule(),
    navigation: initNavigationModule(),
    transit: initTransitModule(),
    medical: initMedicalModule(),
    volunteers: initVolunteersModule(),
    sustainability: initSustainabilityModule(),
    translate: initTranslateModule(),
    brief: initBriefModule()
  };

  // Set up navigation
  setupNavigation();

  // Set up file upload
  setupFileUpload();

  // Load sample data on first load
  loadSampleData();

  // Render initial module
  renderModule('crowd');

  // Render stadium map
  renderStadiumMap();

  announce('Concourse operations console loaded');
  console.log('Concourse ready');
}

/**
 * Set up navigation between modules
 */
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleName = btn.dataset.module;

      // Update active state
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Render module
      renderModule(moduleName);

      announce(`${moduleName} module activated`);
    });
  });

  // Set initial active
  document.querySelector('[data-module="crowd"]').classList.add('active');
}

/**
 * Set up file upload handling
 */
function setupFileUpload() {
  const fileInput = document.getElementById('file-upload');
  const statusEl = document.getElementById('upload-status');

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    const validation = validateFile(file);
    if (!validation.valid) {
      statusEl.textContent = validation.error;
      statusEl.style.color = 'var(--accent-signal)';
      announce(validation.error);
      return;
    }

    // Show loading
    statusEl.textContent = 'Processing...';
    statusEl.style.color = 'var(--text-secondary)';

    try {
      // Ingest file
      const result = await ingestFile(file);

      if (result.success) {
        // Update global data model
        updateDataModel(result);

        statusEl.textContent = `✓ Loaded ${result.rowCount} rows from ${file.name}`;
        statusEl.style.color = 'var(--accent-turf)';

        state.dataLoaded = true;

        // Refresh current module
        renderModule(state.currentModule);

        // Refresh stadium map
        renderStadiumMap();

        // Add insight
        addInsight(`Data uploaded: ${file.name}`, 'info');

        announce(`File ${file.name} uploaded successfully with ${result.rowCount} rows`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.style.color = 'var(--accent-signal)';
      announce(`Upload failed: ${error.message}`);
    }

    // Reset input
    fileInput.value = '';
  });
}

/**
 * Load sample data on first load
 */
async function loadSampleData() {
  try {
    const response = await fetch('sample-data/stadium_sample.csv');
    const text = await response.text();

    // Parse CSV
    const blob = new Blob([text], { type: 'text/csv' });
    const file = new File([blob], 'stadium_sample.csv', { type: 'text/csv' });

    const result = await ingestFile(file);

    if (result.success) {
      updateDataModel(result);
      state.dataLoaded = true;
      renderStadiumMap();
      addInsight('Sample data loaded', 'info');
    }
  } catch (error) {
    console.error('Sample data load error:', error);
    addInsight('Could not load sample data', 'warning');
  }
}

/**
 * Render specific module
 */
function renderModule(moduleName) {
  state.currentModule = moduleName;
  const moduleContent = document.getElementById('module-content');

  if (!state.modules[moduleName]) {
    moduleContent.innerHTML = '<p>Module not found</p>';
    return;
  }

  // Call module's render function
  const module = state.modules[moduleName];
  if (module && module.render) {
    moduleContent.innerHTML = '';
    module.render(moduleContent, dataModel);
  }
}

/**
 * Render stadium SVG map
 */
function renderStadiumMap() {
  const svg = document.getElementById('stadium-svg');
  if (!svg) return;

  // Clear existing
  svg.innerHTML = '';

  // If no gate data, show placeholder
  if (!dataModel.gates || dataModel.gates.length === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '400');
    text.setAttribute('y', '200');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'var(--text-secondary)');
    text.setAttribute('font-size', '14');
    text.textContent = 'Upload data to visualize gates';
    svg.appendChild(text);
    return;
  }

  // Render gates in circular layout
  const centerX = 400;
  const centerY = 200;
  const radius = 120;
  const gateCount = dataModel.gates.length;

  dataModel.gates.forEach((gate, index) => {
    const angle = (index / gateCount) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Determine risk level
    let riskClass = 'gate-low';
    if (gate.percentage >= 90) riskClass = 'gate-high';
    else if (gate.percentage >= 75) riskClass = 'gate-medium';

    // Gate circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '20');
    circle.classList.add('gate-node', riskClass);
    circle.setAttribute('role', 'button');
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('aria-label', `Gate ${gate.id}: ${gate.percentage.toFixed(0)}% capacity`);

    // Click to show details
    circle.addEventListener('click', () => showGateDetails(gate));
    circle.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showGateDetails(gate);
      }
    });

    svg.appendChild(circle);

    // Gate label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y + 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'var(--bg-base)');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', '600');
    label.setAttribute('pointer-events', 'none');
    label.textContent = gate.id;
    svg.appendChild(label);
  });

  // Stadium outline
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  outline.setAttribute('cx', centerX);
  outline.setAttribute('cy', centerY);
  outline.setAttribute('r', radius + 40);
  outline.setAttribute('fill', 'none');
  outline.setAttribute('stroke', 'var(--border-color)');
  outline.setAttribute('stroke-width', '2');
  outline.setAttribute('stroke-dasharray', '5,5');
  svg.prepend(outline);
}

/**
 * Show gate details in insight feed
 */
function showGateDetails(gate) {
  const message = `Gate ${gate.id}: ${gate.percentage.toFixed(1)}% capacity (${gate.current}/${gate.capacity}), status: ${gate.status}`;
  const level = gate.percentage >= 90 ? 'critical' : gate.percentage >= 75 ? 'warning' : 'info';
  addInsight(message, level);
  announce(message);
}

/**
 * Add insight to feed
 */
export function addInsight(message, level = 'info') {
  const feed = document.getElementById('insight-list');
  if (!feed) return;

  const item = document.createElement('div');
  item.className = `insight-item ${level}`;

  const time = document.createElement('span');
  time.className = 'insight-time';
  time.textContent = new Date().toLocaleTimeString();

  const text = document.createElement('span');
  text.textContent = message;

  item.appendChild(time);
  item.appendChild(text);

  // Prepend (newest first)
  feed.prepend(item);

  // Limit to 20 items
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for modules
export { state, dataModel, renderModule };
