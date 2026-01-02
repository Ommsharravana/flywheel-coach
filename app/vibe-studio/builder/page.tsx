'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { useBuilderStore } from '@/lib/stores/vibeBuilderStore';
import { ChatPanel } from '@/components/vibe-studio/builder/ChatPanel';
import { CodeViewer } from '@/components/vibe-studio/builder/CodeViewer';
import { PreviewPanel } from '@/components/vibe-studio/builder/PreviewPanel';
import { BYOSStatusBar } from '@/components/vibe-studio/builder/BYOSStatusBar';

export default function VibeStudioBuilder() {
  const router = useRouter();
  const { appName, appIdea, features, platform } = useOnboardingStore();
  const {
    setProject,
    addMessage,
    setIsGenerating,
    setStreamingContent,
    addFile,
    isDeploying,
    setIsDeploying,
    setDeploymentStatus,
  } = useBuilderStore();

  // Initialize project from onboarding data
  useEffect(() => {
    if (appName || appIdea) {
      const selectedFeatures = features.filter(f => f.selected).map(f => f.name);
      const description = `${platform} app: ${appIdea}\nFeatures: ${selectedFeatures.join(', ')}`;
      setProject(appName || 'New Project', description);
    }
  }, [appName, appIdea, features, platform, setProject]);

  // Build conversation history from messages
  const getConversationHistory = () => {
    const { messages } = useBuilderStore.getState();
    return messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  };

  // Handle sending a message to Claude
  const handleSendMessage = async (message: string) => {
    // Add user message
    addMessage({ role: 'user', content: message });
    setIsGenerating(true);
    setStreamingContent('');

    try {
      const { projectName, projectDescription } = useBuilderStore.getState();
      const conversationHistory = getConversationHistory();

      // Call the streaming API
      const response = await fetch('/api/vibe-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          conversationHistory: conversationHistory.slice(0, -1), // Exclude the message we just added
          projectName,
          projectDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                fullContent += data.content;
                useBuilderStore.getState().appendStreamingContent(data.content);
              } else if (data.type === 'files') {
                // Add generated files to the store
                for (const file of data.files) {
                  addFile({
                    path: file.path,
                    content: file.content,
                    language: file.language,
                  });
                }
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              // Ignore JSON parse errors for incomplete chunks
              if (line.slice(6).trim()) {
                console.warn('Parse error:', parseError);
              }
            }
          }
        }
      }

      // Add the complete assistant message
      addMessage({ role: 'assistant', content: fullContent });
    } catch (error) {
      console.error('Error generating code:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, there was an error generating code. Please try again.',
      });
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
    }
  };

  // Handle deploy button
  const handleDeploy = async () => {
    const { byos } = useBuilderStore.getState();

    if (!byos.github.connected || !byos.vercel.connected) {
      alert('Please connect GitHub and Vercel in BYOS settings first.');
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('pushing');

    try {
      // TODO: Implement actual deployment
      // 1. Push files to GitHub
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeploymentStatus('building');

      // 2. Wait for Vercel to build
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDeploymentStatus('ready');

      // 3. Set preview URL
      useBuilderStore.getState().setPreviewUrl('https://your-app.vercel.app');
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus('error');
    } finally {
      setIsDeploying(false);
    }
  };

  const projectName = useBuilderStore.getState().projectName || appName || 'New Project';

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top bar with BYOS status */}
      <BYOSStatusBar
        projectName={projectName}
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
      />

      {/* Main content - Three columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - 30% */}
        <div className="w-[30%] min-w-[300px]">
          <ChatPanel onSendMessage={handleSendMessage} />
        </div>

        {/* Code Viewer - 35% */}
        <div className="w-[35%] min-w-[350px]">
          <CodeViewer />
        </div>

        {/* Preview Panel - 35% */}
        <div className="flex-1">
          <PreviewPanel />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#333] text-center">
        <p className="text-xs text-gray-600 font-mono tracking-wider">
          JKKN VIBE STUDIO • APPATHON 2.0 • POWERED BY CLAUDE
        </p>
      </div>
    </div>
  );
}
