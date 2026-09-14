import citationData from "./citationTable.json";

export interface VerifiedCitation {
  clause_type: string;
  law: string;
  section_ref: string;
  plain_explanation: string;
  jurisdiction_scope: string;
  source_url: string;
  last_verified: string;
}

export function lookupCitation(clauseType: string): VerifiedCitation | null {
  if (!clauseType) return null;
  const match = citationData.entries.find(
    (entry) => entry.clause_type.toLowerCase() === clauseType.toLowerCase()
  );
  return match || null;
}

export function getAllVerifiedCitations(): VerifiedCitation[] {
  return citationData.entries;
}
