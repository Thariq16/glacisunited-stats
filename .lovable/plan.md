

## Multi-Tenant System Plan

### Current State
You already have the foundation in place:
- `organizations` table with owner, name, slug
- `organization_members` table with roles (owner, admin, analyst, coach, player, viewer)
- `teams` table with `organization_id` foreign key
- Two orgs exist: "Glacis United FC" and "Ehalapola FC"

What's missing is that this **Stats Viewer app ignores organizations entirely** — it shows all teams/matches globally. The admin routes also use the old `user_roles` table instead of org-based roles.

### Architecture

```text
┌─────────────────────────────────────────────────┐
│  Single App Instance (this project)             │
│                                                 │
│  /org/:orgSlug/...  ← tenant-scoped routes      │
│  /org/glacis-united-fc/matches                  │
│  /org/ohud-fc/matches                           │
│  /org/ohud-fc/admin                             │
│                                                 │
│  Each org owner = admin of their tenant          │
│  Separate login links per tenant                 │
└─────────────────────────────────────────────────┘
```

### Implementation Steps

**1. Add org-scoped routing**
- Prefix all main routes with `/org/:orgSlug/`
- Examples: `/org/ohud-fc/matches`, `/org/ohud-fc/players`, `/org/ohud-fc/admin`
- Root `/` redirects to org selection or the user's org if they belong to one
- Each tenant gets a shareable base URL: `https://glacisunited-stats.lovable.app/org/ohud-fc`

**2. Create an OrganizationProvider context**
- Reads `orgSlug` from URL params
- Fetches the org and its teams from the database
- Provides `currentOrg`, `primaryTeam`, `orgTeams` to all child components
- Checks if the current user is a member and their role

**3. Scope all data queries by organization**
- `useTeams()` → filter by `organization_id`
- `useMatches()` → only matches where home/away team belongs to the org
- `usePlayerStats()` → only players on org teams
- This ensures each tenant sees only their own data

**4. Replace `user_roles`-based access with org-based roles**
- Owner/Admin of an org can create matches, log events, manage players — but only for their org's teams
- Update `ProtectedRoute` to check `organization_members.role` instead of `user_roles`
- `useAuth` exposes `orgRole` derived from the current org context

**5. Tenant-specific login links**
- `/org/ohud-fc/auth` → login page branded/scoped to that org
- After login, user is redirected to their org's dashboard
- If a user belongs to multiple orgs, show an org picker

**6. Create Ohud FC tenant**
- Insert organization record for "Ohud FC" with slug `ohud-fc`
- Create first team under it
- Register an owner user account and assign them as `owner` in `organization_members`

**7. Update RLS policies (optional hardening)**
- Currently matches/events/players are publicly readable (SELECT = true), which is fine for a stats viewer
- Write operations already require admin role; optionally add org-scoping so org admins can only modify their own org's data via `is_org_admin(auth.uid(), organization_id)`

### Separate Links Per Tenant

| Tenant | Stats Viewer | Admin/Login |
|---|---|---|
| Glacis United FC | `/org/glacis-united-fc` | `/org/glacis-united-fc/auth` |
| Ohud FC | `/org/ohud-fc` | `/org/ohud-fc/auth` |

### Key Files to Modify
- `src/App.tsx` — restructure routes under `/org/:orgSlug`
- New `src/contexts/OrganizationContext.tsx` — org provider
- `src/hooks/useAuth.tsx` — add org-aware role checking
- `src/hooks/useTeams.ts`, `src/hooks/usePlayerStats.ts` — scope queries by org
- `src/services/matchService.ts` — filter matches by org teams
- `src/components/ProtectedRoute.tsx` — check org membership roles
- `src/pages/Auth.tsx` — org-scoped login
- `src/components/Navbar.tsx` — show org name, scoped navigation

### What This Gives You
- One codebase, one database, multiple clubs
- Each club owner manages their own data independently
- Separate shareable URLs for viewers and admins
- No data leakage between tenants (query-level + optional RLS)
- Adding a new club = inserting 1 org + 1 team + 1 user membership

