'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CycleActionsProps {
  cycleId: string;
}

export function CycleActions({ cycleId }: CycleActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const handleRestart = async () => {
    startTransition(async () => {
      try {
        // Get conversation IDs for this cycle first
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .eq('cycle_id', cycleId);

        // Delete messages for those conversations
        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map((c: { id: string }) => c.id);
          for (const convId of conversationIds) {
            await supabase.from('messages').delete().eq('conversation_id', convId);
          }
        }

        // Delete conversations
        await supabase.from('conversations').delete().eq('cycle_id', cycleId);
        await supabase.from('impacts').delete().eq('cycle_id', cycleId);
        await supabase.from('builds').delete().eq('cycle_id', cycleId);
        await supabase.from('prompts').delete().eq('cycle_id', cycleId);
        await supabase.from('workflow_classifications').delete().eq('cycle_id', cycleId);
        await supabase.from('value_assessments').delete().eq('cycle_id', cycleId);
        await supabase.from('contexts').delete().eq('cycle_id', cycleId);
        await supabase.from('problems').delete().eq('cycle_id', cycleId);

        // Reset cycle to step 1
        await supabase
          .from('cycles')
          .update({
            current_step: 1,
            status: 'in_progress',
            impact_score: null,
            completed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycleId);

        toast.success('Cycle restarted! Starting fresh from Step 1.');
        router.push(`/cycle/${cycleId}/step/1`);
        router.refresh();
      } catch (error) {
        console.error('Error restarting cycle:', error);
        toast.error('Failed to restart cycle.');
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">
          <RotateCcw className="mr-2 h-4 w-4" />
          Restart
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-stone-900 border-stone-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-stone-100">Restart this cycle?</AlertDialogTitle>
          <AlertDialogDescription className="text-stone-400">
            This will delete all progress and data for this cycle and start fresh from Step 1.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRestart}
            disabled={isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isPending ? 'Restarting...' : 'Yes, restart cycle'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
