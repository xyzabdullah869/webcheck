import { createClient } from "@/lib/supabase/client";
import { getAiSettings, fillTemplate } from "./settings-service";
import type { ApiResponse, RequestAction, RAGContext, SupportedLanguage, TeachingMode } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function buildSystemPrompt(
  context: RAGContext,
  teachingMode: TeachingMode,
  language: SupportedLanguage
): string {
  const langName = { en: "English", ur: "Urdu", "roman-ur": "Roman Urdu", mixed: "a mix of Urdu and English" }[language];
  const modeName = teachingMode.replace(/_/g, " ");

  return `You are a professional AI teacher conducting a live classroom session.
You are teaching in ${langName} at a ${modeName} level.

CRITICAL RULES:
- Teach naturally like a human instructor. Do NOT just read text aloud.
- Explain concepts, give examples, use real-life scenarios, compare concepts.
- Ask questions to check understanding.
- If the student seems confused, simplify and repeat.
- Use the following course content as your primary knowledge base. If the answer is not in the course content, say so clearly rather than making things up.

COURSE CONTENT:
${context.combinedContext || "[No specific course content available for this topic.]"}

Respond in ${langName}. Be conversational, warm, and encouraging.`;
}

async function callEdgeFunction(
  messages: ChatMessage[],
  action: RequestAction,
  sessionId?: string,
  userId?: string
): Promise<ApiResponse> {
  const settings = await getAiSettings();
  if (!settings.isEnabled) {
    return {
      content: "The AI teacher system is currently disabled. Please contact the administrator.",
      inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, latencyMs: 0,
    };
  }

  const start = Date.now();
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-teacher`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        provider: settings.provider,
        model: settings.apiModel,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
        action,
        sessionId,
        userId,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text().catch(() => "Request failed");
      return { content: `Sorry, I encountered an error: ${errText}. Please try again.`, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, latencyMs };
    }

    const data = await response.json();
    return {
      content: data.content ?? data.error ?? "No response received.",
      inputTokens: data.inputTokens ?? 0,
      outputTokens: data.outputTokens ?? 0,
      totalTokens: data.totalTokens ?? 0,
      estimatedCostUsd: data.estimatedCostUsd ?? 0,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      content: `I couldn't connect to the AI service. ${err instanceof Error ? err.message : "Please try again."}`,
      inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, latencyMs,
    };
  }
}

export async function teachTopic(
  topic: string,
  sessionTitle: string,
  ragContext: RAGContext,
  teachingMode: TeachingMode,
  language: SupportedLanguage
): Promise<ApiResponse> {
  const systemPrompt = buildSystemPrompt(ragContext, teachingMode, language);
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Please teach me about: ${topic}. Start by introducing the topic, then explain it step by step with examples. End with a quick check question to see if I understood.`,
    },
  ];
  return callEdgeFunction(messages, "teach");
}

export async function handleInterruption(
  question: string,
  currentTopic: string,
  recentContent: string,
  teachingMode: TeachingMode,
  language: SupportedLanguage
): Promise<ApiResponse> {
  const langName = { en: "English", ur: "Urdu", "roman-ur": "Roman Urdu", mixed: "mixed Urdu and English" }[language];
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an AI teacher. The student interrupted while you were teaching about "${currentTopic}". Recent content covered: ${recentContent.slice(0, 500)}. Respond in ${langName}. Be concise and helpful.`,
    },
    { role: "user", content: question },
  ];
  return callEdgeFunction(messages, "interrupt");
}

export async function chatWithContext(
  question: string,
  topic: string,
  ragContext: RAGContext,
  language: SupportedLanguage
): Promise<ApiResponse> {
  const langName = { en: "English", ur: "Urdu", "roman-ur": "Roman Urdu", mixed: "mixed Urdu and English" }[language];
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an AI course assistant. Topic context: ${topic}. Course content: ${ragContext.combinedContext.slice(0, 2000)}. Respond in ${langName}. If the answer isn't in the course content, say so clearly.`,
    },
    { role: "user", content: question },
  ];
  return callEdgeFunction(messages, "chat");
}

export async function generateSummary(
  topic: string,
  ragContext: RAGContext,
  questionsAsked: string[],
  weakTopics: string[]
): Promise<ApiResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Create a comprehensive lesson summary for: ${topic}. Course content: ${ragContext.combinedContext.slice(0, 2000)}. The student asked these questions: ${questionsAsked.slice(-5).join("; ")}. Weak topics: ${weakTopics.join(", ")}. Return a JSON object with: { "summary": string, "keyPoints": string[], "definitions": [{"term": string, "definition": string}], "formulas": string[], "revisionNotes": string, "homeworkRecommendation": string, "nextLessonPreparation": string }`,
    },
    { role: "user", content: `Generate a lesson summary for ${topic}.` },
  ];
  return callEdgeFunction(messages, "summary");
}

export function parseInterruptCommand(message: string): string | null {
  const lower = message.toLowerCase().trim();
  if (lower === "stop" || lower === "pause") return "pause";
  if (lower === "continue" || lower === "resume" || lower === "go on") return "continue";
  if (lower.includes("summarize") || lower.includes("summary")) return "summarize";
  if (lower.includes("quiz") && lower.includes("me")) return "quiz_me";
  if (lower.includes("explain in urdu") || lower.includes("urdu mein")) return "translate_urdu";
  if (lower.includes("roman urdu")) return "translate_roman_urdu";
  if (lower.includes("explain in english")) return "translate_english";
  if (lower.includes("slower") || lower.includes("slow down")) return "slower";
  if (lower.includes("faster") || lower.includes("speed up")) return "faster";
  if (lower.includes("another example") || lower.includes("more example")) return "another_example";
  if (lower.includes("repeat") || lower.includes("explain again")) return "repeat";
  if (lower.includes("skip")) return "skip";
  return null;
}
