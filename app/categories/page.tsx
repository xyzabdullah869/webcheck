'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Loader as Loader2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  icon: string | null;
  color: string | null;
  is_featured: boolean;
  courseCount: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image, icon, color, is_featured, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Get course counts for each category
      const cats = data as Record<string, unknown>[];
      const categoriesWithCounts = await Promise.all(
        cats.map(async (cat) => {
          const { count } = await supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', cat.id as string)
            .eq('status', 'Published');
          return {
            id: cat.id as string,
            name: cat.name as string,
            slug: cat.slug as string,
            description: (cat.description as string) ?? '',
            image: (cat.image as string) || null,
            icon: (cat.icon as string) || null,
            color: (cat.color as string) || null,
            is_featured: (cat.is_featured as boolean) ?? false,
            courseCount: count ?? 0,
          };
        })
      );
      setCategories(categoriesWithCounts);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Categories"
          title="Browse all categories"
          description="Explore our learning tracks spanning biology, technology, business, and beyond."
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : categories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/categories/${cat.slug}`}>
                  <Card className="group h-full overflow-hidden shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                          <BookOpen className="h-10 w-10 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                          <h3 className="font-display text-lg font-bold text-white">{cat.name}</h3>
                          <p className="text-xs text-white/80">{cat.courseCount > 0 ? `${cat.courseCount} ${cat.courseCount === 1 ? 'course' : 'courses'}` : 'No courses yet'}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="No categories yet"
              description="Categories will appear here once they are created by the admin."
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
