import { createClient } from "@/lib/supabase/client";
import { teachTopic, handleInterruption, chatWithContext, parseInterruptCommand, generateSummary } from "./ai-brain";
import { retrieveCourseContent } from "./knowledge-engine";
import { getVoiceEngine } from "./voice-engine";
import { getSpeechRecognition } from "./speech-recognition";
import { WhiteboardEngine } from "./whiteboard-engine";
import { VisualLearningEngine } from "./visual-learning-engine";
import { getAvatarRenderer } from "./avatar-renderer";
import {
  getOrCreateSessionMemory,
  updateSessionMemory,
  recordQuestion,
  recordQuizResult,
  shouldAdaptTeaching,
  getAdaptedTeachingMode,
} from "./session-memory";
import { createQuiz } from "./quiz-engine";
import { createHomework } from "./homework-generator";
import type {
  ClassroomSession,
  ClassroomMessage,
  TeachingMode,
  SupportedLanguage,
  VoiceType,
  RAGContext,
  QuizQuestion,
  HomeworkType,
  Homework,
  SessionMemory,
} from "./types";

export class ClassroomController {
  private session: ClassroomSession | null = null;
  private memory: (SessionMemory & { dbId: string }) | null = null;
  private ragContext: RAGContext | null = null;
  private voiceEngine = getVoiceEngine();
  private speechEngine = getSpeechRecognition();
  private whiteboard = new WhiteboardEngine();
  private visualEngine = new VisualLearningEngine();
  private avatar = getAvatarRenderer();

  private listeners: Set<(state: ClassroomControllerState) => void> = new Set();
  private messageListeners: Set<(message: ClassroomMessage) => void> = new Set();

  async startSession(
    userId: string,
    courseId: string | null,
    lessonId: string | null,
    sessionTitle: string,
    teachingMode: TeachingMode,
    language: SupportedLanguage,
    voice: VoiceType
  ): Promise<ClassroomSession> {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_teacher_sessions")
      .insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        session_title: sessionTitle,
        status: "active",
        teaching_mode: teachingMode,
        preferred_language: language,
        selected_voice: voice,
        messages: [],
        lesson_progress: { currentStep: 0, totalSteps: 0, completedSteps: [] },
      })
      .select("*")
      .maybeSingle();

    const row = data as Record<string, unknown>;
    this.session = {
      id: row.id as string,
      userId,
      courseId,
      lessonId,
      sessionTitle,
      status: "active",
      teachingMode,
      preferredLanguage: language,
      selectedVoice: voice,
      currentTopic: null,
      lessonProgress: { currentStep: 0, totalSteps: 0, completedSteps: [] },
      messages: [],
      startedAt: (row.started_at as string) ?? new Date().toISOString(),
      completedAt: null,
    };

    if (courseId) {
      this.ragContext = await retrieveCourseContent(courseId, lessonId ?? undefined, sessionTitle);
    } else {
      this.ragContext = { chunks: [], combinedContext: "", sources: [] };
    }

    this.memory = await getOrCreateSessionMemory(userId, this.session.id, courseId);
    this.notifyListeners();
    return this.session;
  }

  async loadSession(sessionId: string): Promise<ClassroomSession | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_teacher_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (!data) return null;
    const row = data as Record<string, unknown>;

    this.session = {
      id: row.id as string,
      userId: row.user_id as string,
      courseId: (row.course_id as string) ?? null,
      lessonId: (row.lesson_id as string) ?? null,
      sessionTitle: row.session_title as string,
      status: row.status as ClassroomSession["status"],
      teachingMode: row.teaching_mode as TeachingMode,
      preferredLanguage: row.preferred_language as SupportedLanguage,
      selectedVoice: (row.selected_voice as VoiceType) ?? null,
      currentTopic: (row.current_topic as string) ?? null,
      lessonProgress: (row.lesson_progress as ClassroomSession["lessonProgress"]) ?? { currentStep: 0, totalSteps: 0, completedSteps: [] },
      messages: (row.messages as ClassroomMessage[]) ?? [],
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string) ?? null,
    };

    if (this.session.courseId) {
      this.ragContext = await retrieveCourseContent(this.session.courseId, this.session.lessonId ?? undefined, this.session.currentTopic ?? undefined);
    }

    this.memory = await getOrCreateSessionMemory(this.session.userId, this.session.id, this.session.courseId);
    this.notifyListeners();
    return this.session;
  }

  getSession(): ClassroomSession | null { return this.session; }
  getMemory(): (SessionMemory & { dbId: string }) | null { return this.memory; }
  getRagContext(): RAGContext | null { return this.ragContext; }
  getWhiteboard(): WhiteboardEngine { return this.whiteboard; }
  getVisualEngine(): VisualLearningEngine { return this.visualEngine; }
  getVoiceEngine() { return this.voiceEngine; }
  getSpeechEngine() { return this.speechEngine; }
  getAvatar() { return this.avatar; }

  async teachTopicAction(topic: string): Promise<string> {
    if (!this.session || !this.ragContext) return "No active session.";

    const adaptedMode = this.memory
      ? getAdaptedTeachingMode(this.session.teachingMode, this.memory)
      : this.session.teachingMode;

    const response = await teachTopic(topic, this.session.sessionTitle, this.ragContext, adaptedMode as TeachingMode, this.session.preferredLanguage);
    this.addMessage("teacher", response.content, "teach");

    if (this.memory) {
      this.memory.lastTopic = topic;
      this.memory = recordQuestion(this.memory, `Teach: ${topic}`);
      await updateSessionMemory(this.memory.dbId, { lastTopic: topic, interactionCount: this.memory.interactionCount });
    }

    this.session.currentTopic = topic;
    await this.persistSession();

    if (this.whiteboard.shouldUseWhiteboard(topic, response.content)) {
      this.whiteboard.activate(topic, this.whiteboard.detectDiagramType(topic, response.content));
    }

    if (this.visualEngine.shouldShowVisual(topic, response.content)) {
      const items = this.visualEngine.buildVisualItemsFromContent(topic, response.content);
      if (items.length > 0) this.visualEngine.show(items);
    }

    if (this.session.selectedVoice) {
      this.avatar.startTalking();
      await this.voiceEngine.speak(response.content, this.session.selectedVoice, this.session.preferredLanguage);
      this.avatar.stopTalking();
    }

    this.notifyListeners();
    return response.content;
  }

  async handleStudentInterruption(message: string): Promise<string> {
    if (!this.session) return "No active session.";

    this.addMessage("student", message, "interrupt");
    const command = parseInterruptCommand(message);

    if (command === "pause" || command === "stop") {
      this.voiceEngine.stop();
      this.addMessage("teacher", "Sure, I'll pause here. Let me know when you're ready to continue.");
      this.notifyListeners();
      return "Paused.";
    }

    if (command === "continue") {
      this.addMessage("teacher", "Great, let's continue where we left off.");
      this.notifyListeners();
      return "Continuing...";
    }

    if (command === "summarize") return this.summarizeLesson();
    if (command === "quiz_me") return this.startQuiz();

    const currentContent = this.session.messages[this.session.messages.length - 2]?.content ?? "";
    const response = await handleInterruption(message, this.session.currentTopic ?? this.session.sessionTitle, currentContent, this.session.teachingMode, this.session.preferredLanguage);
    this.addMessage("teacher", response.content, "interrupt");

    if (command === "translate_urdu") this.session.preferredLanguage = "ur";
    if (command === "translate_roman_urdu") this.session.preferredLanguage = "roman-ur";
    if (command === "translate_english") this.session.preferredLanguage = "en";

    if (this.memory) {
      this.memory = recordQuestion(this.memory, message);
      await updateSessionMemory(this.memory.dbId, { questionsAsked: this.memory.questionsAsked, interactionCount: this.memory.interactionCount });
    }

    if (this.session.selectedVoice) {
      this.avatar.startTalking();
      await this.voiceEngine.speak(response.content, this.session.selectedVoice, this.session.preferredLanguage);
      this.avatar.stopTalking();
    }

    await this.persistSession();
    this.notifyListeners();
    return response.content;
  }

  async chat(message: string): Promise<string> {
    if (!this.session || !this.ragContext) return "No active session.";

    this.addMessage("student", message, "chat");
    const response = await chatWithContext(message, this.session.currentTopic ?? this.session.sessionTitle, this.ragContext, this.session.preferredLanguage);
    this.addMessage("teacher", response.content, "chat");

    if (this.memory) {
      this.memory = recordQuestion(this.memory, message);
      await updateSessionMemory(this.memory.dbId, { questionsAsked: this.memory.questionsAsked, interactionCount: this.memory.interactionCount });
    }

    if (this.session.selectedVoice) {
      this.avatar.startTalking();
      await this.voiceEngine.speak(response.content, this.session.selectedVoice, this.session.preferredLanguage);
      this.avatar.stopTalking();
    }

    await this.persistSession();
    this.notifyListeners();
    return response.content;
  }

  async startQuiz(): Promise<string> {
    if (!this.session || !this.ragContext) return "No active session.";
    const topic = this.session.currentTopic ?? this.session.sessionTitle;
    const questions = await createQuiz(topic, this.ragContext, this.session.teachingMode, 3);
    if (questions.length === 0) return "I couldn't generate quiz questions right now. Please try again.";

    const quizText = questions
      .map((q, i) => `**Q${i + 1}: ${q.question}**\n${q.options.map((o, j) => `${String.fromCharCode(65 + j)}) ${o}`).join("\n")}`)
      .join("\n\n");

    this.addMessage("teacher", `Let's check your understanding!\n\n${quizText}`, "quiz");
    await this.persistSession();
    this.notifyListeners();
    return quizText;
  }

  async submitQuizAnswer(questions: QuizQuestion[], answers: (number | null)[]): Promise<{ result: { correct: number; incorrect: number; total: number; score: number }; explanations: string[] }> {
    if (!this.session || !this.memory) return { result: { correct: 0, incorrect: 0, total: 0, score: 0 }, explanations: [] };

    const explanations: string[] = [];
    let correct = 0;
    let incorrect = 0;

    for (let i = 0; i < questions.length; i++) {
      const isCorrect = answers[i] === questions[i].correctIndex;
      if (isCorrect) correct++; else incorrect++;
      explanations.push(`${isCorrect ? "Correct!" : "Not quite."} ${questions[i].explanation}`);
      this.memory = recordQuizResult(this.memory, this.session.currentTopic ?? "general", isCorrect);
    }

    await updateSessionMemory(this.memory.dbId, {
      quizPerformance: this.memory.quizPerformance,
      weakTopics: this.memory.weakTopics,
      strongTopics: this.memory.strongTopics,
      confusionLevel: this.memory.confusionLevel,
    });

    if (shouldAdaptTeaching(this.memory)) {
      this.addMessage("teacher", "I notice you might need some extra help with this topic. Let me simplify things and go at a slower pace.", "chat");
    }

    this.addMessage("teacher", `You got ${correct} out of ${questions.length} correct!\n\n${explanations.join("\n\n")}`, "quiz");
    await this.persistSession();
    this.notifyListeners();
    return { result: { correct, incorrect, total: questions.length, score: Math.round((correct / questions.length) * 100) }, explanations };
  }

  async generateHomework(type: HomeworkType): Promise<Homework | null> {
    if (!this.session) return null;
    const topic = this.session.currentTopic ?? this.session.sessionTitle;
    return createHomework(this.session.userId, this.session.id, this.session.courseId, this.session.lessonId, topic, this.ragContext ?? { chunks: [], combinedContext: "", sources: [] }, this.session.teachingMode, type);
  }

  async summarizeLesson(): Promise<string> {
    if (!this.session || !this.ragContext) return "No active session.";
    const topic = this.session.currentTopic ?? this.session.sessionTitle;
    const response = await generateSummary(topic, this.ragContext, this.memory?.questionsAsked ?? [], this.memory?.weakTopics ?? []);

    let summaryText = response.content;
    try {
      const parsed = JSON.parse(response.content);
      summaryText = `**Lesson Summary: ${topic}**\n\n${parsed.summary ?? ""}\n\n**Key Points:**\n${(parsed.keyPoints ?? []).map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}`;
      if (parsed.definitions?.length > 0) summaryText += `\n\n**Definitions:**\n${parsed.definitions.map((d: { term: string; definition: string }) => `- **${d.term}**: ${d.definition}`).join("\n")}`;
      if (parsed.revisionNotes) summaryText += `\n\n**Revision Notes:**\n${parsed.revisionNotes}`;
      if (parsed.homeworkRecommendation) summaryText += `\n\n**Homework:** ${parsed.homeworkRecommendation}`;
      if (parsed.nextLessonPreparation) summaryText += `\n\n**Next Lesson Prep:** ${parsed.nextLessonPreparation}`;

      const supabase = createClient();
      await supabase.from("ai_lesson_summaries").insert({
        user_id: this.session.userId,
        course_id: this.session.courseId,
        lesson_id: this.session.lessonId,
        session_id: this.session.id,
        summary: parsed.summary ?? response.content,
        key_points: parsed.keyPoints ?? [],
        definitions: parsed.definitions ?? [],
        formulas: parsed.formulas ?? [],
        revision_notes: parsed.revisionNotes ?? null,
        homework_recommendation: parsed.homeworkRecommendation ?? null,
        next_lesson_preparation: parsed.nextLessonPreparation ?? null,
      });
    } catch {}

    this.addMessage("teacher", summaryText, "summary");
    await this.persistSession();
    this.notifyListeners();
    return summaryText;
  }

  setTeachingMode(mode: TeachingMode) {
    if (this.session) { this.session.teachingMode = mode; this.persistSession(); this.notifyListeners(); }
  }

  setLanguage(lang: SupportedLanguage) {
    if (this.session) { this.session.preferredLanguage = lang; this.speechEngine.setLanguage(lang); this.persistSession(); this.notifyListeners(); }
  }

  setVoice(voice: VoiceType) {
    if (this.session) { this.session.selectedVoice = voice; this.persistSession(); this.notifyListeners(); }
  }

  pauseVoice() { this.voiceEngine.pause(); this.avatar.stopTalking(); }
  resumeVoice() { this.voiceEngine.resume(); this.avatar.startTalking(); }
  stopVoice() { this.voiceEngine.stop(); this.avatar.stopTalking(); }

  private addMessage(role: ClassroomMessage["role"], content: string, action?: ClassroomMessage["action"]) {
    if (!this.session) return;
    const message: ClassroomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role, content, timestamp: new Date().toISOString(), action,
    };
    this.session.messages.push(message);
    this.messageListeners.forEach((cb) => cb(message));
  }

  private async persistSession() {
    if (!this.session) return;
    const supabase = createClient();
    await supabase.from("ai_teacher_sessions").update({
      messages: this.session.messages,
      current_topic: this.session.currentTopic,
      lesson_progress: this.session.lessonProgress,
      status: this.session.status,
      preferred_language: this.session.preferredLanguage,
      teaching_mode: this.session.teachingMode,
      selected_voice: this.session.selectedVoice,
      updated_at: new Date().toISOString(),
    }).eq("id", this.session.id);
  }

  async endSession() {
    if (!this.session) return;
    this.session.status = "completed";
    this.session.completedAt = new Date().toISOString();
    this.voiceEngine.stop();
    this.speechEngine.stop();
    this.visualEngine.hide();
    this.whiteboard.deactivate();
    await this.persistSession();
    this.notifyListeners();
  }

  onStateChange(callback: (state: ClassroomControllerState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onMessage(callback: (message: ClassroomMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  private notifyListeners() {
    const state: ClassroomControllerState = {
      session: this.session,
      memory: this.memory,
      isVoiceSpeaking: this.voiceEngine.getState().isSpeaking,
      isVoicePaused: this.voiceEngine.getState().isPaused,
      isListening: this.speechEngine.getIsListening(),
      whiteboardActive: this.whiteboard.getState().isActive,
      visualPanelVisible: this.visualEngine.getState().isVisible,
      avatarTalking: this.avatar.getIsTalking(),
    };
    this.listeners.forEach((cb) => cb(state));
  }
}

export type ClassroomControllerState = {
  session: ClassroomSession | null;
  memory: (SessionMemory & { dbId: string }) | null;
  isVoiceSpeaking: boolean;
  isVoicePaused: boolean;
  isListening: boolean;
  whiteboardActive: boolean;
  visualPanelVisible: boolean;
  avatarTalking: boolean;
};

let classroomInstance: ClassroomController | null = null;

export function getClassroomController(): ClassroomController {
  if (!classroomInstance) {
    classroomInstance = new ClassroomController();
  }
  return classroomInstance;
}
