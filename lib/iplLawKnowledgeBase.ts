/**
 * VerifiedVakil — Condensed Indian Property Law (IPL) & Landmark Case Law Knowledge Base
 * 
 * High-density statutory framework and landmark Supreme Court of India precedents
 * curated for intelligent tenant suggestions and citation-locked negotiation.
 */

export interface LawEntry {
  id: string;
  category: "deposit_penalty" | "eviction_possession" | "privacy_entry" | "term_registration" | "maintenance_utilities";
  categoryLabel: string;
  title: string;
  courtOrAuthority: string;
  citation: string;
  year: number | string;
  statuteReference: string;
  condensedRule: string;
  tenantProtection: string;
  intelligentSuggestion: string;
  primarySourceUrl: string;
}

export const CONDENSED_IPL_LAW_BANK: LawEntry[] = [
  // 1. SECURITY DEPOSIT & FORFEITURE PENALTIES
  {
    id: "kailash-nath-2015",
    category: "deposit_penalty",
    categoryLabel: "Security Deposits & Penalties",
    title: "Kailash Nath Associates v. Delhi Development Authority",
    courtOrAuthority: "Supreme Court of India",
    citation: "(2015) 4 SCC 136",
    year: 2015,
    statuteReference: "Indian Contract Act, 1872 — Section 74",
    condensedRule: "Earnest money / security deposit cannot be forfeited arbitrarily upon contract termination. Damages under Section 74 are payable only to the extent of actual proven financial loss. Unilateral forfeiture without proving loss is an illegal penalty.",
    tenantProtection: "Landlords cannot pocket full security deposits when a tenant vacates early if the property is re-let or no actual financial loss occurred.",
    intelligentSuggestion: "Cite the Supreme Court precedent Kailash Nath Associates v. Delhi Development Authority, (2015) 4 SCC 136 to your landlord: 'Under Section 74 of the Indian Contract Act, deposit deductions are legally restricted to actual documented losses, not punitive forfeitures.'",
    primarySourceUrl: "https://indiankanoon.org/doc/171221379/",
  },
  {
    id: "fateh-chand-1964",
    category: "deposit_penalty",
    categoryLabel: "Security Deposits & Penalties",
    title: "Fateh Chand v. Balkishan Dass",
    courtOrAuthority: "Supreme Court of India (5-Judge Constitution Bench)",
    citation: "(1964) 1 SCR 515 / AIR 1963 SC 1405",
    year: 1964,
    statuteReference: "Indian Contract Act, 1872 — Section 74",
    condensedRule: "Indian law abolishes the English distinction between liquidated damages and penalties. Courts will not enforce penalty clauses even if the contract states the deposit 'shall stand forfeited'. Compensation is strictly capped at genuine reasonable loss.",
    tenantProtection: "Nullifies agreement terms claiming 100% deposit forfeiture or multiple months' rent penalty for departure during lock-in periods.",
    intelligentSuggestion: "Propose: 'In accordance with the Constitution Bench in Fateh Chand v. Balkishan Dass, (1964) 1 SCR 515 / AIR 1963 SC 1405, let us limit any early exit penalty to actual re-listing costs rather than blanket deposit forfeiture.'",
    primarySourceUrl: "https://indiankanoon.org/doc/737703/",
  },
  {
    id: "mta-sec-11-deposit",
    category: "deposit_penalty",
    categoryLabel: "Security Deposits & Penalties",
    title: "Model Tenancy Act, 2021 — Section 11 (Deposit Cap)",
    courtOrAuthority: "Parliament of India / Ministry of Housing & Urban Affairs",
    citation: "Section 11, Model Tenancy Act, 2021",
    year: 2021,
    statuteReference: "Model Tenancy Act, 2021 — Section 11(1)",
    condensedRule: "Security deposit for residential premises shall not exceed two months' rent. Deposit must be refunded to the tenant upon handing over vacant possession, after deducting only genuine agreed dues.",
    tenantProtection: "Directly combats predatory demands in Bangalore/Mumbai of 6 to 10 months' rent upfront as security deposit.",
    intelligentSuggestion: "Negotiate deposit down: 'Section 11 of the Model Tenancy Act caps residential deposits at 2 months' rent. Can we align our agreement closer to this national benchmark?'",
    primarySourceUrl: "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
  },

  // 2. EVICTION & PROTECTION OF SETTLED POSSESSION
  {
    id: "bishandas-1961",
    category: "eviction_possession",
    categoryLabel: "Eviction & Possession",
    title: "Bishandas & Ors. v. State of Punjab & Ors.",
    courtOrAuthority: "Supreme Court of India (5-Judge Constitution Bench)",
    citation: "(1961) 2 SCR 189 / AIR 1961 SC 1570",
    year: 1961,
    statuteReference: "Constitution of India — Article 21 & Specific Relief Act, 1963 — Section 6",
    condensedRule: "No person in peaceful possession of immovable property can be evicted by force or extra-judicial action without due process of law, even after expiry of the license or lease term.",
    tenantProtection: "Strictly bars landlords from locking out tenants, throwing out belongings, or intimidating tenants into vacating without a court decree.",
    intelligentSuggestion: "Remind landlord: 'Under the Constitution Bench ruling in Bishandas & Ors. v. State of Punjab, AIR 1961 SC 1570 / (1961) 2 SCR 189, physical possession cannot be disturbed without due process of law. Any dispute must be settled through agreed formal notice.'",
    primarySourceUrl: "https://indiankanoon.org/doc/121853/",
  },
  {
    id: "ramesh-chand-2003",
    category: "eviction_possession",
    categoryLabel: "Eviction & Possession",
    title: "Ramesh Chand Ardawatiya v. Anil Panjwani",
    courtOrAuthority: "Supreme Court of India",
    citation: "(2003) 7 SCC 350",
    year: 2003,
    statuteReference: "Specific Relief Act, 1963 — Section 6 & TPA, 1882 — Section 108(c)",
    condensedRule: "A person in settled possession has an enforceable legal right to defend their possession against the whole world, including the true owner. Landlords cannot take law into their own hands.",
    tenantProtection: "Guarantees quiet enjoyment and protects tenants from sudden self-help evictions or threats of summary dispossession.",
    intelligentSuggestion: "Discussion point: 'Our right to quiet enjoyment and peaceful possession is protected by the Supreme Court in Ramesh Chand Ardawatiya v. Anil Panjwani, (2003) 7 SCC 350; all entries and exits must follow written notice.'",
    primarySourceUrl: "https://indiankanoon.org/doc/1062635/",
  },
  {
    id: "lallu-yeshwant-1968",
    category: "eviction_possession",
    categoryLabel: "Eviction & Possession",
    title: "Lallu Yeshwant Singh v. Rao Jagdish Singh",
    courtOrAuthority: "Supreme Court of India",
    citation: "(1968) 2 SCR 203 / AIR 1968 SC 620",
    year: 1968,
    statuteReference: "Specific Relief Act, 1963 — Section 6",
    condensedRule: "Even if a tenant's right of occupation has terminated, the landlord has no right to take forcible possession. Landlords who forcefully enter commit trespass and are liable under civil and criminal law.",
    tenantProtection: "Protects overstaying or disputed tenants from physical intimidation, lock changing, or illegal eviction tactics.",
    intelligentSuggestion: "Clarify exit terms: 'Per the Supreme Court in Lallu Yeshwant Singh v. Rao Jagdish Singh, AIR 1968 SC 620 / (1968) 2 SCR 203, eviction must follow due legal process; let us establish a fair 30-day handover grace period in the clause.'",
    primarySourceUrl: "https://indiankanoon.org/doc/1886866/",
  },

  // 3. PRIVACY & LANDLORD ENTRY RIGHTS
  {
    id: "mta-sec-15-entry",
    category: "privacy_entry",
    categoryLabel: "Privacy & Landlord Entry",
    title: "Model Tenancy Act, 2021 — Section 15(1) (Prior Notice for Entry)",
    courtOrAuthority: "Parliament of India",
    citation: "Section 15(1), Model Tenancy Act, 2021",
    year: 2021,
    statuteReference: "Model Tenancy Act, 2021 — Section 15(1)",
    condensedRule: "Landlords or property managers must provide at least 24 hours' prior written notice (electronic or physical) before entering premises. Entry is permitted only between 7:00 AM and 8:00 PM for legitimate inspection or repair.",
    tenantProtection: "Renders unconditional 'entry at any time without notice' clauses void and protects tenant privacy and peaceful living.",
    intelligentSuggestion: "Request amendment: 'Please update Clause X to require 24 hours' prior notice between 7 AM and 8 PM for inspections, as mandated by Section 15 of the Model Tenancy Act, 2021.'",
    primarySourceUrl: "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
  },
  {
    id: "tpa-sec-108c-quiet",
    category: "privacy_entry",
    categoryLabel: "Privacy & Landlord Entry",
    title: "Transfer of Property Act, 1882 — Section 108(c) (Quiet Enjoyment)",
    courtOrAuthority: "Bare Act / India Code",
    citation: "Transfer of Property Act, 1882 — Section 108(c)",
    year: 1882,
    statuteReference: "TPA, 1882 — Section 108(c)",
    condensedRule: "The lessor is bound to ensure the lessee may hold the property during the lease term without interruption, provided the tenant pays rent and performs agreed conditions.",
    tenantProtection: "Prevents frequent, unannounced inspections, landlord micro-management, and intrusive interference with household privacy.",
    intelligentSuggestion: "Insist: 'Section 108(c) of Transfer of Property Act, 1882 guarantees uninterrupted quiet enjoyment; inspections should be scheduled with mutual convenience rather than open-ended entry.'",
    primarySourceUrl: "https://www.indiacode.nic.in/handle/123456789/2338",
  },

  // 4. LEASE DURATION, 11-MONTH CUSTOM & REGISTRATION
  {
    id: "associated-hotels-1960",
    category: "term_registration",
    categoryLabel: "Term, Custom & Registration",
    title: "Associated Hotels of India Ltd. v. R.N. Kapoor",
    courtOrAuthority: "Supreme Court of India",
    citation: "(1960) 1 SCR 368 / AIR 1959 SC 1262",
    year: 1960,
    statuteReference: "TPA 1882 § 105 vs Indian Easements Act 1882 § 52",
    condensedRule: "The golden test distinguishing a lease from a license is exclusive possession. If an agreement gives exclusive possession of a residential premises against all others, it creates a tenancy, regardless of whether the agreement is drafted as 'Leave and License'.",
    tenantProtection: "Prevents landlords from using artificial 'Licensee' terminology to deprive tenants of statutory protections when exclusive possession was handed over.",
    intelligentSuggestion: "Clarify status: 'As held by the Supreme Court in Associated Hotels of India Ltd. v. R.N. Kapoor, (1960) 1 SCR 368, operational exclusive possession governs our tenancy rights; let us ensure termination and notice rights are reciprocal.'",
    primarySourceUrl: "https://indiankanoon.org/doc/1831818/",
  },
  {
    id: "cm-beena-2004",
    category: "term_registration",
    categoryLabel: "Term, Custom & Registration",
    title: "C.M. Beena & Anr. v. P.N. Ramachandra Rao",
    courtOrAuthority: "Supreme Court of India",
    citation: "(2004) 3 SCC 595",
    year: 2004,
    statuteReference: "Transfer of Property Act, 1882 — Section 105",
    condensedRule: "Courts look past clever contract labels to examine the true intention and conduct of the parties. Where the occupant holds exclusive physical control, it is a lease in law.",
    tenantProtection: "Protects residential occupants from one-sided eviction clauses disguised under the rubric of revocable licenses.",
    intelligentSuggestion: "Suggest: 'Per the Supreme Court ruling in C.M. Beena & Anr. v. P.N. Ramachandra Rao, (2004) 3 SCC 595, contract labels cannot bypass standard statutory fairness. Notice periods must apply symmetrically to both parties.'",
    primarySourceUrl: "https://indiankanoon.org/doc/1350616/",
  },
  {
    id: "anthony-2000",
    category: "term_registration",
    categoryLabel: "Term, Custom & Registration",
    title: "Anthony v. K.C. Ittoop & Sons & Ors.",
    courtOrAuthority: "Supreme Court of India (Division Bench)",
    citation: "(2000) 6 SCC 394 / AIR 2000 SC 2647",
    year: 2000,
    statuteReference: "Registration Act, 1908 § 17/49 & Transfer of Property Act, 1882 § 106",
    condensedRule: "Unregistered lease agreements exceeding 11 months cannot create a long-term lease under Section 107 of TPA and Section 49 of the Registration Act, but acceptance of rent creates a valid month-to-month tenancy terminable by 15 days' notice under Section 106 of the Transfer of Property Act, 1882. This precedent forms the legal bedrock for 11-month residential agreements in India.",
    tenantProtection: "Validates 11-month unregistered agreements as legally binding month-to-month tenancies with statutory notice protections.",
    intelligentSuggestion: "Clarify term: 'Under the Supreme Court ruling in Anthony v. K.C. Ittoop & Sons & Ors., (2000) 6 SCC 394, 11-month tenancies operate under Transfer of Property Act Section 106 monthly notice standards. Let us stipulate an explicit 30-day notice period for both sides.'",
    primarySourceUrl: "https://indiankanoon.org/doc/1359345/",
  },

  // 5. MAINTENANCE, WEAR & TEAR, AND ESSENTIAL UTILITIES
  {
    id: "tpa-sec-108m-wear-tear",
    category: "maintenance_utilities",
    categoryLabel: "Maintenance, Wear & Utilities",
    title: "Transfer of Property Act, 1882 — Section 108(m) (Wear & Tear Exemption)",
    courtOrAuthority: "Statutory Law / Bare Act",
    citation: "Transfer of Property Act, 1882 — Section 108(m)",
    year: 1882,
    statuteReference: "TPA, 1882 — Section 108(m)",
    condensedRule: "The tenant is bound to restore the property in as good a condition as received, 'reasonable wear and tear and damage by act of God excepted'. Landlords cannot deduct full painting or routine weathering from security deposits.",
    tenantProtection: "Shields tenants against automatic deductions of 1 month's rent for painting or normal wall scuffing after an 11-month stay.",
    intelligentSuggestion: "Refuse arbitrary painting cuts: 'Section 108(m) of TPA explicitly exempts reasonable wear and tear. Painting deductions require proof of damage beyond ordinary occupancy.'",
    primarySourceUrl: "https://www.indiacode.nic.in/handle/123456789/2338",
  },
  {
    id: "mta-sec-20-utilities",
    category: "maintenance_utilities",
    categoryLabel: "Maintenance, Wear & Utilities",
    title: "Model Tenancy Act, 2021 — Section 20 (Essential Services Protection)",
    courtOrAuthority: "Parliament of India",
    citation: "Section 20, Model Tenancy Act, 2021",
    year: 2021,
    statuteReference: "Model Tenancy Act, 2021 — Section 20",
    condensedRule: "No landlord shall, directly or indirectly, cut off, withhold, or disconnect essential supply or service (water, electricity, elevator, sanitation) enjoyed by the tenant in the premises, even in the event of rent arrears or dispute.",
    tenantProtection: "Makes it illegal for landlords to disconnect power, water, or lift access to intimidate tenants or enforce rent collection.",
    intelligentSuggestion: "State clearly: 'Under Section 20 of the Model Tenancy Act, cutting off water or electricity during disputes is strictly prohibited by law.'",
    primarySourceUrl: "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
  },
  {
    id: "mta-sec-15-repairs",
    category: "maintenance_utilities",
    categoryLabel: "Maintenance, Wear & Utilities",
    title: "Model Tenancy Act, 2021 — Schedule II (Division of Repairs)",
    courtOrAuthority: "Ministry of Housing & Urban Affairs",
    citation: "Section 15(2) & Second Schedule, Model Tenancy Act, 2021",
    year: 2021,
    statuteReference: "Model Tenancy Act, 2021 — Schedule II",
    condensedRule: "Structural repairs, major seepage, external wall painting, and plumbing line replacements are the exclusive responsibility of the landlord. Tenants are responsible only for internal day-to-day fixtures (fuses, tap washers, bulb replacements).",
    tenantProtection: "Invalidates clauses forcing tenants to pay for external wall waterproofing, terrace seepage, or structural repairs.",
    intelligentSuggestion: "Propose balanced division: 'Per Schedule II of the Model Tenancy Act, major structural repairs and seepage are the landlord's duty, while internal minor maintenance is the tenant's.'",
    primarySourceUrl: "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
  },
];

/**
 * Intelligent helper to find legal suggestions and matching citations for any clause type
 */
export function getIntelligentSuggestionForClause(clauseType: string, extractedDetails?: Record<string, any>): {
  lawEntry: LawEntry | null;
  suggestionScript: string;
  keyRule: string;
} {
  const norm = clauseType.toLowerCase();

  let matched: LawEntry | null = null;
  if (norm.includes("deposit") || norm.includes("forfeiture") || norm.includes("lock_in")) {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "kailash-nath-2015") || null;
  } else if (norm.includes("painting") || norm.includes("repair") || norm.includes("wear")) {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "tpa-sec-108m-wear-tear") || null;
  } else if (norm.includes("entry") || norm.includes("inspection")) {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "mta-sec-15-entry") || null;
  } else if (norm.includes("notice") || norm.includes("termination")) {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "anthony-2000") || null;
  } else if (norm.includes("utility") || norm.includes("interest") || norm.includes("delay")) {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "mta-sec-20-utilities") || null;
  } else if (norm.includes("eviction") || norm.includes("possession") || norm.includes("quiet")) {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "bishandas-1961") || null;
  } else {
    matched = CONDENSED_IPL_LAW_BANK.find((l) => l.id === "associated-hotels-1960") || null;
  }

  if (matched) {
    return {
      lawEntry: matched,
      suggestionScript: matched.intelligentSuggestion,
      keyRule: matched.condensedRule,
    };
  }

  return {
    lawEntry: null,
    suggestionScript: "Request mutual written reciprocity and check with a local tenant advocate.",
    keyRule: "General tenancy contract reciprocity under Indian Contract Act, 1872.",
  };
}

/**
 * Filter the law bank by search query or category
 */
export function searchLawBank(query: string, category?: string): LawEntry[] {
  const q = query.trim().toLowerCase();
  return CONDENSED_IPL_LAW_BANK.filter((entry) => {
    const matchesCategory = !category || category === "all" || entry.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;

    return (
      entry.title.toLowerCase().includes(q) ||
      entry.citation.toLowerCase().includes(q) ||
      entry.condensedRule.toLowerCase().includes(q) ||
      entry.tenantProtection.toLowerCase().includes(q) ||
      entry.statuteReference.toLowerCase().includes(q) ||
      entry.intelligentSuggestion.toLowerCase().includes(q)
    );
  });
}
