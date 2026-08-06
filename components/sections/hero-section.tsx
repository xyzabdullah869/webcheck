'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CirclePlay as PlayCircle, Star, Users, Sparkles, CircleCheck as CheckCircle2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

type HeroData = {
  badge: string;
  title: string;
  subtitle: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  image_url: string | null;
};

export function HeroSection() {
  const [hero, setHero] = React.useState<HeroData | null>(null);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('hero_sections').select('*').eq('id', 1).maybeSingle();
      if (data) setHero(data as HeroData);
    })();
  }, []);

  const badge = hero?.badge ?? 'Premium courses in bioinformatics, AI & data science';
  const title = hero?.title ?? 'Master Bioinformatics, Data Science & AI';
  const subtitle = hero?.subtitle ?? 'Learn from world-class instructors through hands-on courses in genomics, computational biology, machine learning, and programming. Build real skills, earn certificates, and advance your research career.';
  const primaryText = hero?.primary_button_text ?? 'Start Learning';
  const primaryLink = hero?.primary_button_link ?? '/dashboard';
  const secondaryText = hero?.secondary_button_text ?? 'Explore Courses';
  const secondaryLink = hero?.secondary_button_link ?? '/courses';
  const imageUrl = hero?.image_url ?? 'https://images.pexels.com/photos/8533040/pexels-photo-8533040.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 lg:pt-44">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-24 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse-glow" />
      <div className="absolute top-40 right-1/4 -z-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse-glow" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-start">
            <motion.span
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </motion.span>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              {title}
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              {subtitle}
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base shadow-glow">
                <Link href={primaryLink}>
                  {primaryText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base">
                <Link href={secondaryLink}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {secondaryText}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-violet-500/40 bg-violet-500/5 px-6 text-base text-violet-600 hover:bg-violet-500/10 dark:text-violet-400">
                <Link href="/referrals">
                  <Gift className="mr-2 h-5 w-5" />
                  Refer & Earn
                </Link>
              </Button>
            </motion.div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                7-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Verified certificates
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-float">
              <Image
                src={imageUrl}
                alt="Bioinformatics learning"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-transparent to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -left-4 top-8 hidden rounded-2xl border bg-card/90 p-3 shadow-float backdrop-blur sm:block animate-float"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">Expert-Led</p>
                  <p className="text-xs text-muted-foreground">Verified certificates</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute -right-4 bottom-8 hidden rounded-2xl border bg-card/90 p-3 shadow-float backdrop-blur sm:block animate-float-slow"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">Self-Paced</p>
                  <p className="text-xs text-muted-foreground">Learn anytime, anywhere</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute left-1/2 -bottom-4 hidden -translate-x-1/2 rounded-full border bg-card/90 px-4 py-2 shadow-float backdrop-blur md:block animate-float"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Certificate of Completion
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
