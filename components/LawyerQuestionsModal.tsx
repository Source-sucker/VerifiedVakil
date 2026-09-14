"use client";

import React from "react";
import { X, Printer, Scale, FileCheck2, HelpCircle } from "lucide-react";
import { AnalyzedClause } from "@/lib/clauseEngine";

interface LawyerQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clauses: AnalyzedClause[];
  safetyScore: number;
}

export default function LawyerQuestionsModal({
  isOpen,
  onClose,
  clauses,
  safetyScore,
}: LawyerQuestionsModalProps) {
  if (!isOpen) return null;

  const flaggedClauses = clauses.filter(
    (c) => c.riskLevel === "HIGH_RISK" || c.riskLevel === "MODERATE_RISK"
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between no-print bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h2 id="modal-title" className="text-base font-bold text-white">
              Tenant Assistive Negotiation & Discussion Checklist
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Document Header in Print */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-white">
                  VerifiedVakil — Tenant Assistive Preparation Brief
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comprehension & Negotiation Aid • Generated on {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Overall Contract Safety</span>
                <span className="text-lg font-bold text-indigo-400">{safetyScore}/100</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded bg-slate-800/60 text-xs text-slate-300">
              <strong>Assistive Solution Notice:</strong> This summary is an automated reading and negotiation aid designed to assist tenants in understanding agreement terms. It does <strong>not</strong> constitute a legal consultation or lawyer replacement. Use these discussion points to negotiate fair terms with your landlord or take them to a qualified advocate for professional counsel.
            </div>
          </div>

          {/* Flagged Clauses List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Flagged Clauses Requiring Legal Review ({flaggedClauses.length})
            </h3>

            {flaggedClauses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No high or moderate risk clauses were detected in this agreement.
              </p>
            ) : (
              flaggedClauses.map((clause, idx) => (
                <div
                  key={clause.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {idx + 1}. {clause.title} ({clause.clauseLabel})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                        clause.riskLevel === "HIGH_RISK"
                          ? "text-rose-400 bg-rose-950/60 border border-rose-800/40"
                          : "text-amber-400 bg-amber-950/60 border border-amber-800/40"
                      }`}
                    >
                      {clause.riskLevel === "HIGH_RISK" ? "High Risk" : "Moderate Risk"} ({clause.riskScore}/100)
                    </span>
                  </div>

                  <div className="text-slate-300">
                    <strong className="text-slate-400">Clause Concern:</strong> {clause.riskReason}
                  </div>

                  {clause.citation && (
                    <div className="text-sky-300 font-mono text-[11px]">
                      <strong>Statutory Benchmark:</strong> {clause.citation.law} — {clause.citation.section_ref}
                    </div>
                  )}

                  <div className="mt-2 p-2 rounded bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300">Negotiation & Discussion Question:</strong>{" "}
                      {clause.suggestedAction ||
                        `Can we rephrase this ${clause.clauseLabel} clause to ensure fair bilateral rights?`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end no-print bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
}
