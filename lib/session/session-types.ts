export type ClassroomFeature =
  | "attendance"
  | "raise_hand"
  | "question_queue"
  | "confused_button"
  | "homework"
  | "live_quiz"
  | "voice"
  | "live_notes";

export type ClassroomSessionState = {
  batchId: string;
  teacherId: string;
  featureStatus: Record<ClassroomFeature, boolean>;
  participantCount: number;
  startedAt: string | null;
  endedAt: string | null;
};

export const ALL_CLASSROOM_FEATURES: ClassroomFeature[] = [
  "attendance",
  "raise_hand",
  "question_queue",
  "confused_button",
  "homework",
  "live_quiz",
  "voice",
  "live_notes",
];

export function createDefaultSessionState(batchId: string, teacherId: string): ClassroomSessionState {
  const featureStatus = {} as Record<ClassroomFeature, boolean>;
  for (const feature of ALL_CLASSROOM_FEATURES) {
    featureStatus[feature] = false;
  }
  return {
    batchId,
    teacherId,
    featureStatus,
    participantCount: 0,
    startedAt: null,
    endedAt: null,
  };
}
