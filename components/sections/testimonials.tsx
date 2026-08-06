'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Star, MessageSquarePlus } from 'lucide-react';
import { SectionTitle } from '@/components/section-title';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';

type TestimonialData = {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  avatar: string | null;
};

export function Testimonials() {
  const [items, setItems] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      const { data: testimonials } = await supabase
        .from('testimonials')
        .select('id, name, role, content, avatar_url, rating, sort_order')
        .order('sort_order', { ascending: true })
        .limit(8);

      if (testimonials && testimonials.length > 0) {
        const mapped: TestimonialData[] = (testimonials as Record<string, unknown>[]).map((t) => ({
          id: t.id as string,
          name: (t.name as string) ?? 'Student',
          role: (t.role as string) ?? 'Learner',
          rating: (t.rating as number) ?? 5,
          text: (t.content as string) ?? '',
          avatar: (t.avatar_url as string) ?? null,
        }));
        setItems(mapped);
      } else {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, profiles!reviews_user_id_fkey(full_name, avatar_url, bio)')
          .not('comment', 'eq', '')
          .order('rating', { ascending: false })
          .limit(8);

        if (reviews && reviews.length > 0) {
          const mapped: TestimonialData[] = (reviews as Record<string, unknown>[]).map((r) => {
            const profile = r.profiles as Record<string, unknown> | null;
            return {
              id: r.id as string,
              name: (profile?.full_name as string) ?? 'Student',
              role: (profile?.bio as string) ?? 'Learner',
              rating: r.rating as number,
              text: r.comment as string,
              avatar: (profile?.avatar_url as string) ?? null,
            };
          });
          setItems(mapped);
        }
      }
      setLoading(false);
    })();
  }, []);

  return (
    <section className="bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Testimonials"
          title="Loved by learners worldwide"
          description="Real stories from students and researchers advancing their careers with us."
        />

        {!loading && items.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {items.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <Card className="flex h-full flex-col p-6 shadow-soft transition-shadow hover:shadow-card">
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-5 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 border-t pt-4">
                    {t.avatar && (
                      <img src={t.avatar} alt={t.name} className="h-8 w-8 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-12">
            <EmptyState
              icon={<MessageSquarePlus className="h-7 w-7" />}
              title="No testimonials yet"
              description="Student testimonials will appear here once learners complete courses and share their experiences."
            />
          </div>
        )}
      </div>
    </section>
  );
}
