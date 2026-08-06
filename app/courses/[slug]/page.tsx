'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Star, Users, BookOpen, CircleCheck as CheckCircle2, CirclePlay as PlayCircle, ArrowLeft, Loader as Loader2, Globe, Award, ChartBar as BarChart3, Bookmark, GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-states';
import { CourseReviews } from '@/components/course-reviews';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { toggleBookmark, isBookmarked } from '@/lib/services/bookmark-service';
import { cn } from '@/lib/utils';

type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  what_you_will_learn: string[];
  requirements: string[];
  thumbnail: string;
  trailer_url: string;
  duration: string;
  lessons_count: number;
  level: string;
  language: string;
  price: number;
  original_price: number | null;
  tags: string[];
  rating: number;
  reviews_count: number;
  students_count: number;
  bestseller: boolean;
  is_new: boolean;
  certificate_enabled: boolean;
  category_name: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  instructor_bio: string | null;
};

type ModuleData = {
  id: string;
  title: string;
  description: string;
  lessons: { id: string; title: string; duration: string; preview: boolean }[];
};

type RelatedCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  level: string;
  rating: number;
  students_count: number;
  instructor_name: string | null;
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [modules, setModules] = React.useState<ModuleData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [enrolled, setEnrolled] = React.useState(false);
  const [relatedCourses, setRelatedCourses] = React.useState<RelatedCourse[]>([]);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [bookmarkToggling, setBookmarkToggling] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    (async () => {
      const supabase = createClient();
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
          id, title, slug, description, short_description, what_you_will_learn, requirements,
          thumbnail, trailer_url, duration, lessons_count, level, language, price, original_price,
          tags, rating, reviews_count, students_count, bestseller, is_new, certificate_enabled,
          category_id, instructor_id,
          categories(name), profiles!courses_instructor_id_fkey(full_name, avatar_url, bio)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (courseData) {
        const c = courseData as Record<string, unknown>;
        const category = c.categories as Record<string, unknown> | null;
        const instructor = c.profiles as Record<string, unknown> | null;
        setCourse({
          id: c.id as string,
          title: c.title as string,
          slug: c.slug as string,
          description: (c.description as string) ?? '',
          short_description: (c.short_description as string) ?? '',
          what_you_will_learn: (c.what_you_will_learn as string[]) ?? [],
          requirements: (c.requirements as string[]) ?? [],
          thumbnail: (c.thumbnail as string) ?? '',
          trailer_url: (c.trailer_url as string) ?? '',
          duration: (c.duration as string) ?? '',
          lessons_count: (c.lessons_count as number) ?? 0,
          level: (c.level as string) ?? 'Beginner',
          language: (c.language as string) ?? 'English',
          price: Number(c.price),
          original_price: c.original_price ? Number(c.original_price) : null,
          tags: (c.tags as string[]) ?? [],
          rating: Number(c.rating),
          reviews_count: (c.reviews_count as number) ?? 0,
          students_count: (c.students_count as number) ?? 0,
          bestseller: (c.bestseller as boolean) ?? false,
          is_new: (c.is_new as boolean) ?? false,
          certificate_enabled: (c.certificate_enabled as boolean) ?? true,
          category_name: (category?.name as string) ?? null,
          instructor_name: (instructor?.full_name as string) ?? null,
          instructor_avatar: (instructor?.avatar_url as string) ?? null,
          instructor_bio: (instructor?.bio as string) ?? null,
        });

        // Fetch modules and lessons
        const { data: moduleData } = await supabase
          .from('modules')
          .select('id, title, description')
          .eq('course_id', c.id as string)
          .order('order_index', { ascending: true });

        if (moduleData && moduleData.length > 0) {
          const moduleIds = moduleData.map((m: Record<string, unknown>) => m.id as string);
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('id, module_id, title, duration, preview')
            .in('module_id', moduleIds)
            .order('order_index', { ascending: true });

          const lessonMap = new Map<string, ModuleData['lessons']>();
          (lessonData ?? []).forEach((l: Record<string, unknown>) => {
            const mid = l.module_id as string;
            if (!lessonMap.has(mid)) lessonMap.set(mid, []);
            lessonMap.get(mid)!.push({
              id: l.id as string,
              title: l.title as string,
              duration: (l.duration as string) ?? '',
              preview: (l.preview as boolean) ?? false,
            });
          });

          setModules((moduleData ?? []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            title: m.title as string,
            description: (m.description as string) ?? '',
            lessons: lessonMap.get(m.id as string) ?? [],
          })));
        }

        // Check enrollment & bookmark
        if (user) {
          const [enrollmentResult, bookmarkResult] = await Promise.all([
            supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', c.id as string).maybeSingle(),
            isBookmarked(c.id as string),
          ]);
          setEnrolled(!!enrollmentResult.data);
          setBookmarked(bookmarkResult);
        }

        // Fetch related courses from same category
        const catId = c.category_id as string | null;
        if (catId) {
          const { data: related } = await supabase
            .from('courses')
            .select(`
              id, title, slug, thumbnail, price, level, rating, students_count,
              profiles!courses_instructor_id_fkey(full_name)
            `)
            .eq('category_id', catId)
            .eq('status', 'Published')
            .neq('id', c.id as string)
            .order('students_count', { ascending: false })
            .limit(4);

          if (related) {
            setRelatedCourses((related as Record<string, unknown>[]).map((r) => {
              const prof = r.profiles as Record<string, unknown> | null;
              return {
                id: r.id as string,
                title: r.title as string,
                slug: r.slug as string,
                thumbnail: (r.thumbnail as string) ?? null,
                price: Number(r.price) ?? 0,
                level: (r.level as string) ?? 'Beginner',
                rating: Number(r.rating) ?? 0,
                students_count: (r.students_count as number) ?? 0,
                instructor_name: (prof?.full_name as string) ?? null,
              };
            }));
          }
        }
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const handleBookmark = async () => {
    if (!course || !user) {
      toast({ title: 'Please sign in to bookmark courses', variant: 'destructive' });
      return;
    }
    setBookmarkToggling(true);
    const result = await toggleBookmark(course.id);
    setBookmarkToggling(false);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setBookmarked(result.bookmarked);
      toast({ title: result.bookmarked ? 'Course bookmarked' : 'Bookmark removed' });
    }
  };

  const handleEnroll = () => {
    if (!course || !user) return;
    router.push(`/courses/${course.slug}/batches`);
  };

  const handleStartFree = async () => {
    if (!course || !user) return;
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();
    if (!existing) {
      await supabase
        .from('enrollments')
        .insert({ user_id: user.id, course_id: course.id, progress: 0, enrolled_at: new Date().toISOString() });
    }
    router.push(`/courses/${course.slug}/learn`);
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
          <EmptyState
            icon={<BookOpen className="h-7 w-7" />}
            title="Course not found"
            description="This course may have been removed or is no longer available."
            action={{ label: 'Browse Courses', href: '/courses' }}
          />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero section */}
        <section className="relative overflow-hidden border-b bg-muted/20 pt-32 pb-12">
          <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to Courses</Link>
            </Button>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  {course.category_name && <Badge variant="secondary">{course.category_name}</Badge>}
                  <Badge variant="outline">{course.level}</Badge>
                  {course.bestseller && <Badge className="bg-amber-500 text-white border-0">Bestseller</Badge>}
                  {course.is_new && <Badge className="bg-emerald-500 text-white border-0">New</Badge>}
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
                <p className="mt-3 text-base text-muted-foreground">{course.short_description || course.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{course.rating || '—'}</span>
                    <span>({course.reviews_count})</span>
                  </span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.students_count.toLocaleString()} students</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration || '—'}</span>
                  <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{course.language}</span>
                  {course.certificate_enabled && <span className="flex items-center gap-1"><Award className="h-4 w-4" />Certificate</span>}
                </div>
                {course.instructor_name && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      {course.instructor_avatar ? (
                        <Image src={course.instructor_avatar} alt={course.instructor_name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-semibold">{course.instructor_name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{course.instructor_name}</p>
                      <p className="text-xs text-muted-foreground">Instructor</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar card */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden p-0 shadow-card">
                  <div className="relative aspect-video overflow-hidden">
                    {course.thumbnail ? (
                      <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500"><BookOpen className="h-12 w-12 text-white" /></div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold">${course.price}</span>
                        {course.original_price && course.original_price > course.price && (
                          <span className="text-lg text-muted-foreground line-through">${course.original_price}</span>
                        )}
                      </div>
                      {course.price > 0 && (
                        <span className="text-sm text-muted-foreground">≈ PKR {Math.round(course.price * 285).toLocaleString()}</span>
                      )}
                    </div>
                    {enrolled ? (
                      <Button asChild size="lg" className="mt-4 w-full">
                        <Link href={`/courses/${course.slug}/learn`}>
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Continue Learning
                        </Link>
                      </Button>
                    ) : course.price === 0 ? (
                      <Button size="lg" className="mt-4 w-full" onClick={handleStartFree}>
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Start Free Course
                      </Button>
                    ) : (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="lg"
                          className="flex-1"
                          onClick={handleEnroll}
                        >
                          <GraduationCap className="mr-2 h-5 w-5" />
                          Enroll Now
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={handleBookmark}
                          disabled={bookmarkToggling}
                          className="px-3"
                          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
                        >
                          <Bookmark className={cn('h-5 w-5', bookmarked && 'fill-primary text-primary')} />
                        </Button>
                      </div>
                    )}
                    <div className="mt-6 space-y-3 border-t pt-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4" />Level</span>
                        <span className="font-medium">{course.level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />Duration</span>
                        <span className="font-medium">{course.duration || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground"><BookOpen className="h-4 w-4" />Lessons</span>
                        <span className="font-medium">{course.lessons_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" />Language</span>
                        <span className="font-medium">{course.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground"><Award className="h-4 w-4" />Certificate</span>
                        <span className="font-medium">{course.certificate_enabled ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Content sections */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {/* Description */}
              {course.description && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-xl font-bold">About this course</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{course.description}</p>
                </Card>
              )}

              {/* What you'll learn */}
              {course.what_you_will_learn.length > 0 && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-xl font-bold">What you'll learn</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {course.what_you_will_learn.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Course content */}
              {modules.length > 0 && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-xl font-bold">Course content</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{modules.length} modules · {course.lessons_count} lessons</p>
                  <div className="mt-4 space-y-3">
                    {modules.map((mod, i) => (
                      <div key={mod.id} className="rounded-xl border">
                        <div className="flex items-center justify-between border-b p-4">
                          <p className="font-display text-sm font-semibold">{i + 1}. {mod.title}</p>
                          <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
                        </div>
                        <div className="space-y-1 p-2">
                          {mod.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40">
                              <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="flex-1 text-sm">{lesson.title}</span>
                              {lesson.preview && <Badge variant="outline" className="text-[10px]">Preview</Badge>}
                              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Requirements */}
              {course.requirements.length > 0 && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-xl font-bold">Requirements</h2>
                  <ul className="mt-4 space-y-2">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Reviews */}
              <CourseReviews courseId={course.id} enrolled={enrolled} />
            </div>

            {/* Instructor card */}
            <div className="lg:col-span-1">
              {course.instructor_name && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-lg font-semibold">Instructor</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full">
                      {course.instructor_avatar ? (
                        <Image src={course.instructor_avatar} alt={course.instructor_name} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-xl font-semibold">{course.instructor_name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold">{course.instructor_name}</p>
                      <p className="text-xs text-muted-foreground">Bioinformatics Instructor</p>
                    </div>
                  </div>
                  {course.instructor_bio && <p className="mt-3 text-sm text-muted-foreground">{course.instructor_bio}</p>}
                </Card>
              )}

              {/* Tags */}
              {course.tags.length > 0 && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-sm font-semibold">Tags</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
        {/* Related courses */}
        {relatedCourses.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold">Related courses</h2>
            <p className="mt-1 text-sm text-muted-foreground">More courses in the same category</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedCourses.map((rc, i) => (
                <motion.div
                  key={rc.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link href={`/courses/${rc.slug}`}>
                    <Card className="group h-full overflow-hidden p-0 shadow-soft transition-shadow hover:shadow-card">
                      <div className="relative aspect-video overflow-hidden">
                        {rc.thumbnail ? (
                          <Image src={rc.thumbnail} alt={rc.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500"><BookOpen className="h-10 w-10 text-white" /></div>
                        )}
                      </div>
                      <div className="p-4">
                        <Badge variant="outline" className="mb-2 text-[10px]">{rc.level}</Badge>
                        <h3 className="font-display text-sm font-semibold line-clamp-2 group-hover:text-primary">{rc.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{rc.instructor_name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-sm font-bold">{rc.price === 0 ? 'Free' : `${rc.price.toFixed(2)}`}</span>
                          {rc.rating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{rc.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
