import { NextRequest, NextResponse } from "next/server";
import { generateChecklistWithAI } from "@/lib/geminiClient";
import { AnalyzedClause } from "@/lib/clauseEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clauses = [] } = body;

    const flagged = (clauses as AnalyzedClause[])
      .filter((c) => c.riskLevel === "HIGH_RISK" || c.riskLevel === "MODERATE_RISK")
      .map((c) => ({
        id: c.id,
        clauseLabel: c.clauseLabel,
        riskReason: c.riskReason,
        citation: c.citation,
      }));

    const result = await generateChecklistWithAI(flagged);

    return NextResponse.json({
      success: true,
      checklist: result.checklist,
      latencyMs: result.latencyMs,
    });
  } catch (error: any) {
    console.error("Checklist API error:", error);
    return NextResponse.json(
      { error: "Failed to generate checklist", details: error?.message },
      { status: 500 }
    );
  }
}
