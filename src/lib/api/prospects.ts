import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import type { ProspectingCriteria } from "@/types";

export interface Prospect {
  company_name: string;
  industry: string;
  description: string;
  headquarters_city: string;
  headquarters_country: string;
  website: string;
  employee_count: number;
  annual_revenue_usd?: number;
  contact_name: string;
  contact_role: string;
  contact_email: string;
  tier: "A" | "B" | "C";
  fit_score: number;
  fit_reasoning: string;
  recommended_outreach: string;
}

export interface GenerateProspectsResult {
  prospects: Prospect[];
  summary: {
    total: number;
    requested: number;
    tierA: number;
    tierB: number;
    tierC: number;
    avgFitScore: number;
    sector: string;
    location: string;
    conditions: string[];
    generatedAt: string;
  };
}

export async function generateProspects(
  criteria: ProspectingCriteria,
): Promise<GenerateProspectsResult> {
  const { data, error } = await supabase.functions.invoke("generate-prospects", {
    body: {
      sector: criteria.industry,
      location: criteria.geoArea,
      targetCount: criteria.targetCount,
      conditions: criteria.metrics,
    },
  });

  if (error) throw new Error(error.message ?? "Failed to generate prospects");
  if (data?.error) throw new Error(data.error);
  if (!data?.prospects) throw new Error("No prospects returned");
  return data as GenerateProspectsResult;
}

const FIELD_ORDER: Array<{ key: keyof Prospect; label: string }> = [
  { key: "tier", label: "Tier" },
  { key: "fit_score", label: "Fit Score" },
  { key: "priority", label: "Priority" },
  { key: "company_name", label: "Company" },
  { key: "legal_name", label: "Legal Name" },
  { key: "industry", label: "Industry" },
  { key: "sub_industry", label: "Sub-Industry" },
  { key: "description", label: "Description" },
  { key: "founded_year", label: "Founded" },
  { key: "headquarters_city", label: "City" },
  { key: "headquarters_country", label: "Country" },
  { key: "full_address", label: "Address" },
  { key: "website", label: "Website" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "employee_count", label: "Employees" },
  { key: "employee_range", label: "Employee Range" },
  { key: "annual_revenue_usd", label: "Revenue (USD)" },
  { key: "revenue_range", label: "Revenue Range" },
  { key: "funding_stage", label: "Funding Stage" },
  { key: "total_funding_usd", label: "Total Funding (USD)" },
  { key: "last_funding_round", label: "Last Round" },
  { key: "tech_stack", label: "Tech Stack" },
  { key: "competitors", label: "Competitors" },
  { key: "growth_signals", label: "Growth Signals" },
  { key: "hiring_signals", label: "Hiring Signals" },
  { key: "intent_signals", label: "Intent Signals" },
  { key: "recent_news", label: "Recent News" },
  { key: "contact_name", label: "Contact" },
  { key: "contact_role", label: "Role" },
  { key: "contact_email", label: "Email" },
  { key: "contact_phone", label: "Phone" },
  { key: "contact_linkedin", label: "Contact LinkedIn" },
  { key: "decision_maker_persona", label: "Persona" },
  { key: "pain_points", label: "Pain Points" },
  { key: "budget_range", label: "Budget" },
  { key: "sales_cycle_estimate", label: "Sales Cycle" },
  { key: "preferred_channel", label: "Channel" },
  { key: "recommended_outreach", label: "Recommended Outreach" },
  { key: "fit_reasoning", label: "Fit Reasoning" },
];

function normalize(value: unknown): string | number {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "number") return value;
  return String(value);
}

function rowsFor(prospects: Prospect[]) {
  return prospects.map((p) =>
    FIELD_ORDER.reduce<Record<string, string | number>>((acc, f) => {
      acc[f.label] = normalize(p[f.key]);
      return acc;
    }, {}),
  );
}

export function downloadProspectsXlsx(result: GenerateProspectsResult) {
  const wb = XLSX.utils.book_new();
  const headers = FIELD_ORDER.map((f) => f.label);

  // Summary sheet
  const { summary } = result;
  const summaryRows = [
    ["Prospecting Report", ""],
    ["Generated at", new Date(summary.generatedAt).toLocaleString()],
    ["Sector", summary.sector],
    ["Location", summary.location],
    ["Conditions", (summary.conditions ?? []).join(", ") || "—"],
    ["", ""],
    ["Requested", summary.requested],
    ["Delivered", summary.total],
    ["Average fit score", summary.avgFitScore],
    ["Tier A (hot)", summary.tierA],
    ["Tier B (warm)", summary.tierB],
    ["Tier C (cold)", summary.tierC],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 26 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // All prospects + per-tier sheets
  const sorted = [...result.prospects].sort(
    (a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0),
  );

  const buildSheet = (rows: Prospect[]) => {
    const sheet = XLSX.utils.json_to_sheet(rowsFor(rows), { header: headers });
    sheet["!cols"] = headers.map((h) => ({
      wch: Math.min(Math.max(h.length + 2, 14), 50),
    }));
    return sheet;
  };

  XLSX.utils.book_append_sheet(wb, buildSheet(sorted), "All Prospects");
  const tiers: Array<["A" | "B" | "C", string]> = [
    ["A", "Hot Leads (A)"],
    ["B", "Warm Leads (B)"],
    ["C", "Cold Leads (C)"],
  ];
  for (const [tier, name] of tiers) {
    const subset = sorted.filter((p) => p.tier === tier);
    if (subset.length > 0) {
      XLSX.utils.book_append_sheet(wb, buildSheet(subset), name);
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const safeSector = (summary.sector || "prospects").replace(/[^a-z0-9]+/gi, "_");
  XLSX.writeFile(wb, `prospects_${safeSector}_${stamp}.xlsx`);
}
