import { NextRequest, NextResponse } from "next/server";
import { explainRiskWithAI } from "@/lib/geminiClient";
import { VerifiedCitation, VerifiedPrecedent } from "@/lib/citationLookup";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clauseText = body.clauseText || body.text || body.clause?.rawText;
    const riskScore = typeof body.riskScore === "number" ? body.riskScore : (body.clause?.riskScore ?? 50);
    const riskReason = body.riskReason || body.clause?.riskReason || "Flagged tenancy clause";
    const citation: VerifiedCitation | null = body.citation || body.clause?.citation || null;
    const precedent: VerifiedPrecedent | null = body.precedent || body.clause?.precedent || null;

    if (!clauseText || typeof clauseText !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'clauseText' string is required." },
        { status: 400 }
      );
    }

    const clientApiKey = req.headers.get("x-gemini-api-key") || body.apiKey || undefined;
    const result = await explainRiskWithAI(
      clauseText,
      riskScore,
      riskReason,
      citation,
      precedent,
      clientApiKey
    );

    return NextResponse.json({
      success: true,
      explanation: result.explanation,
      suggestedAction: result.suggestedAction,
      latencyMs: result.latencyMs,
    });
  } catch (error: any) {
    console.error("Explain-risk API error:", error);
    return NextResponse.json(
      { error: "Failed to explain clause risk.", details: error?.message },
      { status: 500 }
    );
  }
}
