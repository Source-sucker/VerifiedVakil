import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/clauseEngine";
import { simplifyClauseWithAI, explainRiskWithAI } from "@/lib/geminiClient";

export async function POST(req: NextRequest) {
  const reqStart = Date.now();

  try {
    const body = await req.json();
    const { text, runAI = true } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'text' string is required." },
        { status: 400 }
      );
    }

    // 1. DETERMINISTIC PASS
    const detStart = Date.now();
    const analysis = analyzeDocument(text);
    const deterministicMs = Date.now() - detStart;

    // 2. GENAI ENRICHMENT (PARALLELIZED)
    let aiMs = 0;
    if (runAI && analysis.clauses.length > 0) {
      const aiStart = Date.now();

      await Promise.all(
        analysis.clauses.map(async (clause) => {
          const [simResult, riskResult] = await Promise.all([
            simplifyClauseWithAI(clause.rawText, clause.clauseLabel),
            explainRiskWithAI(
              clause.rawText,
              clause.riskScore,
              clause.riskReason,
              clause.citation
            ),
          ]);

          clause.plainRewrite = simResult.plainRewrite;
          clause.aiExplanation = riskResult.explanation;
          clause.suggestedAction = riskResult.suggestedAction;
        })
      );

      aiMs = Date.now() - aiStart;
    }

    const totalMs = Date.now() - reqStart;

    return NextResponse.json({
      success: true,
      data: analysis,
      timings: {
        deterministicMs,
        aiMs,
        totalMs,
      },
    });
  } catch (error: any) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document", details: error?.message },
      { status: 500 }
    );
  }
}
