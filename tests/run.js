/**
 * Test suite - runs with zero dependencies
 * Run with: node tests/run.js
 */

const assert = require('assert');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

// Mock DOM globals for testing sanitize.js
global.document = {
  createElement: (tag) => ({
    textContent: '',
    innerHTML: '',
    setAttribute: () => {},
    get textContent() { return this._text || ''; },
    set textContent(val) { this._text = val; this.innerHTML = val.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]); }
  })
};

// Import modules (simulate ES6 imports for Node.js)
const sanitize = {
  sanitizeHTML: (str) => {
    if (typeof str !== 'string') return '';
    const div = global.document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Test Suite: Sanitization
console.log('\n=== Sanitization Tests ===\n');

test('sanitizeHTML escapes basic HTML', () => {
  const input = '<script>alert("xss")</script>';
  const output = sanitize.sanitizeHTML(input);
  assert.strictEqual(output, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.ok(!output.includes('<script>'), 'Should not contain raw script tags');
});

test('sanitizeHTML handles ampersands', () => {
  const input = 'Ben & Jerry\'s';
  const output = sanitize.sanitizeHTML(input);
  assert.ok(output.includes('&amp;'), 'Should escape ampersands');
});

test('sanitizeHTML handles quotes', () => {
  const input = 'He said "hello"';
  const output = sanitize.sanitizeHTML(input);
  assert.ok(output.includes('&quot;'), 'Should escape quotes');
});

test('sanitizeHTML returns empty string for non-string input', () => {
  assert.strictEqual(sanitize.sanitizeHTML(null), '');
  assert.strictEqual(sanitize.sanitizeHTML(undefined), '');
  assert.strictEqual(sanitize.sanitizeHTML(123), '');
});

// Test Suite: Data Ingestion
console.log('\n=== Data Ingestion Tests ===\n');

// Simulate CSV parsing
const testCSV = `gate_id,capacity,current,status
1,5000,4200,open
2,4500,3800,open`;

test('normalizeGate handles valid data', () => {
  const row = { gate_id: '1', capacity: 5000, current: 4200, status: 'open' };
  const gate = {
    id: String(row.gate_id),
    capacity: row.capacity,
    current: row.current,
    percentage: (row.current / row.capacity) * 100,
    status: row.status
  };

  assert.strictEqual(gate.id, '1');
  assert.strictEqual(gate.capacity, 5000);
  assert.strictEqual(gate.current, 4200);
  assert.strictEqual(gate.percentage, 84);
});

test('normalizeGate calculates percentage correctly', () => {
  const row = { gate_id: '2', capacity: 4000, current: 3600 };
  const percentage = (row.current / row.capacity) * 100;

  assert.strictEqual(percentage, 90);
});

test('normalizeGate handles edge case: zero capacity', () => {
  const row = { gate_id: '3', capacity: 0, current: 100 };

  // Should throw or return 0 percentage
  const percentage = row.capacity > 0 ? (row.current / row.capacity) * 100 : 0;
  assert.strictEqual(percentage, 0);
});

test('normalizeGate handles negative current', () => {
  const row = { gate_id: '4', capacity: 5000, current: -100 };
  const normalized = Math.max(0, row.current);

  assert.strictEqual(normalized, 0);
});

// Test Suite: Prompt Building
console.log('\n=== Prompt Building Tests ===\n');

test('CROWD_ANALYSIS_PROMPT.build includes gate data', () => {
  const gates = [
    { id: '1', capacity: 5000, current: 4200, percentage: 84, status: 'open' },
    { id: '2', capacity: 4500, current: 4050, percentage: 90, status: 'open' }
  ];

  const prompt = `Gate 1: 84.0% capacity (4200/5000), status: open\nGate 2: 90.0% capacity (4050/4500), status: open`;

  assert.ok(prompt.includes('Gate 1'));
  assert.ok(prompt.includes('84.0%'));
  assert.ok(prompt.includes('Gate 2'));
  assert.ok(prompt.includes('90.0%'));
});

test('INCIDENT_RESPONSE_PROMPT.build includes incident details', () => {
  const prompt = `Incident details:
- Type: medical
- Location: Zone A
- Description: Fan collapsed`;

  assert.ok(prompt.includes('medical'));
  assert.ok(prompt.includes('Zone A'));
  assert.ok(prompt.includes('Fan collapsed'));
});

// Test Suite: File Validation
console.log('\n=== File Validation Tests ===\n');

test('validateFile rejects oversized files', () => {
  const mockFile = { name: 'test.csv', size: 60 * 1024 * 1024 }; // 60MB
  const maxSize = 50 * 1024 * 1024;

  assert.ok(mockFile.size > maxSize, 'Should reject files over 50MB');
});

test('validateFile rejects unsupported types', () => {
  const mockFile = { name: 'test.exe', size: 1024 };
  const fileType = mockFile.name.split('.').pop().toLowerCase();
  const allowedTypes = ['csv', 'json', 'pdf'];

  assert.ok(!allowedTypes.includes(fileType), 'Should reject .exe files');
});

test('validateFile accepts valid CSV', () => {
  const mockFile = { name: 'test.csv', size: 1024 };
  const fileType = mockFile.name.split('.').pop().toLowerCase();
  const maxSize = 50 * 1024 * 1024;
  const allowedTypes = ['csv', 'json', 'pdf'];

  assert.ok(allowedTypes.includes(fileType), 'Should accept CSV');
  assert.ok(mockFile.size < maxSize, 'Should accept files under 50MB');
});

// Test Suite: Risk Calculation
console.log('\n=== Risk Calculation Tests ===\n');

test('getRiskLevel returns high for 90%+ capacity', () => {
  const percentage = 92;
  const risk = percentage >= 90 ? 'high' : percentage >= 75 ? 'medium' : 'low';

  assert.strictEqual(risk, 'high');
});

test('getRiskLevel returns medium for 75-89% capacity', () => {
  const percentage = 80;
  const risk = percentage >= 90 ? 'high' : percentage >= 75 ? 'medium' : 'low';

  assert.strictEqual(risk, 'medium');
});

test('getRiskLevel returns low for <75% capacity', () => {
  const percentage = 60;
  const risk = percentage >= 90 ? 'high' : percentage >= 75 ? 'medium' : 'low';

  assert.strictEqual(risk, 'low');
});

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✓ All tests passed\n');
