import { createClient } from "@/lib/supabase/client";
import type { Homework, HomeworkType, RAGContext, TeachingMode } from "./types";

export async function createHomework(
  userId: string,
  sessionId: string,
  courseId: string | null,
  lessonId: string | null,
  topic: string,
  ragContext: RAGContext,
  difficulty: TeachingMode,
  homeworkType: HomeworkType
): Promise<Homework | null> {
  const supabase = createClient();
  const { data: settings } = await supabase.from("ai_settings").select("*").limit(1).maybeSingle();
  const settingsRow = settings as Record<string, unknown> | null;

  const messages = [
    {
      role: "system" as const,
      content: `Generate homework of type: ${homeworkType}. Topic: ${topic}. Context: ${ragContext.combinedContext.slice(0, 1500)}. Difficulty: ${difficulty}. Return ONLY a JSON object. For MCQs: { "questions": [{ "question", "options" (4), "correctIndex", "explanation" }] }. For flashcards: { "cards": [{ "front", "back" }] }. For practice_questions: { "questions": [{ "question", "answer" }] }. For revision_notes: { "notes": "string" }. For case_study: { "title", "scenario", "questions" (array) }. For assignment: { "title", "description", "instructions", "deliverables" (array) }.`,
    },
    { role: "user" as const,
      content: `Create ${homeworkType} homework about ${topic}.`,
    },
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
        maxTokens: 2000,
        temperature: 0.6,
        action: "homework",
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.content as string;

    let parsedContent: Record<string, unknown> = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedContent = JSON.parse(jsonMatch[0]);
    } catch {}

    const titleMap: Record<HomeworkType, string> = {
      mcqs: `MCQs: ${topic}`,
      flashcards: `Flashcards: ${topic}`,
      practice_questions: `Practice Questions: ${topic}`,
      revision_notes: `Revision Notes: ${topic}`,
      case_study: `Case Study: ${topic}`,
      assignment: `Assignment: ${topic}`,
    };

    const { data: inserted, error } = await supabase
      .from("ai_homework")
      .insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        session_id: sessionId,
        title: titleMap[homeworkType],
        homework_type: homeworkType,
        content: parsedContent,
        topic,
        difficulty,
      })
      .select("*")
      .maybeSingle();

    if (error || !inserted) return null;
    const row = inserted as Record<string, unknown>;
    return {
      id: row.id as string,
      userId,
      sessionId,
      courseId,
      lessonId,
      title: row.title as string,
      homeworkType,
      content: row.content as Record<string, unknown>,
      topic,
      difficulty,
      isCompleted: false,
      score: null,
      createdAt: row.created_at as string,
    };
  } catch {
    return null;
  }
}
