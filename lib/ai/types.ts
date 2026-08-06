export type TeachingMode =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "child_friendly"
  | "professional"
  | "exam_prep"
  | "interview_prep";

export type SupportedLanguage = "en" | "ur" | "roman-ur" | "mixed";

export type VoiceType = "female" | "male";

export type RequestAction =
  | "teach"
  | "interrupt"
  | "quiz"
  | "homework"
  | "summary"
  | "chat";

export type ClassroomMessage = {
  id: string;
  role: "teacher" | "student";
  content: string;
  timestamp: string;
  action?: RequestAction;
};

export type ClassroomSession = {
  id: string;
  userId: string;
  courseId: string | null;
  lessonId: string | null;
  sessionTitle: string;
  status: "active" | "paused" | "completed";
  teachingMode: TeachingMode;
  preferredLanguage: SupportedLanguage;
  selectedVoice: VoiceType | null;
  currentTopic: string | null;
  lessonProgress: {
    currentStep: number;
    totalSteps: number;
    completedSteps: number[];
  };
  messages: ClassroomMessage[];
  startedAt: string;
  completedAt: string | null;
};

export type RAGChunk = {
  id: string;
  source: string;
  sourceType: "lesson" | "module" | "pdf" | "notes" | "assignment" | "quiz" | "resource";
  content: string;
  relevanceScore?: number;
};

export type RAGContext = {
  chunks: RAGChunk[];
  combinedContext: string;
  sources: string[];
};

export type SessionMemory = {
  questionsAsked: string[];
  weakTopics: string[];
  strongTopics: string[];
  learningSpeed: "slow" | "normal" | "fast";
  quizPerformance: {
    correct: number;
    incorrect: number;
    topics: Record<string, { correct: number; incorrect: number }>;
  };
  interactionCount: number;
  confusionLevel: number;
  lastTopic: string | null;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
};

export type HomeworkType =
  | "mcqs"
  | "flashcards"
  | "practice_questions"
  | "revision_notes"
  | "case_study"
  | "assignment";

export type Homework = {
  id: string;
  userId: string;
  sessionId: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  homeworkType: HomeworkType;
  content: Record<string, unknown>;
  topic: string;
  difficulty: TeachingMode;
  isCompleted: boolean;
  score: number | null;
  createdAt: string;
};

export type AiSettings = {
  id: string;
  provider: "openai" | "anthropic" | "groq";
  apiModel: string;
  maxTokens: number;
  temperature: number;
  defaultLanguage: SupportedLanguage;
  maxSessionTokens: number;
  systemPrompt: string | null;
  isEnabled: boolean;
  voiceEnabled: boolean;
  whiteboardEnabled: boolean;
  visualLearningEnabled: boolean;
};

export type VoiceSettings = {
  id: string;
  defaultVoice: VoiceType;
  tone: "friendly" | "professional" | "casual" | "academic";
  speakingSpeed: number;
  pitch: number;
  volume: number;
  isEnabled: boolean;
};

export type PromptTemplate = {
  id: string;
  name: string;
  templateKey: string;
  description: string | null;
  promptText: string;
  variables: string[];
  isActive: boolean;
};

export type UsageLog = {
  id: string;
  userId?: string;
  provider: string;
  model: string;
  requestType: RequestAction;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number | null;
  success: boolean;
  createdAt: string;
};

export type ApiResponse = {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
};

export type VisualItem = {
  id: string;
  type: "code" | "table" | "diagram" | "formula" | "image" | "chart" | "timeline";
  title: string;
  content: string;
  language?: string;
};

export type WhiteboardState = {
  isActive: boolean;
  currentTopic: string | null;
  diagramType: "flowchart" | "mindmap" | "table" | "graph" | "equation" | "drawing" | null;
  elements: unknown[];
};

export type AvatarState = {
  isTalking: boolean;
  expression: "neutral" | "happy" | "thinking" | "explaining" | "concerned";
};
