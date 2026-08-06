'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbAiChatHistory, DbAiSettings } from '@/lib/database-types';
import { generateAiResponse, detectTopics, type AiContext, type CourseInfo } from '@/lib/ai-knowledge';
import { getWebsiteSettings, type WebsiteSettings } from '@/lib/services/site-settings-service';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  topics?: string[];
  created_at?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  created_at: string;
};

export type AiSettings = {
  is_enabled: boolean;
  model_name: string;
  system_prompt: string;
  max_tokens: number;
  temperature: number;
};

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getAiSettings(): Promise<AiSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_settings')
    .select('is_enabled, model_name, system_prompt, max_tokens, temperature')
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as AiSettings;
}

export async function saveChatMessage(
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  topics?: string[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('ai_chat_history').insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    topics: topics ?? [],
  });
  if (error) {
    console.error('Failed to save chat message:', error.message);
  }
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_chat_history')
    .select('id, session_id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) return [];

  const sessionsMap = new Map<string, ChatSession>();
  for (const msg of data as DbAiChatHistory[]) {
    if (!sessionsMap.has(msg.session_id)) {
      const firstUserMsg = (data as DbAiChatHistory[]).find(
        (m) => m.session_id === msg.session_id && m.role === 'user'
      );
      sessionsMap.set(msg.session_id, {
        id: msg.session_id,
        title: firstUserMsg?.content.slice(0, 60) ?? 'New Chat',
        messageCount: 0,
        lastMessage: msg.content,
        created_at: msg.created_at,
      });
    }
    const session = sessionsMap.get(msg.session_id)!;
    session.messageCount++;
  }

  return Array.from(sessionsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getSessionMessages(
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_chat_history')
    .select('id, role, content, topics, created_at')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as DbAiChatHistory[]).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    topics: m.topics,
    created_at: m.created_at,
  }));
}

export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('ai_chat_history')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId);
  if (error) {
    console.error('Failed to delete chat session:', error.message);
  }
}

export async function clearAllChats(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('ai_chat_history')
    .delete()
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to clear chats:', error.message);
  }
}

export async function searchChats(userId: string, query: string): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_chat_history')
    .select('id, session_id, role, content, created_at')
    .eq('user_id', userId)
    .or(`content.ilike.%${query}%,topics.cs.{${query}}`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const sessionsMap = new Map<string, ChatSession>();
  for (const msg of data as DbAiChatHistory[]) {
    if (!sessionsMap.has(msg.session_id)) {
      const firstUserMsg = (data as DbAiChatHistory[]).find(
        (m) => m.session_id === msg.session_id && m.role === 'user'
      );
      sessionsMap.set(msg.session_id, {
        id: msg.session_id,
        title: firstUserMsg?.content.slice(0, 60) ?? 'New Chat',
        messageCount: 0,
        lastMessage: msg.content,
        created_at: msg.created_at,
      });
    }
    sessionsMap.get(msg.session_id)!.messageCount++;
  }

  return Array.from(sessionsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function fetchAiContext(): Promise<AiContext> {
  const supabase = createClient();

  const [settingsResult, coursesResult, categoriesResult] = await Promise.all([
    getWebsiteSettings(),
    supabase
      .from('courses')
      .select('id, title, slug, short_description, level, price, duration, students_count, rating, tags')
      .eq('status', 'Published')
      .order('students_count', { ascending: false })
      .limit(20),
    supabase
      .from('categories')
      .select('id, name, slug, description')
      .order('name', { ascending: true }),
  ]);

  const courses: CourseInfo[] = (coursesResult.data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    title: c.title as string,
    slug: c.slug as string,
    short_description: (c.short_description as string) ?? null,
    level: (c.level as string) ?? 'Beginner',
    price: (c.price as number) ?? null,
    duration: (c.duration as string) ?? null,
    instructor_name: null,
    category_name: null,
    students_count: (c.students_count as number) ?? 0,
    rating: (c.rating as number) ?? 0,
    tags: (c.tags as string[]) ?? [],
  }));

  const categories = (categoriesResult.data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    description: (c.description as string) ?? null,
  }));

  return {
    settings: settingsResult as WebsiteSettings | null,
    courses,
    categories,
  };
}

export async function getAiResponse(userMessage: string): Promise<string> {
  const topics = detectTopics(userMessage);
  const settings = await getAiSettings();

  if (settings && !settings.is_enabled) {
    return 'The AI Assistant is currently disabled by the administrator. Please try again later.';
  }

  const context = await fetchAiContext();
  return generateAiResponse(userMessage, context);
}
