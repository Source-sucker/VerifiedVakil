"use client";

import React, { useState } from "react";
import {
  Scale,
  Search,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Gavel,
  ArrowRight,
  Filter,
} from "lucide-react";
import { CONDENSED_IPL_LAW_BANK, LawEntry, searchLawBank } from "@/lib/iplLawKnowledgeBase";

interface IPLKnowledgeBankProps {
  onAskChatbot?: (question: string) => void;
}

export default function IPLKnowledgeBank({ onAskChatbot }: IPLKnowledgeBankProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Cases & Statutes" },
    { id: "deposit_penalty", label: "Deposits & Forfeitures" },
    { id: "eviction_possession", label: "Eviction & Possession" },
    { id: "privacy_entry", label: "Privacy & Landlord Entry" },
    { id: "term_registration", label: "11-Month Term & Registration" },
    { id: "maintenance_utilities", label: "Wear, Tear & Utilities" },
  ];

  const filteredEntries = searchLawBank(searchQuery, selectedCategory);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scale className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Gavel className="w-3.5 h-3.5" />
            <span>Supreme Court of India & Statutory Tenancy Laws</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Indian Property Law & Case Law Knowledge Bank
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            High-density, primary-source compilation of landmark Supreme Court precedents and statutory provisions
            governing residential leases in India. Every principle includes verified citations, core holdings, and
            ready-to-use negotiation discussion scripts for tenants.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 100% Primary Source Verified
            </span>
            <span>• Transfer of Property Act, 1882</span>
            <span>• Indian Contract Act, 1872 (§74)</span>
            <span>• Model Tenancy Act, 2021</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case titles, section refs, wear & tear, deposits, eviction, entry..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condensed Law Bank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntries.map((entry) => (
          <article
            key={entry.id}
            id={entry.id}
            className="glass-panel rounded-2xl p-5 border border-slate-800/90 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      {entry.categoryLabel}
                    </span>
                    <span className="text-[11px] font-mono text-amber-300">
                      {entry.year}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {entry.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {entry.courtOrAuthority} •{" "}
                    <span className="text-amber-200/90">{entry.citation}</span>
                  </p>
                </div>

                <a
                  href={entry.primarySourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View record on primary source for ${entry.title}`}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors border border-slate-800 shrink-0"
                  title="Open Primary Legal Record"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Statutory Anchor */}
              <div className="text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono text-cyan-300 flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>Statute: {entry.statuteReference}</span>
              </div>

              {/* Condensed Rule */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Condensed Legal Principle / Ratio Decidendi
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {entry.condensedRule}
                </p>
              </div>

              {/* Tenant Shield */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Tenant Shield & Protection
                </span>
                <p className="text-emerald-200 leading-relaxed">
                  {entry.tenantProtection}
                </p>
              </div>
            </div>

            {/* Intelligent Landlord Negotiation Script (Copyable) */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Intelligent Landlord Discussion Script:
                </span>
                <button
                  onClick={() => handleCopy(entry.id, entry.intelligentSuggestion)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-colors"
                >
                  {copiedId === entry.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              <blockquote className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20 text-xs text-indigo-100 italic leading-relaxed">
                &ldquo;{entry.intelligentSuggestion}&rdquo;
              </blockquote>

              {onAskChatbot && (
                <button
                  onClick={() =>
                    onAskChatbot(
                      `Can you explain how ${entry.title} (${entry.citation}) applies to my lease agreement?`
                    )
                  }
                  className="w-full mt-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Ask Chatbot about this Precedent</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Matching Precedents Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try searching for common terms like &quot;deposit&quot;, &quot;forfeiture&quot;, &quot;notice&quot;, &quot;wear and tear&quot;, &quot;painting&quot;, or &quot;eviction&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
