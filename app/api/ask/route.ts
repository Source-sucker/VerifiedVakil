import { NextRequest, NextResponse } from "next/server";
import { askDocumentQuestionWithAI } from "@/lib/geminiClient";
import { AnalyzedClause } from "@/lib/clauseEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, clauses = [] } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'question' is required." },
        { status: 400 }
      );
    }

    const qLower = question.toLowerCase();

    // Deterministic ranking of clauses based on question keywords
    const scoredClauses = (clauses as AnalyzedClause[]).map((c) => {
      let matchScore = 0;
      const textLower = (c.rawText + " " + c.clauseLabel + " " + c.category).toLowerCase();
      const words = qLower.split(/\s+/).filter((w) => w.length > 3);

      for (const w of words) {
        if (textLower.includes(w)) matchScore += 2;
      }
      if (textLower.includes(c.clauseType.replace("_", " "))) matchScore += 3;

      return { clause: c, score: matchScore };
    });

    scoredClauses.sort((a, b) => b.score - a.score);

    // Pick top 3 relevant clauses, or all if few
    const topClauses = scoredClauses
      .filter((sc) => sc.score > 0 || scoredClauses.length <= 3)
      .slice(0, 3)
      .map((sc) => ({
        rawText: sc.clause.rawText,
        clauseLabel: sc.clause.clauseLabel,
        citation: sc.clause.citation,
      }));

    const result = await askDocumentQuestionWithAI(question, topClauses);

    return NextResponse.json({
      success: true,
      answer: result.answer,
      isRefusal: result.isRefusal,
      latencyMs: result.latencyMs,
      retrievedClausesCount: topClauses.length,
    });
  } catch (error: any) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      { error: "Failed to answer question", details: error?.message },
      { status: 500 }
    );
  }
}
