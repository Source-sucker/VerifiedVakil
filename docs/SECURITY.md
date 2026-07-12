# Security Threat Model & Mitigations

## Overview

This document outlines security considerations for Concourse, a FIFA World Cup 2026 operations console handling operational data and AI recommendations.

---

## Threat Model

### Assets to Protect
1. **Gemini API Key** - Enables AI functionality, must not be exposed
2. **Operational Data** - Gate occupancy, incidents, volunteer info
3. **AI Recommendations** - Integrity must be maintained

### Trust Boundaries
- **Client (Browser)** - Untrusted
- **API Proxy (Vercel)** - Trusted
- **Gemini API** - Trusted
- **Uploaded Files** - Untrusted

---

## Security Controls

### 1. API Key Protection (HIGH PRIORITY)

**Threat:** Exposed API key allows unauthorized usage.

**Mitigation:**
- Key stored server-side only in api/gemini.js
- Read from process.env.GEMINI_API_KEY
- Client calls /api/gemini proxy - never sees key
- .gitignore excludes .env

### 2. XSS Prevention (HIGH PRIORITY)

**Threat:** Malicious content could execute JavaScript.

**Mitigation:**
- All AI/user text sanitized via src/utils/sanitize.js
- Uses textContent instead of innerHTML
- HTML entities escaped

### 3. Supply Chain Security (HIGH PRIORITY)

**Threat:** Compromised CDN libraries.

**Mitigation:**
- All script tags include SRI hashes
- crossorigin="anonymous" attribute
- Pinned versions

### 4. File Upload Validation (MEDIUM)

**Threat:** Malicious files.

**Mitigation:**
- 50MB size limit
- Type whitelist: CSV, JSON, PDF
- Error handling for malformed files

### 5. Rate Limiting (MEDIUM)

**Threat:** API abuse.

**Mitigation:**
- 30 requests/minute per IP
- HTTP 429 when exceeded

### 6. Payload Size Validation (MEDIUM)

**Threat:** Large prompts.

**Mitigation:**
- 100KB max per request
- HTTP 413 if exceeded

---

## What is NOT Protected

1. No authentication system
2. No data encryption at rest
3. No CSRF protection (stateless API)

---

## Security Checklist

- [ ] No API key committed to git
- [ ] All script tags have SRI hashes
- [ ] All AI content sanitized
- [ ] File upload validation active
- [ ] Rate limiting configured
