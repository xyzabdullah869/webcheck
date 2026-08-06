import { createClient } from "@/lib/supabase/client";
import type { DbBatch, DbBatchStudent } from "@/lib/database-types";

export type BatchInput = {
  batch_name: string;
  course_id?: string | null;
  teacher_id?: string | null;
  start_date: string;
  end_date?: string | null;
  class_days?: string[];
  class_time?: string;
  class_duration_minutes?: number;
  max_students?: number;
  is_active?: boolean;
};

export type BatchWithCounts = DbBatch & {
  enrolled_count: number;
  course_title?: string;
  teacher_name?: string;
};

export async function listBatches(): Promise<BatchWithCounts[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const batches = (data ?? []) as unknown as DbBatch[];
  const result: BatchWithCounts[] = [];

  for (const batch of batches) {
    const { count } = await supabase
      .from("batch_students")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batch.id);

    let course_title: string | undefined;
    if (batch.course_id) {
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", batch.course_id)
        .maybeSingle();
      course_title = (course as Record<string, unknown>)?.title as string | undefined;
    }

    let teacher_name: string | undefined;
    if (batch.teacher_id) {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("display_name")
        .eq("id", batch.teacher_id)
        .maybeSingle();
      teacher_name = (teacher as Record<string, unknown>)?.display_name as string | undefined;
    }

    result.push({
      ...batch,
      enrolled_count: count ?? 0,
      course_title,
      teacher_name,
    });
  }

  return result;
}

export async function getBatch(id: string): Promise<DbBatch | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DbBatch | null;
}

export async function createBatch(input: BatchInput): Promise<DbBatch> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("batches")
    .insert({
      batch_name: input.batch_name,
      course_id: input.course_id ?? null,
      teacher_id: input.teacher_id ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      class_days: input.class_days ?? ["Mon", "Wed", "Fri"],
      class_time: input.class_time ?? "09:00",
      class_duration_minutes: input.class_duration_minutes ?? 60,
      max_students: input.max_students ?? 20,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DbBatch;
}

export async function updateBatch(id: string, updates: Partial<BatchInput>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("batches")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function deleteBatch(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("batches").delete().eq("id", id);
  return !error;
}

export async function toggleBatchActive(id: string, isActive: boolean): Promise<boolean> {
  return updateBatch(id, { is_active: isActive });
}

export async function duplicateBatch(id: string): Promise<DbBatch | null> {
  const original = await getBatch(id);
  if (!original) return null;
  return createBatch({
    batch_name: `${original.batch_name} (Copy)`,
    course_id: original.course_id,
    teacher_id: original.teacher_id,
    start_date: original.start_date,
    end_date: original.end_date,
    class_days: original.class_days,
    class_time: original.class_time,
    class_duration_minutes: original.class_duration_minutes,
    max_students: original.max_students,
    is_active: false,
  });
}

export async function getAvailableBatches(courseId: string): Promise<BatchWithCounts[]> {
  const all = await listBatches();
  return all.filter((b) => b.is_active && b.course_id === courseId && b.enrolled_count < b.max_students);
}

export type BatchWithTeacher = BatchWithCounts & {
  teacher_display_name?: string;
  teacher_profile_photo?: string | null;
};

export async function getAvailableBatchesWithTeacher(courseId: string): Promise<BatchWithTeacher[]> {
  const supabase = createClient();
  const { data: batches, error } = await supabase
    .from("batches")
    .select(`
      *,
      teachers!batches_teacher_id_fkey(display_name, profile_photo)
    `)
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("start_date", { ascending: true });

  if (error) throw error;

  const result: BatchWithTeacher[] = [];
  for (const batch of (batches ?? []) as Record<string, unknown>[]) {
    const { count } = await supabase
      .from("batch_students")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batch.id as string);

    const maxStudents = batch.max_students as number;
    const enrolled = count ?? 0;
    if (enrolled >= maxStudents) continue; // hide full batches

    const teacher = batch.teachers as Record<string, unknown> | null;
    result.push({
      ...(batch as unknown as DbBatch),
      enrolled_count: enrolled,
      teacher_display_name: (teacher?.display_name as string) ?? undefined,
      teacher_profile_photo: (teacher?.profile_photo as string | null) ?? null,
    });
  }

  return result;
}

export async function enrollStudent(batchId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("batch_students")
    .select("id")
    .eq("batch_id", batchId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return true;

  const { data: batch } = await supabase
    .from("batches")
    .select("max_students")
    .eq("id", batchId)
    .maybeSingle();

  if (batch) {
    const { count } = await supabase
      .from("batch_students")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batchId);
    if ((count ?? 0) >= ((batch as Record<string, unknown>).max_students as number)) {
      return false;
    }
  }

  const { error } = await supabase
    .from("batch_students")
    .insert({ batch_id: batchId, user_id: userId });
  return !error;
}

export async function getStudentBatches(userId: string): Promise<DbBatchStudent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("batch_students")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as DbBatchStudent[];
}

export async function getBatchStudents(batchId: string): Promise<DbBatchStudent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("batch_students")
    .select("*")
    .eq("batch_id", batchId);
  if (error) throw error;
  return (data ?? []) as unknown as DbBatchStudent[];
}

export async function unenrollStudent(batchId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("batch_students")
    .delete()
    .eq("batch_id", batchId)
    .eq("user_id", userId);
  return !error;
}
