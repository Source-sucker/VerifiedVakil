"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Camera,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
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

    // Check if plain text
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          onDocumentLoaded(text, file.name);
        }
      };
      reader.readAsText(file);
      return;
    }

    // If image, run Gemini Multimodal OCR
    if (file.type.startsWith("image/") || file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
      setOcrProcessing(true);
      setOcrStatus("Running Gemini 2.5 Flash Multimodal OCR on document scan...");

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const resultStr = e.target?.result as string;
          // Extract base64 without data URI prefix
          const base64Data = resultStr.split(",")[1];
          const mimeType = file.type || "image/jpeg";

          const res = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Data, mimeType }),
          });

          const data = await res.json();
          if (data.success && data.text) {
            setOcrStatus(`OCR complete in ${data.latencyMs || 450}ms! Analyzing clauses...`);
            setTimeout(() => {
              onDocumentLoaded(data.text, `Scanned: ${file.name}`);
              setOcrProcessing(false);
              setOcrStatus(null);
            }, 600);
          } else {
            setOcrStatus("OCR could not transcribe text. Please upload plain text.");
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

    // Fallback: try reading as text
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
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`glass-panel rounded-2xl p-6 border-2 border-dashed transition-all text-center relative overflow-hidden ${
        dragOver
          ? "border-cyan-400 bg-cyan-950/20 shadow-xl shadow-cyan-950/40"
          : "border-slate-800/90 hover:border-slate-700 bg-slate-950/40"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.png,.jpg,.jpeg,.webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          {ocrProcessing ? (
            <ScanText className="w-6 h-6 text-cyan-400 animate-pulse" />
          ) : (
            <Upload className="w-6 h-6 text-cyan-400" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">
            Upload Agreement (Text Document or Scanned Image)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Drag & drop your residential rental agreement here, or click to browse.
            Supports <span className="text-cyan-300 font-mono">.txt</span> and image scans (<span className="text-cyan-300 font-mono">.png, .jpg</span>) transcribed with Gemini Multimodal OCR.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={ocrProcessing || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white shadow-md transition-all"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          Browse Agreement File
        </button>

        {/* OCR Status readout */}
        {ocrStatus && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-full font-mono animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            {ocrStatus}
          </div>
        )}
      </div>
    </div>
  );
}
