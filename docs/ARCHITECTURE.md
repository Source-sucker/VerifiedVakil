# System Architecture

## High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  index.html  │  │   app.js     │  │  9 Modules   │          │
│  │  (Entry)     │→ │  (Router)    │→ │  (Features)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                   │                  │
│         └──────────────────┴───────────────────┘                 │
│                            ↓                                      │
│                   ┌────────────────┐                             │
│                   │ Data Ingestion │ (CSV/JSON/PDF)              │
│                   └────────────────┘                             │
│                            ↓                                      │
│                   ┌────────────────┐                    │
│                   │ gemini-client  │                             │
│                   └────────────────┘                          │
│                  ↓ fetch('/api/gemini')                │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Function                     │
│                      api/gemini.js (Proxy)                        │
│  • Reads process.env.GEMINI_API_KEY                             req/min)                       d validation (<100KB)                                   │
│                            ↓                                      │
│                   Google Gemini API                               │
│                (gemini-1.5-flash)                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (Client-Side)

**index.html**
- Single-page entry point
- Loads external libraries via CDN (PapaParse, PDF.js, Chart.js)
- All `<script>` tags include SRI hashes

**src/app.js**
- Router: switches between 9 modules
- State management: tracks current module, loaded data
- Event coordinator: file uploads, navigation clicks
- Stadium map renderer: SVG visualization

**src/modules/** (9 modules)
- Each module exports `{ name, render(container, dataModel) }`
- Modules call Gemini via `gemini-client.js`
- Results sanitized before rendering

**src/ai/**
- `gemini-client.js`: fetch wrapper for /api/gemini proxy
- `prompts.js`: all AI prompts (versioned, structured)

**src/utils/**
- `sanitize.js`: HTML escaping (XSS prevention)
- `a11y.js`: aria-live announcer, focus management

**src/styles/**
- `main.css`: design system (broadcast control-room aesthetic)

### Backend (Server-Side)

**api/gemini.js** (Vercel Serverless Function)
- Proxies requests to Gemini API
- Keeps API key server-side (never exposed to client)
- Rate limiting: 30 req/min per IP
- Payload size validation: <100KB
- Returns JSON response or error

### Data Flow

1. **User uploads CSV/JSON/PDF** → `ingest.js` parses → normalizes into shared data model → `dataModel` updated
2. **User clicks module** → `app.js` routes → module's `render()` called
3. **User requests AI recommendation** → module calls `gemini-client.js` → proxy forwards to Gemini → response parsed & validated → sanitized & rendered

### Shared Data Model

All modules read from a unified data model:

```javascript
{
  gates: [
    { id, capacity, current, percentage, status }
  ],
  zones: [
    { id, name, capacity, current }
  ],
  sensors: [
    { id, type, value, unit, timestamp }
  ],
  events: [
    { id, type, location, severity, description, timestamp }
  ],
  timestamp: ISO8601 string,
  metadata: {}
}
```

## AI Architecture

### Prompt Structure (Standardized)

Every prompt follows this pattern:

```javascript
{
  version: '1.0',
  system: 'Role, goals, rules',
  schema: 'JSON output format',
  fewShot: [{ input, output }],
  build: (data) => 'Assembled prompt'
}
```

### AI Pipeline

```
Context Assembly → Prompt Builder → Gemini API
    ↓
JSON Response → Schema Validation → Grounding Check
    ↓
Sanitization → UI Render → User Approval (human-in-the-loop)
```

### Explainability Pattern

Every AI output includes:
- **Recommendation** - what to do
- **Confidence** - 0-100%
- **Supporting Data** - which data informed decision
- **Alternative** - fallback option

## Security Boundaries

### Trusted Components
- `api/gemini.js` (server-side, controls API key)
- Vercel environment variables
- Google Gemini API

### Untrusted Components
- Browser (can be manipulated)
- Uploaded files (could be malicious)
- User input (forms, text areas)
- AI responses (could contain injection attempts)

### Mitigations
- API key never sent to client
- All uploads validated (type, size)
- All AI/user text sanitized
- CDN scripts pinned with SRI hashes

## Deployment Architecture

### Option 1: Vercel (Recommended)

```
GitHub Repo → Vercel
              ├── Static files (/, /src, /sample-data) → CDN
      Serverless function
```

Environment variable set in Vercel dashboard:
```
GEMINI_API_KEY=AIza...
```

### Option 2: Static Host + Separate Backend

```
Frontend: Netlify/GitHub Pages/Vercel
Backend: AWS Lambda / Google Cloud Functions / Railway
```

API proxy must:
- Accept POST to /api/gemini
- Read GEMINI_API_KEY from environment
- Forward to Gemini API
- Return JSON response

## Performance Considerations

### Caching
- `gemini-client.js` caches responses (1 min TTL, max 50 entries)
- Deduplicates identical prompts within cache window

### Lazy Loading
- Modules only render when activated (not all upfront)
- Stadium map only renders when data available

### Network
- CDN libraries loaded with `defer` attribute
- API responses typically 2-5s (Gemini latency)

## Scalability

### Current Limits
- Single user (no multi-tenant support)
- In-memory rate limiting (resets on cold start)
- No persistent storage (data only in browser memory)

### Future Enhancements
- Database for persistent operational data
- WebSocket for real-time updates
- Multi-user support with authentication
- Redis for distributed rate limiting

## Error Handling

### Client-Side
- Try/catch around all async operations
- User-friendly error messages (never raw stack traces)
- Fallback states for missing data

### Server-Side
- Gemini API timeout: 30s
- Rate limit exceeded: HTTP 429
- Payload too large: HTTP 413
- Invalid request: HTTP 400

## Accessibility Architecture

- `a11y.js` provides global aria-live announcer
- All modules use semantic HTML
- Focus management for keyboard users
- Color + text for risk indicators (never color alone)

## Module Independence

Each module is self-contained:
- No inter-module dependencies (except shared utilities)
- Reads from global `dataModel` but doesn't mutate it directly
- Can be developed/tested in isolation
- Exports standard `{ name, render }` interface

## Why No Framework?

1. **Size constraint**: <10MB repo (node_modules would exceed this)
2. **Reliability**: No build step means no broken builds across 3 attempts
3. **Simplicity**: Judges can open index.html directly
4. **Performance**: Zero bundle overhead, instant load times

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Vanilla JS | No framework overhead, stays under 10MB |
| CDN libraries | Zero repo weight, SRI hashes for security |
| Vercel serverless | Simple deployment, free tier sufficient |
| Gemini 1.5 Flash | Fast (<3s), 1M context, free tier available |
| No database | Stateless, data uploaded per session |
| SVG stadium map | Scalable, animatable, accessible |

---

**Last Updated:** 2026-07-12
