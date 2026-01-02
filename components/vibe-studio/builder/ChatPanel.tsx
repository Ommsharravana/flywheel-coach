'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { useBuilderStore, ChatMessage } from '@/lib/stores/vibeBuilderStore';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isGenerating, streamingContent } = useBuilderStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border-r border-[#333]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-gray-400 font-mono tracking-wider">
            AI_BUILDER
          </span>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
            <span className="text-xs text-orange-500 font-mono">GENERATING</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-mono text-sm">Describe what you want to build...</p>
              <p className="text-xs mt-2 opacity-75">I&apos;ll generate the code for you</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Streaming content */}
        {streamingContent && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-orange-500" />
            </div>
            <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#333]">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg focus-within:border-orange-500 transition-colors">
            <span className="text-orange-500 font-mono">&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a feature, fix a bug..."
              disabled={isGenerating}
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none font-mono text-sm disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className={`p-3 rounded-lg transition-all ${
              input.trim() && !isGenerating
                ? 'bg-orange-500 text-black hover:bg-orange-400'
                : 'bg-[#333] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-500/20' : 'bg-orange-500/20'
      }`}>
        {isUser ? (
          <User className="w-3 h-3 text-blue-500" />
        ) : (
          <Bot className="w-3 h-3 text-orange-500" />
        )}
      </div>
      <div className={`flex-1 rounded-lg p-3 ${
        isUser
          ? 'bg-blue-500/10 border border-blue-500/30'
          : 'bg-[#1a1a1a] border border-[#333]'
      }`}>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
