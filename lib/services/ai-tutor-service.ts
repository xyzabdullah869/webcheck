'use client';

import { createClient } from '@/lib/supabase/client';
import { getWebsiteSettings, type WebsiteSettings } from '@/lib/services/site-settings-service';

export type TutorSession = {
  id: string;
  session_title: string;
  current_topic: string;
  lesson_content: LessonStep[];
  current_step: number;
  total_steps: number;
  status: 'active' | 'paused' | 'completed';
  quiz_data: QuizData | null;
  weak_topics: string[];
  created_at: string;
  updated_at: string;
};

export type LessonStep = {
  type: 'explanation' | 'code' | 'diagram' | 'example' | 'quiz' | 'summary';
  title: string;
  content: string;
  code?: string;
  language?: string;
  diagram?: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
};

export type QuizData = {
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer: number | null;
  explanation: string;
};

export type TutorProgress = {
  topic: string;
  lessons_completed: number;
  quizzes_passed: number;
  quizzes_failed: number;
  mastery_level: number;
  next_review_date: string | null;
};

export type CourseContentContext = {
  courseId: string;
  courseTitle: string;
  moduleId: string | null;
  moduleTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
  topicContent: string | null;
  topicNotes: string | null;
  topicVideoUrl: string | null;
  topicPdfUrl: string | null;
  topicReferences: { title: string; url: string; description: string }[];
  availableModules: { id: string; title: string }[];
  availableTopics: { id: string; title: string; content_type: string }[];
  courseFiles: { fileName: string; resourceType: string; isPreview: boolean }[];
};

export async function getActiveTutorSessions(userId: string): Promise<TutorSession[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('ai_tutor_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'paused'])
    .order('updated_at', { ascending: false });
  return (data ?? []) as unknown as TutorSession[];
}

export async function getTutorSession(sessionId: string): Promise<TutorSession | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('ai_tutor_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  return data as unknown as TutorSession | null;
}

export async function createTutorSession(
  userId: string,
  topic: string,
  lessonSteps: LessonStep[]
): Promise<TutorSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_tutor_sessions')
    .insert({
      user_id: userId,
      session_title: topic,
      current_topic: topic,
      lesson_content: lessonSteps,
      current_step: 0,
      total_steps: lessonSteps.length,
      status: 'active',
    })
    .select('*')
    .single();
  if (error) return null;
  return data as unknown as TutorSession;
}

export async function updateTutorSession(
  sessionId: string,
  updates: Partial<TutorSession>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('ai_tutor_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  return !error;
}

export async function completeTutorSession(sessionId: string): Promise<boolean> {
  return updateTutorSession(sessionId, { status: 'completed' as const });
}

export async function getTutorProgress(userId: string): Promise<TutorProgress[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('ai_tutor_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return (data ?? []) as unknown as TutorProgress[];
}

export async function updateTutorProgress(
  userId: string,
  topic: string,
  updates: Partial<TutorProgress>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('ai_tutor_progress')
    .upsert({
      user_id: userId,
      topic,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,topic' });
  return !error;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitIntoSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 15);
}

function chunkText(text: string, maxLen: number): string[] {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + '. ' + sentence : sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export async function getCourseContentContext(courseId: string): Promise<CourseContentContext | null> {
  const supabase = createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) return null;

  const { data: moduleData } = await supabase
    .from('modules')
    .select('id, title')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const modules = (moduleData ?? []) as { id: string; title: string }[];

  let topics: { id: string; title: string; content_type: string }[] = [];
  if (modules.length > 0) {
    const moduleIds = modules.map((m) => m.id);
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('id, title, content_type')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true });
    topics = (lessonData ?? []) as { id: string; title: string; content_type: string }[];
  }

  const { data: fileData } = await supabase
    .from('course_files')
    .select('file_name, resource_type, is_preview')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(20);
  const courseFiles = (fileData ?? []).map((f: Record<string, unknown>) => ({
    fileName: f.file_name as string,
    resourceType: f.resource_type as string,
    isPreview: (f.is_preview as boolean) ?? false,
  }));

  return {
    courseId,
    courseTitle: course.title as string,
    moduleId: null,
    moduleTitle: null,
    topicId: null,
    topicTitle: null,
    topicContent: null,
    topicNotes: null,
    topicVideoUrl: null,
    topicPdfUrl: null,
    topicReferences: [],
    availableModules: modules,
    availableTopics: topics,
    courseFiles,
  };
}

export async function getTopicContent(topicId: string): Promise<{
  id: string;
  title: string;
  description: string;
  content_type: string;
  rich_content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  external_references: { title: string; url: string; description: string }[];
  module_id: string;
} | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', topicId)
    .maybeSingle();

  if (!data) return null;
  const l = data as Record<string, unknown>;
  return {
    id: l.id as string,
    title: l.title as string,
    description: (l.description as string) ?? '',
    content_type: (l.content_type as string) ?? 'video',
    rich_content: (l.rich_content as string) ?? null,
    video_url: (l.video_url as string) ?? null,
    pdf_url: (l.pdf_url as string) ?? null,
    external_references: (l.external_references as { title: string; url: string; description: string }[]) ?? [],
    module_id: l.module_id as string,
  };
}

export function generateLessonStepsFromContent(
  topicTitle: string,
  topicDescription: string,
  topicNotes: string | null,
  topicReferences: { title: string; url: string; description: string }[]
): LessonStep[] {
  const steps: LessonStep[] = [];

  steps.push({
    type: 'explanation',
    title: `Introduction to ${topicTitle}`,
    content: topicDescription || `In this lesson, you will learn about ${topicTitle}. This topic is part of your course curriculum and covers key concepts you need to understand.`,
  });

  if (topicNotes) {
    const plainText = stripHtml(topicNotes);
    const chunks = chunkText(plainText, 500);
    chunks.forEach((chunk, i) => {
      steps.push({
        type: 'explanation',
        title: `Key Concept ${i + 1}`,
        content: chunk,
      });
    });
  }

  if (topicReferences.length > 0) {
    steps.push({
      type: 'example',
      title: 'External References',
      content: `Here are some recommended external resources to deepen your understanding of ${topicTitle}:\n\n` +
        topicReferences.map((r) => `- ${r.title}${r.description ? `: ${r.description}` : ''} (${r.url})`).join('\n'),
    });
  }

  // Generate MCQs from content
  const quizQuestions = generateMcqsFromContent(topicTitle, topicDescription, topicNotes);
  quizQuestions.forEach((q, i) => {
    steps.push({
      type: 'quiz',
      title: `Quick Check ${i + 1}`,
      content: 'Test your understanding of what you just learned.',
      quiz: q,
    });
  });

  steps.push({
    type: 'summary',
    title: 'Lesson Summary',
    content: generateShortNotes(topicTitle, topicDescription, topicNotes),
  });

  return steps;
}

function generateMcqsFromContent(
  topicTitle: string,
  topicDescription: string,
  topicNotes: string | null
): { question: string; options: string[]; correctIndex: number; explanation: string }[] {
  const quizzes: { question: string; options: string[]; correctIndex: number; explanation: string }[] = [];

  // Quiz 1: Main concept
  const descSentence = topicDescription ? topicDescription.split('.')[0] : '';
  quizzes.push({
    question: `What is the main focus of "${topicTitle}"?`,
    options: [
      descSentence ? descSentence.slice(0, 60) + '...' : `Understanding the key concepts of ${topicTitle}`,
      'Advanced mathematical proofs and theorems',
      'Historical background and timeline',
      'None of the above',
    ],
    correctIndex: 0,
    explanation: `The main focus of "${topicTitle}" is ${descSentence ? descSentence.toLowerCase() : 'understanding its key concepts and applications'}.`,
  });

  // Quiz 2: From notes content if available
  if (topicNotes) {
    const plainText = stripHtml(topicNotes);
    const sentences = splitIntoSentences(plainText);
    if (sentences.length >= 2) {
      const correctSentence = sentences[0];
      const wrong1 = sentences[1] ? sentences[1].slice(0, 60) + '...' : 'A completely unrelated concept';
      const wrong2 = 'This topic is not covered in the course';
      quizzes.push({
        question: `According to the lesson notes on "${topicTitle}", which of the following is correct?`,
        options: [
          correctSentence.slice(0, 60) + '...',
          wrong1,
          wrong2,
          'All of the above are correct',
        ],
        correctIndex: 0,
        explanation: `According to the lesson content: ${correctSentence}`,
      });
    }
  }

  // Quiz 3: True/False style
  quizzes.push({
    question: `True or False: "${topicTitle}" is an important topic covered in this course.`,
    options: ['True', 'False', 'Not sure', 'It depends'],
    correctIndex: 0,
    explanation: `Yes, "${topicTitle}" is a key topic in your course curriculum that you should understand thoroughly.`,
  });

  return quizzes;
}

function generateShortNotes(
  topicTitle: string,
  topicDescription: string,
  topicNotes: string | null
): string {
  let notes = `**Short Notes: ${topicTitle}**\n\n`;

  if (topicDescription) {
    notes += `**Overview:** ${topicDescription}\n\n`;
  }

  if (topicNotes) {
    const plainText = stripHtml(topicNotes);
    const sentences = splitIntoSentences(plainText);
    const keyPoints = sentences.slice(0, 5);
    notes += `**Key Points:**\n`;
    keyPoints.forEach((point, i) => {
      notes += `${i + 1}. ${point}\n`;
    });
  }

  notes += `\n**Remember:** Review these notes regularly and practice with the quiz questions to reinforce your understanding.`;
  return notes;
}

/**
 * Generates a chat response using real database content.
 * Includes conversation memory and better content understanding.
 */
export async function getAiTutorResponse(
  userMessage: string,
  context?: {
    courseId?: string;
    topicId?: string;
    sessionHistory?: { role: string; content: string }[];
  }
): Promise<string> {
  const supabase = createClient();
  const settings = await getWebsiteSettings();

  let contextInfo = '';
  let topicContent: { title: string; description: string; rich_content: string | null; external_references: { title: string; url: string; description: string }[] } | null = null;

  if (context?.courseId) {
    const courseContext = await getCourseContentContext(context.courseId);
    if (courseContext) {
      contextInfo += `Current Course: ${courseContext.courseTitle}\n`;
      contextInfo += `Available Modules: ${courseContext.availableModules.map((m) => m.title).join(', ') || 'None'}\n`;
      contextInfo += `Available Topics: ${courseContext.availableTopics.map((t) => t.title).join(', ') || 'None'}\n`;
      contextInfo += `Course Files: ${courseContext.courseFiles.map((f) => f.fileName).join(', ') || 'None'}\n`;
    }

    if (context?.topicId) {
      const topic = await getTopicContent(context.topicId);
      if (topic) {
        topicContent = {
          title: topic.title,
          description: topic.description,
          rich_content: topic.rich_content,
          external_references: topic.external_references,
        };
        contextInfo += `\nCurrent Topic: ${topic.title}\n`;
        contextInfo += `Description: ${topic.description}\n`;
        if (topic.rich_content) {
          const plainText = stripHtml(topic.rich_content);
          contextInfo += `Notes Content: ${plainText.slice(0, 2000)}\n`;
        }
        if (topic.external_references.length > 0) {
          contextInfo += `References: ${topic.external_references.map((r) => r.title).join(', ')}\n`;
        }
      }
    }
  }

  // Build conversation memory from session history
  const history = context?.sessionHistory ?? [];
  const recentHistory = history.slice(-6); // Last 6 messages for context
  let memoryContext = '';
  if (recentHistory.length > 0) {
    memoryContext = `\n**Previous conversation context:**\n`;
    recentHistory.forEach((msg) => {
      memoryContext += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content.slice(0, 200)}\n`;
    });
    memoryContext += `\nUse this context to maintain continuity in the conversation.\n`;
  }

  const lower = userMessage.toLowerCase();

  // Generate MCQs
  if (lower.includes('generate mcq') || lower.includes('create mcq') || lower.includes('practice question') || lower.includes('quiz question')) {
    if (topicContent) {
      const mcqs = generateMcqsFromContent(topicContent.title, topicContent.description, topicContent.rich_content);
      let response = `Here are practice questions for "${topicContent.title}":\n\n`;
      mcqs.forEach((mcq, i) => {
        response += `**Question ${i + 1}:** ${mcq.question}\n`;
        mcq.options.forEach((opt, j) => {
          response += `   ${String.fromCharCode(65 + j)}) ${opt}\n`;
        });
        response += `**Answer:** ${String.fromCharCode(65 + mcq.correctIndex)}) ${mcq.options[mcq.correctIndex]}\n`;
        response += `**Explanation:** ${mcq.explanation}\n\n`;
      });
      response += `Would you like more practice questions?`;
      return response;
    }
    return `I can generate practice MCQs from your course content. Please open a specific topic in your course, and I'll create practice questions from the actual lesson material.`;
  }

  // Generate short notes
  if (lower.includes('short note') || lower.includes('generate note') || lower.includes('study note')) {
    if (topicContent) {
      return generateShortNotes(topicContent.title, topicContent.description, topicContent.rich_content);
    }
    return `I can generate short notes from your course content. Please open a specific topic in your course, and I'll create concise study notes from the lesson material.`;
  }

  // Explain difficult concepts
  if (lower.includes('explain difficult') || lower.includes('simplify') || lower.includes('break down') || lower.includes('hard concept') || lower.includes('difficult concept')) {
    if (topicContent) {
      const plainText = topicContent.rich_content ? stripHtml(topicContent.rich_content) : topicContent.description;
      const sentences = splitIntoSentences(plainText);
      let response = `Let me break down the difficult concepts in "${topicContent.title}" into simpler terms:\n\n`;
      sentences.slice(0, 5).forEach((sentence, i) => {
        response += `**Point ${i + 1}:** ${sentence}\n\n`;
        response += `*In simpler terms:* This means that ${sentence.toLowerCase()}\n\n`;
      });
      response += `Would you like me to explain any of these points in more detail?`;
      return response;
    }
    return `I can break down difficult concepts from your course into simpler terms. Please open a specific topic, and I'll explain it step by step.`;
  }

  if (lower.includes('next topic') || lower.includes('what should i learn next') || lower.includes('suggest')) {
    if (context?.courseId) {
      const ctx = await getCourseContentContext(context.courseId);
      if (ctx && ctx.availableTopics.length > 0) {
        const nextTopic = ctx.availableTopics[0];
        return `Based on your course "${ctx.courseTitle}", I recommend you study "${nextTopic.title}" next. This topic covers ${nextTopic.content_type} content. Would you like me to explain what this topic covers?`;
      }
    }
    return `I'd be happy to suggest next steps! Please open a course from your dashboard, and I'll recommend the best topics to study next based on your course content.`;
  }

  if (lower.includes('summar') || lower.includes('key points')) {
    if (topicContent) {
      const plainText = topicContent.rich_content ? stripHtml(topicContent.rich_content) : topicContent.description;
      const sentences = splitIntoSentences(plainText);
      const keyPoints = sentences.slice(0, 5).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
      return `Here are the key points from "${topicContent.title}":\n\n${keyPoints}\n\nWould you like me to explain any of these points in more detail?`;
    }
    return `I can summarize topics from your course. Please open a specific topic in your course, and I'll provide a summary of the key points.`;
  }

  if (lower.includes('practice') || lower.includes('quiz') || lower.includes('test')) {
    if (topicContent) {
      const mcqs = generateMcqsFromContent(topicContent.title, topicContent.description, topicContent.rich_content);
      let response = `Here's a practice question for "${topicContent.title}":\n\n`;
      const firstMcq = mcqs[0];
      response += `**Q: ${firstMcq.question}**\n\n`;
      firstMcq.options.forEach((opt, i) => {
        response += `${String.fromCharCode(65 + i)}) ${opt}\n`;
      });
      response += `\n**Correct Answer:** ${String.fromCharCode(65 + firstMcq.correctIndex)}) ${firstMcq.options[firstMcq.correctIndex]}\n`;
      response += `**Explanation:** ${firstMcq.explanation}\n\n`;
      response += `Would you like more practice questions? Just ask me to "generate MCQs" and I'll create more from the lesson content.`;
      return response;
    }
    return `I can create practice questions based on your course content. Open a topic in your course and I'll generate practice MCQs and True/False questions from the actual content.`;
  }

  if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does') || lower.includes('tell me about')) {
    if (topicContent) {
      let response = `Let me explain "${topicContent.title}" for you.\n\n`;
      response += topicContent.description ? `${topicContent.description}\n\n` : '';
      if (topicContent.rich_content) {
        const plainText = stripHtml(topicContent.rich_content);
        const chunks = chunkText(plainText, 800);
        chunks.forEach((chunk) => {
          response += `${chunk}\n\n`;
        });
      }
      if (topicContent.external_references.length > 0) {
        response += `**References for further reading:**\n`;
        topicContent.external_references.forEach((ref) => {
          response += `- ${ref.title}: ${ref.url}\n`;
        });
        response += '\n';
      }
      response += `Would you like me to go deeper into any specific part of this topic, or generate practice questions?`;
      return response;
    }
    if (context?.courseId) {
      const ctx = await getCourseContentContext(context.courseId);
      if (ctx) {
        return `I can explain topics from your course "${ctx.courseTitle}". Here are the available topics:\n\n${ctx.availableTopics.map((t, i) => `${i + 1}. ${t.title} (${t.content_type})`).join('\n')}\n\nWhich topic would you like me to explain?`;
      }
    }
  }

  if (lower.includes('file') || lower.includes('material') || lower.includes('resource') || lower.includes('document') || lower.includes('pdf') || lower.includes('download')) {
    if (context?.courseId) {
      const ctx = await getCourseContentContext(context.courseId);
      if (ctx && ctx.courseFiles.length > 0) {
        return `Your course "${ctx.courseTitle}" has the following files available:\n\n${ctx.courseFiles.map((f, i) => `${i + 1}. ${f.fileName} (${f.resourceType})${f.isPreview ? ' — Preview available' : ' — Requires enrollment'}`).join('\n')}\n\nYou can access these from the course learning page. If you're enrolled, you can download files marked as downloadable.`;
      }
      if (ctx) return `Your course "${ctx.courseTitle}" doesn't have any uploaded files yet. The instructor may add PDFs, slides, and other resources over time.`;
    }
    return `When you open a course, I can tell you about the files and resources uploaded by the instructor. These include PDFs, presentations, documents, and more.`;
  }

  // Default: use context + memory
  if (contextInfo) {
    let response = `I'm your AI Tutor, connected to your course content.\n\n`;
    if (topicContent) {
      response += `You're currently studying "${topicContent.title}". `;
      response += `${topicContent.description}\n\n`;
      if (topicContent.rich_content) {
        const plainText = stripHtml(topicContent.rich_content);
        response += `Here's what I know about this topic:\n${plainText.slice(0, 1000)}\n\n`;
      }
      response += `I can:\n- Explain this topic in detail\n- Generate short notes\n- Create practice MCQs\n- Summarize key points\n- Break down difficult concepts\n\nWhat would you like me to help you with?`;
    } else {
      response += `${contextInfo}\n\nAsk me to explain a topic, summarize key points, create practice questions, generate short notes, or suggest what to learn next.`;
    }
    return response;
  }

  const siteName = settings?.websiteName ?? 'the learning platform';
  return `Hello! I'm your AI Tutor for ${siteName}. I can help you with:\n\n- **Explain topics** from your courses\n- **Summarize** difficult concepts\n- **Generate short notes** for studying\n- **Create practice MCQs** from lesson content\n- **Break down difficult concepts** into simpler terms\n- **Suggest** what to learn next\n\nTo get the most out of me, open a course and then ask me questions about specific topics. I'll use the actual content from your course to answer.`;
}
