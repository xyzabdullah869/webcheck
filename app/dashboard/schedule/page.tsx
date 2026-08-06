'use client';

import * as React from 'react';
import { Calendar, Clock, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ScheduleItem = {
  id: string;
  batch_name: string;
  course_title: string | null;
  teacher_display_name: string | null;
  class_days: string[];
  class_time: string;
  class_duration_minutes: number;
};

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      if (!user) { if (!authLoading) setLoading(false); return; }
      const supabase = createClient();

      const { data: batchStudents } = await supabase
        .from('batch_students')
        .select('batch_id')
        .eq('user_id', user.id);

      if (!batchStudents || batchStudents.length === 0) {
        setLoading(false);
        return;
      }

      const batchIds = (batchStudents as Record<string, unknown>[]).map((bs) => bs.batch_id as string);

      const { data: batches } = await supabase
        .from('batches')
        .select(`
          id, batch_name, class_days, class_time, class_duration_minutes,
          courses!batches_course_id_fkey(title),
          teachers!batches_teacher_id_fkey(display_name)
        `)
        .in('id', batchIds)
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (batches) {
        setSchedules((batches as Record<string, unknown>[]).map((b) => {
          const course = b.courses as Record<string, unknown> | null;
          const teacher = b.teachers as Record<string, unknown> | null;
          return {
            id: b.id as string,
            batch_name: b.batch_name as string,
            course_title: (course?.title as string) ?? null,
            teacher_display_name: (teacher?.display_name as string) ?? null,
            class_days: (b.class_days as string[]) ?? [],
            class_time: (b.class_time as string) ?? '',
            class_duration_minutes: b.class_duration_minutes as number,
          };
        }));
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const byDay: Record<number, ScheduleItem[]> = {};
  schedules.forEach((s) => {
    s.class_days.forEach((d) => {
      const dayNum = parseInt(d);
      if (!isNaN(dayNum)) {
        if (!byDay[dayNum]) byDay[dayNum] = [];
        byDay[dayNum].push(s);
      }
    });
  });

  return (
    <div>
      <main>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Schedule</h1>
          <p className="mt-1 text-muted-foreground">Your weekly class schedule across all enrolled batches.</p>
        </div>

        {schedules.length === 0 ? (
          <Card className="p-8 shadow-soft">
            <EmptyState
              icon={<Calendar className="h-7 w-7" />}
              title="No Schedule Yet"
              description="You are not enrolled in any active batch. Browse courses to join a batch."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {DAY_NAMES.map((dayName, dayNum) => {
              const items = byDay[dayNum] ?? [];
              if (items.length === 0) return null;
              return (
                <Card key={dayNum} className="p-5 shadow-soft">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {DAY_SHORT[dayNum]}
                    </div>
                    <h3 className="font-display text-sm font-bold">{dayName}</h3>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{item.batch_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.course_title ?? 'Course'} · {item.teacher_display_name ?? 'Teacher TBA'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-[10px]">{item.class_time || 'TBD'}</Badge>
                          <p className="mt-1 text-[10px] text-muted-foreground">{item.class_duration_minutes} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
