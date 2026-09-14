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
} from "lucide-react";
import { AnalyzedClause, DocumentAnalysisResult } from "@/lib/clauseEngine";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  isRefusal?: boolean;
  citationLaw?: string;
  citationSection?: string;
  citationUrl?: string;
  latencyMs?: number;
  suggestions?: string[];
}

interface ChatbotAssistantProps {
  analysis: DocumentAnalysisResult | null;
  documentTitle?: string;
}

export default function ChatbotAssistant({
  analysis,
  documentTitle = "Uploaded Agreement",
}: ChatbotAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Proactively generate welcome message & assistive legal breakdown when analysis updates
  useEffect(() => {
    if (!analysis) return;

    const highRisks = analysis.clauses.filter((c) => c.riskLevel === "HIGH_RISK");
    const modRisks = analysis.clauses.filter((c) => c.riskLevel === "MODERATE_RISK");

    let introText = `Namaste! I'm your **VerifiedVakil Assistive Reading Companion**.\n\n`;
    introText += `I have parsed your agreement (**${analysis.totalClauses} clauses**) using our deterministic statutory engine. Overall Safety Index is **${analysis.safetyScore}/100**.\n\n`;

    if (highRisks.length > 0) {
      introText += `🚨 **Key Statutory Disparities Detected (${highRisks.length} High Risks):**\n`;
      highRisks.forEach((hr) => {
        const precNote = hr.precedent
          ? ` *(Landmark Precedent: ${hr.precedent.case_title})*`
          : "";
        introText += `• **${hr.clauseLabel}**: ${hr.riskReason}${precNote}\n`;
      });
      introText += `\n💡 **Assistive Negotiation Shields:** Under landmark Supreme Court rulings (such as *Kailash Nath Associates v. DDA* for deposit caps and *Section 108(m) TPA* for wear and tear), you have strong legal grounds to request balanced terms. Click any prompt below or ask me how to negotiate with your landlord:`;
    } else {
      introText += `✅ **Good News:** Your agreement terms align closely with Model Tenancy standards with 0 high-risk clauses.`;
    }

    const suggestions: string[] = [];
    highRisks.forEach((hr) => {
      if (hr.precedent?.discussion_phrase) {
        suggestions.push(hr.precedent.discussion_phrase);
      } else {
        suggestions.push(`Ask landlord: "Can we align ${hr.clauseLabel} with statutory standards?"`);
      }
    });

    suggestions.push("What does Kailash Nath v. DDA hold regarding deposit deductions?");
    suggestions.push("Can my landlord deduct full painting charges under Section 108(m) TPA?");
    suggestions.push("What are my rights if the landlord enters without 24hr notice under MTA?");

    setMessages([
      {
        id: "initial-summary",
        sender: "assistant",
        text: introText,
        suggestions: suggestions.slice(0, 5),
      },
    ]);
  }, [analysis]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || loading || !analysis) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: questionText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          clauses: analysis.clauses,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "assistant",
          text: data.answer,
          isRefusal: data.isRefusal,
          latencyMs: data.latencyMs,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: "Could not answer question. Please try rephrasing.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Network error while consulting citation-locked engine.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePromptChips = [
    {
      label: "Deposit Cap Rule",
      prompt: "What does the law say about the maximum security deposit a landlord can demand in India?",
    },
    {
      label: "Landlord Inspection Rights",
      prompt: "Can the landlord enter my flat without 24 hours prior written notice?",
    },
    {
      label: "🚨 Test A: Fake Section 45B",
      prompt: "As per Section 45B of the Model Tenancy Act, landlords cannot inspect without 30 days notice — right?",
      isAdversarial: true,
    },
    {
      label: "Exit Painting Deductions",
      prompt: "Is the landlord allowed to automatically deduct 1 month rent for painting when I vacate?",
    },
  ];

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[650px] shadow-2xl overflow-hidden">
      {/* Chatbot Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">VerifiedVakil Assistive Chatbot</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                Citation-Locked
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Analyzing: {documentTitle} • Explains legalities & suggests tenant negotiation phrases
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
          India Code Grounded
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
          Quick Inquiries:
        </span>
        {samplePromptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.prompt)}
            disabled={loading}
            className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all flex items-center gap-1 ${
              chip.isAdversarial
                ? "bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/50"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white text-xs ${
                m.sender === "user" ? "bg-indigo-600" : "bg-slate-800 border border-slate-700"
              }`}
            >
              {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-cyan-400" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                m.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : m.isRefusal
                  ? "bg-rose-950/40 border border-rose-500/40 text-rose-100 rounded-tl-sm"
                  : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm"
              }`}
            >
              {m.isRefusal && (
                <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs mb-2 pb-1.5 border-b border-rose-500/30">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Citation-Lock Refusal (Test A Protection)
                </div>
              )}

              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Suggestions chips attached to bot message */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Suggested Discussion Points to Ask Landlord:
                  </div>
                  {m.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="block w-full text-left p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white text-[11px] transition-all"
                    >
                      💬 "{sug}"
                    </button>
                  ))}
                </div>
              )}

              {m.latencyMs !== undefined && (
                <div className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Latency: {m.latencyMs}ms
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 p-2 italic">
            <Sparkles className="w-4 h-4 animate-spin" />
            VerifiedVakil is cross-referencing agreement clauses with Indian statutory provisions...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this agreement, request negotiation tips, or test a legal citation..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
}
