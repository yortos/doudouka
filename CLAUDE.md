# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development (two terminals required)
vercel dev --listen 3000   # Terminal 1 — Vercel API server
npm run dev                 # Terminal 2 — Vite frontend (open localhost:5174)

# Production build
npm run build

# Deploy
vercel --prod
```

**Important:** Open `localhost:5174` (Vite), not `localhost:3000` (Vercel dev serving a stale built frontend).

The Vite proxy needs `.env.local` (gitignored):
```
API_PROXY_TARGET=http://localhost:3000
```
Without it, Vite proxies `/api` requests to production.

## Architecture Overview

**Matchboard** is a personal sports livescore PWA. React 18 + Vite frontend, deployed to Vercel. No routing library — view state is managed manually via `activeView` in `App.jsx`.

### Request Flow

```
Browser → Vite proxy (/api/*) → Vercel serverless functions (api/) → ESPN public APIs
```

Vercel serverless functions are in `api/`. They fetch from ESPN, parse the response, and return clean JSON. The client (`src/api.js`) calls these endpoints and rehydrates ISO date strings into `Date` objects.

### Server-side layer (`api/`)

- `api/_espn.js` — all ESPN fetch + parse logic (shared across endpoints)
- `api/scoreboard.js` — `/api/scoreboard?sport=&league=&date=YYYYMMDD`
- `api/standings.js` — `/api/standings?sport=&league=`
- `api/summary.js` — `/api/summary?league=&event=` (soccer match details)
- `api/_db.js` — Supabase stub (caching removed; `supabase = null`)

`formatDate` in `api/_espn.js` uses `getUTC*` methods — critical to avoid off-by-one date errors on non-UTC Vercel servers.

### Client-side layer (`src/`)

- `src/api.js` — all fetch functions; team schedule still calls ESPN directly
- `src/sports.js` — source of truth for all sports/leagues (IDs, colors, flags)
- `src/App.jsx` — root component with all state: `activeSport`, `activeView`, `activeLeague`, `selectedDate`, caches for matches/standings/rankings
- `src/App.css` — all styles (CSS custom properties, dark theme)

### Sports & Views

`activeSport` controls which data is shown: `'soccer'` | `'basketball'` | `'tennis'` | `'f1'`

`activeView` controls layout:
- `'matches'` — scoreboard (all sports)
- `'standings'` — league table (soccer + f1) or rankings (tennis)
- `'team'` — team schedule (soccer only)

### Caching (in-memory, App.jsx)

- Soccer: `matchCache[${leagueId}-${dateStr}]`
- Other sports: `otherCache[${sport}-${leagueId}-${dateStr}]` or `otherCache['f1']`
- Standings: `standingsCache[leagueId]`
- Tennis rankings: `tennisRankingsCache[leagueId]`

## ESPN API Quirks

**Standings** use a different base domain:
```
site.web.api.espn.com/apis/v2/sports/...  ✓
site.api.espn.com/apis/v2/sports/...      ✗  (returns {})
```

**Team logos**: `team.logos[0].href` (array), not `team.logo`

**Score parsing** — the response shape varies by endpoint:
```js
const toScore = s => {
  if (s == null) return null
  const raw = typeof s === 'object' ? (s.value ?? s.displayValue) : s
  const n = parseInt(raw, 10)
  return isNaN(n) ? null : n
}
```

**Status path** varies — always use:
```js
const status = event.status?.type || comp.status?.type || {}
```

**Tennis date filtering**: ESPN ignores the `dates=` param and returns all tournament matches. The server filters by UTC date, but late US timezone matches (e.g. 8 PM PDT = 3 AM UTC) get a "next day" UTC date. To respect the user's local timezone, `fetchTennisScoreboard` in `api/_espn.js` does an additional client-aware filter.

**Match summary** (goal scorers / cards): use `details[].participants[].athlete.displayName`, not `athletesInvolved`.

## Git Workflow

- Branch per fix: `fix/description` or `feature/description`
- Commit on branch → merge to main → delete branch → `vercel --prod`
- Never develop directly on main
- User handles the final `git push && vercel --prod` themselves after reviewing
