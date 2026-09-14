"use client";

import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface RadialGaugeProps {
  score: number; // 0 to 100
  title?: string;
  subtitle?: string;
  showBadge?: boolean;
}

export default function RadialGauge({
  score,
  title,
  subtitle,
  showBadge = true,
}: RadialGaugeProps) {
  // Arc geometry: center at (120, 114), radius 84
  const radius = 84;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Arc length ~263.89
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  // Suffix offset from center (x=120) based on digit count to guarantee 0 collision & dead centering
  const numDigits = boundedScore.toString().length;
  const suffixOffset = numDigits === 1 ? 18 : numDigits === 3 ? 38 : 28;

  const getTheme = (s: number) => {
    if (s >= 75) {
      return {
        badgeText: "Model Tenancy Compliant",
        badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
        scoreColor: "#34d399",
        gradStart: "#10b981",
        gradEnd: "#34d399",
        glowColor: "rgba(52, 211, 153, 0.25)",
      };
    }
    if (s >= 45) {
      return {
        badgeText: "Moderate Deviation Detected",
        badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-amber-950/40",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        scoreColor: "#fbbf24",
        gradStart: "#f59e0b",
        gradEnd: "#fbbf24",
        glowColor: "rgba(251, 191, 36, 0.25)",
      };
    }
    return {
      badgeText: "Predatory Draft Detected",
      badgeClass: "bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-rose-950/40",
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
      scoreColor: "#fb7185",
      gradStart: "#f43f5e",
      gradEnd: "#fb7185",
      glowColor: "rgba(251, 113, 133, 0.25)",
    };
  };

  const theme = getTheme(boundedScore);

  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-1 select-none">
      {/* Gauge Arc Container */}
      <div className="relative w-64 h-36 flex items-center justify-center">
        <svg
          viewBox="0 0 240 135"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="gaugeActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.gradStart} />
              <stop offset="100%" stopColor={theme.gradEnd} />
            </linearGradient>

            <filter id="gaugeArcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="scoreTextGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={theme.glowColor} />
            </filter>
          </defs>

          {/* Inactive Track Arc */}
          <path
            d="M 36 114 A 84 84 0 0 1 204 114"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Value Progress Arc */}
          <path
            d="M 36 114 A 84 84 0 0 1 204 114"
            fill="none"
            stroke="url(#gaugeActiveGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeArcGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Instrument Ticks (180°, 135°, 90°, 45°, 0°) matching reference */}
          <line x1="22" y1="114" x2="30" y2="114" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="60.6" y1="54.6" x2="66.2" y2="60.2" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <line x1="120" y1="20" x2="120" y2="30" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="179.4" y1="54.6" x2="173.8" y2="60.2" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <line x1="210" y1="114" x2="218" y2="114" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

          {/* Numbers Group: Score is MATHEMATICALLY DEAD-CENTERED on x=120 */}
          <g transform="translate(120, 84)">
            {/* Hero Score: Anchor middle guarantees exact horizontal alignment on the center axis */}
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="alphabetic"
              fontSize="44"
              fontWeight="800"
              fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fill={theme.scoreColor}
              letterSpacing="-1px"
              filter="url(#scoreTextGlow)"
            >
              {boundedScore}
            </text>

            {/* Suffix /100: Anchored start, exactly sharing the alphabetic baseline with the hero number */}
            <text
              x={suffixOffset}
              y="0"
              textAnchor="start"
              dominantBaseline="alphabetic"
              fontSize="14"
              fontWeight="600"
              fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fill="#64748b"
            >
              /100
            </text>
          </g>

          {/* Center Instrument Pin Ring */}
          <circle cx="120" cy="114" r="5" fill="#0b0f19" stroke={theme.scoreColor} strokeWidth="2" />
          <circle cx="120" cy="114" r="1.5" fill={theme.scoreColor} />
        </svg>
      </div>

      {/* Pill Badge (Cleanly placed below the arch with dedicated breathing room) */}
      {showBadge && (
        <div className="mt-2.5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-md transition-all ${theme.badgeClass}`}
          >
            {theme.icon}
            <span>{theme.badgeText}</span>
          </div>
        </div>
      )}

      {/* Optional title / subtitle */}
      {title && (
        <div className="mt-3 text-center">
          <div className="text-xs font-bold text-slate-200">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}
