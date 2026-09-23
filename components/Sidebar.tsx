"use client";

import React from "react";
import {
  Scale,
  LayoutDashboard,
  FileSearch,
  GitCompare,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  Upload,
  Sparkles,
} from "lucide-react";

export type NavView = "chatbot" | "inspector" | "upload" | "compare" | "knowledge";

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  safetyScore?: number;
  totalClauses?: number;
}

export default function Sidebar({
  activeView,
  onSelectView,
  safetyScore = 100,
  totalClauses = 0,
}: SidebarProps) {
  const clauseBadgeText = `${totalClauses}`;

  const navItems = [
    {
      id: "chatbot" as NavView,
      label: "AI Legal Assistant",
      sublabel: "Ask anything",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "inspector" as NavView,
      label: "Clause Inspector",
      sublabel: `${totalClauses} clauses`,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "knowledge" as NavView,
      label: "Tenant Rights",
      sublabel: "Supreme Court",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "upload" as NavView,
      label: "Upload Document",
      sublabel: "Scan / Text",
      icon: <FileSearch className="w-4 h-4" />,
    },
    {
      id: "compare" as NavView,
      label: "Compare vs Law",
      sublabel: "Govt. baseline",
      icon: <GitCompare className="w-4 h-4" />,
    },
  ];

  const scoreColor = safetyScore >= 75 ? "#34d399" : safetyScore >= 50 ? "#fbbf24" : "#f87171";
  const scoreLabel = safetyScore >= 75 ? "Safe" : safetyScore >= 50 ? "Risky" : "Predatory";
  const scoreBg = safetyScore >= 75 ? "rgba(6,78,59,0.4)" : safetyScore >= 50 ? "rgba(120,53,15,0.4)" : "rgba(127,29,29,0.4)";
  const scoreBorder = safetyScore >= 75 ? "rgba(52,211,153,0.25)" : safetyScore >= 50 ? "rgba(245,158,11,0.25)" : "rgba(248,113,113,0.25)";

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="w-60 shrink-0 flex-col justify-between hidden md:flex min-h-screen"
      style={{
        background: "rgba(6,9,20,0.85)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Brand Header */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                boxShadow: "0 0 20px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.15) inset",
              }}
            >
              <Scale className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight" style={{ color: "#e2e8f0" }}>
                VerifiedVakil
              </div>
              <div className="text-[10px] font-medium" style={{ color: "#475569" }}>
                Tenancy Law AI
              </div>
            </div>
          </div>

          {/* Safety Score Bar (when analysis is loaded) */}
          {totalClauses > 0 && (
            <div
              className="mt-4 p-2.5 rounded-xl"
              style={{
                background: scoreBg,
                border: `1px solid ${scoreBorder}`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: "#94a3b8" }}>
                  Contract Safety
                </span>
                <span className="text-[10px] font-bold" style={{ color: scoreColor }}>
                  {scoreLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${safetyScore}%`,
                      background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
                      boxShadow: `0 0 8px ${scoreColor}60`,
                    }}
                  />
                </div>
                <span className="text-xs font-black tabular-nums" style={{ color: scoreColor }}>
                  {safetyScore}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Main Navigation">
          <div className="label-section px-2 pb-2 pt-1">Features</div>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? "nav-item-active" : "nav-item"}`}
              >
                <span
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: isActive
                      ? "rgba(99,102,241,0.25)"
                      : "rgba(255,255,255,0.04)",
                    color: isActive ? "#a5b4fc" : "#475569",
                  }}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold leading-tight ${isActive ? "text-indigo-300" : "text-slate-400"}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] leading-tight" style={{ color: "#334155" }}>
                    {item.sublabel}
                  </div>
                </div>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "#6366f1", boxShadow: "0 0 6px #6366f1" }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div
        className="mx-3 mb-4 p-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="status-dot-live" />
          <span className="text-[11px] font-semibold" style={{ color: "#94a3b8" }}>
            Citation Engine Active
          </span>
        </div>
        <p className="text-[10px] leading-snug" style={{ color: "#334155" }}>
          Grounded in MTA 2021, TPA 1882, ICA 1872 — zero hallucination.
        </p>
        <div
          className="mt-2 pt-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span className="text-[10px] font-medium" style={{ color: "#475569" }}>
            Model Tenancy Act
          </span>
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22d3ee",
            }}
          >
            2021
          </span>
        </div>
      </div>
    </aside>
  );
}
