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
  const radius = 78;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle arc
  const boundedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  // Calculate pointer needle angle (0 is at PI/180 deg = left, 100 is at 0 deg = right)
  const needleAngleDeg = 180 - (boundedScore / 100) * 180;
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLength = 58;
  const needleX = 100 + needleLength * Math.cos(needleRad);
  const needleY = 105 - needleLength * Math.sin(needleRad);

  const getTheme = (s: number) => {
    if (s >= 75) {
      return {
        badgeText: "Model Tenancy Compliant",
        badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
        color: "#10b981",
        glow: "rgba(16, 185, 129, 0.4)",
      };
    }
    if (s >= 45) {
      return {
        badgeText: "Moderate Deviation Detected",
        badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/40",
        icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
        color: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.4)",
      };
    }
    return {
      badgeText: "Predatory Draft Detected",
      badgeClass: "bg-rose-950/60 text-rose-300 border-rose-500/40",
      icon: <AlertCircle className="w-3 h-3 text-rose-400" />,
      color: "#f43f5e",
      glow: "rgba(244, 63, 94, 0.5)",
    };
  };

  const theme = getTheme(boundedScore);

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      {/* Semi-circle Gauge */}
      <div className="relative w-64 h-36 flex items-center justify-center">
        <svg
          viewBox="0 0 200 115"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 22 105 A 78 78 0 0 1 178 105"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Glowing Value Arc */}
          <path
            d="M 22 105 A 78 78 0 0 1 178 105"
            fill="none"
            stroke="url(#radialGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle Center Pivot Pin */}
          <circle cx="100" cy="105" r="4" fill="#94a3b8" />

          {/* Pointer Needle */}
          <line
            x1="100"
            y1="105"
            x2={needleX}
            y2={needleY}
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#needleGlow)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Score Value Display */}
        <div className="absolute bottom-1 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              {boundedScore}
            </span>
            <span className="text-xs text-slate-400 font-mono ml-0.5">/100</span>
          </div>

          {/* Badge under score */}
          {showBadge && (
            <div
              className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${theme.badgeClass}`}
            >
              {theme.icon}
              <span>{theme.badgeText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Optional title/subtitle */}
      {title && (
        <div className="mt-2 text-center">
          <div className="text-xs font-bold text-slate-200">{title}</div>
          {subtitle && <div className="text-[10px] text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}
