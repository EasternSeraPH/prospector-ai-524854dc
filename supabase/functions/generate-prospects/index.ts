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
    const targetCount = Math.min(Math.max(body.targetCount ?? 10, 1), 25);
    const conditions = (body.conditions ?? []).filter(Boolean);

    const systemPrompt = `You are an elite B2B sales intelligence analyst. You generate realistic, high-quality, internally consistent mock prospect data for sales prospecting demos.

Rules:
- Every field must be realistic and plausible (no "Lorem ipsum", no "example.com" emails — use believable domains).
- Companies must REALLY fit the sector "${sector}" and location "${location}".
- Honor every custom condition strictly.
- Tier classification: A = perfect fit (fit_score 80-100), B = strong fit (60-79), C = weaker fit (40-59).
- Distribute tiers realistically: ~30% A, ~45% B, ~25% C.
- fit_reasoning: 1-2 sentences explaining WHY this prospect got that tier based on the criteria.
- recommended_outreach: a concrete 2-3 sentence opening message tailored to this prospect.
- Use diverse, non-repetitive company names, contacts, and details.
- All arrays should have 2-5 items.`;

    const userPrompt = `Generate exactly ${targetCount} prospects matching:
- Sector: ${sector}
- Location: ${location}
- Custom conditions: ${conditions.length ? conditions.join(", ") : "none"}

Return them via the return_prospects tool. Include ALL fields in the schema for every prospect — be thorough and creative.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `AI gateway error (${aiRes.status})` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in AI response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "AI did not return structured prospects." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: { prospects: any[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args:", e);
      return new Response(
        JSON.stringify({ error: "AI returned malformed JSON." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prospects = parsed.prospects ?? [];
    const summary = {
      total: prospects.length,
      tierA: prospects.filter((p) => p.tier === "A").length,
      tierB: prospects.filter((p) => p.tier === "B").length,
      tierC: prospects.filter((p) => p.tier === "C").length,
      avgFitScore:
        prospects.length > 0
          ? Math.round(
              prospects.reduce((acc, p) => acc + (p.fit_score ?? 0), 0) /
                prospects.length,
            )
          : 0,
      sector,
      location,
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
