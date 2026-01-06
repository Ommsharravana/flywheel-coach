'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Code2, Monitor } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { useBuilderStore } from '@/lib/stores/vibeBuilderStore';
import { ChatPanel } from '@/components/vibe-studio/builder/ChatPanel';
import { CodeViewer } from '@/components/vibe-studio/builder/CodeViewer';
import { PreviewPanel } from '@/components/vibe-studio/builder/PreviewPanel';
import { BYOSStatusBar } from '@/components/vibe-studio/builder/BYOSStatusBar';

type MobileTab = 'chat' | 'code' | 'preview';

export default function VibeStudioBuilder() {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
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
    const { byos, files, projectName } = useBuilderStore.getState();

    if (!byos.github.connected || !byos.vercel.connected) {
      alert('Please connect GitHub and Vercel in BYOS settings first.');
      return;
    }

    if (files.length === 0) {
      alert('No files to deploy. Generate some code first!');
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('pushing');

    try {
      // 1. Push files to GitHub and create Vercel project
      const deployResponse = await fetch('/api/vibe-studio/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          files: files.map(f => ({ path: f.path, content: f.content })),
          createNew: true,
        }),
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        throw new Error(error.error || 'Deployment failed');
      }

      const deployResult = await deployResponse.json();
      setDeploymentStatus('building');

      // 2. Poll for deployment status
      if (deployResult.vercel?.projectId) {
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));

          const statusResponse = await fetch(
            `/api/vibe-studio/deploy?projectId=${deployResult.vercel.projectId}`
          );

          if (statusResponse.ok) {
            const status = await statusResponse.json();

            if (status.status === 'ready') {
              setDeploymentStatus('ready');
              useBuilderStore.getState().setPreviewUrl(status.url);
              break;
            } else if (status.status === 'error') {
              throw new Error('Deployment failed');
            }
          }

          attempts++;
        }

        if (attempts >= maxAttempts) {
          // Timeout but might still be building
          if (deployResult.vercel.deploymentUrl) {
            useBuilderStore.getState().setPreviewUrl(deployResult.vercel.deploymentUrl);
            setDeploymentStatus('ready');
          } else {
            setDeploymentStatus('error');
          }
        }
      } else if (deployResult.repo?.url) {
        // No Vercel project ID but we have the repo
        // The deployment will happen automatically via GitHub integration
        setDeploymentStatus('ready');
        useBuilderStore.getState().setPreviewUrl(deployResult.repo.url);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus('error');
      alert(error instanceof Error ? error.message : 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const projectName = useBuilderStore.getState().projectName || appName || 'New Project';

  const mobileTabItems = [
    { id: 'chat' as MobileTab, icon: MessageSquare, label: 'Chat' },
    { id: 'code' as MobileTab, icon: Code2, label: 'Code' },
    { id: 'preview' as MobileTab, icon: Monitor, label: 'Preview' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top bar with BYOS status */}
      <BYOSStatusBar
        projectName={projectName}
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
      />

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-b border-[#333]">
        {mobileTabItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
              mobileTab === id
                ? 'bg-orange-500/10 text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-mono">{label}</span>
          </button>
        ))}
      </div>

      {/* Main content - Mobile: Single panel with tabs, Desktop: Three columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden w-full">
          {mobileTab === 'chat' && <ChatPanel onSendMessage={handleSendMessage} />}
          {mobileTab === 'code' && <CodeViewer />}
          {mobileTab === 'preview' && <PreviewPanel />}
        </div>

        {/* Desktop View - Three columns */}
        <div className="hidden md:flex flex-1">
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
      </div>

      {/* Footer - Hidden on mobile for more space */}
      <div className="hidden sm:block px-4 py-2 border-t border-[#333] text-center">
        <p className="text-xs text-gray-600 font-mono tracking-wider">
          JKKN VIBE STUDIO • APPATHON 2.0 • POWERED BY CLAUDE
        </p>
      </div>
    </div>
  );
}
