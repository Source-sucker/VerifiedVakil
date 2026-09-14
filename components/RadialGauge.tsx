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
  // Semi-circle gauge dimensions
  const radius = 86;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle arc length (~270.18)
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  // Calculate pointer needle angle (0 score = 180° / left; 100 score = 0° / right)
  const angleDeg = 180 - (boundedScore / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLength = 70;
  const needleX = 120 + needleLength * Math.cos(angleRad);
  const needleY = 122 - needleLength * Math.sin(angleRad);

  const getTheme = (s: number) => {
    if (s >= 75) {
      return {
        badgeText: "Model Tenancy Compliant",
        badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
        scoreColor: "text-emerald-400",
      };
    }
    if (s >= 45) {
      return {
        badgeText: "Moderate Deviation Detected",
        badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-amber-950/40",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        scoreColor: "text-amber-400",
      };
    }
    return {
      badgeText: "Predatory Draft Detected",
      badgeClass: "bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-rose-950/40",
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
      scoreColor: "text-rose-400",
    };
  };

  const theme = getTheme(boundedScore);

  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
      {/* Gauge Arc & Needle Container */}
      <div className="relative w-64 h-36 flex items-center justify-center">
        <svg
          viewBox="0 0 240 135"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="radialGradientGauge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="gaugeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 34 122 A 86 86 0 0 1 206 122"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d="M 34 122 A 86 86 0 0 1 206 122"
            fill="none"
            stroke="url(#radialGradientGauge)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlowFilter)"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle Center Pivot Pin */}
          <circle cx="120" cy="122" r="3.5" fill="#64748b" />

          {/* Pointer Needle */}
          <line
            x1="120"
            y1="122"
            x2={needleX}
            y2={needleY}
            stroke="#cbd5e1"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Score Readout (Comfortably positioned inside the dome) */}
        <div className="absolute top-[42px] left-0 right-0 flex items-baseline justify-center select-none pointer-events-none">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_16px_rgba(255,255,255,0.25)]">
            {boundedScore}
          </span>
          <span className="text-sm font-mono text-slate-400 ml-1">/100</span>
        </div>
      </div>

      {/* Pill Badge (Cleanly placed below the arc with dedicated breathing room) */}
      {showBadge && (
        <div className="mt-3.5">
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
