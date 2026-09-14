"use client";

import React from "react";
import { AlertTriangle, Scale, ShieldCheck } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div
      role="region"
      aria-label="Statutory Legal Disclaimer"
      className="w-full bg-slate-900/90 border-b border-indigo-500/20 text-xs px-4 py-2 text-slate-300 flex items-center justify-between no-print"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-white font-medium">Statutory Notice:</strong> VerifiedVakil provides automated legal information & statutory risk analysis, not formal legal advice.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            Citation-Locked to India Code
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">Always confirm with a qualified lawyer before signing</span>
        </div>
      </div>
    </div>
  );
}
