import { createClient } from "@/lib/supabase/client";
import type { UsageLog, RequestAction } from "./types";

export async function logUsage(
  action: RequestAction,
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  estimatedCostUsd: number,
  latencyMs: number,
  success: boolean,
  userId?: string,
  sessionId?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from("ai_usage_logs").insert({
    user_id: userId ?? null,
    session_id: sessionId ?? null,
    provider,
    model,
    request_type: action,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
    estimated_cost_usd: estimatedCostUsd,
    latency_ms: latencyMs,
    success,
    error_message: errorMessage ?? null,
  });
}

export type AdminUsageStats = {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  totalUsers: number;
  byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  byRequestType: Record<string, { requests: number; tokens: number; cost: number }>;
  byDay: { date: string; requests: number; tokens: number; cost: number }[];
  recentLogs: UsageLog[];
};

export async function getAdminUsageStats(): Promise<AdminUsageStats> {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("ai_usage_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!logs) {
    return {
      totalRequests: 0, totalTokens: 0, totalCost: 0, totalUsers: 0,
      byProvider: {}, byRequestType: {}, byDay: [], recentLogs: [],
    };
  }

  const rows = logs as Record<string, unknown>[];
  let totalTokens = 0;
  let totalCost = 0;
  const userIds = new Set<string>();
  const byProvider: Record<string, { requests: number; tokens: number; cost: number }> = {};
  const byRequestType: Record<string, { requests: number; tokens: number; cost: number }> = {};
  const byDayMap: Record<string, { requests: number; tokens: number; cost: number }> = {};

  for (const row of rows) {
    const tokens = (row.total_tokens as number) ?? 0;
    const cost = (row.estimated_cost_usd as number) ?? 0;
    const provider = (row.provider as string) ?? "unknown";
    const requestType = (row.request_type as string) ?? "unknown";
    const userId = row.user_id as string | null;
    const createdAt = (row.created_at as string) ?? new Date().toISOString();
    const date = createdAt.split("T")[0];

    totalTokens += tokens;
    totalCost += cost;
    if (userId) userIds.add(userId);

    if (!byProvider[provider]) byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
    byProvider[provider].requests++;
    byProvider[provider].tokens += tokens;
    byProvider[provider].cost += cost;

    if (!byRequestType[requestType]) byRequestType[requestType] = { requests: 0, tokens: 0, cost: 0 };
    byRequestType[requestType].requests++;
    byRequestType[requestType].tokens += tokens;
    byRequestType[requestType].cost += cost;

    if (!byDayMap[date]) byDayMap[date] = { requests: 0, tokens: 0, cost: 0 };
    byDayMap[date].requests++;
    byDayMap[date].tokens += tokens;
    byDayMap[date].cost += cost;
  }

  const byDay = Object.entries(byDayMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const recentLogs: UsageLog[] = rows.slice(0, 20).map((row) => ({
    id: row.id as string,
    userId: (row.user_id as string) ?? undefined,
    provider: (row.provider as string) ?? "unknown",
    model: (row.model as string) ?? "unknown",
    requestType: (row.request_type as RequestAction) ?? "chat",
    inputTokens: (row.input_tokens as number) ?? 0,
    outputTokens: (row.output_tokens as number) ?? 0,
    totalTokens: (row.total_tokens as number) ?? 0,
    estimatedCostUsd: (row.estimated_cost_usd as number) ?? 0,
    latencyMs: (row.latency_ms as number) ?? null,
    success: (row.success as boolean) ?? true,
    createdAt: (row.created_at as string) ?? "",
  }));

  return {
    totalRequests: rows.length,
    totalTokens,
    totalCost,
    totalUsers: userIds.size,
    byProvider,
    byRequestType,
    byDay,
    recentLogs,
  };
}
