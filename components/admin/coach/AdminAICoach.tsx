'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, Send, Sparkles, User, X, AlertCircle, Settings, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AdminAICoachChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAICoachChat({ isOpen, onClose }: AdminAICoachChatProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasGeminiConnected, setHasGeminiConnected] = useState<boolean | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if Gemini is configured
  const checkProvider = useCallback(async () => {
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        const geminiCred = data.providers?.find((p: { provider: string; isValid: boolean }) =>
          p.provider === 'gemini'
        );
        if (geminiCred) {
          setHasGeminiConnected(true);
          if (!geminiCred.isValid) {
            setNeedsReconnect(true);
          }
        } else {
          setHasGeminiConnected(false);
        }
      } else {
        setHasGeminiConnected(false);
      }
    } catch (err) {
      console.error('Error checking provider:', err);
      setHasGeminiConnected(false);
    }
  }, []);

  // Initialize with greeting when opened
  useEffect(() => {
    if (isOpen && hasGeminiConnected === true && messages.length === 0) {
      const greeting = getAdminGreeting();
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, hasGeminiConnected, messages.length]);

  // Check provider when opened
  useEffect(() => {
    if (isOpen) {
      checkProvider();
    }
  }, [isOpen, checkProvider]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && hasGeminiConnected) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasGeminiConnected]);

  const getAdminGreeting = (): string => {
    const pageContext = getPageContext(pathname);
    return `Hi! I'm your Admin AI Coach. I can help you with:

- Reviewing and managing submissions
- Understanding event analytics
- Making admin decisions
- Best practices for evaluation

${pageContext}

What would you like help with?`;
  };

  const getPageContext = (path: string): string => {
    if (path.includes('/submissions')) {
      return "You're currently on the Submissions page. I can help you review submissions, understand scoring, or manage the evaluation workflow.";
    }
    if (path.includes('/events')) {
      return "You're managing an event. I can help with event configuration, tracking progress, or analyzing participation.";
    }
    if (path.includes('/problem-bank')) {
      return "You're in the Problem Bank. I can help with problem curation, clustering, or quality assessment.";
    }
    return "I can help you navigate admin tasks and make informed decisions.";
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userContent = input.trim();
    setInput('');
    setIsStreaming(true);

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userContent }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          // Admin context instead of cycle
          adminContext: {
            page: pathname,
            isAdmin: true,
          },
          currentStep: 0,
          isAppathonMode: false,
        }),
      });

      const data = await response.json();

      // Check if we need to reconnect
      if (!response.ok && data.requiresSetup) {
        setNeedsReconnect(true);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Your Google connection needs to be refreshed. Please go to Settings to reconnect.',
            timestamp: new Date(),
          },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToSettings = () => {
    onClose();
    router.push('/settings');
  };

  if (!isOpen) return null;

  // Credential gate: Show setup prompt if Gemini is not connected
  if (hasGeminiConnected === false || needsReconnect) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-[9989]"
        >
          <Card className="bg-stone-900 border-amber-500/30 shadow-2xl">
            <CardHeader className="pb-3 border-b border-stone-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Admin AI Coach
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-stone-100 mb-2">
                    {needsReconnect ? 'Update Gemini API Key' : 'Add Gemini API Key'}
                  </h3>
                  <p className="text-sm text-stone-400">
                    {needsReconnect
                      ? 'Your API key may be invalid or expired. Please update it to continue using AI features.'
                      : 'Add your Gemini API key to use the AI Coach. Get a free key from Google AI Studio.'}
                  </p>
                </div>

                <Button
                  onClick={goToSettings}
                  className="w-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>

                <p className="text-xs text-stone-500">
                  Your API key is stored securely. Free tier includes 1,500 requests/day.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Still checking credentials
  if (hasGeminiConnected === null) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-[9989]"
        >
          <Card className="bg-stone-900 border-amber-500/30 shadow-2xl">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-stone-400">Checking AI access...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-[9989]"
      >
        <Card className="bg-stone-900 border-amber-500/30 shadow-2xl">
          <CardHeader className="pb-3 border-b border-stone-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Admin AI Coach
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            {/* Provider indicator */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-400">
              <Zap className="w-3 h-3" />
              <span>Powered by your Gemini API key</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-amber-500 text-stone-900 rounded-br-sm'
                        : 'bg-stone-800 text-stone-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-stone-300" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isStreaming && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="bg-stone-800 rounded-2xl rounded-bl-sm p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-stone-800">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="min-h-[44px] max-h-32 resize-none bg-stone-800/50 border-stone-700 focus:border-amber-500"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-3"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating trigger button for admin pages
// Positioned at bottom-24 right-4 to avoid overlap with bug reporter (bottom-4 right-4)
export function AdminAICoachButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-20 right-4 z-[9988] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
        isOpen
          ? 'bg-stone-800 text-stone-400'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900'
      }`}
      aria-label={isOpen ? 'Close AI Coach' : 'Open AI Coach'}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Sparkles className="w-6 h-6" />
      )}
    </motion.button>
  );
}
