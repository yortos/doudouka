# Matchboard v1 Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Matchboard's UI with light/dark system theme, a 2-column match card grid, and a bottom navigation bar (sport tabs + league pills), while leaving all API/data logic untouched.

**Architecture:** CSS custom properties handle theming via `prefers-color-scheme`; `SportTabs.jsx` is repurposed as the bottom nav component; `MatchCard` gets a vertical stacked layout; `DateNav` moves into the Header via the `action` prop; `activeTennisRankingsTab` is removed and replaced by `activeLeague`.

**Tech Stack:** React 18, Vite, CSS custom properties, no external UI libraries.

---

## Chunk 1: Branch + CSS Tokens + Theme

### Task 1: Create the feature branch

**Files:**
- No file changes — git only.

- [ ] **Step 1: Create and switch to branch**

```bash
git checkout -b feature/redesign-v1
```

Expected: you are now on `feature/redesign-v1`.

- [ ] **Step 2: Verify**

```bash
git branch --show-current
```

Expected output: `feature/redesign-v1`

---

### Task 2: Add new CSS tokens + light/dark theme to App.css

**Files:**
- Modify: `src/App.css` (`:root` block, lines 4–27)

The existing `:root` block only has dark values. We extend it with new tokens and add a `@media (prefers-color-scheme: light)` override block.

- [ ] **Step 1: Replace the entire `:root` block in `src/App.css`** (the block starting at line 4 ending at line 27) with:

```css
:root {
  /* Palette */
  --gold:   #edc951;
  --orange: #eb6841;
  --red:    #cc2a36;
  --brown:  #4f372d;
  --teal:   #00a0b0;

  /* Dark surfaces (default) */
  --bg:              #0d0a08;
  --bg-elevated:     #140f0c;
  --bg-card:         rgba(79, 55, 45, 0.14);
  --bg-card-hover:   rgba(79, 55, 45, 0.26);
  --bg-bottom:       #110d0a;
  --border:          rgba(237, 201, 81, 0.1);
  --border-active:   rgba(237, 201, 81, 0.28);
  --text:            #f5f0e8;
  --text-secondary:  #b09070;
  --text-muted:      #6b5040;
  --live:            var(--red);
  --live-glow:       rgba(204, 42, 54, 0.3);
  --accent:          #edc951;
  --accent-text:     #1a1208;
  --shadow-card:     none;
  --radius:          12px;
  --radius-sm:       8px;
  --shadow:          0 4px 24px rgba(0, 0, 0, 0.5);
  --transition:      0.18s ease;

  /* Spoiler card */
  --spoiler-off-bg:      rgba(235, 171, 37, 0.1);
  --spoiler-off-border:  rgba(235, 171, 37, 0.3);
  --spoiler-off-text:    #EBAD25;
  --spoiler-on-bg:       rgba(37, 99, 235, 0.12);
  --spoiler-on-border:   rgba(37, 99, 235, 0.25);
  --spoiler-on-text:     #93bbfd;
}

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
    --accent:          #1a1208;
    --accent-text:     #f5f0e8;
    --shadow:          0 2px 12px rgba(0, 0, 0, 0.08);
    --shadow-card:     0 1px 4px rgba(0, 0, 0, 0.08);

    --spoiler-off-bg:      #fffbe6;
    --spoiler-off-border:  #f0c000;
    --spoiler-off-text:    #92660a;
    --spoiler-on-bg:       rgba(37, 99, 235, 0.07);
    --spoiler-on-border:   rgba(37, 99, 235, 0.25);
    --spoiler-on-text:     #1d4ed8;
  }
}
```

- [ ] **Step 2: Update `.main-content` bottom padding**

Find the `.main-content` rule and update `padding`:

```css
.main-content {
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 0 16px calc(88px + env(safe-area-inset-bottom, 0px));
}
```

- [ ] **Step 3: Update the spoiler card CSS to use the new tokens**

Find the `.ns-card` rules (around line 1610) and replace the entire block:

```css
/* ─── No Spoilers Card ───────────────────────────────────────────────────────── */
.ns-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  max-width: 960px;
  width: calc(100% - 32px);
  margin: 0 auto 4px;
  border-radius: 14px;
  border: 1.5px solid var(--spoiler-off-border);
  background: var(--spoiler-off-bg);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.25s ease, background 0.25s ease;
}

.ns-card.on {
  border-color: var(--spoiler-on-border);
  background: var(--spoiler-on-bg);
}

.ns-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ns-card-title {
  font-size: 15px;
  font-weight: 700;
}

.ns-card-title.off {
  color: var(--spoiler-off-text);
}

.ns-card-title.on {
  color: var(--spoiler-on-text);
}

.ns-card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}
```

- [ ] **Step 4: Verify visually** — open the browser, toggle device to light mode (System Preferences → Appearance → Light). Background should shift to warm cream `#f5f0e8`. Spoiler card should show amber border in the off state and blue in the on state in both themes.

- [ ] **Step 5: Commit**

```bash
git add src/App.css
git commit -m "feat: add light/dark CSS tokens and prefers-color-scheme theme"
```

---

## Chunk 2: sports.js + Bottom Navigation Bar

### Task 3: Update `sports.js` to add ATP/WTA leagues and fix tennis defaultLeague

**Files:**
- Modify: `src/sports.js` — tennis sport definition

Currently the tennis sport definition has `leagues: []` and `defaultLeague: 'combined'`. The bottom nav needs actual league objects to render ATP/WTA pills. The `'combined'` default league must change to `'atp'` so that when the user switches to tennis, `activeLeague` is `'atp'` (a valid cache key for tennis rankings and scoreboard).

The `loadOtherSport` function in `App.jsx` already handles fetching a single tour when `leagueId` is `'atp'` or `'wta'` — the `'combined'` fetch path will simply no longer be triggered.

- [ ] **Step 1: Update the tennis sport definition in `src/sports.js`**

Find the tennis entry in `SPORTS` (around line 176):

```js
{
  id: 'tennis',
  name: 'Tennis',
  icon: '\uD83C\uDFBE',
  espnSport: 'tennis',
  defaultLeague: 'combined',
  leagues: [],
  hasStandings: false,
  hasTeamPage: false,
  hasDateNav: true,
},
```

Replace with:

```js
{
  id: 'tennis',
  name: 'Tennis',
  icon: '\uD83C\uDFBE',
  espnSport: 'tennis',
  defaultLeague: 'atp',
  leagues: [ATP_LEAGUE, WTA_LEAGUE],
  hasStandings: false,
  hasTeamPage: false,
  hasDateNav: true,
},
```

`ATP_LEAGUE` and `WTA_LEAGUE` are already defined in `sports.js` (lines 130–142). No new definitions needed.

- [ ] **Step 2: Verify** — open `src/sports.js` and confirm `getSport('tennis').leagues` is `[ATP_LEAGUE, WTA_LEAGUE]` and `defaultLeague` is `'atp'`.

- [ ] **Step 3: Commit**

```bash
git add src/sports.js
git commit -m "feat: add ATP/WTA to tennis leagues array, change defaultLeague to atp"
```

---

### Task 4: Replace SportTabs.jsx with BottomNav

**Files:**
- Modify: `src/components/SportTabs.jsx` (full replacement)
- Modify: `src/App.css` (add bottom nav styles, remove old sport/league tab styles)
- Modify: `src/App.jsx` (update SportTabs props, remove LeagueTabs)

The file stays named `SportTabs.jsx` to avoid import churn.

- [ ] **Step 1: Replace the entire contents of `src/components/SportTabs.jsx`:**

```jsx
import { SPORTS } from '../sports.js'

export default function SportTabs({
  activeSport,
  onSportChange,
  activeLeague,
  onLeagueChange,
  leagues,
}) {
  const showLeagues = leagues && leagues.length > 1

  return (
    <nav className="bottom-nav" aria-label="Sport and league navigation">
      {showLeagues && (
        <div className="league-strip" role="tablist" aria-label="Leagues">
          {leagues.map(league => (
            <button
              key={league.id}
              role="tab"
              aria-selected={activeLeague === league.id}
              className={`league-pill${activeLeague === league.id ? ' active' : ''}`}
              onClick={() => onLeagueChange(league.id)}
            >
              {league.flag && <span>{league.flag}</span>} {league.shortName}
            </button>
          ))}
        </div>
      )}
      <div className="sport-tabs" role="tablist" aria-label="Sports">
        {SPORTS.map(sport => (
          <button
            key={sport.id}
            role="tab"
            aria-selected={activeSport === sport.id}
            className={`sport-tab${activeSport === sport.id ? ' active' : ''}`}
            onClick={() => onSportChange(sport.id)}
          >
            <span className="sport-tab-icon">{sport.icon}</span>
            <span className="sport-tab-name">{sport.name}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Replace sport/league tab CSS in `src/App.css`**

Find and **delete** the following CSS rule blocks entirely:
- `.sport-tabs-wrap` and `.sport-tabs-wrap::-webkit-scrollbar`
- `.sport-tabs`
- `.sport-tab`, `.sport-tab:hover`, `.sport-tab.active`, `.sport-tab-icon`
- `.league-tabs-wrap` and `.league-tabs-wrap::-webkit-scrollbar`
- `.league-tabs`, `.league-tabs-cups`, `.league-tabs-european`
- `.league-tab`, `.league-tab:hover`, `.league-tab.active`, `.league-tab-flag`, `.league-tab-divider`

Then add the bottom nav styles in their place:

```css
/* ─── Bottom Navigation ─────────────────────────────────────────────────────── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--bg-bottom);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
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

.league-pill {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  background: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition), color var(--transition);
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
  background: none;
  border: none;
  position: relative;
}
.sport-tab-icon { font-size: 20px; line-height: 1; }
.sport-tab-name {
  font-size: 9px;
  font-weight: 500;
  color: var(--text-muted);
}
.sport-tab.active .sport-tab-name {
  color: var(--accent);
  font-weight: 700;
}
.sport-tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 2px;
  background: var(--accent);
  border-radius: 0 0 2px 2px;
}
```

- [ ] **Step 3: Update `App.jsx` to pass new props to `<SportTabs>`**

Find the `<SportTabs>` usage (search for `<SportTabs`) and replace:

```jsx
<SportTabs
  activeSport={activeSport}
  onSportChange={handleSportChange}
  activeLeague={activeLeague}
  onLeagueChange={id => { setActiveLeague(id); setActiveView('matches') }}
  leagues={sportDef?.leagues}
/>
```

- [ ] **Step 4: Remove `<LeagueTabs>` from `App.jsx`**

Delete the `<LeagueTabs ... />` JSX block (search for `<LeagueTabs`) and its import line (`import LeagueTabs from './components/LeagueTabs.jsx'`). Do not delete the `LeagueTabs.jsx` file itself.

- [ ] **Step 5: Verify** — browser shows the bottom bar with sport tabs. Switching sport changes the active tab. Soccer shows league pills (All, PL, LaLiga…). Tennis shows ATP / WTA pills. NBA shows no pills. F1 shows no pills.

- [ ] **Step 6: Commit**

```bash
git add src/components/SportTabs.jsx src/App.css src/App.jsx
git commit -m "feat: replace top sport/league tabs with bottom navigation bar"
```

---

## Chunk 3: Header with Inline DateNav

### Task 5: Move DateNav into the Header

**Files:**
- Modify: `src/App.jsx` — pass `<DateNav>` as `action` prop; remove standalone DateNav
- Modify: `src/App.css` — strip `.date-nav` standalone margin

`Header.jsx` and `DateNav.jsx` are unchanged. The `Header` already has an `action` prop that renders right-aligned.

- [ ] **Step 1: Update the `<Header>` usage in `App.jsx`**

Find `<Header />` (search for `<Header`) and replace with:

```jsx
<Header
  action={
    activeView === 'matches' && sportDef?.hasDateNav
      ? <DateNav date={date} onChange={setDate} />
      : undefined
  }
/>
```

- [ ] **Step 2: Remove the standalone `<DateNav>` from the view-toggle row in `App.jsx`**

Find and delete this block (search for `activeView === 'matches' && sportDef?.hasDateNav`):
```jsx
{activeView === 'matches' && sportDef?.hasDateNav && (
  <DateNav date={date} onChange={setDate} />
)}
```

The `DateNav` is now only rendered inside the `Header` action slot.

- [ ] **Step 3: Strip the standalone margin from `.date-nav` in `App.css`**

Find the `.date-nav` rule and update:

```css
.date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
```

Shrink the label min-width so it fits in the header:
```css
.date-nav-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  min-width: 80px;
  text-align: center;
}
```

- [ ] **Step 4: Verify date nav** — header shows `‹ Today ›` date picker on the right when in matches view. Pressing arrows changes the date. Switching to standings view hides the date picker. F1 (no date nav) shows no date picker.

- [ ] **Step 5: Verify back button** — navigate to a team page (click a team logo on a match card). Confirm the header shows the back button (`← Matches` or `← Standings`) correctly in the right slot. The `action` prop for the back button is passed by `TeamPage` via the existing mechanism — confirm it still renders and clicking it navigates back.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: move DateNav inline into header for matches view"
```

---

## Chunk 4: 2-Column Match Grid + MatchCard Layout

### Task 6: Redesign MatchCard for vertical grid layout

**Files:**
- Modify: `src/components/MatchCard.jsx` — restructure JSX for stacked card layout
- Modify: `src/App.css` — add `.match-grid`, update `.match-card` styles

The current `MatchCard` renders home team | score | away team horizontally in `.match-body`. The new layout stacks team names vertically and puts the score at the bottom:

```
[ League badge ]  [ time ]
Home Team Name (logo)
Away Team Name (logo)
[ Score ]  [ Status badge ]
```

Note: `match.sport` is set by the API parsing layer (used by `StatusBadge` to differentiate basketball quarters from soccer minutes). This field is already on the match object in the existing code — do not add a `sport` prop to `MatchCard`.

- [ ] **Step 1: Replace the entire `return` in `src/components/MatchCard.jsx`** (the `return (` starting at line 82 through the closing `)`):

```jsx
return (
  <div
    className="match-card"
    style={{
      '--league-color': league?.primaryColor,
      '--league-accent': league?.accentColor,
    }}
    onClick={onClick}
  >
    {/* Card top row: league badge + time */}
    <div className="match-card-header">
      {league && league.id !== 'all' && (
        <span className="match-league-badge">{league.flag} {league.shortName}</span>
      )}
      {match.legLabel && (
        <span className="leg-badge">{match.legLabel}</span>
      )}
      <span className="match-time">{formatKickoff(match.date)}</span>
    </div>

    {/* Teams stacked */}
    <div className="match-teams">
      <div className="match-team-row">
        <TeamLogo
          logo={match.home.logo}
          shortName={match.home.shortName}
          size={20}
          onClick={onTeamClick ? () => onTeamClick(match.home) : null}
        />
        <span className="team-name">{match.home.shortName || match.home.name}</span>
      </div>
      <div className="match-team-row">
        <TeamLogo
          logo={match.away.logo}
          shortName={match.away.shortName}
          size={20}
          onClick={onTeamClick ? () => onTeamClick(match.away) : null}
        />
        <span className="team-name">{match.away.shortName || match.away.name}</span>
      </div>
    </div>

    {/* Score + status row */}
    <div
      className="match-score-wrap"
      onClick={noSpoilers && hasScore ? handleScoreTap : undefined}
      style={noSpoilers && hasScore && !revealed ? { cursor: 'pointer' } : undefined}
    >
      <div className="match-score">
        {hasScore ? (
          <>
            <span className={`score-number${(noSpoilers && !revealed) ? ' spoiler-blur' : ''}`}>{match.home.score}</span>
            <span className={`score-sep${(noSpoilers && !revealed) ? ' spoiler-blur' : ''}`}>&ndash;</span>
            <span className={`score-number${(noSpoilers && !revealed) ? ' spoiler-blur' : ''}`}>{match.away.score}</span>
          </>
        ) : (
          <span className="score-vs">
            {match.statusState === 'pre' ? formatKickoff(match.date) : 'vs'}
          </span>
        )}
      </div>
      <StatusBadge
        state={match.statusState}
        name={match.statusName}
        detail={match.statusDetail}
        displayClock={match.displayClock}
        period={match.period}
        sport={match.sport}
      />
      {noSpoilers && hasScore && !revealed && (
        <span className="score-reveal-hint">double tap</span>
      )}
      {match.leg === 2 && match.aggregate && (
        <span className="agg-score">
          Agg: {match.aggregate.home}–{match.aggregate.away}
        </span>
      )}
    </div>
  </div>
)
```

The broadcasts/venue footer is intentionally removed — it doesn't fit the compact card.

- [ ] **Step 2: Add match grid + updated card CSS to `src/App.css`**

Add the `.match-grid` rule. Also replace the existing `.match-card`, `.match-card-header`, `.match-body`, `.match-team`, `.match-score-wrap`, `.match-score`, `.score-number`, `.score-sep`, `.score-vs`, `.status-badge` rules with the new versions:

```css
/* ─── Match Grid ────────────────────────────────────────────────────────────── */
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

.match-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: background var(--transition);
}
.match-card:hover { background: var(--bg-card-hover); }

.match-card-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.match-league-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.match-time {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: auto;
}

.match-teams {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.match-team-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.match-team-row .team-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-score-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.match-score {
  display: flex;
  align-items: center;
  gap: 3px;
}
.score-number {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.score-sep {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 400;
}
.score-vs {
  font-size: 11px;
  color: var(--text-muted);
}
.score-reveal-hint {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: auto;
}
.agg-score {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: auto;
}

.status-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
}
.status-badge.live {
  background: var(--live);
  color: #fff;
}
.status-badge.finished {
  color: var(--text-muted);
  border: 1px solid var(--border);
}
```

- [ ] **Step 3: Wrap soccer/basketball `MatchCard` renders in `App.jsx` with `.match-grid`**

Find the soccer + basketball match rendering block (search for `{/* Soccer + NBA: standard match cards */}`). Replace the three `<div className="match-list">` wrappers (one each for live, upcoming, results) with `<div className="match-grid">`:

```jsx
{/* Soccer + NBA: standard match cards */}
{(isSoccer || activeSport === 'basketball') && (
  <>
    {live.length > 0 && (
      <>
        <div className="section-label"><span className="live-dot" /> Live Now</div>
        <div className="match-grid">
          {live.map(m => (
            <MatchCard key={m.id} match={m} noSpoilers={noSpoilers}
              onClick={() => setSelectedMatch(m)}
              onTeamClick={isSoccer ? (team) => handleTeamClick(team, m.leagueId, 'matches') : null}
            />
          ))}
        </div>
      </>
    )}
    {upcoming.length > 0 && (
      <>
        <div className="section-label">Upcoming</div>
        <div className="match-grid">
          {upcoming.map(m => (
            <MatchCard key={m.id} match={m} noSpoilers={noSpoilers}
              onClick={() => setSelectedMatch(m)}
              onTeamClick={isSoccer ? (team) => handleTeamClick(team, m.leagueId, 'matches') : null}
            />
          ))}
        </div>
      </>
    )}
    {finished.length > 0 && (
      <>
        <div className="section-label">Results</div>
        <div className="match-grid">
          {finished.map(m => (
            <MatchCard key={m.id} match={m} noSpoilers={noSpoilers}
              onClick={() => setSelectedMatch(m)}
              onTeamClick={isSoccer ? (team) => handleTeamClick(team, m.leagueId, 'matches') : null}
            />
          ))}
        </div>
      </>
    )}
  </>
)}
```

Tennis and F1 cards stay in their existing `<div className="match-list">` wrappers — do not change those.

- [ ] **Step 4: Update `.section-label` CSS in `App.css`**

Find the `.section-label` rule and replace with:

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
.live-dot {
  width: 6px;
  height: 6px;
  background: var(--live);
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
```

- [ ] **Step 5: Verify** — soccer matches render in a 2-column grid. Team logos are 20px. Team names are stacked. Score and status badge appear on the bottom row. Spoiler blur still works. Tennis and F1 remain as full-width lists.

- [ ] **Step 6: Commit**

```bash
git add src/components/MatchCard.jsx src/App.css src/App.jsx
git commit -m "feat: 2-column match card grid with stacked card layout"
```

---

## Chunk 5: Tennis State Unification

### Task 7: Remove `activeTennisRankingsTab`, drive rankings from `activeLeague`

**Files:**
- Modify: `src/App.jsx` only

Tennis matches already use `activeLeague` for `'atp'` or `'wta'` filtering. The rankings view uses a separate `activeTennisRankingsTab`. We unify them so the bottom nav pills control both.

Now that `sports.js` sets `defaultLeague: 'atp'`, switching to tennis via `handleSportChange` will set `activeLeague = 'atp'`. Switching the WTA pill sets `activeLeague = 'wta'`. The `loadOtherSport` function already handles fetching a single tour — the `leagueId === 'combined'` path will no longer be triggered.

- [ ] **Step 1: Remove `activeTennisRankingsTab` state from `App.jsx`**

Delete this line (search for `activeTennisRankingsTab`):
```js
const [activeTennisRankingsTab, setActiveTennisRankingsTab] = useState('atp')
```

- [ ] **Step 2: Update the tennis rankings `useEffect` to use `activeLeague`**

Find:
```js
if (activeView === 'standings' && activeSport === 'tennis') {
  loadTennisRankings(activeTennisRankingsTab)
}
```
Replace with:
```js
if (activeView === 'standings' && activeSport === 'tennis') {
  loadTennisRankings(activeLeague)
}
```

Update the dependency array of that `useEffect` — remove `activeTennisRankingsTab`:
```js
}, [activeView, activeLeague, activeSport]) // eslint-disable-line
```

- [ ] **Step 3: Update the Tennis Rankings render in `App.jsx`**

Find the tennis rankings JSX block (search for `{/* ── Tennis Rankings View ── */}`). Replace the entire block:

```jsx
{/* ── Tennis Rankings View ── */}
{activeView === 'standings' && activeSport === 'tennis' && (
  <TennisRankings
    entries={tennisRankingsCache[activeLeague]}
    loading={loadingTennisRankings && !tennisRankingsCache[activeLeague]}
    error={tennisRankingsError}
  />
)}
```

This removes the inline ATP/WTA toggle buttons — the bottom nav pills handle tour switching now.

- [ ] **Step 4: Verify** — switch to Tennis, tap Rankings. Shows ATP rankings. Switch to WTA via the bottom nav pill — rankings switch to WTA. No toggle buttons visible inside the rankings view.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: unify tennis tour state into activeLeague, remove activeTennisRankingsTab"
```

---

## Chunk 6: Polish + Cleanup

### Task 8: View toggle token cleanup + final smoke test

**Files:**
- Modify: `src/App.css` — update `.view-toggle` hardcoded colors to use tokens

The view toggle (Matches / Standings / Rankings buttons) stays. The `.view-toggle-btn.active` uses a hardcoded gold color — update to token so it works in light mode.

- [ ] **Step 1: Update `.view-toggle` CSS in `App.css`**

Find and replace the `.view-toggle` block:

```css
.view-toggle {
  display: flex;
  gap: 4px;
  margin: 16px 0 0;
  padding: 4px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  width: fit-content;
}
.view-toggle-btn {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
.view-toggle-btn.active {
  background: var(--bg-card-hover);
  color: var(--accent);
}
.view-toggle-btn:hover:not(.active) { color: var(--text); }
```

- [ ] **Step 2: Confirm `.match-list` CSS is still present**

Search for `.match-list` in `App.css`. It should still exist (Tennis/F1 use it). If it was accidentally removed, re-add:

```css
.match-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

- [ ] **Step 3: Final smoke test**

Open the app at `localhost:5174`. Check each item:

**Theme:**
- [ ] Light mode (System Prefs → Appearance → Light): cream `#f5f0e8` background, white cards, dark text, dark accent in bottom nav
- [ ] Dark mode: existing warm dark theme unchanged

**Bottom nav:**
- [ ] Soccer: league pills show (All, PL, LaLiga, BL…), sport tabs all visible
- [ ] Switching leagues via pills updates the match list
- [ ] NBA: no league pills visible
- [ ] Tennis: ATP / WTA pills visible, switching updates matches
- [ ] F1: no league pills visible

**Match grid:**
- [ ] Soccer: 2-column grid, stacked team names, score at bottom
- [ ] Spoiler blur: enable spoilers, scores blur, double-tap reveals
- [ ] NBA: 2-column grid works

**Header:**
- [ ] Soccer/NBA/Tennis matches view: `‹ Today ›` date picker visible right-aligned in header
- [ ] F1 matches view: no date picker in header
- [ ] Team page: back button visible in header right slot (regression check — click a team logo on a match card to navigate to team page)
- [ ] Standings view: no date picker, no back button

**Spoiler card:**
- [ ] Off state: amber border + text in both themes
- [ ] On state: blue border + text in both themes

**Other views (regression):**
- [ ] F1 standings: open, no visual breakage
- [ ] NBA standings: open, no visual breakage
- [ ] Tennis rankings: ATP rankings show, WTA pill switches to WTA rankings, no toggle buttons inside the view
- [ ] Soccer standings: select a league, standings table shows, click team → team page

**Modal:**
- [ ] Click a live/finished soccer match → modal opens, overlays the bottom nav correctly

- [ ] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "polish: update view toggle to use CSS tokens for light/dark compatibility"
```

---

## Final: Build + Ready to Review

- [ ] **Run the production build**

```bash
npm run build
```

Expected: clean build, no errors, no warnings about missing variables.

- [ ] **Check mobile viewport** — open Chrome DevTools, set to iPhone 14 Pro (393×852). Confirm bottom nav stays anchored, content doesn't clip behind it, safe area padding applies.

Once all tasks pass, branch `feature/redesign-v1` is ready to review at `localhost:5174`.
