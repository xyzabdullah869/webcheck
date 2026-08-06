'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bookmark, BookOpen, Trash2, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

type BookmarkItem = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  level: string;
  price: number;
};

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadBookmarks = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data: bookmarkData } = await supabase
      .from('bookmarks')
      .select('id, course_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!bookmarkData || bookmarkData.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = bookmarkData.map((b: Record<string, unknown>) => b.course_id as string).filter(Boolean);
    if (courseIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail, level, price')
      .in('id', courseIds);

    const courseMap = new Map((courses ?? []).map((c: Record<string, unknown>) => [c.id as string, c as Record<string, unknown>]));
    const merged: BookmarkItem[] = (bookmarkData ?? [])
      .filter((b: Record<string, unknown>) => b.course_id && courseMap.has(b.course_id as string))
      .map((b: Record<string, unknown>) => {
        const c = courseMap.get(b.course_id as string)! as Record<string, unknown>;
        return {
          id: b.id as string,
          course_id: c.id as string,
          title: c.title as string,
          slug: c.slug as string,
          thumbnail: (c.thumbnail as string) ?? null,
          level: (c.level as string) ?? 'Beginner',
          price: Number(c.price),
        };
      });

    setBookmarks(merged);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = async (id: string) => {
    const supabase = createClient();
    await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', user?.id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Bookmarked Courses</h1>
          <p className="mt-1 text-muted-foreground">Courses you've saved to revisit later.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="group flex h-full flex-col overflow-hidden shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <Link href={`/courses/${item.slug}`} className="block">
                    <div className="relative aspect-video overflow-hidden">
                      {item.thumbnail ? (
                        <Image src={item.thumbnail} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <Badge className="absolute right-3 top-3 border-0 bg-background/90 text-foreground backdrop-blur">
                        <Bookmark className="mr-1 h-3 w-3 fill-primary text-primary" />
                        Saved
                      </Badge>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 font-display text-base font-semibold">{item.title}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="secondary">{item.level}</Badge>
                        <span className="font-display text-lg font-bold">${item.price}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => removeBookmark(item.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Remove Bookmark
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<Bookmark className="h-7 w-7" />}
              title="No bookmarks yet"
              description="Save courses to find them quickly later. Click the bookmark icon on any course."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
