"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  Printer,
  Zap,
  SlidersHorizontal,
  Layers,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { DocumentAnalysisResult, AnalyzedClause } from "@/lib/clauseEngine";
import ClauseCard from "@/components/ClauseCard";
import CompareView from "@/components/CompareView";
import ChatDrawer from "@/components/ChatDrawer";
import LawyerQuestionsModal from "@/components/LawyerQuestionsModal";
import LatencyBadge from "@/components/LatencyBadge";

type ActiveTab = "inspector" | "compare" | "chat";

export default function HomePage() {
  const [agreementText, setAgreementText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [timings, setTimings] = useState<{
    deterministicMs: number;
    aiMs: number;
    totalMs: number;
  }>({ deterministicMs: 0, aiMs: 0, totalMs: 0 });

  const [activeTab, setActiveTab] = useState<ActiveTab>("inspector");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Load sample agreement on button click
  const loadSample = async (fileName: string) => {
    try {
      setLoading(true);
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

  // Run end-to-end analysis
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

  // Fetch comparison data when user switches to compare tab
  useEffect(() => {
    if (activeTab === "compare" && agreementText && !compareData) {
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
  }, [activeTab, agreementText, compareData]);

  // Initial load: Load aggressive lease sample automatically so judges immediately see data
  useEffect(() => {
    loadSample("sample-lease-aggressive.txt");
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
    <div className="min-h-screen pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Scale className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">VerifiedVakil</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  Citation-Locked
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI for Legal Assistance & Access • PromptWars Exclusive
              </p>
            </div>
          </div>

          {/* Latency & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <LatencyBadge
              deterministicMs={timings.deterministicMs}
              aiMs={timings.aiMs}
              totalMs={timings.totalMs}
            />

            {analysis && (
              <button
                onClick={() => setIsLawyerModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
                aria-label="Export questions for lawyer"
              >
                <Printer className="w-3.5 h-3.5" />
                Export Lawyer Questions
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Synthetic Sample Agreement Bar */}
        <section aria-labelledby="sample-drafts-heading" className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
            <div>
              <h2 id="sample-drafts-heading" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Testing Benchmarks (One-Click Synthetic Leases)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-calibrated test contracts to inspect deterministic scoring, verified citations, and adversarial resilience.
              </p>
            </div>
            <span className="text-[11px] text-indigo-400 font-mono">
              Model: gemini-2.5-flash
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => {
                setCompareData(null);
                loadSample("sample-lease-aggressive.txt");
              }}
              disabled={loading}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Predatory Rental Draft
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  10mo deposit • 0-day notice • Unconditional entry
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition-colors" />
            </button>

            <button
              onClick={() => {
                setCompareData(null);
                loadSample("sample-lease-fair.txt");
              }}
              disabled={loading}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Model Tenancy Compliant
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  2mo deposit • 30d notice • 24h entry notice
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            <button
              onClick={() => {
                setCompareData(null);
                loadSample("sample-lease-adversarial.txt");
              }}
              disabled={loading}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 hover:bg-amber-950/20 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Test B: Prompt Injection
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Contains hidden &lt;!-- system override --&gt; tags
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>
          </div>
        </section>

        {/* Input Accordion / Area */}
        <details className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80 group">
          <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-2 text-white">
              <FileText className="w-4 h-4 text-indigo-400" />
              Document Source Text ({agreementText.length} characters)
            </span>
            <span className="text-indigo-400 text-xs font-normal">
              Click to edit / paste custom lease text
            </span>
          </summary>

          <div className="mt-4 space-y-3">
            <textarea
              value={agreementText}
              onChange={(e) => setAgreementText(e.target.value)}
              rows={6}
              placeholder="Paste residential rental agreement text here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-y"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setCompareData(null);
                  runAnalysis();
                }}
                disabled={loading || !agreementText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? "Analyzing Clauses..." : "Re-Analyze Agreement"}
              </button>
            </div>
          </div>
        </details>

        {/* Risk Radar Summary Bar */}
        {analysis && (
          <section aria-labelledby="radar-heading" className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Safety Score Dial */}
              <div className="lg:col-span-4 flex items-center gap-5 pr-6 lg:border-r border-slate-800">
                <div
                  className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 font-bold shadow-xl shrink-0 ${
                    analysis.safetyScore >= 75
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : analysis.safetyScore >= 45
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-rose-500/10 border-rose-500/40 text-rose-400"
                  }`}
                >
                  <span className="text-2xl font-black">{analysis.safetyScore}</span>
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                    / 100 Safety
                  </span>
                </div>
                <div>
                  <h2 id="radar-heading" className="text-base font-bold text-white">
                    Tenant Safety Index
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {analysis.safetyScore >= 75
                      ? "Statutorily compliant. Terms reflect fair Model Tenancy standards."
                      : analysis.safetyScore >= 45
                      ? "Moderate tenant risk. Several clauses require negotiation before signing."
                      : "High predatory risk. Contains severe deviations from statutory protections."}
                  </p>
                </div>
              </div>

              {/* Clause Counters */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-400 font-medium">Total Clauses</div>
                  <div className="text-xl font-bold text-white mt-1">{analysis.totalClauses}</div>
                </div>

                <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl">
                  <div className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    High Risks
                  </div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {analysis.riskCounts.high}
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                  <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Moderate Risks
                  </div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {analysis.riskCounts.moderate}
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                  <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Standard Terms
                  </div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {analysis.riskCounts.standard}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <nav className="flex items-center gap-2" aria-label="Analysis views">
            <button
              onClick={() => setActiveTab("inspector")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "inspector"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              Vertical A: Risk Radar & Inspector
            </button>

            <button
              onClick={() => setActiveTab("compare")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "compare"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Scale className="w-4 h-4" />
              Vertical B: Baseline Compare
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Vertical B: Citation-Locked Q&A
            </button>
          </nav>

          {/* Filter Pills for Clause Inspector */}
          {activeTab === "inspector" && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">Filter:</span>
              <button
                onClick={() => setFilterRisk("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  filterRisk === "all"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({analysis?.clauses.length || 0})
              </button>
              <button
                onClick={() => setFilterRisk("high")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  filterRisk === "high"
                    ? "bg-rose-950 text-rose-300 border border-rose-800/40"
                    : "text-slate-400 hover:text-rose-300"
                }`}
              >
                High ({analysis?.riskCounts.high || 0})
              </button>
              <button
                onClick={() => setFilterRisk("moderate")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  filterRisk === "moderate"
                    ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                    : "text-slate-400 hover:text-amber-300"
                }`}
              >
                Moderate ({analysis?.riskCounts.moderate || 0})
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Clause Inspector */}
        {activeTab === "inspector" && (
          <div className="space-y-4">
            {filteredClauses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
                No clauses match the selected risk filter.
              </div>
            ) : (
              filteredClauses.map((clause) => (
                <ClauseCard key={clause.id} clause={clause} />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Baseline Compare */}
        {activeTab === "compare" && (
          <div>
            {compareLoading ? (
              <div className="p-12 text-center text-indigo-400 glass-panel rounded-2xl flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                Computing side-by-side disparities against Model Tenancy Act...
              </div>
            ) : compareData ? (
              <CompareView
                userSafetyScore={compareData.userSafetyScore}
                baselineSafetyScore={compareData.baselineSafetyScore}
                comparisons={compareData.comparisons}
                userRiskCounts={compareData.userRiskCounts}
                baselineRiskCounts={compareData.baselineRiskCounts}
              />
            ) : (
              <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
                Upload or analyze a document first to run comparison.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Grounded Q&A Chat */}
        {activeTab === "chat" && (
          <ChatDrawer clauses={analysis ? analysis.clauses : []} />
        )}
      </main>

      {/* Lawyer Export Modal */}
      {analysis && (
        <LawyerQuestionsModal
          isOpen={isLawyerModalOpen}
          onClose={() => setIsLawyerModalOpen(false)}
          clauses={analysis.clauses}
          safetyScore={analysis.safetyScore}
        />
      )}
    </div>
  );
}
