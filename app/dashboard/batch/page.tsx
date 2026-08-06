'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Calendar, Clock, GraduationCap, Loader as Loader2 } from 'lucide-react';
import { StudentSidebar } from '@/components/student-sidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type BatchInfo = {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string | null;
  class_days: string[];
  class_time: string;
  class_duration_minutes: number;
  max_students: number;
  course_title: string | null;
  teacher_display_name: string | null;
  teacher_profile_photo: string | null;
  enrolled_count: number;
};

export default function MyBatchPage() {
  const { user, loading: authLoading } = useAuth();
  const [batch, setBatch] = React.useState<BatchInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      if (!user) { if (!authLoading) setLoading(false); return; }
      const supabase = createClient();

      const { data: batchStudent } = await supabase
        .from('batch_students')
        .select('batch_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!batchStudent) {
        setLoading(false);
        return;
      }

      const batchId = (batchStudent as Record<string, unknown>).batch_id as string;

      const { data: batchData } = await supabase
        .from('batches')
        .select(`
          id, batch_name, start_date, end_date, class_days, class_time,
          class_duration_minutes, max_students,
          courses!batches_course_id_fkey(title),
          teachers!batches_teacher_id_fkey(display_name, profile_photo)
        `)
        .eq('id', batchId)
        .maybeSingle();

      if (!batchData) {
        setLoading(false);
        return;
      }

      const b = batchData as Record<string, unknown>;
      const course = b.courses as Record<string, unknown> | null;
      const teacher = b.teachers as Record<string, unknown> | null;

      const { count } = await supabase
        .from('batch_students')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId);

      setBatch({
        id: b.id as string,
        batch_name: b.batch_name as string,
        start_date: b.start_date as string,
        end_date: (b.end_date as string) ?? null,
        class_days: (b.class_days as string[]) ?? [],
        class_time: (b.class_time as string) ?? '',
        class_duration_minutes: b.class_duration_minutes as number,
        max_students: b.max_students as number,
        course_title: (course?.title as string) ?? null,
        teacher_display_name: (teacher?.display_name as string) ?? null,
        teacher_profile_photo: (teacher?.profile_photo as string) ?? null,
        enrolled_count: count ?? 0,
      });
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen">
        <StudentSidebar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Batch</h1>
          <p className="mt-1 text-muted-foreground">View your assigned batch and teacher details.</p>
        </div>

        {!batch ? (
          <Card className="p-8 shadow-soft">
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No Batch Assigned Yet"
              description="You are not enrolled in any batch. Browse courses and enroll to join a batch."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        ) : (
          <Card className="p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">{batch.batch_name}</h2>
                {batch.course_title && <p className="text-sm text-muted-foreground">{batch.course_title}</p>}
              </div>
              <Badge variant="secondary">{batch.enrolled_count}/{batch.max_students} students</Badge>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                {batch.teacher_profile_photo ? (
                  <Image src={batch.teacher_profile_photo} alt={batch.teacher_display_name ?? 'Teacher'} width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">{(batch.teacher_display_name ?? 'T').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-semibold">{batch.teacher_display_name ?? 'Teacher TBA'}</p>
                <p className="text-xs text-muted-foreground">Your assigned teacher (assigned by admin)</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Class Days</p>
                  <p className="font-medium">{batch.class_days.length > 0 ? batch.class_days.map((d) => DAY_NAMES[parseInt(d)] ?? d).join(', ') : 'TBD'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Class Time</p>
                  <p className="font-medium">{batch.class_time || 'TBD'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{batch.class_duration_minutes} min/session</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(batch.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {batch.course_title && (
              <Button asChild className="mt-5">
                <Link href="/dashboard/courses">Go to My Courses</Link>
              </Button>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
