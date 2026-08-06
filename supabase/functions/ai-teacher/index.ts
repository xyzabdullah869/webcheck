import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  "gpt-3.5-turbo": { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 },
  "claude-3-haiku-20240307": { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
  "claude-3-sonnet-20240229": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "llama-3.3-70b-versatile": { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 },
};

const PROVIDER_API_KEYS: Record<string, string> = {
  openai: Deno.env.get("OPENAI_API_KEY") ?? "",
  anthropic: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
  groq: Deno.env.get("GROQ_API_KEY") ?? "",
};

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  groq: "https://api.groq.com/openai/v1/chat/completions",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, provider, model, maxTokens, temperature, action, sessionId, userId } = body as {
      messages: ChatMessage[];
      provider: string;
      model: string;
      maxTokens?: number;
      temperature?: number;
      action: string;
      sessionId?: string;
      userId?: string;
    };

    const apiKey = PROVIDER_API_KEYS[provider];
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `AI provider "${provider}" is not configured. Please set the API key as an edge function secret.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let content = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const endpoint = PROVIDER_ENDPOINTS[provider];

    if (provider === "anthropic") {
      const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
      const userMsgs = messages.filter((m) => m.role !== "system");
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens ?? 2000,
          temperature: temperature ?? 0.7,
          system: systemMsg,
          messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return new Response(
          JSON.stringify({ error: `Anthropic API error: ${errText}` }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await resp.json();
      content = (data.content ?? []).map((c: { text: string }) => c.text).join("");
      inputTokens = data.usage?.input_tokens ?? 0;
      outputTokens = data.usage?.output_tokens ?? 0;
    } else {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens ?? 2000,
          temperature: temperature ?? 0.7,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return new Response(
          JSON.stringify({ error: `${provider} API error: ${errText}` }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await resp.json();
      content = data.choices?.[0]?.message?.content ?? "";
      inputTokens = data.usage?.prompt_tokens ?? 0;
      outputTokens = data.usage?.completion_tokens ?? 0;
    }

    const totalTokens = inputTokens + outputTokens;
    const pricing = PRICING[model] ?? { input: 0.000001, output: 0.000001 };
    const estimatedCostUsd = inputTokens * pricing.input + outputTokens * pricing.output;

    // Log usage to database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (supabaseUrl && serviceRoleKey) {
        await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            user_id: userId ?? null,
            session_id: sessionId ?? null,
            provider,
            model,
            request_type: action,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: totalTokens,
            estimated_cost_usd: estimatedCostUsd,
            success: true,
          }),
        });
      }
    } catch {}

    return new Response(
      JSON.stringify({ content, inputTokens, outputTokens, totalTokens, estimatedCostUsd }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
