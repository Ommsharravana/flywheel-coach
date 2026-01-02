'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';
import { Send, Copy, Check, ArrowLeft, ExternalLink } from 'lucide-react';

export default function VibeStudioBuilder() {
  const router = useRouter();
  const { appName, appIdea, features, platform } = useOnboardingStore();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate Lovable-ready prompt from onboarding data
  const generatePrompt = () => {
    const selectedFeatures = features.filter(f => f.selected).map(f => f.name);

    const prompt = `Create a ${platform.toLowerCase()} application called "${appName}".

## App Description
${appIdea}

## Core Features
${selectedFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Technical Requirements
- Use React with TypeScript
- Modern, clean UI with Tailwind CSS
- Responsive design (mobile-first)
- Authentication system ready
- Database-backed with Supabase

## Design Guidelines
- Dark theme with orange accent colors
- Clean, minimal interface
- Intuitive navigation
- Accessible (WCAG compliant)`;

    setGeneratedPrompt(prompt);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setChatHistory(prev => [...prev, { role: 'user', content: message }]);

    // Simulate AI response (in production, this would call an AI API)
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `I understand you want to ${message.toLowerCase()}. Let me update the app specification to include this requirement. Click "Generate Prompt" to see the updated Lovable-ready prompt.`
      }]);
    }, 1000);

    setMessage('');
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLovable = () => {
    window.open('https://lovable.dev', '_blank');
  };

  return (
    <div className="min-h-screen vibe-grid-background vibe-corner-brackets vibe-corner-brackets-bottom">
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/vibe-studio/onboarding')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO ONBOARDING
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 vibe-live-indicator" />
              <span className="text-xs text-green-500 font-mono tracking-wider">
                BUILDER_ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Main content - Two columns */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Chat Interface */}
          <div>
            <TerminalWindow title="SYSTEM://AI_BUILDER">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    AI CHAT BUILDER
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Refine your app with AI assistance
                  </p>
                </div>

                {/* App summary */}
                <div className="p-4 rounded-lg border border-[#333] bg-[#1a1a1a]/50">
                  <div className="text-xs text-gray-500 font-mono mb-2">APP_SUMMARY</div>
                  <div className="text-orange-500 font-bold">{appName || 'Unnamed App'}</div>
                  <div className="text-gray-400 text-sm mt-1">{platform} • {features.filter(f => f.selected).length} features</div>
                </div>

                {/* Chat history */}
                <div className="h-48 overflow-y-auto space-y-3 border border-[#333] rounded-lg p-4">
                  {chatHistory.length === 0 ? (
                    <div className="text-gray-500 text-sm font-mono">
                      Start chatting to refine your app...
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-orange-500/10 border border-orange-500/30 ml-8'
                            : 'bg-[#1a1a1a] border border-[#333] mr-8'
                        }`}
                      >
                        <div className="text-xs text-gray-500 font-mono mb-1">
                          {msg.role === 'user' ? 'YOU' : 'AI'}
                        </div>
                        {msg.content}
                      </div>
                    ))
                  )}
                </div>

                {/* Chat input */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 p-3 border border-[#333] rounded-lg focus-within:border-orange-500 transition-colors">
                    <span className="text-orange-500 font-mono">&gt;</span>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Add a feature, change the design..."
                      className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className={`p-3 rounded-lg transition-all ${
                      message.trim()
                        ? 'bg-orange-500 text-black hover:bg-orange-400'
                        : 'bg-[#333] text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </TerminalWindow>
          </div>

          {/* Right: Generated Prompt */}
          <div>
            <TerminalWindow title="SYSTEM://PROMPT_OUTPUT">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    LOVABLE PROMPT
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Copy this prompt and paste it into Lovable
                  </p>
                </div>

                {/* Generate button */}
                <button
                  onClick={generatePrompt}
                  className="w-full py-3 rounded-lg vibe-btn-gradient text-black font-bold tracking-wider transition-all hover:shadow-lg"
                >
                  [GENERATE PROMPT]
                </button>

                {/* Generated prompt display */}
                {generatedPrompt && (
                  <>
                    <div className="h-64 overflow-y-auto p-4 border border-[#333] rounded-lg bg-[#0a0a0a] font-mono text-sm text-gray-300 whitespace-pre-wrap">
                      {generatedPrompt}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={copyPrompt}
                        className={`flex-1 py-3 rounded-lg font-mono text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${
                          copied
                            ? 'bg-green-500/20 border border-green-500 text-green-500'
                            : 'border border-orange-500 text-orange-500 hover:bg-orange-500/10'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            COPIED!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            COPY PROMPT
                          </>
                        )}
                      </button>
                      <button
                        onClick={openLovable}
                        className="flex-1 py-3 rounded-lg vibe-btn-gradient text-black font-mono text-sm tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        OPEN LOVABLE
                      </button>
                    </div>
                  </>
                )}

                {!generatedPrompt && (
                  <div className="h-64 flex items-center justify-center border border-[#333] rounded-lg border-dashed">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <div className="font-mono text-sm">
                        Click &quot;Generate Prompt&quot; to create<br />
                        your Lovable-ready specification
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TerminalWindow>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto mt-8 text-center">
          <p className="text-xs text-gray-600 font-mono tracking-wider">
            JKKN VIBE STUDIO • APPATHON 2.0 • POWERED BY CLAUDE MAX
          </p>
        </div>
      </div>
    </div>
  );
}
