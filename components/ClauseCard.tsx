"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Scale,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
} from "lucide-react";
import { AnalyzedClause } from "@/lib/clauseEngine";

interface ClauseCardProps {
  clause: AnalyzedClause;
}

export default function ClauseCard({ clause }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const handleCopyWhatsApp = () => {
    const statute = clause.citation ? `${clause.citation.law} (${clause.citation.section_ref})` : "";
    const precedent = clause.precedent ? `Supreme Court in ${clause.precedent.case_title}` : "";
    const legalRef = [statute, precedent].filter(Boolean).join(" and ");
    const text = `Hi, regarding Clause #${clause.clauseNumber} (${clause.title}) in our draft agreement:\n"${clause.rawText}"\n\nI reviewed this clause and would like to request a fair adjustment. ${clause.riskReason ? `Specifically: ${clause.riskReason}. ` : ""}${legalRef ? `Under ${legalRef}, ` : ""}${clause.suggestedAction || "could we please update this clause to reflect standard bilateral terms?"}\n\nThank you!`;
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  return (
    <article
      id={clause.id}
      aria-label={`${clause.title} - ${clause.riskLevel}`}
      className="glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-xl transition-all duration-200 hover:border-slate-700/80"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 font-mono text-xs font-bold border border-slate-700">
            #{clause.clauseNumber}
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              {clause.title}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">
                {clause.category}
              </span>
            </h3>
          </div>
        </div>

        {/* 3-Pill Risk Indicator with dual visual coding (Icon + Text + Color) for full colorblind accessibility */}
        <div 
          role="status"
          aria-label={`Risk level: ${clause.riskLevel === "HIGH_RISK" ? "High Risk" : clause.riskLevel === "MODERATE_RISK" ? "Medium Risk" : "Low Risk"}`}
          className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono"
        >
          <span
            className={`px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
              clause.riskLevel === "STANDARD_RISK"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                : "text-slate-500 opacity-40"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" /> Low
          </span>
          <span
            className={`px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
              clause.riskLevel === "MODERATE_RISK"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                : "text-slate-500 opacity-40"
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Med
          </span>
          <span
            className={`px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
              clause.riskLevel === "HIGH_RISK"
                ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40"
                : "text-slate-500 opacity-40"
            }`}
          >
            <AlertCircle className="w-3 h-3" /> High
          </span>
        </div>
      </div>

      {/* Side-by-Side Inspection Layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Contract Legalese */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="uppercase tracking-wider text-[10px] text-slate-400">
                Original Contract Terms
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Deterministic Tag: {clause.clauseType}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
              {clause.rawText}
            </p>
          </div>

          {/* Statutory Citation Badge on Contract */}
          {clause.citation ? (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 text-sky-400 font-mono text-[11px]">
                <Scale className="w-3.5 h-3.5 shrink-0" />
                Verified: {clause.citation.section_ref}, {clause.citation.law}
              </span>
              <a
                href={clause.citation.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-sky-300 text-[11px] underline underline-offset-2 flex items-center gap-1 transition-colors"
              >
                India Code <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
              No verified statutory reference in database.
            </div>
          )}
        </div>

        {/* Right Column: Plain-English Rewrite & Tenant Negotiation Action */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-500/20 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Plain-English Rewrite (Gemini AI)
              </span>
              <span className="text-[11px] font-mono text-indigo-300">
                Risk Score: {clause.riskScore}/100
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
              {clause.plainRewrite || "Analyzing plain language meaning..."}
            </p>

            {/* Risk Explanation if flagged */}
            {clause.riskLevel !== "STANDARD_RISK" && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
                <strong>Why this is flagged:</strong> {clause.aiExplanation || clause.riskReason}
              </div>
            )}
          </div>

          {/* Tenant Negotiation & Discussion Action */}
          {clause.suggestedAction && (
            <div className="pt-2 border-t border-indigo-500/20 space-y-2">
              <div className="flex items-start gap-2 text-xs text-indigo-200">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Suggested Discussion Point:</strong>{" "}
                  <span>{clause.suggestedAction}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                title="Copy negotiation message formatted for WhatsApp"
                aria-label="Copy WhatsApp negotiation note"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied for WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy WhatsApp Note</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Supreme Court Landmark Precedent & Tenant Protection Shield */}
      {clause.precedent && (
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                <Scale className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-amber-200">
                  Landmark Supreme Court Precedent:
                </span>{" "}
                <span className="text-xs font-semibold text-white italic">
                  {clause.precedent.case_title}
                </span>
                <span className="ml-2 text-[11px] font-mono text-amber-300/80">
                  [{clause.precedent.citation}]
                </span>
              </div>
            </div>

            <a
              href={clause.precedent.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-amber-300 hover:text-amber-100 flex items-center gap-1 underline underline-offset-2 transition-colors"
            >
              Indian Kanoon Record <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block mb-0.5">
                Core Legal Holding (Section 74 / TPA)
              </span>
              <p className="text-slate-300 leading-relaxed">
                {clause.precedent.key_principle}
              </p>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-amber-500/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-0.5">
                Tenant Protection & Shield
              </span>
              <p className="text-emerald-200 leading-relaxed font-medium">
                {clause.precedent.tenant_benefit}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
