'use client';

import { ReactNode } from 'react';

interface TerminalWindowProps {
  children: ReactNode;
  title?: string;
  showLive?: boolean;
}

export function TerminalWindow({
  children,
  title = "SYSTEM://ONBOARDING",
  showLive = true
}: TerminalWindowProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Terminal container */}
      <div className="vibe-terminal-window overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          {/* Traffic light buttons */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-gray-400 font-mono tracking-wider">
              {title}
            </span>
          </div>

          {/* Live indicator */}
          {showLive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 vibe-live-indicator" />
              <span className="text-xs text-yellow-500 font-mono tracking-wider">
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Terminal content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
