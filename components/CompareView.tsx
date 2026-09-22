"use client";

import React, { useState, useMemo } from "react";
import {
  Check,
  X,
  Scale,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  MessageSquare,
  FileText,
  Copy,
  Printer,
  Download,
  Share2,
  ClipboardCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { printCounterOfferNotice, printInspectionProtocol } from "@/lib/printUtils";

interface ComparisonItem {
  feature: string;
  userValue: string;
  baselineValue: string;
  isFavorableToTenant: boolean;
  userRisk: string;
  statutoryStandard: string;
}

interface CompareViewProps {
  userSafetyScore: number;
  baselineSafetyScore: number;
  comparisons: ComparisonItem[];
  userRiskCounts: { high: number; moderate: number; standard: number };
  baselineRiskCounts: { high: number; moderate: number; standard: number };
}

export default function CompareView({
  userSafetyScore,
  baselineSafetyScore,
  comparisons,
  userRiskCounts,
  baselineRiskCounts,
}: CompareViewProps) {
  const [showNegotiator, setShowNegotiator] = useState(false);
  const [activeTab, setActiveTab] = useState<"whatsapp" | "email" | "inspection">("whatsapp");
  const [tenantName, setTenantName] = useState("Tenant");
  const [landlordName, setLandlordName] = useState("Landlord / Owner");
  const [propertyAddress, setPropertyAddress] = useState("Rented Premises");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter unfair clauses for default negotiation points
  const unfairItems = useMemo(
    () => comparisons.filter((c) => !c.isFavorableToTenant),
    [comparisons]
  );

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() =>
    unfairItems.map((c) => c.feature)
  );

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate WhatsApp Message text
  const whatsappMessage = useMemo(() => {
    const included = comparisons.filter((c) => selectedFeatures.includes(c.feature));
    const points = included
      .map(
        (c, idx) =>
          `${idx + 1}. *${c.feature}*: Current draft states "${c.userValue}". We request standard alignment with the Model Tenancy Act / market norms (${c.baselineValue}).`
      )
      .join("\n\n");

    return `Dear ${landlordName},\n\nThank you for sharing the draft rental agreement for ${propertyAddress}. I am excited about moving in and look forward to being a responsible tenant.\n\nUpon reviewing the draft against standard residential tenancy norms (Model Tenancy Act benchmarks), I noticed a few terms that I would appreciate clarifying before signing:\n\n${points}\n\nCould we please adjust these points so the agreement is mutually balanced? I am happy to hop on a quick call or meet to finalize this.\n\nWarm regards,\n${tenantName}`;
  }, [landlordName, propertyAddress, tenantName, comparisons, selectedFeatures]);

  // Generate Formal Counter-Offer Letter text
  const emailLetter = useMemo(() => {
    const included = comparisons.filter((c) => selectedFeatures.includes(c.feature));
    const points = included
      .map(
        (c, idx) =>
          `Clause ${idx + 1}: ${c.feature}\n- Draft Clause: ${c.userValue}\n- Proposed Amendment: ${c.baselineValue}\n- Legal Benchmark / Basis: ${c.statutoryStandard}`
      )
      .join("\n\n");

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `Date: ${today}

To: ${landlordName}
Property: ${propertyAddress}
Subject: Formal Counter-Proposal & Proposed Amendments to Draft Tenancy Agreement

Dear ${landlordName},

I acknowledge receipt of the draft Tenancy Agreement for the premises referenced above. We appreciate the opportunity to lease the premises and wish to ensure a fair, legally balanced tenancy in accordance with prevailing Indian tenancy jurisprudence and the Model Tenancy Act (MTA) framework.

Prior to execution, we respectfully propose the following amendments to align the agreement with statutory guidelines:

${points}

STATUTORY REFERENCES:
1. Security Deposit: Under Section 11 of the Model Tenancy Act 2021, the security deposit for residential premises is capped at a maximum of two months' rent to ensure fair liquidity.
2. Landlord Entry & Privacy: Under Section 15 of the Model Tenancy Act 2021, a minimum of 24 hours prior written or electronic notice is required before inspection, during daytime hours (7:00 AM - 8:00 PM).
3. Fair Wear & Tear / Painting: Under Section 108(m) of the Transfer of Property Act 1882, the lessee is bound to keep the property in good condition, reasonable wear and tear excepted. Full painting deductions without proof of tenant negligence are non-standard.
4. Termination Notice: Under Section 106 of the Transfer of Property Act 1882, mutual 30 days written notice is standard for residential leases.

We request you to incorporate these balanced amendments into the final execution draft. Please let us know once the revised draft is ready for review and signing.

Yours sincerely,

${tenantName}
Prospective Tenant`;
  }, [landlordName, propertyAddress, tenantName, comparisons, selectedFeatures]);

  // Inspection Protocol items
  const [inspectionChecked, setInspectionChecked] = useState<Record<string, boolean>>({
    meter_readings: true,
    wall_photos: true,
    appliances: false,
    keys: false,
    deposit_receipt: true,
    drainage: false,
  });

  const toggleInspection = (key: string) => {
    setInspectionChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="compare-heading" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 id="compare-heading" className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            Compare with Fair Government Rules
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Side-by-side comparison: Your agreement versus the Model Tenancy Act (MTA) government baseline.
          </p>
        </div>

        <button
          onClick={() => setShowNegotiator(!showNegotiator)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
            showNegotiator
              ? "bg-indigo-600 text-white shadow-indigo-600/30"
              : "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:opacity-95 shadow-cyan-500/20"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          {showNegotiator ? "Hide Counter-Offer Suite" : "Draft Counter-Offer Notice"}
        </button>
      </div>

      {/* Safety Score Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Draft Card */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Uploaded Agreement
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                userSafetyScore >= 75
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : userSafetyScore >= 50
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              Safety Score: {userSafetyScore}/100
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {userRiskCounts.high} High Risks
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {userRiskCounts.moderate} Moderate
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {userRiskCounts.standard} Standard
            </span>
          </div>
        </div>

        {/* MTA Baseline Card */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Model Tenancy Act Baseline
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Safety Score: {baselineSafetyScore}/100
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              0 High Risks (Fully Statutorily Compliant)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Landlord Negotiation & Counter-Offer Suite */}
      {showNegotiator && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/90 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                  Actionable Next Step
                </span>
                <h3 className="text-base font-bold text-white">
                  Landlord Negotiation & Counter-Offer Suite
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Politely negotiate unfair terms using statutory benchmarks without burning bridges.
              </p>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("whatsapp")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "whatsapp"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp Text
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "email"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Formal Counter-Proposal
              </button>
              <button
                onClick={() => setActiveTab("inspection")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "inspection"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Move-In Protocol
              </button>
            </div>
          </div>

          {/* Quick Customization Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Your Name (Tenant)</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Landlord / Broker Name</label>
              <input
                type="text"
                value={landlordName}
                onChange={(e) => setLandlordName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Mr. Verma"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Premises Description</label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Flat 402, Indiranagar"
              />
            </div>
          </div>

          {/* Clause Selection Pills */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Select Terms to Include in Counter-Offer ({selectedFeatures.length} of {comparisons.length} selected):
            </div>
            <div className="flex flex-wrap gap-2">
              {comparisons.map((c) => {
                const isSelected = selectedFeatures.includes(c.feature);
                return (
                  <button
                    key={c.feature}
                    onClick={() => toggleFeature(c.feature)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.isFavorableToTenant ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    {c.feature}
                    {isSelected ? <Check className="w-3 h-3 text-indigo-400" /> : <X className="w-3 h-3 text-slate-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: WhatsApp Message Preview */}
          {activeTab === "whatsapp" && (
            <div className="space-y-4">
              <div className="bg-[#0b141a] p-4 rounded-2xl border border-emerald-900/40 relative">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-950/80 text-[11px] text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    WhatsApp Live Preview (Respectful Indian Rental Etiquette)
                  </span>
                  <span className="text-slate-400">Ready to Send</span>
                </div>

                <div className="max-w-xl bg-[#005c4b] text-slate-100 p-4 rounded-2xl rounded-tl-sm text-xs leading-relaxed whitespace-pre-wrap shadow-lg">
                  {whatsappMessage}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  💡 Tip: Landlords and brokers respond best to polite requests framed around standard market benchmarks.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(whatsappMessage, "whatsapp")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    {copiedKey === "whatsapp" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy WhatsApp Text
                      </>
                    )}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open WhatsApp Web
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Formal Email Counter-Offer Letter */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                {emailLetter}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  Includes citations to Model Tenancy Act 2021 & Transfer of Property Act 1882.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(emailLetter, "email")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    {copiedKey === "email" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                        Copied Letter!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Letter Text
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadFile(emailLetter, `counter-offer-${tenantName.toLowerCase().replace(/\s+/g, "-")}.txt`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .txt
                  </button>
                  <button
                    onClick={() => {
                      printCounterOfferNotice({
                        tenantName,
                        landlordName,
                        propertyAddress,
                        noticeText: emailLetter,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Move-In Condition Record & Inspection Checklist */}
          {activeTab === "inspection" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300 block mb-0.5">
                    Pre-Occupancy Evidence Ledger (Deposit Protection)
                  </strong>
                  Most deposit disputes occur because existing damage is blamed on the tenant at move-out. Complete this checklist on the day of handover and get it countersigned.
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: "meter_readings",
                    title: "Record Initial Utility Meter Readings",
                    desc: "Photograph electricity (BESCOM/TNEB/BSES) and piped gas/water meters on day 1 with date timestamp.",
                    statutory: "MTA 2021 Section 12 (Utilities to be charged at actuals)",
                  },
                  {
                    key: "wall_photos",
                    title: "Comprehensive Wall & Ceiling Photolog",
                    desc: "Take high-res photos and video of all existing nail holes, dampness, wall cracks, and paint marks before moving furniture in.",
                    statutory: "TPA 1882 Section 108(m) (Tenant immune from normal wear & tear)",
                  },
                  {
                    key: "appliances",
                    title: "Electrical & Plumbing Functional Test",
                    desc: "Check all geysers, AC compressors, exhaust fans, taps, and sanitary fittings for leaks or malfunctions within 48 hours.",
                    statutory: "MTA 2021 Schedule II (Structural repairs are landlord duty)",
                  },
                  {
                    key: "keys",
                    title: "Key Handover & Access Inventory",
                    desc: "Document count of main door keys, bedroom keys, society RFID cards, and parking stickers received.",
                    statutory: "Evidence of exclusive peaceful possession",
                  },
                  {
                    key: "deposit_receipt",
                    title: "Security Deposit Bank Transfer & Formal Receipt",
                    desc: "Ensure deposit is paid via traceable NEFT/RTGS with explicit description 'Security Deposit for [Premises]'.",
                    statutory: "MTA 2021 Section 11 (Refund mandatory within 30 days of vacation)",
                  },
                  {
                    key: "drainage",
                    title: "Bathroom Seepage & Slope Inspection",
                    desc: "Inspect shower drains and balcony water slopes to ensure water does not accumulate and cause floor damage.",
                    statutory: "Prevents false deductions for water staining",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => toggleInspection(item.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      inspectionChecked[item.key]
                        ? "bg-cyan-950/20 border-cyan-500/40 text-white"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {inspectionChecked[item.key] ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-100">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-1">
                          ⚖️ {item.statutory}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {Object.values(inspectionChecked).filter(Boolean).length} of 6 steps completed
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      printInspectionProtocol({
                        tenantName,
                        landlordName,
                        propertyAddress,
                        checkedItems: inspectionChecked,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / PDF Checklist
                  </button>
                  <button
                    onClick={() => {
                      const content = `# VerifiedVakil — Move-in Evidence & Inspection Protocol
Property: ${propertyAddress}
Tenant: ${tenantName}
Landlord: ${landlordName}
Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}

## Checklist Status:
${Object.entries(inspectionChecked)
  .map(([k, v]) => `- [${v ? "X" : " "}] ${k.replace(/_/g, " ").toUpperCase()}`)
  .join("\n")}

### Statutory Note:
In accordance with Model Tenancy Act 2021 and Transfer of Property Act 1882, this condition record establishes the baseline condition of the premises upon handover. Both parties confirm pre-existing conditions are documented.

Tenant Signature: _______________________
Landlord Signature: _____________________`;
                      downloadFile(content, `move-in-inspection-${tenantName.toLowerCase().replace(/\s+/g, "-")}.md`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Inspection Protocol (.md)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Grid Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Key Term Disparities & Statutory Benchmarks
          </h3>
          <span className="text-xs text-slate-400">
            {unfairItems.length} Unfair {unfairItems.length === 1 ? "Disparity" : "Disparities"} Detected
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {comparisons.map((item, idx) => (
            <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-900/40 transition-colors">
              {/* Feature Title */}
              <div className="md:col-span-3">
                <div className="font-semibold text-sm text-slate-100">{item.feature}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.statutoryStandard}</div>
              </div>

              {/* User Value */}
              <div className="md:col-span-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">Your Draft:</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium text-slate-200">{item.userValue}</span>
                  {item.isFavorableToTenant ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      <Check className="w-3 h-3" /> Fair
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                      <AlertCircle className="w-3 h-3" /> Unfair
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex md:col-span-1 justify-center text-slate-600">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Baseline Benchmark */}
              <div className="md:col-span-4 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                <div className="text-[11px] text-emerald-400 uppercase tracking-wide font-semibold">MTA Fair Standard:</div>
                <div className="text-sm font-medium text-emerald-200 mt-1">{item.baselineValue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

