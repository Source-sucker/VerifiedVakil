# Testing Documentation

## Overview

Concourse uses a zero-dependency test suite (`tests/run.js`) that runs with plain Node.js assertions.

---

## Running Tests

```bash
node tests/run.js
```

Expected output:
```
=== Sanitization Tests ===
✓ sanitizeHTML escapes basic HTML
✓ sanitizeHTML handles ampersands
✓ sanitizeHTML handles quotes
✓ sanitizeHTML returns empty string for non-string input

=== Data Ingestion Tests ===
✓ normalizeGate handles valid data
✓ normalizeGate calculates percentage correctly
✓ normalizeGate handles edge case: zero capacity
✓ normalizeGate handles negative current

=== Prompt Building Tests ===
✓ CROWD_ANALYSIS_PROMPT.build includes gate data
✓ INCIDENT_RESPONSE_PROMPT.build includes incident details

=== File Validation Tests ===
✓ validateFile rejects oversized files
✓ validateFile rejects unsupported types
✓ validateFile accepts valid CSV

=== Risk Calculation Tests ===
✓ getRiskLevel returns high for 90%+ capacity
✓ getRiskLevel returns medium for 75-89% capacity
✓ getRiskLevel returns low for <75% capacity

Passed: 16
Failed: 0
```

---

## Test Coverage

### Sanitization (XSS Prevention)

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Script tags | `<script>alert("xss")</script>` | `&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;` |
| Ampersands | `Ben & Jerry's` | `Ben &amp; Jerry's` |
| Quotes | `He said "hello"` | `He said &quot;hello&quot;` |
| Non-string | `null`, `undefined`, `123` | `""` (empty string) |

### Data Ingestion

| Test Case | Input | Expected Behavior |
|-----------|-------|-------------------|
| Valid gate data | `{gate_id: "1", capacity: 5000, current: 4200}` | Percentage = 84% |
| Zero capacity | `{capacity: 0, current: 100}` | Percentage = 0% (no division by zero) |
| Negative current | `{current: -100}` | Normalized to 0 |
| Missing required fields | `{capacity: 5000}` (no gate_id) | Throws error |

### Prompt Building

| Test Case | Expected Behavior |
|-----------|-------------------|
| CROWD_ANALYSIS_PROMPT | Includes all gate data with percentages |
| INCIDENT_RESPONSE_PROMPT | Includes type, location, description |
| WAYFINDING_PROMPT | Includes from/to locations |
| TRANSLATION_PROMPT | Includes source text and target language |

### File Validation

| Test Case | File Size | File Type | Expected |
|-----------|-----------|-----------|----------|
| Valid CSV | 1 KB | .csv | Accepted |
| Oversized file | 60 MB | .csv | Rejected (>50MB limit) |
| Invalid type | 1 KB | .exe | Rejected (not in whitelist) |
| Valid PDF | 5 MB | .pdf | Accepted |

### Risk Calculation

| Occupancy % | Expected Risk Level |
|-------------|---------------------|
| 92% | high |
| 80% | medium |
| 60% | low |
| 90% (threshold) | high |
| 75% (threshold) | medium |

---

## Manual QA Checklist

### Functional Testing

**Data Upload:**
- [ ] Upload CSV file - data appears in modules
- [ ] Upload JSON file - data parses correctly
- [ ] Upload PDF file - text extracted
- [ ] Upload invalid file - error message shown
- [ ] Upload oversized file (>50MB) - rejected

**Module Navigation:**
- [ ] Click each module button - correct content loads
- [ ] Active module highlighted
- [ ] Module content persists when switching back

**AI Recommendations:**
- [ ] Crowd Intelligence - analyzes gates, shows risk level
- [ ] Incident Command - generates response plan
- [ ] Wayfinding - provides step-by-step directions
- [ ] Translation - translates message to selected language
- [ ] Morning Brief - synthesizes across all modules

**Stadium Map:**
- [ ] Gates render in circular layout
- [ ] Gate colors reflect risk (green/yellow/red)
- [ ] Clicking gate shows details in insight feed
- [ ] Map updates when new data uploaded

**Insight Feed:**
- [ ] New insights appear at top
- [ ] Timestamps accurate
- [ ] Different severity levels (info/warning/critical)
- [ ] Feed limited to 20 items

### Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs (if added)

**Screen Reader:**
- [ ] aria-live announcements for AI updates
- [ ] aria-label on icon-only controls
- [ ] Semantic HTML (button, nav, main, aside)
- [ ] Skip to main content link works

**Color Contrast:**
- [ ] Text meets WCAG AA (4.5:1 ratio)
- [ ] Risk indicators have text + color
- [ ] Focus indicators visible

**Reduced Motion:**
- [ ] prefers-reduced-motion respected
- [ ] No essential info conveyed by animation alone

### Browser Compatibility

- [ ] Chrome/Edge 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

### Responsive Design

- [ ] Desktop (1920x1080) - full layout
- [ ] Tablet (768x1024) - stacked modules
- [ ] Mobile (375x667) - single column

### Performance

- [ ] Initial page load < 2s
- [ ] AI recommendation latency < 5s
- [ ] File upload (10MB CSV) processes < 10s
- [ ] No memory leaks after 50+ interactions

### Error Handling

- [ ] Gemini API timeout - user-friendly error
- [ ] Malformed AI response - graceful fallback
- [ ] Network offline - clear message
- [ ] Invalid file format - specific error text

---

## CI/CD Integration

GitHub Actions runs tests on every push:

```.github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: node tests/run.js
```

---

## Adding New Tests

Template for new test case:

```javascript
test('Feature name - expected behavior', () => {
  // Arrange
  const input = {...};
  
  // Act
  const result = functionUnderTest(input);
  
  // Assert
  assert.strictEqual(result.property, expectedValue);
  assert.ok(result.valid, 'Should be valid');
});
```

---

## Known Limitations

1. **No E2E tests** - Manual browser testing required
2. **No visual regression** - UI changes need manual review
3. **No load testing** - Performance validated manually
4. **No Gemini API mocking** - Real API calls in manual testing only
