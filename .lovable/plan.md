

## HTML Report Download Feature

### Overview
Add download buttons on Match Detail, Player Profile, and Seasons pages that generate styled HTML report files. Only visible to authenticated Coach, Analyst, or Admin users.

### Approach
Create a shared utility that captures page data and generates a self-contained HTML file (inline CSS, no external dependencies) that can be opened in any browser or printed to PDF.

### Implementation Steps

**1. Create report generation utility** (`src/utils/generateReport.ts`)
- A function that takes a title, metadata object, and an array of sections (each with heading + HTML content)
- Generates a complete, styled HTML document string with inline Tailwind-like CSS
- Includes club branding (colors, header)
- Triggers browser download via `Blob` + temporary anchor element

**2. Create report builder functions** (`src/utils/reports/`)
- `matchReport.ts` — builds HTML sections from match data: score header, team stats comparison table, player performances (sorted by contribution), xG stats, set piece summary
- `playerReport.ts` — builds HTML sections from player stats: bio/profile, per-match stats table, efficiency metrics, pass stats, defensive stats, trends
- `seasonReport.ts` — builds HTML from season analytics: KPIs (W/D/L, points, goal diff), match results list, top scorers/passers/defenders leaderboards

**3. Create a `DownloadReportButton` component**
- Accepts `reportType`, relevant data props, and a generate function
- Shows a `Download` icon button, visible only when `isAdmin || isCoach` (from `useAuth`)
- On click, calls the appropriate report builder and triggers download

**4. Add buttons to pages**
- **Match Detail** (`src/pages/MatchDetail.tsx`): Add download button next to the "Back to Matches" button, passing match data, players, xG stats
- **Player Profile** (`src/pages/PlayerProfile.tsx`): Add download button in the header area, passing aggregated player stats
- **Seasons** (`src/pages/Seasons.tsx`): Add download button per season card, passing season analytics data

### Access Control
- Buttons are client-side gated: only rendered when `useAuth()` returns `isAdmin`, `isCoach`, or analyst role
- No new database tables or RLS changes needed — reports use already-fetched read-only data

### Report Format
Self-contained HTML files with:
- Inline CSS (print-friendly)
- Club header with match/player/season context
- Stat tables with alternating row colors
- Generated timestamp footer
- File naming: `match-report-{date}-{teams}.html`, `player-report-{name}.html`, `season-report-{name}.html`

