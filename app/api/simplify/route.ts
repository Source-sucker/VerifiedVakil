import { NextRequest, NextResponse } from "next/server";
import { simplifyClauseWithAI } from "@/lib/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clauseText = body.clauseText || body.text || body.clause?.rawText;
    const clauseLabel = body.clauseLabel || body.label || body.clause?.clauseLabel || "Tenancy Clause";

    if (!clauseText || typeof clauseText !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'clauseText' string is required." },
        { status: 400 }
      );
    }

    const clientApiKey = req.headers.get("x-gemini-api-key") || body.apiKey || undefined;
    const result = await simplifyClauseWithAI(clauseText, clauseLabel, clientApiKey);

    return NextResponse.json({
      success: true,
      plainRewrite: result.plainRewrite,
      latencyMs: result.latencyMs,
    });
  } catch (error: any) {
    console.error("Simplify API error:", error);
    return NextResponse.json(
      { error: "Failed to simplify clause.", details: error?.message },
      { status: 500 }
    );
  }
}
