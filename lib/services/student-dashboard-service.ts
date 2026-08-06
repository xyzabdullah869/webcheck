'use client';

import { createClient } from '@/lib/supabase/client';

export type StudentStats = {
  enrolledCourses: number;
  completedLessons: number;
  certificates: number;
  currentStreak: number;
  totalLearningHours: number;
};

export type StudentCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  progress: number;
  instructor_name: string | null;
};

export type StudentActivity = {
  id: string;
  type: string;
  title: string;
  created_at: string;
};

export async function getStudentStats(userId: string): Promise<StudentStats> {
  const supabase = createClient();

  const [enrollments, lessonProgress, certificates] = await Promise.all([
    supabase.from('enrollments').select('id, progress, course_id').eq('user_id', userId),
    supabase.from('lesson_progress').select('id, completed').eq('user_id', userId).eq('completed', true),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  const enrolledCourses = enrollments.data?.length ?? 0;
  const completedLessons = lessonProgress.data?.length ?? 0;
  const certs = certificates.count ?? 0;
  const totalProgress = (enrollments.data ?? []).reduce((sum: number, e: Record<string, unknown>) => sum + (e.progress as number), 0);
  const avgProgress = enrolledCourses > 0 ? totalProgress / enrolledCourses : 0;
  const totalLearningHours = Math.round((completedLessons * 0.5) + (avgProgress / 100) * 10);

  return {
    enrolledCourses,
    completedLessons,
    certificates: certs,
    currentStreak: 0,
    totalLearningHours,
  };
}

export async function getContinueLearning(userId: string): Promise<StudentCourse[]> {
  const supabase = createClient();

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('id, course_id, progress')
    .eq('user_id', userId)
    .lt('progress', 100)
    .order('enrolled_at', { ascending: false })
    .limit(4);

  if (error || !enrollments || enrollments.length === 0) return [];

  const courseIds = enrollments.map((e: Record<string, unknown>) => e.course_id as string);
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail, instructor_id')
    .in('id', courseIds);

  if (!courses) return [];

  const instructorIds = Array.from(new Set(courses.map((c: Record<string, unknown>) => c.instructor_id as string).filter(Boolean)));
  let instructorMap = new Map<string, string>();
  if (instructorIds.length > 0) {
    const { data: instructors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', instructorIds);
    (instructors ?? []).forEach((p: Record<string, unknown>) => {
      instructorMap.set(p.id as string, p.full_name as string);
    });
  }

  return enrollments.map((e: Record<string, unknown>) => {
    const course = courses.find((c: Record<string, unknown>) => c.id === e.course_id);
    if (!course) return null;
    return {
      id: course.id as string,
      title: course.title as string,
      slug: course.slug as string,
      thumbnail: (course.thumbnail as string) ?? null,
      progress: e.progress as number,
      instructor_name: course.instructor_id ? instructorMap.get(course.instructor_id as string) ?? null : null,
    };
  }).filter(Boolean) as StudentCourse[];
}

export async function getRecentActivity(userId: string): Promise<StudentActivity[]> {
  const supabase = createClient();

  const [lessonProgress, quizResults, enrollments] = await Promise.all([
    supabase.from('lesson_progress').select('id, lesson_id, course_id, completed, updated_at').eq('user_id', userId).eq('completed', true).order('updated_at', { ascending: false }).limit(5),
    supabase.from('quiz_results').select('id, quiz_id, course_id, score, passed, taken_at').eq('user_id', userId).order('taken_at', { ascending: false }).limit(3),
    supabase.from('enrollments').select('id, course_id, enrolled_at').eq('user_id', userId).order('enrolled_at', { ascending: false }).limit(3),
  ]);

  const activities: StudentActivity[] = [];

  for (const lp of (lessonProgress.data ?? []) as Record<string, unknown>[]) {
    activities.push({
      id: lp.id as string,
      type: 'lesson',
      title: 'Completed a lesson',
      created_at: (lp.updated_at as string) ?? '',
    });
  }

  for (const qr of (quizResults.data ?? []) as Record<string, unknown>[]) {
    activities.push({
      id: qr.id as string,
      type: 'quiz',
      title: `Quiz ${qr.passed ? 'passed' : 'attempted'} — Score: ${qr.score}%`,
      created_at: (qr.taken_at as string) ?? '',
    });
  }

  for (const en of (enrollments.data ?? []) as Record<string, unknown>[]) {
    activities.push({
      id: en.id as string,
      type: 'enrollment',
      title: 'Enrolled in a new course',
      created_at: (en.enrolled_at as string) ?? '',
    });
  }

  return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
}
