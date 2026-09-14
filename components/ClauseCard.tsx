"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Scale,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { AnalyzedClause, RiskLevel } from "@/lib/clauseEngine";

interface ClauseCardProps {
  clause: AnalyzedClause;
}

export default function ClauseCard({ clause }: ClauseCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case "HIGH_RISK":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />,
          label: "High Risk",
        };
      case "MODERATE_RISK":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />,
          label: "Moderate Risk",
        };
      case "STANDARD_RISK":
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />,
          label: "Standard / Low Risk",
        };
    }
  };

  const badge = getRiskBadge(clause.riskLevel);

  return (
    <article
      id={clause.id}
      aria-label={`${clause.title} - ${badge.label}`}
      className={`glass-panel rounded-xl p-5 transition-all duration-200 ${
        clause.riskLevel === "HIGH_RISK"
          ? "border-l-4 border-l-rose-500 hover:shadow-rose-950/20"
          : clause.riskLevel === "MODERATE_RISK"
          ? "border-l-4 border-l-amber-500"
          : "border-l-4 border-l-emerald-500"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
            #{clause.clauseNumber}
          </span>
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              {clause.title}
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                {clause.category}
              </span>
            </h3>
          </div>
        </div>

        {/* Risk Badge (Icon + Text) */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${badge.bg}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
          <span className="font-mono text-slate-400 text-[11px] ml-1">
            ({clause.riskScore}/100)
          </span>
        </div>
      </div>

      {/* Grid: Plain English Rewrite & Risk Explanation */}
      <div className="mt-4 space-y-4">
        {/* Plain Language Rewrite (Gemini) */}
        <div className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Plain-English Meaning
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {clause.plainRewrite || "Analyzing plain meaning..."}
          </p>
        </div>

        {/* Risk Assessment & Why It Matters */}
        {clause.riskLevel !== "STANDARD_RISK" && (
          <div className="bg-rose-950/15 border border-rose-500/20 rounded-lg p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              Risk Analysis & Tenant Impact
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              {clause.aiExplanation || clause.riskReason}
            </p>
          </div>
        )}

        {/* Citation Lock Section */}
        <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Scale className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
              Verified Statutory Citation (India Code)
            </span>
            {clause.citation && (
              <span className="text-[11px] text-slate-400">
                Verified: {clause.citation.last_verified}
              </span>
            )}
          </div>

          {clause.citation ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sky-300">
                  {clause.citation.law}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 font-mono text-[11px] border border-sky-800/50">
                  {clause.citation.section_ref}
                </span>
                <a
                  href={clause.citation.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-300 transition-colors text-[11px] underline underline-offset-2 ml-auto"
                >
                  View Official Act <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {clause.citation.plain_explanation}
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-[11px] italic">
              No verified statutory reference exists in our curated database for this clause type. Refusing to speculate; verify with a qualified advocate.
            </p>
          )}
        </div>

        {/* Recommended Action / Question for Landlord */}
        {clause.suggestedAction && (
          <div className="flex items-start gap-2 text-xs bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3 text-indigo-200">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-indigo-300 font-semibold block mb-0.5">
                Suggested Action / Question to Ask Landlord:
              </strong>
              <span>{clause.suggestedAction}</span>
            </div>
          </div>
        )}

        {/* Toggle Original Text Accordion */}
        <div className="pt-1">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            aria-expanded={showOriginal}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showOriginal ? "Hide Original Contract Wording" : "View Original Contract Wording"}</span>
            {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showOriginal && (
            <div className="mt-2 p-3 rounded bg-black/40 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
              {clause.rawText}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
