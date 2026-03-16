# Nav Redesign v2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bottom navigation bar with a responsive system: a left sidebar with accordion on desktop (≥960px) and a taller bottom tab bar with a bottom-sheet league picker on mobile.

**Architecture:** `Sidebar.jsx` is a new fixed-left component for desktop; `SportTabs.jsx` is fully rewritten for mobile with local `openSheet` state for the league picker. Both import `SPORTS` directly. CSS media queries at 960px swap which component is visible. `App.jsx` adds `<Sidebar>` with no state changes.

**Tech Stack:** React 18, CSS custom properties (no CSS-in-JS), Vite dev server at `localhost:5174`

---

## Chunk 1: CSS — variables, bottom nav, sidebar, sheet, responsive rules

### Task 1: Update CSS custom properties and bottom nav styles

**Files:**
- Modify: `src/App.css` (`:root` block + bottom nav section, lines 1–220)

- [ ] **Step 1: Update `--bottom-nav-height` and add `--sidebar-width`**

In `src/App.css`, inside `:root { }`, change:
```css
--bottom-nav-height:  88px;
```
to:
```css
--bottom-nav-height:  72px;
--sidebar-width:      220px;
```

- [ ] **Step 2: Remove `.league-strip` and its scrollbar rule**

Delete these lines from `src/App.css` (the entire league-strip block):
```css
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
```

- [ ] **Step 3: Update sport tab sizing**

In `src/App.css`, update the existing bottom nav sport tab rules:

Change `.sport-tab` padding (was `8px 4px 6px`):
```css
.sport-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px 8px;
  gap: 3px;
  cursor: pointer;
  border: none;
  background: none;
  position: relative;
  transition: color var(--transition);
}
```

Change `.sport-tab-icon` (was `font-size: 20px`):
```css
.sport-tab-icon { font-size: 26px; line-height: 1; }
```

Change `.sport-tab-name` (was `font-size: 9px`):
```css
.sport-tab-name { font-size: 11px; font-weight: 500; color: var(--text-muted); }
```

Change `.sport-tab.active::before` indicator (was `width: 28px; height: 2px`):
```css
.sport-tab.active::before {
  content: '';
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 3px;
  background: var(--accent);
  border-radius: 0 0 2px 2px;
}
```

- [ ] **Step 4: Verify dev server still starts**

Run in a terminal: `npm run dev` (from the livescore project root).
Expected: Vite dev server starts on port 5174. Open `localhost:5174` — the app loads. The bottom bar now shows taller sport icons. The league pill strip is gone from the bottom nav. ✓

- [ ] **Step 5: Commit**

```bash
git add src/App.css
git commit -m "style: update bottom nav sizing — taller tabs, remove league strip"
```

---

### Task 2: Add sidebar CSS

**Files:**
- Modify: `src/App.css` (append after the bottom nav section, before `/* ─── View Toggle */`)

- [ ] **Step 1: Add sidebar CSS block**

Insert the following after the existing `/* ─── Bottom Navigation */` block (after line ~219, before `/* ─── View Toggle */`):

```css
/* ─── Sidebar (desktop) ─────────────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-width);
  z-index: 150;
  background: var(--bg-bottom);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
}
.sidebar::-webkit-scrollbar { display: none; }

.sidebar-sport {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  text-align: left;
  transition: background var(--transition), color var(--transition);
}
.sidebar-sport:hover { background: rgba(79, 55, 45, 0.15); color: var(--text); }
.sidebar-sport.active { background: rgba(237, 201, 81, 0.08); }
.sidebar-sport.active .sidebar-sport-name { color: var(--accent); font-weight: 700; }

.sidebar-sport-icon { font-size: 18px; flex-shrink: 0; line-height: 1; }
.sidebar-sport-name { font-size: 13px; font-weight: 500; flex: 1; }

.sidebar-chevron {
  font-size: 11px;
  color: var(--text-muted);
  transition: transform var(--transition);
  flex-shrink: 0;
}
.sidebar-chevron.expanded { transform: rotate(90deg); color: var(--accent); }

.sidebar-leagues { }

.sidebar-league {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 16px 7px 36px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-muted);
  text-align: left;
  position: relative;
  transition: color var(--transition), background var(--transition);
}
.sidebar-league:hover { color: var(--text-secondary); background: rgba(79, 55, 45, 0.1); }
.sidebar-league.active { color: var(--accent); }
.sidebar-league.active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 2px; height: 16px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.sidebar-league-flag { font-size: 12px; flex-shrink: 0; }
.sidebar-league-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sidebar-section-label {
  padding: 6px 16px 2px 36px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

/* ─── League Bottom Sheet (mobile) ──────────────────────────────────────────── */
.league-sheet {
  position: fixed;
  inset: 0;
  z-index: 300;
}

.league-sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.league-sheet-panel {
  position: absolute;
  left: 0; right: 0;
  bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
  background: var(--bg-elevated);
  border-radius: 16px 16px 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
  padding: 10px 16px 16px;
  max-height: 50vh;
  overflow-y: auto;
  scrollbar-width: none;
}
.league-sheet-panel::-webkit-scrollbar { display: none; }

.league-sheet-handle {
  width: 32px; height: 3px;
  background: var(--border-active);
  border-radius: 2px;
  margin: 0 auto 12px;
}

.league-sheet-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.league-sheet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.league-sheet-more-placeholder {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  padding: 12px 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.css
git commit -m "style: add sidebar and league bottom sheet CSS"
```

---

### Task 3: Add responsive rules and header mobile fix

**Files:**
- Modify: `src/App.css` (append at the very end of the file)

- [ ] **Step 1: Append responsive rules**

Add to the end of `src/App.css`:

```css
/* ─── Responsive — Sidebar / Bottom Nav swap ────────────────────────────────── */

/* Sidebar hidden on mobile */
@media (max-width: 959px) {
  .sidebar { display: none; }
}

/* Bottom nav and league sheet hidden on desktop */
@media (min-width: 960px) {
  .bottom-nav { display: none; }
  .league-sheet { display: none; }
}

/* Desktop: offset header and main content for sidebar */
@media (min-width: 960px) {
  .header { padding-left: var(--sidebar-width); }
  .main-content {
    margin-left: var(--sidebar-width);
    margin-right: 0;
    max-width: none;
    padding-bottom: 0;
  }
}

/* Mobile: hide static date label, keep DateNav right-aligned */
@media (max-width: 959px) {
  .header-date { display: none; }
  .header-action { margin-left: auto; }
}
```

- [ ] **Step 2: Verify header fix in browser**

In browser at `localhost:5174`, shrink the viewport to mobile width (≤959px).
Expected: The "Monday, March 16, 2026" text disappears. The DateNav arrows (‹ Today ›) remain right-aligned in the header. No layout shift. ✓

At desktop width (≥960px): the date label is visible again. ✓

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "style: responsive rules — sidebar/bottom-nav swap, mobile header date fix"
```

---

## Chunk 2: Sidebar.jsx — new desktop component

### Task 4: Create Sidebar.jsx

**Files:**
- Create: `src/components/Sidebar.jsx`

- [ ] **Step 1: Create the file**

Create `src/components/Sidebar.jsx` with:

```jsx
import { useState } from 'react'
import { SPORTS } from '../sports.js'

export default function Sidebar({ activeSport, onSportChange, activeLeague, onLeagueChange }) {
  // Track which sport accordion is open. Initialise to the active sport so its
  // leagues are visible on first render.
  const [expandedSport, setExpandedSport] = useState(activeSport)

  function handleSportClick(sport) {
    const hasLeagues = sport.leagues && sport.leagues.filter(l => !l.divider).length > 1

    if (hasLeagues) {
      // Toggle accordion; also switch sport if it wasn't already active
      const willExpand = expandedSport !== sport.id
      setExpandedSport(willExpand ? sport.id : null)
      if (sport.id !== activeSport) {
        onSportChange(sport.id)
      }
    } else {
      // No sub-leagues — direct switch, no accordion change
      if (sport.id !== activeSport) {
        onSportChange(sport.id)
      }
      // else: already active with no leagues → no-op
    }
  }

  function handleLeagueClick(sport, league) {
    if (sport.id !== activeSport) {
      onSportChange(sport.id)
    }
    onLeagueChange(league.id)
  }

  return (
    <aside className="sidebar" aria-label="Navigation">
      {SPORTS.map(sport => {
        const hasLeagues = sport.leagues && sport.leagues.filter(l => !l.divider).length > 1
        const isExpanded = expandedSport === sport.id
        const isActive = activeSport === sport.id

        return (
          <div key={sport.id}>
            <button
              className={`sidebar-sport${isActive ? ' active' : ''}`}
              onClick={() => handleSportClick(sport)}
              aria-expanded={hasLeagues ? isExpanded : undefined}
            >
              <span className="sidebar-sport-icon" aria-hidden="true">{sport.icon}</span>
              <span className="sidebar-sport-name">{sport.name}</span>
              {hasLeagues && (
                <span className={`sidebar-chevron${isExpanded ? ' expanded' : ''}`} aria-hidden="true">
                  ›
                </span>
              )}
            </button>

            {hasLeagues && isExpanded && (
              <div className="sidebar-leagues">
                {sport.leagues.map(league => {
                  if (league.divider) {
                    const label = league.id === '__divider_cups__' ? 'Cups' : 'European'
                    return (
                      <div key={league.id} className="sidebar-section-label">{label}</div>
                    )
                  }
                  const isActiveLeague = isActive && activeLeague === league.id
                  return (
                    <button
                      key={league.id}
                      className={`sidebar-league${isActiveLeague ? ' active' : ''}`}
                      onClick={() => handleLeagueClick(sport, league)}
                    >
                      {league.flag && (
                        <span className="sidebar-league-flag" aria-hidden="true">{league.flag}</span>
                      )}
                      <span className="sidebar-league-name">{league.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="sidebar-divider" />
          </div>
        )
      })}

      {/* More — placeholder for future sports */}
      <div>
        <button className="sidebar-sport" disabled style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="sidebar-sport-icon" aria-hidden="true" style={{ fontSize: '14px' }}>···</span>
          <span className="sidebar-sport-name">More</span>
          <span className="sidebar-chevron" aria-hidden="true">›</span>
        </button>
        <div className="sidebar-leagues">
          <div className="sidebar-section-label" style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
            More sports coming soon
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify the component can be imported (no syntax errors)**

In `src/App.jsx`, temporarily add at the top:
```js
import Sidebar from './components/Sidebar.jsx'
```
Check that `localhost:5174` still loads without console errors. Then remove the import (will be added properly in Task 6).

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.jsx
git commit -m "feat: add Sidebar component for desktop navigation"
```

---

## Chunk 3: SportTabs.jsx — mobile rewrite

### Task 5: Rewrite SportTabs.jsx

**Files:**
- Modify: `src/components/SportTabs.jsx` (full replacement)

- [ ] **Step 1: Replace the entire file**

Overwrite `src/components/SportTabs.jsx` with:

```jsx
import { useState } from 'react'
import { SPORTS } from '../sports.js'

export default function SportTabs({ activeSport, onSportChange, activeLeague, onLeagueChange }) {
  // null | 'leagues' | 'more'
  const [openSheet, setOpenSheet] = useState(null)

  const activeSportDef = SPORTS.find(s => s.id === activeSport)

  function sportHasLeagues(sport) {
    return sport.leagues && sport.leagues.filter(l => !l.divider).length > 1
  }

  function handleSportTabClick(sport) {
    if (sport.id === activeSport) {
      // Already active: toggle sheet if sport has sub-leagues, otherwise no-op
      if (sportHasLeagues(sport)) {
        setOpenSheet(prev => prev === 'leagues' ? null : 'leagues')
      }
      // NBA / F1 already active → no-op (do NOT call onSportChange)
    } else {
      // Switch to new sport, close any open sheet
      onSportChange(sport.id)
      setOpenSheet(null)
    }
  }

  function handleMoreTabClick() {
    setOpenSheet(prev => prev === 'more' ? null : 'more')
  }

  function closeSheet() {
    setOpenSheet(null)
  }

  function handleLeagueChipClick(leagueId) {
    onLeagueChange(leagueId)
    setOpenSheet(null)
  }

  return (
    <>
      {/* Bottom sheet overlay */}
      {openSheet && (
        <div className="league-sheet">
          <div className="league-sheet-backdrop" onClick={closeSheet} />
          <div className="league-sheet-panel">
            <div className="league-sheet-handle" />

            {openSheet === 'leagues' && activeSportDef && (
              <>
                <div className="league-sheet-label">{activeSportDef.name}</div>
                <div className="league-sheet-grid">
                  {activeSportDef.leagues.map(league => {
                    if (league.divider) {
                      const label = league.id === '__divider_cups__' ? 'Cups' : 'European'
                      return (
                        <div
                          key={league.id}
                          className="sidebar-section-label"
                          style={{ gridColumn: '1 / -1' }}
                        >
                          {label}
                        </div>
                      )
                    }
                    return (
                      <button
                        key={league.id}
                        className={`league-pill${activeLeague === league.id ? ' active' : ''}`}
                        onClick={() => handleLeagueChipClick(league.id)}
                      >
                        {league.flag && <span aria-hidden="true">{league.flag}</span>}{' '}
                        {league.shortName}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {openSheet === 'more' && (
              <>
                <div className="league-sheet-label">More</div>
                <div className="league-sheet-more-placeholder">More sports coming soon</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="bottom-nav" aria-label="Sport navigation">
        <div className="sport-tabs" role="tablist">
          {SPORTS.map(sport => (
            <button
              key={sport.id}
              role="tab"
              aria-selected={activeSport === sport.id}
              className={`sport-tab${activeSport === sport.id ? ' active' : ''}`}
              onClick={() => handleSportTabClick(sport)}
            >
              <span className="sport-tab-icon" aria-hidden="true">{sport.icon}</span>
              <span className="sport-tab-name">{sport.name}</span>
            </button>
          ))}
          <button
            className="sport-tab"
            role="tab"
            aria-selected={false}
            aria-expanded={openSheet === 'more'}
            onClick={handleMoreTabClick}
          >
            <span className="sport-tab-icon" aria-hidden="true" style={{ fontSize: '16px', lineHeight: '26px' }}>···</span>
            <span className="sport-tab-name">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Verify in browser (mobile viewport)**

Open `localhost:5174`, set browser to mobile viewport (e.g. 390px wide).
Expected:
- Bottom bar shows 5 tabs: Football · NBA · Tennis · F1 · ···More ✓
- Icons are visibly larger than before ✓
- Tap Football (already active) → bottom sheet slides up showing league grid ✓
- Sheet shows "Cups" and "European" section labels in the grid ✓
- Tap a league chip → league changes and sheet closes ✓
- Tap backdrop → sheet closes ✓
- Tap NBA tab → switches sport, no sheet ✓
- Tap NBA again (already active) → nothing happens (no-op) ✓
- Tap ··· More → sheet opens with placeholder text ✓

- [ ] **Step 3: Commit**

```bash
git add src/components/SportTabs.jsx
git commit -m "feat: rewrite SportTabs — taller mobile tabs + bottom sheet league picker"
```

---

## Chunk 4: App.jsx wiring + final verification

### Task 6: Wire Sidebar into App.jsx

**Files:**
- Modify: `src/App.jsx` (import + render + remove `leagues` prop)

- [ ] **Step 1: Add Sidebar import**

In `src/App.jsx`, add after line 3 (after the SportTabs import):
```js
import Sidebar from './components/Sidebar.jsx'
```

- [ ] **Step 2: Remove `leagues` prop from `<SportTabs>`**

Find:
```jsx
<SportTabs
  activeSport={activeSport}
  onSportChange={handleSportChange}
  activeLeague={activeLeague}
  onLeagueChange={handleLeagueChange}
  leagues={sportDef?.leagues}
/>
```

Replace with:
```jsx
<Sidebar
  activeSport={activeSport}
  onSportChange={handleSportChange}
  activeLeague={activeLeague}
  onLeagueChange={handleLeagueChange}
/>
<SportTabs
  activeSport={activeSport}
  onSportChange={handleSportChange}
  activeLeague={activeLeague}
  onLeagueChange={handleLeagueChange}
/>
```

- [ ] **Step 3: Verify in browser — desktop**

Open `localhost:5174` at desktop width (≥960px).
Expected:
- Left sidebar appears, 220px wide ✓
- Bottom bar is hidden ✓
- Header content starts at x=220px (not overlapping sidebar) ✓
- Main content cards start at x=220px ✓
- Click Football in sidebar → accordion opens showing all leagues ✓
- "Cups" and "European" section labels visible ✓
- Click a league → content updates, active league gets left accent bar ✓
- Click NBA → switches directly, no accordion ✓
- Click "More" placeholder row exists at bottom of sidebar ✓

- [ ] **Step 4: Verify in browser — mobile**

Shrink viewport to mobile (≤959px).
Expected:
- Sidebar is hidden ✓
- Bottom tab bar is visible ✓
- Header date label is hidden; DateNav arrows remain right-aligned ✓
- All mobile interactions from Task 5 still work ✓

- [ ] **Step 5: Check light mode**

In macOS System Preferences, switch to Light mode. Open `localhost:5174`.
Expected: sidebar and sheet render correctly with light theme colors. ✓

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire Sidebar into App — desktop nav complete"
```

---

### Task 7: Final cross-browser verification and cleanup

**Files:**
- No changes (verification only)

- [ ] **Step 1: Test all sport tabs on mobile**

On mobile viewport, test each sport tab:
- Football: tap → sheet opens, shows 19 league chips with Cups/European labels ✓
- Football: tap active tab again → sheet closes ✓
- Tennis: tap → sheet opens with ATP and WTA chips ✓
- NBA: tap → switches directly, no sheet ✓
- F1: tap → switches directly, no sheet ✓
- More: tap → "More sports coming soon" placeholder ✓

- [ ] **Step 2: Test sidebar on desktop for each sport**

On desktop viewport (≥960px):
- Football accordion: opens, shows all 19 leagues with section labels ✓
- Selecting a league: left accent bar appears, content updates ✓
- Tennis accordion: opens with ATP Tour / WTA Tour ✓
- NBA: single tap switches, no accordion ✓
- F1: single tap switches, no accordion ✓
- Sidebar scrolls when leagues overflow (Football list is long) ✓

- [ ] **Step 3: Test header on mobile**

On mobile (≤959px), navigate to matches view:
- Header shows: logo + DateNav arrows (right-aligned) ✓
- No squished date text ✓
- DateNav ‹ Today › works correctly ✓

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: nav redesign v2 — responsive sidebar + mobile bottom sheet complete"
```
