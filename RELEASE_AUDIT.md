# Release Audit

## Product Surface

- Persona is consistent: Indian residential tenant.
- Scope is consistent: simplify/risk-radar plus grounded compare/ask.
- First-run state explains the job, the three-step flow, and the legal disclaimer.
- Upload accepts text files and image scans; the navigation copy matches that behavior.
- Analysis results separate deterministic findings from Gemini wording.
- Citation links are exposed beside the relevant clause.
- Export creates a lawyer-question handoff rather than a legal verdict.

## Safety Surface

- Clause segmentation, classification, extraction, risk scoring, and citation lookup run in TypeScript/data tables.
- Gemini receives constrained context for rewrites, explanations, checklist output, and questions.
- The adversarial suite covers fabricated authority and prompt injection in document content.
- The UI repeatedly frames the result as assistive reading and recommends an advocate.

## Release Risks To Watch

- Configure `GEMINI_API_KEY` in the deployment environment, or demonstrate the deterministic fallback honestly.
- Do not describe the Model Tenancy Act as universally binding across every Indian state; it is presented as a general awareness baseline.
- Keep the demo video under four minutes and show dynamic output rather than a prepared answer.
- Verify every citation and source URL before public submission.
- Do not expose `.env.local`, API keys, or private test data in the recording.

## Verified On 22 September 2026

- `npm test`: 17 tests passing.
- `npm run build`: production build passing with TypeScript and lint validation.
- Editor diagnostics: no errors in the edited UI files.
- Repository `.git` size observed at approximately 3.1 MB, below the 10 MB limit.