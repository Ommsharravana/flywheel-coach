'use client';

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
import { Eye, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CycleWithUser {
  id: string;
  name: string | null;
  status: 'active' | 'completed' | 'abandoned';
  current_step: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface CycleTableProps {
  cycles: CycleWithUser[];
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  abandoned: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
};

const stepLabels: Record<number, string> = {
  1: 'Problem Discovery',
  2: 'Context Discovery',
  3: 'Value Discovery',
  4: 'Workflow Classification',
  5: 'Prompt Generation',
  6: 'Building',
  7: 'Deployment',
  8: 'Impact Discovery',
};

export function CycleTable({ cycles }: CycleTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-stone-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-stone-900/50 hover:bg-stone-900/50">
            <TableHead className="text-stone-400">Cycle</TableHead>
            <TableHead className="text-stone-400">User</TableHead>
            <TableHead className="text-stone-400">Step</TableHead>
            <TableHead className="text-stone-400">Status</TableHead>
            <TableHead className="text-stone-400">Updated</TableHead>
            <TableHead className="text-stone-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cycles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-stone-500">
                No cycles found
              </TableCell>
            </TableRow>
          ) : (
            cycles.map((cycle) => (
              <TableRow
                key={cycle.id}
                className="hover:bg-stone-800/50 border-stone-800"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-stone-100">
                      {cycle.name || 'Untitled Cycle'}
                    </p>
                    <p className="text-xs text-stone-500">
                      ID: {cycle.id.slice(0, 8)}...
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {cycle.user ? (
                    <div>
                      <p className="text-sm text-stone-100">
                        {cycle.user.name || 'No name'}
                      </p>
                      <p className="text-xs text-stone-500">{cycle.user.email}</p>
                    </div>
                  ) : (
                    <span className="text-stone-500">Unknown</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                      {cycle.current_step}
                    </div>
                    <span className="text-sm text-stone-400">
                      {stepLabels[cycle.current_step] || `Step ${cycle.current_step}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[cycle.status] || statusColors.active}
                  >
                    {cycle.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-stone-400 text-sm">
                  {formatDistanceToNow(new Date(cycle.updated_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-stone-400 hover:text-stone-100"
                    onClick={() => router.push(`/admin/cycles/${cycle.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
