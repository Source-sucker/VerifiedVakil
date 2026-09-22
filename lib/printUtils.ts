/**
 * Print & PDF Generation Utility for VerifiedVakil
 * Provides clean, standalone, high-contrast A4 print documents for:
 * 1. Tenant Assistive Preparation Brief (for advocates / legal counsel)
 * 2. Formal Landlord Counter-Proposal Notice (for pre-signing negotiation)
 * 3. Move-in Condition Record & Statutory Inspection Protocol
 */

import { AnalyzedClause } from "./clauseEngine";

/**
 * Executes a clean print by injecting an isolated iframe into the document.
 * This guarantees:
 * - Zero dashboard / sidebar bleed-through
 * - Pure white background and high-contrast typography
 * - Clean multi-page document pagination without viewport clipping
 */
function executeIframePrint(title: string, bodyHtml: string) {
  const existingFrame = document.getElementById("vv-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "vv-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 18mm 15mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4 {
      color: #0f172a;
      margin-top: 0;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 9.5pt;
      color: #64748b;
      margin: 0;
    }
    .score-badge {
      text-align: right;
      padding: 8px 14px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .score-label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
      display: block;
    }
    .score-val {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
    }
    .notice-box {
      background: #f1f5f9;
      border-left: 4px solid #4f46e5;
      padding: 10px 14px;
      font-size: 9pt;
      color: #334155;
      margin-bottom: 18px;
      border-radius: 4px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 18px 0 12px 0;
    }
    .clause-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .clause-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .clause-title {
      font-weight: 700;
      font-size: 11pt;
      color: #0f172a;
    }
    .risk-pill {
      font-size: 8pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .risk-high {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }
    .risk-mod {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fbbf24;
    }
    .field-row {
      margin-top: 6px;
      font-size: 9.5pt;
    }
    .field-label {
      font-weight: 700;
      color: #475569;
    }
    .citation-box {
      font-family: monospace;
      font-size: 9pt;
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 6px;
      display: inline-block;
    }
    .discussion-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 8px 10px;
      border-radius: 6px;
      margin-top: 8px;
      font-size: 9.5pt;
      color: #312e81;
    }
    .footer-note {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5pt;
      color: #94a3b8;
      text-align: center;
    }
    .sign-section {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 45%;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
      font-size: 9.5pt;
      color: #475569;
    }
    pre {
      white-space: pre-wrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Iframe print error, falling back to window.print():", e);
      window.print();
    }
  }, 250);
}

/**
 * Print the Tenant Assistive Preparation Brief
 */
export function printLegalBrief({
  documentTitle,
  safetyScore,
  clauses,
}: {
  documentTitle: string;
  safetyScore: number;
  clauses: AnalyzedClause[];
}) {
  const flagged = clauses.filter(
    (c) => c.riskLevel === "HIGH_RISK" || c.riskLevel === "MODERATE_RISK"
  );
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const clausesHtml =
    flagged.length === 0
      ? `<p style="font-style: italic; color: #64748b;">No high or moderate risk clauses were identified in this agreement.</p>`
      : flagged
          .map(
            (c, idx) => `
      <div class="clause-card">
        <div class="clause-header">
          <span class="clause-title">${idx + 1}. ${c.title} (${c.clauseLabel})</span>
          <span class="risk-pill ${c.riskLevel === "HIGH_RISK" ? "risk-high" : "risk-mod"}">
            ${c.riskLevel === "HIGH_RISK" ? "High Risk" : "Moderate Risk"} (${c.riskScore}/100)
          </span>
        </div>
        <div class="field-row">
          <span class="field-label">Clause Concern:</span> ${c.riskReason}
        </div>
        ${
          c.citation
            ? `<div class="citation-box">⚖️ Statutory Reference: ${c.citation.law} — ${c.citation.section_ref}</div>`
            : ""
        }
        <div class="discussion-box">
          <strong>Recommended Advocate Discussion Point:</strong> ${
            c.suggestedAction ||
            `Request rephrasing of this ${c.clauseLabel} clause to align with standard Model Tenancy Act bilateral standards.`
          }
        </div>
      </div>
    `
          )
          .join("");

  const bodyHtml = `
    <div class="header-bar">
      <div>
        <h1 class="brand-title">VerifiedVakil — Legal Preparation Brief</h1>
        <p class="brand-subtitle">
          Residential Tenancy Review • Generated on ${today} • Document: ${documentTitle || "Rental Agreement"}
        </p>
      </div>
      <div class="score-badge">
        <span class="score-label">Safety Score</span>
        <span class="score-val" style="color: ${
          safetyScore >= 75 ? "#059669" : safetyScore >= 50 ? "#d97706" : "#dc2626"
        };">${safetyScore}/100</span>
      </div>
    </div>

    <div class="notice-box">
      <strong>Assistive Tool Notice:</strong> This summary is an automated reading and negotiation aid designed to assist residential tenants in understanding contract obligations. It is grounded in the Model Tenancy Act 2021 and Transfer of Property Act 1882. It does not replace independent professional counsel by a licensed advocate.
    </div>

    <div class="section-title">
      Flagged Contract Terms Requiring Professional Review (${flagged.length})
    </div>

    ${clausesHtml}

    <div class="sign-section">
      <div class="sign-box">
        Advocate / Legal Counsel Signature<br><br><br>
        Date: ________________________
      </div>
      <div class="sign-box">
        Tenant Signature & Acknowledgment<br><br><br>
        Date: ________________________
      </div>
    </div>

    <div class="footer-note">
      VerifiedVakil AI Legal Assistant • Grounded in Model Tenancy Act 2021 & Transfer of Property Act 1882
    </div>
  `;

  executeIframePrint("VerifiedVakil_Tenant_Preparation_Brief", bodyHtml);
}

/**
 * Print Formal Landlord Counter-Proposal Notice
 */
export function printCounterOfferNotice({
  tenantName,
  landlordName,
  propertyAddress,
  noticeText,
}: {
  tenantName: string;
  landlordName: string;
  propertyAddress: string;
  noticeText: string;
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyHtml = `
    <div class="header-bar">
      <div>
        <h1 class="brand-title">Formal Counter-Proposal Notice</h1>
        <p class="brand-subtitle">
          Proposed Amendments to Draft Tenancy Agreement • Model Tenancy Act Alignment
        </p>
      </div>
      <div style="text-align: right; font-size: 9pt; color: #475569;">
        <strong>Date:</strong> ${today}
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 9.5pt;">
      <div><strong>To:</strong> ${landlordName} (Landlord / Lessor)</div>
      <div><strong>From:</strong> ${tenantName} (Prospective Tenant)</div>
      <div><strong>Premises:</strong> ${propertyAddress}</div>
    </div>

    <div style="font-size: 10pt; line-height: 1.7; color: #1e293b;">
      <pre>${noticeText}</pre>
    </div>

    <div class="sign-section">
      <div class="sign-box">
        Tenant Signature<br><br><br>
        ${tenantName}
      </div>
      <div class="sign-box">
        Landlord Acceptance & Countersignature<br><br><br>
        ${landlordName}
      </div>
    </div>

    <div class="footer-note">
      Generated via VerifiedVakil Tenancy Protection Suite • Benchmark: Model Tenancy Act 2021
    </div>
  `;

  executeIframePrint(`Counter_Offer_${tenantName.replace(/\s+/g, "_")}`, bodyHtml);
}

/**
 * Print Move-in Condition Record & Statutory Inspection Protocol
 */
export function printInspectionProtocol({
  tenantName,
  landlordName,
  propertyAddress,
  checkedItems,
}: {
  tenantName: string;
  landlordName: string;
  propertyAddress: string;
  checkedItems: Record<string, boolean>;
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const inspectionLabels: Record<string, { title: string; desc: string; statutory: string }> = {
    meter_readings: {
      title: "Electricity, Water & Gas Meter Baseline",
      desc: "Photograph serial numbers and initial index readings on date of possession.",
      statutory: "MTA 2021 § 11 (Essential utility benchmark)",
    },
    wall_photos: {
      title: "Pre-existing Wall Seepage, Cracks & Scuffs",
      desc: "Date-stamped visual audit of all room walls before shifting furniture.",
      statutory: "TPA 1882 § 108(m) (Wear & tear exemption)",
    },
    appliances: {
      title: "Geysers, ACs, Fans & Fixtures Functional Check",
      desc: "Confirm all electrical appliances and sanitary fittings are operational.",
      statutory: "MTA 2021 Second Schedule (Landlord maintenance)",
    },
    keys: {
      title: "Handover of All Key Sets & Gate Remotes",
      desc: "Document receipt of original keys, duplicates, society RFID fobs.",
      statutory: "Quiet Enjoyment Protection",
    },
    deposit_receipt: {
      title: "Signed Security Deposit Advance Acknowledgment",
      desc: "Written receipt specifying bank transfer UTR and refund conditions.",
      statutory: "MTA 2021 § 11 (2-Month deposit cap limit)",
    },
    drainage: {
      title: "Kitchen & Bathroom Plumbing & Drainage Check",
      desc: "Verify free water flow, absence of blockages, and valve condition.",
      statutory: "MTA 2021 Second Schedule Part B",
    },
  };

  const checklistRows = Object.entries(inspectionLabels)
    .map(([key, item]) => {
      const isChecked = Boolean(checkedItems[key]);
      return `
      <div class="clause-card" style="margin-bottom: 8px; padding: 10px 12px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div style="font-size: 14pt; line-height: 1; font-weight: bold; color: ${
            isChecked ? "#059669" : "#94a3b8"
          };">
            ${isChecked ? "☑" : "☐"}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 10.5pt; color: #0f172a;">${item.title}</div>
            <div style="font-size: 9pt; color: #64748b; margin-top: 2px;">${item.desc}</div>
            <div class="citation-box" style="margin-top: 4px;">⚖️ ${item.statutory}</div>
          </div>
          <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${
            isChecked ? "#ecfdf5" : "#f1f5f9"
          }; color: ${isChecked ? "#065f46" : "#64748b"}; border: 1px solid ${
            isChecked ? "#a7f3d0" : "#e2e8f0"
          };">
            ${isChecked ? "Verified" : "Pending Handover"}
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  const bodyHtml = `
    <div class="header-bar">
      <div>
        <h1 class="brand-title">Move-In Evidence & Statutory Inspection Protocol</h1>
        <p class="brand-subtitle">
          Pre-Occupancy Condition Ledger • Baseline Deposit Protection • Model Tenancy Act 2021
        </p>
      </div>
      <div style="text-align: right; font-size: 9pt; color: #475569;">
        <strong>Date of Inspection:</strong> ${today}
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 9.5pt;">
      <div><strong>Premises Address:</strong> ${propertyAddress}</div>
      <div><strong>Tenant (Lessee):</strong> ${tenantName}</div>
      <div><strong>Landlord / Representative (Lessor):</strong> ${landlordName}</div>
    </div>

    <div class="notice-box">
      <strong>Statutory Purpose:</strong> Under Section 108(m) of the Transfer of Property Act 1882 and the Model Tenancy Act 2021, the tenant is exempt from liability for pre-existing structural defects and reasonable wear and tear. This countersigned protocol establishes the documented condition of fixtures and premises upon possession to prevent wrongful deposit forfeiture upon vacation.
    </div>

    <div class="section-title">Handover Verification Checklist</div>
    ${checklistRows}

    <div class="sign-section" style="margin-top: 24px;">
      <div class="sign-box">
        Tenant Signature & Handover Confirmation<br><br><br>
        Name: ${tenantName}<br>
        Date: ________________________
      </div>
      <div class="sign-box">
        Landlord / Authorized Agent Countersignature<br><br><br>
        Name: ${landlordName}<br>
        Date: ________________________
      </div>
    </div>

    <div class="footer-note">
      VerifiedVakil AI Legal Assistant • Tenancy Condition Protocol • Benchmark: Model Tenancy Act 2021
    </div>
  `;

  executeIframePrint(`MoveIn_Protocol_${tenantName.replace(/\s+/g, "_")}`, bodyHtml);
}
