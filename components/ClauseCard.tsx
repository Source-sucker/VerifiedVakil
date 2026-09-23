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
  ShieldAlert,
} from "lucide-react";
import { AnalyzedClause } from "@/lib/clauseEngine";

interface ClauseCardProps {
  clause: AnalyzedClause;
}

const RISK_CONFIG = {
  HIGH_RISK: {
    borderColor: "rgba(239,68,68,0.28)",
    bg: "rgba(127,29,29,0.10)",
    glowColor: "rgba(239,68,68,0.08)",
    pillClass: "pill-high",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: "High Risk",
    leftPanelBg: "rgba(127,29,29,0.10)",
    leftPanelBorder: "rgba(239,68,68,0.15)",
    headerAccent: "#f87171",
    numberBg: "rgba(239,68,68,0.15)",
    numberColor: "#fca5a5",
    numberBorder: "rgba(239,68,68,0.3)",
  },
  MODERATE_RISK: {
    borderColor: "rgba(245,158,11,0.25)",
    bg: "rgba(120,53,15,0.09)",
    glowColor: "rgba(245,158,11,0.06)",
    pillClass: "pill-moderate",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Moderate Risk",
    leftPanelBg: "rgba(120,53,15,0.10)",
    leftPanelBorder: "rgba(245,158,11,0.15)",
    headerAccent: "#fbbf24",
    numberBg: "rgba(245,158,11,0.15)",
    numberColor: "#fcd34d",
    numberBorder: "rgba(245,158,11,0.3)",
  },
  STANDARD_RISK: {
    borderColor: "rgba(52,211,153,0.18)",
    bg: "rgba(6,78,59,0.07)",
    glowColor: "rgba(52,211,153,0.05)",
    pillClass: "pill-safe",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Standard",
    leftPanelBg: "rgba(6,78,59,0.08)",
    leftPanelBorder: "rgba(52,211,153,0.12)",
    headerAccent: "#34d399",
    numberBg: "rgba(52,211,153,0.12)",
    numberColor: "#6ee7b7",
    numberBorder: "rgba(52,211,153,0.25)",
  },
};

export default function ClauseCard({ clause }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const cfg = RISK_CONFIG[clause.riskLevel] ?? RISK_CONFIG.STANDARD_RISK;

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
      className="rounded-2xl transition-all duration-200 animate-fade-in-up"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.borderColor}`,
        boxShadow: `0 4px 24px ${cfg.glowColor}, 0 1px 0 rgba(255,255,255,0.04) inset`,
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
        style={{ borderBottom: expanded ? `1px solid ${cfg.borderColor}` : "none" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Clause number badge */}
          <span
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black tabular-nums"
            style={{
              background: cfg.numberBg,
              border: `1px solid ${cfg.numberBorder}`,
              color: cfg.numberColor,
            }}
          >
            {clause.clauseNumber}
          </span>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{clause.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                }}
              >
                {clause.category}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "#475569",
                }}
              >
                {clause.clauseType}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Risk pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.pillClass}`}>
            {cfg.icon}
            {cfg.label}
            <span className="text-[10px] opacity-70">({clause.riskScore}/100)</span>
          </span>

          {/* Expand / Collapse */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b",
            }}
            title={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Collapsible Body ─────────────────────────────── */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Side-by-side inspection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left: Original legalese */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: cfg.leftPanelBg,
                border: `1px solid ${cfg.leftPanelBorder}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="label-section">Original Contract</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#475569" }}
                >
                  §{clause.clauseNumber}
                </span>
              </div>
              <p className="text-xs font-mono leading-relaxed" style={{ color: "#94a3b8" }}>
                {clause.rawText}
              </p>

              {clause.citation ? (
                <div
                  className="flex items-center justify-between pt-2.5 gap-2 text-xs flex-wrap"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "#38bdf8" }}>
                    <Scale className="w-3 h-3 shrink-0" />
                    {clause.citation.section_ref} · {clause.citation.law}
                  </span>
                  <a
                    href={clause.citation.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] transition-colors"
                    style={{ color: "#475569" }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "#38bdf8")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "#475569")}
                  >
                    India Code <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <p className="text-[11px] italic pt-2" style={{ color: "#334155", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  No verified statutory reference.
                </p>
              )}
            </div>

            {/* Right: AI rewrite & action */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "rgba(79,70,229,0.07)",
                border: "1px solid rgba(99,102,241,0.18)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 label-section">
                  <Sparkles className="w-3 h-3" style={{ color: "#818cf8" }} />
                  Plain English · Gemini AI
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "#a5b4fc",
                  }}
                >
                  Risk {clause.riskScore}/100
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: "#e2e8f0" }}>
                {clause.plainRewrite || "Analyzing plain language meaning..."}
              </p>

              {clause.riskLevel !== "STANDARD_RISK" && (
                <div
                  className="p-2.5 rounded-lg text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    color: "#fca5a5",
                  }}
                >
                  <strong style={{ color: "#f87171" }}>Why flagged: </strong>
                  {clause.aiExplanation || clause.riskReason}
                </div>
              )}

              {clause.suggestedAction && (
                <div
                  className="pt-2.5 space-y-2"
                  style={{ borderTop: "1px solid rgba(99,102,241,0.15)" }}
                >
                  <div className="flex items-start gap-2 text-xs" style={{ color: "#c7d2fe" }}>
                    <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#818cf8" }} />
                    <div>
                      <strong style={{ color: "#a5b4fc" }}>Suggested point: </strong>
                      {clause.suggestedAction}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: copiedWhatsApp ? "rgba(6,78,59,0.4)" : "rgba(6,78,59,0.25)",
                      border: "1px solid rgba(52,211,153,0.25)",
                      color: "#6ee7b7",
                    }}
                  >
                    {copiedWhatsApp ? (
                      <><Check className="w-3.5 h-3.5" /> Copied!</>
                    ) : (
                      <><MessageSquare className="w-3.5 h-3.5" /> Copy WhatsApp Note</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Supreme Court Precedent */}
          {clause.precedent && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "linear-gradient(135deg, rgba(120,53,15,0.12) 0%, rgba(17,24,39,0.6) 50%, rgba(30,27,75,0.12) 100%)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="p-1.5 rounded-lg"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
                  >
                    <Scale className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>
                      Supreme Court Precedent
                    </span>
                    <div className="text-xs font-semibold italic" style={{ color: "#fef3c7" }}>
                      {clause.precedent.case_title}{" "}
                      <span className="font-mono text-[11px]" style={{ color: "#92400e" }}>
                        [{clause.precedent.citation}]
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={clause.precedent.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] transition-colors"
                  style={{ color: "#b45309" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#fbbf24")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#b45309")}
                >
                  Indian Kanoon <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs"
                style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}
              >
                <div>
                  <span className="label-section block mb-1" style={{ color: "#b45309" }}>
                    Legal Holding
                  </span>
                  <p style={{ color: "#e2e8f0" }} className="leading-relaxed">
                    {clause.precedent.key_principle}
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "rgba(6,78,59,0.12)",
                    border: "1px solid rgba(52,211,153,0.1)",
                  }}
                >
                  <span className="label-section block mb-1" style={{ color: "#059669" }}>
                    Tenant Protection
                  </span>
                  <p style={{ color: "#6ee7b7" }} className="leading-relaxed font-medium">
                    {clause.precedent.tenant_benefit}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
