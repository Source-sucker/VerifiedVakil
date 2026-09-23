"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Camera,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ScanText,
} from "lucide-react";

interface DocumentUploadZoneProps {
  onDocumentLoaded: (text: string, sourceName: string) => void;
  isLoading: boolean;
}

export default function DocumentUploadZone({
  onDocumentLoaded,
  isLoading,
}: DocumentUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) onDocumentLoaded(text, file.name);
      };
      reader.readAsText(file);
      return;
    }

    if (file.type.startsWith("image/") || file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
      setOcrProcessing(true);
      setOcrStatus("Running Gemini 2.5 Flash Multimodal OCR on document scan...");

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const resultStr = e.target?.result as string;
          const base64Data = resultStr.split(",")[1];
          const mimeType = file.type || "image/jpeg";

          const clientApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
          const res = await fetch("/api/ocr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(clientApiKey ? { "x-gemini-api-key": clientApiKey } : {}),
            },
            body: JSON.stringify({ base64Data, mimeType }),
          });

          const data = await res.json();
          if (data.success && data.text && !data.text.startsWith("No readable legal text")) {
            setOcrStatus(`✓ OCR complete in ${data.latencyMs || 450}ms — ${data.text.length} chars extracted!`);
            setTimeout(() => {
              onDocumentLoaded(data.text, `Scanned: ${file.name}`);
              setOcrProcessing(false);
              setOcrStatus(null);
            }, 600);
          } else {
            setOcrStatus(
              data.text && data.text.startsWith("No readable legal text")
                ? data.text
                : "Could not extract readable legal text from this image. Please ensure it is sharp, or paste text."
            );
            setOcrProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("OCR error:", err);
        setOcrStatus("Error during OCR. Please paste text directly.");
        setOcrProcessing(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) onDocumentLoaded(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className="relative overflow-hidden rounded-2xl text-center transition-all duration-300 cursor-pointer group"
      style={{
        background: dragOver
          ? "rgba(34,211,238,0.06)"
          : "rgba(11,16,30,0.6)",
        border: dragOver
          ? "2px dashed rgba(34,211,238,0.5)"
          : "2px dashed rgba(255,255,255,0.08)",
        boxShadow: dragOver
          ? "0 0 40px rgba(34,211,238,0.1) inset, 0 8px 32px rgba(0,0,0,0.3)"
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      {/* Ambient corner glow when dragging */}
      {dragOver && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.08) 0%, transparent 70%)",
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.png,.jpg,.jpeg,.webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        }}
        className="hidden"
      />

      <div className="py-10 px-6 flex flex-col items-center gap-4">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            background: "linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(99,102,241,0.12) 100%)",
            border: "1px solid rgba(34,211,238,0.2)",
            boxShadow: "0 0 24px rgba(34,211,238,0.1)",
          }}
        >
          {ocrProcessing ? (
            <ScanText className="w-7 h-7 animate-pulse" style={{ color: "#22d3ee" }} />
          ) : (
            <Upload className="w-7 h-7" style={{ color: "#22d3ee" }} />
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
            {dragOver ? "Drop to analyze agreement" : "Drop or click to upload"}
          </h3>
          <p className="text-xs max-w-xs mx-auto" style={{ color: "#475569" }}>
            Accepts{" "}
            <span className="font-mono" style={{ color: "#22d3ee" }}>.txt</span>
            {" "}files and image scans{" "}
            <span className="font-mono" style={{ color: "#22d3ee" }}>(.png, .jpg)</span>
            {" "}— scans are transcribed with Gemini Multimodal OCR.
          </p>
        </div>

        {/* Action button */}
        <button
          type="button"
          disabled={ocrProcessing || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8",
            cursor: ocrProcessing ? "wait" : "pointer",
          }}
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        >
          <Camera className="w-3.5 h-3.5" style={{ color: "#22d3ee" }} />
          Browse File
        </button>

        {/* Supported formats row */}
        <div className="flex items-center gap-3">
          {[
            { label: ".txt", color: "#22d3ee" },
            { label: ".png", color: "#818cf8" },
            { label: ".jpg", color: "#818cf8" },
            { label: ".jpeg", color: "#818cf8" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid rgba(255,255,255,0.07)`,
                color,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* OCR Status */}
        {ocrStatus && (
          <div
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-mono animate-fade-in-up"
            style={{
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22d3ee",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            {ocrStatus}
          </div>
        )}
      </div>
    </div>
  );
}
