

## Splitting Into Two Projects

### Current Architecture

The app has two distinct user workflows in one codebase:

1. **Public/Coach App** — Match stats, player profiles, squad analysis, seasons, player comparison (pages: Home, Matches, MatchDetail, Players, PlayerProfile, SquadAnalysis, Seasons, PlayerComparison, TeamStats)
2. **Analyst/Admin App** — Data entry, match event logging, squad selection, CSV uploads, comment management (pages under `/admin/*`, plus the data entry components)

### Recommended Split

| | **Project A: Stats Viewer** | **Project B: Analyst SaaS** |
|---|---|---|
| **Users** | Coaches, players, public | Analysts (paid SaaS users) |
| **Pages** | Home, Matches, MatchDetail, Players, PlayerProfile, SquadAnalysis, Seasons, Compare, TeamStats | Admin dashboard, Match Events, Squad Selection, Data Import, Comments, Seasons management |
| **Auth** | Optional (coach login for Notes) | Required (analyst accounts, org-based multi-tenancy) |
| **Database** | Shared Supabase backend (read-only) | Shared Supabase backend (read-write) |

### How to Do It

This is a **structural/organizational decision** rather than a code change Lovable can automate in one step. Here is the recommended approach:

1. **Create a new Lovable project** for the Analyst SaaS app
2. **Connect both projects to the same Supabase backend** — the database, RLS policies, and edge functions stay shared. Both projects use the same `SUPABASE_URL` and keys.
3. **Copy the admin features** (`src/features/admin/`, related hooks, services, and event components) into the new project
4. **Remove admin routes and code** from this project, keeping it as the read-only stats viewer
5. **Expand multi-tenancy** in the SaaS project — the `organizations` and `organization_members` tables are already in place, so you can build org-based onboarding, billing, and team management there

### What Stays Shared

- **Supabase database** — both projects read/write the same tables
- **RLS policies** — already enforce role-based access server-side
- **Edge functions** — shared backend logic

### What You Need to Decide

- **Domain strategy**: e.g., `app.glacisunited-stats.com` (viewer) vs `analyst.glacisunited-stats.com` (SaaS)
- **Billing/subscription**: Stripe integration for the SaaS project
- **Whether to keep shared components** (Navbar, Footer, UI library) as copy or extract to a shared package

### Practical Next Steps (in Lovable)

1. Create the new project (or remix this one)
2. In the **new project**: delete public pages, keep admin pages, build SaaS features (onboarding, billing, org management)
3. In **this project**: remove `/admin/*` routes and `src/features/admin/` directory
4. Connect both projects to the same backend via environment variables

This approach lets you iterate on each product independently while sharing the same data layer.

