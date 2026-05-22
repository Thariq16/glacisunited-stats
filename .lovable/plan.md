## Goal

Turn FootyMetrics from a stats viewer into a storytelling and pattern-discovery platform with three new pillars:

1. **Shareable insight cards** — export any visualization (shot map, pass map, phase, player profile, match summary) as a branded PNG/JPG sized for Instagram, Twitter/X, and WhatsApp.
2. **Editable Story Mode for coaches & players** — AI drafts a narrative around each match / player explaining *why* something happened and *how* to fix it. The analyst (or admin/coach) can then edit every chapter, swap the embedded chart, save versions, and publish before it's shown to the coach or player audience.
3. **Analyst Insight Workbench** — a dedicated screen for the analyst to scan the season, spot anomalies and recurring patterns, and promote them into stories or shareable cards.

All three reuse the existing event schema, Lovable AI Gateway, and per-tenant branding (logo + primary/accent colors from the `organizations` table).

---

## Architecture today (quick recap)

- Data: `matches` → `match_events` → derived stats (shots/xG, passes, phases, set pieces, possession losses).
- UI: per-org routes under `/org/:orgSlug`, dashboards in `Matches`, `MatchDetail`, `Players`, `PlayerProfile`, `SquadAnalysis`.
- Reports today: HTML-only via `src/utils/reports/*` (`matchReport`, `playerReport`, `seasonReport`). No image export, no AI narration, no pattern engine.
- AI Gateway is available (`LOVABLE_API_KEY` already set) but not yet used.

---

## Pillar 1 — Shareable social cards

### What the user gets
A "Share" button on every key visualization (shot map, pass map, attacking phase, player card, match summary, set-piece card). Clicking it opens a dialog with:
- **Format picker**: Square (1080×1080 IG post), Story (1080×1920 IG/WhatsApp status), Landscape (1200×630 Twitter/OG).
- **Caption editor**: pre-filled with the AI-written one-liner from Pillar 2; fully editable before exporting.
- **Brand toggle**: club logo + primary color from the org are applied automatically; toggle to hide for a neutral export.
- Buttons: **Download PNG**, **Copy to clipboard**, **Share via Web Share API** (mobile).

### How it's built
- New component `ShareableCard` wraps any chart/diagram in a fixed-resolution canvas (1080×1080 / 1080×1920 / 1200×630) with header (org logo + match title + date), body (the SVG visualization, re-scaled), and footer (caption + footymetrics.lovable.app watermark).
- Rendering: `html-to-image` (`toPng`) — handles inline SVG (which all pitch diagrams are) and Tailwind tokens cleanly. No headless browser needed.
- Pre-baked **templates** per insight type: Shot Map, Phase, Player Profile, Match Summary, Set-Piece Retention.
- Sharing helpers: `navigator.share` when available, else clipboard + download.
- Permissioning: org admins, coaches, analysts.

---

## Pillar 2 — Editable Story Mode (the "why" + "how to fix")

### What the user gets
On `MatchDetail` and `PlayerProfile`, a new **Story** tab that reads like a short narrative instead of a dashboard:

```text
Match Story (coach view)
  ┌─ Headline:  "Glacis dominated the middle third but leaked from set pieces"
  ├─ Chapter 1: What happened       (1–2 paragraphs + 1 chart)
  ├─ Chapter 2: Why it happened     (causal reading of the data + 1 chart)
  ├─ Chapter 3: How to fix it       (3 concrete coaching actions)
  └─ Share buttons (uses Pillar 1)
```

Player story has the same shape but framed around the individual: strengths, one development area, one drill suggestion.

### Editing experience (the key piece)

Stories live in two states: **draft** (only admins/coaches/analysts can see it) and **published** (visible to the target audience). The flow:

1. Analyst opens the Story tab → clicks **Generate draft** → AI produces v1.
2. Analyst sees the story in an **edit-in-place** view:
   - Headline is a single-line editable text.
   - Each chapter has: editable title, rich-text body (basic formatting — bold, italic, lists, line breaks), an editable bullet list for the "How to fix it" actions, and a **chart picker** (dropdown of allowed chart hints for that chapter).
   - Add / remove / reorder chapters (drag handle).
   - Share caption is its own editable field.
3. Buttons: **Save draft** (autosaves on blur too), **Regenerate this chapter** (sends just that chapter back to the AI with the analyst's note as guidance), **Regenerate whole story**, **Revert to AI version**, **Publish**.
4. **Version history**: every save creates a new row; analyst can view diffs and restore any previous version.
5. Once **Published**, the coach / player audience sees the published version. Editors continue to see a banner: "Edited by {name} {time ago} · View history · Edit again".
6. **Locking**: a soft lock indicator shows "{name} is editing" (last-write-wins; no hard pessimistic locks — small team, conflicts rare).

### How it's built
- New edge function `generate-story` (`supabase/functions/generate-story/index.ts`).
  - Validates JWT + org membership in code (`verify_jwt = false` per project convention).
  - Inputs: `{ kind: "match" | "player" | "season", id, audience: "coach" | "player", scope: "full" | "chapter", chapterIndex?, guidance? }`.
  - Server-side it pulls already-aggregated stats (no raw event dump) — shot/xG totals, pass success by third, set-piece retention, possession losses by zone, phase outcomes. Keeps the prompt small and deterministic.
  - Built with the **AI SDK** + Lovable AI Gateway (`@ai-sdk/openai-compatible`) using `generateText` with `Output.object` so the response is a strictly-typed JSON object — never free-form text the client has to parse.
  - Default model: `google/gemini-3-flash-preview`. Player stories: `openai/gpt-5-mini` (tone-sensitive).
  - Returns:
    ```json
    {
      "headline": "...",
      "chapters": [
        { "id": "uuid", "title": "What happened", "body": "...", "chartHint": "match_event_stats", "actions": [] },
        { "id": "uuid", "title": "Why it happened", "body": "...", "chartHint": "zones_of_control", "actions": [] },
        { "id": "uuid", "title": "How to fix it",   "body": "...", "chartHint": null, "actions": ["...", "...", "..."] }
      ],
      "shareCaption": "..."
    }
    ```
  - Hard prompt rule: never invent numbers — only describe what's in the supplied stats.
- **Storage** — new tables:
  - `stories(id, organization_id, kind, subject_id, audience, status ['draft'|'published'], current_version_id, stats_hash, share_caption, created_by, updated_by, published_at, updated_at)`
  - `story_versions(id, story_id, version_number, content jsonb /* headline + chapters + share_caption */, edited_by, source ['ai'|'human'], note, created_at)`
  - Composite unique on `(kind, subject_id, audience)` so each subject/audience has one story with many versions.
- **RLS**:
  - SELECT draft: org admins/coaches/analysts only.
  - SELECT published: any org member (and the player themselves for `kind='player'` once player-account linking lands).
  - INSERT / UPDATE / version-create: admins / coaches / analysts of the org.
- **Caching**: `stats_hash` tracks the underlying stats snapshot. If stats change after publish, the UI shows a "stats updated — consider regenerating" banner; it never silently overwrites the published version.
- **Frontend pieces**:
  - `StoryView` — render-only mode used by coach/player audiences.
  - `StoryEditor` — wraps `StoryView` in inline editable fields, chapter drag-and-drop, chart picker, autosave, regenerate buttons.
  - `StoryVersionHistory` — side panel listing versions with author + time + restore button.
  - Rich-text: TipTap (lightweight, ESM, fits the stack) with a constrained toolbar (bold, italic, bullet/ordered list, link).
- Story Mode integrates with Pillar 1: each chapter has its own Share button that exports the chapter's chart + headline + caption.

---

## Pillar 3 — Analyst Insight Workbench

### What the user gets
A new analyst-only screen at `/org/:orgSlug/insights` that helps the analyst find patterns instead of clicking through 30 dashboards:

- **Anomaly feed** — auto-generated list of "things worth looking at" across the season:
  - players with a sudden drop/spike vs their season baseline
  - matches with unusually high possession loss in a specific zone
  - set-piece routines under a retention threshold
  - opposition penalty-area entries above a threshold
  - phases that broke down at the same pitch zone repeatedly
- **Trend explorer** — pick any metric × any dimension (player / opposition / venue / half / season window); plot with rolling averages and flagged outliers.
- **Pattern board** — pin findings as cards; each pinned card can be promoted into a Story (Pillar 2) or exported as a shareable image (Pillar 1).
- **Compare lens** — pick 2 matches or 2 players side-by-side; AI returns a short delta narrative (also editable, same editor as stories).

### How it's built
- Anomaly detection runs client-side on already-fetched aggregates: z-score / rolling-median deviation on per-match player metrics + zone-based thresholds for set pieces and possession losses.
- Trend explorer reuses `usePlayerStats`, `useMatchVisualizationData`, `useSetPieceAnalytics`; new utility `computeTrend(metric, series)` adds smoothing + outlier flags.
- Pattern board persistence: new `insight_pins` table `{ id, organization_id, created_by, kind, payload jsonb, note }`. RLS: org analysts/admins/coaches.
- "Generate story from this pattern" calls `generate-story` with `kind: 'pattern'` and lands the user directly inside the `StoryEditor` with the draft pre-loaded.

---

## User flows

```text
Analyst opens a match
  ├─► clicks Generate draft → AI writes v1
  ├─► tweaks headline, rewrites "How to fix it", swaps Chapter 2 chart
  ├─► clicks Publish
  └─► v2 appears in version history; coach is now seeing the polished story

Coach opens the same match
  └─► sees published Story tab → reads narrative → taps Share on a chapter
       └─► branded PNG ready for the club's WhatsApp group

Player opens their profile
  └─► sees their published Story → one strength, one focus, one drill → shares their highlight card

Analyst opens /insights
  └─► scans anomaly feed → pins 3 patterns → promotes the most interesting
       into a coach-facing Story, edits, publishes, exports 3 social cards
```

---

## Phased rollout

1. **Phase 1 — Shareable cards (Pillar 1)**: `ShareableCard` component, 3 templates, Share dialog wired into `MatchDetail` and `PlayerProfile`. Manual captions only.
2. **Phase 2 — Editable Story Mode (Pillar 2)**:
   - 2a: `generate-story` edge function + `stories`/`story_versions` tables + read-only `StoryView` on `MatchDetail` (coach audience).
   - 2b: `StoryEditor` with inline edit, autosave, chapter add/remove/reorder, chart picker, share-caption edit.
   - 2c: Regenerate-this-chapter, full-story regenerate, version history + restore, draft/publish workflow.
   - 2d: Player audience on `PlayerProfile`. AI captions feed back into Phase 1.
3. **Phase 3 — Analyst Insight Workbench (Pillar 3)**: `/insights` route, anomaly feed, trend explorer, `insight_pins` table + pattern board, "promote to story" / "export as card" actions.

Each phase ships standalone value; Phase 2 strengthens Phase 1, Phase 3 builds on both.

---

## Technical details (one place)

- **New dependencies**: `html-to-image` (image export), `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link` (rich-text editor), `@dnd-kit/core` (chapter reorder), `ai` + `@ai-sdk/openai-compatible` + `zod` (edge function).
- **New edge function**: `generate-story` — AI SDK + Lovable AI Gateway, in-code JWT verification, org-membership check, Zod-validated input, `Output.object` structured response, no stack traces in errors.
- **New tables**:
  - `stories(id, organization_id, kind, subject_id, audience, status, current_version_id, stats_hash, share_caption, created_by, updated_by, published_at, updated_at)` — unique on `(kind, subject_id, audience)`.
  - `story_versions(id, story_id, version_number, content jsonb, edited_by, source, note, created_at)`.
  - `insight_pins(id, organization_id, created_by, kind, payload jsonb, note, created_at)`.
  - All with RLS scoped by `organization_id` via `is_org_admin` / `is_org_member` + role checks.
- **AI models**: `google/gemini-3-flash-preview` default; `openai/gpt-5-mini` for player-tone stories. All via Lovable AI Gateway, no extra keys.
- **Branding**: pull `organizations.primary_color`, `accent_color`, `logo_url` for cards and story headers.
- **Permissioning**: drafts and the editor are admin/coach/analyst-only. Published stories are visible to org members (and to the player themselves once player-account linking lands).
- **Performance**: published versions are cached by `stats_hash`; reopens are instant; "stats updated" banner appears only when underlying numbers change post-publish.

---

## Out of scope (call out)

- Player-to-user linking (so individual players see only their own published story) — separate plan.
- Video clip integration alongside stories — separate plan.
- Real-time collaborative editing (multi-cursor) — soft-lock indicator only for now.
- Push notifications when a new story is published — can reuse existing PWA push infra later.
