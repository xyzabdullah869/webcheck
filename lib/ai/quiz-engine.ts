import { createClient } from "@/lib/supabase/client";
import type { QuizQuestion, RAGContext, TeachingMode } from "./types";

export async function createQuiz(
  topic: string,
  ragContext: RAGContext,
  difficulty: TeachingMode,
  numQuestions: number = 3
): Promise<QuizQuestion[]> {
  const supabase = createClient();
  const { data: settings } = await supabase.from("ai_settings").select("*").limit(1).maybeSingle();
  const settingsRow = settings as Record<string, unknown> | null;

  const messages = [
    {
      role: "system" as const,
      content: `Generate ${numQuestions} quiz questions about: ${topic}. Context: ${ragContext.combinedContext.slice(0, 1500)}. Difficulty: ${difficulty}. Return ONLY a JSON array. Each question object must have: "question" (string), "options" (array of 4 strings), "correctIndex" (0-3), "explanation" (string), "topic" (string).`,
    },
    { role: "user" as const, content: `Create ${numQuestions} quiz questions about ${topic}.` },
  ];

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-teacher`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        provider: settingsRow?.provider ?? "openai",
        model: settingsRow?.api_model ?? "gpt-4o-mini",
        maxTokens: 1500,
        temperature: 0.5,
        action: "quiz",
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const content = data.content as string;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Omit<QuizQuestion, "id">[];
    return parsed.map((q, i) => ({
      ...q,
      id: `quiz_q_${Date.now()}_${i}`,
    }));
  } catch {
    return [];
  }
}
