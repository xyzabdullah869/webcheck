'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader as Loader2, RotateCcw, LogIn, Plus, Trash2, Search, MessageSquare, Clock, History } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  ChatMessage,
  ChatSession,
  generateSessionId,
  getAiResponse,
  saveChatMessage,
  getSessionMessages,
  getChatSessions,
  deleteChatSession,
  clearAllChats,
  searchChats,
} from '@/lib/services/ai-service';
import { aiSuggestedPrompts } from '@/lib/ai-knowledge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function formatTimestamp(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:opacity-80">$1</a>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2"><span class="text-primary">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2"><span class="text-primary font-semibold">$1.</span><span></span></div>')
    .replace(/\n/g, '<br/>');
}

export function AiChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [sessionId, setSessionId] = React.useState('');
  const [showAuthPrompt, setShowAuthPrompt] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<ChatSession[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, typing]);

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  React.useEffect(() => {
    if (open && user) {
      loadSessions();
    }
  }, [open, user]);

  const loadSessions = React.useCallback(async () => {
    if (!user) return;
    const s = await getChatSessions(user.id);
    setSessions(s);
  }, [user]);

  React.useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchChats(user.id, searchQuery);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const startNewSession = React.useCallback(() => {
    const sid = generateSessionId();
    setSessionId(sid);
    setMessages([]);
    setShowHistory(false);
  }, []);

  const handleOpen = React.useCallback(async () => {
    setOpen(true);
    if (user && !sessionId) {
      const sid = generateSessionId();
      setSessionId(sid);
    }
  }, [user, sessionId]);

  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      if (!isAuthenticated) {
        setShowAuthPrompt(true);
        return;
      }

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setTyping(true);

      if (user && sessionId) {
        await saveChatMessage(user.id, sessionId, 'user', text.trim());
      }

      // Simulate typing delay for natural feel
      const response = await getAiResponse(text.trim());

      // Small delay for typing indicator
      await new Promise((r) => setTimeout(r, 400));

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
      setTyping(false);

      if (user && sessionId) {
        await saveChatMessage(user.id, sessionId, 'assistant', response);
      }

      // Refresh sessions
      loadSessions();
    },
    [loading, user, sessionId, isAuthenticated, loadSessions]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggested = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClear = () => {
    setMessages([]);
    setShowAuthPrompt(false);
    startNewSession();
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowAuthPrompt(false);
    startNewSession();
  };

  const handleDeleteSession = async (sid: string) => {
    if (!user) return;
    await deleteChatSession(user.id, sid);
    if (sid === sessionId) {
      handleNewChat();
    }
    loadSessions();
  };

  const handleLoadSession = async (sid: string) => {
    if (!user) return;
    setSessionId(sid);
    setShowHistory(false);
    const msgs = await getSessionMessages(user.id, sid);
    setMessages(msgs);
  };

  const handleClearAll = async () => {
    if (!user) return;
    await clearAllChats(user.id);
    handleNewChat();
    loadSessions();
  };

  const displayedSessions = searchQuery.trim() ? searchResults : sessions;

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-glow transition-all hover:shadow-float"
        aria-label="AI Assistant"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 flex h-[34rem] max-h-[calc(100vh-8rem)] w-[calc(100vw-3rem)] max-w-md flex-col overflow-hidden rounded-2xl border bg-card shadow-float"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">BioHub AI</p>
                  <p className="text-xs text-white/80">Your learning & platform assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAuthenticated && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={cn(
                      'rounded-lg p-2 transition-colors hover:bg-white/10',
                      showHistory ? 'bg-white/20 text-white' : 'text-white/80'
                    )}
                    aria-label="Chat history"
                  >
                    <History className="h-4 w-4" />
                  </button>
                )}
                {isAuthenticated && (
                  <button
                    onClick={handleNewChat}
                    className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="New chat"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleClear}
                  className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Clear chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* History panel */}
            {showHistory && isAuthenticated && (
              <div className="border-b bg-muted/30 max-h-48 overflow-y-auto">
                <div className="p-3">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  {displayedSessions.length > 0 ? (
                    <div className="space-y-1">
                      {displayedSessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            'group flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer',
                            session.id === sessionId && 'bg-primary/10'
                          )}
                          onClick={() => handleLoadSession(session.id)}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{session.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {session.messageCount} messages
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      {searchQuery ? 'No matching chats found' : 'No previous chats'}
                    </p>
                  )}
                  {sessions.length > 0 && !searchQuery && (
                    <button
                      onClick={handleClearAll}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/20 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear all chats
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && !showAuthPrompt && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">Ask me anything!</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      I can help with bioinformatics, Python, R, BLAST, NGS, courses, and platform navigation.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestedPrompts.slice(0, 4).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSuggested(prompt)}
                        className="rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showAuthPrompt && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <LogIn className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">Sign in to continue</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create a free account or sign in to chat with the AI assistant and save your conversations.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <Link href="/login?redirect=/ai-assistant" className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:shadow-glow">
                      Sign In
                    </Link>
                    <Link href="/register?redirect=/ai-assistant" className="w-full rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-muted">
                      Create Account
                    </Link>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div
                        className="space-y-1 leading-relaxed [&_a]:text-primary [&_a]:underline [&_code]:text-xs [&_div]:my-0.5"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                    ) : (
                      <p className="leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.created_at && (
                    <div className={cn('flex items-center gap-1 px-1 text-[10px] text-muted-foreground/60', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <Clock className="h-2.5 w-2.5" />
                      {formatTimestamp(msg.created_at)}
                    </div>
                  )}
                </motion.div>
              ))}

              {typing && (
                <div className="flex items-start gap-1">
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  </div>
                </div>
              )}

              {loading && !typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={loading || showAuthPrompt}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || showAuthPrompt}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white transition-all hover:shadow-glow disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
