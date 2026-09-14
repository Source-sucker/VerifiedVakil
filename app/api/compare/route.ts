import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument, AnalyzedClause } from "@/lib/clauseEngine";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userText, baselineText } = body;

    if (!userText || typeof userText !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'userText' is required." },
        { status: 400 }
      );
    }

    // If baselineText is not provided, load the standard fair lease
    if (!baselineText) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          "sample-docs",
          "sample-lease-fair.txt"
        );
        baselineText = fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        baselineText = "Standard 11 month agreement. Security deposit 2 months. Notice period 30 days. Inspection 24h notice.";
      }
    }

    const userAnalysis = analyzeDocument(userText);
    const baselineAnalysis = analyzeDocument(baselineText);

    // Build comparison metrics
    const findClause = (clauses: AnalyzedClause[], type: string) =>
      clauses.find((c) => c.clauseType === type);

    const userDeposit = findClause(userAnalysis.clauses, "security_deposit");
    const baseDeposit = findClause(baselineAnalysis.clauses, "security_deposit");

    const userNotice = findClause(userAnalysis.clauses, "notice_period");
    const baseNotice = findClause(baselineAnalysis.clauses, "notice_period");

    const userEntry = findClause(userAnalysis.clauses, "landlord_entry");
    const baseEntry = findClause(baselineAnalysis.clauses, "landlord_entry");

    const userLockIn = findClause(userAnalysis.clauses, "lock_in_period");
    const baseLockIn = findClause(baselineAnalysis.clauses, "lock_in_period");

    const userRepairs = findClause(userAnalysis.clauses, "maintenance_responsibility");
    const baseRepairs = findClause(baselineAnalysis.clauses, "maintenance_responsibility");

    const userEscalation = findClause(userAnalysis.clauses, "rent_escalation");
    const baseEscalation = findClause(baselineAnalysis.clauses, "rent_escalation");

    const comparisons = [
      {
        feature: "Security Deposit",
        userValue: userDeposit?.extractedValues.depositMonths
          ? `${userDeposit.extractedValues.depositMonths} months rent`
          : "Not specified",
        baselineValue: baseDeposit?.extractedValues.depositMonths
          ? `${baseDeposit.extractedValues.depositMonths} months rent (MTA §13 Cap)`
          : "2 months rent",
        isFavorableToTenant:
          (userDeposit?.extractedValues.depositMonths || 10) <= 2,
        userRisk: userDeposit?.riskLevel || "STANDARD_RISK",
        statutoryStandard: "Max 2 months for residential (MTA §13)",
      },
      {
        feature: "Notice Period",
        userValue:
          userNotice?.extractedValues.noticeDays !== undefined
            ? `${userNotice.extractedValues.noticeDays} days`
            : "Not specified",
        baselineValue:
          baseNotice?.extractedValues.noticeDays !== undefined
            ? `${baseNotice.extractedValues.noticeDays} days`
            : "30 days bilateral",
        isFavorableToTenant:
          (userNotice?.extractedValues.noticeDays || 0) >= 30,
        userRisk: userNotice?.riskLevel || "STANDARD_RISK",
        statutoryStandard: "15-30 days bilateral notice (TPA §106)",
      },
      {
        feature: "Landlord Inspection Notice",
        userValue:
          userEntry?.extractedValues.entryNoticeHours !== undefined
            ? `${userEntry.extractedValues.entryNoticeHours} hours notice`
            : userEntry?.extractedValues.hasUnconditionalEntry
            ? "Unconditional / 0 notice"
            : "Not specified",
        baselineValue: "24 hours prior written notice",
        isFavorableToTenant:
          (userEntry?.extractedValues.entryNoticeHours || 0) >= 24,
        userRisk: userEntry?.riskLevel || "STANDARD_RISK",
        statutoryStandard: "Minimum 24 hours written notice (MTA §15)",
      },
      {
        feature: "Lock-in Period",
        userValue: userLockIn?.extractedValues.lockInMonths
          ? `${userLockIn.extractedValues.lockInMonths} months`
          : "None",
        baselineValue: "3 months (or None)",
        isFavorableToTenant:
          (userLockIn?.extractedValues.lockInMonths || 0) <= 3,
        userRisk: userLockIn?.riskLevel || "STANDARD_RISK",
        statutoryStandard: "Reasonable initial term without full deposit forfeiture",
      },
      {
        feature: "Major / Structural Repairs",
        userValue: userRepairs?.extractedValues.hasTenantStructuralRepairs
          ? "Tenant pays structural repairs"
          : "Standard split",
        baselineValue: "Landlord covers structural & external",
        isFavorableToTenant: !userRepairs?.extractedValues.hasTenantStructuralRepairs,
        userRisk: userRepairs?.riskLevel || "STANDARD_RISK",
        statutoryStandard: "Landlord obligation under MTA Second Schedule",
      },
      {
        feature: "Annual Rent Escalation",
        userValue: userEscalation?.extractedValues.escalationPercent
          ? `${userEscalation.extractedValues.escalationPercent}%`
          : "Not specified",
        baselineValue: "5% per annum",
        isFavorableToTenant:
          (userEscalation?.extractedValues.escalationPercent || 5) <= 10,
        userRisk: userEscalation?.riskLevel || "STANDARD_RISK",
        statutoryStandard: "Standard inflation cap (5% to 10%)",
      },
    ];

    return NextResponse.json({
      success: true,
      userSafetyScore: userAnalysis.safetyScore,
      baselineSafetyScore: baselineAnalysis.safetyScore,
      userTotalClauses: userAnalysis.totalClauses,
      baselineTotalClauses: baselineAnalysis.totalClauses,
      userRiskCounts: userAnalysis.riskCounts,
      baselineRiskCounts: baselineAnalysis.riskCounts,
      comparisons,
    });
  } catch (error: any) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: "Failed to compare documents", details: error?.message },
      { status: 500 }
    );
  }
}
