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
  /** Raw user-typed brief / conversation excerpt for full context. */
  userBrief?: string;
}

// ~14 essential, high-quality fields per prospect.
const PROSPECT_SCHEMA = {
  type: "object",
  properties: {
    prospects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          industry: { type: "string" },
          description: { type: "string", description: "1-2 sentences about what the company does" },
          headquarters_city: { type: "string" },
          headquarters_country: { type: "string" },
          website: { type: "string" },
          employee_count: { type: "integer" },
          annual_revenue_usd: { type: "integer", description: "Estimated yearly revenue in USD" },
          contact_name: { type: "string", description: "Realistic decision-maker full name" },
          contact_role: { type: "string" },
          contact_email: { type: "string", description: "Believable corporate email" },
          tier: { type: "string", enum: ["A", "B", "C"] },
          fit_score: { type: "integer", description: "0-100" },
          fit_reasoning: { type: "string", description: "1-2 sentences referencing the user's criteria" },
          recommended_outreach: { type: "string", description: "2-3 sentence personalized opening" },
        },
        required: [
          "company_name",
          "industry",
          "description",
          "headquarters_city",
          "headquarters_country",
          "website",
          "employee_count",
          "contact_name",
          "contact_role",
          "contact_email",
          "tier",
          "fit_score",
          "fit_reasoning",
          "recommended_outreach",
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
    const userBrief = (body.userBrief ?? "").trim().slice(0, 4000);

    // Split into parallel chunks. Smaller chunks = faster per call + less truncation risk.
    const CHUNK_SIZE = 5;
    const chunks: number[] = [];
    let remaining = targetCount;
    while (remaining > 0) {
      const c = Math.min(CHUNK_SIZE, remaining);
      chunks.push(c);
      remaining -= c;
    }

    const systemPrompt = `You are an elite B2B sales intelligence analyst. You generate realistic, high-quality, internally consistent prospect data that DIRECTLY answers the user's specific request.

═══ THE USER'S ACTUAL REQUEST (verbatim, in their own words) ═══
${userBrief || "(no free-text brief provided — rely only on the structured criteria below)"}
═══════════════════════════════════════════════════════════════

═══ STRUCTURED CRITERIA ═══
- Sector: ${sector}
- Location: ${location}
- Target count: ${targetCount}
- Conditions: ${conditions.length ? conditions.join(" | ") : "(none)"}
═══════════════════════════

NON-NEGOTIABLE RULES:
1. Read the user's verbatim request above CAREFULLY. Every prospect you generate MUST directly satisfy what they actually asked for — not a generic interpretation.
2. If the user mentioned specific company sizes, technologies, business models, buyer personas, geographies, or any other constraint in their brief, EVERY prospect must match it.
3. Companies must genuinely fit sector "${sector}" AND be located in/serve "${location}". No off-topic companies.
4. Honor every condition strictly. If a condition conflicts with a generic match, the condition wins.
5. Realistic data only: real-sounding company names, believable corporate email domains (never "example.com" / "test.com"), real cities within "${location}".
6. Tier classification (apply consistently across the whole set):
   - A = perfect match for the user's request (fit_score 80-100)
   - B = strong match, minor gaps (fit_score 60-79)
   - C = acceptable but weaker match (fit_score 40-59)
   Target distribution: ~30% A, ~45% B, ~25% C.
7. fit_reasoning MUST explicitly cite WHICH part of the user's request this prospect satisfies (e.g. "Matches your ask for Series-B SaaS firms in Berlin with >100 engineers").
8. recommended_outreach: 2-3 sentences, personalized to the prospect AND tied to the user's stated goal.
9. No duplicate company names across the full set.`;

    const callChunk = async (count: number, chunkIdx: number, retry = false): Promise<any[]> => {
      const userPrompt = `Generate exactly ${count} unique prospects that satisfy the user's request above.

This is batch ${chunkIdx + 1} of ${chunks.length} — make these prospects distinct from the others.
Return via the return_prospects tool with ALL schema fields populated.`;

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
