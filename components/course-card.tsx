'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Star, Users, ChartBar as BarChart3, CirclePlay as PlayCircle, Bookmark, Globe as Globe2, Loader as Loader2 } from 'lucide-react';
import type { Course } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { toggleBookmark } from '@/lib/services/bookmark-service';
import { cn } from '@/lib/utils';

const levelStyles: Record<Course['level'], string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Advanced: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarked, setBookmarked] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Please sign in to bookmark courses', variant: 'destructive' });
      return;
    }
    setToggling(true);
    const result = await toggleBookmark(course.id);
    setToggling(false);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setBookmarked(result.bookmarked);
      toast({ title: result.bookmarked ? 'Course bookmarked' : 'Bookmark removed' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-card"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex gap-2">
          {course.bestseller && (
            <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">
              Bestseller
            </Badge>
          )}
          {course.isNew && (
            <Badge className="border-0 bg-emerald-500 text-white hover:bg-emerald-500">
              New
            </Badge>
          )}
        </div>
        <button
          onClick={handleBookmark}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
          aria-label="Bookmark course"
          disabled={toggling}
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-primary text-primary')} />
          )}
        </button>
        <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button asChild size="sm" className="mb-3 shadow-glow">
            <Link href={`/courses/${course.slug}`}>
              <PlayCircle className="mr-1.5 h-4 w-4" />
              Preview
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{course.category}</span>
          <span>•</span>
          <span className={cn('rounded px-1.5 py-0.5 font-medium', levelStyles[course.level])}>
            {course.level}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>

        {/* Instructor */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative h-6 w-6 overflow-hidden rounded-full">
            <Image
              src={course.instructorAvatar}
              alt={course.instructorName}
              fill
              sizes="24px"
              className="object-cover"
            />
          </div>
          <span className="text-xs text-muted-foreground">{course.instructorName}</span>
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{course.rating || '—'}</span>
            <span>({course.reviews.toLocaleString()})</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.students.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          {course.language && (
            <span className="flex items-center gap-1">
              <Globe2 className="h-3.5 w-3.5" />
              {course.language}
            </span>
          )}
        </div>

        {/* Tags */}
        {course.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {course.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold">${course.price}</span>
              {course.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${course.originalPrice}
                </span>
              )}
            </div>
            {course.pricePkr ? (
              <span className="text-xs text-muted-foreground">≈ PKR {course.pricePkr.toLocaleString()}</span>
            ) : null}
          </div>
          <Button asChild size="sm" variant="default">
            <Link href={`/courses/${course.slug}`}>
              Enroll
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
