import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { provider_name, secret_name } = await req.json() as {
      provider_name: string;
      secret_name: string;
    };

    const apiKey = Deno.env.get(secret_name);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: `Secret "${secret_name}" is not configured` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint = "";
    let headers: Record<string, string> = {};
    let body: Record<string, unknown> = {};

    switch (provider_name) {
      case "openai":
      case "groq":
      case "openrouter":
        endpoint = provider_name === "openai"
          ? "https://api.openai.com/v1/models"
          : provider_name === "groq"
            ? "https://api.groq.com/openai/v1/models"
            : "https://openrouter.ai/api/v1/models";
        headers = { Authorization: `Bearer ${apiKey}` };
        break;
      case "claude":
        endpoint = "https://api.anthropic.com/v1/models";
        headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown provider: ${provider_name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const resp = await fetch(endpoint, { method: "GET", headers });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "Unknown error");
      return new Response(
        JSON.stringify({ success: false, error: `${provider_name} API returned ${resp.status}: ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: `${provider_name} connection successful` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
