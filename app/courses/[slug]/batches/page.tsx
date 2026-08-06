'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, Clock, GraduationCap, Loader as Loader2, CircleCheck as CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getAvailableBatchesWithTeacher, enrollStudent, type BatchWithTeacher } from '@/lib/batches/batch-service';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BatchSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = React.useState<{ id: string; title: string } | null>(null);
  const [batches, setBatches] = React.useState<BatchWithTeacher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [enrolling, setEnrolling] = React.useState<string | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('slug', slug)
        .maybeSingle();

      if (!courseData) {
        setLoading(false);
        return;
      }

      const c = courseData as Record<string, unknown>;
      setCourse({ id: c.id as string, title: c.title as string });

      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', c.id as string)
          .maybeSingle();
        if (enrollment) {
          setAlreadyEnrolled(true);
          setLoading(false);
          return;
        }
      }

      try {
        const batchData = await getAvailableBatchesWithTeacher(c.id as string);
        setBatches(batchData);
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const handleEnroll = async (batchId: string) => {
    if (!user) {
      router.push('/login?redirect=/courses/' + slug + '/batches');
      return;
    }
    setEnrolling(batchId);
    try {
      const ok = await enrollStudent(batchId, user.id);
      if (ok) {
        toast({ title: 'Enrollment complete!', description: 'You have been enrolled in the batch.' });
        router.push('/dashboard/courses');
      } else {
        toast({ title: 'Enrollment failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Enrollment failed', variant: 'destructive' });
    }
    setEnrolling(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/courses/${slug}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Course</Link>
          </Button>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Available Batches</h1>
            <p className="mt-1 text-muted-foreground">
              {course ? `Select a batch for "${course.title}"` : 'Select a batch to enroll'}
            </p>
          </div>

          {alreadyEnrolled ? (
            <Card className="p-8 shadow-soft">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <h2 className="font-display text-xl font-bold">You are already enrolled</h2>
                <p className="text-sm text-muted-foreground">You can access this course from your dashboard.</p>
                <Button asChild className="mt-2"><Link href="/dashboard/courses">Go to My Courses</Link></Button>
              </div>
            </Card>
          ) : batches.length === 0 ? (
            <Card className="p-8 shadow-soft">
              <EmptyState
                icon={<Calendar className="h-7 w-7" />}
                title="No Batch Available Yet"
                description="There are currently no open batches for this course. Please check back later or contact support."
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {batches.map((batch, i) => {
                const seatsLeft = batch.max_students - batch.enrolled_count;
                return (
                  <motion.div key={batch.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="h-full p-6 shadow-soft transition-all hover:shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-bold">{batch.batch_name}</h3>
                          <p className="text-xs text-muted-foreground">Starts {new Date(batch.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <Badge variant={seatsLeft <= 5 ? 'destructive' : 'secondary'} className="shrink-0">
                          {seatsLeft} seats left
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-center gap-3 rounded-xl border p-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                          {batch.teacher_profile_photo ? (
                            <Image src={batch.teacher_profile_photo} alt={batch.teacher_display_name ?? 'Teacher'} width={48} height={48} className="h-full w-full object-cover" />
                          ) : (
                            <span>{(batch.teacher_display_name ?? 'T').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{batch.teacher_display_name ?? 'Teacher TBA'}</p>
                          <p className="text-xs text-muted-foreground">Assigned Teacher</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Class Days:</span>
                          <span className="font-medium text-foreground">
                            {batch.class_days.length > 0
                              ? batch.class_days.map((d) => DAY_NAMES[parseInt(d)] ?? d).join(', ')
                              : 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Class Time:</span>
                          <span className="font-medium text-foreground">{batch.class_time || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duration:</span>
                          <span className="font-medium text-foreground">{batch.class_duration_minutes} min/session</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Capacity:</span>
                          <span className="font-medium text-foreground">{batch.enrolled_count}/{batch.max_students}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          <span>Start Date:</span>
                          <span className="font-medium text-foreground">{new Date(batch.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>

                      <Button
                        className="mt-5 w-full"
                        onClick={() => handleEnroll(batch.id)}
                        disabled={enrolling === batch.id}
                      >
                        {enrolling === batch.id ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enrolling...</>
                        ) : (
                          <>Enroll in This Batch</>
                        )}
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
