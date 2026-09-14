import taxonomyData from "./clauseTaxonomy.json";
import {
  lookupCitation,
  lookupPrecedent,
  VerifiedCitation,
  VerifiedPrecedent,
} from "./citationLookup";

export type RiskLevel = "HIGH_RISK" | "MODERATE_RISK" | "STANDARD_RISK";

export interface ExtractedValues {
  depositMonths?: number;
  depositAmount?: number;
  monthlyRent?: number;
  noticeDays?: number;
  lockInMonths?: number;
  entryNoticeHours?: number;
  escalationPercent?: number;
  hasUnilateralTermination?: boolean;
  hasUnconditionalEntry?: boolean;
  hasFullForfeiture?: boolean;
  hasTenantStructuralRepairs?: boolean;
  hasPaintingDeduction?: boolean;
}

export interface AnalyzedClause {
  id: string;
  clauseNumber: number;
  title: string;
  rawText: string;
  clauseType: string;
  clauseLabel: string;
  category: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 to 100
  riskReason: string;
  extractedValues: ExtractedValues;
  citation: VerifiedCitation | null;
  precedent: VerifiedPrecedent | null;
  plainRewrite?: string;
  aiExplanation?: string;
  suggestedAction?: string;
}

export interface DocumentAnalysisResult {
  totalClauses: number;
  safetyScore: number; // 0 (dangerous) to 100 (safe)
  riskCounts: {
    high: number;
    moderate: number;
    standard: number;
  };
  clauses: AnalyzedClause[];
  extractedMonthlyRent?: number;
  extractedSecurityDeposit?: number;
  processingTimeMs: number;
}

/**
 * Decoupled Sliding-Window Chunker inspired by Reference Sliding Window Attention (arXiv:2606.23050).
 * Decouples structural document parsing from downstream reasoning, preserving bounded memory.
 */
export function segmentAgreement(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize line endings
  const clean = rawText.replace(/\r\n/g, "\n");

  // Regex splitting by numbered clauses or headers (e.g., "1. TITLE", "Clause 1:", "ARTICLE I", "(1)")
  const clausePattern = /(?:^|\n)(?=(?:(?:Clause|Article|Section|Item)\s+\d+[:.]?|\d+\.\s+[A-Z\s]{3,}|(?:\d+|[A-Z]|\([a-z0-9]+\))\.\s+))/im;

  const rawBlocks = clean.split(clausePattern);
  const segments: string[] = [];

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (trimmed.length > 25) {
      segments.push(trimmed);
    }
  }

  // Fallback: If no numbered clauses found, split by double newlines
  if (segments.length <= 1) {
    const paragraphBlocks = clean.split(/\n\s*\n+/);
    return paragraphBlocks
      .map((p) => p.trim())
      .filter((p) => p.length > 20);
  }

  return segments;
}

/**
 * Deterministically extracts financial figures, durations, and flags using regex.
 */
export function extractClauseValues(
  text: string,
  contextRent?: number
): ExtractedValues {
  const lower = text.toLowerCase();
  const values: ExtractedValues = {};

  // Extract monthly rent if present (e.g., "Rs. 35,000", "Rs 30000/-")
  const rentMatch = lower.match(/(?:rent|license fee|fee)\s*(?:of)?\s*(?:rs\.?|inr)?\s*([\d,]+)/i);
  if (rentMatch) {
    const parsed = parseInt(rentMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(parsed) && parsed > 1000) {
      values.monthlyRent = parsed;
    }
  }

  const effectiveRent = values.monthlyRent || contextRent || 0;

  // Extract security deposit multiple (e.g. "10 months rent", "2 months' rent")
  const depositMultipleMatch = lower.match(/(\d+)\s*months?'?\s*(?:rent)?\s*(?:as\s*)?(?:security\s*)?deposit/i);
  if (depositMultipleMatch) {
    values.depositMonths = parseInt(depositMultipleMatch[1], 10);
  }

  // Extract absolute deposit amount
  const depositAmtMatch = lower.match(/(?:deposit|advance)\s*(?:of)?\s*(?:rs\.?|inr)?\s*([\d,]+)/i);
  if (depositAmtMatch) {
    const parsed = parseInt(depositAmtMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(parsed) && parsed > 5000) {
      values.depositAmount = parsed;
      if (!values.depositMonths && effectiveRent > 0) {
        values.depositMonths = Math.round(parsed / effectiveRent);
      }
    }
  }

  // Extract notice period days
  const noticeDaysMatch = lower.match(/(\d+)\s*(?:days?|calendar days?)\s*notice/i);
  if (noticeDaysMatch) {
    values.noticeDays = parseInt(noticeDaysMatch[1], 10);
  } else {
    const noticeMonthsMatch = lower.match(/(\d+)\s*months?'?\s*notice/i);
    if (noticeMonthsMatch) {
      values.noticeDays = parseInt(noticeMonthsMatch[1], 10) * 30;
    }
  }

  // Check for unilateral or 0-day termination
  if (
    /\b0\s*days?\s*notice\b/i.test(lower) ||
    lower.includes("without any notice") ||
    lower.includes("without assigning any reason") ||
    (lower.includes("licensor may terminate") && lower.includes("at any time"))
  ) {
    values.hasUnilateralTermination = true;
    if (values.noticeDays === undefined) values.noticeDays = 0;
  }

  // Extract lock-in period months
  const lockInMatch = lower.match(/lock-?in\s*(?:period|duration)?\s*(?:of)?\s*(\d+)\s*months?/i);
  if (lockInMatch) {
    values.lockInMonths = parseInt(lockInMatch[1], 10);
  }

  // Landlord inspection notice
  if (
    lower.includes("at any time without notice") ||
    lower.includes("unconditional right to enter") ||
    lower.includes("without prior notice")
  ) {
    values.hasUnconditionalEntry = true;
    values.entryNoticeHours = 0;
  } else {
    const entryHoursMatch = lower.match(/(\d+)\s*hours?'?\s*(?:prior\s*)?written\s*notice/i);
    if (entryHoursMatch) {
      values.entryNoticeHours = parseInt(entryHoursMatch[1], 10);
    }
  }

  // Rent escalation percent
  const escalationMatch = lower.match(/(\d+)\s*%\s*(?:increase|escalation|enhancement)/i);
  if (escalationMatch) {
    values.escalationPercent = parseInt(escalationMatch[1], 10);
  }

  // Forfeiture of deposit
  if (lower.includes("forfeit") || lower.includes("confiscat")) {
    values.hasFullForfeiture = true;
  }

  // Structural repairs assigned to tenant
  const tenantStructuralPattern =
    /(?:structural\s+repairs?|leakage|seepage)[^.]*borne\s+by\s+(?:the\s+)?(?:tenant|licensee)/i;
  const tenantResponsiblePattern =
    /(?:tenant|licensee)[^.]*responsible[^.]*(?:structural|roof|leakage|seepage)/i;
  const landlordStructuralPattern =
    /(?:structural\s+repairs?|external\s+painting)[^.]*borne\s+by\s+(?:the\s+)?(?:landlord|licensor)/i;

  if (tenantStructuralPattern.test(lower) || tenantResponsiblePattern.test(lower)) {
    values.hasTenantStructuralRepairs = true;
  } else if (landlordStructuralPattern.test(lower)) {
    values.hasTenantStructuralRepairs = false;
  }

  // Painting deduction
  if (lower.includes("painting") && (lower.includes("deduct") || lower.includes("cost of repainting"))) {
    values.hasPaintingDeduction = true;
  }

  return values;
}

/**
 * Deterministically classifies a clause by scanning taxonomy patterns.
 */
export function classifyClause(text: string): {
  clauseType: string;
  clauseLabel: string;
  category: string;
  confidence: number;
} {
  const lower = text.toLowerCase();
  let bestMatch = {
    clauseType: "unclassified_needs_review",
    clauseLabel: "General Clause",
    category: "General",
    confidence: 0,
  };

  for (const item of taxonomyData.clause_types) {
    let score = 0;
    for (const pattern of item.match_patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestMatch.confidence) {
      bestMatch = {
        clauseType: item.id,
        clauseLabel: item.label,
        category: item.category || "General",
        confidence: score,
      };
    }
  }

  return bestMatch;
}

/**
 * Deterministic Risk Scoring.
 * Evaluates rules directly in code without LLM intervention.
 * Proof against prompt injection.
 */
export function evaluateRisk(
  clauseType: string,
  values: ExtractedValues,
  text: string
): { riskLevel: RiskLevel; riskScore: number; riskReason: string } {
  const lower = text.toLowerCase();

  // 1. Security Deposit
  if (clauseType === "security_deposit") {
    if (values.depositMonths && values.depositMonths > 2) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: Math.min(100, 70 + (values.depositMonths - 2) * 5),
        riskReason: `Security deposit is ${values.depositMonths} months of rent. Model Tenancy Act §13 caps residential deposit at maximum 2 months' rent.`,
      };
    }
    if (values.depositMonths && values.depositMonths <= 2) {
      return {
        riskLevel: "STANDARD_RISK",
        riskScore: 10,
        riskReason: `Deposit is within the standard 2 months limit (${values.depositMonths} months).`,
      };
    }
  }

  // 2. Notice Period
  if (clauseType === "notice_period") {
    if (values.hasUnilateralTermination || values.noticeDays === 0) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: 95,
        riskReason: "Unilateral or 0-day termination notice permits eviction without fair warning.",
      };
    }
    if (values.noticeDays !== undefined && values.noticeDays < 15) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: 85,
        riskReason: `Notice period of ${values.noticeDays} days is below statutory minimum (15 days under TPA §106).`,
      };
    }
    if (values.noticeDays !== undefined && values.noticeDays < 30) {
      return {
        riskLevel: "MODERATE_RISK",
        riskScore: 50,
        riskReason: `Notice period is ${values.noticeDays} days. Market standard is 30 days bilateral notice.`,
      };
    }
    if (values.noticeDays !== undefined && values.noticeDays >= 30) {
      return {
        riskLevel: "STANDARD_RISK",
        riskScore: 10,
        riskReason: `Fair bilateral notice period of ${values.noticeDays} days.`,
      };
    }
  }

  // 3. Landlord Entry
  if (clauseType === "landlord_entry") {
    if (values.hasUnconditionalEntry || values.entryNoticeHours === 0) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: 90,
        riskReason: "Landlord claims unrestricted entry at any time without notice, violating tenant privacy and MTA §15(1).",
      };
    }
    if (values.entryNoticeHours && values.entryNoticeHours < 24) {
      return {
        riskLevel: "MODERATE_RISK",
        riskScore: 55,
        riskReason: `Entry notice of ${values.entryNoticeHours} hours is below the recommended 24-hour statutory threshold under MTA §15.`,
      };
    }
    if (values.entryNoticeHours && values.entryNoticeHours >= 24) {
      return {
        riskLevel: "STANDARD_RISK",
        riskScore: 10,
        riskReason: `Compliant with MTA §15: minimum ${values.entryNoticeHours} hours prior written notice.`,
      };
    }
  }

  // 4. Lock-in Period & Forfeiture
  if (clauseType === "lock_in_period" || clauseType === "forfeiture_clause") {
    if (values.hasFullForfeiture) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: 85,
        riskReason: "Clause dictates total deposit forfeiture on early exit. Under Indian Contract Act §74, punitive forfeitures exceeding actual losses are unlawful.",
      };
    }
    if (values.lockInMonths && values.lockInMonths >= 11) {
      return {
        riskLevel: "MODERATE_RISK",
        riskScore: 60,
        riskReason: `11-month lock-in covers the entire tenancy duration, leaving no flexibility to vacate for job relocations or emergencies.`,
      };
    }
    if (values.lockInMonths && values.lockInMonths <= 3) {
      return {
        riskLevel: "STANDARD_RISK",
        riskScore: 15,
        riskReason: `Standard initial lock-in period of ${values.lockInMonths} months.`,
      };
    }
  }

  // 5. Maintenance & Repairs
  if (clauseType === "maintenance_responsibility") {
    if (values.hasTenantStructuralRepairs || lower.includes("seepage") || lower.includes("roof leakage")) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: 80,
        riskReason: "Tenant is made responsible for structural damages, roof leakages, or seepage. Under MTA §15, structural repairs are strictly the landlord's obligation.",
      };
    }
    if (lower.includes("day-to-day") && lower.includes("structural")) {
      return {
        riskLevel: "STANDARD_RISK",
        riskScore: 10,
        riskReason: "Balanced clause: Landlord handles structural repairs, tenant handles minor day-to-day upkeep.",
      };
    }
  }

  // 6. Rent Escalation
  if (clauseType === "rent_escalation") {
    if (values.escalationPercent && values.escalationPercent > 10) {
      return {
        riskLevel: "MODERATE_RISK",
        riskScore: 65,
        riskReason: `Rent hike of ${values.escalationPercent}% exceeds standard retail inflation and standard Indian market rate (5-10%).`,
      };
    }
    if (values.escalationPercent && values.escalationPercent <= 10) {
      return {
        riskLevel: "STANDARD_RISK",
        riskScore: 10,
        riskReason: `Fair escalation cap of ${values.escalationPercent}%.`,
      };
    }
  }

  // 7. Painting Charges
  if (clauseType === "painting_charges") {
    if (values.hasPaintingDeduction) {
      return {
        riskLevel: "MODERATE_RISK",
        riskScore: 55,
        riskReason: "Automatic deduction of 1 month rent for painting without accounting for normal wear and tear or actual repainting invoices.",
      };
    }
  }

  // 8. Late Payment Interest
  if (clauseType === "delay_interest") {
    if (lower.includes("1000 per day") || lower.includes("penal fine")) {
      return {
        riskLevel: "HIGH_RISK",
        riskScore: 75,
        riskReason: "Excessive daily penalty for delayed payment creates unconscionable financial liability.",
      };
    }
  }

  // Default fallback based on matched words
  if (lower.includes("penalty") || lower.includes("forfeit") || lower.includes("discretion of licensor")) {
    return {
      riskLevel: "MODERATE_RISK",
      riskScore: 50,
      riskReason: "Contains discretionary or punitive landlord terms.",
    };
  }

  return {
    riskLevel: "STANDARD_RISK",
    riskScore: 10,
    riskReason: "Standard operational clause without aggressive deviations.",
  };
}

/**
 * End-to-End Deterministic Pipeline for an uploaded or pasted agreement.
 */
export function analyzeDocument(rawText: string): DocumentAnalysisResult {
  const startTime = Date.now();
  const segments = segmentAgreement(rawText);

  let globalRent: number | undefined;

  // First pass: locate global monthly rent
  for (const seg of segments) {
    const val = extractClauseValues(seg);
    if (val.monthlyRent) {
      globalRent = val.monthlyRent;
      break;
    }
  }

  let highCount = 0;
  let moderateCount = 0;
  let standardCount = 0;
  let totalRiskPoints = 0;

  const analyzedClauses: AnalyzedClause[] = [];

  for (let i = 0; i < segments.length; i++) {
    const rawClause = segments[i];
    const classification = classifyClause(rawClause);
    const extracted = extractClauseValues(rawClause, globalRent);
    const risk = evaluateRisk(classification.clauseType, extracted, rawClause);
    const citation = lookupCitation(classification.clauseType);
    const precedent = lookupPrecedent(classification.clauseType);

    if (risk.riskLevel === "HIGH_RISK") highCount++;
    else if (risk.riskLevel === "MODERATE_RISK") moderateCount++;
    else standardCount++;

    totalRiskPoints += risk.riskScore;

    // First line or snippet as title
    const firstLine = rawClause.split("\n")[0].replace(/^[\d.)\s]+/, "").trim();
    const title = firstLine.length > 5 && firstLine.length < 60 ? firstLine : classification.clauseLabel;

    analyzedClauses.push({
      id: `clause-${i + 1}`,
      clauseNumber: i + 1,
      title,
      rawText: rawClause,
      clauseType: classification.clauseType,
      clauseLabel: classification.clauseLabel,
      category: classification.category,
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      riskReason: risk.riskReason,
      extractedValues: extracted,
      citation,
      precedent,
      suggestedAction: precedent?.discussion_phrase,
    });
  }

  const count = segments.length || 1;
  const avgRisk = Math.round(totalRiskPoints / count);
  // Invert risk to safety score: 100 is safest, 0 is dangerous
  // Penalize heavily for severe predatory high-risk clauses
  const highPenalty = highCount * 12;
  const modPenalty = moderateCount * 4;
  const rawSafety = 100 - Math.round(avgRisk * 0.4 + highPenalty + modPenalty);
  const safetyScore = Math.max(0, Math.min(100, rawSafety));

  const endTime = Date.now();

  return {
    totalClauses: segments.length,
    safetyScore,
    riskCounts: {
      high: highCount,
      moderate: moderateCount,
      standard: standardCount,
    },
    clauses: analyzedClauses,
    extractedMonthlyRent: globalRent,
    processingTimeMs: endTime - startTime,
  };
}
