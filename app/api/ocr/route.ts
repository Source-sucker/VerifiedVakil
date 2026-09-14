import { NextRequest, NextResponse } from "next/server";
import { performOCRWithGemini } from "@/lib/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64Data, mimeType = "image/jpeg" } = body;

    if (!base64Data) {
      return NextResponse.json(
        { error: "Missing 'base64Data' in request payload." },
        { status: 400 }
      );
    }

    const result = await performOCRWithGemini(base64Data, mimeType);

    return NextResponse.json({
      success: true,
      text: result.text,
      latencyMs: result.latencyMs,
    });
  } catch (error: any) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "Failed to perform OCR on document", details: error?.message },
      { status: 500 }
    );
  }
}
