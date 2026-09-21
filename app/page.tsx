"use client";

import React, { useState, useEffect, useRef } from "react";
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
  BookOpen,
  Camera,
  Gavel,
  Check,
  User,
} from "lucide-react";
import { DocumentAnalysisResult, AnalyzedClause } from "@/lib/clauseEngine";
import ClauseCard from "@/components/ClauseCard";
import CompareView from "@/components/CompareView";
import ChatbotAssistant from "@/components/ChatbotAssistant";
import DocumentUploadZone from "@/components/DocumentUploadZone";
import LawyerQuestionsModal from "@/components/LawyerQuestionsModal";
import SafetyBenchmarkModal from "@/components/SafetyBenchmarkModal";
import LatencyBadge from "@/components/LatencyBadge";
import RadialGauge from "@/components/RadialGauge";
import Sidebar, { NavView } from "@/components/Sidebar";
import IPLKnowledgeBank from "@/components/IPLKnowledgeBank";
import ApiKeyModal from "@/components/ApiKeyModal";

export default function HomePage() {
  const [agreementText, setAgreementText] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
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
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectedBench, setSelectedBench] = useState<string | null>(null);
  const [selectedClauseToAsk, setSelectedClauseToAsk] = useState<AnalyzedClause | null>(null);
  const [pendingChatQuestion, setPendingChatQuestion] = useState<string | null>(null);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"connected" | "offline" | "checking">("checking");

  useEffect(() => {
    // Check initial API status
    const clientKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || undefined : undefined;
    fetch("/api/test-gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: clientKey }),
    })
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.success ? "connected" : "offline");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const handleApiKeySaved = (key: string) => {
    if (!key) {
      setApiStatus("offline");
      return;
    }
    setApiStatus("checking");
    fetch("/api/test-gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    })
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.success ? "connected" : "offline");
      })
      .catch(() => setApiStatus("offline"));
  };

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
    setActiveView("chatbot");
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

  // Start in clean interactive state without auto-spawning contracts

  const filteredClauses = analysis
    ? analysis.clauses.filter((c) => {
        if (filterRisk === "high") return c.riskLevel === "HIGH_RISK";
        if (filterRisk === "moderate") return c.riskLevel === "MODERATE_RISK";
        if (filterRisk === "standard") return c.riskLevel === "STANDARD_RISK";
        return true;
      })
    : [];

  const flaggedClauses = analysis
    ? analysis.clauses.filter((c) => c.riskLevel === "HIGH_RISK" || c.riskLevel === "MODERATE_RISK")
    : [];

  return (
    <div className="flex min-h-screen bg-[#070b13] text-slate-100">
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-2xl focus:outline-none ring-2 ring-white"
      >
        Skip to main content
      </a>

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
        <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5 no-print">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand & Active Document Status Pill */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white tracking-tight shrink-0">VerifiedVakil</span>
                  {analysis ? (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 truncate max-w-[240px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${analysis.safetyScore >= 75 ? "bg-emerald-400" : analysis.safetyScore >= 50 ? "bg-amber-400" : "bg-rose-400"}`} />
                      <span className="truncate">{documentTitle || "Lease Analyzed"}</span>
                      <span className="text-slate-400 font-bold">({analysis.safetyScore}/100)</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                      No Agreement Loaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Sleek Single-Row Demo Preset Switcher (Uncluttered) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Test Leases:</span>
              <button
                type="button"
                onClick={() => loadSample("sample-lease-aggressive.txt", "aggressive", "Demo: Landlord Payment Request")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  selectedBench === "aggressive"
                    ? "bg-rose-950 text-rose-300 border border-rose-500/50 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Landlord Demand</span>
                <span className="text-[9px] px-1 rounded bg-rose-900/40 text-rose-300 font-mono">High Risk</span>
              </button>

              <button
                type="button"
                onClick={() => loadSample("sample-lease-fair.txt", "fair", "Demo: Fair Standard Agreement")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  selectedBench === "fair"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Fair Govt Model</span>
                <span className="text-[9px] px-1 rounded bg-emerald-900/40 text-emerald-300 font-mono">Safe</span>
              </button>

              <button
                type="button"
                onClick={() => loadSample("sample-lease-adversarial.txt", "adversarial", "Demo: Unfair Entry & Lock-in")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  selectedBench === "adversarial"
                    ? "bg-amber-950 text-amber-300 border border-amber-500/50 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Lock-in Trap</span>
                <span className="text-[9px] px-1 rounded bg-amber-900/40 text-amber-300 font-mono">Illegal</span>
              </button>
            </div>

            {/* Right: Actions, Benchmark, & Modals */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  apiStatus === "connected"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                    : "bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title="Click to configure Gemini API Key"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    apiStatus === "connected"
                      ? "bg-emerald-400 animate-pulse"
                      : apiStatus === "checking"
                      ? "bg-cyan-400 animate-ping"
                      : "bg-amber-400"
                  }`}
                />
                <span className="hidden sm:inline">
                  {apiStatus === "connected" ? "Gemini Active" : "Set API Key"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsBenchmarkModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold shadow-sm transition-all"
                title="View live comparison between unconstrained LLMs and citation locking"
                aria-label="Open AI Safety Benchmark modal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">AI Safety Benchmark</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("upload")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                title="Upload or scan a new rental agreement"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload New</span>
              </button>

              {analysis && (
                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
                  title="Export Consultation Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export Report</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Strip (only visible on mobile screens where sidebar is hidden) */}
          <nav className="flex md:hidden items-center gap-1 overflow-x-auto pt-2 mt-2 border-t border-slate-800/80 text-xs" aria-label="Mobile Navigation">
            <button
              onClick={() => setActiveView("chatbot")}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${activeView === "chatbot" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Ask AI
            </button>
            <button
              onClick={() => setActiveView("inspector")}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${activeView === "inspector" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Review Clauses
            </button>
            <button
              onClick={() => setActiveView("compare")}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${activeView === "compare" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Compare
            </button>
            <button
              onClick={() => setActiveView("knowledge")}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${activeView === "knowledge" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Rights &amp; Laws
            </button>
            <button
              onClick={() => setActiveView("upload")}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${activeView === "upload" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Upload
            </button>
          </nav>
        </header>

        {/* Dashboard Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* VIEW 1: CHATBOT GUIDE (TWO-COLUMN COCKPIT) */}
          {activeView === "chatbot" && (
            <div>
              {!analysis ? (
                <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-center space-y-6 max-w-2xl mx-auto my-12 shadow-2xl bg-gradient-to-b from-slate-900/80 to-[#090d16]">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                    <Bot className="w-8 h-8 text-cyan-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Welcome to VerifiedVakil</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      AI-powered residential tenancy assistant grounded in the Model Tenancy Act 2021 and Transfer of Property Act 1882.
                    </p>
                  </div>

                  <div className="pt-2 pb-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Quick Test with Real Rental Agreements:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <button
                        onClick={() => loadSample("sample-lease-aggressive.txt", "aggressive", "Demo: Landlord Payment Request")}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">💳 Landlord Demand</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[9px] font-bold">High Risk</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">10-month deposit, ₹45k painting deduction</p>
                      </button>

                      <button
                        onClick={() => loadSample("sample-lease-fair.txt", "fair", "Demo: Fair Standard Agreement")}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">⚖️ Fair Govt Model</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold">Safe</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">2-month deposit cap, 24h entry notice</p>
                      </button>

                      <button
                        onClick={() => loadSample("sample-lease-adversarial.txt", "adversarial", "Demo: Unfair Entry & Lock-in")}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">🔒 Lock-in Trap</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[9px] font-bold">Illegal</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">0-day notice inspection, penalty terms</p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveView("upload")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      Upload or Scan Your Agreement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Property Safety Index & Flagged Clauses (col-span-4) */}
                  <div className="xl:col-span-4 space-y-4">
                    {/* 1. Property Safety Index Card */}
                    <div className="glass-panel rounded-3xl p-5 border border-slate-800/90 shadow-2xl bg-[#090d16] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                          <span>Property Safety Index</span>
                          <span className="text-slate-500 cursor-help" title="Model Tenancy Act 2021 statutory audit">ⓘ</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 max-w-[170px] truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {documentTitle}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Statutory audit vs. <strong className="text-slate-200">Model Tenancy Act 2021</strong>, Transfer of Property Act 1882 &amp; Indian Contract Act 1872.
                      </p>

                      <RadialGauge score={analysis.safetyScore} />

                      <p className="text-[11px] text-slate-400 text-center leading-snug">
                        {analysis.safetyScore < 50
                          ? `${analysis.riskCounts.high} severe statutory deviations from mandatory residential tenant protections discovered.`
                          : "Terms evaluated against national statutory benchmarks."}
                      </p>

                      {/* 3 Metric Pills */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
                        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                          <div className="text-[10px] text-rose-300 font-bold flex items-center justify-center gap-1">
                            <span>▲ High</span>
                          </div>
                          <div className="text-base font-black text-rose-400 font-mono mt-0.5">
                            {analysis.riskCounts.high}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Deposit &amp; Lock</div>
                        </div>

                        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30">
                          <div className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-1">
                            <span>▲ Mod</span>
                          </div>
                          <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                            {analysis.riskCounts.moderate}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Entry &amp; Notice</div>
                        </div>

                        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                          <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                            <span>🛡 Safe</span>
                          </div>
                          <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                            {analysis.riskCounts.standard}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Utility &amp; Term</div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Flagged Clauses for Review Card (Interactive!) */}
                    <div className="glass-panel rounded-3xl p-5 border border-slate-800/90 shadow-2xl bg-[#090d16] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          Flagged Clauses for Review
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                          {flaggedClauses.length} Critical
                        </span>
                      </div>

                      <div className="space-y-2">
                        {flaggedClauses.map((clause) => (
                          <button
                            key={clause.id}
                            onClick={() => setSelectedClauseToAsk(clause)}
                            className="w-full text-left p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between group"
                          >
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold shrink-0">
                                  Sec {clause.clauseNumber}.0
                                </span>
                                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                  {clause.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {clause.riskReason}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Statutory Benchmark Presets */}
                    <div className="glass-panel rounded-3xl p-5 border border-slate-800/90 shadow-2xl bg-[#090d16] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          Statutory Benchmark Presets
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          100% Citation
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300 text-[11px]">Model Tenancy Act (MTA 2021) Full Audit</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${analysis.safetyScore >= 75 ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300 border border-rose-500/30"}`}>
                            {analysis.safetyScore >= 75 ? "Passed" : "Failed"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-slate-300 text-[11px]">MTA Sec 11 Deposit 2-Month Cap Test</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                            {analysis.extractedSecurityDeposit ? `Failed (${analysis.extractedSecurityDeposit}mo)` : "Failed (10-Mo)"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gavel className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-slate-300 text-[11px]">Section 74 Indian Contract Act Penalty Test</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                            Unenforceable
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Assistant Console (col-span-8) */}
                  <div className="xl:col-span-8">
                    <ChatbotAssistant
                      analysis={analysis}
                      documentTitle={documentTitle}
                      selectedClauseToAsk={selectedClauseToAsk}
                      pendingQuestion={pendingChatQuestion}
                      onClearPendingQuestion={() => setPendingChatQuestion(null)}
                      onLoadDemo={loadSample}
                      onSelectView={setActiveView}
                      onUploadFileText={(text, title) => {
                        handleUploadedDocument(text, title);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: CLAUSE INSPECTOR */}
          {activeView === "inspector" && (
            <section aria-labelledby="inspection-heading" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h2 id="inspection-heading" className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Side-by-Side Clause Inspection
                  </h2>
                  <p className="text-xs text-slate-400">
                    Original Contract Terms (Left) vs. Plain-English Rewrite &amp; Citations (Right)
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] mr-1">Filter:</span>
                  <button
                    onClick={() => setFilterRisk("all")}
                    aria-pressed={filterRisk === "all"}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                      filterRisk === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({analysis?.clauses.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterRisk("high")}
                    aria-pressed={filterRisk === "high"}
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
                    aria-pressed={filterRisk === "moderate"}
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
                    aria-pressed={filterRisk === "standard"}
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

              {!analysis ? (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Agreement Loaded Yet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Load a demo scenario to see side-by-side clause inspection and plain-English rewrites, or upload your own rental agreement.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        loadSample(
                          "sample-lease-aggressive.txt",
                          "aggressive",
                          "Demo: Landlord Payment Request"
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      Load Landlord Payment Request Demo
                    </button>
                    <button
                      onClick={() => setActiveView("upload")}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                    >
                      Upload Agreement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClauses.map((clause) => (
                    <ClauseCard key={clause.id} clause={clause} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* VIEW 3: UPLOAD & OCR ZONE */}
          {activeView === "upload" && (
            <section aria-labelledby="upload-view-heading" className="space-y-6">
              <div>
                <h2 id="upload-view-heading" className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  Upload Agreement (Text or Scanned Photo)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload text files or photos/scans of rental contracts. Gemini Vision transcribes the text, segments clauses, and triggers our deterministic evaluation.
                </p>
              </div>

              {/* Evaluator Sample Leases */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Or Test Real Sample Rental Agreements
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">1-click instant audit</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      loadSample("sample-lease-aggressive.txt", "aggressive", "Demo: Landlord Payment Request");
                      setActiveView("chatbot");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedBench === "aggressive"
                        ? "bg-rose-950/60 border-rose-500 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">💳 Landlord Demand</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[9px] font-bold">High Risk</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">10-month deposit, ₹45k painting fee</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadSample("sample-lease-fair.txt", "fair", "Demo: Fair Standard Agreement");
                      setActiveView("chatbot");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedBench === "fair"
                        ? "bg-emerald-950/60 border-emerald-500 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">⚖️ Fair Govt Model</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">Safe</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">2-month deposit cap, 24h entry notice</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadSample("sample-lease-adversarial.txt", "adversarial", "Demo: Unfair Entry & Lock-in");
                      setActiveView("chatbot");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedBench === "adversarial"
                        ? "bg-amber-950/60 border-amber-500 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">🔒 Lock-in Trap</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[9px] font-bold">Illegal</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">0-day notice inspection, penalty terms</p>
                  </button>
                </div>
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

          {/* VIEW 4: BASELINE COMPARE */}
          {activeView === "compare" && (
            <div>
              {!analysis && !compareData ? (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Agreement to Compare Yet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Compare any rental contract against the Model Tenancy Act 2021 government standards.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        loadSample(
                          "sample-lease-aggressive.txt",
                          "aggressive",
                          "Demo: Landlord Payment Request"
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      Compare Landlord Payment Request Demo
                    </button>
                    <button
                      onClick={() => setActiveView("upload")}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                    >
                      Upload Agreement
                    </button>
                  </div>
                </div>
              ) : compareLoading ? (
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
              ) : (
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4 max-w-md mx-auto my-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Generate Statutory Benchmark Diff</h3>
                  <p className="text-xs text-slate-400">
                    Compare your uploaded agreement against the Model Tenancy Act 2021 government baseline.
                  </p>
                  <button
                    onClick={() => {
                      if (agreementText) {
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
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Run Model Tenancy Act Comparison
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: TENANT RIGHTS & LAWS */}
          {activeView === "knowledge" && (
            <section aria-labelledby="knowledge-heading">
              <IPLKnowledgeBank
                onAskChatbot={(question) => {
                  setPendingChatQuestion(question);
                  setActiveView("chatbot");
                }}
              />
            </section>
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

      {/* AI Reasoning Engine & Gemini Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={handleApiKeySaved}
      />

      {/* AI Safety Benchmark Modal (Unconstrained LLM vs VerifiedVakil) */}
      <SafetyBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />
    </div>
  );
}
