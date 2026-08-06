'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbInstructorEarning } from '@/lib/database-types';

export type InstructorEarning = {
  id: string;
  orderId: string | null;
  orderItemId: string | null;
  courseId: string | null;
  amount: number;
  platformFee: number;
  status: 'pending' | 'available' | 'withdrawn';
  createdAt: string;
};

export type InstructorEarningsSummary = {
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
  withdrawnEarnings: number;
  courseSales: number;
  totalStudents: number;
  monthlyRevenue: { month: string; amount: number }[];
  topCourses: { courseId: string; title: string; sales: number; earnings: number }[];
};

function mapEarning(db: DbInstructorEarning): InstructorEarning {
  return {
    id: db.id,
    orderId: db.order_id,
    orderItemId: db.order_item_id,
    courseId: db.course_id,
    amount: Number(db.amount),
    platformFee: Number(db.platform_fee),
    status: db.status,
    createdAt: db.created_at,
  };
}

export async function getInstructorEarningsSummary(instructorId: string): Promise<InstructorEarningsSummary> {
  const supabase = createClient();

  const [earningsResult, coursesResult] = await Promise.all([
    supabase.from('instructor_earnings').select('*').eq('instructor_id', instructorId),
    supabase.from('courses').select('id, title, students_count').eq('instructor_id', instructorId),
  ]);

  const earnings = (earningsResult.data ?? []).map((d: Record<string, unknown>) => mapEarning(d as unknown as DbInstructorEarning));
  const totalEarnings = earnings.reduce((sum: number, e: InstructorEarning) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter((e: InstructorEarning) => e.status === 'pending').reduce((sum: number, e: InstructorEarning) => sum + e.amount, 0);
  const availableEarnings = earnings.filter((e: InstructorEarning) => e.status === 'available').reduce((sum: number, e: InstructorEarning) => sum + e.amount, 0);
  const withdrawnEarnings = earnings.filter((e: InstructorEarning) => e.status === 'withdrawn').reduce((sum: number, e: InstructorEarning) => sum + e.amount, 0);

  const courses = coursesResult.data ?? [];
  const totalStudents = (courses as Record<string, unknown>[]).reduce((sum, c) => sum + ((c.students_count as number) ?? 0), 0);

  const now = new Date();
  const monthlyRevenue: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthEarnings = earnings.filter((e: InstructorEarning) => {
      const ed = new Date(e.createdAt);
      return ed >= monthStart && ed <= monthEnd;
    });
    monthlyRevenue.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      amount: monthEarnings.reduce((sum: number, e: InstructorEarning) => sum + e.amount, 0),
    });
  }

  const courseMap = new Map<string, { title: string; sales: number; earnings: number }>();
  for (const e of earnings) {
    if (!e.courseId) continue;
    void e;
    const course = (courses as Record<string, unknown>[]).find((c) => c.id === e.courseId);
    const title = (course?.title as string) ?? 'Unknown Course';
    const existing = courseMap.get(e.courseId) ?? { title, sales: 0, earnings: 0 };
    existing.sales += 1;
    existing.earnings += e.amount;
    courseMap.set(e.courseId, existing);
  }
  const topCourses = Array.from(courseMap.entries())
    .map(([courseId, val]) => ({ courseId, ...val }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  return {
    totalEarnings,
    pendingEarnings,
    availableEarnings,
    withdrawnEarnings,
    courseSales: earnings.length,
    totalStudents,
    monthlyRevenue,
    topCourses,
  };
}

export async function getInstructorEarningsList(instructorId: string, limit = 20): Promise<InstructorEarning[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('instructor_earnings')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapEarning);
}
