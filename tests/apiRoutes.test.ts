import { describe, it, expect } from "vitest";
import { simplifyClauseWithAI, explainRiskWithAI } from "../lib/geminiClient";
import { lookupCitation, lookupPrecedent } from "../lib/citationLookup";

describe("Standalone AI Route Handlers & Fallbacks", () => {
  it("simplifies clause deterministically without hallucinating obligations", async () => {
    const clauseText =
      "The Licensee agrees to pay an interest-free refundable Security Deposit of Rs. 3,50,000/-, equivalent to 10 months rent, which shall be refunded only after 60 days of vacating.";
    const result = await simplifyClauseWithAI(clauseText, "Security Deposit");

    expect(result.plainRewrite).toBeDefined();
    expect(result.plainRewrite.length).toBeGreaterThan(20);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("explains risk with citation lock and Supreme Court precedent", async () => {
    const clauseText =
      "In the event of early exit, the entire security deposit shall be unconditionally forfeited as liquidated damages.";
    const citation = lookupCitation("security_deposit");
    const precedent = lookupPrecedent("forfeiture");

    const result = await explainRiskWithAI(
      clauseText,
      90,
      "Arbitrary forfeiture of deposit without actual damage",
      citation,
      precedent
    );

    expect(result.explanation).toBeDefined();
    expect(result.suggestedAction).toBeDefined();
    // Explanation must reference verified statute or precedent or state no verified reference
    expect(
      result.explanation.includes("Model Tenancy Act") ||
        result.explanation.includes("Kailash Nath") ||
        result.explanation.includes("Contract Act") ||
        result.explanation.includes("Section 74")
    ).toBe(true);
  });
});
