"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Cpu,
  RefreshCw,
} from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onKeySaved,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    model?: string;
    error?: string;
    status?: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gemini_api_key") || "";
      setApiKey(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || "Failed to reach test endpoint" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("gemini_api_key", trimmed);
      } else {
        localStorage.removeItem("gemini_api_key");
      }
    }
    onKeySaved(trimmed);
    onClose();
  };

  const handleClear = () => {
    setApiKey("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("gemini_api_key");
    }
    onKeySaved("");
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090d16] border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Reasoning Engine Settings
              </h2>
              <p className="text-xs text-slate-400">
                Google Gemini API &amp; Local Statutory Grounding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Architecture Overview */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dual-Architecture Reliability</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            VerifiedVakil uses a hybrid architecture: When a valid Gemini key is active, Gemini 3.6 Flash / 2.5 Flash powers real-time multimodal OCR and conversational analysis. If the API is unreachable, our deterministic engine automatically extracts real document figures with zero hallucinations.
          </p>
        </div>

        {/* Key Input Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              Google Gemini API Key
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              Get Free Key from Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Live Test Status Banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs space-y-1 ${
              testResult.success
                ? "bg-emerald-950/50 border border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/40 border border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Connected to Google Gemini ({testResult.model})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Google API Error {testResult.status ? `(${testResult.status})` : ""}</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {testResult.success
                ? "Live Gemini multi-model reasoning and Vision OCR are fully operational."
                : testResult.error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
          >
            Clear Stored Key
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{testing ? "Testing..." : "Test Connection"}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Save &amp; Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
