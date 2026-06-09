## Export Lovable Cloud database for self-hosted Supabase migration

I'll generate downloadable artifacts containing your full database (schema + data) so you can restore it into your own Supabase project.

### What you'll get (files in `/mnt/documents/`)

1. **`footymetrics_schema.sql`** — full `public` schema DDL: tables, columns, constraints, indexes, sequences, custom types/enums (`app_role`, etc.), all `SECURITY DEFINER` functions (`has_role`, `is_org_admin`, `bootstrap_org_owner_membership`, `update_match_scores`, `handle_new_user`, etc.), triggers, RLS policies, and GRANTs.
2. **`footymetrics_data.sql`** — `INSERT`/`COPY` statements for every row in every public table (matches, players, match_events, player_match_stats, attacking_phases, stories, story_versions, organizations, teams, seasons, comments, squads, profiles, user_roles, organization_members, push_subscriptions, service_signups).
3. **`footymetrics_full.sql`** — combined schema + data, single-file restore.
4. **`storage_org_logos/`** — every file from the `org-logos` storage bucket, downloaded to disk (logos referenced by your tenants).
5. **`MIGRATION_README.md`** — step-by-step restore instructions for your new Supabase project, plus the list of items that need manual recreation (see below).

### Method

Run `pg_dump` against the Lovable Cloud Postgres using `$SUPABASE_DB_URL` already present in the sandbox:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-owner --no-privileges \
  --clean --if-exists \
  > /mnt/documents/footymetrics_schema.sql        # with --schema-only

pg_dump "$SUPABASE_DB_URL" \
  --schema=public --data-only \
  --disable-triggers \
  > /mnt/documents/footymetrics_data.sql

pg_dump "$SUPABASE_DB_URL" \
  --schema=public --no-owner --no-privileges --clean --if-exists \
  > /mnt/documents/footymetrics_full.sql
```

For storage: loop the `storage.objects` rows in bucket `org-logos` and download each via the public URL into `storage_org_logos/<orgId>/...`.

### What cannot be exported automatically (manual steps in README)

These are owned by Supabase platform schemas (`auth`, `storage`, `vault`) and cannot be dumped by the sandbox role:

- **`auth.users`** — user accounts (emails, hashed passwords, OAuth identities). You must either:
  - Use Supabase's official "Migrate users" SQL snippet from the dashboard (Project Settings → Auth → Users), or
  - Have users sign up again on the new project. Their `profiles`/`user_roles`/`organization_members` rows reference `auth.users.id` UUIDs — if you re-create users with new UUIDs you'll need to remap FKs.
- **Storage bucket creation** — recreate the `org-logos` bucket (public) on the new project, then re-upload the files in `storage_org_logos/`.
- **Edge functions** — already in `supabase/functions/` in this repo; deploy them to the new project with `supabase functions deploy`.
- **Secrets** — `LOVABLE_API_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, etc. must be re-added in the new project's Edge Function secrets UI.
- **Auth providers** (Google OAuth, etc.) — reconfigure in the new project's auth dashboard.
- **Cron / scheduled jobs** — none currently configured, nothing to migrate.

### Restore flow (in your new Supabase project)

```bash
psql "<NEW_PROJECT_DB_URL>" -f footymetrics_full.sql
# then re-create org-logos bucket and re-upload files
# then migrate auth.users using Supabase's official guide
# then update .env in your app: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PROJECT_ID
```

### Confirm before I run

Switching to build mode will let me execute `pg_dump`, fetch storage files, and write all artifacts to `/mnt/documents/`. Approve the plan to proceed.