'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { Cycle, FLYWHEEL_STEPS } from '@/lib/types/cycle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, Send, Sparkles, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICoachChatProps {
  cycle: Cycle;
  currentStep: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AICoachChat({ cycle, currentStep, isOpen, onClose }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const stepInfo = FLYWHEEL_STEPS[currentStep - 1];

  // Load existing conversation from DB
  const loadConversation = useCallback(async () => {
    if (!cycle.id) return;

    setIsLoading(true);
    try {
      // Find existing conversation for this cycle and step
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('cycle_id', cycle.id)
        .eq('step', currentStep)
        .single();

      if (existingConv) {
        setConversationId(existingConv.id);

        // Load messages
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', existingConv.id)
          .order('created_at', { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          setMessages(
            dbMessages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
        } else {
          // No messages yet, add greeting
          const greeting = getStepGreeting(currentStep, cycle);
          const greetingMsg = await saveMessage(existingConv.id, 'assistant', greeting);
          if (greetingMsg) {
            setMessages([greetingMsg]);
          }
        }
      } else {
        // Create new conversation
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            cycle_id: cycle.id,
            step: currentStep,
          })
          .select('id')
          .single();

        if (newConv) {
          setConversationId(newConv.id);

          // Add greeting
          const greeting = getStepGreeting(currentStep, cycle);
          const greetingMsg = await saveMessage(newConv.id, 'assistant', greeting);
          if (greetingMsg) {
            setMessages([greetingMsg]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Fallback to local greeting
      const greeting = getStepGreeting(currentStep, cycle);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [cycle.id, currentStep]);

  // Save a message to DB
  const saveMessage = async (
    convId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message | null> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          role,
          content,
        })
        .select('id, role, content, created_at')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        role: data.role as 'user' | 'assistant',
        content: data.content,
        timestamp: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  // Load conversation when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadConversation();
    }
  }, [isOpen, loadConversation, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isLoading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLoading]);

  const getStepGreeting = (step: number, cycle: Cycle): string => {
    switch (step) {
      case 1:
        return `Hi! I'm your AI Coach. Let's find a problem worth solving together.\n\nStart by answering the 5 discovery questions on the left. Think about frustrations you face daily - those often make the best problems to solve.\n\nWhat's something that's been annoying you lately?`;
      case 2:
        if (cycle.problem?.statement) {
          return `Great progress on defining the problem: "${cycle.problem.refinedStatement || cycle.problem.statement}"\n\nNow let's understand the context. Who else experiences this problem? When does it happen? The more specific you can be, the better solution you'll build.\n\nWho do you think struggles most with this problem?`;
        }
        return `Let's dig into the context of your problem. Understanding who experiences it and when will help you build something people actually want.\n\nWho are the people most affected by this problem?`;
      case 3:
        return `Time for the Desperate User Test! This is crucial - it separates problems worth solving from nice-to-haves.\n\nFor each criterion, be honest with yourself. Look for evidence, not just assumptions. Would someone actually pay to solve this? Have they tried other solutions?\n\nWhat evidence do you have that people are actively searching for a solution?`;
      case 4:
        if (cycle.valueAssessment?.decision === 'proceed') {
          return `Your Desperate User Score of ${cycle.valueAssessment.desperateUserScore}/100 looks promising!\n\nNow let's classify the workflow type. Most solutions fit into one of 10 common patterns. This helps us generate a better prompt for building.\n\nLooking at your problem, which workflow type feels like the best fit?`;
        }
        return `Let's classify what type of workflow your solution needs. This makes building much faster because we can use proven patterns.\n\nWhich of these workflow types resonates with your problem?`;
      case 5:
        return `Now for the exciting part - generating your build prompt!\n\nI've created a prompt based on everything you've learned. Review it, customize it with specific features you want, then copy it to use in Lovable.\n\nWhat specific features are most important for your MVP?`;
      case 6:
        return `Time to build! Open Lovable, paste your prompt, and start creating.\n\nRemember: start simple. Get the core flow working first, then iterate. Don't try to build everything at once.\n\nHave you pasted your prompt into Lovable yet?`;
      case 7:
        return `Your solution is built - now let's get it live!\n\nDeployment can feel scary, but shipping is how you learn. A deployed solution getting real feedback beats a perfect solution that nobody uses.\n\nIs your project deployed and accessible?`;
      case 8:
        return `Congratulations on shipping! Now let's measure the impact.\n\nTrack how many people use your solution and what they say. Most importantly, notice the NEW problems that emerged - those are seeds for your next cycle.\n\nWhat feedback have you received so far?`;
      default:
        return `I'm here to help you through the flywheel process. What questions do you have?`;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isPending || isStreaming || !conversationId) return;

    const userContent = input.trim();
    setInput('');
    setIsStreaming(true);

    // Save user message to DB and add to state
    const userMessage = await saveMessage(conversationId, 'user', userContent);
    if (userMessage) {
      setMessages((prev) => [...prev, userMessage]);
    } else {
      // Fallback to local message
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: userContent,
          timestamp: new Date(),
        },
      ]);
    }

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userContent }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          cycle,
          currentStep,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Save assistant message to DB
      const assistantMessage = await saveMessage(conversationId, 'assistant', data.message);
      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Fallback to local message
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorContent = 'Sorry, I encountered an error. Please try again.';
      const errorMessage = await saveMessage(conversationId, 'assistant', errorContent);
      if (errorMessage) {
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: errorContent,
            timestamp: new Date(),
          },
        ]);
      }
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

  const getSuggestions = (): string[] => {
    switch (currentStep) {
      case 1:
        return [
          'What makes a good problem to solve?',
          'How specific should my problem statement be?',
          'Should I solve my own problem or others?',
        ];
      case 2:
        return [
          'How many people should I talk to?',
          'What questions should I ask in interviews?',
          'How do I find people to interview?',
        ];
      case 3:
        return [
          'What if my score is low?',
          'How do I find evidence of desperation?',
          'Should I pivot or keep going?',
        ];
      case 4:
        return [
          'What if my problem fits multiple types?',
          'Can I combine workflow types?',
          'Which type is fastest to build?',
        ];
      case 5:
        return [
          'What should I include in the prompt?',
          'How do I prioritize features?',
          'What should the MVP include?',
        ];
      case 6:
        return [
          "I'm stuck on a Lovable error",
          "How do I make changes after building?",
          'Should I add authentication?',
        ];
      case 7:
        return [
          'How do I get my first users?',
          'Should I use a custom domain?',
          'How do I share my project?',
        ];
      case 8:
        return [
          'How do I measure success?',
          'What metrics matter most?',
          'How do I get feedback?',
        ];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50"
      >
        <Card className="glass-card border-amber-500/30 shadow-2xl">
          <CardHeader className="pb-3 border-b border-stone-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Coach
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Step {currentStep}: {stepInfo.shortName}</span>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">Loading conversation...</p>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Suggestions */}
            {!isLoading && messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-stone-500 mb-2">Suggested questions:</p>
                <div className="flex flex-wrap gap-1">
                  {getSuggestions().map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
                  disabled={!input.trim() || isStreaming || isLoading || !conversationId}
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

// Floating trigger button
export function AICoachButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
        isOpen
          ? 'bg-stone-800 text-stone-400'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900'
      }`}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Sparkles className="w-6 h-6" />
      )}
    </motion.button>
  );
}
