import { NextRequest, NextResponse } from "next/server";
import { testGeminiConnection } from "@/lib/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = body.apiKey || req.headers.get("x-gemini-api-key") || undefined;

    const result = await testGeminiConnection(apiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal test error" },
      { status: 500 }
    );
  }
}
