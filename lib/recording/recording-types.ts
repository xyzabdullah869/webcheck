export type RecordingSegment = {
  id: string;
  type: "voice" | "whiteboard" | "slides" | "diagrams" | "animations" | "teacher_actions";
  timestamp: number;
  duration_ms: number;
  data: Record<string, unknown>;
};

export type RecordingManifest = {
  id: string;
  batchId: string;
  teacherId: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  segments: RecordingSegment[];
};

export const RECORDABLE_SEGMENT_TYPES: RecordingSegment["type"][] = [
  "voice",
  "whiteboard",
  "slides",
  "diagrams",
  "animations",
  "teacher_actions",
];

export const NON_RECORDABLE_TYPES = [
  "student_voice",
  "student_name",
  "student_questions",
  "raise_hand",
  "chat",
  "quiz_discussion",
] as const;

export function isRecordable(type: string): boolean {
  return RECORDABLE_SEGMENT_TYPES.includes(type as RecordingSegment["type"]);
}

export function isNonRecordable(type: string): boolean {
  return (NON_RECORDABLE_TYPES as readonly string[]).includes(type);
}
