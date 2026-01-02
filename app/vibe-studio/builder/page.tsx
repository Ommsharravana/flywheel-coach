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

  // Handle sending a message to Claude
  const handleSendMessage = async (message: string) => {
    // Add user message
    addMessage({ role: 'user', content: message });
    setIsGenerating(true);
    setStreamingContent('');

    try {
      // TODO: Replace with actual Claude API call
      // For now, simulate AI response with code generation
      await simulateAIResponse(message);
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

  // Simulate AI response (to be replaced with actual Claude API)
  const simulateAIResponse = async (userMessage: string) => {
    const { projectName } = useBuilderStore.getState();

    // Simulate streaming response
    const response = `I'll help you build "${projectName}". Based on your request: "${userMessage}"

I'm generating the following files:

1. **app/page.tsx** - Main landing page
2. **components/Header.tsx** - Navigation header
3. **lib/utils.ts** - Utility functions

Let me create these files for you...`;

    // Stream the response character by character
    for (const char of response) {
      useBuilderStore.getState().appendStreamingContent(char);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Add the final message
    addMessage({ role: 'assistant', content: response });

    // Add sample generated files
    const sampleFiles = [
      {
        path: 'app/page.tsx',
        language: 'typescript',
        content: `import { Header } from '@/components/Header'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
        <p className="text-gray-400">Your app is ready to customize!</p>
      </div>
    </main>
  )
}`,
      },
      {
        path: 'components/Header.tsx',
        language: 'typescript',
        content: `'use client'

export function Header() {
  return (
    <header className="border-b border-gray-800 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <span className="font-bold text-xl">${projectName}</span>
        <nav className="flex gap-6">
          <a href="#" className="hover:text-orange-500">Home</a>
          <a href="#" className="hover:text-orange-500">Features</a>
          <a href="#" className="hover:text-orange-500">About</a>
        </nav>
      </div>
    </header>
  )
}`,
      },
      {
        path: 'lib/utils.ts',
        language: 'typescript',
        content: `export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}`,
      },
    ];

    // Add files with a delay to simulate generation
    for (const file of sampleFiles) {
      await new Promise(resolve => setTimeout(resolve, 300));
      addFile(file);
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
