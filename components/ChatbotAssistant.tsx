"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Clock,
  HelpCircle,
  MessageSquare,
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Paperclip,
  Mic,
  Volume2,
  Download,
  Maximize2,
  AlertCircle,
  Gavel,
  FileText,
} from "lucide-react";
import { AnalyzedClause, DocumentAnalysisResult } from "@/lib/clauseEngine";
import { extractDocumentFacts } from "@/lib/geminiClient";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isRefusal?: boolean;
  unlawfulTermsTitle?: string;
  unlawfulTermsSummary?: string;
  statutoryBadges?: Array<{
    title: string;
    section: string;
    explanation: string;
    law: string;
  }>;
  counterDraftClause?: {
    title: string;
    clauseText: string;
  };
  latencyMs?: number;
}

interface ChatbotAssistantProps {
  analysis: DocumentAnalysisResult | null;
  documentTitle?: string;
  selectedClauseToAsk?: AnalyzedClause | null;
  onLoadDemo?: (fileName: string, benchKey: string, title: string) => void;
  onSelectView?: (view: "chatbot" | "inspector" | "upload" | "compare" | "knowledge") => void;
}

export default function ChatbotAssistant({
  analysis,
  documentTitle = "",
  selectedClauseToAsk,
  onLoadDemo,
  onSelectView,
}: ChatbotAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset messages when document changes — no out-of-the-blue spawn
  useEffect(() => {
    setMessages([]);
  }, [documentTitle]);

  // When user selects a flagged clause from the left rail
  useEffect(() => {
    if (selectedClauseToAsk) {
      const q = `Evaluate Clause #${selectedClauseToAsk.clauseNumber} (${selectedClauseToAsk.title}): "${selectedClauseToAsk.rawText}". Is this enforceable? Please counter-draft a fair version.`;
      handleSend(q);
    }
  }, [selectedClauseToAsk]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopyClause = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseId(id);
    setTimeout(() => setCopiedClauseId(null), 2000);
  };

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || loading || !analysis) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: timeStr,
      text: questionText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const clientApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientApiKey ? { "x-gemini-api-key": clientApiKey } : {}),
        },
        body: JSON.stringify({
          question: questionText,
          clauses: analysis.clauses,
        }),
      });

      const data = await res.json();
      const asstTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.success) {
        const facts = extractDocumentFacts(analysis.clauses);
        let counterDraft: ChatMessage["counterDraftClause"] | undefined;
        const qLower = questionText.toLowerCase();

        if (qLower.includes("deposit") || qLower.includes("refund") || qLower.includes("lock-in") || qLower.includes("exit")) {
          const capText = facts.monthlyRent
            ? `capped at 2 (two) months' rent (₹${(facts.monthlyRent * 2).toLocaleString("en-IN")}/-)`
            : "capped at 2 (two) months' rent";
          counterDraft = {
            title: "RECOMMENDED SUBSTITUTE CLAUSE: SECURITY DEPOSIT & EXIT",
            clauseText:
              `The Tenant shall furnish a refundable security deposit ${capText} (under Section 11 of the Model Tenancy Act, 2021). The deposit shall be refunded in full within 30 days of vacating the premises, subject only to actual documented unpaid utility bills or physical damage beyond reasonable wear and tear backed by genuine GST invoices. Any arbitrary lock-in penalty is void under Section 74 of the Indian Contract Act, 1872 (Kailash Nath Associates v. Delhi Development Authority, (2015) 4 SCC 136).`,
          };
        } else if (qLower.includes("paint") || qLower.includes("wear") || qLower.includes("tear") || qLower.includes("maintenance")) {
          counterDraft = {
            title: "RECOMMENDED SUBSTITUTE CLAUSE: MAINTENANCE & WEAR/TEAR",
            clauseText:
              'The Tenant shall maintain the interior fixtures in good order. At determination of tenancy, the Tenant shall hand over possession in as good condition as received, reasonable wear and tear and damage by ordinary usage excepted (Section 108(m), Transfer of Property Act, 1882). No automatic flat fee or mandatory repainting charge shall be deducted without proof of exceptional damage backed by official receipts.',
          };
        } else if (qLower.includes("entry") || qLower.includes("inspect") || qLower.includes("notice")) {
          counterDraft = {
            title: "RECOMMENDED SUBSTITUTE CLAUSE: LANDLORD INSPECTION RIGHTS",
            clauseText:
              'The Landlord or their designated representative may inspect the premises only after serving at least 24 (twenty-four) hours\' prior written notice to the Tenant, with inspection scheduled mutually between 7:00 AM and 8:00 PM (Section 15(1), Model Tenancy Act, 2021). Unannounced entry is strictly prohibited.',
          };
        }

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "assistant",
          timestamp: asstTimeStr,
          text: data.answer,
          isRefusal: data.isRefusal,
          counterDraftClause: counterDraft,
          latencyMs: data.latencyMs,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            timestamp: asstTimeStr,
            text: "Could not evaluate query against statutory knowledge base. Please try rephrasing.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: "Network error while consulting citation-locked engine.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isDefaultDraft = documentTitle === "Bellandur_Lease_Draft_2026.pdf";
  const docFacts = analysis ? extractDocumentFacts(analysis.clauses) : null;

  const quickPrompts = isDefaultDraft
    ? [
        { label: "💬 Draft formal WhatsApp notice to landlord", prompt: "Draft a polite but legally grounded WhatsApp message to my landlord objecting to the 10-month deposit and ₹45k painting deduction, citing the Model Tenancy Act." },
        { label: "⚖️ Explain painting deduction rights under MTA", prompt: "Can my landlord deduct ₹45,000 for repainting walls under Section 108(m) TPA and Model Tenancy Act?" },
        { label: "💰 Calculate my statutory refund balance", prompt: "Under Model Tenancy Act rules (2-month deposit cap), how much of my ₹3,50,000 deposit should legally be refunded?" },
        { label: "🚨 Test A: Fake Section 45B Probe", prompt: "As per Section 45B of the Model Tenancy Act, landlords cannot inspect without 30 days notice — right?", isAdversarial: true },
      ]
    : [
        {
          label: "💬 Draft formal WhatsApp notice to landlord",
          prompt: docFacts?.landlordName
            ? `Draft a polite but legally grounded WhatsApp message to ${docFacts.landlordName} addressing the non-compliant clauses in this agreement, citing statutory benchmarks.`
            : "Draft a polite but legally grounded WhatsApp message to my landlord objecting to the non-compliant clauses in this agreement, citing statutory benchmarks.",
        },
        {
          label: "💰 Calculate statutory refund balance",
          prompt: docFacts?.securityDepositFormatted
            ? `Under Model Tenancy Act rules (2-month deposit cap), how much of my ${docFacts.securityDepositFormatted} deposit should legally be refunded upon exit?`
            : "Under Model Tenancy Act rules (2-month deposit cap), how much of my security deposit should legally be refunded?",
        },
        {
          label: "⚖️ Explain painting deduction rights under MTA",
          prompt: docFacts?.paintingChargeFormatted
            ? `Can my landlord deduct ${docFacts.paintingChargeFormatted} for repainting walls under Section 108(m) TPA and Model Tenancy Act?`
            : "Can my landlord deduct mandatory painting charges under Section 108(m) TPA and Model Tenancy Act for this agreement?",
        },
        {
          label: "🚨 Test A: Fake Section 45B Probe",
          prompt: "As per Section 45B of the Model Tenancy Act, landlords cannot inspect without 30 days notice — right?",
          isAdversarial: true,
        },
      ];

  return (
    <div className="glass-panel rounded-3xl border border-slate-800/90 flex flex-col h-[750px] shadow-2xl overflow-hidden bg-[#090d16]">
      {/* 1. Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                VerifiedVakil Assistant
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Tenant Rights Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Model Tenancy Act 2021 • Supreme Court Precedents • State Rent Rules
            </p>
          </div>
        </div>

        {/* Action icons & Clear button */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors flex items-center gap-1"
              title="Reset conversation"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Listen to summary"
            aria-label="Audio summary"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Download report"
            aria-label="Download legal summary"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Agreement Summary Banner */}
      {analysis && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/30 border-b border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Agreement Loaded</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                {analysis.totalClauses} Clauses Audited
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-white">{documentTitle || "Current Agreement"}</strong>: Found{" "}
              <strong className="text-rose-400">{analysis.riskCounts.high} high-risk</strong> and{" "}
              <strong className="text-amber-400">{analysis.riskCounts.moderate} moderate-risk</strong> terms. Click a question below or ask in the box to get legal advice and fair replacement clauses.
            </p>
          </div>
        </div>
      )}

      {/* 3. Messages Stream / Empty Welcome State */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-[#070b13]/60">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center py-6 px-3">
            {!analysis ? (
              /* No document loaded yet: show clean Welcome and Demo Scenarios */
              <div className="max-w-xl w-full text-center space-y-6">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/20">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Welcome to VerifiedVakil
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Check your rental agreement against Indian tenancy laws. Detect illegal deductions, excessive deposits, and unannounced landlord visits.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                    Select a Demo to Test
                  </div>

                  {/* Demo Card 1: Landlord Payment Request */}
                  <div
                    onClick={() =>
                      onLoadDemo?.(
                        "sample-lease-aggressive.txt",
                        "aggressive",
                        "Demo: Landlord Payment Request"
                      )
                    }
                    className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 hover:border-indigo-400 cursor-pointer transition-all duration-200 group flex items-start justify-between gap-3 shadow-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                          💳 Demo: Landlord Payment Request
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-bold">
                          High Risk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Landlord demands 10-month deposit (₹3,50,000) and mandatory ₹45,000 painting deduction upon moving out.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 transition-colors shadow-md"
                    >
                      Load Demo
                    </button>
                  </div>

                  {/* Demo Card 2: Fair Standard Agreement */}
                  <div
                    onClick={() =>
                      onLoadDemo?.(
                        "sample-lease-fair.txt",
                        "fair",
                        "Demo: Fair Standard Agreement"
                      )
                    }
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all duration-200 group flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          ⚖️ Demo: Fair Standard Agreement
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                          Fair Model
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Government Model Tenancy Act compliant lease: 2-month deposit cap, 24-hr written notice, and wear &amp; tear protection.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white font-bold text-[11px] shrink-0 transition-colors"
                    >
                      Load Demo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Agreement is loaded: Show clean summary & interactive question cards */
              <div className="max-w-xl w-full space-y-4 text-left">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {documentTitle || "Rental Agreement"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {analysis.totalClauses} Clauses Audited under Model Tenancy Act
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                      {analysis.riskCounts.high} Issues Flagged
                    </span>
                  </div>

                  {/* Summary of key issues found */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Key Concerns Detected:
                    </div>
                    {analysis.clauses
                      .filter((c) => c.riskLevel === "HIGH_RISK")
                      .slice(0, 2)
                      .map((c, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-slate-300 leading-snug space-y-1"
                        >
                          <div className="font-bold text-rose-300 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>{c.title}</span>
                          </div>
                          <p className="text-slate-300 text-[10px]">{c.riskReason}</p>
                        </div>
                      ))}
                  </div>

                  {/* Action prompt chips */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Click a question to get instant legal guidance:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSend(
                            "Are the 10-month deposit and ₹45,000 painting fee legal under Indian law?"
                          )
                        }
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500 text-left text-[11px] text-slate-200 transition-all font-medium flex items-center justify-between group"
                      >
                        <span>⚖️ Are deposit &amp; painting fees legal?</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSend(
                            "Draft a polite WhatsApp message to my landlord negotiating the 10-month deposit and painting deduction, citing statutory law."
                          )
                        }
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500 text-left text-[11px] text-slate-200 transition-all font-medium flex items-center justify-between group"
                      >
                        <span>💬 Draft WhatsApp message to landlord</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSend(
                            "Under the Model Tenancy Act (2-month cap), how much of my deposit should legally be refunded?"
                          )
                        }
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500 text-left text-[11px] text-slate-200 transition-all font-medium flex items-center justify-between group"
                      >
                        <span>💰 Calculate my legal refund amount</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSend(
                            "Give me a fair substitute clause for the security deposit and wear & tear."
                          )
                        }
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500 text-left text-[11px] text-slate-200 transition-all font-medium flex items-center justify-between group"
                      >
                        <span>📝 Generate fair replacement clause</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="space-y-2">
              {/* Message Row */}
              <div
                className={`flex items-start gap-3 ${
                  m.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    m.sender === "user"
                      ? "bg-indigo-600 shadow-md shadow-indigo-600/30"
                      : "bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-600/20"
                  }`}
                >
                  {m.sender === "user" ? "AK" : <Scale className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 leading-relaxed shadow-lg ${
                    m.sender === "user"
                      ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-tr-sm"
                      : "bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-tl-sm space-y-3"
                  }`}
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1 pb-1 border-b border-slate-800/60">
                    <span className="font-semibold text-slate-300">
                      {m.sender === "user" ? "You (Tenant)" : "VerifiedVakil Legal Assistant"}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{m.timestamp}</span>
                  </div>

                  {/* Plain text / Question */}
                  {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}

                  {/* Refusal Banner (Test A) */}
                  {m.isRefusal && (
                    <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Citation-Lock Refusal: Architectural block triggered on unverified authority.</span>
                    </div>
                  )}

                  {/* Unlawful terms alert banner */}
                  {m.unlawfulTermsTitle && (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        {m.unlawfulTermsTitle}
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-relaxed font-sans">
                        {m.unlawfulTermsSummary}
                      </p>
                    </div>
                  )}

                  {/* Statutory Badges Stack */}
                  {m.statutoryBadges && m.statutoryBadges.length > 0 && (
                    <div className="space-y-2 pt-1">
                    {m.statutoryBadges.map((badge, bIdx) => (
                      <div
                        key={bIdx}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold">
                            {badge.section}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {badge.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {badge.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommended Substitute Clause (Screenshot 2) */}
                {m.counterDraftClause && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                        <Gavel className="w-3.5 h-3.5" />
                        {m.counterDraftClause.title}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyClause(m.counterDraftClause!.clauseText, m.id)
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-colors"
                      >
                        {copiedClauseId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Clause</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-200 leading-relaxed">
                      &ldquo;{m.counterDraftClause.clauseText}&rdquo;
                    </div>
                  </div>
                )}

                {/* Latency footer */}
                {m.latencyMs !== undefined && (
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 pt-1">
                    <Clock className="w-2.5 h-2.5" /> Latency: {m.latencyMs}ms
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 p-3 italic bg-slate-950/40 rounded-xl border border-slate-800/80">
            <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            VerifiedVakil AI Advocate is auditing statutory gazettes and counter-drafting...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Question Pills Row */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold shrink-0">
          Suggestions:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            className={`px-3 py-1 rounded-xl whitespace-nowrap border transition-all text-xs font-medium flex items-center gap-1 shrink-0 ${
              qp.isAdversarial
                ? "bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/50"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-white"
            }`}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* 5. Input Console */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          title="Attach lease agreement or image scan"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          title="Voice input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask VerifiedVakil about any clause, penalty, notice period, or draft an amendment..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all shrink-0"
        >
          <span>Send / Analyze</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>

      {/* 6. Statutory Safeguards Footer */}
      <div className="px-4 py-1.5 bg-[#05080e] border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-cyan-400/90">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
          Statutory Safeguard Active: Citations verified against India Code &amp; Karnataka Gazettes
        </span>
        <span className="text-slate-400">MTA 2021 Model Baseline</span>
      </div>
    </div>
  );
}
