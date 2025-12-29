# Admin Data Scoping Specification

> Multi-tenant admin access control for events and institutions

## Overview

This spec defines how admins at different levels see and interact with data across the Flywheel Coach platform. The system supports multiple concurrent events (e.g., Appathon 2.0, Appathon 3.0) and multiple institutions (JKKN colleges), with clear data boundaries and audit trails.

---

## Role Hierarchy

| Role | Scope | Can See | Can Edit |
|------|-------|---------|----------|
| **superadmin** | Global | All data across all events/institutions | Everything |
| **event_admin** | Event-specific | All data for assigned event(s) | All data for assigned event(s) |
| **institution_admin** | Institution-specific | Data for their institution | View-only (except own institution's non-submission data) |
| **user** | Self | Own data only | Own data only |

### Permission Matrix

| Resource | superadmin | event_admin | institution_admin | user |
|----------|------------|-------------|-------------------|------|
| Users (all) | CRUD | Read (own event) | Read (own institution) | - |
| Users (own institution) | CRUD | CRUD | Read | - |
| Cycles (all) | CRUD | CRUD (own event) | Read (own institution) | - |
| Submissions (all) | CRUD | CRUD (own event) | Read* | Read (own) |
| Appathon submissions | CRUD | CRUD (own event) | Read* | Read (own) |
| Problems | CRUD | CRUD (own event) | Read (own institution) | CRUD (own) |
| Admin assignments | CRUD | Read | - | - |
| Audit logs | Read | Read (own event) | - | - |

*Institution admins can VIEW cross-institutional team submissions where their institution is involved, but cannot EDIT.

---

## Database Schema Changes

### New Tables

```sql
-- Institution admins table
CREATE TABLE institution_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);

-- Admin audit log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_role TEXT NOT NULL, -- 'superadmin', 'event_admin', 'institution_admin'
  action_type TEXT NOT NULL, -- 'page_view', 'create', 'update', 'delete'
  resource_type TEXT NOT NULL, -- 'user', 'cycle', 'submission', 'problem', etc.
  resource_id UUID,
  page_path TEXT, -- For page_view actions
  filters_applied JSONB, -- What filters were active
  event_id UUID REFERENCES events(id),
  institution_id UUID REFERENCES institutions(id),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_event ON admin_audit_log(event_id);
CREATE INDEX idx_audit_resource ON admin_audit_log(resource_type, resource_id);
```

### Denormalization Changes

```sql
-- Add institution_id to cycles for faster filtering
ALTER TABLE cycles
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- Add institution_ids array to appathon_submissions for cross-institutional teams
ALTER TABLE appathon_submissions
ADD COLUMN IF NOT EXISTS institution_ids UUID[] DEFAULT '{}';

-- Populate institution_ids from team_members JSONB
-- (Will need migration to extract institution IDs from team member data)
```

### Institutions Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT, -- e.g., "JKKN Pharmacy", "JKKN Arts"
  code TEXT UNIQUE, -- e.g., "JKKN-PHARM", "JKKN-ARTS"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link users to institutions
ALTER TABLE users
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);
```

---

## RPC Functions

### Get Admin Role

```sql
CREATE OR REPLACE FUNCTION get_admin_role(user_id UUID)
RETURNS TABLE (
  role TEXT,
  event_ids UUID[],
  institution_ids UUID[]
) AS $$
BEGIN
  -- Check superadmin first
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'superadmin') THEN
    RETURN QUERY SELECT 'superadmin'::TEXT, NULL::UUID[], NULL::UUID[];
    RETURN;
  END IF;

  -- Check event_admin
  IF EXISTS (SELECT 1 FROM event_admins WHERE event_admins.user_id = get_admin_role.user_id) THEN
    RETURN QUERY
    SELECT 'event_admin'::TEXT,
           ARRAY_AGG(event_id),
           NULL::UUID[]
    FROM event_admins
    WHERE event_admins.user_id = get_admin_role.user_id;
    RETURN;
  END IF;

  -- Check institution_admin
  IF EXISTS (SELECT 1 FROM institution_admins WHERE institution_admins.user_id = get_admin_role.user_id) THEN
    RETURN QUERY
    SELECT 'institution_admin'::TEXT,
           NULL::UUID[],
           ARRAY_AGG(institution_id)
    FROM institution_admins
    WHERE institution_admins.user_id = get_admin_role.user_id;
    RETURN;
  END IF;

  -- Regular user
  RETURN QUERY SELECT 'user'::TEXT, NULL::UUID[], NULL::UUID[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Get Scoped Submissions

```sql
CREATE OR REPLACE FUNCTION get_scoped_submissions(
  p_admin_id UUID,
  p_event_filter UUID DEFAULT NULL,
  p_institution_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  submission_id UUID,
  team_name TEXT,
  event_id UUID,
  event_name TEXT,
  institution_ids UUID[],
  institution_names TEXT[],
  -- ... other submission fields
  can_edit BOOLEAN
) AS $$
DECLARE
  v_role TEXT;
  v_event_ids UUID[];
  v_institution_ids UUID[];
BEGIN
  -- Get admin role
  SELECT role, event_ids, institution_ids
  INTO v_role, v_event_ids, v_institution_ids
  FROM get_admin_role(p_admin_id);

  RETURN QUERY
  SELECT
    s.id,
    s.team_name,
    c.event_id,
    e.name,
    s.institution_ids,
    ARRAY(SELECT i.name FROM institutions i WHERE i.id = ANY(s.institution_ids)),
    -- Can edit logic
    CASE
      WHEN v_role = 'superadmin' THEN TRUE
      WHEN v_role = 'event_admin' AND c.event_id = ANY(v_event_ids) THEN TRUE
      ELSE FALSE -- institution_admin can only view
    END
  FROM appathon_submissions s
  JOIN cycles c ON s.cycle_id = c.id
  JOIN events e ON c.event_id = e.id
  WHERE
    -- Superadmin sees all
    (v_role = 'superadmin')
    -- Event admin sees their events
    OR (v_role = 'event_admin' AND c.event_id = ANY(v_event_ids))
    -- Institution admin sees submissions involving their institution
    OR (v_role = 'institution_admin' AND s.institution_ids && v_institution_ids)
  -- Apply optional filters
  AND (p_event_filter IS NULL OR c.event_id = p_event_filter)
  AND (p_institution_filter IS NULL OR p_institution_filter = ANY(s.institution_ids));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Log Admin Action

```sql
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_page_path TEXT DEFAULT NULL,
  p_filters JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_role TEXT;
  v_event_id UUID;
  v_institution_id UUID;
  v_log_id UUID;
BEGIN
  v_admin_id := auth.uid();

  -- Get role info
  SELECT role INTO v_role FROM get_admin_role(v_admin_id);

  -- Get context from filters if provided
  v_event_id := (p_filters->>'event_id')::UUID;
  v_institution_id := (p_filters->>'institution_id')::UUID;

  INSERT INTO admin_audit_log (
    admin_id, admin_role, action_type, resource_type,
    resource_id, page_path, filters_applied,
    event_id, institution_id, metadata
  ) VALUES (
    v_admin_id, v_role, p_action_type, p_resource_type,
    p_resource_id, p_page_path, p_filters,
    v_event_id, v_institution_id, p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## UI Components

### Admin Layout Changes

All admin pages will have consistent scoping controls:

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Admin Dashboard                    [User Menu]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sidebar        │  ┌─────────────────────────────────────┐  │
│  ─────────      │  │ Filters (role-dependent)            │  │
│  Dashboard      │  │ ┌─────────────┐ ┌─────────────────┐ │  │
│  Users          │  │ │ Event ▼     │ │ Institution ▼   │ │  │
│  Cycles         │  │ └─────────────┘ └─────────────────┘ │  │
│  Submissions    │  └─────────────────────────────────────┘  │
│  Problems       │                                           │
│  ─────────      │  ┌─────────────────────────────────────┐  │
│  Roles ← NEW    │  │ Data Table                          │  │
│  Audit Log      │  │ ┌───────┬────────┬──────────┬────┐  │  │
│                 │  │ │ Name  │ Event  │ Institut.│ ...│  │  │
│                 │  │ ├───────┼────────┼──────────┼────┤  │  │
│                 │  │ │ ...   │ ...    │ ...      │ ...│  │  │
│                 │  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Filter Behavior by Role

| Role | Event Filter | Institution Filter |
|------|--------------|-------------------|
| superadmin | All events + "All" option | All institutions + "All" option |
| event_admin | Only assigned events (pre-filtered) | All institutions in their events |
| institution_admin | Events with their institution | Pre-filtered to their institution |

### New Columns in Data Tables

| Page | New Columns |
|------|-------------|
| `/admin/users` | Institution |
| `/admin/cycles` | Event, Institution |
| `/admin/submissions` | Event, Institutions (comma-separated for teams) |
| `/admin/problems` | Event, Institution |

### Role Assignment Page (`/admin/roles`)

```
┌─────────────────────────────────────────────────────────────┐
│  Role Management                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tabs: [Event Admins] [Institution Admins]                  │
│                                                             │
│  Event Admins                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ User            │ Events                │ Actions      ││
│  ├─────────────────┼───────────────────────┼──────────────┤│
│  │ John Doe        │ Appathon 2.0          │ [Edit] [X]   ││
│  │ Jane Smith      │ Appathon 2.0, 3.0     │ [Edit] [X]   ││
│  └─────────────────────────────────────────────────────────┘│
│  [+ Add Event Admin]                                        │
│                                                             │
│  Add Event Admin Modal:                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Search User: [________________] 🔍                      ││
│  │ Select Events: ☑ Appathon 2.0  ☐ Appathon 3.0          ││
│  │                                     [Cancel] [Assign]   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Submission Detail View

For cross-institutional teams, show institution per member:

```
Team Members:
┌──────────────────────────────────────────────────────────┐
│ Name           │ Role      │ Institution                │
├────────────────┼───────────┼────────────────────────────┤
│ Alice Chen     │ Leader    │ JKKN College of Pharmacy   │
│ Bob Kumar      │ Developer │ JKKN Arts & Science        │
│ Carol Das      │ Designer  │ JKKN College of Pharmacy   │
└──────────────────────────────────────────────────────────┘
```

---

## Audit Logging

### What Gets Logged

| Action Type | Trigger |
|-------------|---------|
| `page_view` | Every admin page load |
| `filter_change` | When filters are modified |
| `create` | Creating any resource |
| `update` | Updating any resource |
| `delete` | Deleting any resource |
| `export` | Exporting data |
| `role_assign` | Assigning admin roles |
| `role_revoke` | Revoking admin roles |

### Audit Log Page (`/admin/audit`)

```
┌─────────────────────────────────────────────────────────────┐
│  Audit Log                                                  │
├─────────────────────────────────────────────────────────────┤
│  Filters: [Date Range ▼] [Admin ▼] [Action ▼] [Resource ▼] │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Timestamp        │ Admin     │ Action    │ Resource    ││
│  ├──────────────────┼───────────┼───────────┼─────────────┤│
│  │ 2025-12-29 14:30 │ John Doe  │ page_view │ /submissions││
│  │ 2025-12-29 14:28 │ John Doe  │ update    │ submission  ││
│  │ 2025-12-29 14:25 │ Jane S.   │ page_view │ /users      ││
│  └─────────────────────────────────────────────────────────┘│
│  [Export CSV]                                               │
└─────────────────────────────────────────────────────────────┘
```

Only superadmin can see all audit logs. Event admins see only their events' logs.

---

## Implementation Plan

### Phase 1: Database Foundation
1. Create `institutions` table and populate with JKKN institutions
2. Create `institution_admins` table
3. Create `admin_audit_log` table
4. Add `institution_id` to `cycles` table
5. Add `institution_ids` array to `appathon_submissions`
6. Create migration to populate institution data from existing records

### Phase 2: RPC Functions
1. Implement `get_admin_role()` function
2. Update existing `get_all_*_admin` RPCs to support institution scoping
3. Create `get_scoped_submissions()` function
4. Implement `log_admin_action()` function
5. Add RLS policies for institution_admins table

### Phase 3: UI - Filters & Columns
1. Create `useAdminFilters` hook for consistent filter state
2. Add Event and Institution columns to all admin tables
3. Add filter dropdowns to admin layout header
4. Implement filter persistence in URL params

### Phase 4: UI - Role Management
1. Create `/admin/roles` page
2. Implement event admin assignment UI
3. Implement institution admin assignment UI
4. Add user search with typeahead

### Phase 5: Audit & Polish
1. Create `/admin/audit` page
2. Implement audit logging middleware
3. Add audit log calls to all admin actions
4. Add export functionality

---

## Edge Cases

### Cross-Institutional Teams

When a team has members from multiple institutions:
- All involved institution admins can VIEW the submission
- Only event admin (or superadmin) can EDIT
- Institution filter shows submission if ANY member matches

### Admin with Multiple Roles

A user could theoretically be both event_admin and institution_admin:
- Higher role takes precedence (event_admin > institution_admin)
- If event_admin for Event A and institution_admin for Institution B in Event C, they see both scopes

### Orphaned Data

Data without event/institution assignment:
- Superadmin sees orphaned data
- Others don't see orphaned data
- Migration should assign events/institutions to all existing data

### Role Revocation

When an admin role is revoked:
- Audit log captures the revocation
- Access is immediately removed (RPC checks on every request)
- No data is deleted; history preserved

---

## Security Considerations

1. **All scoping done server-side** - Never trust client-side filters for security
2. **RLS as backup** - Even if RPC is bypassed, RLS prevents unauthorized access
3. **Audit everything** - Every admin page view is logged, not just mutations
4. **No role escalation** - Only superadmin can assign admin roles
5. **Session validation** - Check role on every request, not just login

---

## Migration Checklist

- [ ] Create institutions table with JKKN data
- [ ] Add institution_id foreign keys
- [ ] Populate institution_ids in appathon_submissions from team_members JSONB
- [ ] Create institution_admins table
- [ ] Create admin_audit_log table
- [ ] Deploy RPC functions
- [ ] Update existing admin RPCs
- [ ] Test RLS policies
- [ ] Deploy UI changes
- [ ] Assign initial institution admins
- [ ] Verify audit logging

---

*Spec Version: 1.0*
*Created: 2025-12-29*
*Status: Ready for Implementation*
