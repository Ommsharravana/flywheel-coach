'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { getEventSidebarConfig, type NavSection } from '@/lib/admin/event-sidebar-config';

interface EventSidebarProps {
  slug: string;
  eventName?: string;
  eventType?: string;
}

export function EventSidebar({ slug, eventName = 'Event', eventType = 'appathon' }: EventSidebarProps) {
  const pathname = usePathname();

  // Get sidebar configuration based on event type
  const navSections: NavSection[] = getEventSidebarConfig(slug, eventType);

  return (
    <aside className="w-64 min-h-screen bg-stone-900 border-r border-stone-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-stone-100 truncate max-w-[160px]">
              {eventName}
            </h1>
            <p className="text-xs text-stone-500">Event Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <h2 className="px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.exactMatch
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                if (item.external) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Back to Events */}
      <div className="p-4 border-t border-stone-800">
        <Link
          href="/admin/events"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-stone-800 border border-stone-700 text-stone-200 hover:text-white hover:bg-stone-700 hover:border-stone-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </Link>
      </div>
    </aside>
  );
}
