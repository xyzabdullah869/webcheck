'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { categories as staticCategories } from '@/lib/data';
import { SectionTitle } from '@/components/section-title';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  coursesCount: number;
};

export function CategoriesSection() {
  const [cats, setCats] = React.useState<CategoryData[]>([]);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon, color, image')
        .order('name', { ascending: true });

      if (data && data.length > 0) {
        const { data: courseCounts } = await supabase
          .from('courses')
          .select('category_id')
          .eq('status', 'Published');

        const countMap = new Map<string, number>();
        (courseCounts ?? []).forEach((c: Record<string, unknown>) => {
          const id = c.category_id as string;
          countMap.set(id, (countMap.get(id) ?? 0) + 1);
        });

        const mapped: CategoryData[] = (data as Record<string, unknown>[]).map((c) => ({
          id: c.id as string,
          name: c.name as string,
          slug: c.slug as string,
          description: (c.description as string) ?? '',
          icon: (c.icon as string) ?? 'FolderTree',
          color: (c.color as string) ?? 'from-blue-500 to-cyan-500',
          coursesCount: countMap.get(c.id as string) ?? 0,
        }));
        setCats(mapped);
      } else {
        setCats(staticCategories.map((c) => ({ ...c })));
      }
    })();
  }, []);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Explore Topics"
          title="Browse by category"
          description="From foundational biology to advanced AI — find the perfect track for your goals."
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {cats.map((cat, i) => {
            const Icon =
              (Icons as unknown as Record<string, Icons.LucideIcon>)[cat.icon] ??
              Icons.FolderTree;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -6 }}
              >
                <Link href={`/categories/${cat.slug}`}>
                  <Card className="group relative h-full overflow-hidden p-5 shadow-soft transition-shadow hover:shadow-card">
                    <div
                      className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${cat.color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
                    />
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-soft`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold">
                      {cat.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {cat.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {cat.coursesCount > 0 ? `${cat.coursesCount} courses` : 'Coming soon'}
                      </span>
                      <Icons.ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
