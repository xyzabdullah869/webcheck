'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbQuiz, DbQuizQuestion, DbQuizResult } from '@/lib/database-types';

export type Quiz = {
  id: string;
  courseId: string;
  lessonId: string | null;
  moduleId: string | null;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  createdAt: string;
};

export type QuizQuestion = {
  id: string;
  quizId: string;
  question: string;
  questionType: 'single' | 'multiple' | 'true_false';
  options: QuizOption[];
  explanation: string;
  orderIndex: number;
};

export type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuizResult = {
  id: string;
  userId: string;
  quizId: string;
  courseId: string;
  score: number;
  passed: boolean;
  answers: Record<string, unknown>[];
  takenAt: string;
};

export type QuizWithCourse = Quiz & {
  courseTitle?: string;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
  questionCount?: number;
};

function mapQuiz(db: DbQuiz): Quiz {
  return {
    id: db.id,
    courseId: db.course_id,
    lessonId: db.lesson_id,
    moduleId: db.module_id,
    title: db.title,
    description: db.description,
    passingScore: db.passing_score,
    timeLimit: db.time_limit,
    createdAt: db.created_at,
  };
}

function mapQuestion(db: DbQuizQuestion): QuizQuestion {
  const options = (db.options ?? []).map((opt, i) => {
    const o = opt as Record<string, unknown>;
    return {
      id: (o.id as string) || `opt-${i}`,
      text: (o.text as string) || '',
      isCorrect: Boolean(o.isCorrect),
    };
  });
  return {
    id: db.id,
    quizId: db.quiz_id,
    question: db.question,
    questionType: db.question_type,
    options,
    explanation: db.explanation,
    orderIndex: db.order_index,
  };
}

function mapResult(db: DbQuizResult): QuizResult {
  return {
    id: db.id,
    userId: db.user_id,
    quizId: db.quiz_id,
    courseId: db.course_id,
    score: db.score,
    passed: db.passed,
    answers: db.answers ?? [],
    takenAt: db.taken_at,
  };
}

export async function getAllQuizzes(): Promise<QuizWithCourse[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('quizzes')
    .select('*, courses(title), modules(title), lessons(title)')
    .order('created_at', { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const q = mapQuiz(row as unknown as DbQuiz);
    const course = row.courses as Record<string, unknown> | undefined;
    const module = row.modules as Record<string, unknown> | undefined;
    const lesson = row.lessons as Record<string, unknown> | undefined;
    return {
      ...q,
      courseTitle: course?.title as string | undefined,
      moduleTitle: module?.title as string | null | undefined,
      lessonTitle: lesson?.title as string | null | undefined,
    };
  });
}

export async function getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((d: Record<string, unknown>) => mapQuiz(d as unknown as DbQuiz));
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  const supabase = createClient();
  const { data } = await supabase.from('quizzes').select('*').eq('id', id).maybeSingle();
  return data ? mapQuiz(data as unknown as DbQuiz) : null;
}

export async function createQuiz(quiz: {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      course_id: quiz.courseId,
      module_id: quiz.moduleId ?? null,
      lesson_id: quiz.lessonId ?? null,
      title: quiz.title,
      description: quiz.description ?? '',
      passing_score: quiz.passingScore ?? 70,
      time_limit: quiz.timeLimit ?? 600,
    })
    .select('id')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

export async function updateQuiz(
  id: string,
  updates: Partial<Quiz>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.passingScore !== undefined) dbUpdates.passing_score = updates.passingScore;
  if (updates.timeLimit !== undefined) dbUpdates.time_limit = updates.timeLimit;
  if (updates.moduleId !== undefined) dbUpdates.module_id = updates.moduleId;
  if (updates.lessonId !== undefined) dbUpdates.lesson_id = updates.lessonId;
  const { error } = await supabase.from('quizzes').update(dbUpdates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteQuiz(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });
  return (data ?? []).map((d: Record<string, unknown>) => mapQuestion(d as unknown as DbQuizQuestion));
}

export async function addQuizQuestion(question: {
  quizId: string;
  question: string;
  questionType: 'single' | 'multiple' | 'true_false';
  options: QuizOption[];
  explanation?: string;
  orderIndex?: number;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: question.quizId,
      question: question.question,
      question_type: question.questionType,
      options: question.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      explanation: question.explanation ?? '',
      order_index: question.orderIndex ?? 0,
    })
    .select('id')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

export async function updateQuizQuestion(
  id: string,
  updates: Partial<QuizQuestion>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.question !== undefined) dbUpdates.question = updates.question;
  if (updates.questionType !== undefined) dbUpdates.question_type = updates.questionType;
  if (updates.options !== undefined) {
    dbUpdates.options = updates.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }));
  }
  if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
  const { error } = await supabase.from('quiz_questions').update(dbUpdates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteQuizQuestion(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function submitQuiz(
  quizId: string,
  courseId: string,
  answers: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string; result?: QuizResult }> {
  const supabase = createClient();

  const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
  const quiz = quizData as Record<string, unknown> | null;
  if (!quiz) return { success: false, error: 'Quiz not found' };

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (!questions || questions.length === 0) {
    return { success: false, error: 'No questions in this quiz' };
  }

  let correctCount = 0;
  questions.forEach((q: Record<string, unknown>) => {
    const qOptions = (q.options as Record<string, unknown>[]) ?? [];
    const correctOptionIds = qOptions
      .filter((o) => o.isCorrect)
      .map((o) => o.id as string);
    const userAnswer = answers.find(
      (a) => (a as Record<string, unknown>).questionId === q.id
    );
    if (userAnswer) {
      const selected = (userAnswer as Record<string, unknown>).selected as string[];
      const isCorrect =
        selected.length === correctOptionIds.length &&
        selected.every((s) => correctOptionIds.includes(s));
      if (isCorrect) correctCount++;
    }
  });

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= Number(quiz.passing_score);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: resultRow, error } = await supabase
    .from('quiz_results')
    .insert({
      quiz_id: quizId,
      course_id: courseId,
      user_id: user.id,
      score,
      passed,
      answers,
    })
    .select('*')
    .maybeSingle();

  if (error) return { success: false, error: error.message };

  return { success: true, result: mapResult(resultRow as unknown as DbQuizResult) };
}

export async function getQuizResults(userId: string): Promise<QuizResult[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false });
  return (data ?? []).map((d: Record<string, unknown>) => mapResult(d as unknown as DbQuizResult));
}

export async function getQuizResultHistory(
  userId: string,
  quizId: string
): Promise<QuizResult[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .order('taken_at', { ascending: false });
  return (data ?? []).map((d: Record<string, unknown>) => mapResult(d as unknown as DbQuizResult));
}

export async function getStudentQuizzes(courseIds: string[]): Promise<QuizWithCourse[]> {
  if (courseIds.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('quizzes')
    .select('*, courses(title), modules(title), lessons(title)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const q = mapQuiz(row as unknown as DbQuiz);
    const course = row.courses as Record<string, unknown> | undefined;
    const module = row.modules as Record<string, unknown> | undefined;
    const lesson = row.lessons as Record<string, unknown> | undefined;
    return {
      ...q,
      courseTitle: course?.title as string | undefined,
      moduleTitle: module?.title as string | null | undefined,
      lessonTitle: lesson?.title as string | null | undefined,
    };
  });
}
