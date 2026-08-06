'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbAiSettings } from '@/lib/database-types';

export type AiAdminSettings = {
  is_enabled: boolean;
  model_name: string;
  system_prompt: string;
  max_tokens: number;
  temperature: number;
};

export async function getAiAdminSettings(): Promise<AiAdminSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_settings')
    .select('is_enabled, model_name, system_prompt, max_tokens, temperature')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as AiAdminSettings;
}

export async function updateAiAdminSettings(settings: AiAdminSettings): Promise<boolean> {
  const supabase = createClient();
  const { data: existing } = await supabase.from('ai_settings').select('id').limit(1).maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('ai_settings')
      .update({
        is_enabled: settings.is_enabled,
        model_name: settings.model_name,
        system_prompt: settings.system_prompt,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (existing as DbAiSettings).id);
    return !error;
  } else {
    const { error } = await supabase.from('ai_settings').insert({
      is_enabled: settings.is_enabled,
      model_name: settings.model_name,
      system_prompt: settings.system_prompt,
      max_tokens: settings.max_tokens,
      temperature: settings.temperature,
    });
    return !error;
  }
}
