'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbAssignment, DbSubmission } from '@/lib/database-types';

export type Assignment = {
  id: string;
  courseId: string;
  lessonId: string | null;
  moduleId: string | null;
  title: string;
  description: string;
  dueDate: string | null;
  maxScore: number;
  allowedFileTypes: string[];
  createdAt: string;
};

export type AssignmentWithCourse = Assignment & {
  courseTitle?: string;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
};

export type Submission = {
  id: string;
  assignmentId: string;
  userId: string;
  courseId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: 'Pending' | 'Submitted' | 'Reviewed' | 'Approved';
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
  reviewedAt: string | null;
};

export type SubmissionWithStudent = Submission & {
  studentName?: string;
  studentEmail?: string;
  assignmentTitle?: string;
};

function mapAssignment(db: DbAssignment): Assignment {
  return {
    id: db.id,
    courseId: db.course_id,
    lessonId: db.lesson_id,
    moduleId: db.module_id,
    title: db.title,
    description: db.description,
    dueDate: db.due_date,
    maxScore: db.max_score,
    allowedFileTypes: db.allowed_file_types ?? [],
    createdAt: db.created_at,
  };
}

function mapSubmission(db: DbSubmission): Submission {
  return {
    id: db.id,
    assignmentId: db.assignment_id,
    userId: db.user_id,
    courseId: db.course_id,
    fileUrl: db.file_url,
    fileName: db.file_name,
    fileType: db.file_type,
    status: db.status,
    submittedAt: db.submitted_at,
    grade: db.grade,
    feedback: db.feedback,
    reviewedAt: db.reviewed_at,
  };
}

export async function getAllAssignments(): Promise<AssignmentWithCourse[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('assignments')
    .select('*, courses(title), modules(title), lessons(title)')
    .order('created_at', { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const a = mapAssignment(row as unknown as DbAssignment);
    const course = row.courses as Record<string, unknown> | undefined;
    const module = row.modules as Record<string, unknown> | undefined;
    const lesson = row.lessons as Record<string, unknown> | undefined;
    return {
      ...a,
      courseTitle: course?.title as string | undefined,
      moduleTitle: module?.title as string | null | undefined,
      lessonTitle: lesson?.title as string | null | undefined,
    };
  });
}

export async function getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((d: Record<string, unknown>) => mapAssignment(d as unknown as DbAssignment));
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  const supabase = createClient();
  const { data } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
  return data ? mapAssignment(data as unknown as DbAssignment) : null;
}

export async function createAssignment(assignment: {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string;
  dueDate?: string | null;
  maxScore?: number;
  allowedFileTypes?: string[];
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      course_id: assignment.courseId,
      module_id: assignment.moduleId ?? null,
      lesson_id: assignment.lessonId ?? null,
      title: assignment.title,
      description: assignment.description ?? '',
      due_date: assignment.dueDate ?? null,
      max_score: assignment.maxScore ?? 100,
      allowed_file_types: assignment.allowedFileTypes ?? ['PDF', 'DOCX', 'ZIP'],
    })
    .select('id')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

export async function updateAssignment(
  id: string,
  updates: Partial<Assignment>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.maxScore !== undefined) dbUpdates.max_score = updates.maxScore;
  if (updates.moduleId !== undefined) dbUpdates.module_id = updates.moduleId;
  if (updates.lessonId !== undefined) dbUpdates.lesson_id = updates.lessonId;
  if (updates.allowedFileTypes !== undefined) dbUpdates.allowed_file_types = updates.allowedFileTypes;
  const { error } = await supabase.from('assignments').update(dbUpdates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getStudentAssignments(courseIds: string[]): Promise<AssignmentWithCourse[]> {
  if (courseIds.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('assignments')
    .select('*, courses(title), modules(title), lessons(title)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const a = mapAssignment(row as unknown as DbAssignment);
    const course = row.courses as Record<string, unknown> | undefined;
    const module = row.modules as Record<string, unknown> | undefined;
    const lesson = row.lessons as Record<string, unknown> | undefined;
    return {
      ...a,
      courseTitle: course?.title as string | undefined,
      moduleTitle: module?.title as string | null | undefined,
      lessonTitle: lesson?.title as string | null | undefined,
    };
  });
}

export async function getMySubmission(
  assignmentId: string,
  userId: string
): Promise<Submission | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('user_id', userId)
    .maybeSingle();
  return data ? mapSubmission(data as unknown as DbSubmission) : null;
}

export async function getMySubmissions(
  userId: string
): Promise<Submission[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  return (data ?? []).map((d: Record<string, unknown>) => mapSubmission(d as unknown as DbSubmission));
}

export async function submitAssignment(params: {
  assignmentId: string;
  courseId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('assignment_submissions')
    .select('id')
    .eq('assignment_id', params.assignmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        file_url: params.fileUrl,
        file_name: params.fileName,
        file_type: params.fileType,
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', (existing as Record<string, unknown>).id as string);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const { error } = await supabase.from('assignment_submissions').insert({
    assignment_id: params.assignmentId,
    course_id: params.courseId,
    user_id: user.id,
    file_url: params.fileUrl,
    file_name: params.fileName,
    file_type: params.fileType,
    status: 'Submitted',
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAllSubmissions(): Promise<SubmissionWithStudent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(full_name, email), assignments(title)')
    .order('submitted_at', { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const s = mapSubmission(row as unknown as DbSubmission);
    const profile = row.profiles as Record<string, unknown> | undefined;
    const assignment = row.assignments as Record<string, unknown> | undefined;
    return {
      ...s,
      studentName: profile?.full_name as string | undefined,
      studentEmail: profile?.email as string | undefined,
      assignmentTitle: assignment?.title as string | undefined,
    };
  });
}

export async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<SubmissionWithStudent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(full_name, email), assignments(title)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const s = mapSubmission(row as unknown as DbSubmission);
    const profile = row.profiles as Record<string, unknown> | undefined;
    const assignment = row.assignments as Record<string, unknown> | undefined;
    return {
      ...s,
      studentName: profile?.full_name as string | undefined,
      studentEmail: profile?.email as string | undefined,
      assignmentTitle: assignment?.title as string | undefined,
    };
  });
}

export async function gradeSubmission(
  id: string,
  grade: number,
  feedback: string,
  status: 'Reviewed' | 'Approved'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('assignment_submissions')
    .update({
      grade,
      feedback,
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
