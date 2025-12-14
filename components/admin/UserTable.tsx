'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Eye, Pencil, UserCog, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserWithCycles {
  id: string;
  email: string;
  name: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'superadmin';
  avatar_url: string | null;
  created_at: string;
  cycle_count: number;
}

interface UserTableProps {
  users: UserWithCycles[];
  onImpersonate?: (userId: string) => void;
  onDelete?: (userId: string) => void;
}

const roleColors: Record<string, string> = {
  learner: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  facilitator: 'bg-green-500/20 text-green-400 border-green-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  superadmin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function UserTable({ users, onImpersonate, onDelete }: UserTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleImpersonate = async (userId: string) => {
    setLoadingId(userId);
    if (onImpersonate) {
      await onImpersonate(userId);
    }
    setLoadingId(null);
  };

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
    <div className="rounded-lg border border-stone-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-stone-900/50 hover:bg-stone-900/50">
            <TableHead className="text-stone-400">User</TableHead>
            <TableHead className="text-stone-400">Role</TableHead>
            <TableHead className="text-stone-400 text-center">Cycles</TableHead>
            <TableHead className="text-stone-400">Joined</TableHead>
            <TableHead className="text-stone-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className="hover:bg-stone-800/50 border-stone-800"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-stone-700 text-stone-300 text-sm">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-stone-100">
                        {user.name || 'No name'}
                      </p>
                      <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={roleColors[user.role] || roleColors.learner}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-stone-300">{user.cycle_count}</span>
                </TableCell>
                <TableCell className="text-stone-400">
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-stone-400 hover:text-stone-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      {user.role !== 'superadmin' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleImpersonate(user.id)}
                            disabled={loadingId === user.id}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            {loadingId === user.id ? 'Loading...' : 'Impersonate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400"
                            onClick={() => onDelete?.(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
