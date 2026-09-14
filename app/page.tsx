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
  Upload,
  Bot,
} from "lucide-react";
import { DocumentAnalysisResult, AnalyzedClause } from "@/lib/clauseEngine";
import ClauseCard from "@/components/ClauseCard";
import CompareView from "@/components/CompareView";
import ChatbotAssistant from "@/components/ChatbotAssistant";
import DocumentUploadZone from "@/components/DocumentUploadZone";
import LawyerQuestionsModal from "@/components/LawyerQuestionsModal";
import LatencyBadge from "@/components/LatencyBadge";
import RadialGauge from "@/components/RadialGauge";
import Sidebar, { NavView } from "@/components/Sidebar";

export default function HomePage() {
  const [agreementText, setAgreementText] = useState("");
  const [documentTitle, setDocumentTitle] = useState("Bangalore Predatory Lease (11 Months)");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [timings, setTimings] = useState<{
    deterministicMs: number;
    aiMs: number;
    totalMs: number;
  }>({ deterministicMs: 0, aiMs: 0, totalMs: 0 });

  const [activeView, setActiveView] = useState<NavView>("chatbot");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectedBench, setSelectedBench] = useState<string>("aggressive");

  // Load sample agreement
  const loadSample = async (fileName: string, benchKey: string, title: string) => {
    try {
      setLoading(true);
      setSelectedBench(benchKey);
      setDocumentTitle(title);
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

  // When a user uploads a document via DocumentUploadZone (text or OCR'd scan)
  const handleUploadedDocument = async (text: string, sourceName: string) => {
    setDocumentTitle(sourceName);
    setAgreementText(text);
    setSelectedBench("custom");
    await runAnalysis(text);
    setActiveView("chatbot"); // Automatically take them to the chatbot guide
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
    loadSample("sample-lease-aggressive.txt", "aggressive", "Bangalore Predatory Lease (11 Months)");
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
            {/* Search */}
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

            {/* Badges & Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Active Notice: Model Tenancy Act, 2021
              </span>

              <LatencyBadge
                deterministicMs={timings.deterministicMs}
                aiMs={timings.aiMs}
                totalMs={timings.totalMs}
              />

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

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header & Quick Tab Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Tenant Dashboard: <span className="text-cyan-400">Legal Protection & OCR Portal</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Assistive Lease Ingestion & Citation-Locked Chatbot Guide • Powered by Gemini 2.5 Flash
              </p>
            </div>

            {/* View Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView("chatbot")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "chatbot"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Chatbot Guide
              </button>

              <button
                onClick={() => setActiveView("inspector")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "inspector"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Clause Inspector
              </button>

              <button
                onClick={() => setActiveView("upload")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "upload"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload & OCR
              </button>

              <button
                onClick={() => setActiveView("compare")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "compare"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Compare
              </button>
            </div>
          </div>

          {/* Top Hero Section: Speedometer Radial Gauge + Quick Load Benches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Speedometer Radial Gauge */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Property Safety Index
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {analysis?.totalClauses || 0} Clauses Evaluated
                </span>
              </div>

              <RadialGauge
                score={analysis?.safetyScore ?? 50}
                title={documentTitle}
                subtitle="Model Tenancy Act 2021 & TPA 1882"
              />

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

            {/* Quick Load Test Benches & Ingestion Card */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Evaluation Benchmarks & Document Input
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click a synthetic lease or use the Upload tab to scan agreements
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  OCR Engine: Active
                </span>
              </div>

              {/* 3 Bench Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setCompareData(null);
                    loadSample("sample-lease-aggressive.txt", "aggressive", "Bangalore Predatory Lease (11 Months)");
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
                      Predatory Draft
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">24/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    10mo deposit, 0-day notice, unconditional entry.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setCompareData(null);
                    loadSample("sample-lease-fair.txt", "fair", "MTA Compliant Tenancy Draft");
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
                      Model Tenancy
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">92/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    2mo deposit, 30d notice, 24h entry notice.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setCompareData(null);
                    loadSample("sample-lease-adversarial.txt", "adversarial", "Prompt Injection Test B");
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
                      Test B Injection
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Immune</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Injected &lt;!-- system override --&gt; tags; code defies prompt.
                  </p>
                </button>
              </div>

              {/* Upload or Manual Paste Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Want to test your own agreement?</span>
                <button
                  onClick={() => setActiveView("upload")}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Open Document Upload & OCR Zone &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: CHATBOT ASSISTANT (FRONT AND CENTER) */}
          {activeView === "chatbot" && (
            <section aria-labelledby="chatbot-view-heading" className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h2 id="chatbot-view-heading" className="text-base font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    Assistive Legal Chatbot & Negotiation Guide
                  </h2>
                  <p className="text-xs text-slate-400">
                    Proactive statutory breakdown, plain-English explanations, and tenant discussion points.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-full">
                  Locked to Curated Bare Acts
                </span>
              </div>

              <ChatbotAssistant
                analysis={analysis}
                documentTitle={documentTitle}
              />
            </section>
          )}

          {/* VIEW 2: UPLOAD & OCR ZONE */}
          {activeView === "upload" && (
            <section aria-labelledby="upload-view-heading" className="space-y-6">
              <div>
                <h2 id="upload-view-heading" className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  Upload Agreement (Text or Scanned Photo)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload text files or photos/scans of rental contracts. Gemini 2.5 Flash Vision transcribes the text, segments clauses, and triggers our deterministic evaluation.
                </p>
              </div>

              <DocumentUploadZone
                onDocumentLoaded={handleUploadedDocument}
                isLoading={loading}
              />

              {/* Paste fallback */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Or Paste Agreement Text Directly
                </h3>
                <textarea
                  value={agreementText}
                  onChange={(e) => setAgreementText(e.target.value)}
                  rows={6}
                  placeholder="Paste your residential rental / leave-and-license agreement clauses here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setCompareData(null);
                      runAnalysis();
                      setActiveView("chatbot");
                    }}
                    disabled={loading || !agreementText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loading ? "Analyzing Document..." : "Analyze & Consult Chatbot"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* VIEW 3: CLAUSE INSPECTOR */}
          {activeView === "inspector" && (
            <section aria-labelledby="inspection-heading" className="space-y-4">
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

              <div className="space-y-4">
                {filteredClauses.map((clause) => (
                  <ClauseCard key={clause.id} clause={clause} />
                ))}
              </div>
            </section>
          )}

          {/* VIEW 4: BASELINE COMPARE */}
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
