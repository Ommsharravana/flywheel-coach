// Multi-prompt sequence generator for Lovable
// Generates 9 prompts per workflow: 3 Foundation + 4 Features + 2 Polish

import { PROMPT_TEMPLATES } from './templates';

export interface PromptStep {
  number: number;
  phase: 'foundation' | 'features' | 'polish';
  title: string;
  description: string;
  prompt: string;
}

export interface PromptContext {
  workflowType: string; // Primary workflow type (backward compat)
  workflowTypes?: string[]; // All selected types for hybrid generation
  problemStatement: string;
  frequency: string;
  painLevel: number;
  currentSolution: string;
  primaryUsers: string;
  when: string;
  // Step 3: Value Assessment data
  valueAssessment?: {
    desperateUserScore: number;
    criteria: {
      activelySearching: boolean;
      triedAlternatives: boolean;
      willingToPay: boolean;
      urgentNeed: boolean;
      frequentProblem: boolean;
    };
    evidence: {
      activelySearching: string;
      triedAlternatives: string;
      willingToPay: string;
      urgentNeed: string;
      frequentProblem: string;
    };
  };
  // Step 4: Custom workflow description
  customWorkflowDescription?: string;
}

// Workflow-specific feature prompts (prompts 4-7)
const WORKFLOW_FEATURE_SEQUENCES: Record<string, { title: string; description: string; promptTemplate: string }[]> = {
  AUDIT: [
    {
      title: 'Upload & Input Interface',
      description: 'Build the interface for uploading content to be evaluated',
      promptTemplate: `We have auth, data model, and navigation. Now add the Upload interface:

1. Upload page with:
   - Drag-and-drop file upload zone
   - Support for multiple file types (PDF, images, text)
   - File preview after upload
   - "Start Evaluation" button

2. Manual input option:
   - Text area for pasting content
   - Rich text formatting (optional)

3. Recent uploads list:
   - Show last 5 uploads
   - Quick re-evaluate option

Save uploaded content to database.
Keep existing navigation unchanged.`,
    },
    {
      title: 'Criteria & Rubric Management',
      description: 'Create and manage evaluation criteria',
      promptTemplate: `We have upload working. Now add Criteria Management:

1. Criteria page with:
   - List of existing rubrics
   - "Create New Rubric" button
   - Edit/Delete existing rubrics

2. Rubric builder:
   - Add criteria items (name + description + weight)
   - Set scoring scale (1-5, 1-10, or pass/fail)
   - Reorder criteria with drag-and-drop
   - Save as template for reuse

3. Default rubrics:
   - Pre-populate with 2-3 common rubrics for [WORKFLOW_CONTEXT]

Keep existing upload and navigation unchanged.`,
    },
    {
      title: 'Scoring Engine & Results',
      description: 'Evaluate content against criteria and show scores',
      promptTemplate: `We have upload and criteria. Now add the Scoring Engine:

1. Evaluation page:
   - Side-by-side view: content on left, rubric on right
   - Score each criterion (clickable score buttons)
   - Auto-calculate total score
   - Color-coded results (green/yellow/red)

2. AI-assisted scoring (optional):
   - "Auto-score" button
   - Show AI reasoning for each score
   - Allow manual override

3. Results summary:
   - Overall score with visual gauge
   - Breakdown by criterion
   - Specific feedback for each low score

Save scores to database linked to upload.
Keep existing pages unchanged.`,
    },
    {
      title: 'History & Trends',
      description: 'View past evaluations and track improvements',
      promptTemplate: `We have scoring working. Now add History & Trends:

1. History page:
   - List all past evaluations (most recent first)
   - Filter by date, score range, rubric used
   - Search by content name

2. Individual history view:
   - See all evaluations for one item
   - Chart showing score over time
   - Compare two evaluations side-by-side

3. Trends dashboard:
   - Average scores over time (line chart)
   - Most common low-scoring criteria
   - Improvement rate percentage

Keep all existing pages working.`,
    },
  ],
  GENERATION: [
    {
      title: 'Template Library',
      description: 'Browse and organize content templates',
      promptTemplate: `We have auth, data model, and navigation. Now add the Template Library:

1. Templates page:
   - Grid/list view of available templates
   - Categories (organize by type)
   - Search and filter
   - "Create New Template" button

2. Template card shows:
   - Template name
   - Preview snippet
   - Category tag
   - Use count

3. Template detail view:
   - Full template content
   - Variables marked (e.g., [NAME], [DATE])
   - "Use This Template" button
   - Edit/duplicate option for custom templates

Pre-populate with 5-10 starter templates relevant to [WORKFLOW_CONTEXT].
Keep existing navigation unchanged.`,
    },
    {
      title: 'Input & Requirements Form',
      description: 'Gather context for content generation',
      promptTemplate: `We have templates. Now add the Input Form:

1. Generate page with wizard:
   - Step 1: Select template (or start blank)
   - Step 2: Fill in variables/context
   - Step 3: Set options (tone, length, format)
   - Step 4: Review and generate

2. Context inputs:
   - Text fields for template variables
   - Dropdown for tone (formal, casual, technical)
   - Length selector (short, medium, long)
   - Format options if applicable

3. Smart defaults:
   - Remember user preferences
   - Suggest based on past generations

Keep existing templates and navigation unchanged.`,
    },
    {
      title: 'Generation & Preview',
      description: 'Generate content and allow refinement',
      promptTemplate: `We have input form. Now add Generation & Preview:

1. Generation interface:
   - "Generate" button with loading state
   - Generated content preview
   - Side-by-side view: input summary vs output

2. Refinement options:
   - "Regenerate" button
   - Edit generated content directly
   - "Make it [shorter/longer/more formal]" quick actions
   - Revision history (last 3 versions)

3. Actions:
   - Copy to clipboard
   - Save to history
   - Export (PDF, Word, plain text)

Show clear difference between original and edited.
Keep all existing pages working.`,
    },
    {
      title: 'Version History & Export',
      description: 'Track all generated content with export options',
      promptTemplate: `We have generation working. Now add History & Export:

1. History page:
   - List all generations (newest first)
   - Filter by template, date, status
   - Search content

2. Version comparison:
   - Select two versions to compare
   - Highlight differences
   - Restore previous version option

3. Export features:
   - Single export: PDF, Word, Text, HTML
   - Bulk export: Download multiple as ZIP
   - Share link (optional, public/private)

4. Analytics:
   - Most used templates
   - Generation count over time
   - Average edits per generation

Keep all existing pages working.`,
    },
  ],
  TRANSFORMATION: [
    {
      title: 'Upload & Input Interface',
      description: 'Upload source content for transformation',
      promptTemplate: `We have auth, data model, and navigation. Now add the Upload interface:

1. Upload page:
   - Drag-and-drop for files
   - Support: PDF, Word, Excel, CSV, images, JSON
   - Batch upload (multiple files at once)
   - Progress indicator for large files

2. Manual input:
   - Text area for pasting content
   - Paste from clipboard button
   - URL import option

3. Upload queue:
   - Show all pending files
   - Remove/reorder items
   - "Transform All" or individual buttons

Save uploaded content with original format preserved.
Keep existing navigation unchanged.`,
    },
    {
      title: 'Transformation Rules',
      description: 'Define and manage transformation rules',
      promptTemplate: `We have upload working. Now add Transformation Rules:

1. Rules page:
   - List of saved rule sets
   - "Create New Rule Set" button
   - Import/export rules

2. Rule builder:
   - Source format selector
   - Target format selector
   - Field mapping interface (source → target)
   - Transformation options (date formats, case, trim, etc.)

3. Pre-built rules:
   - Common transformations for [WORKFLOW_CONTEXT]
   - "Invoice PDF → Excel row"
   - "Meeting notes → Action items"

4. Rule testing:
   - Test with sample data
   - Preview output before saving

Keep existing upload and navigation unchanged.`,
    },
    {
      title: 'Preview & Verify',
      description: 'Preview transformation results before finalizing',
      promptTemplate: `We have upload and rules. Now add Preview & Verify:

1. Preview interface:
   - Side-by-side: original left, transformed right
   - Highlight mapped fields with colors
   - Show confidence score for AI transformations

2. Verification controls:
   - Approve/reject each transformation
   - Edit transformed values inline
   - Mark fields for manual review

3. Batch preview:
   - Table view of all items being transformed
   - Quick approve/reject all
   - Filter by confidence level

4. Error handling:
   - Highlight transformation failures
   - Show error reason
   - Suggest fixes

Keep existing pages working.`,
    },
    {
      title: 'Export & History',
      description: 'Export transformed content and view history',
      promptTemplate: `We have preview working. Now add Export & History:

1. Export options:
   - Single item: Download in target format
   - Batch: ZIP of all transformed files
   - Direct to destination (if API integrated)

2. Format options:
   - Excel, CSV, JSON, PDF, Word
   - Custom format templates
   - Email export option

3. History page:
   - All past transformations
   - Filter by date, source type, status
   - Re-run transformation option

4. Analytics:
   - Transformation success rate
   - Most common source/target pairs
   - Time saved estimate

Keep all existing pages working.`,
    },
  ],
  CLASSIFICATION: [
    {
      title: 'Input Interface',
      description: 'Submit items for classification',
      promptTemplate: `We have auth, data model, and navigation. Now add the Input interface:

1. Submit page:
   - Text input for item to classify
   - File upload option (for documents)
   - Batch input (CSV or line-separated)

2. Quick classify:
   - Single-item instant classification
   - Show result immediately with confidence

3. Queue view:
   - Items pending classification
   - Bulk classify button
   - Priority ordering

Keep existing navigation unchanged.`,
    },
    {
      title: 'Category Management',
      description: 'Define and manage classification categories',
      promptTemplate: `We have input working. Now add Category Management:

1. Categories page:
   - List of all categories
   - Add/edit/delete categories
   - Category hierarchy (parent/child)

2. Category definition:
   - Name and description
   - Keywords/triggers for auto-classification
   - Routing destination (who/what handles this category)
   - Color coding for visual identification

3. Pre-built categories:
   - Starter set relevant to [WORKFLOW_CONTEXT]
   - Easy import/export

Keep existing input and navigation unchanged.`,
    },
    {
      title: 'Classification Results',
      description: 'View results with confidence and routing',
      promptTemplate: `We have input and categories. Now add Classification Results:

1. Results view:
   - Assigned category with confidence percentage
   - Top 3 alternative categories
   - Reasoning explanation

2. Manual override:
   - Change category if wrong
   - This improves future accuracy
   - Add to training data option

3. Routing actions:
   - Show where item is routed
   - Manual re-route option
   - Notification to destination

4. Batch results:
   - Table view of all classified items
   - Quick approve/reject
   - Export results

Keep existing pages working.`,
    },
    {
      title: 'Analytics & Training',
      description: 'Track accuracy and improve classification',
      promptTemplate: `We have classification working. Now add Analytics & Training:

1. Analytics dashboard:
   - Category distribution pie chart
   - Classification volume over time
   - Accuracy rate (based on overrides)

2. Confusion analysis:
   - Which categories are often confused
   - Items requiring manual review
   - Confidence score distribution

3. Training interface:
   - Review low-confidence items
   - Correct and retrain
   - Add example items per category

4. Export:
   - Classification report
   - Accuracy metrics
   - Items by category

Keep all existing pages working.`,
    },
  ],
  EXTRACTION: [
    {
      title: 'Bulk Upload Interface',
      description: 'Upload documents for extraction',
      promptTemplate: `We have auth, data model, and navigation. Now add Bulk Upload:

1. Upload page:
   - Drag-and-drop zone (accepts 100+ files)
   - Support: PDF, images, scans, Word docs
   - Progress bar for processing
   - Queue management (pause/resume/cancel)

2. Upload sources:
   - Local files
   - URL/link import
   - Email forwarding address (if possible)

3. Processing status:
   - Show extraction progress per file
   - Estimated time remaining
   - Error/success indicators

Keep existing navigation unchanged.`,
    },
    {
      title: 'Extraction Schema',
      description: 'Define what fields to extract',
      promptTemplate: `We have upload working. Now add Extraction Schema:

1. Schema builder:
   - Define fields to extract (name, type, required)
   - Field types: text, number, date, email, phone, currency
   - Mark optional vs required fields

2. Pre-built schemas:
   - Invoice: vendor, date, amount, line items
   - Resume: name, email, experience, skills
   - Receipt: merchant, date, total, items
   - Custom schema builder

3. Schema testing:
   - Upload sample document
   - Preview extraction results
   - Refine schema based on results

Keep existing upload and navigation unchanged.`,
    },
    {
      title: 'Review & Verify',
      description: 'Verify extracted data before export',
      promptTemplate: `We have upload and schema. Now add Review Interface:

1. Side-by-side view:
   - Original document on left
   - Extracted data form on right
   - Click field to highlight in document

2. Verification controls:
   - Confidence indicators (green/yellow/red)
   - Edit extracted values inline
   - Mark for manual review
   - Approve/reject document

3. Batch review:
   - Table view of all extractions
   - Quick approve high-confidence items
   - Filter by confidence level
   - Bulk actions

4. Error handling:
   - Show extraction failures
   - Manual extraction fallback
   - Skip and continue option

Keep existing pages working.`,
    },
    {
      title: 'Export & Integration',
      description: 'Export extracted data to various destinations',
      promptTemplate: `We have review working. Now add Export & Integration:

1. Export formats:
   - Excel/CSV download
   - JSON export
   - Copy to clipboard

2. Integration options (if applicable):
   - Send to database
   - API webhook
   - Email notification

3. History page:
   - All past extractions
   - Filter by date, schema, status
   - Re-extract option

4. Analytics:
   - Documents processed count
   - Extraction accuracy rate
   - Processing time trends

Keep all existing pages working.`,
    },
  ],
  SYNTHESIS: [
    {
      title: 'Data Source Connection',
      description: 'Connect and upload multiple data sources',
      promptTemplate: `We have auth, data model, and navigation. Now add Data Sources:

1. Sources page:
   - List of connected sources
   - "Add New Source" button
   - Source status indicators

2. Source types:
   - File upload (CSV, Excel, JSON)
   - Manual entry forms
   - URL/API import (if applicable)

3. Source management:
   - Preview source data
   - Map fields/columns
   - Set refresh schedule (if applicable)
   - Enable/disable source

Save source configurations and data.
Keep existing navigation unchanged.`,
    },
    {
      title: 'Synthesis Configuration',
      description: 'Define how to combine and analyze sources',
      promptTemplate: `We have sources connected. Now add Synthesis Config:

1. Synthesis rules:
   - Which sources to combine
   - Join/merge criteria
   - Conflict resolution (newest wins, average, manual)

2. Analysis settings:
   - Theme extraction
   - Pattern detection
   - Trend identification
   - Outlier detection

3. Output configuration:
   - What insights to generate
   - Summary vs detailed
   - Visualization preferences

Keep existing sources and navigation unchanged.`,
    },
    {
      title: 'Insights Dashboard',
      description: 'View synthesized insights and patterns',
      promptTemplate: `We have synthesis config. Now add Insights Dashboard:

1. Main dashboard:
   - Key insights cards
   - Trend visualizations
   - Pattern highlights
   - Source attribution for each insight

2. Detail views:
   - Click insight to see supporting data
   - Drill down to source records
   - Confidence indicators

3. Filters:
   - Date range
   - Source filter
   - Insight type
   - Confidence threshold

4. Actions:
   - Save insight
   - Share/export
   - Set alert for changes

Keep existing pages working.`,
    },
    {
      title: 'Reports & Export',
      description: 'Generate reports from synthesized insights',
      promptTemplate: `We have insights working. Now add Reports:

1. Report builder:
   - Select insights to include
   - Add commentary/notes
   - Choose visualizations
   - Set report template

2. Export options:
   - PDF report
   - PowerPoint slides
   - Excel data export
   - Share link

3. Scheduled reports:
   - Set frequency (daily/weekly/monthly)
   - Email recipients
   - Auto-generate and send

4. Report history:
   - All generated reports
   - Version comparison
   - Re-generate option

Keep all existing pages working.`,
    },
  ],
  PREDICTION: [
    {
      title: 'Historical Data Input',
      description: 'Import data for prediction models',
      promptTemplate: `We have auth, data model, and navigation. Now add Data Input:

1. Data import page:
   - Upload historical data (CSV, Excel)
   - Map columns to prediction fields
   - Data quality indicators

2. Required fields:
   - Target variable (what to predict)
   - Feature variables (inputs)
   - Time field (if time-series)

3. Data preview:
   - Sample of imported data
   - Statistics summary
   - Missing data warnings

Keep existing navigation unchanged.`,
    },
    {
      title: 'Prediction Configuration',
      description: 'Configure prediction parameters',
      promptTemplate: `We have data imported. Now add Prediction Config:

1. Model settings:
   - Prediction type (classification/regression)
   - Time horizon (predict how far ahead)
   - Confidence threshold

2. Feature selection:
   - Which variables to use
   - Feature importance preview
   - Remove irrelevant features

3. Training controls:
   - Train/retrain model button
   - Accuracy metrics display
   - Model comparison (if multiple)

Keep existing data import and navigation unchanged.`,
    },
    {
      title: 'Predictions Dashboard',
      description: 'View predictions with probability scores',
      promptTemplate: `We have model configured. Now add Predictions Dashboard:

1. Predictions view:
   - List of items with predictions
   - Probability/confidence score
   - Color-coded risk levels

2. Detail view per item:
   - Prediction explanation
   - Key factors driving prediction
   - Historical comparison
   - "What if" scenario testing

3. Filters and sorting:
   - By risk level
   - By confidence
   - By category/segment
   - Date range

4. Alerts:
   - Set threshold alerts
   - Notification settings
   - Alert history

Keep existing pages working.`,
    },
    {
      title: 'Interventions & Tracking',
      description: 'Track actions taken and outcomes',
      promptTemplate: `We have predictions working. Now add Intervention Tracking:

1. Action logging:
   - Record intervention taken
   - Link to prediction item
   - Note action details

2. Outcome tracking:
   - Record actual outcome
   - Compare to prediction
   - Calculate accuracy

3. Dashboard updates:
   - Show intervention status
   - Outcome visualization
   - Success rate metrics

4. Model improvement:
   - Feed outcomes back to model
   - Retrain recommendations
   - Accuracy trends over time

Keep all existing pages working.`,
    },
  ],
  RECOMMENDATION: [
    {
      title: 'Context & Preferences Input',
      description: 'Gather user context for recommendations',
      promptTemplate: `We have auth, data model, and navigation. Now add Input Interface:

1. Context form:
   - Key questions to understand need
   - Preference sliders/checkboxes
   - Constraints (budget, time, etc.)

2. Quick profiles:
   - Save preference profiles
   - Load previous profile
   - Share profile

3. Context history:
   - Past recommendation sessions
   - Re-run with same context
   - Compare different contexts

Keep existing navigation unchanged.`,
    },
    {
      title: 'Options Database',
      description: 'Manage the options to recommend from',
      promptTemplate: `We have input working. Now add Options Management:

1. Options page:
   - List of all options
   - Add/edit/delete options
   - Import from CSV

2. Option details:
   - Name and description
   - Attributes (for matching)
   - Availability status
   - Tags/categories

3. Option scoring:
   - How well each option matches criteria
   - Auto-update based on feedback
   - Manual adjustments

Pre-populate with relevant options for [WORKFLOW_CONTEXT].
Keep existing input and navigation unchanged.`,
    },
    {
      title: 'Recommendation Results',
      description: 'Display ranked recommendations',
      promptTemplate: `We have input and options. Now add Results Interface:

1. Results page:
   - Ranked list of recommendations
   - Match percentage for each
   - Key reasons why recommended

2. Detail view:
   - Full option details
   - Pros and cons
   - User reviews/ratings if available

3. Comparison:
   - Select 2-3 to compare side-by-side
   - Highlight differences
   - Score breakdown

4. Actions:
   - "Select this option" button
   - Save for later
   - Share recommendations

Keep existing pages working.`,
    },
    {
      title: 'Feedback & Learning',
      description: 'Track selections and improve recommendations',
      promptTemplate: `We have recommendations working. Now add Feedback System:

1. Selection tracking:
   - Record which option was chosen
   - Ask for satisfaction rating
   - Note any issues

2. Outcome tracking:
   - Follow up on selections
   - Did it work out?
   - Would they choose differently?

3. Analytics:
   - Most selected options
   - Satisfaction rates
   - Common rejection reasons

4. Model improvement:
   - Use feedback to improve matching
   - Update option scores
   - Refine recommendation logic

Keep all existing pages working.`,
    },
  ],
  MONITORING: [
    {
      title: 'Items to Monitor',
      description: 'Set up what to monitor',
      promptTemplate: `We have auth, data model, and navigation. Now add Monitoring Setup:

1. Add items page:
   - Add item to monitor (name, identifier)
   - Set monitoring parameters
   - Define normal ranges

2. Import items:
   - Bulk import from CSV
   - Connect to data source
   - Auto-discover items

3. Item configuration:
   - What metrics to track
   - How often to check
   - Who should be notified

Keep existing navigation unchanged.`,
    },
    {
      title: 'Alert Configuration',
      description: 'Set up alert rules and thresholds',
      promptTemplate: `We have items set up. Now add Alert Configuration:

1. Alert rules page:
   - List of alert rules
   - Add/edit/delete rules
   - Enable/disable rules

2. Rule builder:
   - Condition (metric > threshold)
   - Severity (info/warning/critical)
   - Actions (notify, escalate, auto-respond)

3. Notification settings:
   - Email, SMS, in-app options
   - Recipients per rule
   - Quiet hours
   - Escalation chain

Keep existing monitoring and navigation unchanged.`,
    },
    {
      title: 'Real-time Dashboard',
      description: 'View current status of all monitored items',
      promptTemplate: `We have alerts configured. Now add Dashboard:

1. Status overview:
   - All items with current status
   - Color-coded (green/yellow/red)
   - Auto-refresh (or manual refresh button)

2. Alert panel:
   - Active alerts list
   - Acknowledge button
   - Quick actions

3. Item detail view:
   - Current metrics
   - Recent changes
   - Alert history for this item

4. Filters:
   - By status
   - By category
   - By alert count

Keep existing pages working.`,
    },
    {
      title: 'History & Trends',
      description: 'View historical data and identify trends',
      promptTemplate: `We have dashboard working. Now add History & Trends:

1. History page:
   - Timeline of all events
   - Filter by item, date, severity
   - Search events

2. Trend analysis:
   - Charts showing metrics over time
   - Anomaly highlighting
   - Comparison periods

3. Reports:
   - Weekly/monthly summary
   - Alert statistics
   - Uptime/health metrics

4. Export:
   - Download history
   - Schedule reports
   - API access (if applicable)

Keep all existing pages working.`,
    },
  ],
  ORCHESTRATION: [
    {
      title: 'Workflow Definition',
      description: 'Create and edit workflow structures',
      promptTemplate: `We have auth, data model, and navigation. Now add Workflow Builder:

1. Workflows page:
   - List of defined workflows
   - Add/edit/delete workflows
   - Workflow status (active/inactive)

2. Visual workflow builder:
   - Drag-and-drop steps
   - Connect steps with arrows
   - Add conditions/branches
   - Set step details (action, assignee, deadline)

3. Workflow templates:
   - Pre-built templates for [WORKFLOW_CONTEXT]
   - Clone and customize
   - Import/export workflows

Keep existing navigation unchanged.`,
    },
    {
      title: 'Triggers & Automation',
      description: 'Set up workflow triggers and automatic actions',
      promptTemplate: `We have workflows defined. Now add Triggers:

1. Trigger configuration:
   - Manual start
   - Scheduled (cron-style)
   - Event-based (new item, status change)
   - API trigger

2. Step automation:
   - Auto-assign based on rules
   - Auto-notify on transition
   - Auto-escalate on delay

3. Conditions:
   - If/then branching
   - Approval gates
   - Parallel paths

Keep existing workflow builder and navigation unchanged.`,
    },
    {
      title: 'Tracking Dashboard',
      description: 'Track items moving through workflows',
      promptTemplate: `We have triggers set up. Now add Tracking Dashboard:

1. Active items view:
   - Kanban board by step
   - List view with status
   - Filter by workflow, assignee, due date

2. Item detail:
   - Current step and status
   - Full history of actions
   - Time in each step
   - Next action required

3. My tasks:
   - Items assigned to current user
   - Priority indicators
   - Quick action buttons

4. Bottleneck identification:
   - Items stuck too long
   - Overdue items
   - Workload distribution

Keep existing pages working.`,
    },
    {
      title: 'Exceptions & Completion',
      description: 'Handle exceptions and track completions',
      promptTemplate: `We have tracking working. Now add Exception Handling:

1. Exception management:
   - Flag items with issues
   - Exception types (blocked, rejected, escalated)
   - Resolution actions
   - Escalation paths

2. Completion tracking:
   - Mark workflow complete
   - Completion summary
   - Success metrics

3. Analytics:
   - Completion rates
   - Average time to complete
   - Bottleneck analysis
   - SLA tracking

4. Reports:
   - Workflow performance
   - Team productivity
   - Exception analysis

Keep all existing pages working.`,
    },
  ],
};

// Helper to generate validation context section
function generateValidationContext(context: PromptContext): string {
  if (!context.valueAssessment || context.valueAssessment.desperateUserScore === 0) {
    return '';
  }

  const va = context.valueAssessment;
  const validatedCriteria: string[] = [];
  const evidencePoints: string[] = [];

  if (va.criteria.activelySearching && va.evidence.activelySearching) {
    validatedCriteria.push('Users have complained about this problem before');
    evidencePoints.push(`- "${va.evidence.activelySearching}"`);
  }
  if (va.criteria.triedAlternatives && va.evidence.triedAlternatives) {
    validatedCriteria.push('Users are already doing something to solve it');
    evidencePoints.push(`- "${va.evidence.triedAlternatives}"`);
  }
  if (va.criteria.willingToPay && va.evidence.willingToPay) {
    validatedCriteria.push('Users light up when they hear about a solution');
    evidencePoints.push(`- "${va.evidence.willingToPay}"`);
  }
  if (va.criteria.urgentNeed && va.evidence.urgentNeed) {
    validatedCriteria.push('Users ask when they can start using it');
    evidencePoints.push(`- "${va.evidence.urgentNeed}"`);
  }
  if (va.criteria.frequentProblem && va.evidence.frequentProblem) {
    validatedCriteria.push('Multiple users have this problem');
    evidencePoints.push(`- "${va.evidence.frequentProblem}"`);
  }

  if (validatedCriteria.length === 0) {
    return '';
  }

  return `
VALIDATION (Desperate User Score: ${va.desperateUserScore}%):
${validatedCriteria.map(c => `✓ ${c}`).join('\n')}

USER EVIDENCE:
${evidencePoints.join('\n')}
`;
}

// Foundation prompts (same for all workflows)
function generateFoundationPrompts(context: PromptContext): PromptStep[] {
  const template = PROMPT_TEMPLATES[context.workflowType.toUpperCase()] || PROMPT_TEMPLATES.MONITORING;
  const validationContext = generateValidationContext(context);
  const customWorkflow = context.customWorkflowDescription
    ? `\nCUSTOM WORKFLOW: ${context.customWorkflowDescription}\n`
    : '';

  return [
    {
      number: 1,
      phase: 'foundation',
      title: 'Project Context & Setup',
      description: 'Establish project foundation with context and initial structure',
      prompt: `I'm building a ${template.name.toLowerCase()} app to solve this problem:

"${context.problemStatement}"

CONTEXT:
- Users: ${context.primaryUsers}
- When they need it: ${context.when || 'Regularly'}
- Current workaround: ${context.currentSolution}
- Pain level: ${context.painLevel}/10
- Frequency: ${context.frequency}
${validationContext}${customWorkflow}
WHAT USERS NEED TO DO:
1. ${template.action1}
2. ${template.action2}
3. ${template.action3}

This is Prompt 1 of 9. We'll build incrementally.

FOR THIS PROMPT, create:
1. Project structure with Next.js/React
2. Basic data model (Supabase tables):
   - users (if auth needed)
   - Main entity tables for ${template.name.toLowerCase()} workflow
3. Environment setup instructions

DON'T build any UI yet. Just the foundation.
Keep it simple - we'll add features in later prompts.`,
    },
    {
      number: 2,
      phase: 'foundation',
      title: 'Authentication & Data Model',
      description: 'Add user authentication and finalize database schema',
      prompt: `We have the project structure. Now add (Prompt 2 of 9):

1. AUTHENTICATION:
   - Email/password signup and login
   - Protected routes (redirect if not logged in)
   - User profile page (name, email)
   - Logout functionality

2. DATABASE TABLES (Supabase):
   - Finalize schema for ${template.name.toLowerCase()} workflow
   - Add proper relationships (foreign keys)
   - Row Level Security (RLS) policies
   - Users can only see their own data

3. BASIC API:
   - CRUD operations for main entities
   - Error handling
   - Loading states

DON'T build feature UI yet.
Keep existing project structure.
Test that auth works end-to-end.`,
    },
    {
      number: 3,
      phase: 'foundation',
      title: 'Navigation & Layout',
      description: 'Create the app shell with navigation and placeholder pages',
      prompt: `We have auth and database. Now add (Prompt 3 of 9):

1. APP LAYOUT:
   - Sidebar navigation (desktop)
   - Bottom nav or hamburger menu (mobile)
   - Header with user info and logout
   - Main content area

2. NAVIGATION ITEMS:
   - Dashboard/Home
   - Main feature pages (placeholders for now)
   - Settings/Profile
   - Relevant sections for ${template.name.toLowerCase()} workflow

3. PLACEHOLDER PAGES:
   - Each nav item goes to a page
   - Show page title
   - Show "Coming soon" or brief description
   - Consistent styling

4. RESPONSIVE DESIGN:
   - Works on mobile (320px+)
   - Works on tablet and desktop
   - Touch-friendly buttons (44px min)

DON'T build features yet. Just navigation skeleton.
Keep existing auth working.
Make it look professional with consistent styling.`,
    },
  ];
}

// Polish prompts (same for all workflows)
function generatePolishPrompts(context: PromptContext): PromptStep[] {
  return [
    {
      number: 8,
      phase: 'polish',
      title: 'Error Handling & Edge Cases',
      description: 'Add robust error handling and handle edge cases',
      prompt: `We have all features built. Now add polish (Prompt 8 of 9):

1. FORM VALIDATION:
   - Required field indicators
   - Real-time validation feedback
   - Clear error messages
   - Prevent submission with errors

2. ERROR STATES:
   - Loading spinners/skeletons
   - Empty states (no data yet)
   - Error messages (API failures)
   - Retry buttons where appropriate

3. EDGE CASES:
   - Handle slow connections (show loading)
   - Handle offline state
   - Handle session expiry
   - Handle invalid/malformed data
   - Handle concurrent edits

4. USER FEEDBACK:
   - Success messages (toast notifications)
   - Confirmation dialogs for destructive actions
   - Progress indicators for long operations

DON'T add new features.
Just make existing features more robust.
Test each error scenario manually.`,
    },
    {
      number: 9,
      phase: 'polish',
      title: 'Mobile Optimization & Final Polish',
      description: 'Final refinements for production readiness',
      prompt: `Final prompt (9 of 9). Make it production-ready:

1. MOBILE OPTIMIZATION:
   - Touch targets minimum 44px
   - Thumb-friendly button placement
   - Swipe gestures where natural
   - Responsive tables (card view on mobile)
   - Test on actual phone

2. PERFORMANCE:
   - Lazy load heavy components
   - Optimize images
   - Minimize bundle size
   - Target <3s initial load on 3G

3. ACCESSIBILITY:
   - Keyboard navigation works
   - Screen reader labels (aria-*)
   - Sufficient color contrast
   - Focus indicators visible

4. FINAL CLEANUP:
   - Remove console.logs
   - Remove placeholder text
   - Consistent styling throughout
   - Professional empty states
   - Helpful onboarding hints

This should complete the app.
Users (${context.primaryUsers}) should be able to:
1. ${PROMPT_TEMPLATES[context.workflowType.toUpperCase()]?.action1 || 'Complete main action'}
2. ${PROMPT_TEMPLATES[context.workflowType.toUpperCase()]?.action2 || 'See results'}
3. ${PROMPT_TEMPLATES[context.workflowType.toUpperCase()]?.action3 || 'Take action on results'}

Test the complete user journey.`,
    },
  ];
}

// Generate workflow-specific feature prompts (4-7)
// For hybrid workflows, combines features from all selected types
function generateFeaturePrompts(context: PromptContext): PromptStep[] {
  const workflowTypes = context.workflowTypes || [context.workflowType];
  const primaryKey = context.workflowType.toUpperCase();

  // For single workflow, use standard sequence
  if (workflowTypes.length <= 1) {
    const featureSequence = WORKFLOW_FEATURE_SEQUENCES[primaryKey] || WORKFLOW_FEATURE_SEQUENCES.MONITORING;
    return featureSequence.map((feature, index) => ({
      number: index + 4,
      phase: 'features' as const,
      title: feature.title,
      description: feature.description,
      prompt: feature.promptTemplate
        .replace(/\[WORKFLOW_CONTEXT\]/g, context.problemStatement)
        .replace(/\[PRIMARY_USERS\]/g, context.primaryUsers),
    }));
  }

  // For hybrid workflows, blend features from all selected types
  return generateHybridFeaturePrompts(context, workflowTypes);
}

// Generate hybrid prompts by combining features from multiple workflow types
function generateHybridFeaturePrompts(context: PromptContext, workflowTypes: string[]): PromptStep[] {
  const primaryKey = workflowTypes[0].toUpperCase();
  const primarySequence = WORKFLOW_FEATURE_SEQUENCES[primaryKey] || WORKFLOW_FEATURE_SEQUENCES.MONITORING;

  // Get secondary workflow features
  const secondaryTypes = workflowTypes.slice(1);
  const secondaryFeatures: string[] = [];

  for (const type of secondaryTypes) {
    const key = type.toUpperCase();
    const seq = WORKFLOW_FEATURE_SEQUENCES[key];
    if (seq) {
      // Take key features from each secondary workflow (first 2 items)
      secondaryFeatures.push(
        ...seq.slice(0, 2).map(f => `- ${f.title}: ${f.description}`)
      );
    }
  }

  const hybridNote = secondaryFeatures.length > 0
    ? `\n\nHYBRID WORKFLOW ADDITIONS (from selected secondary workflows):\n${secondaryFeatures.join('\n')}\nIntegrate these capabilities where they naturally fit.`
    : '';

  const workflowNames = workflowTypes.map(t => {
    const key = t.toUpperCase();
    return PROMPT_TEMPLATES[key]?.name || t.replace('-', ' ');
  }).join(' + ');

  return primarySequence.map((feature, index) => ({
    number: index + 4,
    phase: 'features' as const,
    title: index === 0 ? `Hybrid Foundation: ${feature.title}` : feature.title,
    description: index === 0
      ? `Build hybrid ${workflowNames} capabilities starting with: ${feature.description}`
      : feature.description,
    prompt: (index === 0
      ? `Building a HYBRID WORKFLOW combining: ${workflowNames}\n\n` + feature.promptTemplate + hybridNote
      : feature.promptTemplate
    )
      .replace(/\[WORKFLOW_CONTEXT\]/g, context.problemStatement)
      .replace(/\[PRIMARY_USERS\]/g, context.primaryUsers),
  }));
}

// Main function to generate complete prompt sequence
export function generatePromptSequence(context: PromptContext): PromptStep[] {
  const foundation = generateFoundationPrompts(context);
  const features = generateFeaturePrompts(context);
  const polish = generatePolishPrompts(context);

  return [...foundation, ...features, ...polish];
}

// Get prompt sequence summary
// For hybrid workflows, shows primary features with hybrid indicator
export function getSequenceSummary(workflowType: string, workflowTypes?: string[]): { phase: string; prompts: string[] }[] {
  const workflowKey = workflowType.toUpperCase();
  const features = WORKFLOW_FEATURE_SEQUENCES[workflowKey] || WORKFLOW_FEATURE_SEQUENCES.MONITORING;

  const isHybrid = workflowTypes && workflowTypes.length > 1;
  const featurePrompts = features.map((f, i) => {
    const title = i === 0 && isHybrid ? `Hybrid: ${f.title}` : f.title;
    return `${i + 4}. ${title}`;
  });

  return [
    {
      phase: 'Foundation',
      prompts: [
        '1. Project Context & Setup',
        '2. Authentication & Data Model',
        '3. Navigation & Layout',
      ],
    },
    {
      phase: isHybrid ? 'Features (Hybrid)' : 'Features',
      prompts: featurePrompts,
    },
    {
      phase: 'Polish',
      prompts: [
        '8. Error Handling & Edge Cases',
        '9. Mobile Optimization & Final Polish',
      ],
    },
  ];
}
