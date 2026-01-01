'use client';

import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Settings, Home } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { EventSwitcher } from './EventSwitcher';

interface AdminHeaderProps {
  user: User | null;
  profile?: {
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  userRole?: string;
}

export function AdminHeader({ user, profile, userRole }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'SA';

  // Determine panel title based on role
  const panelTitle = userRole === 'superadmin'
    ? 'Super Admin Panel'
    : userRole === 'event_admin'
    ? 'Event Admin Panel'
    : 'Admin Panel';

  return (
    <header className="h-16 bg-stone-900/50 border-b border-stone-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-lg font-medium text-stone-100">{panelTitle}</h2>
          <p className="text-sm text-stone-500">Manage users, cycles, and monitor activity</p>
        </div>

        {/* Event Switcher for event_admin role */}
        {user && userRole === 'event_admin' && (
          <EventSwitcher
            userId={user.id}
            userRole={userRole}
            onEventChange={() => {
              // Refresh the page to reload data with new event context
              router.refresh();
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Exit Admin Button - Prominent placement */}
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white gap-2"
          >
            <Home className="h-4 w-4" />
            Exit Admin
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={profile?.avatarUrl || undefined}
                  alt={profile?.name || 'Admin'}
                />
                <AvatarFallback className="bg-amber-500/20 text-amber-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.name || 'Admin'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email || user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>User Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
