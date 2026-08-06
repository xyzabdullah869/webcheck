import { createClient } from "@/lib/supabase/client";
import type { AiSettings, VoiceSettings, PromptTemplate } from "./types";

const DEFAULT_SETTINGS: AiSettings = {
  id: "",
  provider: "openai",
  apiModel: "gpt-4o-mini",
  maxTokens: 2000,
  temperature: 0.7,
  defaultLanguage: "en",
  maxSessionTokens: 100000,
  systemPrompt: null,
  isEnabled: true,
  voiceEnabled: true,
  whiteboardEnabled: true,
  visualLearningEnabled: true,
};

const DEFAULT_VOICE: VoiceSettings = {
  id: "",
  defaultVoice: "female",
  tone: "friendly",
  speakingSpeed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  isEnabled: true,
};

export async function getAiSettings(): Promise<AiSettings> {
  const supabase = createClient();
  const { data } = await supabase.from("ai_settings").select("*").limit(1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    provider: (row.provider as AiSettings["provider"]) ?? "openai",
    apiModel: (row.api_model as string) ?? "gpt-4o-mini",
    maxTokens: (row.max_tokens as number) ?? 2000,
    temperature: (row.temperature as number) ?? 0.7,
    defaultLanguage: (row.default_language as AiSettings["defaultLanguage"]) ?? "en",
    maxSessionTokens: (row.max_session_tokens as number) ?? 100000,
    systemPrompt: (row.system_prompt as string) ?? null,
    isEnabled: (row.is_enabled as boolean) ?? true,
    voiceEnabled: (row.voice_enabled as boolean) ?? true,
    whiteboardEnabled: (row.whiteboard_enabled as boolean) ?? true,
    visualLearningEnabled: (row.visual_learning_enabled as boolean) ?? true,
  };
}

export async function updateAiSettings(settings: AiSettings): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("ai_settings").upsert({
    id: settings.id || undefined,
    provider: settings.provider,
    api_model: settings.apiModel,
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    default_language: settings.defaultLanguage,
    max_session_tokens: settings.maxSessionTokens,
    system_prompt: settings.systemPrompt,
    is_enabled: settings.isEnabled,
    voice_enabled: settings.voiceEnabled,
    whiteboard_enabled: settings.whiteboardEnabled,
    visual_learning_enabled: settings.visualLearningEnabled,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function getVoiceSettings(): Promise<VoiceSettings> {
  const supabase = createClient();
  const { data } = await supabase.from("ai_voice_settings").select("*").limit(1).maybeSingle();
  if (!data) return DEFAULT_VOICE;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    defaultVoice: (row.default_voice as VoiceSettings["defaultVoice"]) ?? "female",
    tone: (row.tone as VoiceSettings["tone"]) ?? "friendly",
    speakingSpeed: (row.speaking_speed as number) ?? 1.0,
    pitch: (row.pitch as number) ?? 1.0,
    volume: (row.volume as number) ?? 1.0,
    isEnabled: (row.is_enabled as boolean) ?? true,
  };
}

export async function updateVoiceSettings(settings: VoiceSettings): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("ai_voice_settings").upsert({
    id: settings.id || undefined,
    default_voice: settings.defaultVoice,
    tone: settings.tone,
    speaking_speed: settings.speakingSpeed,
    pitch: settings.pitch,
    volume: settings.volume,
    is_enabled: settings.isEnabled,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_prompt_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    templateKey: row.template_key as string,
    description: (row.description as string) ?? null,
    promptText: row.prompt_text as string,
    variables: (row.variables as string[]) ?? [],
    isActive: (row.is_active as boolean) ?? true,
  }));
}

export async function updatePromptTemplate(id: string, promptText: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ai_prompt_templates")
    .update({ prompt_text: promptText, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? "");
}
