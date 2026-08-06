import { createClient } from "@/lib/supabase/client";
import type { DbApiProvider, DbApiKey } from "@/lib/database-types";

export type ApiProviderInput = {
  provider_name: DbApiProvider["provider_name"];
  display_name: string;
  base_url?: string | null;
  is_default?: boolean;
  priority?: number;
  is_active?: boolean;
};

export type ApiKeyInput = {
  provider_id: string;
  key_name: string;
  secret_name: string;
  priority?: number;
  is_active?: boolean;
  daily_limit?: number | null;
};

export async function listProviders(): Promise<DbApiProvider[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("api_providers")
    .select("*")
    .order("priority", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DbApiProvider[];
}

export async function createProvider(input: ApiProviderInput): Promise<DbApiProvider> {
  const supabase = createClient();
  if (input.is_default) {
    await supabase.from("api_providers").update({ is_default: false }).eq("is_default", true);
  }
  const { data, error } = await supabase
    .from("api_providers")
    .insert({
      provider_name: input.provider_name,
      display_name: input.display_name,
      base_url: input.base_url ?? null,
      is_default: input.is_default ?? false,
      priority: input.priority ?? 0,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DbApiProvider;
}

export async function updateProvider(id: string, updates: Partial<ApiProviderInput>): Promise<boolean> {
  const supabase = createClient();
  if (updates.is_default === true) {
    await supabase.from("api_providers").update({ is_default: false }).neq("id", id);
  }
  const { error } = await supabase
    .from("api_providers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function deleteProvider(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("api_providers").delete().eq("id", id);
  return !error;
}

export async function setDefaultProvider(id: string): Promise<boolean> {
  const supabase = createClient();
  await supabase.from("api_providers").update({ is_default: false }).eq("is_default", true);
  const { error } = await supabase
    .from("api_providers")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function listKeys(providerId?: string): Promise<DbApiKey[]> {
  const supabase = createClient();
  let query = supabase.from("api_keys").select("*");
  if (providerId) query = query.eq("provider_id", providerId);
  const { data, error } = await query.order("priority", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DbApiKey[];
}

export async function createKey(input: ApiKeyInput): Promise<DbApiKey> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      provider_id: input.provider_id,
      key_name: input.key_name,
      secret_name: input.secret_name,
      priority: input.priority ?? 0,
      is_active: input.is_active ?? true,
      daily_limit: input.daily_limit ?? null,
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DbApiKey;
}

export async function updateKey(id: string, updates: Partial<ApiKeyInput>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function deleteKey(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  return !error;
}

export async function toggleKeyActive(id: string, isActive: boolean): Promise<boolean> {
  const supabase = createClient();
  const status = isActive ? "active" : "disabled";
  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: isActive, status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function getActiveProviderWithKey(): Promise<{ provider: DbApiProvider; key: DbApiKey } | null> {
  const providers = await listProviders();
  const activeProviders = providers.filter((p) => p.is_active);

  for (const provider of activeProviders.sort((a, b) => a.priority - b.priority)) {
    const keys = await listKeys(provider.id);
    const activeKey = keys
      .filter((k) => k.is_active && k.status === "active")
      .sort((a, b) => a.priority - b.priority)[0];
    if (activeKey) return { provider, key: activeKey };
  }

  return null;
}

export type ProviderTestResult = {
  success: boolean;
  message: string;
  latencyMs: number;
};

export async function testProviderConnection(providerId: string): Promise<ProviderTestResult> {
  const supabase = createClient();
  const { data: provider } = await supabase
    .from("api_providers")
    .select("*")
    .eq("id", providerId)
    .maybeSingle();
  if (!provider) return { success: false, message: "Provider not found", latencyMs: 0 };

  const keys = await listKeys(providerId);
  const activeKey = keys.find((k) => k.is_active);
  if (!activeKey) return { success: false, message: "No active API key for this provider", latencyMs: 0 };

  const start = Date.now();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/test-api-provider`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        provider_name: (provider as Record<string, unknown>).provider_name,
        secret_name: activeKey.secret_name,
      }),
    });

    const latencyMs = Date.now() - start;
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, message: (data as Record<string, string>).error ?? `HTTP ${response.status}`, latencyMs };
    }
    return { success: true, message: "Connection successful", latencyMs };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Unknown error", latencyMs: Date.now() - start };
  }
}
