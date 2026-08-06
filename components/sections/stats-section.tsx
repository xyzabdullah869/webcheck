'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Users, BookOpen, Award, Globe as Globe2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { createClient } from '@/lib/supabase/client';
import type { Stat } from '@/lib/types';

const iconMap: Record<string, LucideIcon> = {
  Users,
  BookOpen,
  Award,
  Globe2,
};

const defaultStats: Stat[] = [
  { id: 'students', label: 'Active Students', value: 0, suffix: '+', icon: 'Users' },
  { id: 'courses', label: 'Expert Courses', value: 0, suffix: '+', icon: 'BookOpen' },
  { id: 'certificates', label: 'Certificates Issued', value: 0, suffix: '+', icon: 'Award' },
  { id: 'countries', label: 'Countries Reached', value: 0, suffix: '', icon: 'Globe2' },
];

export function StatsSection() {
  const [stats, setStats] = useState<Stat[]>(defaultStats);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [students, courses, certificates] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'Published'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
      ]);

      setStats([
        { id: 'students', label: 'Active Students', value: students.count ?? 0, suffix: '+', icon: 'Users' },
        { id: 'courses', label: 'Expert Courses', value: courses.count ?? 0, suffix: '+', icon: 'BookOpen' },
        { id: 'certificates', label: 'Certificates Issued', value: certificates.count ?? 0, suffix: '+', icon: 'Award' },
        { id: 'countries', label: 'Countries Reached', value: 0, suffix: '', icon: 'Globe2' },
      ]);
    })();
  }, []);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.icon] ?? Users;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <StatsCard stat={stat} index={i} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
