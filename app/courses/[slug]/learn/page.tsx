'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CirclePlay as PlayCircle, BookOpen, Loader as Loader2,
  CircleCheck as CheckCircle2, Circle, Clock, FileText, File as FileIcon,
  Download, Link as LinkIcon, ExternalLink, ChevronRight, Sparkles, Brain,
  Lock, GraduationCap,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { checkAndGenerateCertificate } from '@/lib/services/certificate-service';
import { cn } from '@/lib/utils';

type Lesson = {
  id: string;
  title: string;
  description: string;
  content_type: string;
  video_url: string;
  video_type: string;
  duration: string;
  duration_seconds: number;
  preview: boolean;
  rich_content: string | null;
  pdf_url: string | null;
  slides_url: string | null;
  resource_url: string | null;
  external_references: { title: string; url: string; description: string }[];
};

type Module = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  level: string;
  duration: string;
  lessons_count: number;
  instructor_name: string | null;
};

export default function CourseLearnPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [course, setCourse] = React.useState<CourseInfo | null>(null);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = React.useState<Lesson | null>(null);
  const [currentModuleId, setCurrentModuleId] = React.useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [enrolled, setEnrolled] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    (async () => {
      const supabase = createClient();
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
          id, title, slug, description, thumbnail, level, duration, lessons_count,
          profiles!courses_instructor_id_fkey(full_name)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (!courseData) { setLoading(false); return; }

      const c = courseData as Record<string, unknown>;
      const instructor = c.profiles as Record<string, unknown> | null;
      setCourse({
        id: c.id as string,
        title: c.title as string,
        slug: c.slug as string,
        description: (c.description as string) ?? '',
        thumbnail: (c.thumbnail as string) ?? '',
        level: (c.level as string) ?? 'Beginner',
        duration: (c.duration as string) ?? '',
        lessons_count: (c.lessons_count as number) ?? 0,
        instructor_name: (instructor?.full_name as string) ?? null,
      });

      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', c.id as string)
          .maybeSingle();
        setEnrolled(!!enrollment);

        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .eq('course_id', c.id as string);
        setCompletedLessons(new Set(
          (progress ?? []).filter((p: Record<string, unknown>) => p.completed).map((p: Record<string, unknown>) => p.lesson_id as string)
        ));
      }

      const { data: moduleData } = await supabase
        .from('modules')
        .select('id, title, description')
        .eq('course_id', c.id as string)
        .order('order_index', { ascending: true });

      if (moduleData && moduleData.length > 0) {
        const moduleIds = moduleData.map((m: Record<string, unknown>) => m.id as string);
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('order_index', { ascending: true });

        const lessonMap = new Map<string, Lesson[]>();
        (lessonData ?? []).forEach((l: Record<string, unknown>) => {
          const mid = l.module_id as string;
          if (!lessonMap.has(mid)) lessonMap.set(mid, []);
          lessonMap.get(mid)!.push({
            id: l.id as string,
            title: l.title as string,
            description: (l.description as string) ?? '',
            content_type: (l.content_type as string) ?? 'video',
            video_url: (l.video_url as string) ?? '',
            video_type: (l.video_type as string) ?? 'mp4',
            duration: (l.duration as string) ?? '',
            duration_seconds: (l.duration_seconds as number) ?? 0,
            preview: (l.preview as boolean) ?? false,
            rich_content: (l.rich_content as string) ?? null,
            pdf_url: (l.pdf_url as string) ?? null,
            slides_url: (l.slides_url as string) ?? null,
            resource_url: (l.resource_url as string) ?? null,
            external_references: (l.external_references as { title: string; url: string; description: string }[]) ?? [],
          });
        });

        const mods: Module[] = (moduleData ?? []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          title: m.title as string,
          description: (m.description as string) ?? '',
          lessons: lessonMap.get(m.id as string) ?? [],
        }));
        setModules(mods);

        const firstLesson = mods[0]?.lessons[0];
        if (firstLesson) {
          setCurrentLesson(firstLesson);
          setCurrentModuleId(mods[0].id);
        }
      }

      setLoading(false);
    })();
  }, [slug, user]);

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !course) return;
    const supabase = createClient();

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: course.id,
        completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });

    if (!error) {
      setCompletedLessons((prev) => new Set([...prev, lessonId]));

      const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const completedCount = completedLessons.size + 1;
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      await supabase
        .from('enrollments')
        .update({ progress, completed_at: progress >= 100 ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('course_id', course.id);

      if (progress >= 100) {
        await checkAndGenerateCertificate(user.id, course.id);
      }
    }
  };

  const selectLesson = (lesson: Lesson, moduleId: string) => {
    setCurrentLesson(lesson);
    setCurrentModuleId(moduleId);
  };

  const renderLessonContent = (lesson: Lesson) => {
    // Access control: non-enrolled users can only view preview lessons
    if (!lesson.preview && !enrolled) {
      return (
        <div className="flex aspect-video w-full items-center justify-center bg-black/90">
          <div className="text-center text-white/80">
            <Lock className="mx-auto h-16 w-16" />
            <p className="mt-3 font-display text-lg font-semibold">This lesson is locked</p>
            <p className="mt-1 text-sm text-white/60">Enroll in this course to access all lessons, downloads, and quizzes.</p>
            <Button asChild className="mt-4">
              <Link href={`/courses/${slug}/batches`}>
                <GraduationCap className="mr-2 h-4 w-4" /> Enroll Now
              </Link>
            </Button>
          </div>
        </div>
      );
    }
    switch (lesson.content_type) {
      case 'video':
        return (
          <div className="relative aspect-video bg-black">
            {lesson.video_url ? (
              lesson.video_type === 'youtube' ? (
                <iframe src={lesson.video_url} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={lesson.title} />
              ) : lesson.video_type === 'vimeo' ? (
                <iframe src={lesson.video_url} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={lesson.title} />
              ) : (
                <video src={lesson.video_url} controls className="h-full w-full" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/60">
                <div className="text-center">
                  <PlayCircle className="mx-auto h-16 w-16" />
                  <p className="mt-2 text-sm">No video available</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none p-6">
            {lesson.rich_content ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.rich_content }} />
            ) : (
              <p className="text-muted-foreground">No notes content available.</p>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="p-6">
            {lesson.pdf_url ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <FileIcon className="h-8 w-8 text-rose-500" />
                  <div className="flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground">PDF Document</p>
                  </div>
                  <Button asChild size="sm">
                    <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open PDF
                    </a>
                  </Button>
                </div>
                <iframe src={lesson.pdf_url} className="h-[600px] w-full rounded-xl border" title={lesson.title} />
              </div>
            ) : (
              <p className="text-muted-foreground">No PDF available.</p>
            )}
          </div>
        );

      case 'slides':
        return (
          <div className="p-6">
            {lesson.slides_url ? (
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <FileIcon className="h-8 w-8 text-orange-500" />
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">Slides / PowerPoint</p>
                </div>
                <Button asChild size="sm">
                  <a href={lesson.slides_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1 h-3.5 w-3.5" /> Download
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No slides available.</p>
            )}
          </div>
        );

      case 'resource':
        return (
          <div className="p-6">
            {lesson.resource_url ? (
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <Download className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">Downloadable Resource</p>
                </div>
                <Button asChild size="sm">
                  <a href={lesson.resource_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1 h-3.5 w-3.5" /> Download
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No resource available.</p>
            )}
          </div>
        );

      case 'reference':
        return (
          <div className="p-6">
            {lesson.external_references.length > 0 ? (
              <div className="space-y-3">
                {lesson.external_references.map((ref, idx) => (
                  <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                    <LinkIcon className="mt-0.5 h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{ref.title || ref.url}</p>
                      {ref.description && <p className="text-sm text-muted-foreground">{ref.description}</p>}
                      <p className="mt-1 truncate text-xs text-primary">{ref.url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No external references available.</p>
            )}
          </div>
        );

      default:
        return <div className="p-6"><p className="text-muted-foreground">Content not available.</p></div>;
    }
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

  if (!course) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-32">
          <EmptyState icon={<BookOpen className="h-7 w-7" />} title="Course not found" description="This course may not exist." action={{ label: 'Browse Courses', href: '/courses' }} />
        </main>
        <Footer />
      </>
    );
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const progressPct = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/courses/${course.slug}`}><ArrowLeft className="mr-2 h-4 w-4" />Course Details</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/ai-tutor?course=${course.id}`}>
              <Sparkles className="mr-1 h-4 w-4" /> AI Tutor
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600">
            <Link href={`/classroom/${course.id}${currentLesson ? `?lesson=${currentLesson.id}` : ''}`}>
              <Brain className="mr-1 h-4 w-4" /> AI Classroom
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Content area */}
          <div className="space-y-6 lg:col-span-2">
            {currentLesson ? (
              <>
                <Card className="overflow-hidden p-0 shadow-card">
                  {renderLessonContent(currentLesson)}
                  <div className="border-t p-6">
                    <h1 className="font-display text-xl font-bold">{currentLesson.title}</h1>
                    {currentLesson.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{currentLesson.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        disabled={completedLessons.has(currentLesson.id)}
                        size="sm"
                      >
                        {completedLessons.has(currentLesson.id) ? (
                          <><CheckCircle2 className="mr-2 h-4 w-4" />Completed</>
                        ) : (
                          <>Mark as Complete</>
                        )}
                      </Button>
                      <Badge variant="secondary" className="capitalize">{currentLesson.content_type}</Badge>
                      {currentLesson.duration && <Badge variant="outline">{currentLesson.duration}</Badge>}
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 shadow-soft">
                <EmptyState icon={<BookOpen className="h-7 w-7" />} title="No topics available" description="Topics will appear here once the instructor adds them." />
              </Card>
            )}
          </div>

          {/* Sidebar: course curriculum */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Curriculum</h2>
                <Badge variant="secondary">{progressPct}%</Badge>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{completedLessons.size} of {totalLessons} topics complete</p>

              <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
                {modules.map((mod, mi) => (
                  <div key={mod.id} className="rounded-xl border">
                    <div className="border-b p-3">
                      <p className="font-display text-sm font-semibold">{mi + 1}. {mod.title}</p>
                      <p className="text-xs text-muted-foreground">{mod.lessons.length} topics</p>
                    </div>
                    <div className="space-y-1 p-2">
                      {mod.lessons.map((lesson) => {
                        const isCompleted = completedLessons.has(lesson.id);
                        const isCurrent = currentLesson?.id === lesson.id;
                        const Icon = lesson.content_type === 'video' ? PlayCircle : lesson.content_type === 'notes' ? FileText : lesson.content_type === 'pdf' ? FileIcon : lesson.content_type === 'reference' ? LinkIcon : Download;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson, mod.id)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors',
                              isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-muted/40'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lesson.preview && !enrolled && <Badge variant="outline" className="text-[10px]">Free</Badge>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
