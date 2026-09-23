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
    <div className="flex min-h-screen text-slate-100" style={{ background: "var(--background)" }}>
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
        <header
          className="sticky top-0 z-30 px-4 sm:px-6 py-2.5 no-print"
          style={{
            background: "rgba(6,9,20,0.88)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand & Document Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                  boxShadow: "0 0 16px rgba(99,102,241,0.4)",
                }}
              >
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight shrink-0" style={{ color: "#e2e8f0" }}>VerifiedVakil</span>
                  {analysis ? (
                    <span
                      className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono truncate max-w-[220px]"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: analysis.safetyScore >= 75 ? "#34d399" : analysis.safetyScore >= 50 ? "#fbbf24" : "#f87171" }}
                      />
                      <span className="truncate">{documentTitle || "Agreement Loaded"}</span>
                      <span style={{ color: analysis.safetyScore >= 75 ? "#34d399" : analysis.safetyScore >= 50 ? "#fbbf24" : "#f87171" }}>({analysis.safetyScore}/100)</span>
                    </span>
                  ) : (
                    <span
                      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#334155" }}
                    >
                      No Agreement Loaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Demo Preset Switcher */}
            <div
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl text-xs"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5" style={{ color: "#334155" }}>Try:</span>
              {[
                { bench: "aggressive", file: "sample-lease-aggressive.txt", title: "Demo: Landlord Payment Request", label: "Predatory", badgeLabel: "High Risk", color: "#f87171", bg: "rgba(127,29,29,0.4)", border: "rgba(248,113,113,0.35)" },
                { bench: "fair", file: "sample-lease-fair.txt", title: "Demo: Fair Standard Agreement", label: "Fair", badgeLabel: "Safe", color: "#34d399", bg: "rgba(6,78,59,0.4)", border: "rgba(52,211,153,0.35)" },
                { bench: "adversarial", file: "sample-lease-adversarial.txt", title: "Demo: Unfair Entry & Lock-in", label: "Lock-in", badgeLabel: "Illegal", color: "#fbbf24", bg: "rgba(120,53,15,0.4)", border: "rgba(251,191,36,0.35)" },
              ].map(({ bench, file, title, label, badgeLabel, color, bg, border }) => (
                <button
                  key={bench}
                  type="button"
                  onClick={() => loadSample(file, bench, title)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={selectedBench === bench ? { background: bg, border: `1px solid ${border}`, color } : { color: "#475569" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {label}
                </button>
              ))}
            </div>

            {/* Right: Action bar */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                style={apiStatus === "connected"
                  ? { background: "rgba(6,78,59,0.4)", border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }
                }
                title="Configure Gemini API Key"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: apiStatus === "connected" ? "#34d399" : apiStatus === "checking" ? "#22d3ee" : "#fbbf24" }}
                />
                <span className="hidden sm:inline">{apiStatus === "connected" ? "Gemini Live" : "Set API Key"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBenchmarkModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">AI Safety</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("upload")}
                className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </button>

              {analysis && (
                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all"
                  style={{ background: "rgba(126,34,206,0.7)", border: "1px solid rgba(167,139,250,0.3)" }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export</span>
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
          {/* VIEW 1: CHATBOT GUIDE */}
          {activeView === "chatbot" && (
            <div>
              {!analysis ? (
                /* ── HERO LANDING STATE ─────────────────────── */
                <div className="max-w-4xl mx-auto my-6 sm:my-10 animate-fade-in-up">
                  {/* Hero card */}
                  <div
                    className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center space-y-7"
                    style={{
                      background: "rgba(10, 23, 29, 0.88)",
                      border: "1px solid rgba(94,234,212,0.16)",
                      boxShadow: "0 0 80px rgba(20,184,166,0.06), 0 30px 60px rgba(0,0,0,0.42), 0 1px 0 rgba(255,255,255,0.05) inset",
                    }}
                  >
                    {/* Background glow blobs */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full blur-3xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

                    {/* Icon */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                      style={{
                        background: "linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(6,182,212,0.15) 100%)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        boxShadow: "0 0 30px rgba(99,102,241,0.2)",
                      }}
                    >
                      <Bot className="w-8 h-8" style={{ color: "#818cf8" }} />
                    </div>

                    <div className="space-y-2.5">
                      <div className="label-section text-teal-300">A clearer read before you sign</div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: "#f1f5f9" }}>
                        Understand your rental agreement before you sign.
                      </h1>
                      <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: "#8fa3ad" }}>
                        Upload a residential lease and get a plain-English review of deposits, notice periods, entry rights, and other terms that deserve a closer look.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left max-w-2xl mx-auto">
                      {[
                        ["01", "Upload", "Drop in a text file or scan"],
                        ["02", "Review", "See every flagged clause"],
                        ["03", "Prepare", "Take clear questions to a lawyer"],
                      ].map(([number, title, copy]) => (
                        <div key={number} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-[10px] font-mono font-bold text-teal-300 mt-0.5">{number}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{title}</div>
                            <div className="text-[10px] text-slate-500 leading-snug">{copy}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Demo scenario cards */}
                    <div className="space-y-2.5">
                      <div className="label-section text-center mb-3">See how the review works</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                        {[
                          {
                            icon: <AlertTriangle className="w-4 h-4" />,
                            label: "Landlord Demand",
                            desc: "10-month deposit, ₹45k painting fee",
                            badge: "High Risk",
                            bench: "aggressive",
                            file: "sample-lease-aggressive.txt",
                            title: "Demo: Landlord Payment Request",
                            badgeColor: "#f87171",
                            badgeBg: "rgba(127,29,29,0.5)",
                            badgeBorder: "rgba(248,113,113,0.3)",
                            hoverBorder: "rgba(248,113,113,0.3)",
                          },
                          {
                            icon: <CheckCircle2 className="w-4 h-4" />,
                            label: "Fair Govt Model",
                            desc: "2-month deposit cap, 24h entry notice",
                            badge: "Safe",
                            bench: "fair",
                            file: "sample-lease-fair.txt",
                            title: "Demo: Fair Standard Agreement",
                            badgeColor: "#6ee7b7",
                            badgeBg: "rgba(6,78,59,0.5)",
                            badgeBorder: "rgba(52,211,153,0.3)",
                            hoverBorder: "rgba(52,211,153,0.3)",
                          },
                          {
                            icon: <ShieldAlert className="w-4 h-4" />,
                            label: "Lock-in Trap",
                            desc: "0-day notice inspection, penalty terms",
                            badge: "Illegal",
                            bench: "adversarial",
                            file: "sample-lease-adversarial.txt",
                            title: "Demo: Unfair Entry & Lock-in",
                            badgeColor: "#fcd34d",
                            badgeBg: "rgba(120,53,15,0.5)",
                            badgeBorder: "rgba(251,191,36,0.3)",
                            hoverBorder: "rgba(251,191,36,0.3)",
                          },
                        ].map((item) => (
                          <button
                            key={item.bench}
                            onClick={() => loadSample(item.file, item.bench, item.title)}
                            className="p-3.5 rounded-2xl text-left transition-all group"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: `1px solid rgba(255,255,255,0.07)`,
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.borderColor = item.hoverBorder)}
                            onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold" style={{ color: "#e2e8f0" }}>
                                <span className="inline-flex items-center gap-1.5">{item.icon}{item.label}</span>
                              </span>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: item.badgeBg, border: `1px solid ${item.badgeBorder}`, color: item.badgeColor }}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px]" style={{ color: "#475569" }}>{item.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-6">
                      <button
                        onClick={() => setActiveView("upload")}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        Upload or Scan Your Agreement
                      </button>
                    </div>
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
          documentTitle={documentTitle || "Rental Agreement"}
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
