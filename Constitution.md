# PROJECT CONSTITUTION (v3 — aligned to the official 5-category tiered rubric)
## Smart Stadiums & Tournament Operations — FIFA World Cup 2026
### Operating manual for Claude Code + Antigravity. Read this fully before writing any code.

> **v3 rationale (corrected):** The official brief names 5 evaluated categories — Code Quality, Security, Efficiency, Testing, Accessibility — each internally tiered High/Medium/Low by how much it moves your score (exact sub-criteria not published; see Section 7). Separately, a benchmark submission scoring 97.5 covers nearly every noun in the brief (navigation, crowd management, transportation, sustainability, volunteers, medical, security incidents, analytics) as distinct modules under one console, while a narrower single-persona-only build scored 67.39 — suggesting breadth across the brief's named dimensions helps, likely by strengthening how "maintainability" and "functionality" read against the chosen persona/vertical (Section 7.6), even though it isn't a separately named category. This version keeps one persona as the coherence spine but builds a module for every dimension the brief lists, prioritized by the tiers in Section 7. I have not seen either submission's actual repository — the breadth inference is from public frontends only, not confirmed code-level scoring.

---

## 0. Non-negotiable hard constraints (violate these and you don't get scored)

| Constraint | Rule | Why it matters |
|---|---|---|
| Attempts | Max 3 submission attempts | Don't burn one on a broken `npm install`. Vanilla stack avoids this entirely. |
| Repo size | < 10 MB total | No `node_modules`, no video files, no unoptimized PNGs, no `.git` bloat from force-pushing large binaries |
| Repo visibility | Public | Set at creation, not after |
| Branches | Exactly ONE branch (`main`) | Never create `feature/*` branches. Commit straight to main. |
| Real data | App must accept uploaded CSV/JSON/PDF/SQL from judges | Hardcoded demo data alone fails the "real data" check the mentor emphasized repeatedly |
| Scope | ONE persona, ALL brief dimensions as modules | See rationale above — auto-eval rewards coverage of every noun in the brief; keep it non-chaotic by unifying under one console and one data model, not by cutting modules |
| API keys | You provide your own, organizers give nothing | Use Gemini free tier / AI Studio quota only |

**Before every commit, mentally check this table. If any row is violated, stop and fix it before continuing.**

---

## 1. Chosen Persona & Modules (do not deviate without explicit instruction)

**Persona (narrative spine):** Stadium Operations Director — every module is framed as "what this director sees on their console," which is what keeps 9 modules feeling like one product instead of a feature dump.

**Modules — one per brief dimension, all sharing the same data model (zones, gates, sensors, events, timestamp):**

| # | Module | Brief dimension covered |
|---|---|---|
| 1 | Crowd Intelligence | crowd management |
| 2 | Incident Command | operational intelligence, real-time decision support |
| 3 | Wayfinding & Navigation | navigation |
| 4 | Transit Intelligence | transportation |
| 5 | Medical Ops | real-time decision support (safety) |
| 6 | Volunteer Coordination | organizers/venue staff persona coverage |
| 7 | Sustainability Telemetry | sustainability |
| 8 | Multilingual Fan Assistance | multilingual assistance, accessibility |
| 9 | AI Morning Brief & Analytics | operational intelligence (synthesis layer, build last) |

Build order: 1 → 2 → 3 → 8 first (these carry the most AI-reasoning weight and are hardest to fake), then 4/5/6/7 (these can be lighter — real data-driven but with simpler prompts), then 9 last as the synthesis capstone.

**Product name (working):** *Concourse* — an AI operations copilot for match-day staff. (Avoid naming anything "ChatBot," "Assistant," or "AI Helper" — generic names read as generic products to judges.)

---

## 2. Architecture (must stay inside the 10MB / no-build-step constraint)

```
/
├── index.html              # Single entry point, all views as JS-driven sections
├── /src
│   ├── app.js              # Router/state (vanilla JS, no framework)
│   ├── /modules
│   │   ├── crowd.js
│   │   ├── incident.js
│   │   ├── navigation.js
│   │   ├── transit.js
│   │   ├── medical.js
│   │   ├── volunteers.js
│   │   ├── sustainability.js
│   │   ├── translate.js
│   │   ├── brief.js         # AI Morning Brief / Analytics synthesis
│   │   └── ingest.js        # CSV/JSON/PDF parsing (papaparse via CDN, pdf.js via CDN)
│   ├── /ai
│   │   ├── gemini-client.js # fetch wrapper, calls /api/gemini proxy (never the raw key)
│   │   └── prompts.js       # ALL prompts live here, versioned, nowhere else
│   ├── /utils
│   │   ├── sanitize.js      # HTML-escaping for any AI/user text rendered to DOM
│   │   └── a11y.js          # shared aria-live announcer, focus trap helpers
│   └── /styles
│       └── main.css         # hand-authored, no Tailwind CDN bloat needed
├── /api
│   └── gemini.js            # tiny Vercel serverless function — holds the API key server-side
├── /sample-data
│   └── stadium_sample.csv   # small synthetic seed data (<50KB)
├── /tests
│   └── run.js               # plain Node `assert`-based tests, zero dependencies — `node tests/run.js`
├── /docs
│   ├── ARCHITECTURE.md      # short, diagrammed, not a novel
│   ├── SECURITY.md          # threat model, what's validated/sanitized and why
│   └── TESTING.md           # test cases table: input → expected output
├── README.md
├── .env.example             # documents required env var name, never real secrets
├── .github/workflows/test.yml  # runs `node tests/run.js` on every push — near-zero cost, proves automated validation exists
└── .gitignore                # node_modules, .env, *.log, .DS_Store
```

No React, no Next.js, no Tailwind build pipeline, no `package-lock.json`. External libraries (papaparse, pdf.js, Chart.js) load from CDN via `<script src>` — zero repo weight, zero install step, zero chance of burning an attempt on a broken build.

**API key handling:** Never commit the Gemini key, and never call the Gemini API directly from client-side JS with the key embedded — that's a Security-axis failure waiting to be caught by any repo scan. Instead:
1. `api/gemini.js` is a one-file Vercel serverless function that reads `process.env.GEMINI_API_KEY` (set in the Vercel dashboard, never in the repo) and proxies requests to Gemini.
2. The frontend calls `fetch('/api/gemini', {...})` — it never sees the key.
3. `.env.example` in the repo documents the variable name (`GEMINI_API_KEY=your_key_here`) so judges know exactly how to configure their own deployment — this is a legitimate, easy Security-axis win and costs near-zero repo weight.
4. The proxy function does basic rate limiting (reject if >N requests/minute per IP) and payload size validation before forwarding — document this in `docs/SECURITY.md`.

---

## 3. Data ingestion pipeline (a likely-High-tier item across Code Quality, Security, and Efficiency — do not skip)

```
Upload (CSV / JSON / PDF)
   → Parse (papaparse for CSV, pdf.js for PDF text extraction)
   → Normalize into { gates[], zones[], sensors[], timestamp }
   → Validate (reject malformed rows, show which rows failed and why)
   → Feed into UI state
   → Gemini prompts read from this state, never from hardcoded arrays
```

Ship with `sample-data/stadium_sample.csv` pre-loaded on first load so the demo isn't empty, but the **upload button must actually replace that data live** — this is the exact behavior the mentor described judges will test.

---

## 4. Prompt Engineering Standards (all prompts live in `src/ai/prompts.js`)

Every prompt follows this structure — no exceptions:

```js
const CROWD_ANALYSIS_PROMPT = {
  system: `You are the Operations Intelligence engine for a FIFA World Cup 2026 stadium.
Goals, in priority order:
1. Minimize crowd risk to fans
2. Minimize response time for staff
3. Never recommend an action without citing the data point behind it

Rules:
- Only use data provided in the user message. Never invent numbers.
- If confidence is below 70%, say so explicitly rather than guessing.
- Output valid JSON matching the schema below. No prose outside the JSON.`,

  schema: `{
  "risk_level": "low" | "medium" | "high",
  "eta_minutes": number,
  "recommendation": string,
  "confidence": number,
  "supporting_data": string,
  "alternative_action": string
}`,

  fewShot: [
    { input: "Gate 3: 92% capacity, rising 4%/min", output: `{"risk_level":"high","eta_minutes":12,"recommendation":"Redirect incoming fans to Gate 5","confidence":0.94,"supporting_data":"Gate 3 occupancy 92%, historical overflow at 90%+ within 12-15min","alternative_action":"Deploy 2 additional stewards to Gate 3"}` }
  ]
};
```

**Every AI output rendered in the UI must show: recommendation, confidence %, the data it was based on, and one alternative.** This "justify, don't just answer" pattern is your main differentiator — most teams will just print an answer.

---

## 5. UI Direction — a real design system, not a generic AI look

Two failure modes to avoid, both common in AI-built UIs:
1. **The chatbot clone**: centered chat input, purple-blue gradient hero, robot icons, rounded glassmorphism cards.
2. **The "AI console" cliché**: near-black background + one bright neon accent (acid-green or vermilion) — this is just as recognizable as a template as the chatbot look, and a plain "dark dashboard" risks landing here by default.

Ground the palette and type in the actual subject — broadcast/matchday control-room graphics — not in "dashboard" as a genre.

**Color (5 named values, not neon):**
- `--bg-base: #0E1A24` — deep steel-blue, not pure black (control-room monitor, not hacker terminal)
- `--bg-panel: #16283A` — slightly lifted panel tone for cards/sections, subtle not glassy
- `--accent-turf: #4C7A5E` — desaturated pitch-turf green, used sparingly for "nominal/good" states
- `--accent-gold: #C9A227` — broadcast lower-third gold, for medium-risk/attention states
- `--accent-signal: #B5432E` — warm brick-red, not pure alert red, for high-risk/critical states
- `--text-primary: #E7ECF2` — warm off-white, never pure `#FFFFFF`

**Type (2 roles, load via Google Fonts CDN link tag, no build step):**
- Display/headings: `IBM Plex Sans Condensed` (has the compressed, broadcast-scoreboard character — distinct from the generic Inter/system-sans every template uses)
- Data/numbers/labels: `IBM Plex Mono` — every metric (occupancy %, ETA, confidence) renders in this face so numbers read as instrumentation, not prose

**Layout concept (ASCII sketch):**
```
┌─ Concourse ── [Crowd][Incident][Nav][Transit][Medical][Volunteers][Sustain][Language][Brief] ─┐
│ ┌── stadium map (signature element) ──┐  ┌── active module panel ──────────┐ │
│ │  gates glow turf/gold/signal by     │  │  module content, dense,          │ │
│ │  live risk — this is the ONE bold   │  │  hairline-divided rows, not      │ │
│ │  element, everything else is quiet  │  │  rounded cards                   │ │
│ └──────────────────────────────────────┘  └───────────────────────────────────┘ │
│ ── timestamped Insight Feed (incident-log style, not a chat thread) ──────────── │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Signature element (spend all your boldness here, nothing else):** the SVG stadium map, gates pulsing gently between the three accent colors as risk changes — this is the one memorable thing. Every other panel stays quiet: 1px hairline dividers, zero or minimal border-radius (2-4px, not pill-shaped), no drop shadows standing in for hierarchy.

**Interaction, not chat:** the "Ask AI" affordance is framed as named **Commands** ("Simulate Gate 4 closure," "Generate morning brief") — buttons with specific intent, never an open free-text box as the primary interface.

**Copy voice:** active voice, plain terms a stadium ops person would actually use — "Redirect fans to Gate 5," not "AI recommends optimal routing solution." Errors state what happened and what to do, never "Oops!" or an apology. This alone separates a considered product from a hackathon-speed one.

**Motion and restraint:** one deliberate load-in for the stadium map, subtle pulse on state change, `prefers-reduced-motion` always respected. No scattered micro-animations everywhere — restraint here is itself a signal of intentional design, not AI output.

This full token system — not just "dark theme" — is the highest-leverage design choice for differentiation.

---

## 6. Module specs

### 6.1 Crowd Intelligence
- Input: gate occupancy % (from uploaded/sample data), trend direction
- Output: risk level, ETA to overflow, redirect suggestion, confidence
- Visual: SVG stadium map with gates as colored nodes, `aria-live` region announces new high-risk gates for screen readers

### 6.2 Incident Command
- Input: incident type (medical/fire/weather/security), location, severity
- Output: structured SOP (immediate actions, resources to allocate, comms draft, escalation path)
- Visual: timeline log — each incident is a card with a "Generate Response Plan" button

### 6.3 Wayfinding & Navigation
- Input: fan's current zone + desired destination (seat/gate/concession/medical point)
- Output: Gemini-generated step-by-step directions in plain language, adapted to accessibility needs if flagged (e.g., wheelchair route avoiding stairs)
- Visual: highlighted path over the same SVG stadium map used in 6.1 (shared component, not a rebuild)

### 6.4 Transit Intelligence
- Input: uploaded/sample transit feed (delays per line/shuttle)
- Output: AI-generated fan-facing advisory + ops-facing rerouting suggestion
- Visual: simple status list, color-coded by delay severity

### 6.5 Medical Ops
- Input: medical incident reports (severity, location, resource requested)
- Output: nearest-resource suggestion, escalation recommendation, confidence + reasoning
- Visual: card list, same "justify" pattern as 6.2

### 6.6 Volunteer Coordination
- Input: volunteer roster (uploaded CSV: role, status, zone)
- Output: AI-suggested reallocation when a zone is understaffed relative to current risk level (reads from 6.1's state)
- Visual: simple roster table with status badges

### 6.7 Sustainability Telemetry
- Input: uploaded/sample utility data (waste, water, energy)
- Output: AI-generated efficiency suggestions ("shift concession refrigeration load off-peak")
- Visual: three metric cards, same visual language as the rest of the console (not a separate "green dashboard" style)

### 6.8 Multilingual Fan Assistance
- Input: fan's inferred origin/context (from ticket/sample data) or manual language pick
- Output: translated wayfinding/announcement text generated by Gemini, not a static dictionary
- Visual: language auto-suggested based on context, override always available (mentor explicitly said: no restriction on language count, base it on context)
- Accessibility overlap: this module also covers screen-reader announcements and plain-language mode — frame it explicitly as "accessibility & multilingual" in the README so the alignment is legible to an automated reader, not just implied

### 6.9 AI Morning Brief & Analytics (synthesis capstone — build last, after 6.1–6.8 exist)
- One button generates a brief synthesizing current state across ALL modules: expected attendance, weather risk, staffing recommendation, sustainability note, top 3 things to watch — a single Gemini call reading the shared data model, not per-module hardcoded text
- This module is what makes the breadth look like one intelligent system instead of 8 disconnected modules — it is the single highest-leverage module for "Problem Statement Alignment" because it demonstrably reasons across every dimension at once

---

## 7. Rubric mapping — the OFFICIAL 5 categories, tiered by impact

**Important correction from v2:** the official brief names exactly 5 evaluated categories — Code Quality, Security, Efficiency, Testing, Accessibility — not 6. "Problem Statement Alignment" is not one of the 5; it lives in Section 3 of the brief ("choose one vertical, design around that persona and logic," "practical and real-world usability") as a qualitative expectation, not a named auto-eval axis. Treat it as a cross-cutting requirement that shapes *how* you do the 5, not a 6th bucket competing for separate points (see 7.6 below).

**Honesty check on what follows:** the brief tells you the tier definitions (High/Medium/Low = how much each moves your score) but does **not** publish which specific sub-criterion inside each category is High vs. Medium vs. Low. Nobody sharing this with you has that exact mapping. What's below is my best-reasoned inference, labeled as such, built from how these category names are conventionally weighted in engineering evaluation. Because you can't be 100% sure of the exact split, the safest strategy is: **treat every item tagged "likely High" as mandatory, and don't skip "likely Medium/Low" items either — in this vanilla stack they're all cheap enough to just do.** Tiering here is for triage under time pressure across 3 attempts, not permission to skip anything.

### 7.1 Code Quality — *structure, readability, maintainability*
| Item | Likely tier | Why |
|---|---|---|
| Clear module boundaries; another engineer could extend it without a rewrite | High | "Structure" and "maintainability" are named first — these read as the core of what's graded |
| Consistent error handling (try/catch + visible fallback, never a silent crash) | High | A crash on real judge-uploaded data is the fastest way to fail "maintainability" in practice |
| Consistent naming/style across all 9 modules | Medium | "Readability" — matters, but a reviewer forgives style before they forgive broken structure |
| JSDoc comments, file organization polish | Low | Nice, doesn't rescue a badly structured app |

### 7.2 Security — *safe and responsible implementation*
| Item | Likely tier | Why |
|---|---|---|
| No secrets in repo/git history; Gemini key only in the `/api/gemini.js` proxy | High | An exposed key is the single most concrete, unambiguous "unsafe implementation" a scanner can catch |
| All CDN `<script>` tags (papaparse, pdf.js, Chart.js) carry `integrity=` (SRI hash) + `crossorigin="anonymous"` | High | Unpinned third-party scripts = tamperable supply chain, a concrete "unsafe implementation" flag |
| All AI/user-generated text sanitized before DOM insertion (no raw `innerHTML`) | High | XSS from untrusted upload/AI content is a textbook "irresponsible implementation" flag |
| Upload validation (size cap, type check, row cap) | Medium | Prevents abuse but is a step down from key/XSS exposure in severity |
| Rate limiting, CSP headers, `docs/SECURITY.md` threat model write-up | Low | Good hygiene, reads as extra credit on top of the fundamentals |

### 7.3 Efficiency — *optimal use of resources*
| Item | Likely tier | Why |
|---|---|---|
| App doesn't hang/crash or make redundant/unbounded API calls under real uploaded data | High | "Optimal use of resources" fails hardest when the app visibly wastes them or breaks under load |
| Lazy-mounted modules (inactive tabs don't fetch/poll) | Medium | Real optimization, but invisible unless someone profiles it |
| Debounced/cached Gemini calls, `Map`/`Set` over `Array.find` in hot paths | Medium | Same — solid engineering, lower visibility than the crash-under-load failure mode |
| CDN `defer` attributes, minor bundle trimming | Low | Marginal gains |

### 7.4 Testing — *validation of functionality*
| Item | Likely tier | Why |
|---|---|---|
| Tests exist and actually exercise real logic (parser edge cases, sanitizer, each module's core transform) | High | "Validation of functionality" is graded on whether functionality is genuinely validated, not whether a test file merely exists |
| `node tests/run.js` actually runs and passes with zero setup | High | A test suite that can't be run by a reviewer scores as if it doesn't exist |
| Breadth — every module has at least one test, not just the flagship ones | Medium | Depth matters more than breadth here, but gaps are noticeable |
| `docs/TESTING.md` input→expected→actual table, manual QA checklist | Low | Supporting evidence, not a substitute for the tests themselves |

### 7.5 Accessibility — *inclusive and usable design*
| Item | Likely tier | Why |
|---|---|---|
| Full keyboard operability (nothing mouse-only) and semantic HTML (`<button>`/`<nav>` not `<div onclick>`) | High | This is the difference between "usable by assistive tech" and not — the core of "inclusive design" |
| Color never the only signal (risk shown via text/icon + color); sufficient contrast | High | A colorblind user genuinely cannot use a color-only risk system — direct usability failure |
| `aria-label`s on icon-only controls, `aria-live` alerts for incident/AI updates | Medium | Strong accessibility feature, but the app is still nominally usable without it |
| `prefers-reduced-motion`, decorative-icon `aria-hidden` polish | Low | Refinement layer |

### 7.6 Problem Statement Alignment (not a 6th scored axis — a lens on all 5)
Rather than compete for separate points, this shapes *what counts as good* within the 5 categories above:
- "Maintainability" (7.1) is judged against whether the structure actually serves the chosen persona/vertical coherently, not just against generic clean-code standards.
- "Functionality" validated in Testing (7.4) should validate persona-relevant behavior (does crowd redirection logic actually work for this stadium-ops use case), not trivial arithmetic.
- Keep the README explicit about which brief dimensions your modules cover (Section 1's table) so a human or LLM reviewer doesn't have to infer it — this is cheap insurance regardless of how alignment is actually scored.

### Build priority (revised): sequence by tier across ALL categories, not category-by-category
1. **All "likely High" items across all 5 categories first** — this is the block that most directly protects your score if you only get through 2 of your 3 attempts cleanly: shared data model + ingestion + `sanitize.js` + Gemini proxy (Security High) + solid error handling in every module (Code Quality High) + `tests/run.js` covering real logic (Testing High) + full keyboard/semantic/color-safe UI (Accessibility High) + no crashes/unbounded calls under real data (Efficiency High).
2. Modules 6.1, 6.2, 6.3, 6.8 (highest reasoning density, hardest to fake, most persona-alignment value) — built using the High-tier foundations from step 1, not before them.
3. **All "likely Medium" items** across the 5 categories.
4. Modules 6.4–6.7 (lighter modules, reuse existing patterns).
5. Module 6.9 synthesis capstone.
6. **All "likely Low" items** — final polish pass, genuinely last.

---

## 8. Claude Code / Antigravity workflow rules

1. **One module at a time, in the Section 7 build-priority order.** Never ask for "the whole app" in one shot — build `ingest.js` + `sanitize.js` + `api/gemini.js` first, verify each with a quick manual test, then move module by module.
2. **Every prompt change goes through `prompts.js` only.** Never inline a prompt string inside a UI component.
3. **Every module ships with its test case added to `tests/run.js` in the same commit** — not as a separate later pass. This is the single easiest place for a rushed 3rd attempt to lose Testing-axis points, so make it part of the module's definition of done, not an afterthought.
4. **Commit after every working module**, not after every file edit. Commit messages: `feat: crowd intelligence module`, `fix: CSV parser handles missing headers`.
5. **Before each commit, run the constraint checklist in Section 0 AND spot-check one item from each of the 6 rubric axes in Section 7.**
6. **If Antigravity/Claude Code proposes adding a framework, a build step, or a new dependency — reject it** unless it demonstrably fixes a real blocker, because every new dependency risks the 10MB ceiling and the 3-attempt limit.
7. **Check repo size before final submission:** `du -sh .git` and `du -sh .` — if either is creeping up, check for accidentally committed large files (`git log --stat` to find them, then history rewrite if needed — carefully, since you must stay on one branch). With this vanilla stack, 9 modules of hand-written JS/CSS/HTML plus docs should realistically total well under 1 MB, leaving generous headroom under the 10 MB cap.

---

## 9. README requirements (judges read this first)

Must explicitly state:
- Chosen vertical(s) and why
- Approach and logic (link back to the "justify, don't just answer" pattern)
- How to run locally (should be: open `index.html`, or one static server command — no build step)
- How to test with your own data (exact upload instructions)
- Assumptions made (e.g., synthetic seed data represents X stadium, language detection assumes ticket metadata format Y)
- A note on API key setup (env var name, where to get a free Gemini key)

---

## 10. What "done" looks like before submission — grouped by tier, so you know what to protect first if time runs short

**Likely-High items (never skip, even on a rushed 3rd attempt):**
- [ ] No secrets in the repo or git history; `.gitignore` covers `.env`, `node_modules`, OS files; `.env.example` present
- [ ] Every uploaded/AI-generated string rendered via `sanitize.js`, never raw `innerHTML`
- [ ] `node tests/run.js` runs with zero setup and passes, covering real parser/module/sanitizer logic (not trivial asserts)
- [ ] `.github/workflows/test.yml` exists and shows a green run — visible proof of automated validation, not just local tests
- [ ] App doesn't crash or hang on malformed/large uploaded data; no unbounded/redundant API calls
- [ ] Every module's structure is clear enough that someone else could extend it without a rewrite
- [ ] Full keyboard operability; semantic HTML for all interactive elements; color never the only risk signal

**Likely-Medium items (do after all High items are solid):**
- [ ] All 9 modules work end-to-end with the sample data, each with a real Gemini call (not hardcoded output)
- [ ] Upload replaces sample data live across every module that consumes it, and the app visibly reacts
- [ ] Every AI output shows recommendation + confidence + supporting data + alternative
- [ ] Consistent naming/style across all modules
- [ ] `aria-label`s on icon-only controls; `aria-live` alerts fire for incidents/AI updates
- [ ] Debounced/cached Gemini calls; lazy-mounted inactive modules

**Likely-Low items (final polish, do last):**
- [ ] `docs/SECURITY.md` and `docs/TESTING.md` present and accurate
- [ ] JSDoc comments on functions; no leftover `console.log`/dead code
- [ ] `prefers-reduced-motion` respected; decorative icons `aria-hidden`

**Cross-cutting (Section 7.6 — check regardless of tier):**
- [ ] README explicitly lists every brief dimension covered (Section 1 table) and explains the AI reasoning pattern
- [ ] Single branch, public repo, size checked well under 10MB (`du -sh .`)
- [ ] UI passes the "does this look like a chat-bot clone" gut check — if yes, revisit Section 5
- [ ] Module 6.9 (synthesis brief) demonstrably reads across all other modules' current state in one Gemini call
