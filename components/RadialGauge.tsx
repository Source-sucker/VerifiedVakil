"use client";

import React from "react";

interface RadialGaugeProps {
  score: number; // 0 to 100
  title?: string;
  subtitle?: string;
}

export default function RadialGauge({
  score,
  title = "Property Safety Index",
  subtitle = "Residential Tenancy Protection",
}: RadialGaugeProps) {
  // Semi-circle gauge settings
  const radius = 85;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // half circle arc length
  const boundedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  // Determine color theme based on score
  const getScoreTheme = (s: number) => {
    if (s >= 75) {
      return {
        label: "Secure & Fair",
        colorText: "text-emerald-400",
        glow: "rgba(52, 211, 153, 0.4)",
        gradientStart: "#10b981",
        gradientEnd: "#06b6d4",
      };
    }
    if (s >= 45) {
      return {
        label: "Needs Review",
        colorText: "text-amber-400",
        glow: "rgba(251, 191, 36, 0.4)",
        gradientStart: "#f59e0b",
        gradientEnd: "#fbbf24",
      };
    }
    return {
      label: "Predatory / High Risk",
      colorText: "text-rose-400",
      glow: "rgba(244, 63, 94, 0.4)",
      gradientStart: "#f43f5e",
      gradientEnd: "#e11d48",
    };
  };

  const theme = getScoreTheme(boundedScore);

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* SVG Arc Speedometer */}
      <div className="relative w-56 h-32 flex items-center justify-center">
        <svg
          viewBox="0 0 200 115"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 15 105 A 85 85 0 0 1 185 105"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          <path
            d="M 15 105 A 85 85 0 0 1 185 105"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Ticks on perimeter */}
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const x = 100 + 72 * Math.cos(angle);
            const y = 105 - 72 * Math.sin(angle);
            return (
              <text
                key={tick}
                x={x}
                y={y}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {tick}
              </text>
            );
          })}
        </svg>

        {/* Center Score Readout */}
        <div className="absolute bottom-2 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-black tracking-tight text-white font-mono">
              {boundedScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/100</span>
          </div>
          <span
            className={`text-[11px] font-bold tracking-wider uppercase mt-0.5 ${theme.colorText}`}
          >
            {theme.label}
          </span>
        </div>
      </div>

      {/* Metadata Labels */}
      <div className="mt-3 text-center">
        <div className="text-xs font-semibold text-slate-200">{title}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}
