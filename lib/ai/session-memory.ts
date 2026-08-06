import { createClient } from "@/lib/supabase/client";
import type { SessionMemory } from "./types";

const DEFAULT_MEMORY: SessionMemory = {
  questionsAsked: [],
  weakTopics: [],
  strongTopics: [],
  learningSpeed: "normal",
  quizPerformance: { correct: 0, incorrect: 0, topics: {} },
  interactionCount: 0,
  confusionLevel: 0,
  lastTopic: null,
};

export async function getOrCreateSessionMemory(
  userId: string,
  sessionId: string,
  courseId?: string | null
): Promise<SessionMemory & { dbId: string }> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("ai_session_memory")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    const row = existing as Record<string, unknown>;
    return {
      dbId: row.id as string,
      questionsAsked: (row.questions_asked as string[]) ?? [],
      weakTopics: (row.weak_topics as string[]) ?? [],
      strongTopics: (row.strong_topics as string[]) ?? [],
      learningSpeed: (row.learning_speed as "slow" | "normal" | "fast") ?? "normal",
      quizPerformance: (row.quiz_performance as SessionMemory["quizPerformance"]) ?? DEFAULT_MEMORY.quizPerformance,
      interactionCount: (row.interaction_count as number) ?? 0,
      confusionLevel: (row.confusion_level as number) ?? 0,
      lastTopic: (row.last_topic as string) ?? null,
    };
  }

  const { data: inserted } = await supabase
    .from("ai_session_memory")
    .insert({
      user_id: userId,
      session_id: sessionId,
      course_id: courseId ?? null,
      ...DEFAULT_MEMORY,
    })
    .select("*")
    .maybeSingle();

  return { dbId: (inserted as { id: string })?.id ?? "", ...DEFAULT_MEMORY };
}

export async function updateSessionMemory(
  memoryId: string,
  updates: Partial<SessionMemory>
): Promise<void> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.questionsAsked !== undefined) dbUpdates.questions_asked = updates.questionsAsked;
  if (updates.weakTopics !== undefined) dbUpdates.weak_topics = updates.weakTopics;
  if (updates.strongTopics !== undefined) dbUpdates.strong_topics = updates.strongTopics;
  if (updates.learningSpeed !== undefined) dbUpdates.learning_speed = updates.learningSpeed;
  if (updates.quizPerformance !== undefined) dbUpdates.quiz_performance = updates.quizPerformance;
  if (updates.interactionCount !== undefined) dbUpdates.interaction_count = updates.interactionCount;
  if (updates.confusionLevel !== undefined) dbUpdates.confusion_level = updates.confusionLevel;
  if (updates.lastTopic !== undefined) dbUpdates.last_topic = updates.lastTopic;

  await supabase.from("ai_session_memory").update(dbUpdates).eq("id", memoryId);
}

export function recordQuestion<T extends SessionMemory & { dbId: string }>(memory: T, question: string): T {
  return {
    ...memory,
    questionsAsked: [...memory.questionsAsked, question].slice(-50),
    interactionCount: memory.interactionCount + 1,
  };
}

export function recordQuizResult<T extends SessionMemory & { dbId: string }>(
  memory: T,
  topic: string,
  isCorrect: boolean
): T {
  const topics = { ...memory.quizPerformance.topics };
  if (!topics[topic]) topics[topic] = { correct: 0, incorrect: 0 };
  topics[topic][isCorrect ? "correct" : "incorrect"]++;

  const correct = memory.quizPerformance.correct + (isCorrect ? 1 : 0);
  const incorrect = memory.quizPerformance.incorrect + (isCorrect ? 0 : 1);

  const weakTopics = new Set(memory.weakTopics);
  const strongTopics = new Set(memory.strongTopics);

  if (topics[topic].incorrect >= 2 && topics[topic].incorrect > topics[topic].correct) {
    weakTopics.add(topic);
    strongTopics.delete(topic);
  } else if (topics[topic].correct >= 2 && topics[topic].correct > topics[topic].incorrect) {
    strongTopics.add(topic);
    weakTopics.delete(topic);
  }

  const confusionLevel = Math.min(1, incorrect / Math.max(1, correct + incorrect));

  return {
    ...memory,
    quizPerformance: { correct, incorrect, topics },
    weakTopics: Array.from(weakTopics),
    strongTopics: Array.from(strongTopics),
    confusionLevel,
  };
}

export function shouldAdaptTeaching(memory: SessionMemory): boolean {
  return memory.confusionLevel > 0.4 || (memory.weakTopics.length >= 2 && memory.interactionCount > 5);
}

export function getAdaptedTeachingMode(currentMode: string, memory: SessionMemory): string {
  if (memory.confusionLevel > 0.6) return "beginner";
  if (memory.confusionLevel > 0.4 && currentMode === "advanced") return "intermediate";
  return currentMode;
}
