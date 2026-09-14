import { describe, it, expect } from "vitest";
import {
  segmentAgreement,
  extractClauseValues,
  classifyClause,
  evaluateRisk,
  analyzeDocument,
} from "../lib/clauseEngine";
import { lookupCitation } from "../lib/citationLookup";
import fs from "fs";
import path from "path";

describe("Deterministic Clause Engine", () => {
  it("segments multi-clause agreement correctly using sliding window boundary heuristics", () => {
    const samplePath = path.join(
      process.cwd(),
      "public",
      "sample-docs",
      "sample-lease-aggressive.txt"
    );
    const content = fs.readFileSync(samplePath, "utf-8");
    const segments = segmentAgreement(content);

    expect(segments.length).toBeGreaterThanOrEqual(8);
  });

  it("extracts quantitative financial values and durations correctly", () => {
    const depositText =
      "The Licensee has paid an interest-free refundable Security Deposit of Rs. 3,50,000/-, equivalent to 10 months rent as deposit.";
    const values = extractClauseValues(depositText);

    expect(values.depositMonths).toBe(10);
    expect(values.depositAmount).toBe(350000);
  });

  it("extracts 0-day notice and unilateral termination", () => {
    const noticeText =
      "The Licensor may terminate this agreement at any time with 0 days notice without assigning any reason whatsoever.";
    const values = extractClauseValues(noticeText);

    expect(values.hasUnilateralTermination).toBe(true);
    expect(values.noticeDays).toBe(0);
  });

  it("classifies security deposit, landlord entry, and notice clauses correctly", () => {
    const c1 = classifyClause("refundable security deposit paid by licensee");
    expect(c1.clauseType).toBe("security_deposit");

    const c2 = classifyClause("landlord unconditional right to enter and inspect the premises at any time without notice");
    expect(c2.clauseType).toBe("landlord_entry");

    const c3 = classifyClause("either party may terminate by giving 30 days notice in writing");
    expect(c3.clauseType).toBe("notice_period");
  });

  it("scores high risk deterministically for predatory deposit and 0-day notice", () => {
    const depositRisk = evaluateRisk(
      "security_deposit",
      { depositMonths: 10 },
      "10 months rent as deposit"
    );
    expect(depositRisk.riskLevel).toBe("HIGH_RISK");
    expect(depositRisk.riskScore).toBeGreaterThanOrEqual(70);

    const noticeRisk = evaluateRisk(
      "notice_period",
      { noticeDays: 0, hasUnilateralTermination: true },
      "0 days notice"
    );
    expect(noticeRisk.riskLevel).toBe("HIGH_RISK");
    expect(noticeRisk.riskScore).toBe(95);
  });

  it("scores standard risk deterministically for fair model tenancy terms", () => {
    const depositRisk = evaluateRisk(
      "security_deposit",
      { depositMonths: 2 },
      "2 months rent as deposit"
    );
    expect(depositRisk.riskLevel).toBe("STANDARD_RISK");
    expect(depositRisk.riskScore).toBeLessThanOrEqual(20);

    const noticeRisk = evaluateRisk(
      "notice_period",
      { noticeDays: 30 },
      "30 days notice"
    );
    expect(noticeRisk.riskLevel).toBe("STANDARD_RISK");
  });

  it("retrieves verified citations from citation table and returns null for unverified clauses", () => {
    const citation1 = lookupCitation("security_deposit");
    expect(citation1).not.toBeNull();
    expect(citation1?.law).toBe("Model Tenancy Act, 2021");
    expect(citation1?.section_ref).toBe("Section 13(1)");

    const citation2 = lookupCitation("unknown_fake_clause_type");
    expect(citation2).toBeNull();
  });

  it("runs full document analysis pipeline on aggressive sample lease", () => {
    const samplePath = path.join(
      process.cwd(),
      "public",
      "sample-docs",
      "sample-lease-aggressive.txt"
    );
    const content = fs.readFileSync(samplePath, "utf-8");
    const result = analyzeDocument(content);

    expect(result.totalClauses).toBeGreaterThanOrEqual(8);
    expect(result.riskCounts.high).toBeGreaterThanOrEqual(3);
    // Aggressive lease safety score should be poor
    expect(result.safetyScore).toBeLessThan(50);
  });

  it("runs full document analysis pipeline on fair sample lease", () => {
    const samplePath = path.join(
      process.cwd(),
      "public",
      "sample-docs",
      "sample-lease-fair.txt"
    );
    const content = fs.readFileSync(samplePath, "utf-8");
    const result = analyzeDocument(content);

    expect(result.riskCounts.high).toBe(0);
    // Fair lease safety score should be high
    expect(result.safetyScore).toBeGreaterThanOrEqual(80);
  });
});
