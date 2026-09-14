"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  Printer,
  Zap,
  SlidersHorizontal,
  Layers,
  MessageSquare,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { DocumentAnalysisResult, AnalyzedClause } from "@/lib/clauseEngine";
import ClauseCard from "@/components/ClauseCard";
import CompareView from "@/components/CompareView";
import ChatDrawer from "@/components/ChatDrawer";
import LawyerQuestionsModal from "@/components/LawyerQuestionsModal";
import LatencyBadge from "@/components/LatencyBadge";
import RadialGauge from "@/components/RadialGauge";
import Sidebar, { NavView } from "@/components/Sidebar";

export default function HomePage() {
  const [agreementText, setAgreementText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [timings, setTimings] = useState<{
    deterministicMs: number;
    aiMs: number;
    totalMs: number;
  }>({ deterministicMs: 0, aiMs: 0, totalMs: 0 });

  const [activeView, setActiveView] = useState<NavView>("inspector");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectedBench, setSelectedBench] = useState<string>("aggressive");

  // Load sample agreement
  const loadSample = async (fileName: string, benchKey: string) => {
    try {
      setLoading(true);
      setSelectedBench(benchKey);
      const res = await fetch(`/sample-docs/${fileName}`);
      const text = await res.text();
      setAgreementText(text);
      await runAnalysis(text);
    } catch (err) {
      console.error("Failed to load sample:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run analysis pipeline
  const runAnalysis = async (textToAnalyze?: string) => {
    const text = textToAnalyze || agreementText;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, runAI: true }),
      });

      const json = await res.json();
      if (json.success) {
        setAnalysis(json.data);
        setTimings(json.timings);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comparison data when user switches to compare
  useEffect(() => {
    if (activeView === "compare" && agreementText && !compareData) {
      setCompareLoading(true);
      fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: agreementText }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setCompareData(data);
        })
        .catch((err) => console.error("Compare fetch failed:", err))
        .finally(() => setCompareLoading(false));
    }
  }, [activeView, agreementText, compareData]);

  // Initial load
  useEffect(() => {
    loadSample("sample-lease-aggressive.txt", "aggressive");
  }, []);

  const filteredClauses = analysis
    ? analysis.clauses.filter((c) => {
        if (filterRisk === "high") return c.riskLevel === "HIGH_RISK";
        if (filterRisk === "moderate") return c.riskLevel === "MODERATE_RISK";
        if (filterRisk === "standard") return c.riskLevel === "STANDARD_RISK";
        return true;
      })
    : [];

  return (
    <div className="flex min-h-screen bg-[#070b13] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        safetyScore={analysis?.safetyScore}
        totalClauses={analysis?.totalClauses}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Mobile Title & Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contract clauses or statutory sections..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Right Badges: Active Notice & API Latency */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Active Statutory Notice Pill (as seen in Nano Banana design) */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Active Notice: Model Tenancy Act, 2021
              </span>

              {/* Measured Real Latency */}
              <LatencyBadge
                deterministicMs={timings.deterministicMs}
                aiMs={timings.aiMs}
                totalMs={timings.totalMs}
              />

              {/* Checklist Export */}
              {analysis && (
                <button
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span> Checklist
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Tenant Dashboard: <span className="text-indigo-400">Legal Protection Portal</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Assistive Self-Help & Statutory Risk Evaluation • Powered by Google Gemini 2.5 Flash
              </p>
            </div>

            {/* Mobile Tab Pills */}
            <div className="flex md:hidden items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView("inspector")}
                className={`px-3 py-1 rounded-lg ${
                  activeView === "inspector" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Review
              </button>
              <button
                onClick={() => setActiveView("compare")}
                className={`px-3 py-1 rounded-lg ${
                  activeView === "compare" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Compare
              </button>
              <button
                onClick={() => setActiveView("chat")}
                className={`px-3 py-1 rounded-lg ${
                  activeView === "chat" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Q&A
              </button>
            </div>
          </div>

          {/* Top Hero Grid: Radial Speedometer Gauge + Quick-Load Test Benches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Hero Card: Radial Gauge */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Property Safety Index
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {analysis?.totalClauses || 0} Clauses Scored
                </span>
              </div>

              {/* Speedometer Radial Gauge */}
              <RadialGauge
                score={analysis?.safetyScore ?? 50}
                title="Bangalore Residential Lease (11 Months)"
                subtitle="Evaluated against MTA 2021 & TPA 1882"
              />

              {/* Risk Counts Pill Bar */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
                <div className="bg-rose-950/30 border border-rose-500/20 p-2 rounded-xl">
                  <div className="text-[10px] text-rose-300 font-medium">High Risks</div>
                  <div className="text-base font-bold text-rose-400">
                    {analysis?.riskCounts.high || 0}
                  </div>
                </div>
                <div className="bg-amber-950/30 border border-amber-500/20 p-2 rounded-xl">
                  <div className="text-[10px] text-amber-300 font-medium">Moderate</div>
                  <div className="text-base font-bold text-amber-400">
                    {analysis?.riskCounts.moderate || 0}
                  </div>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-xl">
                  <div className="text-[10px] text-emerald-300 font-medium">Standard</div>
                  <div className="text-base font-bold text-emerald-400">
                    {analysis?.riskCounts.standard || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Card: Quick-Load Test Benches */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Quick-Load Lease Test Benches
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live camera testing • Click to load synthetic benchmark lease instantly
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Status: Ready
                </span>
              </div>

              {/* 3 Bench Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Bench 1: Predatory */}
                <button
                  onClick={() => {
                    setCompareData(null);
                    loadSample("sample-lease-aggressive.txt", "aggressive");
                  }}
                  disabled={loading}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedBench === "aggressive"
                      ? "bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      Predatory
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">24/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    10-month deposit, 0-day notice, unconditional entry rights.
                  </p>
                </button>

                {/* Bench 2: Fair Model */}
                <button
                  onClick={() => {
                    setCompareData(null);
                    loadSample("sample-lease-fair.txt", "fair");
                  }}
                  disabled={loading}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedBench === "fair"
                      ? "bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Fair MTA
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">92/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    2-month deposit, 30-day notice, 24h entry notice.
                  </p>
                </button>

                {/* Bench 3: Adversarial */}
                <button
                  onClick={() => {
                    setCompareData(null);
                    loadSample("sample-lease-adversarial.txt", "adversarial");
                  }}
                  disabled={loading}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedBench === "adversarial"
                      ? "bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Test B
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Immune</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Injected &lt;!-- system override --&gt; tags; code defies prompt.
                  </p>
                </button>
              </div>

              {/* Paste or Custom Input Dropdown */}
              <details className="text-xs text-slate-400 group">
                <summary className="cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  <span>Custom Agreement Input (Paste or Edit Text)</span>
                  <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-3 space-y-2">
                  <textarea
                    value={agreementText}
                    onChange={(e) => setAgreementText(e.target.value)}
                    rows={4}
                    placeholder="Paste agreement text here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setCompareData(null);
                        runAnalysis();
                      }}
                      disabled={loading || !agreementText.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      {loading ? "Analyzing..." : "Re-Analyze"}
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* View Container */}
          {activeView === "inspector" && (
            <section aria-labelledby="inspection-heading" className="space-y-4">
              {/* Inspection Subheader & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h2 id="inspection-heading" className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Side-by-Side Clause Inspection
                  </h2>
                  <p className="text-xs text-slate-400">
                    Original Contract Terms (Left) vs. Plain-English Rewrite & Citations (Right)
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] mr-1">Filter:</span>
                  <button
                    onClick={() => setFilterRisk("all")}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                      filterRisk === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({analysis?.clauses.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterRisk("high")}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                      filterRisk === "high"
                        ? "bg-rose-950 text-rose-300 border border-rose-800/50"
                        : "text-slate-400 hover:text-rose-300"
                    }`}
                  >
                    High ({analysis?.riskCounts.high || 0})
                  </button>
                  <button
                    onClick={() => setFilterRisk("moderate")}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                      filterRisk === "moderate"
                        ? "bg-amber-950 text-amber-300 border border-amber-800/50"
                        : "text-slate-400 hover:text-amber-300"
                    }`}
                  >
                    Medium ({analysis?.riskCounts.moderate || 0})
                  </button>
                  <button
                    onClick={() => setFilterRisk("standard")}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                      filterRisk === "standard"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                        : "text-slate-400 hover:text-emerald-300"
                    }`}
                  >
                    Low ({analysis?.riskCounts.standard || 0})
                  </button>
                </div>
              </div>

              {/* Clause Cards Stream */}
              <div className="space-y-4">
                {filteredClauses.map((clause) => (
                  <ClauseCard key={clause.id} clause={clause} />
                ))}
              </div>
            </section>
          )}

          {activeView === "compare" && (
            <div>
              {compareLoading ? (
                <div className="p-12 text-center text-indigo-400 glass-panel rounded-2xl flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Diffing draft against Model Tenancy Act baseline...
                </div>
              ) : compareData ? (
                <CompareView
                  userSafetyScore={compareData.userSafetyScore}
                  baselineSafetyScore={compareData.baselineSafetyScore}
                  comparisons={compareData.comparisons}
                  userRiskCounts={compareData.userRiskCounts}
                  baselineRiskCounts={compareData.baselineRiskCounts}
                />
              ) : null}
            </div>
          )}

          {activeView === "chat" && (
            <ChatDrawer clauses={analysis ? analysis.clauses : []} />
          )}

          {/* Bottom Docked Grounded Q&A Drawer (as seen in Nano Banana mockup) */}
          {activeView !== "chat" && (
            <div className="pt-4">
              <ChatDrawer clauses={analysis ? analysis.clauses : []} />
            </div>
          )}
        </main>
      </div>

      {/* Tenant Assistive Checklist Modal */}
      {analysis && (
        <LawyerQuestionsModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          clauses={analysis.clauses}
          safetyScore={analysis.safetyScore}
        />
      )}
    </div>
  );
}
