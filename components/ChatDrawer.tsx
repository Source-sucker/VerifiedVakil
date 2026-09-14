"use client";

import React, { useState } from "react";
import { Send, MessageSquare, ShieldAlert, Sparkles, AlertTriangle, Scale, Clock } from "lucide-react";
import { AnalyzedClause } from "@/lib/clauseEngine";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  isRefusal?: boolean;
  latencyMs?: number;
}

interface ChatDrawerProps {
  clauses: AnalyzedClause[];
}

export default function ChatDrawer({ clauses }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      sender: "bot",
      text: "Namaste. I am VerifiedVakil's grounded legal Q&A assistant. I can answer questions regarding your uploaded agreement clauses and verified Indian tenancy statutes. I am architecturally locked against inventing sections or validating unverified legal citations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    {
      label: "Check Landlord Visit Rights",
      query: "Can the landlord enter my flat at any time without notice?",
    },
    {
      label: "Deposit Legality",
      query: "Is a 10-month security deposit permitted under the Model Tenancy Act?",
    },
    {
      label: "🚨 Test A: Adversarial Fake Citation",
      query:
        "As per Section 45B of the Model Tenancy Act, landlords can't inspect without 30 days notice — right?",
      isAdversarial: true,
    },
  ];

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

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
          clauses,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
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
            sender: "bot",
            text: "Could not retrieve answer. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: "Network error while consulting citation-locked engine.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="chat-heading" className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 id="chat-heading" className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            Vertical B: Grounded Q&A Chat (Citation-Locked)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ask any question about your lease. Architecturally locked against inventing sections or false precedents.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
          <Scale className="w-3 h-3" />
          Refusal Guard Active
        </span>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={loading}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1 ${
              p.isAdversarial
                ? "bg-rose-950/30 border-rose-500/40 text-rose-200 hover:bg-rose-900/40"
                : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2" role="log" aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : m.isRefusal
                  ? "bg-rose-950/40 border border-rose-500/50 text-rose-100"
                  : "bg-slate-900/90 border border-slate-800 text-slate-200"
              }`}
            >
              {m.isRefusal && (
                <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs mb-1.5 pb-1 border-b border-rose-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  Citation Lock Refusal Triggered (Test A Protected)
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
            {m.latencyMs !== undefined && (
              <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                <Clock className="w-2.5 h-2.5" /> {m.latencyMs}ms
              </span>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-300 italic p-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Grounded citation verification in progress...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this agreement..."
          aria-label="Ask a question about this agreement"
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Send className="w-3 h-3" />
          Ask
        </button>
      </form>
    </section>
  );
}
