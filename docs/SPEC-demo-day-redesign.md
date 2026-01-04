# Demo Day UI Redesign - Full Specification

> **Created:** 2026-01-04
> **Deadline:** 2026-01-07 (Demo Day at 9:30 AM IST)
> **Style:** NASA Mission Control

---

## Design Philosophy

### Core Principles

1. **Information Density Without Overload**
   - Multiple data points visible simultaneously
   - Clear visual hierarchy through size, color, position
   - Status lights (green/amber/red) for instant health assessment

2. **Action-Oriented Layout**
   - Primary actions always visible, never buried
   - Contextual actions appear where needed
   - 3-click maximum for any task

3. **Real-Time Awareness**
   - Live updating metrics (30s refresh when live)
   - Anomaly detection with visual alerts
   - Time-sensitive information prominently displayed

4. **Professional Gravitas**
   - JKKN brand colors (#0b6d41 green, #ffde59 gold) as accents
   - Dark theme for focus and reduced eye strain
   - Clean typography, consistent spacing

---

## Color System

### Brand Colors (Required)
| Name | Hex | Usage |
|------|-----|-------|
| JKKN Green | `#0b6d41` | Primary actions, success states, brand identity |
| JKKN Gold | `#ffde59` | Highlights, warnings, special features |

### Extended Palette
| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0a0a0a` | Main background |
| Surface | `#18181b` | Cards, panels |
| Surface Elevated | `#27272a` | Hover states, modals |
| Border | `#3f3f46` | Subtle borders |
| Text Primary | `#fafafa` | Headings, important text |
| Text Secondary | `#a1a1aa` | Body text, labels |
| Text Muted | `#71717a` | Hints, timestamps |

### Status Colors
| Status | Hex | Usage |
|--------|-----|-------|
| Success | `#22c55e` | Completed, on-track |
| Warning | `#f59e0b` | Needs attention, behind schedule |
| Error | `#ef4444` | Critical issues, anomalies |
| Info | `#3b82f6` | Informational, in-progress |

---

## Admin Dashboard Redesign

### Page: `/admin/events/[slug]/page.tsx`

#### Layout Structure
```
+----------------------------------------------------------+
|  [Event Header - Name, Status Badge, Quick Actions]       |
+----------------------------------------------------------+
|  [Key Metrics Strip - 4-6 cards in single row]           |
+----------------------------------------------------------+
|  [Mission Control Grid]                                   |
|  +------------------+  +------------------+               |
|  | Activity Feed    |  | Track Status     |               |
|  | (Real-time)      |  | (Grid view)      |               |
|  +------------------+  +------------------+               |
|  +------------------+  +------------------+               |
|  | Institution Map  |  | Alert Panel      |               |
|  | (Breakdown)      |  | (Issues)         |               |
|  +------------------+  +------------------+               |
+----------------------------------------------------------+
|  [Quick Actions Bar - Most Used Functions]                |
+----------------------------------------------------------+
```

#### Key Metrics Strip
| Metric | Icon | Color | Description |
|--------|------|-------|-------------|
| Builders | Users | Blue | Total registered builders |
| Submissions | FileText | Purple | Total submissions |
| Completion | CheckCircle | Green | % cycles at step 8+ |
| Problems | Database | Amber | Problems in bank |
| Days to Demo | Calendar | Red/Green | Countdown (red if <3d) |
| Live Status | Activity | Pulsing | Event health indicator |

#### Track Status Grid
- 6 track cards in 3x2 grid
- Each card shows:
  - Track name + theme badge
  - Submissions count
  - Judge count with status lights
  - Progress bar (demos completed)
  - "Manage" button

#### Activity Feed
- Real-time stream of events
- Icons for event type (score, submission, judge assignment)
- Timestamps in relative format ("2 min ago")
- Click to navigate to relevant item

#### Alert Panel
- Issues requiring attention
- Priority sorted (critical first)
- Actionable alerts with "Fix" buttons
- Categories: Judge issues, Score anomalies, Missing data

---

## Demo Day Command Center Redesign

### Page: `/admin/events/[slug]/demo-day/page.tsx`

#### Layout Structure
```
+----------------------------------------------------------+
|  [Command Center Header]                                  |
|  DEMO DAY COMMAND CENTER    [LIVE] 10:45 AM   [Refresh]  |
+----------------------------------------------------------+
|  [Global Stats Bar - Horizontal]                          |
|  Total: 500 | Completed: 234 (47%) | In Progress: 12     |
|  Active Judges: 18/20 | Audience: 1,247 | Votes: 3,891   |
+----------------------------------------------------------+
|  [Track Control Grid - 3x2]                               |
|  +----------------+ +----------------+ +----------------+  |
|  | Healthcare     | | Education      | | Agriculture    |  |
|  | 45/82 demos    | | 38/76 demos    | | 22/45 demos    |  |
|  | [Status Light] | | [Status Light] | | [Status Light] |  |
|  | [Manage]       | | [Manage]       | | [Manage]       |  |
|  +----------------+ +----------------+ +----------------+  |
|  +----------------+ +----------------+ +----------------+  |
|  | Environment    | | Community      | | MyJKKN         |  |
|  | 18/35 demos    | | 31/62 demos    | | 12/25 demos    |  |
|  | [Status Light] | | [Status Light] | | [Status Light] |  |
|  | [Manage]       | | [Manage]       | | [Manage]       |  |
|  +----------------+ +----------------+ +----------------+  |
+----------------------------------------------------------+
|  [Side Panel - Context Sensitive]                         |
|  - Judge Activity Monitor                                 |
|  - Score Anomaly Detection                                |
|  - Quick Actions                                          |
+----------------------------------------------------------+
```

#### Global Stats Bar Design
- Single horizontal strip below header
- Dark background with subtle border
- Each metric in its own cell with icon + value + label
- Pulsing animation on "LIVE" badge when event is active

#### Track Control Cards
| Element | Design |
|---------|--------|
| Header | Track name + theme badge |
| Progress | Large progress ring (donut chart) |
| Stats | Demos: X/Y, Judges: N, Votes: N |
| Status Light | Green (on track), Amber (behind), Red (issue) |
| Actions | "Manage Track" primary button |

#### Status Light Logic
| Condition | Color | Meaning |
|-----------|-------|---------|
| All judges active, on schedule | Green | Healthy |
| Judge inactive >10 min OR 15 min behind | Amber | Needs attention |
| Judge inactive >20 min OR 30 min behind OR anomaly detected | Red | Critical |

#### Judge Activity Monitor (Side Panel)
- List of all judges with last activity timestamp
- Color coding: Green (<5 min), Amber (5-15 min), Red (>15 min)
- "Nudge" button to send reminder
- Click to view judge's scoring progress

#### Score Anomaly Detection (Side Panel)
- Flagged scores that need review
- Patterns detected:
  - All scores same value (e.g., all 10s)
  - Score significantly different from peer judges
  - Rapid scoring (suspiciously fast)
- "Review" button for each anomaly

---

## Public Pages Redesign

### Judge Panel (`/judge`)

#### Layout
```
+----------------------------------------------------------+
|  [Header - Clean, Focused]                                |
|  APPATHON 2.0 JUDGING PANEL           [Your Track Badge] |
+----------------------------------------------------------+
|  [Current Submission Card - Full Width]                   |
|  +------------------------------------------------------+ |
|  | App Name: HealthTrack AI                             | |
|  | Team: Medical Innovators (4 members)                 | |
|  | Problem: Early detection of diabetes...              | |
|  | [View Live App]  [Watch Demo Video]                  | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+
|  [Scoring Interface - Clean Sliders]                      |
|  +------------------------------------------------------+ |
|  | Problem Impact (20%)        [====o======] 7/10       | |
|  | Solution Innovation (20%)   [========o==] 9/10       | |
|  | Working Prototype (20%)     [======o====] 8/10       | |
|  | User Validation (15%)       [====o======] 7/10       | |
|  | Presentation (5%)           [========o==] 9/10       | |
|  | Bioconvergence (5%)         [====o======] 7/10       | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+
|  [Bonus Checkboxes - Horizontal]                          |
|  [ ] Cross-disciplinary (+5%)  [ ] First-year (+3%)      |
|  [ ] Cross-institutional (+5%) [ ] Testimonials (+2%)    |
+----------------------------------------------------------+
|  [Notes Section - Collapsible]                            |
|  Strengths: [textarea]                                    |
|  Improvements: [textarea]                                 |
+----------------------------------------------------------+
|  [Footer - Score Preview + Submit]                        |
|  Your Score: 78.5    Bonus: +8%    Total: 84.8           |
|  [Save Draft]                         [Submit Score]      |
+----------------------------------------------------------+
```

#### Scoring Sliders
- Custom slider component with JKKN green fill
- Large touch targets for tablet use
- Value displayed to the right
- Weight badge next to criterion name

### Audience Voting (`/vote`)

#### Layout
```
+----------------------------------------------------------+
|  [Header]                                                 |
|  AUDIENCE VOTING                        [Time Remaining] |
+----------------------------------------------------------+
|  [Current Presenter Card]                                 |
|  +------------------------------------------------------+ |
|  | [App Screenshot/Logo]                                | |
|  | HealthTrack AI                                       | |
|  | by Medical Innovators                                | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+
|  [Star Rating - Large, Touch-Friendly]                    |
|               [*] [*] [*] [*] [*]                         |
|               Tap to rate (1-5 stars)                    |
+----------------------------------------------------------+
|  [Reaction Buttons - Optional]                            |
|  [Innovative] [Useful] [Polished] [Impactful]           |
+----------------------------------------------------------+
|  [Submit Button - Full Width]                             |
|  [        SUBMIT VOTE        ]                            |
+----------------------------------------------------------+
|  [Countdown Timer - When Voting Window Open]              |
|  Voting closes in: 4:32                                  |
+----------------------------------------------------------+
```

#### Time-Lock UI
- When voting window closed: Gray overlay with "Voting opens when demo starts"
- When voting open: Pulsing gold border, countdown timer prominent
- When time expires: "Vote submitted!" or "Voting closed" message

### Results Reveal (`/results`)

#### Pre-Reveal State
```
+----------------------------------------------------------+
|  [Header - Anticipation Building]                         |
|  APPATHON 2.0 GRAND FINALE              [Countdown]      |
+----------------------------------------------------------+
|  [Animated Waiting State]                                 |
|  +------------------------------------------------------+ |
|  |                                                      | |
|  |              Results will be revealed                | |
|  |                    at 4:00 PM                        | |
|  |                                                      | |
|  |              [Animated Logo/Particles]               | |
|  |                                                      | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+
```

#### During Reveal
```
+----------------------------------------------------------+
|  [Track Being Revealed]                                   |
|  HEALTHCARE TRACK RESULTS                                |
+----------------------------------------------------------+
|  [Animated Reveal Cards - One at a Time]                  |
|  3RD PLACE: [Reveal Animation] -> Team Name              |
|  2ND PLACE: [Reveal Animation] -> Team Name              |
|  1ST PLACE: [Reveal Animation] -> Team Name              |
+----------------------------------------------------------+
|  [Audience Reaction - Live Vote Count]                    |
|  1,247 viewers watching                                  |
+----------------------------------------------------------+
```

#### Post-Reveal State
```
+----------------------------------------------------------+
|  [Full Leaderboard - All Tracks]                          |
|  Track tabs: [Healthcare] [Education] [Agriculture] ...  |
+----------------------------------------------------------+
|  [Leaderboard Table]                                      |
|  Rank | Team | Score | Judge Avg | Audience | Bonus      |
|  #1   | ...  | 92.4  | 88.5      | 96.2     | +8%        |
|  #2   | ...  | 89.1  | 85.2      | 93.0     | +5%        |
|  ...                                                      |
+----------------------------------------------------------+
|  [View All Feedback] - Link to individual score breakdown |
+----------------------------------------------------------+
```

---

## Component Library Updates

### New Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `StatusLight` | `components/ui/status-light.tsx` | Green/amber/red indicator |
| `MetricCard` | `components/ui/metric-card.tsx` | Stat display with icon |
| `ProgressRing` | `components/ui/progress-ring.tsx` | Circular progress indicator |
| `LiveBadge` | `components/ui/live-badge.tsx` | Pulsing "LIVE" indicator |
| `CountdownTimer` | `components/ui/countdown-timer.tsx` | Time remaining display |
| `AlertItem` | `components/admin/alert-item.tsx` | Actionable alert card |
| `JudgeActivityRow` | `components/admin/judge-activity-row.tsx` | Judge status row |
| `StarRating` | `components/ui/star-rating.tsx` | 5-star input for voting |
| `RevealCard` | `components/results/reveal-card.tsx` | Animated winner reveal |

### Existing Components to Update

| Component | Changes |
|-----------|---------|
| `TrackCard` | Add status light, progress ring, redesign layout |
| `DemoDayStats` | Horizontal layout, add new metrics |
| `GlobalControls` | Cleaner layout, better button hierarchy |
| `LeaderboardView` | Add track tabs, improve table styling |
| `ScoringForm` | Cleaner sliders, better visual hierarchy |

---

## Database Migrations to Deploy

### Required Migrations (In Order)

1. **083_audience_voting.sql** - `audience_votes` table with RLS
2. **084_time_locked_voting.sql** - `is_voting_open()` RPC
3. **085_grand_finale_reveal.sql** - Final scoring (80/20 split)
4. **086_judge_submission_rls.sql** - RLS fix for judge access
5. **087_demo_reveal_state.sql** - `demo_day_reveal_state` table
6. **20260103_track_leaderboard.sql** - `track_leaderboards` table

### Deployment Method
- Run each migration in order via Supabase Dashboard SQL Editor
- Verify each migration succeeds before proceeding to next

---

## Implementation Priority

### Phase 1: Database (Day 1 Morning)
- [ ] Deploy migration 083
- [ ] Deploy migration 084
- [ ] Deploy migration 085
- [ ] Deploy migration 086
- [ ] Deploy migration 087
- [ ] Deploy migration 20260103
- [ ] Verify all RPC functions work

### Phase 2: Core Components (Day 1 Afternoon)
- [ ] Create StatusLight component
- [ ] Create MetricCard component
- [ ] Create ProgressRing component
- [ ] Create LiveBadge component
- [ ] Create CountdownTimer component

### Phase 3: Admin Dashboard (Day 2 Morning)
- [ ] Redesign event admin page layout
- [ ] Implement key metrics strip
- [ ] Implement track status grid
- [ ] Add alert panel

### Phase 4: Command Center (Day 2 Afternoon)
- [ ] Redesign Demo Day page layout
- [ ] Implement judge activity monitor
- [ ] Implement score anomaly detection
- [ ] Real-time status updates

### Phase 5: Public Pages (Day 3 Morning)
- [ ] Redesign judge panel
- [ ] Redesign audience voting
- [ ] Redesign results page
- [ ] Animated reveal experience

### Phase 6: Testing & Polish (Day 3 Afternoon)
- [ ] End-to-end flow testing
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Final deploy

---

## Success Validation Checklist

### Zero Confusion
- [ ] Admin can identify event health in <5 seconds
- [ ] All primary actions visible without scrolling
- [ ] Clear labeling on all metrics and buttons

### Real-Time Confidence
- [ ] Live badge pulses when event active
- [ ] Metrics update every 30 seconds
- [ ] Anomalies highlighted automatically

### Stakeholder Impression
- [ ] JKKN branding visible and consistent
- [ ] Professional, polished appearance
- [ ] No loading spinners visible for >2 seconds

### Speed
- [ ] Any admin task completable in 3 clicks
- [ ] Judge scoring submittable in <30 seconds
- [ ] Audience voting submittable in <10 seconds

---

*Last Updated: 2026-01-04*
*Created by Claude during interview session*
