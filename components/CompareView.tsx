"use client";

import React from "react";
import { Check, X, Scale, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

interface ComparisonItem {
  feature: string;
  userValue: string;
  baselineValue: string;
  isFavorableToTenant: boolean;
  userRisk: string;
  statutoryStandard: string;
}

interface CompareViewProps {
  userSafetyScore: number;
  baselineSafetyScore: number;
  comparisons: ComparisonItem[];
  userRiskCounts: { high: number; moderate: number; standard: number };
  baselineRiskCounts: { high: number; moderate: number; standard: number };
}

export default function CompareView({
  userSafetyScore,
  baselineSafetyScore,
  comparisons,
  userRiskCounts,
  baselineRiskCounts,
}: CompareViewProps) {
  return (
    <section aria-labelledby="compare-heading" className="space-y-6">
      <div>
        <h2 id="compare-heading" className="text-xl font-bold text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          Compare with Fair Government Rules
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Side-by-side comparison: Your agreement versus the Model Tenancy Act (MTA) government baseline.
        </p>
      </div>

      {/* Safety Score Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Draft Card */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Uploaded Agreement
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                userSafetyScore >= 75
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : userSafetyScore >= 50
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              Safety Score: {userSafetyScore}/100
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {userRiskCounts.high} High Risks
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {userRiskCounts.moderate} Moderate
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {userRiskCounts.standard} Standard
            </span>
          </div>
        </div>

        {/* MTA Baseline Card */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Model Tenancy Act Baseline
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Safety Score: {baselineSafetyScore}/100
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              0 High Risks (Fully Statutorily Compliant)
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">
            Key Term Disparities & Statutory Benchmarks
          </h3>
        </div>

        <div className="divide-y divide-slate-800">
          {comparisons.map((item, idx) => (
            <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-900/40 transition-colors">
              {/* Feature Title */}
              <div className="md:col-span-3">
                <div className="font-semibold text-sm text-slate-100">{item.feature}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.statutoryStandard}</div>
              </div>

              {/* User Value */}
              <div className="md:col-span-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">Your Draft:</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium text-slate-200">{item.userValue}</span>
                  {item.isFavorableToTenant ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Fair
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <AlertCircle className="w-3 h-3" /> Unfair
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex md:col-span-1 justify-center text-slate-600">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Baseline Benchmark */}
              <div className="md:col-span-4 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                <div className="text-[11px] text-emerald-400 uppercase tracking-wide">MTA Fair Standard:</div>
                <div className="text-sm font-medium text-emerald-200 mt-1">{item.baselineValue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
