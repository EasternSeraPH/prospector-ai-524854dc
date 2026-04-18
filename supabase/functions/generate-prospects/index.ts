// Edge function: generates a rich, classified list of mock prospects via Lovable AI.
// Returns JSON: { prospects: Prospect[], summary: { ... } }
// The client turns this into an .xlsx download.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  sector?: string;
  location?: string;
  targetCount?: number;
  conditions?: string[];
}

const PROSPECT_SCHEMA = {
  type: "object",
  properties: {
    prospects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          // Core company
          company_name: { type: "string" },
          legal_name: { type: "string" },
          industry: { type: "string" },
          sub_industry: { type: "string" },
          description: { type: "string" },
          founded_year: { type: "integer" },
          headquarters_city: { type: "string" },
          headquarters_country: { type: "string" },
          full_address: { type: "string" },
          website: { type: "string" },
          linkedin_url: { type: "string" },
          // Size & financials
          employee_count: { type: "integer" },
          employee_range: { type: "string" },
          annual_revenue_usd: { type: "integer" },
          revenue_range: { type: "string" },
          funding_stage: { type: "string" },
          total_funding_usd: { type: "integer" },
          last_funding_round: { type: "string" },
          // Tech & signals
          tech_stack: { type: "array", items: { type: "string" } },
          recent_news: { type: "string" },
          growth_signals: { type: "array", items: { type: "string" } },
          hiring_signals: { type: "string" },
          intent_signals: { type: "string" },
          competitors: { type: "array", items: { type: "string" } },
          // Decision maker
          contact_name: { type: "string" },
          contact_role: { type: "string" },
          contact_email: { type: "string" },
          contact_phone: { type: "string" },
          contact_linkedin: { type: "string" },
          decision_maker_persona: { type: "string" },
          // Sales context
          pain_points: { type: "array", items: { type: "string" } },
          budget_range: { type: "string" },
          sales_cycle_estimate: { type: "string" },
          preferred_channel: { type: "string" },
          recommended_outreach: { type: "string" },
          // Classification
          tier: { type: "string", enum: ["A", "B", "C"] },
          fit_score: { type: "integer" },
          fit_reasoning: { type: "string" },
          priority: { type: "string", enum: ["High", "Medium", "Low"] },
        },
        required: [
          "company_name",
          "industry",
          "headquarters_city",
          "employee_count",
          "contact_name",
          "contact_email",
          "tier",
          "fit_score",
          "fit_reasoning",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["prospects"],
  additionalProperties: false,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as RequestBody;
    const sector = body.sector?.trim() || "Technology";
    const location = body.location?.trim() || "Global";
    const targetCount = Math.min(Math.max(body.targetCount ?? 10, 1), 60);
    const conditions = (body.conditions ?? []).filter(Boolean);

    // Split into parallel chunks. Smaller chunks = faster per call + less truncation risk.
    const CHUNK_SIZE = 8;
    const chunks: number[] = [];
    let remaining = targetCount;
    while (remaining > 0) {
      const c = Math.min(CHUNK_SIZE, remaining);
      chunks.push(c);
      remaining -= c;
    }

    const systemPrompt = `You are an elite B2B sales intelligence analyst. You generate realistic, high-quality, internally consistent prospect data for sales prospecting.

STRICT RULES:
- Every company MUST genuinely fit the sector "${sector}" and location "${location}". No off-topic companies.
- Honor every custom condition strictly: ${conditions.length ? conditions.join(" | ") : "(none)"}.
- All data must be realistic and plausible (real-sounding company names, believable domains for emails — never "example.com", real cities within "${location}").
- Tier classification based on the user's criteria above:
  * A = perfect fit (fit_score 80-100)
  * B = strong fit (fit_score 60-79)
  * C = weaker but valid fit (fit_score 40-59)
- Distribute roughly ~30% A, ~45% B, ~25% C across the full set.
- fit_reasoning MUST explicitly reference the user's sector, location, and conditions.
- recommended_outreach: 2-3 sentence personalized opening.
- Arrays should have 2-5 items. No duplicates across companies.`;

    const callChunk = async (count: number, chunkIdx: number, retry = false): Promise<any[]> => {
      const userPrompt = `Generate exactly ${count} unique prospects for:
- Sector: ${sector}
- Location: ${location}
- Conditions: ${conditions.length ? conditions.join(", ") : "none"}

This is batch ${chunkIdx + 1} of ${chunks.length}. Make these prospects different from any others. Return via the return_prospects tool with ALL schema fields populated.`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_prospects",
                description: "Return the generated, classified prospect list.",
                parameters: PROSPECT_SCHEMA,
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_prospects" } },
        }),
      });

      if (res.status === 429 || res.status === 402) {
        throw new Error(
          res.status === 429
            ? "Rate limit exceeded. Please try again in a moment."
            : "AI credits exhausted. Add funds in Settings → Workspace → Usage.",
        );
      }

      if (!res.ok) {
        if (!retry) {
          console.warn(`Chunk ${chunkIdx} HTTP ${res.status}, retrying once`);
          return callChunk(count, chunkIdx, true);
        }
        console.error(`Chunk ${chunkIdx} failed permanently: HTTP ${res.status}`);
        return [];
      }

      const json = await res.json().catch(() => null);
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) {
        if (!retry) {
          console.warn(`Chunk ${chunkIdx} missing tool call, retrying`);
          return callChunk(count, chunkIdx, true);
        }
        console.error(`Chunk ${chunkIdx} no tool call after retry`);
        return [];
      }

      try {
        const parsed = JSON.parse(args);
        return Array.isArray(parsed.prospects) ? parsed.prospects : [];
      } catch (e) {
        console.error(`Chunk ${chunkIdx} parse error:`, e);
        return [];
      }
    };

    // Run all chunks in parallel.
    const results = await Promise.all(chunks.map((c, i) => callChunk(c, i)));
    const prospects = results.flat();

    if (prospects.length === 0) {
      return new Response(
        JSON.stringify({
          error: "AI failed to generate any prospects. Please try again with fewer prospects or different criteria.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const requestedTotal = targetCount;
    const summary = {
      total: prospects.length,
      requested: requestedTotal,
      tierA: prospects.filter((p: any) => p.tier === "A").length,
      tierB: prospects.filter((p: any) => p.tier === "B").length,
      tierC: prospects.filter((p: any) => p.tier === "C").length,
      avgFitScore:
        prospects.length > 0
          ? Math.round(
              prospects.reduce((acc: number, p: any) => acc + (p.fit_score ?? 0), 0) /
                prospects.length,
            )
          : 0,
      sector,
      location,
      conditions,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ prospects, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prospects error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
