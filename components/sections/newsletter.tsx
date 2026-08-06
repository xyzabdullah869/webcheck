'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mail, CircleCheck as CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Newsletter() {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white shadow-float sm:p-12"
        >
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                Stay ahead in bioinformatics
              </h2>
              <p className="mt-2 max-w-md text-white/85">
                Get the latest course drops, research insights, and learning
                resources delivered to your inbox. No spam, ever.
              </p>
            </div>

            <div>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-xl bg-white/15 p-5 backdrop-blur"
                >
                  <CheckCircle2 className="h-8 w-8 shrink-0" />
                  <div>
                    <p className="font-semibold">You are subscribed!</p>
                    <p className="text-sm text-white/85">
                      Check your inbox for a welcome email.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-white/20 bg-white/10 text-white placeholder:text-white/70 focus-visible:ring-white"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 shrink-0 bg-white text-blue-600 hover:bg-white/90"
                  >
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
              <p className="mt-3 text-xs text-white/70">
                Join our community. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
