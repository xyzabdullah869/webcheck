'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, CircleCheck as CheckCircle2, Users, Award, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function BecomeInstructorCta() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Card className="relative overflow-hidden p-8 shadow-card">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Become an Instructor</h2>
                <p className="mt-3 text-muted-foreground">Share your expertise with thousands of students worldwide. Create courses, upload materials, and earn from your knowledge.</p>
                <ul className="mt-5 space-y-2">
                  {['Create and manage your own courses', 'Upload videos, PDFs, and learning resources', 'Track student progress and earnings', 'Get paid through secure withdrawals'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-6 h-12 rounded-xl px-6 text-base shadow-glow">
                  <Link href="/become-instructor">
                    Start Teaching Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="relative overflow-hidden p-8 shadow-card">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Become a Student</h2>
                <p className="mt-3 text-muted-foreground">Learn from expert instructors through hands-on courses. Track your progress, earn certificates, and advance your career.</p>
                <ul className="mt-5 space-y-2">
                  {['Access courses with videos, PDFs, and resources', 'Track your learning progress', 'Earn verified certificates', 'Get help from AI Tutor anytime'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" variant="outline" className="mt-6 h-12 rounded-xl px-6 text-base">
                  <Link href="/courses">
                    Explore Courses
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
