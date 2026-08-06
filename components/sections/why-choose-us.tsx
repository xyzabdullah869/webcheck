'use client';

import { motion } from 'framer-motion';
import { Award, Users as Users2, LaptopMinimal, Infinity as InfinityIcon, ShieldCheck, GraduationCap } from 'lucide-react';
import { SectionTitle } from '@/components/section-title';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Award,
    title: 'Verified Certificates',
    description:
      'Earn shareable certificates that validate your skills with employers and institutions.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users2,
    title: 'World-Class Instructors',
    description:
      'Learn directly from PhDs, researchers, and industry leaders in bioinformatics and AI.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: LaptopMinimal,
    title: 'Hands-On Projects',
    description:
      'Apply what you learn with real datasets, lab simulations, and guided coding exercises.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: InfinityIcon,
    title: 'Lifetime Access',
    description:
      'With Pro and Premium plans, revisit every lesson and resource whenever you need.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: ShieldCheck,
    title: 'Career-Ready Skills',
    description:
      'Curricula aligned with real-world roles in research labs, biotech, and data science.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: GraduationCap,
    title: 'Personalized Learning',
    description:
      'Track progress, get recommendations, and follow a roadmap tailored to your goals.',
    color: 'from-sky-500 to-blue-500',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Why Bioinformatics Hub"
          title="Everything you need to grow"
          description="A premium learning experience designed for serious learners and researchers."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
            >
              <Card className="group h-full p-6 shadow-soft transition-shadow hover:shadow-card">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-soft transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
