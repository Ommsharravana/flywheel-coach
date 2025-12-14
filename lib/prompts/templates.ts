// Workflow-specific prompt templates from PRD
// Each template includes actions, features, and constraints for Lovable prompts

export interface WorkflowTemplate {
  type: string;
  name: string;
  action1: string;
  action2: string;
  action3: string;
  features: string[];
  constraints: string[];
}

export const PROMPT_TEMPLATES: Record<string, WorkflowTemplate> = {
  AUDIT: {
    type: 'AUDIT',
    name: 'Audit',
    action1: 'Upload content to evaluate',
    action2: 'See scores against defined criteria',
    action3: 'Get specific feedback and improvement suggestions',
    features: [
      'Scoring dashboard with visual indicators',
      'Rubric management (create/edit criteria)',
      'History view showing improvements over time',
      'Export to PDF for reporting',
    ],
    constraints: [
      'Consistent, fair evaluation every time',
      'Clear explanation of each score',
    ],
  },
  GENERATION: {
    type: 'GENERATION',
    name: 'Generation',
    action1: 'Provide context and requirements',
    action2: 'Choose from templates or customize',
    action3: 'Generate content and refine',
    features: [
      'Template library organized by type',
      'Customization options (tone, length, format)',
      'Version history to compare outputs',
      'Export in multiple formats',
    ],
    constraints: [
      'Brand-consistent output',
      'Editable before finalizing',
    ],
  },
  TRANSFORMATION: {
    type: 'TRANSFORMATION',
    name: 'Transformation',
    action1: 'Upload or input source content',
    action2: 'Apply transformation rules automatically',
    action3: 'Review and export in target format',
    features: [
      'Batch processing for multiple items',
      'Preview before final transformation',
      'Rule customization interface',
      'Multiple export format options (PDF, Word, Excel, JSON)',
    ],
    constraints: [
      'Preserve critical information during conversion',
      'Handle edge cases and malformed inputs gracefully',
    ],
  },
  CLASSIFICATION: {
    type: 'CLASSIFICATION',
    name: 'Classification',
    action1: 'Submit item to classify',
    action2: 'See automatic categorization with confidence score',
    action3: 'Route to appropriate destination',
    features: [
      'Auto-categorization with confidence indicators',
      'Manual override and correction capability',
      'Routing rules configuration',
      'Analytics on category distribution',
    ],
    constraints: [
      'Handle ambiguous cases with human review option',
      'Learn from corrections to improve accuracy',
    ],
  },
  EXTRACTION: {
    type: 'EXTRACTION',
    name: 'Extraction',
    action1: 'Upload unstructured documents',
    action2: 'See extracted structured data',
    action3: 'Verify and export to destination',
    features: [
      'Bulk upload capability (100+ at once)',
      'Side-by-side source vs extracted view',
      'Confidence highlighting for uncertain extractions',
      'Export to Excel, database, or API',
    ],
    constraints: [
      'Handle poor quality scans and photos',
      'Support multiple document formats (PDF, Word, images)',
    ],
  },
  SYNTHESIS: {
    type: 'SYNTHESIS',
    name: 'Synthesis',
    action1: 'Connect or upload multiple data sources',
    action2: 'See unified insights and patterns',
    action3: 'Drill down to source details',
    features: [
      'Multi-source integration dashboard',
      'Theme and pattern identification',
      'Source attribution for all insights',
      'Trend visualization over time',
    ],
    constraints: [
      'Handle conflicting information transparently',
      'Show confidence levels in synthesized conclusions',
    ],
  },
  PREDICTION: {
    type: 'PREDICTION',
    name: 'Prediction',
    action1: 'Input or import historical data',
    action2: 'See predictions with probability scores',
    action3: 'Understand reasoning and take action',
    features: [
      'Risk/opportunity score dashboard (color-coded)',
      'Trend and projection visualization',
      'Alert system for high-risk/opportunity cases',
      'Intervention tracking and outcome logging',
    ],
    constraints: [
      'Explain predictions in human-readable terms',
      'Work gracefully with incomplete data',
    ],
  },
  RECOMMENDATION: {
    type: 'RECOMMENDATION',
    name: 'Recommendation',
    action1: 'Input context and preferences',
    action2: 'See ranked options with match scores',
    action3: 'Compare and select recommendation',
    features: [
      'Ranked list with match percentage',
      'Reasoning explanation for each recommendation',
      'Side-by-side comparison view',
      'Action tracking for selected recommendations',
    ],
    constraints: [
      'Explain reasoning in simple terms',
      'Update dynamically as preferences change',
    ],
  },
  MONITORING: {
    type: 'MONITORING',
    name: 'Monitoring',
    action1: 'See real-time status of all items being monitored',
    action2: 'Get alerts when something needs attention',
    action3: 'Track history and identify trends',
    features: [
      'Status dashboard with visual indicators',
      'Alert configuration (thresholds, recipients)',
      'History view with trends',
      'Export for reporting',
    ],
    constraints: [
      'Real-time updates without manual refresh',
      'Works even if some data sources are offline',
    ],
  },
  ORCHESTRATION: {
    type: 'ORCHESTRATION',
    name: 'Orchestration',
    action1: 'Define workflow steps and triggers',
    action2: 'Track progress through each step',
    action3: 'Handle exceptions and complete workflow',
    features: [
      'Visual workflow designer',
      'Status tracking dashboard per item',
      'Automatic notifications at each step',
      'Exception handling and escalation rules',
    ],
    constraints: [
      'Easy to modify workflows without coding',
      'Handle delays and timeouts gracefully',
    ],
  },
};

// Generate a Lovable prompt from cycle data using workflow-specific template
export function generateLovablePrompt(
  workflowType: string,
  problem: {
    refinedStatement?: string;
    statement?: string;
    frequency?: string;
    painLevel?: number;
  },
  context: {
    who?: string;
    when?: string;
    currentSolution?: string;
  }
): string {
  const template = PROMPT_TEMPLATES[workflowType.toUpperCase()] || PROMPT_TEMPLATES.MONITORING;
  const problemStatement = problem.refinedStatement || problem.statement || 'Problem not specified';
  const primaryUsers = context.who || 'users';

  return `Build me a ${template.name.toLowerCase()} app where ${primaryUsers} can:

1. ${template.action1}
2. ${template.action2}
3. ${template.action3}

CONTEXT:
- Problem: "${problemStatement}"
- Frequency: ${problem.frequency || 'daily'}
- Current workaround: ${context.currentSolution || 'Manual process'}
- Pain level: ${problem.painLevel || 5}/10

INCLUDE:
${template.features.map(f => `- ${f}`).join('\n')}

MAKE IT:
- Work on mobile (users access on phones)
- Work on slow internet (2G compatible)
- Simple enough for ${primaryUsers}
${template.constraints.map(c => `- ${c}`).join('\n')}`;
}
