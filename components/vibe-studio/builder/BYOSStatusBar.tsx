'use client';

import { Database, Github, Triangle, Check, AlertCircle, Settings, ArrowLeft } from 'lucide-react';
import { useBuilderStore } from '@/lib/stores/vibeBuilderStore';
import Link from 'next/link';

interface BYOSStatusBarProps {
  projectName: string;
  onDeploy: () => void;
  isDeploying: boolean;
}

export function BYOSStatusBar({ projectName, onDeploy, isDeploying }: BYOSStatusBarProps) {
  const { byos, deploymentStatus } = useBuilderStore();

  const allConnected = byos.supabase.connected && byos.github.connected && byos.vercel.connected;
  const canDeploy = byos.github.connected && byos.vercel.connected;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#0a0a0a]">
      {/* Left: Back + Project name */}
      <div className="flex items-center gap-4">
        <Link
          href="/vibe-studio/onboarding"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            {projectName || 'New Project'}
          </h1>
          <p className="text-xs text-gray-500 font-mono">VIBE_STUDIO</p>
        </div>
      </div>

      {/* Center: BYOS Status */}
      <div className="flex items-center gap-4">
        <ConnectionBadge
          icon={<Database className="w-3 h-3" />}
          name="Supabase"
          connected={byos.supabase.connected}
          detail={byos.supabase.projectName}
        />
        <ConnectionBadge
          icon={<Github className="w-3 h-3" />}
          name="GitHub"
          connected={byos.github.connected}
          detail={byos.github.repoName}
        />
        <ConnectionBadge
          icon={<Triangle className="w-3 h-3" />}
          name="Vercel"
          connected={byos.vercel.connected}
          detail={byos.vercel.projectId}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/byos"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white border border-[#333] rounded-lg hover:border-[#444] transition-colors"
        >
          <Settings className="w-3 h-3" />
          BYOS SETTINGS
        </Link>
        <button
          onClick={onDeploy}
          disabled={!canDeploy || isDeploying}
          className={`px-4 py-1.5 rounded-lg font-mono text-sm tracking-wider transition-all ${
            canDeploy && !isDeploying
              ? 'vibe-btn-gradient text-black hover:opacity-90'
              : 'bg-[#333] text-gray-500 cursor-not-allowed'
          }`}
        >
          {isDeploying ? (
            <>
              {deploymentStatus === 'pushing' ? 'PUSHING...' :
               deploymentStatus === 'building' ? 'BUILDING...' : 'DEPLOYING...'}
            </>
          ) : (
            'DEPLOY'
          )}
        </button>
      </div>
    </div>
  );
}

interface ConnectionBadgeProps {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  detail?: string;
}

function ConnectionBadge({ icon, name, connected, detail }: ConnectionBadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
      connected
        ? 'border-green-500/30 bg-green-500/10'
        : 'border-[#333] bg-[#1a1a1a]'
    }`}>
      <span className={connected ? 'text-green-500' : 'text-gray-500'}>
        {icon}
      </span>
      <span className={`text-xs font-mono ${connected ? 'text-green-500' : 'text-gray-500'}`}>
        {name}
      </span>
      {connected ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <AlertCircle className="w-3 h-3 text-gray-500" />
      )}
      {detail && (
        <span className="text-xs text-gray-500 font-mono truncate max-w-[100px]">
          {detail}
        </span>
      )}
    </div>
  );
}
