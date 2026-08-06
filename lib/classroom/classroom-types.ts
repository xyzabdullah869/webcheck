export type ClassroomParticipant = {
  userId: string;
  batchId: string;
  role: "student" | "teacher" | "observer";
  joinedAt: string;
};

export type ClassroomConfig = {
  batchId: string;
  maxParticipants: number;
  enableVoice: boolean;
  enableWhiteboard: boolean;
  enableRecording: boolean;
};

export function createDefaultClassroomConfig(batchId: string, maxStudents: number): ClassroomConfig {
  return {
    batchId,
    maxParticipants: maxStudents,
    enableVoice: false,
    enableWhiteboard: false,
    enableRecording: false,
  };
}
