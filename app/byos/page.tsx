'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Database,
  Github,
  Triangle,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface ConnectionsState {
  supabase: ConnectionStatus;
  github: ConnectionStatus;
  vercel: ConnectionStatus;
}

// Component that uses searchParams - wrapped in Suspense
function BYOSContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<ConnectionsState>({
    supabase: { connected: false, loading: true },
    github: { connected: false, loading: true },
    vercel: { connected: false, loading: true },
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for URL params (success/error from OAuth callbacks)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      setMessage({ type: 'success', text: `Successfully connected to ${connected}!` });
    } else if (error) {
      setMessage({ type: 'error', text: error });
    }

    // Clear message after 5 seconds
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Fetch connection status on mount
  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/byos/status');
      if (response.ok) {
        const data = await response.json();
        setConnections({
          supabase: {
            connected: data.supabase?.connected || false,
            loading: false,
            metadata: data.supabase?.metadata,
          },
          github: {
            connected: data.github?.connected || false,
            loading: false,
            metadata: data.github?.metadata,
          },
          vercel: {
            connected: data.vercel?.connected || false,
            loading: false,
            metadata: data.vercel?.metadata,
          },
        });
      } else {
        setConnections({
          supabase: { connected: false, loading: false },
          github: { connected: false, loading: false },
          vercel: { connected: false, loading: false },
        });
      }
    } catch {
      setConnections({
        supabase: { connected: false, loading: false },
        github: { connected: false, loading: false },
        vercel: { connected: false, loading: false },
      });
    }
  };

  const handleConnect = async (provider: 'supabase' | 'github' | 'vercel') => {
    setConnections(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true, error: undefined },
    }));

    try {
      const response = await fetch(`/api/byos/${provider}`);
      const data = await response.json();

      if (data.url) {
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else if (data.error) {
        setConnections(prev => ({
          ...prev,
          [provider]: { connected: false, loading: false, error: data.error },
        }));
      }
    } catch (error) {
      setConnections(prev => ({
        ...prev,
        [provider]: {
          connected: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
      }));
    }
  };

  const handleDisconnect = async (provider: 'supabase' | 'github' | 'vercel') => {
    setConnections(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true },
    }));

    try {
      const response = await fetch(`/api/byos/${provider}`, { method: 'DELETE' });

      if (response.ok) {
        setConnections(prev => ({
          ...prev,
          [provider]: { connected: false, loading: false },
        }));
        setMessage({ type: 'success', text: `Disconnected from ${provider}` });
      }
    } catch {
      setConnections(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false },
      }));
    }
  };

  const allConnected = connections.supabase.connected &&
    connections.github.connected &&
    connections.vercel.connected;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#333] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/vibe-studio/builder"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">BYOS Settings</h1>
              <p className="text-xs text-gray-500 font-mono">BRING YOUR OWN STACK</p>
            </div>
          </div>
          <button
            onClick={fetchConnectionStatus}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Status message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          </div>
        )}

        {/* Overview */}
        <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
          <h2 className="text-lg font-bold mb-2">Connect Your Stack</h2>
          <p className="text-gray-400 text-sm mb-4">
            BYOS (Bring Your Own Stack) lets you connect your own Supabase, GitHub, and Vercel accounts.
            Your apps will be deployed to your own infrastructure.
          </p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${
            allConnected
              ? 'bg-green-500/10 text-green-500 border border-green-500/30'
              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
          }`}>
            {allConnected ? (
              <>
                <Check className="w-3 h-3" />
                FULLY CONNECTED
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                PARTIAL CONNECTION
              </>
            )}
          </div>
        </div>

        {/* Connection Cards */}
        <div className="grid gap-4">
          {/* Supabase */}
          <ConnectionCard
            provider="supabase"
            name="Supabase"
            description="Database, authentication, and storage for your apps"
            icon={<Database className="w-6 h-6" />}
            color="emerald"
            status={connections.supabase}
            onConnect={() => handleConnect('supabase')}
            onDisconnect={() => handleDisconnect('supabase')}
            docsUrl="https://supabase.com/docs"
          />

          {/* GitHub */}
          <ConnectionCard
            provider="github"
            name="GitHub"
            description="Store your app&apos;s source code in your own repository"
            icon={<Github className="w-6 h-6" />}
            color="gray"
            status={connections.github}
            onConnect={() => handleConnect('github')}
            onDisconnect={() => handleDisconnect('github')}
            docsUrl="https://docs.github.com"
          />

          {/* Vercel */}
          <ConnectionCard
            provider="vercel"
            name="Vercel"
            description="Deploy and host your apps with automatic previews"
            icon={<Triangle className="w-6 h-6" />}
            color="white"
            status={connections.vercel}
            onConnect={() => handleConnect('vercel')}
            onDisconnect={() => handleDisconnect('vercel')}
            docsUrl="https://vercel.com/docs"
          />
        </div>

        {/* How it works */}
        <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
          <h3 className="text-lg font-bold mb-4">How BYOS Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                1
              </div>
              <h4 className="font-semibold">Connect Accounts</h4>
              <p className="text-sm text-gray-400">
                Authorize JKKN Vibe Studio to access your Supabase, GitHub, and Vercel accounts.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                2
              </div>
              <h4 className="font-semibold">Build with AI</h4>
              <p className="text-sm text-gray-400">
                Describe your app in plain English. Claude generates the code and database schema.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                3
              </div>
              <h4 className="font-semibold">Auto Deploy</h4>
              <p className="text-sm text-gray-400">
                Code pushes to your GitHub repo, Vercel auto-deploys, preview URL appears instantly.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {allConnected && (
          <Link
            href="/vibe-studio/builder"
            className="block w-full py-4 text-center vibe-btn-gradient text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            START BUILDING
          </Link>
        )}
      </main>
    </div>
  );
}

// Loading fallback for Suspense
function BYOSLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-gray-400">Loading BYOS settings...</span>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function BYOSPage() {
  return (
    <Suspense fallback={<BYOSLoading />}>
      <BYOSContent />
    </Suspense>
  );
}

interface ConnectionCardProps {
  provider: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: 'emerald' | 'gray' | 'white';
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  docsUrl: string;
}

function ConnectionCard({
  name,
  description,
  icon,
  color,
  status,
  onConnect,
  onDisconnect,
  docsUrl,
}: ConnectionCardProps) {
  const colorClasses = {
    emerald: 'text-emerald-500',
    gray: 'text-gray-300',
    white: 'text-white',
  };

  return (
    <div className={`p-6 bg-[#111] border rounded-xl transition-all ${
      status.connected
        ? 'border-green-500/30'
        : status.error
        ? 'border-red-500/30'
        : 'border-[#333]'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-[#1a1a1a] ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{name}</h3>
              {status.connected && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-xs font-mono">
                  <Check className="w-3 h-3" />
                  CONNECTED
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">{description}</p>

            {/* Show metadata if connected */}
            {status.connected && status.metadata && (
              <div className="mt-3 text-xs text-gray-500 font-mono">
                {(status.metadata as { project_count?: number }).project_count && (
                  <span>{(status.metadata as { project_count: number }).project_count} projects available</span>
                )}
                {(status.metadata as { username?: string }).username && (
                  <span>@{(status.metadata as { username: string }).username}</span>
                )}
                {(status.metadata as { team_name?: string }).team_name && (
                  <span>Team: {(status.metadata as { team_name: string }).team_name}</span>
                )}
              </div>
            )}

            {/* Show error if any */}
            {status.error && (
              <p className="mt-2 text-sm text-red-400">{status.error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-white transition-colors"
            title="Documentation"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {status.connected ? (
            <button
              onClick={onDisconnect}
              disabled={status.loading}
              className="px-4 py-2 text-sm font-mono border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {status.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'DISCONNECT'
              )}
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={status.loading}
              className="px-4 py-2 text-sm font-mono bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
              {status.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'CONNECT'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
