'use client';

import { useState } from 'react';
import { Cycle, WorkflowType } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Cog, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface WorkflowClassifierProps {
  cycle: Cycle;
}

const WORKFLOW_TYPES: { id: WorkflowType; name: string; icon: string; description: string; examples: string[] }[] = [
  {
    id: 'form-to-output',
    name: 'Form to Output',
    icon: '📝',
    description: 'User fills a form, gets a result (PDF, report, calculation)',
    examples: ['Resume builder', 'Invoice generator', 'Quiz grader'],
  },
  {
    id: 'data-entry',
    name: 'Data Entry',
    icon: '📊',
    description: 'Capturing and storing structured information',
    examples: ['Attendance tracker', 'Expense logger', 'Student records'],
  },
  {
    id: 'approval-workflow',
    name: 'Approval Workflow',
    icon: '✅',
    description: 'Multi-step process with approvals or reviews',
    examples: ['Leave requests', 'Purchase approvals', 'Document review'],
  },
  {
    id: 'notification-system',
    name: 'Notification System',
    icon: '🔔',
    description: 'Alerting users about events or deadlines',
    examples: ['Assignment reminders', 'Meeting alerts', 'Deadline tracker'],
  },
  {
    id: 'search-filter',
    name: 'Search & Filter',
    icon: '🔍',
    description: 'Finding and filtering through data or content',
    examples: ['Resource finder', 'Course search', 'Job board'],
  },
  {
    id: 'dashboard-analytics',
    name: 'Dashboard & Analytics',
    icon: '📈',
    description: 'Visualizing data and tracking metrics',
    examples: ['Grade tracker', 'Progress dashboard', 'Performance metrics'],
  },
  {
    id: 'content-management',
    name: 'Content Management',
    icon: '📁',
    description: 'Creating, organizing, and publishing content',
    examples: ['Notes organizer', 'Study material library', 'Blog platform'],
  },
  {
    id: 'scheduling-booking',
    name: 'Scheduling & Booking',
    icon: '📅',
    description: 'Managing time slots, appointments, or reservations',
    examples: ['Meeting scheduler', 'Lab booking', 'Office hours'],
  },
  {
    id: 'inventory-tracking',
    name: 'Inventory Tracking',
    icon: '📦',
    description: 'Managing items, stock, or resources',
    examples: ['Lab equipment tracker', 'Library catalog', 'Asset manager'],
  },
  {
    id: 'communication-hub',
    name: 'Communication Hub',
    icon: '💬',
    description: 'Facilitating messaging or discussions',
    examples: ['Q&A forum', 'Announcement board', 'Feedback collector'],
  },
  {
    id: 'custom',
    name: 'Custom / Other',
    icon: '✏️',
    description: 'Define your own workflow type if none of the above fit',
    examples: ['Hybrid workflows', 'Unique use cases', 'Novel solutions'],
  },
];

export function WorkflowClassifier({ cycle }: WorkflowClassifierProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();

  const [selectedType, setSelectedType] = useState<WorkflowType | null>(
    cycle.workflowClassification?.selectedType || null
  );
  const [reasoning, setReasoning] = useState(cycle.workflowClassification?.reasoning || '');
  const [customDescription, setCustomDescription] = useState(cycle.workflowClassification?.customDescription || '');
  const [showDetails, setShowDetails] = useState<WorkflowType | null>(null);

  const selectedWorkflow = WORKFLOW_TYPES.find((w) => w.id === selectedType);

  const saveWorkflow = async (complete = false) => {
    if (!selectedType) {
      toast.error('Please select a workflow type.');
      return;
    }

    if (selectedType === 'custom' && !customDescription.trim()) {
      toast.error('Please describe your custom workflow.');
      return;
    }

    setIsPending(true);
    try {
      // Map UI workflow types to DB workflow types
      // DB expects: AUDIT, GENERATION, TRANSFORMATION, CLASSIFICATION, EXTRACTION, SYNTHESIS, PREDICTION, RECOMMENDATION, MONITORING, ORCHESTRATION
      const typeMapping: Record<string, string> = {
        'form-to-output': 'GENERATION',
        'data-entry': 'EXTRACTION',
        'approval-workflow': 'ORCHESTRATION',
        'notification-system': 'MONITORING',
        'search-filter': 'CLASSIFICATION',
        'dashboard-analytics': 'SYNTHESIS',
        'content-management': 'TRANSFORMATION',
        'scheduling-booking': 'ORCHESTRATION',
        'inventory-tracking': 'AUDIT',
        'communication-hub': 'SYNTHESIS',
        'custom': 'GENERATION', // Default to GENERATION for custom workflows
      };

      const dbWorkflowType = typeMapping[selectedType] || 'GENERATION';

      const workflowData = {
        cycle_id: cycle.id,
        workflow_type: dbWorkflowType,
        classification_path: {
          original_type: selectedType,
          reasoning,
          custom_description: selectedType === 'custom' ? customDescription : undefined,
        },
        confidence: reasoning.trim().length > 50 ? 'high' : reasoning.trim().length > 20 ? 'medium' : 'low',
        completed: complete,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: fetchError } = await supabase
        .from('workflow_classifications')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase.from('workflow_classifications').update(workflowData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workflow_classifications').insert({
          ...workflowData,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      if (complete) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 5,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success('Workflow classified!');
        router.push(`/cycle/${cycle.id}/step/5`);
      } else {
        toast.success('Saved!');
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Error saving workflow:', error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Problem reminder */}
      {cycle.problem && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-400 mb-1">Classifying workflow for:</p>
            <p className="text-stone-200 font-medium">
              "{cycle.problem.refinedStatement || cycle.problem.statement}"
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Cog className="w-5 h-5 text-amber-400" />
            Choose Your Workflow Type
          </CardTitle>
          <CardDescription>
            Select the workflow pattern that best matches your solution. This helps generate a better prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {WORKFLOW_TYPES.map((workflow) => (
              <motion.button
                key={workflow.id}
                onClick={() => setSelectedType(workflow.id)}
                onMouseEnter={() => setShowDetails(workflow.id)}
                onMouseLeave={() => setShowDetails(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedType === workflow.id
                    ? 'bg-amber-500/20 border-2 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-stone-800/50 border border-stone-700 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{workflow.icon}</span>
                  <span className="font-medium text-stone-200">{workflow.name}</span>
                  {selectedType === workflow.id && (
                    <Check className="w-5 h-5 text-amber-400 ml-auto" />
                  )}
                </div>
                <p className="text-sm text-stone-400">{workflow.description}</p>

                {showDetails === workflow.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-stone-700"
                  >
                    <p className="text-xs text-stone-500 mb-1">Examples:</p>
                    <div className="flex flex-wrap gap-1">
                      {workflow.examples.map((ex) => (
                        <Badge key={ex} variant="outline" className="text-xs">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected workflow details */}
      {selectedWorkflow && (
        <Card className="glass-card border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
              <span className="text-2xl">{selectedWorkflow.icon}</span>
              {selectedWorkflow.name} Selected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedType === 'custom' && (
              <div>
                <Label className="text-stone-300 mb-2 block">
                  Describe your custom workflow <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe the workflow pattern that fits your solution. What are the main steps? What inputs and outputs does it have?"
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500 min-h-[100px]"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Be specific about the flow: who does what, in what order, and what the outcome is.
                </p>
              </div>
            )}
            <div>
              <Label className="text-stone-300 mb-2 block">
                Why does this workflow fit your problem?
              </Label>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Explain why this workflow type matches your problem..."
                className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
              />
            </div>

            <div className="p-4 bg-stone-800/30 rounded-lg">
              <p className="text-sm text-stone-400 mb-2">This workflow typically includes:</p>
              <ul className="text-sm text-stone-300 space-y-1">
                {selectedWorkflow.id === 'form-to-output' && (
                  <>
                    <li>• Input form with validation</li>
                    <li>• Processing logic</li>
                    <li>• Output display or download</li>
                  </>
                )}
                {selectedWorkflow.id === 'data-entry' && (
                  <>
                    <li>• Data input forms</li>
                    <li>• Database storage</li>
                    <li>• List/table views</li>
                  </>
                )}
                {selectedWorkflow.id === 'approval-workflow' && (
                  <>
                    <li>• Request submission</li>
                    <li>• Status tracking</li>
                    <li>• Approval/rejection actions</li>
                  </>
                )}
                {selectedWorkflow.id === 'dashboard-analytics' && (
                  <>
                    <li>• Data visualization charts</li>
                    <li>• Metric cards</li>
                    <li>• Filters and date ranges</li>
                  </>
                )}
                {/* Add more as needed */}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/3`)}>
          Back to Value
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => saveWorkflow(false)} disabled={isPending || !selectedType}>
            <Save className="mr-2 w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveWorkflow(true)}
            disabled={!selectedType || isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isPending ? 'Saving...' : 'Complete & Continue'}
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
