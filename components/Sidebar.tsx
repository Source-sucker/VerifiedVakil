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
  Zap,
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
  const navItems = [
    {
      id: "chatbot" as NavView,
      label: "Chatbot Guide & Suggestions",
      icon: <MessageSquare className="w-4 h-4" />,
      badge: "AI Assist",
    },
    {
      id: "inspector" as NavView,
      label: "Lease Review & Radar",
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: `${totalClauses} clauses`,
    },
    {
      id: "knowledge" as NavView,
      label: "IPL Precedents & Laws",
      icon: <BookOpen className="w-4 h-4" />,
      badge: "SC Bench",
    },
    {
      id: "upload" as NavView,
      label: "Upload & OCR Document",
      icon: <FileSearch className="w-4 h-4" />,
      badge: "Vision OCR",
    },
    {
      id: "compare" as NavView,
      label: "Baseline Compare",
      icon: <GitCompare className="w-4 h-4" />,
      badge: "MTA 2021",
    },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="w-64 shrink-0 glass-panel border-r border-slate-800/90 flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-42px)]"
    >
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Scale className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">
                VerifiedVakil
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Tenant Protection Portal
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
            Core Verticals
          </div>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-400 border border-slate-700/60"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Citation Lock
          </span>
          <span className="text-[10px] font-mono text-emerald-400">100% Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Deterministic code evaluates risk; Gemini explains facts only.
        </p>
      </div>
    </aside>
  );
}
