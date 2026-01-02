'use client';

import { useState, useRef } from 'react';
import { ExternalLink, RefreshCw, Smartphone, Monitor, Loader2, Rocket, Code2 } from 'lucide-react';
import { useBuilderStore } from '@/lib/stores/vibeBuilderStore';

export function PreviewPanel() {
  const { previewUrl, deploymentStatus, isDeploying, files, byos } = useBuilderStore();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
  };

  const hasFiles = files.length > 0;
  const isConnected = byos.github.connected && byos.vercel.connected;

  const getStatusColor = () => {
    switch (deploymentStatus) {
      case 'ready':
        return 'text-green-500';
      case 'building':
      case 'pushing':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (deploymentStatus) {
      case 'ready':
        return 'LIVE';
      case 'building':
        return 'BUILDING';
      case 'pushing':
        return 'PUSHING';
      case 'error':
        return 'ERROR';
      default:
        return 'WAITING';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-gray-400 font-mono tracking-wider">
            PREVIEW
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isDeploying && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
            <div className={`w-2 h-2 rounded-full ${
              deploymentStatus === 'ready' ? 'bg-green-500' :
              deploymentStatus === 'error' ? 'bg-red-500' :
              isDeploying ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className={`text-xs font-mono ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {/* View mode toggles */}
          <div className="flex items-center gap-1 border border-[#333] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded ${
                viewMode === 'desktop' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded ${
                viewMode === 'mobile' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {/* External link */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Preview iframe or placeholder */}
      <div className="flex-1 flex items-center justify-center bg-[#111] p-4">
        {isDeploying ? (
          // Deploying state
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 border-2 border-orange-500/30 rounded-xl flex items-center justify-center bg-orange-500/5">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
            <p className="text-orange-500 font-mono text-sm mb-2">
              {deploymentStatus === 'pushing' ? 'Pushing to GitHub...' : 'Building on Vercel...'}
            </p>
            <p className="text-gray-600 text-xs">
              Your preview will appear automatically
            </p>
          </div>
        ) : previewUrl ? (
          <div className={`bg-white rounded-lg overflow-hidden shadow-2xl transition-all ${
            viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'
          }`}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="App Preview"
            />
          </div>
        ) : hasFiles && isConnected ? (
          // Files exist, connected, but not deployed
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-orange-500/30 rounded-xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-white font-mono text-sm mb-2">
              Ready to deploy!
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Click the Deploy button to see your app live
            </p>
          </div>
        ) : hasFiles && !isConnected ? (
          // Files exist but not connected
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-yellow-500/30 rounded-xl flex items-center justify-center">
              <Code2 className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-yellow-500 font-mono text-sm mb-2">
              Connect to deploy
            </p>
            <p className="text-gray-500 text-xs">
              Link GitHub & Vercel in BYOS settings
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-[#333] rounded-xl flex items-center justify-center">
              <Monitor className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 font-mono text-sm mb-2">
              No preview available
            </p>
            <p className="text-gray-600 text-xs">
              Generate code to get started
            </p>
          </div>
        )}
      </div>

      {/* URL bar */}
      {previewUrl && (
        <div className="px-4 py-2 border-t border-[#333] flex items-center gap-2">
          <button
            onClick={refreshPreview}
            className="p-1 text-gray-500 hover:text-white transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <div className="flex-1 bg-[#1a1a1a] rounded px-3 py-1 text-xs font-mono text-gray-400 truncate">
            {previewUrl}
          </div>
        </div>
      )}
    </div>
  );
}
