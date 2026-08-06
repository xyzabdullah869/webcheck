'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Loader as Loader2, SlidersHorizontal, X } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { CourseCard } from '@/components/course-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [levelFilter, setLevelFilter] = React.useState<string>('all');
  const [priceFilter, setPriceFilter] = React.useState<'all' | 'free' | 'paid'>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [minRating, setMinRating] = React.useState<number>(0);
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: catData } = await supabase.from('categories').select('id, name').order('name');
      setCategories((catData ?? []) as { id: string; name: string }[]);
      setLoading(false);
    })();
  }, []);

  const filtered = courses.filter((c) => {
    if (levelFilter !== 'all' && c.level !== levelFilter) return false;
    if (priceFilter === 'free' && c.price > 0) return false;
    if (priceFilter === 'paid' && c.price === 0) return false;
    if (minRating > 0 && c.rating < minRating) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <Navbar />
      <main>
        <PageHeader eyebrow="Search" title="Find your next course" description="Search across all courses with powerful filters." />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses by title or description..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="sm:hidden">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>

          <div className={cn('mt-4 flex flex-wrap gap-3', !showFilters && 'hidden sm:flex')}>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as 'all' | 'free' | 'paid')} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Min Rating:</span>
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button key={r} onClick={() => setMinRating(r)} className={cn('rounded-full px-2 py-1 text-xs font-medium transition-colors', minRating === r ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted')}>
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)}
              </div>
            ) : (
              <Card className="p-6 shadow-soft">
                <EmptyState icon={<BookOpen className="h-7 w-7" />} title="No courses found" description={query || levelFilter !== 'all' || priceFilter !== 'all' || minRating > 0 ? 'Try adjusting your filters or search terms.' : 'Courses will appear here once published.'} />
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
