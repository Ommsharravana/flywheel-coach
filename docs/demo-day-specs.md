# Demo Day Judging System - Complete Specifications

> **Appathon 2.0 Demo Day: January 7, 2026 at 9:30 AM IST**
> **Event ID:** `003089a3-8b28-4844-9714-b94f9b838462`

---

## Interview Findings (2026-01-03)

### Event Scale & Logistics
| Parameter | Value |
|-----------|-------|
| **Total Apps** | ~500 (with buffer) |
| **Judges** | 10-20 with mixed tech comfort |
| **Panels** | Theme-based, 2-3 judges per panel |
| **Panel Split** | If >50 apps per theme, create additional panel |
| **Event Time** | 9:30 AM - 4:00 PM (30 min lunch) |
| **Demo Format** | 3 min demo + 2 min Q&A = 5 min per app |
| **Venue** | In-person only, strong institutional WiFi |

### Demo Day Flow
1. **Voting Trigger**: When judge starts scoring, audience voting opens
2. **Voting Window**: 5 minutes from trigger, then auto-closes
3. **Who Can Vote**: Only logged-in JKKN Solution Studio users
4. **Results Reveal**: Grand finale at 4PM, scores hidden until ceremony
5. **Edge Cases**: No-shows can demo last; ties share prizes

### Success Criteria
- **100% scored** - Every demo MUST have at least one judge score
- **Zero compromise** on: learner validation, system smoothness, energy/spectacle, external credibility

### Critical Gaps Identified
- [x] Paper backup scoring sheets (PDF) - ✅ BUILT at `/admin/events/appathon-2/demo-day/backup-sheets`
- [ ] Submissions not assigned to tracks yet
- [x] Audience voting time-lock - ✅ BUILT with 5-min window
- [x] Grand finale reveal page - ✅ BUILT at `/results`
- [ ] Judges not briefed (need trial run + materials + sessions)
- [x] **MIGRATION COMPLETE**: Demo-day pages now at `/admin/events/appathon-2/demo-day/`
- [ ] **EVENT SIDEBAR**: Need event-specific sidebar with Demo Day, Judge Panel, Results links

### Implementation Status (Updated 2026-01-03)

| Feature | Location | Status |
|---------|----------|--------|
| Command Center | `/admin/events/appathon-2/demo-day` | ✅ Migrated |
| Track Assignment | `/admin/events/appathon-2/demo-day/track-assignment` | ⚠️ Pending |
| Backup Sheets | `/admin/events/appathon-2/demo-day/backup-sheets` | ✅ Migrated |
| Content Generator | `/admin/events/appathon-2/demo-day/content-generator` | ✅ Migrated |
| Grand Finale Reveal | `/results` | ✅ Public page |
| Judge Panel | `/judge` | ✅ Public page |
| Audience Voting | `/vote` | ✅ Public page |
| **Event Sidebar** | `/admin/events/[slug]/layout.tsx` | ⚠️ **NEW - Pending** |

**Base URL:** `https://jkkn-solution-studio.vercel.app`

### Post-Event Needs
- Full score breakdown per team
- Judge feedback (strengths/improvements) visible to teams - **Immediate unlock after results reveal**
- Analytics dashboard with aggregate stats

---

## AI-Powered Admin Features (Interview 2026-01-03)

> **Interview conducted to understand how AI can help event admins manage 500+ submissions in 4 days**

### ⚠️ Architecture Note: Appathon-Specific Features

> **IMPORTANT:** All features below are specific to the Appathon event, NOT platform-wide features.
> They MUST be located within the event detail page at `/admin/events/appathon-2`, NOT as platform-wide routes.

#### Correct Route Structure
```
/app/(admin)/admin/events/[slug]/
├── page.tsx                    # Event overview (existing)
├── settings/page.tsx           # Event settings (existing)
├── builders/page.tsx           # Builder management (existing)
├── curate/page.tsx             # Curation (existing)
├── submissions/page.tsx        # Submissions list (existing)
└── demo-day/                   # NEW: Demo Day features
    ├── page.tsx                # Command Center dashboard
    ├── track-assignment/page.tsx
    ├── reveal/page.tsx
    ├── backup-sheets/page.tsx
    ├── help/page.tsx
    └── content-generator/page.tsx
```

| Feature | Route Location | Slug-Based URL |
|---------|----------------|----------------|
| Command Center | `/admin/events/[slug]/demo-day` | `/admin/events/appathon-2/demo-day` |
| Track Assignment | `/admin/events/[slug]/demo-day/track-assignment` | `/admin/events/appathon-2/demo-day/track-assignment` |
| Grand Finale Reveal | `/admin/events/[slug]/demo-day/reveal` | `/admin/events/appathon-2/demo-day/reveal` |
| Paper Backup PDFs | `/admin/events/[slug]/demo-day/backup-sheets` | `/admin/events/appathon-2/demo-day/backup-sheets` |
| Help Guides | `/admin/events/[slug]/demo-day/help` | `/admin/events/appathon-2/demo-day/help` |
| Content Generator | `/admin/events/[slug]/demo-day/content-generator` | `/admin/events/appathon-2/demo-day/content-generator` |

**Event ID:** `003089a3-8b28-4844-9714-b94f9b838462` (for database queries)
**Event Slug:** `appathon-2` (for URL routing)

**Existing Files:**
- Event detail page: `/app/(admin)/admin/events/[slug]/page.tsx`
- Admin sidebar: `/components/admin/AdminSidebar.tsx`

### Event-Specific Sidebar (NEW)

> **Requirement:** When viewing an event's admin pages, show a contextual sidebar with event-specific navigation instead of the platform-wide admin sidebar.

#### Why Event-Specific Sidebar?
- Events have unique features (Appathon has Demo Day, judging, voting)
- Reduces clutter - only show relevant navigation
- Better UX - admins stay focused on event management
- Scalable - future events can have different sidebar items

#### Appathon 2.0 Sidebar Items

| Section | Item | Icon | Route |
|---------|------|------|-------|
| **Overview** | Event Dashboard | `LayoutDashboard` | `/admin/events/appathon-2` |
| **Management** | Submissions | `FileText` | `/admin/events/appathon-2/submissions` |
| | Builders | `Users` | `/admin/events/appathon-2/builders` |
| | Curate Problems | `Target` | `/admin/events/appathon-2/curate` |
| | Settings | `Settings` | `/admin/events/appathon-2/settings` |
| **Demo Day** | Command Center | `Presentation` | `/admin/events/appathon-2/demo-day` |
| | Track Assignment | `GitBranch` | `/admin/events/appathon-2/demo-day/track-assignment` |
| | Backup Sheets | `Printer` | `/admin/events/appathon-2/demo-day/backup-sheets` |
| | AI Content | `Sparkles` | `/admin/events/appathon-2/demo-day/content-generator` |
| **Public Pages** | Judge Panel | `Scale` | `/judge` (external link) |
| | Audience Voting | `Vote` | `/vote` (external link) |
| | Results | `Trophy` | `/results` (external link) |

#### Implementation Approach

```
/app/(admin)/admin/events/[slug]/
├── layout.tsx              # NEW: Event-specific layout with sidebar
└── _components/
    └── EventSidebar.tsx    # NEW: Event sidebar component
```

**Layout Strategy:**
1. Create `layout.tsx` in `/admin/events/[slug]/` that wraps all event pages
2. This layout replaces the default admin sidebar with `EventSidebar`
3. `EventSidebar` receives the slug and renders event-specific navigation
4. Include "← Back to Events" link at top to return to platform admin

**Sidebar Configuration (per event type):**
```typescript
const EVENT_SIDEBAR_CONFIG = {
  'appathon-2': {
    sections: [
      { title: 'Overview', items: [...] },
      { title: 'Management', items: [...] },
      { title: 'Demo Day', items: [...] },
      { title: 'Public Pages', items: [...] },
    ]
  },
  // Future events can have different configurations
}
```

### Priority 1: AI Track Assignment Tool
| Aspect | Decision |
|--------|----------|
| **Problem** | 500 apps need categorization, many self-categorized wrong |
| **Solution** | AI reads each submission's problem statement, auto-assigns to 6 tracks |
| **Auto-split** | If track has >50 apps, create panels (Healthcare-A, Healthcare-B) |
| **Trust level** | 80%+ confidence → auto-assign; low-confidence → flag for review |
| **Data available** | Structured category field exists, but learners often chose wrong |

### Priority 2: Admin Command Center (Day-of Operations)
| Feature | Description |
|---------|-------------|
| **Progress tracking** | Dashboard showing: 23/50 demos complete, Track B running 15 min behind |
| **Judge monitoring** | Alert if judge hasn't scored in 20 minutes (might be stuck) |
| **Score anomaly detection** | Flag if judge gives all 10s or all 1s (misunderstanding criteria) |
| **Real-time status** | Live view of all tracks, current presenters, completion rates |

### Priority 3: Grand Finale Reveal
| Aspect | Decision |
|--------|----------|
| **Style** | Track-by-track reveal (Healthcare → Education → ... → Overall) |
| **Control** | Presenter button (not auto-timer) |
| **Pacing** | Single presenter with "Reveal Next Track" button |
| **Post-reveal** | Immediate unlock of all scores + judge feedback |

### Priority 4: In-App Guides (Judges + Participants)
| Component | Description |
|-----------|-------------|
| **Help page** | Full page explaining everything - read once before starting |
| **Contextual tooltips** | Hover over '?' icons next to each field for explanation |
| **Interactive walkthrough** | First-time user gets step-by-step guided tour |

### Priority 5: Paper Backup PDFs
| Format | Purpose |
|--------|---------|
| **Individual score sheet** | One page per submission: criteria, bonus checkboxes, notes space |
| **Master summary grid** | One sheet per track listing all apps with compact scoring grid |

### Priority 6: Audience Voting Time-Lock
| Aspect | Decision |
|--------|----------|
| **Trigger** | Auto-opens when judge starts scoring (not manual) |
| **Window** | 5 minutes from trigger, then auto-closes |
| **Who can vote** | Only logged-in JKKN Solution Studio users |

### Priority 7: AI-Generated Content
| Content Type | Status |
|--------------|--------|
| **Judge briefing text** | AI generates, admin reviews |
| **Participant email templates** | AI drafts communication |
| **Track summaries** | Based on apps assigned to each track |

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Judging Criteria & Scoring](#judging-criteria--scoring)
4. [Bonus System](#bonus-system)
5. [Judging Tracks](#judging-tracks)
6. [User Roles & Permissions](#user-roles--permissions)
7. [UI Components](#ui-components)
8. [API Functions](#api-functions)
9. [Admin Controls](#admin-controls)
10. [Trial Mode](#trial-mode)
11. [Score Calculation](#score-calculation)
12. [Technical Implementation](#technical-implementation)

---

## System Overview

The Demo Day Judging System provides:
- **Judge scoring interface** with 6 criteria + 4 bonus checkboxes
- **Audience voting** with 1-5 star ratings
- **Real-time leaderboards** per track
- **Admin command center** for managing tracks, judges, and scores
- **Trial mode** for testing before Demo Day

### Key Flows

```
1. Admin assigns judges → Judges see their track → Score submissions
2. Audience votes during demos → Votes aggregate into final score
3. Admin closes tracks → Results revealed → Leaderboards displayed
```

---

## Database Schema

### 5 Core Tables

#### 1. `judging_tracks`
Organizes submissions into theme-based tracks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | References `events(id)` |
| `name` | TEXT | Display name |
| `theme` | TEXT | Theme identifier (unique per event) |
| `description` | TEXT | Track description |
| `room_location` | TEXT | Physical room/location |
| `demo_order` | INTEGER | Order of demo presentation |
| `is_active` | BOOLEAN | Whether track is currently active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_judging_tracks_event` on `event_id`
- `idx_judging_tracks_event_theme` (unique) on `(event_id, theme)`

#### 2. `track_judges`
Assigns judges to tracks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `track_id` | UUID | References `judging_tracks(id)` |
| `user_id` | UUID | References `users(id)` |
| `is_lead` | BOOLEAN | Whether judge is track lead |
| `assigned_at` | TIMESTAMPTZ | Assignment timestamp |

**Constraints:**
- Unique on `(track_id, user_id)` - one assignment per judge per track

**Indexes:**
- `idx_track_judges_track` on `track_id`
- `idx_track_judges_user` on `user_id`

#### 3. `submission_track_assignments`
Links submissions to judging tracks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `submission_id` | UUID | References `appathon_submissions(id)` |
| `track_id` | UUID | References `judging_tracks(id)` |
| `demo_slot` | INTEGER | Order within the track |
| `demo_time` | TIMESTAMPTZ | Scheduled demo time |
| `status` | TEXT | `pending` / `presenting` / `completed` / `skipped` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Constraints:**
- Unique on `(submission_id, track_id)`

#### 4. `judge_scores`
Individual criterion scores from judges.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `submission_id` | UUID | References `appathon_submissions(id)` |
| `judge_id` | UUID | References `users(id)` |
| `track_id` | UUID | References `judging_tracks(id)` |
| **Criteria Scores (1-10)** | | |
| `problem_impact` | INTEGER | Problem significance (1-10) |
| `solution_innovation` | INTEGER | Approach creativity (1-10) |
| `working_prototype` | INTEGER | App functionality (1-10) |
| `user_validation` | INTEGER | Real user testing (1-10) |
| `presentation_quality` | INTEGER | Demo quality (1-10) |
| `bioconvergence_alignment` | INTEGER | JKKN mission alignment (1-10) |
| **Bonus Flags** | | |
| `bonus_cross_disciplinary` | BOOLEAN | Team from 2+ departments |
| `bonus_cross_institutional` | BOOLEAN | Team from 2+ institutions |
| `bonus_first_year` | BOOLEAN | First-year team member |
| `bonus_user_testimonials` | BOOLEAN | Real user testimonials |
| **Calculated Fields** | | |
| `weighted_score` | NUMERIC(5,2) | Auto-calculated base score |
| `bonus_percentage` | NUMERIC(4,2) | Sum of bonus percentages |
| `total_score` | NUMERIC(5,2) | Final score with bonus |
| **Notes** | | |
| `notes` | TEXT | Private judge notes |
| `strengths` | TEXT | Team strengths |
| `improvements` | TEXT | Areas for improvement |
| **Timestamps** | | |
| `started_at` | TIMESTAMPTZ | When scoring started |
| `submitted_at` | TIMESTAMPTZ | When score was finalized |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Constraints:**
- Unique on `(submission_id, judge_id)` - one score per judge per submission
- All criteria scores must be 1-10

#### 5. `audience_votes`
Live audience voting during demos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `submission_id` | UUID | References `appathon_submissions(id)` |
| `voter_id` | UUID | References `users(id)` (nullable for anonymous) |
| `voter_identifier` | TEXT | For anonymous: IP hash or session ID |
| `rating` | INTEGER | 1-5 star rating |
| `reaction` | TEXT | Optional: `love` / `innovative` / `useful` / `polished` / `impactful` |
| `voted_at` | TIMESTAMPTZ | Vote timestamp |
| `device_type` | TEXT | Device information |

**Constraints:**
- Rating must be 1-5
- Unique on `(submission_id, voter_id)` - prevents duplicate logged-in votes
- Unique on `(submission_id, voter_identifier)` - prevents duplicate anonymous votes

### 2 Database Views

#### `submission_final_scores`
Combines judge scores + audience votes.

```sql
SELECT
  submission_id, submission_number, app_name, category, status,
  track_id, track_name,
  avg_judge_score,  -- Average across all judges (85% weight)
  judge_count,
  audience_score,   -- Converted to 0-100 scale (15% weight)
  vote_count,
  final_score,      -- Combined: judge*0.85 + audience*0.15 + bonus
  avg_bonus
FROM submission_final_scores
```

#### `track_leaderboards`
Ranked submissions per track.

```sql
SELECT
  track_id, track_name, theme,
  submission_id, submission_number, app_name,
  final_score, avg_judge_score, audience_score,
  vote_count, judge_count, avg_bonus,
  rank  -- Rank within track
FROM track_leaderboards
ORDER BY track_name, rank
```

---

## Judging Criteria & Scoring

### 6 Core Criteria (Weighted Total: 85%)

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Problem Impact** | 20% | How significant is the problem being solved? |
| **Solution Innovation** | 20% | Is the approach creative and novel? |
| **Working Prototype** | 20% | Does the app actually work? Is it polished? |
| **User Validation** | 15% | Did you test with real users? What feedback? |
| **Presentation Quality** | 5% | Clear communication, good demo |
| **Bioconvergence Alignment** | 5% | Connection to JKKN's mission |

### Audience Score (15%)

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Audience Score** | 15% | Live approval voting from Demo Day audience |

> **Note:** Audience votes on a 1-5 star scale, converted to 0-100 scale (multiply by 20).

---

## Bonus System

### 4 Bonus Categories (Additive Percentage)

| Bonus | Points | Requirement |
|-------|--------|-------------|
| **Cross-disciplinary team** | +5% | Members from 2+ departments |
| **Cross-institutional team** | +5% | Members from 2+ JKKN institutions |
| **First-year participation** | +3% | At least one first-year team member |
| **User testimonials** | +2% | Real users vouching for the app |

### Maximum Bonus: +15%

Example calculation:
```
Base weighted score: 75.0
Bonuses: Cross-disciplinary (+5%) + First-year (+3%) = +8%
Total score: 75.0 * 1.08 = 81.0
```

---

## Judging Tracks

### 6 Default Tracks for Appathon 2.0

| Track | Theme ID | Description |
|-------|----------|-------------|
| Healthcare + AI | `healthcare` | Digital health solutions |
| Education + AI | `education` | Learning enhancement tools |
| Agriculture + AI | `agriculture` | Smart farming solutions |
| Environment + AI | `environment` | Sustainability tools |
| Community + AI | `community` | Social impact solutions |
| MyJKKN Data Apps | `myjkkn` | Apps using real JKKN data |

---

## User Roles & Permissions

### Role Matrix

| Role | View Tracks | Score Submissions | Manage Judges | Manage Tracks | View All Scores |
|------|-------------|-------------------|---------------|---------------|-----------------|
| Superadmin | Yes | No | Yes | Yes | Yes |
| Event Admin | Yes | No | Yes | Yes | Yes |
| Judge | Own track | Own track | No | No | Own scores |
| Audience | No | No | No | No | No |

### RLS Policies

```sql
-- Judges can only view/update their own scores
"Judges can view their own scores" ON judge_scores FOR SELECT
USING (judge_id = auth.uid() OR is_superadmin() OR is_event_admin(...))

-- Judges cannot update after submission
"Judges can update their scores" ON judge_scores FOR UPDATE
USING (judge_id = auth.uid() AND submitted_at IS NULL)

-- Anyone can vote (audience)
"Anyone can insert votes" ON audience_votes FOR INSERT
WITH CHECK (TRUE)
```

---

## UI Components

### Judge Interface Components

| Component | File | Purpose |
|-----------|------|---------|
| `JudgeInterface` | `app/(dashboard)/judge/JudgeInterface.tsx` | Main judge view with state management |
| `JudgeWaitingScreen` | `components/judge/JudgeWaitingScreen.tsx` | Pre-reveal countdown screen |
| `SubmissionsList` | `components/judge/SubmissionsList.tsx` | Track submissions with progress |
| `ScoringForm` | `components/judge/ScoringForm.tsx` | Full scoring form |

### Scoring Form Features

1. **Submission Info Card**
   - App name, submission number, category
   - Problem statement display
   - Links to live app and demo video

2. **Scoring Criteria Section**
   - 6 slider inputs (1-10 scale)
   - Weight badges for each criterion
   - Visual feedback for selected values

3. **Bonus Criteria Section**
   - 4 checkbox inputs
   - Percentage badges (+2% to +5%)
   - Descriptions for each bonus

4. **Notes Section**
   - Strengths textarea
   - Improvements textarea
   - Private notes textarea

5. **Score Preview**
   - Real-time calculated total score
   - Bonus percentage display
   - Save Draft / Submit buttons

### Admin Components

| Component | File | Purpose |
|-----------|------|---------|
| `GlobalControls` | `components/admin/demo-day/GlobalControls.tsx` | Trial mode toggle, judge assignment |

---

## API Functions

### Judge Actions (`lib/judge/actions.ts`)

| Function | Purpose | Returns |
|----------|---------|---------|
| `getJudgeAccess()` | Check judge assignment and panel reveal | `JudgeAccessResult` |
| `getOrCreateScore(submissionId)` | Get or create score record | `{ score, error? }` |
| `updateScore(submissionId, updates)` | Auto-save score updates | `{ success, score?, error? }` |
| `submitScore(submissionId)` | Finalize score | `{ success, score?, error? }` |
| `getSubmissionForScoring(submissionId)` | Get submission details | `{ submission, error? }` |

### Admin Actions (`lib/judge/admin-actions.ts`)

| Function | Purpose | Returns |
|----------|---------|---------|
| `getTrialModeStatus()` | Check if trial mode enabled | `{ isTrialMode, error? }` |
| `setTrialMode(enabled)` | Toggle trial mode | `{ success, isTrialMode?, error? }` |
| `getEventJudges()` | Get all judges for event | `{ judges: JudgeInfo[], error? }` |
| `getJudgingTracks()` | Get all judging tracks | `{ tracks: TrackInfo[], error? }` |
| `assignJudge(email, trackTheme, isLead?)` | Assign judge to track | `{ success, message?, error? }` |
| `removeJudge(email, trackTheme)` | Remove judge from track | `{ success, message?, error? }` |

### Database Functions (PostgreSQL)

| Function | Purpose |
|----------|---------|
| `get_judging_trial_mode(p_event_id)` | Get trial mode status |
| `set_judging_trial_mode(p_event_id, p_enabled)` | Toggle trial mode |
| `assign_judge_to_track(p_user_email, p_track_theme, p_event_id, p_is_lead)` | Assign judge |
| `remove_judge_from_track(p_user_email, p_track_theme, p_event_id)` | Remove judge |
| `get_event_judges(p_event_id)` | List all judges |
| `get_judge_track(p_user_id, p_event_id)` | Get judge's assigned track |
| `get_judge_submissions(p_user_id, p_event_id)` | Get submissions for judge |
| `calculate_judge_score()` | Trigger: auto-calculate weighted score |

---

## Admin Controls

### Global Controls Panel

1. **Live Status Banner**
   - Shows current state: NOT STARTED / DEMO DAY LIVE / RESULTS REVEALED
   - Active track count
   - Refresh button

2. **Trial Mode Toggle**
   - Purple indicator when enabled
   - Allows judge panel access before reveal time
   - Persists to database via RPC

3. **Global Actions**
   - Close All Tracks (red button)
   - Reveal Results (amber button)
   - Confirmation dialogs for destructive actions

4. **Judge Assignment**
   - Email input + track dropdown
   - Assign button
   - Current judges list with remove buttons
   - Lead judge indicator

---

## Trial Mode

### Purpose
Allows testing the judge interface before Demo Day reveal time (January 7, 2026, 9:30 AM IST).

### Behavior

| Condition | Panel Visible |
|-----------|---------------|
| Before reveal time, trial mode OFF | No |
| Before reveal time, trial mode ON | Yes |
| After reveal time | Yes (regardless of trial mode) |

### Implementation

```typescript
// lib/judge/actions.ts
const isPanelRevealed = now >= PANEL_REVEAL_TIME || isTrialMode
```

### Storage
Trial mode is stored in the event's JSONB config:

```sql
events.config -> 'judgingConfig' -> 'trialMode' :: boolean
```

---

## Score Calculation

### Trigger Function: `calculate_judge_score()`

Runs on INSERT or UPDATE of `judge_scores`.

```sql
-- Weighted score calculation (normalized to 100)
weighted := (
  COALESCE(problem_impact, 0) * 0.20 +
  COALESCE(solution_innovation, 0) * 0.20 +
  COALESCE(working_prototype, 0) * 0.20 +
  COALESCE(user_validation, 0) * 0.15 +
  COALESCE(presentation_quality, 0) * 0.05 +
  COALESCE(bioconvergence_alignment, 0) * 0.05
) * (100.0 / 8.5);  -- Normalize (weights sum to 0.85)

-- Bonus calculation
bonus := 0;
IF bonus_cross_disciplinary THEN bonus := bonus + 5; END IF;
IF bonus_cross_institutional THEN bonus := bonus + 5; END IF;
IF bonus_first_year THEN bonus := bonus + 3; END IF;
IF bonus_user_testimonials THEN bonus := bonus + 2; END IF;

-- Final score
total_score := weighted * (1 + bonus / 100);
```

### Final Score View Calculation

```sql
final_score :=
  avg_judge_score * 0.85 +      -- 85% from judges
  audience_score * 0.15 +        -- 15% from audience
  avg_bonus                      -- Bonus as percentage points
```

---

## Technical Implementation

### File Structure

```
/lib/judge/
├── actions.ts          # Judge server actions
├── admin-actions.ts    # Admin server actions
└── hooks.ts            # Client-side hooks

/components/judge/
├── index.ts            # Barrel export
├── JudgeWaitingScreen.tsx
├── SubmissionsList.tsx
└── ScoringForm.tsx

/app/(dashboard)/judge/
├── page.tsx            # Server entry point
└── JudgeInterface.tsx  # Client view manager

/components/admin/demo-day/
└── GlobalControls.tsx  # Admin controls

/supabase/migrations/
├── 080_judging_system.sql      # Core schema
├── 081_judging_trial_mode.sql  # Trial mode & admin functions
└── 082_fix_judge_assignment_ambiguity.sql  # Bug fix
```

### Client Hooks

```typescript
// lib/judge/hooks.ts
useJudgeAccess()       // Fetch judge access and track data
useSubmissionScore(id) // Manage score with debounced auto-save
useCountdown(targetTime) // Countdown timer for reveal
```

### Key Types

```typescript
interface JudgeAccessResult {
  isJudge: boolean
  isPanelRevealed: boolean
  isTrialMode: boolean
  revealTime: string
  trackData: JudgeTrackWithSubmissions | null
  error?: string
}

interface JudgeTrackWithSubmissions {
  track: JudgingTrack
  submissions: JudgeSubmission[]
  judge_info: {
    is_lead: boolean
    assigned_at: string
  }
}

interface JudgeSubmission {
  submission_id: string
  submission_number: string
  app_name: string
  category: string
  demo_slot: number | null
  scoring_status: 'pending' | 'in_progress' | 'completed'
  my_score: number | null
}
```

---

## Migrations Applied

| Migration | Description | Date Applied |
|-----------|-------------|--------------|
| `080_judging_system.sql` | Core schema: 5 tables, 2 views, RLS policies | 2026-01-03 |
| `081_judging_trial_mode.sql` | Trial mode functions, judge assignment | 2026-01-03 |
| `082_fix_judge_assignment_ambiguity.sql` | Fix column reference ambiguity bug | 2026-01-03 |

### Bug Fix Details (Migration 082)

**Problem:** `column reference "track_id" is ambiguous`

**Cause:** `RETURNS TABLE` had `track_id UUID` which conflicted with `track_judges.track_id` in the function body.

**Solution:**
1. Renamed return column to `assigned_track_id`
2. Added table aliases (`tj.`, `jt.`) to qualify column references
3. Added `DROP FUNCTION IF EXISTS` before `CREATE OR REPLACE` (required when return type changes)

---

## Testing Checklist

### Judge Flow
- [ ] Judge can see waiting screen before reveal
- [ ] Judge sees panel after trial mode enabled
- [ ] Judge can view assigned track submissions
- [ ] Scoring sliders work (1-10)
- [ ] Bonus checkboxes work
- [ ] Notes auto-save with debounce
- [ ] Score calculation updates in real-time
- [ ] Submit button disabled until all criteria scored
- [ ] Submitted scores cannot be edited

### Admin Flow
- [ ] Trial mode toggle persists
- [ ] Judge assignment by email works
- [ ] Judge removal works
- [ ] Judge list displays correctly
- [ ] Close all tracks confirmation works
- [ ] Reveal results confirmation works

### Data Integrity
- [ ] RLS policies prevent unauthorized access
- [ ] Score trigger calculates correctly
- [ ] Views aggregate properly
- [ ] Leaderboard ranks correctly

---

## Prize Structure

### Main Prizes

| Place | Amount | Extras |
|-------|--------|--------|
| First Prize | Rs. 15,000 | Featured in JKKN100 |
| Second Prize | Rs. 10,000 | NIF incubation priority |
| Third Prize | Rs. 5,000 | Mentorship opportunity |

### Special Category Prizes

| Category | Amount |
|----------|--------|
| Best Healthcare Solution | Rs. 5,000 |
| Best Education Solution | Rs. 5,000 |
| Best First-Year Team | Rs. 3,000 |
| Best Cross-Institutional Team | Rs. 3,000 |
| Best User Validation | Rs. 3,000 |

### MyJKKN Track Prizes

| Category | Amount |
|----------|--------|
| Best MyJKKN App | Rs. 5,000 |
| Best Personal Dashboard | Rs. 3,000 |
| Best Community Tool | Rs. 3,000 |

**Total Prize Pool: Rs. 63,000**

---

*Last Updated: 2026-01-03*
*Document Version: 1.2 - Added event-specific sidebar spec*
