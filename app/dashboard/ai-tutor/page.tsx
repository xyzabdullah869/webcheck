'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, CircleCheck as CheckCircle2, Circle,
  Clock, BookOpen, Code as Code2, FileText, Lightbulb, Trophy, RotateCcw,
  Loader as Loader2, CirclePlay as PlayCircle, GraduationCap, ChevronRight,
  X, Plus, History, Send, Brain, PenTool, FileQuestion, Zap,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { Whiteboard } from '@/components/whiteboard';
import {
  generateLessonStepsFromContent,
  getCourseContentContext,
  getTopicContent,
  getActiveTutorSessions,
  createTutorSession,
  updateTutorSession,
  updateTutorProgress,
  getAiTutorResponse,
  type TutorSession,
  type LessonStep,
  type CourseContentContext,
} from '@/lib/services/ai-tutor-service';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function AiTutorPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course');
  const topicId = searchParams.get('topic');

  const [sessions, setSessions] = React.useState<TutorSession[]>([]);
  const [activeSession, setActiveSession] = React.useState<TutorSession | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [lessonSteps, setLessonSteps] = React.useState<LessonStep[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [quizAnswer, setQuizAnswer] = React.useState<number | null>(null);
  const [quizResult, setQuizResult] = React.useState<'correct' | 'incorrect' | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  const [courseContext, setCourseContext] = React.useState<CourseContentContext | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);
  const [showWhiteboard, setShowWhiteboard] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'lesson' | 'chat' | 'whiteboard'>('lesson');

  React.useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const s = await getActiveTutorSessions(user.id);
      setSessions(s);

      if (courseId) {
        const ctx = await getCourseContentContext(courseId);
        setCourseContext(ctx);

        if (topicId) {
          const topic = await getTopicContent(topicId);
          if (topic) {
            startLessonFromTopic(topic.title, topic.description, topic.rich_content, topic.external_references);
          }
        }
      }

      setLoading(false);
    })();
  }, [user, courseId, topicId]);

  const startLessonFromTopic = async (
    topicTitle: string,
    topicDescription: string,
    topicNotes: string | null,
    topicReferences: { title: string; url: string; description: string }[]
  ) => {
    if (!user) return;
    setStarting(true);
    const steps = generateLessonStepsFromContent(topicTitle, topicDescription, topicNotes, topicReferences);
    setLessonSteps(steps);
    setCurrentStep(0);
    setQuizAnswer(null);
    setQuizResult(null);

    const session = await createTutorSession(user.id, topicTitle, steps);
    if (session) {
      setActiveSession(session);
      setSessions((prev) => [session, ...prev]);
    }
    setStarting(false);
  };

  const startLesson = async (topic: string) => {
    if (!user) return;
    setStarting(true);

    let topicNotes: string | null = null;
    let topicDescription = '';
    let topicRefs: { title: string; url: string; description: string }[] = [];

    if (courseContext) {
      const matchingTopic = courseContext.availableTopics.find((t) => t.title === topic);
      if (matchingTopic) {
        const topic = await getTopicContent(matchingTopic.id);
        if (topic) {
          topicNotes = topic.rich_content;
          topicDescription = topic.description;
          topicRefs = topic.external_references;
        }
      }
    }

    const steps = generateLessonStepsFromContent(topic, topicDescription, topicNotes, topicRefs);
    setLessonSteps(steps);
    setCurrentStep(0);
    setQuizAnswer(null);
    setQuizResult(null);

    const session = await createTutorSession(user.id, topic, steps);
    if (session) {
      setActiveSession(session);
      setSessions((prev) => [session, ...prev]);
    }
    setStarting(false);
  };

  const nextStep = async () => {
    if (!activeSession || currentStep >= lessonSteps.length - 1) return;
    const newStep = currentStep + 1;
    setCurrentStep(newStep);
    setQuizAnswer(null);
    setQuizResult(null);
    await updateTutorSession(activeSession.id, { current_step: newStep });
  };

  const prevStep = () => {
    if (currentStep <= 0) return;
    setCurrentStep(currentStep - 1);
    setQuizAnswer(null);
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    if (quizAnswer === null || !activeSession) return;
    const step = lessonSteps[currentStep];
    if (!step.quiz) return;

    const isCorrect = quizAnswer === step.quiz.correctIndex;
    setQuizResult(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      await updateTutorProgress(user!.id, activeSession.current_topic, { quizzes_passed: 1 });
    } else {
      await updateTutorProgress(user!.id, activeSession.current_topic, { quizzes_failed: 1 });
    }
  };

  const finishLesson = async () => {
    if (!activeSession || !user) return;
    await updateTutorSession(activeSession.id, { status: 'completed' });
    await updateTutorProgress(user.id, activeSession.current_topic, { lessons_completed: 1 });
    setActiveSession(null);
    setLessonSteps([]);
    setCurrentStep(0);
    const s = await getActiveTutorSessions(user.id);
    setSessions(s);
  };

  const resumeSession = (session: TutorSession) => {
    setActiveSession(session);
    setLessonSteps(session.lesson_content as LessonStep[]);
    setCurrentStep(session.current_step);
    setShowHistory(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);

    const response = await getAiTutorResponse(msg, {
      courseId: courseId ?? undefined,
      topicId: topicId ?? undefined,
      sessionHistory: chatMessages,
    });

    setChatMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setChatLoading(false);
  };

  const step = lessonSteps[currentStep];
  const progressPct = lessonSteps.length > 0 ? ((currentStep + 1) / lessonSteps.length) * 100 : 0;

  const stepIcons: Record<string, typeof BookOpen> = {
    explanation: BookOpen,
    code: Code2,
    diagram: FileText,
    example: Lightbulb,
    quiz: Trophy,
    summary: CheckCircle2,
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">AI Interactive Tutor</h1>
              <p className="mt-2 text-muted-foreground">
                Learn step-by-step with interactive lessons, chat, and a whiteboard.
                {courseContext && ` Connected to: ${courseContext.courseTitle}`}
              </p>
            </div>
            {sessions.length > 0 && !activeSession && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="mr-2 h-4 w-4" /> My Sessions
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            <Button variant={activeTab === 'lesson' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('lesson')}>
              <GraduationCap className="mr-1 h-4 w-4" /> Lessons
            </Button>
            <Button variant={activeTab === 'chat' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('chat')}>
              <Brain className="mr-1 h-4 w-4" /> AI Chat
            </Button>
            <Button variant={activeTab === 'whiteboard' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('whiteboard')}>
              <PenTool className="mr-1 h-4 w-4" /> Whiteboard
            </Button>
          </div>

          {/* Session history */}
          <AnimatePresence>
            {showHistory && sessions.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                <Card className="p-4 shadow-soft">
                  <h3 className="mb-3 font-display text-sm font-semibold">Continue a Previous Session</h3>
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{s.session_title}</p>
                          <p className="text-xs text-muted-foreground">Step {s.current_step + 1}/{s.total_steps} · {new Date(s.updated_at).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => resumeSession(s)}>Resume</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : activeTab === 'lesson' ? (
            activeSession && step ? (
              <div className="space-y-6">
                <Card className="overflow-hidden p-0 shadow-card">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Sparkles className="h-5 w-5" /></div>
                        <div>
                          <p className="text-xs text-white/80">AI Tutoring Session</p>
                          <h2 className="font-display text-lg font-bold">{activeSession.session_title}</h2>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" onClick={finishLesson}><X className="mr-1 h-4 w-4" /> End</Button>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>Progress: {Math.round(progressPct)}%</span>
                        <span>Step {currentStep + 1} of {lessonSteps.length}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                        <motion.div className="h-full rounded-full bg-white" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex flex-wrap items-center gap-2">
                  {lessonSteps.map((ls, i) => {
                    const Icon = stepIcons[ls.type] ?? BookOpen;
                    const isCompleted = i < currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div key={i} className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                        isCurrent ? 'border-primary bg-primary/10 text-primary' : isCompleted ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600' : 'border-border text-muted-foreground')}>
                        {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : isCurrent ? <Icon className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                        {ls.title.length > 20 ? ls.title.slice(0, 20) + '...' : ls.title}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    <Card className="p-6 shadow-soft">
                      <div className="flex items-center gap-2">
                        {(() => { const Icon = stepIcons[step.type] ?? BookOpen; return <Icon className="h-5 w-5 text-primary" />; })()}
                        <h3 className="font-display text-xl font-bold">{step.title}</h3>
                        <Badge variant="secondary" className="capitalize">{step.type}</Badge>
                      </div>
                      <div className="mt-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{step.content}</p>
                      </div>
                      {step.code && (
                        <div className="mt-4 overflow-hidden rounded-xl border bg-zinc-900">
                          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                            <span className="text-xs font-medium text-zinc-400">{step.language ?? 'code'}</span>
                            <Code2 className="h-4 w-4 text-zinc-500" />
                          </div>
                          <pre className="overflow-x-auto p-4 text-sm text-zinc-100"><code>{step.code}</code></pre>
                        </div>
                      )}
                      {step.quiz && (
                        <div className="mt-6 rounded-xl border p-5">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            <h4 className="font-display text-sm font-bold">{step.quiz.question}</h4>
                          </div>
                          <div className="mt-4 space-y-2">
                            {step.quiz.options.map((option, i) => {
                              const isSelected = quizAnswer === i;
                              const isCorrect = quizResult && i === step.quiz!.correctIndex;
                              const isWrong = quizResult === 'incorrect' && isSelected;
                              return (
                                <button key={i} onClick={() => !quizResult && setQuizAnswer(i)} disabled={!!quizResult}
                                  className={cn('flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-all',
                                    isCorrect ? 'border-emerald-500 bg-emerald-500/5' : isWrong ? 'border-rose-500 bg-rose-500/5' : isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                                    quizResult && !isCorrect && !isWrong && 'opacity-50')}>
                                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                                    isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isWrong ? 'border-rose-500 bg-rose-500 text-white' : isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30')}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  {option}
                                  {isCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                                </button>
                              );
                            })}
                          </div>
                          {quizResult && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('mt-4 rounded-lg p-3 text-sm', quizResult === 'correct' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400')}>
                              <p className="font-semibold">{quizResult === 'correct' ? 'Correct!' : 'Not quite right.'}</p>
                              <p className="mt-1">{step.quiz.explanation}</p>
                            </motion.div>
                          )}
                          {!quizResult && <Button className="mt-4" size="sm" onClick={submitQuiz} disabled={quizAnswer === null}>Submit Answer</Button>}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                  {currentStep === lessonSteps.length - 1 ? (
                    <Button onClick={finishLesson}><CheckCircle2 className="mr-2 h-4 w-4" /> Complete Lesson</Button>
                  ) : (
                    <Button onClick={nextStep} disabled={step.quiz && !quizResult}>Next Step <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <Card className="overflow-hidden p-0 shadow-card">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-center text-white">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                      <GraduationCap className="h-8 w-8" />
                    </motion.div>
                    <h2 className="mt-4 font-display text-2xl font-bold">Start an AI Tutoring Session</h2>
                    <p className="mt-2 text-sm text-white/80">Choose a topic from your course or type your own. The AI Tutor uses your actual course content.</p>
                  </div>
                </Card>

                {courseContext && courseContext.availableTopics.length > 0 ? (
                  <div>
                    <h3 className="mb-4 text-center font-display text-lg font-semibold">Topics from {courseContext.courseTitle}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {courseContext.availableTopics.map((topic, i) => (
                        <motion.div key={topic.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <Card className="group flex cursor-pointer items-center gap-3 p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card" onClick={() => startLesson(topic.title)}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white transition-transform group-hover:scale-110">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{topic.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{topic.content_type}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { icon: BookOpen, title: 'Browse a course to start', desc: 'Open a course from your dashboard' },
                      { icon: Brain, title: 'Ask questions', desc: 'Chat with the AI Tutor' },
                      { icon: PenTool, title: 'Use the whiteboard', desc: 'Draw diagrams and get explanations' },
                    ].map((f, i) => (
                      <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card className="flex flex-col items-center gap-2 p-5 text-center shadow-soft">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
                          <p className="text-sm font-semibold">{f.title}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : activeTab === 'chat' ? (
            <div className="space-y-4">
              <Card className="flex h-[500px] flex-col shadow-soft">
                <div className="flex items-center gap-2 border-b p-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-sm font-semibold">AI Tutor Chat</h3>
                  {courseContext && <Badge variant="secondary">{courseContext.courseTitle}</Badge>}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Brain className="h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-3 text-sm text-muted-foreground">Ask me anything about your course content!</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setChatInput('Explain the current topic')}>Explain topic</Button>
                        <Button size="sm" variant="outline" onClick={() => setChatInput('Summarize key points')}>Summarize</Button>
                        <Button size="sm" variant="outline" onClick={() => setChatInput('Create practice questions')}>Practice questions</Button>
                        <Button size="sm" variant="outline" onClick={() => setChatInput('What should I learn next?')}>Next topic</Button>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] rounded-xl p-3 text-sm',
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-xl bg-muted p-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
                    </div>
                  )}
                </div>
                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the AI Tutor..."
                      onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                    />
                    <Button size="sm" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                <h3 className="font-display text-sm font-semibold">Interactive Whiteboard</h3>
              </div>
              <Whiteboard className="h-[600px]" />
              <p className="text-xs text-muted-foreground">Draw diagrams, write formulas, create flowcharts, and use AI Explain to get visual explanations of your drawings.</p>
            </div>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
