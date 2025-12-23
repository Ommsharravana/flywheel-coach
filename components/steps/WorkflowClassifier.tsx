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

  // Support multi-select with backward compatibility for single selection
  const [selectedTypes, setSelectedTypes] = useState<WorkflowType[]>(() => {
    if (cycle.workflowClassification?.selectedTypes?.length) {
      return cycle.workflowClassification.selectedTypes;
    }
    // Backward compat: convert single selectedType to array
    if (cycle.workflowClassification?.selectedType) {
      return [cycle.workflowClassification.selectedType];
    }
    return [];
  });
  const [reasoning, setReasoning] = useState(cycle.workflowClassification?.reasoning || '');
  const [customDescription, setCustomDescription] = useState(cycle.workflowClassification?.customDescription || '');
  const [showDetails, setShowDetails] = useState<WorkflowType | null>(null);

  // Toggle workflow selection (add if not present, remove if present)
  const toggleWorkflow = (id: WorkflowType) => {
    setSelectedTypes(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  // Get all selected workflows for display
  const selectedWorkflows = WORKFLOW_TYPES.filter((w) => selectedTypes.includes(w.id));

  const saveWorkflow = async (complete = false) => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one workflow type.');
      return;
    }

    if (selectedTypes.includes('custom') && !customDescription.trim()) {
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

      // Use first selected type as primary for DB (backward compat)
      const primaryType = selectedTypes[0];
      const dbWorkflowType = typeMapping[primaryType] || 'GENERATION';

      const workflowData = {
        cycle_id: cycle.id,
        workflow_type: dbWorkflowType,
        classification_path: {
          original_type: primaryType, // Primary for backward compat
          original_types: selectedTypes, // All selected types
          reasoning,
          custom_description: selectedTypes.includes('custom') ? customDescription : undefined,
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
              &quot;{cycle.problem.refinedStatement || cycle.problem.statement}&quot;
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
          <p className="text-sm text-amber-400/80 mb-3">
            You can select multiple workflow types to create a hybrid solution.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {WORKFLOW_TYPES.map((workflow) => {
              const isSelected = selectedTypes.includes(workflow.id);
              return (
                <motion.button
                  key={workflow.id}
                  onClick={() => toggleWorkflow(workflow.id)}
                  onMouseEnter={() => setShowDetails(workflow.id)}
                  onMouseLeave={() => setShowDetails(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-2 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-stone-800/50 border border-stone-700 hover:border-stone-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{workflow.icon}</span>
                    <span className="font-medium text-stone-200">{workflow.name}</span>
                    {isSelected && (
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected workflow details */}
      {selectedWorkflows.length > 0 && (
        <Card className="glass-card border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-400 flex items-center gap-2 flex-wrap">
              {selectedWorkflows.map((w, i) => (
                <span key={w.id} className="flex items-center gap-1">
                  <span className="text-2xl">{w.icon}</span>
                  <span>{w.name}</span>
                  {i < selectedWorkflows.length - 1 && <span className="text-stone-500 mx-1">+</span>}
                </span>
              ))}
            </CardTitle>
            {selectedWorkflows.length > 1 && (
              <p className="text-sm text-stone-400 mt-1">
                Hybrid workflow combining {selectedWorkflows.length} types
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTypes.includes('custom') && (
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
                Why {selectedWorkflows.length > 1 ? 'do these workflows fit' : 'does this workflow fit'} your problem?
              </Label>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder={selectedWorkflows.length > 1
                  ? "Explain why these workflow types together match your problem..."
                  : "Explain why this workflow type matches your problem..."
                }
                className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
              />
            </div>

            <div className="p-4 bg-stone-800/30 rounded-lg">
              <p className="text-sm text-stone-400 mb-2">
                {selectedWorkflows.length > 1 ? 'These workflows typically include:' : 'This workflow typically includes:'}
              </p>
              <ul className="text-sm text-stone-300 space-y-1">
                {selectedTypes.includes('form-to-output') && (
                  <>
                    <li>• Input form with validation</li>
                    <li>• Processing logic</li>
                    <li>• Output display or download</li>
                  </>
                )}
                {selectedTypes.includes('data-entry') && (
                  <>
                    <li>• Data input forms</li>
                    <li>• Database storage</li>
                    <li>• List/table views</li>
                  </>
                )}
                {selectedTypes.includes('approval-workflow') && (
                  <>
                    <li>• Request submission</li>
                    <li>• Status tracking</li>
                    <li>• Approval/rejection actions</li>
                  </>
                )}
                {selectedTypes.includes('dashboard-analytics') && (
                  <>
                    <li>• Data visualization charts</li>
                    <li>• Metric cards</li>
                    <li>• Filters and date ranges</li>
                  </>
                )}
                {selectedTypes.includes('notification-system') && (
                  <>
                    <li>• Alert triggers and rules</li>
                    <li>• Notification channels</li>
                    <li>• Status tracking</li>
                  </>
                )}
                {selectedTypes.includes('search-filter') && (
                  <>
                    <li>• Search interface</li>
                    <li>• Filter controls</li>
                    <li>• Results display</li>
                  </>
                )}
                {selectedTypes.includes('content-management') && (
                  <>
                    <li>• Content editor</li>
                    <li>• Organization/folders</li>
                    <li>• Publishing workflow</li>
                  </>
                )}
                {selectedTypes.includes('scheduling-booking') && (
                  <>
                    <li>• Calendar interface</li>
                    <li>• Booking form</li>
                    <li>• Availability management</li>
                  </>
                )}
                {selectedTypes.includes('inventory-tracking') && (
                  <>
                    <li>• Item catalog</li>
                    <li>• Stock tracking</li>
                    <li>• Movement history</li>
                  </>
                )}
                {selectedTypes.includes('communication-hub') && (
                  <>
                    <li>• Message threads</li>
                    <li>• User mentions</li>
                    <li>• Notification system</li>
                  </>
                )}
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
          <Button variant="outline" onClick={() => saveWorkflow(false)} disabled={isPending || selectedTypes.length === 0}>
            <Save className="mr-2 w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveWorkflow(true)}
            disabled={selectedTypes.length === 0 || isPending}
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
