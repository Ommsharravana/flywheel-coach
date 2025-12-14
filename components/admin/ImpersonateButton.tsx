'use client';

import { useState } from 'react';
import { UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ImpersonateButtonProps {
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function ImpersonateButton({ userId, userName, userEmail }: ImpersonateButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleImpersonate() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          reason: reason || 'Admin support request',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start impersonation');
      }

      toast.success(`Now impersonating ${userName || userEmail}`);
      setOpen(false);

      // Redirect to user's dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Impersonation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start impersonation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserCog className="h-4 w-4" />
          Impersonate
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-stone-900 border-stone-800">
        <DialogHeader>
          <DialogTitle className="text-stone-100">Impersonate User</DialogTitle>
          <DialogDescription className="text-stone-400">
            You are about to impersonate <strong className="text-stone-200">{userName || userEmail}</strong>.
            You will see the app exactly as they see it. This action will be logged.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason" className="text-stone-300">
            Reason for impersonation (optional)
          </Label>
          <Textarea
            id="reason"
            placeholder="e.g., Helping user troubleshoot an issue"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 bg-stone-800 border-stone-700 text-stone-100"
            rows={3}
          />
          <p className="text-xs text-stone-500 mt-2">
            Session will automatically expire after 4 hours.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-stone-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImpersonate}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            {loading ? 'Starting...' : 'Start Impersonation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
