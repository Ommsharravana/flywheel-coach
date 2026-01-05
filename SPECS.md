# SPECS.md - NIF Incubation Hub Unification

## Overview

**Problem:** The NIF Incubation admin page uses two tabs (Pipeline Board + Applications) that track the same projects at different lifecycle stages. Admins must switch between tabs to follow a project's journey, creating friction.

**Solution:** Replace tab-based navigation with a **single unified list view** showing all NIF items from both entry paths (Applications and Problem Bank).

---

## User Research Summary

### Interview Date: 2026-01-05

| Question | Answer |
|----------|--------|
| Core friction | Tabs feel redundant - same info in both |
| Data relationship | Same project appears in BOTH tabs at different stages |
| Ideal journey | Track BOTH person AND problem together |
| Primary entity | Depends on context |
| Key actions | Review applications, Assign mentors, Track stage progress, Monitor metrics |
| Preferred UX | List with inline stages |
| Entry paths | Both Application + Problem Bank paths exist, merge later |
| Mentoring scope | Applies to ALL pipeline items, not just applicants |
| Filtering needs | All (stage, source, mentor status) |
| Metrics priority | All matter equally |
| Data migration | Early stage, can restructure freely |

---

## Functional Requirements

### F1: Unified List View

Replace two-tab interface with a single list view.

**F1.1 - List Columns (Essential)**
| Column | Description |
|--------|-------------|
| Project | Startup name OR problem title |
| Applicant/Builder | Person responsible |
| Stage | Current lifecycle stage (dropdown for inline edit) |
| Source | Badge: "Application" or "Problem Bank" |
| Mentor | Assigned mentor name or "Unassigned" |
| Actions | Expand, Remove |

**F1.2 - Inline Actions**
- **Change stage**: Dropdown selector, updates immediately
- **Assign mentor**: Click to open mentor picker popover
- **Expand row**: Reveal full details (problem statement, motivation, metrics, project URL)
- **Remove**: Confirmation dialog, then soft-delete

**F1.3 - Unified Stage Model**

Entry stages (vary by source):
```
Application path:    pending → under_review → mentor_selection
Problem Bank path:   identified → screened → shortlisted
```

Unified stages (same for all):
```
active → incubating → graduated
```

Terminal stages:
```
rejected | dropped | completed
```

**Full stage progression:**
```
[Entry] ─────────────────────────┐
  │                              │
  │ Application:                 │ Problem Bank:
  │ pending → under_review →     │ identified → screened →
  │ mentor_selection             │ shortlisted
  │                              │
  └──────────────┬───────────────┘
                 │
           [Unified Path]
                 │
         active (has mentor)
                 │
            incubating
                 │
            graduated
```

### F2: Filtering System

**F2.1 - Filter by Stage**
- Quick filter buttons OR dropdown
- Options: All, Pending Review, Active, Incubating, Graduated, Rejected

**F2.2 - Filter by Source**
- Toggle or dropdown: All, Applications Only, Problem Bank Only

**F2.3 - Filter by Mentor Status**
- Toggle: All, Needs Mentor, Has Mentor

**F2.4 - Search**
- Full-text search across: project name, applicant name, problem statement

### F3: Stats Dashboard

Retain all 6 current stat cards:

| Stat | Source | Description |
|------|--------|-------------|
| Total Pipeline | Unified count | All items in system |
| Startups | Pipeline | Items with startup_name set |
| Pending | Unified | Items awaiting review |
| Active | Unified | Items with assigned mentor, actively working |
| Jobs Created | Pipeline metrics | Sum of jobs_created |
| Graduated | Unified | Items in graduated stage |

### F4: Mentor Assignment

**F4.1 - Inline Assignment**
- Click mentor cell → Popover with mentor list
- Show: Name, Type (Industry/Faculty), Capacity (X/Y mentees)
- Filter mentors by: availability, domain match

**F4.2 - Bulk Assignment**
- Select multiple rows → "Assign Mentor" action
- Same mentor picker, applies to all selected

### F5: Detail Expansion

When row is expanded, show:

| Section | Content |
|---------|---------|
| Problem Statement | Full text |
| Motivation | Why they applied (if from application) |
| Project URL | Link to Lovable/deployed app |
| Metrics | Users, Impact Score |
| Timeline | Key dates (applied, activated, graduated) |
| Notes | Admin notes |
| Activity Log | Recent status changes |

---

## Data Model Changes

### Option A: Unified View (Recommended)

Create a database VIEW that unions both tables:

```sql
CREATE VIEW unified_nif_items AS
SELECT
  'application' as source,
  na.id,
  na.cycle_id,
  na.startup_name as project_name,
  u.name as applicant_name,
  CASE
    WHEN na.status = 'active' THEN 'active'
    ELSE na.status
  END as stage,
  na.selected_mentor_id as mentor_id,
  m.name as mentor_name,
  na.applied_at as created_at,
  -- ... additional fields
FROM nif_applications na
JOIN users u ON ...
LEFT JOIN mentors m ON ...

UNION ALL

SELECT
  'problem_bank' as source,
  np.id,
  np.problem_id as cycle_id,
  np.startup_name as project_name,
  -- ... map problem bank fields
FROM nif_pipeline np
JOIN problems p ON ...
```

### Option B: Unified Table (Future)

If data model needs to truly merge, create `nif_incubation_items` table that absorbs both sources. Requires migration.

**Decision:** Start with Option A (view) since data is early-stage. Can migrate to Option B if needed.

---

## UI/UX Specifications

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Admin                                             │
│                                                             │
│ 🚀 NIF Incubation Hub                                      │
│ Unified view of all incubation candidates                  │
├─────────────────────────────────────────────────────────────┤
│ [Stats Cards: Total | Startups | Pending | Active | Jobs | Graduated] │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Search...              [Stage ▼] [Source ▼] [Mentor ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ Project Name          Stage       Source    Mentor   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ▶ Smart Attendance      [Active ▼]  🏷️ App    Dr. Kumar │ │
│ │ ▶ Lab Scheduler         [Pending ▼] 🏷️ Bank   —        │ │
│ │ ▼ Fee Reminder Bot      [Review ▼]  🏷️ App    —        │ │
│ │   └── Expanded details: Problem, Motivation, URL...    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Interactions

1. **Row hover**: Highlight + show quick actions
2. **Stage dropdown**: Click to change, updates immediately with optimistic UI
3. **Mentor cell click**: Opens popover with mentor picker
4. **Expand chevron**: Toggles detailed view inline
5. **Search**: Debounced 300ms, highlights matches

### Mobile Responsiveness

- Stack columns vertically on mobile
- Collapsible filter section
- Swipe actions for stage change

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load | < 2s on 3G |
| Stage change | < 500ms response |
| Search | < 300ms results |
| Pagination | 25 items per page |
| Max dataset | Handle 1000+ items |

---

## Out of Scope (V1)

- Drag-and-drop reordering
- Kanban view toggle
- Bulk import from CSV
- Export to Excel
- Email notifications
- Slack integration

---

## Success Criteria

1. **Admin can view ALL NIF items in ONE place** without switching tabs
2. **Stage changes take < 3 clicks** from list view
3. **Mentor assignment takes < 3 clicks** from list view
4. **No data loss** from current Pipeline or Applications tables
5. **All existing metrics** remain visible

---

## Migration Plan

1. Create `unified_nif_items` database view
2. Build new unified list component
3. Replace tab-based page with unified view
4. Deprecate old tab components after validation
5. Clean up unused code

---

*Spec created: 2026-01-05*
*Based on: User interview with first-principles analysis*
