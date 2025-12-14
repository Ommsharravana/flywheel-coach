import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { UserEditForm } from '@/components/admin/UserEditForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'superadmin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch user
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !userData) {
    notFound();
  }

  const user = userData as unknown as UserRow;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/users/${id}`}>
          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">
            Edit User
          </h1>
          <p className="text-stone-400">
            Update user information for {user.name || user.email}
          </p>
        </div>
      </div>

      <UserEditForm user={user} />
    </div>
  );
}
