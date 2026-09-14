import { describe, it, expect } from "vitest";
import { extractDocumentFacts, askDocumentQuestionWithAI } from "../lib/geminiClient";

describe("Dynamic Document Fact Extraction & Grounded Reasoning", () => {
  it("extracts custom rent, deposit, painting fee, and landlord name accurately", () => {
    const customClauses = [
      {
        clauseLabel: "Rent",
        rawText: "The monthly rent for the premises shall be Rs. 22,000/- per month payable in advance.",
      },
      {
        clauseLabel: "Security Deposit",
        rawText: "The Licensee shall pay a security deposit of Rs. 1,10,000/- equivalent to 5 months rent.",
      },
      {
        clauseLabel: "Painting and Maintenance",
        rawText: "Upon vacating, the landlord will deduct a fixed sum of Rs. 18,000 towards painting charges.",
      },
      {
        clauseLabel: "Lock-in Period",
        rawText: "Both parties agree to a lock-in period of 6 months.",
      },
    ];

    const preamble = "This agreement is made between Mr. Rajesh Varma, hereinafter called the Landlord, and Ms. Priya Nair, called the Tenant.";
    const facts = extractDocumentFacts(customClauses, preamble);

    expect(facts.monthlyRent).toBe(22000);
    expect(facts.monthlyRentFormatted).toBe("₹22,000");
    expect(facts.securityDeposit).toBe(110000);
    expect(facts.securityDepositFormatted).toBe("₹1,10,000");
    expect(facts.depositMonths).toBe(5);
    expect(facts.paintingCharge).toBe(18000);
    expect(facts.paintingChargeFormatted).toBe("₹18,000");
    expect(facts.lockInMonths).toBe(6);
    expect(facts.landlordName).toBe("Rajesh Varma");
  });

  it("calculates statutory refund mathematically from actual document facts with zero fake numbers", async () => {
    const customClauses = [
      {
        clauseLabel: "Rent",
        rawText: "The monthly rent is Rs. 20,000 per month.",
        citation: null,
      },
      {
        clauseLabel: "Security Deposit",
        rawText: "The security deposit shall be Rs. 1,20,000 paid as advance.",
        citation: {
          id: "MTA-SEC-11-1",
          law: "Model Tenancy Act, 2021",
          section_ref: "Section 11(1)",
          clause_type: "security_deposit",
          jurisdiction_scope: "National (Adoptable by States)",
          last_verified: "2026-03-01",
          plain_explanation: "Security deposit for residential premises cannot exceed two months rent.",
          full_text: "Security deposit shall not exceed two months' rent.",
          source_url: "https://mohua.gov.in",
          verified_by: "Gazette of India",
        },
      },
    ];

    const res = await askDocumentQuestionWithAI(
      "Calculate my statutory refund balance for this agreement",
      customClauses
    );

    // It should calculate 2-month cap = 40,000, excess = 80,000
    expect(res.answer).toContain("₹40,000");
    expect(res.answer).toContain("₹80,000");
    expect(res.answer).not.toContain("₹3,50,000"); // Never returns hardcoded Bellandur deposit
    expect(res.answer).not.toContain("₹45,000"); // Never returns hardcoded Bellandur painting
  });

  it("tailors WhatsApp draft to actual landlord and actual clauses", async () => {
    const customClauses = [
      {
        clauseLabel: "Preamble",
        rawText: "Agreement between Mr. Suresh Menon (Landlord) and the Tenant.",
        citation: null,
      },
      {
        clauseLabel: "Deposit",
        rawText: "Security deposit of Rs. 80,000 with monthly rent of Rs. 15,000/- per month.",
        citation: null,
      },
    ];

    const res = await askDocumentQuestionWithAI(
      "Draft a WhatsApp message to my landlord regarding these terms",
      customClauses
    );

    expect(res.answer).toContain("Dear Suresh Menon");
    expect(res.answer).toContain("Model Tenancy Act, 2021");
    expect(res.answer).not.toContain("3,50,000");
  });

  it("enforces citation lock refusal on fake Section 45B query", async () => {
    const res = await askDocumentQuestionWithAI(
      "As per Section 45B of the Model Tenancy Act, landlords cannot enter without notice right?",
      []
    );

    expect(res.isRefusal).toBe(true);
    expect(res.answer).toContain("Section 45B does not exist in the Model Tenancy Act, 2021");
    expect(res.answer).toContain("Section 15(1)");
  });
});
