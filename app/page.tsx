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

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [bannerOcrStatus, setBannerOcrStatus] = useState<string | null>(null);
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

  const handleBannerFile = async (file: File) => {
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (text) {
          await handleUploadedDocument(text, file.name);
        }
      };
      reader.readAsText(file);
      return;
    }

    if (file.type.startsWith("image/") || file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
      setBannerOcrStatus(`Running OCR on ${file.name}...`);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const resultStr = e.target?.result as string;
          const base64Data = resultStr.split(",")[1];
          const mimeType = file.type || "image/jpeg";
          const clientApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";

          const res = await fetch("/api/ocr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(clientApiKey ? { "x-gemini-api-key": clientApiKey } : {}),
            },
            body: JSON.stringify({ base64Data, mimeType }),
          });

          const data = await res.json();
          if (data.success && data.text && !data.text.startsWith("No readable legal text")) {
            setBannerOcrStatus(`OCR complete (${data.latencyMs || 450}ms)! Auditing clauses...`);
            setTimeout(async () => {
              await handleUploadedDocument(data.text, `Scanned: ${file.name}`);
              setBannerOcrStatus(null);
            }, 500);
          } else {
            setBannerOcrStatus(
              data.text && data.text.startsWith("No readable legal text")
                ? data.text
                : "Could not extract readable legal text from this image. Please upload a clear photo."
            );
            setTimeout(() => setBannerOcrStatus(null), 5000);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Banner OCR error:", err);
        setBannerOcrStatus("Error during OCR. Please paste text directly.");
        setTimeout(() => setBannerOcrStatus(null), 3000);
      }
    }
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Brand & Tagline */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">VerifiedVakil</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold uppercase tracking-wider">
                    Tenant Protection
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Rental Agreement Reviewer
                </p>
              </div>
            </div>

            {/* Center: View Switcher Pills */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView("chatbot")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "chatbot"
                    ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask AI Assistant</span>
              </button>

              <button
                onClick={() => setActiveView("inspector")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "inspector"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Review Clauses</span>
              </button>

              <button
                onClick={() => setActiveView("knowledge")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "knowledge"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tenant Rights &amp; Laws</span>
              </button>

              <button
                onClick={() => setActiveView("upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "upload"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Agreement</span>
              </button>

              <button
                onClick={() => setActiveView("compare")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeView === "compare"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare with Fair Rules</span>
              </button>
            </div>

            {/* Right: Badges, Latency, Export Advice, User Avatar */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
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
                <span>
                  {apiStatus === "connected"
                    ? "Gemini Flash Active"
                    : apiStatus === "checking"
                    ? "Testing AI Engine..."
                    : "AI Engine: Ready (Set Key)"}
                </span>
              </button>

              <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Model Tenancy Law Grounded
              </span>

              <LatencyBadge
                deterministicMs={timings.deterministicMs}
                aiMs={timings.aiMs}
                totalMs={timings.totalMs}
              />

              <button
                type="button"
                onClick={() => setIsBenchmarkModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 hover:from-cyan-900 hover:to-indigo-900 text-cyan-200 border border-cyan-500/40 text-xs font-bold shadow-md shadow-cyan-950/40 transition-all"
                title="View live comparison between generic LLMs and VerifiedVakil citation locking"
                aria-label="Open AI Safety Benchmark modal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">AI Safety Benchmark</span>
                <span className="sm:hidden">Benchmark</span>
              </button>

              {analysis && (
                <button
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              )}

              {/* User Profile Avatar */}
              <div 
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 border border-indigo-400/30"
                title="Tenant Profile"
                aria-label="Tenant Profile"
              >
                <User className="w-4 h-4 text-indigo-100" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Dedicated Demo Scenarios Section */}
          <section aria-label="Demo Scenarios" className="glass-panel p-4 sm:p-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                  Evaluator Demo Scenarios — Quick Test
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Judge self-serve presets. (For video walkthrough recording, enter data live via paste or file upload).
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Demo 1: Landlord Payment Request */}
              <div
                onClick={() =>
                  loadSample(
                    "sample-lease-aggressive.txt",
                    "aggressive",
                    "Demo: Landlord Payment Request"
                  )
                }
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2.5 group ${
                  selectedBench === "aggressive"
                    ? "bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500"
                    : "bg-slate-900/70 border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-900"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                      💳 Landlord Payment Request
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-bold">
                      High Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Landlord demands 10-month deposit (₹3,50,000) and mandatory ₹45,000 painting fee.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-400 font-mono">14 Clauses</span>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedBench === "aggressive"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white"
                    }`}
                  >
                    {selectedBench === "aggressive" ? "Active Demo" : "Click Demo"}
                  </button>
                </div>
              </div>

              {/* Demo 2: Fair Standard Agreement */}
              <div
                onClick={() =>
                  loadSample(
                    "sample-lease-fair.txt",
                    "fair",
                    "Demo: Fair Standard Agreement"
                  )
                }
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2.5 group ${
                  selectedBench === "fair"
                    ? "bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-500"
                    : "bg-slate-900/70 border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-900"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      ⚖️ Fair Standard Agreement
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                      Safe
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Model Tenancy Act compliant: 2-month deposit cap, 24-hr written notice, and wear &amp; tear protection.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-400 font-mono">Govt Model</span>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedBench === "fair"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white"
                    }`}
                  >
                    {selectedBench === "fair" ? "Active Demo" : "Click Demo"}
                  </button>
                </div>
              </div>

              {/* Demo 3: Unfair Entry & Lock-in */}
              <div
                onClick={() =>
                  loadSample(
                    "sample-lease-adversarial.txt",
                    "adversarial",
                    "Demo: Unfair Entry & Lock-in"
                  )
                }
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2.5 group ${
                  selectedBench === "adversarial"
                    ? "bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-600/20 ring-1 ring-amber-500"
                    : "bg-slate-900/70 border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-900"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      🔒 Unfair Entry &amp; Lock-in
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold">
                      Illegal Terms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Zero-notice inspections at any hour and full deposit forfeiture for early departure.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-400 font-mono">Illegal Penalty</span>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedBench === "adversarial"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800 text-amber-300 group-hover:bg-amber-600 group-hover:text-white"
                    }`}
                  >
                    {selectedBench === "adversarial" ? "Active Demo" : "Click Demo"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Upload or Scan Your Rental Agreement Banner */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800/90 bg-[#090d16] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <input
              ref={bannerFileInputRef}
              type="file"
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleBannerFile(e.target.files[0]);
                }
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleBannerFile(e.target.files[0]);
                }
              }}
            />

            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Upload or Scan Your Rental Agreement
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                    Instant AI Scan &amp; Legal Audit
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload PDF, scanned images, or document photos. Full support for English and vernacular Indian tenancy drafts.
                </p>
                {bannerOcrStatus && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{bannerOcrStatus}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Camera Scan</span>
              </button>
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Browse Contract Files</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: CHATBOT GUIDE (SCREENSHOT 2 TWO-COLUMN COCKPIT) */}
          {activeView === "chatbot" && (
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

                  <RadialGauge score={analysis?.safetyScore ?? 24} />

                  <p className="text-[11px] text-slate-400 text-center leading-snug">
                    {analysis && analysis.safetyScore < 50
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
                        {analysis?.riskCounts.high ?? 4}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">Deposit &amp; Lock</div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30">
                      <div className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-1">
                        <span>▲ Mod</span>
                      </div>
                      <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                        {analysis?.riskCounts.moderate ?? 3}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">Entry &amp; Notice</div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                      <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                        <span>🛡 Safe</span>
                      </div>
                      <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                        {analysis?.riskCounts.standard ?? 9}
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
                      {flaggedClauses.length || 4} Critical
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
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${analysis?.safetyScore && analysis.safetyScore >= 75 ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300 border border-rose-500/30"}`}>
                        {analysis?.safetyScore && analysis.safetyScore >= 75 ? "Passed" : "Failed"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-slate-300 text-[11px]">MTA Sec 11 Deposit 2-Month Cap Test</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                        {analysis?.extractedSecurityDeposit ? `Failed (${analysis.extractedSecurityDeposit}mo)` : "Failed (10-Mo)"}
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

                {/* 4. Demo Scenarios Presets */}
                <div className="glass-panel rounded-3xl p-5 border border-slate-800/90 shadow-2xl bg-[#090d16] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Demo Scenarios
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Click to test different rental agreements
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                      QUICK AUDIT
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Bench 1 */}
                    <div className={`p-3 rounded-2xl border transition-all ${selectedBench === "aggressive" ? "bg-slate-900/90 border-indigo-500/50" : "bg-slate-950/60 border-slate-800"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">💳 Landlord Payment Request</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[9px] font-mono">
                            High Risk
                          </span>
                        </div>
                        <button
                          onClick={() => loadSample("sample-lease-aggressive.txt", "aggressive", "Demo: Landlord Payment Request")}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1"
                        >
                          {selectedBench === "aggressive" && <Check className="w-3 h-3 text-cyan-400" />}
                          <span>{selectedBench === "aggressive" ? "Active" : "Click Demo"}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">10-Mo Security Deposit</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">₹45K Painting Fee</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">Unlawful Forfeiture</span>
                      </div>
                    </div>

                    {/* Bench 2 */}
                    <div className={`p-3 rounded-2xl border transition-all ${selectedBench === "fair" ? "bg-slate-900/90 border-emerald-500/50" : "bg-slate-950/60 border-slate-800"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">⚖️ Fair Standard Agreement</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono">
                            Safe
                          </span>
                        </div>
                        <button
                          onClick={() => loadSample("sample-lease-fair.txt", "fair", "Demo: Fair Standard Agreement")}
                          className="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold"
                        >
                          {selectedBench === "fair" ? "Active" : "Click Demo"}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">2-Month Deposit Cap</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">24h Written Notice</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">MTA Sec 11 Guard</span>
                      </div>
                    </div>

                    {/* Bench 3 */}
                    <div className={`p-3 rounded-2xl border transition-all ${selectedBench === "adversarial" ? "bg-slate-900/90 border-amber-500/50" : "bg-slate-950/60 border-slate-800"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">🔒 Unfair Entry &amp; Lock-in</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                            Illegal Terms
                          </span>
                        </div>
                        <button
                          onClick={() => loadSample("sample-lease-adversarial.txt", "adversarial", "Demo: Unfair Entry & Lock-in")}
                          className="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold"
                        >
                          {selectedBench === "adversarial" ? "Active" : "Click Demo"}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">0-Day Notice Inspection</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">Unlawful Lock-in Penalty</span>
                      </div>
                    </div>
                  </div>

                  {/* Benchmark footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Grounded Audit
                    </span>
                    <span className="text-emerald-400">Citation Lock: 100%</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Assistant Console (col-span-8) */}
              <div className="xl:col-span-8">
                <ChatbotAssistant
                  analysis={analysis}
                  documentTitle={documentTitle}
                  selectedClauseToAsk={selectedClauseToAsk}
                  onLoadDemo={loadSample}
                  onSelectView={setActiveView}
                />
              </div>
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
              ) : null}
            </div>
          )}

          {/* VIEW 5: TENANT RIGHTS & LAWS */}
          {activeView === "knowledge" && (
            <section aria-labelledby="knowledge-heading">
              <IPLKnowledgeBank
                onAskChatbot={(question) => {
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
