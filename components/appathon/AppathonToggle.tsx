'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

interface AppathonToggleProps {
  userId: string;
  initialValue: boolean;
}

export function AppathonToggle({ userId, initialValue }: AppathonToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialValue);
  const supabase = createClient();

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            appathon_mode: checked,
            appathon_mode_toggled_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
        toast.success(
          checked ? 'Appathon Mode enabled!' : 'Appathon Mode disabled'
        );
        router.refresh();
      } catch (error) {
        console.error('Error toggling Appathon mode:', error);
        setEnabled(!checked);
        toast.error('Failed to update setting');
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
      <div className="flex items-center gap-3">
        <Trophy className="w-5 h-5 text-amber-400" />
        <div>
          <Label htmlFor="appathon-mode" className="text-stone-200 font-medium">
            Appathon 2.0 Mode
          </Label>
          <p className="text-xs text-stone-400 mt-0.5">
            See problem ideas, judging criteria, and 10-day roadmap
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-amber-400 border-amber-500/50 ml-2"
        >
          Dec 21 - Jan 3
        </Badge>
      </div>
      <Switch
        id="appathon-mode"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}
