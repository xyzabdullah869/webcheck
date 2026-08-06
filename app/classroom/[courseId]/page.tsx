'use client';

import * as React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Loader as Loader2, Send, Mic, MicOff, Volume2,
  Pause, Play, Square, Brain, BookOpen, PenTool, Eye, GraduationCap,
  Languages, Clock, FileText, Lightbulb,
  X, Users, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getClassroomController, type ClassroomControllerState } from '@/lib/ai/classroom-controller';
import type { ClassroomMessage, TeachingMode, SupportedLanguage, VoiceType } from '@/lib/ai/types';
import { getAiSettings, getVoiceSettings } from '@/lib/ai/settings-service';

const TEACHING_MODES: { value: TeachingMode; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'child_friendly', label: 'Child Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'exam_prep', label: 'Exam Preparation' },
  { value: 'interview_prep', label: 'Interview Preparation' },
];

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'roman-ur', label: 'Roman Urdu' },
  { value: 'mixed', label: 'Mixed' },
];

export default function AIClassroomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const courseId = params.courseId as string;
  const lessonId = searchParams.get('lesson') ?? null;

  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [sessionActive, setSessionActive] = React.useState(false);
  const [messages, setMessages] = React.useState<ClassroomMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [state, setState] = React.useState<ClassroomControllerState | null>(null);
  const [courseTitle, setCourseTitle] = React.useState('AI Classroom');
  const [lessonTitle, setLessonTitle] = React.useState<string | null>(null);
  const [teachingMode, setTeachingMode] = React.useState<TeachingMode>('beginner');
  const [language, setLanguage] = React.useState<SupportedLanguage>('en');
  const [selectedVoice, setSelectedVoice] = React.useState<VoiceType>('female');
  const [voiceReady, setVoiceReady] = React.useState(false);
  const [interimText, setInterimText] = React.useState('');
  const [visualItems, setVisualItems] = React.useState<{ id: string; type: string; title: string; content: string; language?: string }[]>([]);
  const [assignedTeacher, setAssignedTeacher] = React.useState<{ display_name: string; profile_photo: string | null } | null>(null);

  const controller = React.useRef(getClassroomController());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: course } = await supabase
        .from('courses')
        .select('title, teaching_mode')
        .eq('id', courseId)
        .maybeSingle();
      if (course) {
        const c = course as Record<string, unknown>;
        setCourseTitle(c.title as string);
      }

      const [enrollmentResult, batchResult] = await Promise.all([
        supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
        supabase.from('batch_students').select('batch_id').eq('user_id', user.id).maybeSingle(),
      ]);

      if (!enrollmentResult.data && !batchResult.data) {
        toast({ title: 'Enrollment required', description: 'Please enroll in this course or join a batch first.', variant: 'destructive' });
        router.push(`/courses/${courseId}/batches`);
        return;
      }

      if (lessonId) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('title')
          .eq('id', lessonId)
          .maybeSingle();
        if (lesson) setLessonTitle((lesson as Record<string, unknown>).title as string);
      }

      const [settings, voiceSettings] = await Promise.all([getAiSettings(), getVoiceSettings()]);
      setLanguage(settings.defaultLanguage);
      setSelectedVoice(voiceSettings.defaultVoice);
      setVoiceReady(voiceSettings.isEnabled && settings.voiceEnabled);

      setLoading(false);
    })();
  }, [courseId, lessonId, router]);

  React.useEffect(() => {
    const unsub = controller.current.onStateChange(setState);
    return unsub;
  }, []);

  React.useEffect(() => {
    const unsub = controller.current.onMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  React.useEffect(() => {
    const visualEngine = controller.current.getVisualEngine();
    const unsub = visualEngine.onStateChange((vs) => {
      setVisualItems(vs.items);
    });
    return unsub;
  }, []);

  const handleStartSession = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setStarting(true);
    try {
      const title = lessonTitle ? `${courseTitle} - ${lessonTitle}` : courseTitle;
      await controller.current.startSession(user.id, courseId, lessonId, title, teachingMode, language, selectedVoice);
      setSessionActive(true);
      toast({ title: 'AI Classroom started!' });

      // Auto-teach the first topic
      const topic = lessonTitle ?? courseTitle;
      setProcessing(true);
      await controller.current.teachTopicAction(topic);
      setProcessing(false);
    } catch {
      toast({ title: 'Failed to start session', variant: 'destructive' });
    }
    setStarting(false);
  };

  const handleSend = async () => {
    if (!input.trim() || processing) return;
    const message = input.trim();
    setInput('');
    setProcessing(true);
    await controller.current.handleStudentInterruption(message);
    setProcessing(false);
  };

  const handleVoiceInput = () => {
    const speech = controller.current.getSpeechEngine();
    if (!speech.isSupported()) {
      toast({ title: 'Speech recognition not supported in this browser', variant: 'destructive' });
      return;
    }

    if (speech.getIsListening()) {
      speech.stop();
      return;
    }

    speech.setLanguage(language);
    speech.setCallbacks({
      onResult: (text, isFinal) => {
        if (isFinal) {
          setInput(text);
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onEnd: () => setInterimText(''),
      onError: (err) => toast({ title: `Voice error: ${err}`, variant: 'destructive' }),
    });
    speech.start(false);
  };

  const handleEndSession = async () => {
    await controller.current.endSession();
    setSessionActive(false);
    toast({ title: 'Session ended' });
  };

  const handleModeChange = (mode: TeachingMode) => {
    setTeachingMode(mode);
    controller.current.setTeachingMode(mode);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    controller.current.setLanguage(lang);
  };

  const handleVoiceChange = (voice: VoiceType) => {
    setSelectedVoice(voice);
    controller.current.setVoice(voice);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  if (!sessionActive) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Button asChild variant="ghost" size="sm" className="mb-6">
              <Link href={lessonId ? `/courses/${courseId}/learn` : `/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>

            <Card className="overflow-hidden shadow-soft">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-center text-white">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"
                >
                  <Brain className="h-10 w-10" />
                </motion.div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Virtual Classroom</h1>
                <p className="mt-2 text-white/80">{courseTitle}</p>
                {lessonTitle && <p className="text-sm text-white/60">Lesson: {lessonTitle}</p>}
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <p className="text-center text-muted-foreground">
                  Your AI teacher will teach this lesson naturally — explaining concepts, giving examples, and adapting to your pace. You can interrupt anytime to ask questions.
                </p>

                {assignedTeacher && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                      {assignedTeacher.profile_photo ? <img src={assignedTeacher.profile_photo} alt={assignedTeacher.display_name} className="h-full w-full object-cover" /> : assignedTeacher.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{assignedTeacher.display_name}</p>
                      <p className="text-xs text-muted-foreground">Your assigned teacher for this course</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold"><GraduationCap className="h-4 w-4" /> Learning Mode</label>
                    <Select value={teachingMode} onValueChange={(v) => handleModeChange(v as TeachingMode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TEACHING_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold"><Languages className="h-4 w-4" /> Language</label>
                    <Select value={language} onValueChange={(v) => handleLanguageChange(v as SupportedLanguage)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Explain concepts naturally', 'Ask questions', 'Give real-life examples', 'Adapt to your pace', 'Interrupt anytime'].map((feat) => (
                    <Badge key={feat} variant="secondary" className="gap-1"><Zap className="h-3 w-3" /> {feat}</Badge>
                  ))}
                </div>

                <Button
                  onClick={handleStartSession}
                  disabled={starting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600"
                >
                  {starting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                  {starting ? 'Starting Classroom...' : 'Start AI Classroom'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold sm:text-base">{courseTitle}</h1>
              {state?.session?.currentTopic && <p className="text-xs text-muted-foreground">{state.session.currentTopic}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {voiceReady && state?.isVoiceSpeaking && !state?.isVoicePaused && (
              <Button size="sm" variant="outline" onClick={() => controller.current.pauseVoice()}><Pause className="h-4 w-4" /></Button>
            )}
            {voiceReady && state?.isVoicePaused && (
              <Button size="sm" variant="outline" onClick={() => controller.current.resumeVoice()}><Play className="h-4 w-4" /></Button>
            )}
            {voiceReady && state?.isVoiceSpeaking && (
              <Button size="sm" variant="outline" onClick={() => controller.current.stopVoice()}><Square className="h-4 w-4" /></Button>
            )}
            <Button size="sm" variant="destructive" onClick={handleEndSession}>End</Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat area */}
          <div className="flex flex-1 flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'student' ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-slate-800 border'}`}>
                      <div className="mb-1 flex items-center gap-2">
                        {msg.role === 'teacher' && <Brain className="h-3 w-3 text-blue-500" />}
                        <span className="text-xs font-semibold opacity-70">{msg.role === 'teacher' ? 'AI Teacher' : 'You'}</span>
                        {msg.action && msg.action !== 'chat' && <Badge variant="secondary" className="text-[10px]">{msg.action}</Badge>}
                      </div>
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}
                {processing && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border bg-white p-4 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-muted-foreground">AI Teacher is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick actions */}
            <div className="border-t bg-white px-4 py-2 dark:bg-slate-900">
              <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
                {['Explain again', 'Another example', 'Summarize', 'Quiz me', 'Explain in Urdu', 'Slow down'].map((action) => (
                  <Button key={action} size="sm" variant="outline" disabled={processing} onClick={() => { setInput(action); }} className="text-xs">
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t bg-white p-4 dark:bg-slate-900">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <Button size="icon" variant={state?.isListening ? 'destructive' : 'outline'} onClick={handleVoiceInput} className="shrink-0">
                  {state?.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Textarea
                  value={interimText || input}
                  onChange={(e) => { setInterimText(''); setInput(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={state?.isListening ? 'Listening...' : 'Ask a question or type a command...'}
                  rows={1}
                  className="min-h-[44px] resize-none"
                  disabled={processing}
                />
                <Button size="icon" onClick={handleSend} disabled={processing || (!input.trim() && !interimText)} className="shrink-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Side panel - Visual Learning + Whiteboard */}
          {(state?.whiteboardActive || state?.visualPanelVisible) && (
            <div className="hidden w-96 border-l bg-white p-4 dark:bg-slate-900 lg:block">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold"><Eye className="h-4 w-4" /> Visual Learning</h3>
                <Button size="sm" variant="ghost" onClick={() => controller.current.getVisualEngine().hide()}><X className="h-4 w-4" /></Button>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3">
                  {visualItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">{item.title}</p>
                      {item.type === 'code' ? (
                        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100"><code>{item.content}</code></pre>
                      ) : item.type === 'table' ? (
                        <pre className="overflow-x-auto text-xs">{item.content}</pre>
                      ) : (
                        <p className="text-sm">{item.content}</p>
                      )}
                    </Card>
                  ))}
                  {state?.whiteboardActive && (
                    <Card className="p-4">
                      <div className="mb-2 flex items-center gap-2"><PenTool className="h-4 w-4 text-blue-500" /><p className="text-xs font-semibold">Whiteboard Active</p></div>
                      <Badge variant="secondary" className="capitalize">{state.session?.currentTopic}</Badge>
                      <div className="mt-3 min-h-[200px] rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">AI whiteboard diagram</p>
                      </div>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
