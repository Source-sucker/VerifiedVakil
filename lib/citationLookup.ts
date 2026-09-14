import citationData from "./citationTable.json";
import precedentsData from "./iplPrecedentsTable.json";

export interface VerifiedCitation {
  clause_type: string;
  law: string;
  section_ref: string;
  plain_explanation: string;
  jurisdiction_scope: string;
  source_url: string;
  last_verified: string;
}

export interface VerifiedPrecedent {
  id: string;
  clause_type: string;
  case_title: string;
  court: string;
  citation: string;
  year: number;
  statute_ref: string;
  key_principle: string;
  tenant_benefit: string;
  discussion_phrase: string;
  source_url: string;
}

export function lookupCitation(clauseType: string): VerifiedCitation | null {
  if (!clauseType) return null;
  const match = citationData.entries.find(
    (entry) => entry.clause_type.toLowerCase() === clauseType.toLowerCase()
  );
  return match || null;
}

export function lookupPrecedent(clauseType: string): VerifiedPrecedent | null {
  if (!clauseType) return null;
  const match = precedentsData.precedents.find(
    (p) => p.clause_type.toLowerCase() === clauseType.toLowerCase()
  );
  return match || null;
}

export function getAllVerifiedCitations(): VerifiedCitation[] {
  return citationData.entries;
}

export function getAllVerifiedPrecedents(): VerifiedPrecedent[] {
  return precedentsData.precedents;
}
