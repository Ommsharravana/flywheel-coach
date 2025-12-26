import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Calendar,
  Repeat,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ImpersonateButton } from '@/components/admin/ImpersonateButton';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CycleRow {
  id: string;
  name: string | null;
  status: 'active' | 'completed' | 'abandoned';
  current_step: number;
  created_at: string;
  updated_at: string;
}

const roleColors: Record<string, string> = {
  learner: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  facilitator: 'bg-green-500/20 text-green-400 border-green-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  event_admin: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  institution_admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  superadmin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  abandoned: 'bg-stone-500/20 text-stone-400',
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch user using RPC (bypasses RLS for admin access)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, error } = await (supabase as any).rpc('get_user_by_id_admin', { target_user_id: id });

  const userRow = (userData as UserRow[] | null)?.[0];
  if (error || !userRow) {
    notFound();
  }

  const user = userRow;

  // Fetch user's cycles
  const { data: cyclesData } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const cycles = (cyclesData || []) as unknown as CycleRow[];

  const totalCycles = cycles.length;
  const activeCycles = cycles.filter((c) => c.status === 'active').length;
  const completedCycles = cycles.filter((c) => c.status === 'completed').length;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-stone-100">
            User Details
          </h1>
          <p className="text-stone-400">View and manage user information</p>
        </div>
        <div className="flex gap-3">
          {user.role !== 'superadmin' && (
            <ImpersonateButton
              userId={user.id}
              userName={user.name}
              userEmail={user.email}
            />
          )}
          <Link href={`/admin/users/${id}/edit`}>
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900">
              <Pencil className="h-4 w-4" />
              Edit User
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info Card */}
        <Card className="glass-card lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-stone-700 text-stone-300 text-2xl">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-stone-100">
                {user.name || 'No name'}
              </h2>
              <Badge
                variant="outline"
                className={`mt-2 ${roleColors[user.role] || roleColors.learner}`}
              >
                {user.role}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-stone-400">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-stone-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-stone-400">
                <Repeat className="h-4 w-4" />
                <span className="text-sm">{totalCycles} cycles total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Cycles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-stone-100">{totalCycles}</div>
                <p className="text-sm text-stone-500">Total Cycles</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-400">{activeCycles}</div>
                <p className="text-sm text-stone-500">Active</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-400">{completedCycles}</div>
                <p className="text-sm text-stone-500">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Cycles List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">User Cycles</CardTitle>
            </CardHeader>
            <CardContent>
              {cycles && cycles.length > 0 ? (
                <div className="space-y-3">
                  {cycles.map((cycle) => (
                    <Link
                      key={cycle.id}
                      href={`/admin/cycles/${cycle.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-stone-100">
                          {cycle.name || 'Untitled Cycle'}
                        </p>
                        <p className="text-xs text-stone-500">
                          ID: {cycle.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-stone-400">
                          <Target className="h-4 w-4" />
                          <span className="text-sm">Step {cycle.current_step}</span>
                        </div>
                        <Badge className={statusColors[cycle.status] || statusColors.active}>
                          {cycle.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-stone-500">
                  This user has no cycles yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
