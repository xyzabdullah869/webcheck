'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Dna, FlaskConical, Brain, Code, Send, ArrowRight, LogIn, MessageSquare, Clock, Search, BookOpen, GitBranch, Database, Terminal, CircleHelp as HelpCircle, LayoutDashboard, Wallet, Gift, Award } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { aiTopics, aiSuggestedPrompts } from '@/lib/ai-knowledge';

const capabilities = [
  { icon: Dna, title: 'Bioinformatics', desc: 'BLAST, sequence alignment, phylogenetics, NGS analysis pipelines' },
  { icon: FlaskConical, title: 'Molecular Biology', desc: 'DNA, RNA, protein structure, gene expression, transcription' },
  { icon: Brain, title: 'Genomics & Proteomics', desc: 'Genome assembly, variant calling, mass spectrometry data' },
  { icon: Code, title: 'Python & R', desc: 'BioPython, pandas, Bioconductor, ggplot, data visualization' },
  { icon: Terminal, title: 'Linux & Databases', desc: 'Command-line tools, NCBI, GenBank, UniProt, Ensembl' },
  { icon: LayoutDashboard, title: 'Platform Guide', desc: 'Courses, dashboard, wallet, referrals, certificates, navigation' },
];

export default function AiAssistantPage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-glow"
            >
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
              AI Learning & Platform Assistant
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Your intelligent companion for mastering bioinformatics, coding, and navigating the platform. Ask about courses, concepts, tools, or anything else.
            </p>
          </div>

          {/* Capabilities */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, i) => (
              <motion.div key={cap.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="group flex flex-col items-center gap-3 p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white transition-transform group-hover:scale-110">
                    <cap.icon className="h-6 w-6" />
                  </div>
                  <p className="font-display text-sm font-bold">{cap.title}</p>
                  <p className="text-xs text-muted-foreground">{cap.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          {isAuthenticated ? (
            <Card className="mt-12 overflow-hidden p-0">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-center text-white">
                <MessageSquare className="mx-auto h-12 w-12" />
                <h2 className="mt-4 font-display text-xl font-bold">Ready to start learning?</h2>
                <p className="mt-2 text-sm text-white/80">
                  Open the AI Assistant chat from the floating button at the bottom-right corner of any page.
                </p>
                <div className="mt-6">
                  <Button asChild size="lg" variant="secondary">
                    <a href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="mt-12 overflow-hidden p-0">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-center text-white">
                <Sparkles className="mx-auto h-12 w-12" />
                <h2 className="mt-4 font-display text-xl font-bold">Start chatting with BioHub AI</h2>
                <p className="mt-2 text-sm text-white/80">
                  Sign in or create a free account to access the AI assistant, save your conversations, and get personalized help.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="secondary">
                    <a href="/login?redirect=/ai-assistant">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </a>
                  </Button>
                  <Button asChild size="lg" className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <a href="/register?redirect=/ai-assistant">
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Suggested prompts */}
          <div className="mt-12">
            <h2 className="text-center font-display text-xl font-bold">Try asking...</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {aiSuggestedPrompts.map((prompt, i) => (
                <motion.div key={prompt} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="group flex items-center gap-3 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Send className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{prompt}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* All topics */}
          <div className="mt-12">
            <h2 className="text-center font-display text-xl font-bold">Topics I can help with</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {aiTopics.map((topic) => (
                <Badge key={topic.id} variant="secondary" className="px-3 py-1.5 text-xs">
                  {topic.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note */}
          <p className="mt-12 text-center text-sm text-muted-foreground">
            The AI assistant guides students toward understanding rather than giving direct exam answers.
            It also helps you navigate courses, wallet, referrals, and certificates.
          </p>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
