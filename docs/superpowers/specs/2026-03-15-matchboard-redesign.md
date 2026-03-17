# Matchboard v1 Redesign

**Date:** 2026-03-15
**Branch:** `feature/redesign-v1`
**Scope:** Visual redesign only — no changes to API, data fetching, or business logic.

---

## Summary

Redesign the Matchboard UI with three key changes:

1. **System light/dark theme** — auto-switches with `prefers-color-scheme`
2. **2-column match card grid** — replaces the current single-column list
3. **Bottom navigation bar** — sport tabs + league pills anchored to the bottom, replacing the sticky top tabs

The spoiler toggle card is kept. All data fetching, API logic, standings/team pages, tennis/F1 views, and state management are unchanged.

---

## Color Tokens

Dark tokens stay on `:root` (default). Light tokens override via `@media (prefers-color-scheme: light)`.

### `:root` (dark — default, mostly existing values + additions)

```css
:root {
  /* Existing palette tokens — unchanged */
  --gold:   #edc951;
  --orange: #eb6841;
  --red:    #cc2a36;
  --brown:  #4f372d;
  --teal:   #00a0b0;

  /* Existing surface/text tokens — unchanged */
  --bg:              #0d0a08;
  --bg-elevated:     #140f0c;
  --bg-card:         rgba(79, 55, 45, 0.14);
  --bg-card-hover:   rgba(79, 55, 45, 0.26);
  --border:          rgba(237, 201, 81, 0.1);
  --border-active:   rgba(237, 201, 81, 0.28);
  --text:            #f5f0e8;
  --text-secondary:  #b09070;
  --text-muted:      #6b5040;
  --live:            var(--red);
  --live-glow:       rgba(204, 42, 54, 0.3);
  --radius:          12px;
  --radius-sm:       8px;
  --shadow:          0 4px 24px rgba(0, 0, 0, 0.5);
  --transition:      0.18s ease;

  /* NEW tokens */
  --bg-bottom:       #110d0a;
  --shadow-card:     none;
  --accent:          #edc951;
  --accent-text:     #1a1208;

  /* Spoiler card tokens (replaces inline hex values) */
  --spoiler-off-bg:      rgba(235, 171, 37, 0.1);
  --spoiler-off-border:  rgba(235, 171, 37, 0.3);
  --spoiler-off-text:    #EBAD25;
  --spoiler-on-bg:       rgba(37, 99, 235, 0.12);
  --spoiler-on-border:   rgba(37, 99, 235, 0.25);
  --spoiler-on-text:     #93bbfd;
}
```

### `@media (prefers-color-scheme: light)` override

```css
@media (prefers-color-scheme: light) {
  :root {
    --bg:              #f5f0e8;
    --bg-elevated:     #ede8df;
    --bg-card:         #ffffff;
    --bg-card-hover:   #f8f4ee;
    --bg-bottom:       #ffffff;
    --border:          rgba(0, 0, 0, 0.07);
    --border-active:   rgba(0, 0, 0, 0.2);
    --text:            #1a1208;
    --text-secondary:  #9b8060;
    --text-muted:      #c0a880;
    --live:            #dc2626;
    --live-glow:       rgba(220, 38, 38, 0.15);
    --shadow:          0 2px 12px rgba(0, 0, 0, 0.08);
    --shadow-card:     0 1px 4px rgba(0, 0, 0, 0.08);
    --accent:          #1a1208;
    --accent-text:     #f5f0e8;

    /* Spoiler card — light */
    --spoiler-off-bg:      #fffbe6;
    --spoiler-off-border:  #f0c000;
    --spoiler-off-text:    #92660a;
    --spoiler-on-bg:       rgba(37, 99, 235, 0.07);
    --spoiler-on-border:   rgba(37, 99, 235, 0.25);
    --spoiler-on-text:     #1d4ed8;
  }
}
```

---

## Layout

### z-index stack

| Layer | z-index |
|---|---|
| `.header` | 100 (existing) |
| `.bottom-nav` | 200 |
| `.modal-overlay` / `MatchModal` | 1000 (existing, unchanged) |

Note: `.bottom-nav` uses `backdrop-filter`, which creates a new stacking context. The header must keep `z-index: 100` explicitly to paint above any scrolling content.

### Header (sticky, top)

```
activeView === 'matches'  →  [ ⚡ Matchboard ]    [ ‹ Mar 15 › ]
activeView === 'standings' →  [ ⚡ Matchboard ]    (no date nav)
activeView === 'team'      →  [ ⚡ Matchboard ]    [ ← Back ]
```

- Left: logo + wordmark (logo icon `<img>` hidden with `display:none` if viewport < 360px)
- Right slot: conditional
  - **matches view** (`activeView === 'matches'`): render `<DateNav>` inline
  - **standings/rankings view**: empty
  - **team / f1-driver / f1-constructor view**: render the existing `action` prop (back button)
- Height: 52px
- The `action` prop is kept on `Header.jsx` for back-button views. The `<DateNav>` rendering is controlled by App.jsx passing it via the existing `action` slot when in matches view — no new prop needed on Header.

**Implementation note**: In `App.jsx`, where `<Header>` is rendered, pass `action={<DateNav ... />}` when `activeView === 'matches'`, and pass the existing back-button element otherwise. `Header.jsx` itself does not change.

### Body

- `.main-content` gets `padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px))` (uses actual bottom nav content height, not a magic number; safe area handled here rather than in a fixed token)
- This padding applies to **all views** so no content is clipped behind the bottom bar
- First child of `.main-content`: spoiler toggle card (existing position unchanged)
- Then: section groups (Live / Results / Upcoming)

### Match grid

Only applied to the **matches view** for soccer and basketball. Tennis and F1 views render their own card lists and are not wrapped in `.match-grid`.

```css
.match-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (min-width: 640px) {
  .match-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 960px) {
  .match-grid { grid-template-columns: repeat(4, 1fr); }
}
```

Tennis and F1 continue to render their cards in a single-column list (unchanged). Only `MatchCard` (soccer/basketball) goes into `.match-grid`.

### Section label

```css
.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 14px 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-label .live-dot {
  width: 6px; height: 6px;
  background: var(--live);
  border-radius: 50%;
  display: inline-block;
}
```

### Bottom bar (fixed, bottom)

```css
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 200;
  background: var(--bg-bottom);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  /* Fallback for no backdrop-filter support: background stays opaque */
}

.league-strip {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border-bottom: 1px solid var(--border);
}
.league-strip::-webkit-scrollbar { display: none; }

/* Hidden when sport has only 1 league */
.league-strip.hidden { display: none; }

.league-pill {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  white-space: nowrap;
}
.league-pill.active {
  background: var(--accent);
  color: var(--accent-text);
  border-color: var(--accent);
}

.sport-tabs {
  display: flex;
  padding: 0 8px;
}
.sport-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px 6px;
  gap: 3px;
  cursor: pointer;
  position: relative;
}
.sport-tab-icon { font-size: 20px; line-height: 1; }
.sport-tab-name { font-size: 9px; font-weight: 500; color: var(--text-muted); }
.sport-tab.active .sport-tab-name { color: var(--accent); font-weight: 700; }
.sport-tab.active::before {
  content: '';
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: 28px; height: 2px;
  background: var(--accent);
  border-radius: 0 0 2px 2px;
}
```

**League pills — which sports show them:**

| Sport | Leagues | Pill strip |
|---|---|---|
| Soccer | 12+ leagues | Shown (All + league pills) |
| Basketball (NBA) | 1 league | Hidden |
| Tennis | ATP + WTA | Shown (acts as the tour toggle) |
| F1 | 1 league | Hidden |

The `leagues` prop passed to `BottomNav` is the array returned by `getSport(activeSport).leagues` (from `sports.js`). The strip is hidden when `leagues.length <= 1`.

**Tennis tour toggle — state unification:**

Currently App.jsx has two separate tennis-tour state variables:
- `activeLeague` — drives the tennis **matches** view (ATP/WTA scoreboard)
- `activeTennisRankingsTab` — drives the **rankings** view (TennisRankings component)

In the redesign, the bottom-nav ATP/WTA league pills replace both. **`activeTennisRankingsTab` is removed.** `TennisRankings` is updated to receive `activeLeague` as its tour prop instead of `activeTennisRankingsTab`. The bottom-nav pills always update `activeLeague`, and both matches and rankings views read from it. This also applies to the rankings view toggle button that currently exists inside or above `TennisRankings` — it is removed; the bottom nav pills serve that function.

---

## Components to Change

### `App.css`
- Add new tokens to `:root`
- Add `@media (prefers-color-scheme: light)` block
- Add `.bottom-nav`, `.league-strip`, `.league-pill`, `.sport-tabs`, `.sport-tab` styles (as above)
- Add `.match-grid` with responsive breakpoints
- Add `.section-label` with `.live-dot`
- Update `.main-content` `padding-bottom` to `calc(88px + env(safe-area-inset-bottom, 0px))`
- Remove `.sport-tabs-wrap`, `.sport-tabs`, `.sport-tab` (old), `.league-tabs-wrap` styles

### `Header.jsx`
- **No changes needed.** The `action` prop already renders a right-aligned slot. App.jsx will pass `<DateNav>` as the `action` value when in matches view.

### `DateNav.jsx`
- No structural/logic changes
- Remove any standalone outer padding/margin from `.date-nav` CSS in `App.css` (Header's flex layout provides alignment)

### `SportTabs.jsx`
- **Keep filename and export name** (`export default function SportTabs` → rename export to `BottomNav` is NOT needed — keep as `SportTabs` to avoid any import confusion)
- Replace the entire render: instead of pill strip, render the bottom nav structure (`.bottom-nav` > `.league-strip` > `.sport-tabs`)
- New props: `activeSport`, `onSportChange`, `activeLeague`, `onLeagueChange`, `leagues`
- Note: existing props were `activeSport` and `onChange` — `App.jsx` needs to update the call site to pass the additional props

### `LeagueTabs.jsx`
- Remove `<LeagueTabs>` from `App.jsx` render and remove its import
- Keep the file (do not delete)

### `MatchCard.jsx`
- Verify whether stacked layout (team names on separate lines, score below) can be achieved with CSS alone by reading the current component's DOM structure
- If the current structure has both teams in a single flex row, a small JSX restructure will be needed (each team on its own line, score row at the bottom)
- All existing props, event handlers, and logic untouched

### `App.jsx`
- Pass `action={<DateNav date={date} onPrev={...} onNext={...} />}` to `<Header>` when `activeView === 'matches'`; pass back button element otherwise (existing behaviour)
- Remove `<LeagueTabs>` and its import
- Update `<SportTabs>` call site to pass new props: `activeLeague`, `onLeagueChange`, `leagues`
- Wrap `MatchCard` renders in `<div className="match-grid">` (soccer + basketball matches views only)
- Add `<div className="section-label">` before each non-empty live/results/upcoming group

---

## What Does NOT Change

- `api/` serverless functions
- `src/api.js`, `src/sports.js`
- `Standings.jsx`, `TeamPage.jsx`, `TennisRankings.jsx`, `F1Standings.jsx`, `NBAStandings.jsx`
- `F1DriverPage.jsx`, `F1ConstructorPage.jsx`
- `MatchModal.jsx` (z-index 1000, unchanged)
- `TennisCard.jsx`, `F1Card.jsx` — these render in a plain list, not in `.match-grid`; no changes needed
- All state, caching, view routing in `App.jsx`
- PWA manifest, icons, meta tags

---

## Branch & Delivery

- Branch: `feature/redesign-v1`
- User reviews on `localhost:5174` and handles final `git push && vercel --prod`
