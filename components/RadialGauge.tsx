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
  // Semi-circle gauge geometry
  const cx = 110;
  const cy = 105;
  const radius = 80;
  const strokeWidth = 13;
  const circumference = Math.PI * radius; // Half-circle arc
  const boundedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  // Pointer needle angle: 0 score is at 180° (left), 100 score is at 0° (right)
  const needleAngleDeg = 180 - (boundedScore / 100) * 180;
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLength = 46;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy - needleLength * Math.sin(needleRad);

  const getTheme = (s: number) => {
    if (s >= 75) {
      return {
        badgeText: "Model Tenancy Compliant",
        badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-950/30",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        color: "#10b981",
      };
    }
    if (s >= 45) {
      return {
        badgeText: "Moderate Deviation Detected",
        badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-amber-950/30",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        color: "#f59e0b",
      };
    }
    return {
      badgeText: "Predatory Draft Detected",
      badgeClass: "bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-rose-950/30",
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
      color: "#f43f5e",
    };
  };

  const theme = getTheme(boundedScore);

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-1">
      {/* Gauge SVG Container with generous headroom */}
      <div className="relative w-64 h-32 flex items-center justify-center">
        <svg
          viewBox="0 0 220 118"
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
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Colored Score Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#radialGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Precision Pointer Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#needleGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Pivot Pin Center */}
          <circle cx={cx} cy={cy} r="4.5" fill="#334155" stroke="#64748b" strokeWidth="1.5" />

          {/* Score Readout locked inside SVG in the upper arch */}
          <text
            x={cx}
            y="62"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="36"
            fontWeight="900"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            className="select-none"
            style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.15))" }}
          >
            {boundedScore}
            <tspan fontSize="12" fill="#94a3b8" fontWeight="500" dx="2" dy="-9">
              /100
            </tspan>
          </text>
        </svg>
      </div>

      {/* Pill Badge Spaced Below Arc with Zero Overlap */}
      {showBadge && (
        <div className="mt-3.5 flex justify-center">
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
        <div className="mt-2 text-center">
          <div className="text-xs font-bold text-slate-200">{title}</div>
          {subtitle && <div className="text-[10px] text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}
