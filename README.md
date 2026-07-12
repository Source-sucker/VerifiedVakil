# Concourse

**AI Operations Copilot for FIFA World Cup 2026**

Concourse is a production-ready AI-native operations console built for Stadium Operations Directors managing FIFA World Cup 2026 match-day operations. It synthesizes real-time data across 9 operational dimensions and provides AI-powered recommendations with full explainability, confidence scoring, and human-in-the-loop workflows.

---

## Chosen Vertical & Persona

**Primary Persona:** Stadium Operations Director

**Coverage:** All FIFA World Cup 2026 operational dimensions, unified under a single console:

| Module | Brief Dimension Covered |
|--------|------------------------|
| 1. Crowd Intelligence | Crowd management |
| 2. Incident Command | Operational intelligence, real-time decision support |
| 3. Wayfinding & Navigation | Navigation |
| 4. Transit Intelligence | Transportation |
| 5. Medical Ops | Real-time decision support (safety) |
| 6. Volunteer Coordination | Organizers/venue staff persona coverage |
| 7. Sustainability Telemetry | Sustainability |
| 8. Multilingual Fan Assistance | Multilingual assistance, accessibility |
| 9. AI Morning Brief & Analytics | Operational intelligence (synthesis layer) |

---

## Approach & Logic

### "Justify, Don't Just Answer"

Every AI recommendation includes:
- **Recommendation** - actionable suggestion
- **Confidence Score** - percentage (0-100%)
- **Supporting Data** - which data points informed the decision
- **Alternative Action** - fallback option

This transparency pattern ensures Stadium Operations Directors can:
1. Trust AI outputs with explainable reasoning
2. Override with informed alternatives
3. Build audit trails for post-event analysis

### AI Architecture

```
User Input → Context Assembly → Gemini API (via /api/gemini proxy)
           → JSON Schema Validation  client - proxied through Vercel serverless function.

---

## How to Run Locally

### Quick Start (No Build Required)

1. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd concourse
   ```

2. **Set up API key:**
   - Get a free Gemini API key: https://aistudio.google.com/app/apikey
  ly:**
   ```bash
   # Option 1: Python
   python3 -m http.server 8000

   # Option 2: Node.js
   npx serve

   # Option 3: PHP
   php -S localhost:8000
   ```

4. **Open browser:**
   ```
   http://localhost:8000
   ```

### Deploy to Vercel (Production)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variable in Vercel dashboard:
# GEMINI_API_KEY=your_key_here
```

---

## How to Test with Your Own Data

### Supported Formats: CSV, JSON, PDF

#### CSV Format (Gates/Zones/Sensors)

**Gates:**
```csv
gate_id,capacity,current,status
1,5000,4200,open
2,4500,3800,open
```

**Zones:**
```csv
zone_id,name,capacity,current
A,Section A,10000,8500
B,Section B,8000,6200
```

**Sensors:**
```csv
sensor_id,type,value,unit,timestamp
S001,temperature,28.5,celsius,2026-06-15T14:30:00Z
S002,humidity,65,percent,2026-06-15T14:30:00Z
```

#### JSON Format

```json
{
  "gates": [
    {"gate_id": "1", "capacity": 5000, "current": 4200, "status": "open"}
  ],
  "zones": [
    {"zone_id": "A", "name": "Section A", "capacity": 10000, "current": 8500}
  ]
}
```

#### PDF Format

Upload incident reports, operational procedures, or venue documentation. The system extracts text and makes it available to AI modules.

#oad Instructions

1. Click **"Upload Data"** button in header
2. Select CSV/JSON/PDF file (max 50MB)
3. System automatically:
   - Validates file format
   - Parses and normalizes data
   - Updates all modules in real-time
   - Refreshes stadium visualization

---

## Assumptions

1. **Data Model:** Sample data represents a generic 40,000-capacity stadium with 8 gates
2. **Language Detection:** Multilingual module infers context from uploaded ticket/attendee data when available
3. **Real-time Updates:** System designed for periodic uploads (every 1-5 minutes), not sub-second streaming
4. **Connectivity:** Assumes stable internet for Gemini API calls (typical response: 2-5 seconds)
5. **Permissions:** Stadium Operations Director has authority to approve/reject AI recommendations

---

## API Key Setup

### Gemini API (Required)

1. Visit: https://aistudio.google.com/app/apikey
2. Create new API key (free tier: 60 requests/minute)
3. Copy key to `.env` file:
   ```
   GEMINI_API_KEY=AIza...your_key_here
   ```

**Security Note:** The key is read server-side only by `api/gemini.js`. Client-side code never sees it.

---

## Architecture

### Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework, no build step)
- **AI:** Google Gemini 1.5 Flash via `/api/gemini` proxy
- **External Libraries:** PapaParse (CSV), PDF.js (PDF), Chart.js (future) - loaded via CDN with SRI hashes
- **Deployment:** Vercel (serverless functions), or any static host + serverless backend

### Repository Structure

```
/
├── index.html              # Single-page app entry
├── /src
│   ├── app.js              # Router & state management
│   ├── /modules            # 9 operational modules
│   ├── /ai                 # Gemini client & prompts
│   ├── /utils              # Sanitization & accessibility
│   └── /styles             # Design system CSS
├── /api
│   └── gemini.js           # Vercel serverless function (API key proxy)
├── /sample-data
│   └─URITY.md
│   └── TESTING.md
├── .env.example
├── .gitignore
└── README.md
```

---

## Testing

### Automated Tests

```bash
node tests/run.js
```

Covers:
- HTML sanitization (XSS prevention)
- Data ingestion & normalization
- Prompt building
- File validation
- Risk calculation logic

### Manual QA Checklist

- [ ] Upload CSV/JSON/PDF files
- [ ] Navigate between all 9 modules
- [ ] Generate AI recommendations (crowd, incident, navigation, translation)
- [ ] Test accessibility (keyboard navigation, screen reader)
- [ ] Test on mobile/tablet viewports
- [ ] Verify stadium map updates on data upload

---

## Design System

**Inspiration:** Broadcast control-room, not generic AI dashboard

**Colors:**
- Base: `#0E1A24` (deep steel-blue)
- Panel: `#16283A`
- Turf (nominal): `#4C7A5E`
- Gold (attention): `#C9A227`
- Signal (critical): `#B5432E`

**Typography:**
- Display: IBM Plex Sans Condensed (broadcast scoreboard feel)
- Data/Metrics: IBM Plex Mono (instrumentation clarity)

**Signature Element:** SVG stadium map with gates pulsing green/gold/red based on live risk levels

---

## Accessibility (WCAG 2.1 AA)

- ✓ Full keyboard navigation (no mouse-only controls)
- ✓ Semantic HTML (`<button>`, `<nav>`, not `<div onclick>`)
- ✓ Color never the only signal (risk shown via text/icon + color)
- ✓ Sufficient contrast ratios (4.5:1 for text)
- ✓ `aria-label` on icon-only controls
- ✓ `aria-live` announcements for AI updates
- ✓ `prefers-reduced-motion` support
- ✓ Screen reader tested (VoiceOver, NVDA)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## Development

### No Build Step

This project intentionally avoids npm/webpack/vite to:
1. Stay under 10MB repository size limit
2. Avoid broken builds across 3 submission attempts
3. Ensure judges can open `index.html` directly

### Code Quality

- Vanilla JS modules (ES6 import/export)
- Consistent error handling (try/catch with user-facing fallbacks)
- HTML sanitization on all AI/user content (XSS prevention)
- Rate limiting on API proxy (30 req/min per IP)

---

## License

MIT

---

## Contact

For questions about this submission, refer to repository issues or project documentation.
