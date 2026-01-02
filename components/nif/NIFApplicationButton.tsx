'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import {
  Rocket,
  Loader2,
  CheckCircle,
  Users,
  Lightbulb,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface NIFApplicationButtonProps {
  cycleId: string;
  cycleName: string;
}

interface ApplicationStatus {
  hasApplied: boolean;
  status?: string;
  suggestedMentors?: string[];
  selectedMentorId?: string;
}

export function NIFApplicationButton({ cycleId, cycleName }: NIFApplicationButtonProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    hasApplied: false,
  });

  // Form state
  const [startupName, setStartupName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [motivation, setMotivation] = useState('');
  const [goals, setGoals] = useState('');

  useEffect(() => {
    checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId]);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      // Check if already applied
      const { data: existingApp } = await supabase
        .from('nif_applications')
        .select('id, status, suggested_mentors, selected_mentor_id')
        .eq('cycle_id', cycleId)
        .single();

      if (existingApp) {
        setApplicationStatus({
          hasApplied: true,
          status: existingApp.status,
          suggestedMentors: existingApp.suggested_mentors,
          selectedMentorId: existingApp.selected_mentor_id,
        });
        setEligible(false);
      } else {
        // Check eligibility via RPC
        const { data: isEligible } = await supabase.rpc('is_cycle_nif_eligible', {
          p_cycle_id: cycleId,
        });
        setEligible(isEligible === true);
        setApplicationStatus({ hasApplied: false });
      }
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!motivation.trim()) {
      toast.error('Please tell us why you want to join NIF');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('submit_nif_application', {
        p_cycle_id: cycleId,
        p_startup_name: startupName || null,
        p_team_description: teamDescription || null,
        p_motivation: motivation,
        p_goals: goals || null,
        p_tier: 'tier1',
      });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setOpen(false);
      setApplicationStatus({
        hasApplied: true,
        status: 'pending',
      });
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Button disabled variant="outline" className="border-orange-500/50">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking eligibility...
      </Button>
    );
  }

  // Already applied - show status
  if (applicationStatus.hasApplied) {
    const statusConfig = {
      pending: {
        label: 'Application Pending',
        color: 'text-yellow-400 border-yellow-500/50',
        icon: Loader2,
      },
      under_review: {
        label: 'Under Review',
        color: 'text-blue-400 border-blue-500/50',
        icon: Lightbulb,
      },
      mentor_selection: {
        label: 'Select Your Mentor',
        color: 'text-orange-400 border-orange-500/50',
        icon: Users,
      },
      active: {
        label: 'Active Incubation',
        color: 'text-emerald-400 border-emerald-500/50',
        icon: CheckCircle,
      },
      completed: {
        label: 'Incubation Complete',
        color: 'text-purple-400 border-purple-500/50',
        icon: GraduationCap,
      },
      rejected: {
        label: 'Application Not Approved',
        color: 'text-red-400 border-red-500/50',
        icon: AlertCircle,
      },
    };

    const config = statusConfig[applicationStatus.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`px-4 py-2 ${config.color}`}>
        <Icon className={`mr-2 h-4 w-4 ${applicationStatus.status === 'pending' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  }

  // Not eligible
  if (!eligible) {
    return null;
  }

  // Eligible - show apply button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Apply for NIF Incubation
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-stone-900 border-stone-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-400" />
            NIF Incubation Application
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Apply for Tier 1 incubation support for &quot;{cycleName}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <Card className="bg-stone-800/50 border-stone-700">
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-stone-300 mb-3">Tier 1 Benefits</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-orange-500/10">
                <Users className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                <p className="text-xs text-stone-400">1:1 Mentor</p>
              </div>
              <div className="p-2 rounded bg-orange-500/10">
                <Lightbulb className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                <p className="text-xs text-stone-400">Resources</p>
              </div>
              <div className="p-2 rounded bg-orange-500/10">
                <GraduationCap className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                <p className="text-xs text-stone-400">Network</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startup-name" className="text-stone-300">
              Startup/Project Name (optional)
            </Label>
            <Input
              id="startup-name"
              placeholder="e.g., MediTrack"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              className="bg-stone-800 border-stone-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team" className="text-stone-300">
              Team Description (optional)
            </Label>
            <Textarea
              id="team"
              placeholder="Who's on your team? Their skills and roles..."
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              className="bg-stone-800 border-stone-700 min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation" className="text-stone-300">
              Why do you want to be incubated? <span className="text-orange-400">*</span>
            </Label>
            <Textarea
              id="motivation"
              placeholder="What do you hope to achieve through NIF incubation?"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="bg-stone-800 border-stone-700 min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals" className="text-stone-300">
              Goals for the next 3 months (optional)
            </Label>
            <Textarea
              id="goals"
              placeholder="Where do you want your project to be in 3 months?"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="bg-stone-800 border-stone-700 min-h-[60px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-stone-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
