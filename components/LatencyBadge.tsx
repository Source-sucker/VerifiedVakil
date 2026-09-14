"use client";

import React from "react";
import { Zap, Cpu, Clock } from "lucide-react";

interface LatencyBadgeProps {
  deterministicMs?: number;
  aiMs?: number;
  totalMs?: number;
}

export default function LatencyBadge({
  deterministicMs = 0,
  aiMs = 0,
  totalMs = 0,
}: LatencyBadgeProps) {
  if (!totalMs && !deterministicMs) return null;

  return (
    <div
      className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-full px-3 py-1 text-xs text-slate-300 shadow-sm"
      title="Real measured roundtrip processing latency"
      aria-label="Measured execution latency"
    >
      <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
        <Cpu className="w-3 h-3" aria-hidden="true" />
        Deterministic: {deterministicMs}ms
      </span>
      <span className="text-slate-600">•</span>
      <span className="flex items-center gap-1 text-indigo-400 font-mono font-medium">
        <Zap className="w-3 h-3" aria-hidden="true" />
        Gemini: {aiMs}ms
      </span>
      <span className="text-slate-600">•</span>
      <span className="flex items-center gap-1 text-slate-300 font-mono">
        <Clock className="w-3 h-3" aria-hidden="true" />
        Total: {totalMs}ms
      </span>
    </div>
  );
}
