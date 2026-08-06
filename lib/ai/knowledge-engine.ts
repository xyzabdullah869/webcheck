import { createClient } from "@/lib/supabase/client";
import type { RAGContext, RAGChunk } from "./types";

export async function retrieveCourseContent(
  courseId: string,
  lessonId?: string,
  topic?: string
): Promise<RAGContext> {
  const supabase = createClient();
  const chunks: RAGChunk[] = [];

  const { data: course } = await supabase
    .from("courses")
    .select("title, short_description, description, level, language")
    .eq("id", courseId)
    .maybeSingle();

  if (course) {
    const c = course as Record<string, unknown>;
    chunks.push({
      id: `course_${courseId}`,
      source: c.title as string,
      sourceType: "lesson",
      content: [c.title, c.short_description, c.description].filter(Boolean).join("\n\n"),
    });
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, order_index")
    .eq("course_id", courseId)
    .order("order_index");

  if (modules) {
    for (const mod of modules as Record<string, unknown>[]) {
      const moduleId = mod.id as string;
      chunks.push({
        id: `module_${moduleId}`,
        source: mod.title as string,
        sourceType: "module",
        content: `${mod.title}\n${mod.description ?? ""}`,
      });

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, content, content_type, duration")
        .eq("module_id", moduleId)
        .order("order_index");

      if (lessons) {
        for (const lesson of lessons as Record<string, unknown>[]) {
          const lessonContent = `${lesson.title}\n${lesson.content ?? ""}`;
          chunks.push({
            id: `lesson_${lesson.id}`,
            source: lesson.title as string,
            sourceType: "lesson",
            content: lessonContent,
          });
        }
      }
    }
  }

  const { data: courseFiles } = await supabase
    .from("course_files")
    .select("id, file_name, file_type, extracted_text")
    .eq("course_id", courseId)
    .not("extracted_text", "is", null);

  if (courseFiles) {
    for (const file of courseFiles as Record<string, unknown>[]) {
      chunks.push({
        id: `file_${file.id}`,
        source: file.file_name as string,
        sourceType: "resource",
        content: (file.extracted_text as string) ?? "",
      });
    }
  }

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, description")
    .eq("course_id", courseId);

  if (quizzes) {
    for (const quiz of quizzes as Record<string, unknown>[]) {
      chunks.push({
        id: `quiz_${quiz.id}`,
        source: quiz.title as string,
        sourceType: "quiz",
        content: `${quiz.title}\n${quiz.description ?? ""}`,
      });
    }
  }

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, description, instructions")
    .eq("course_id", courseId);

  if (assignments) {
    for (const assignment of assignments as Record<string, unknown>[]) {
      chunks.push({
        id: `assignment_${assignment.id}`,
        source: assignment.title as string,
        sourceType: "assignment",
        content: `${assignment.title}\n${assignment.description ?? ""}\n${assignment.instructions ?? ""}`,
      });
    }
  }

  const scored = topic ? rankChunks(chunks, topic) : chunks;
  const topChunks = scored.slice(0, 10);
  const combinedContext = topChunks.map((c) => `[${c.sourceType}: ${c.source}]\n${c.content}`).join("\n\n---\n\n");
  const sources = [...new Set(topChunks.map((c) => c.source))];

  return { chunks: topChunks, combinedContext, sources };
}

function rankChunks(chunks: RAGChunk[], query: string): RAGChunk[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return chunks
    .map((chunk) => {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word)) score += 1;
        if (chunk.source.toLowerCase().includes(word)) score += 2;
      }
      return { ...chunk, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}
