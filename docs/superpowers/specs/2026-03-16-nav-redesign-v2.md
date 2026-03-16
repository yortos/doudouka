# Navigation Redesign v2 — Responsive Sidebar + Bottom Sheet

**Date:** 2026-03-16
**Branch:** `feature/redesign-v1` (continues the v1 redesign)
**Scope:** Navigation only — bottom bar, desktop sidebar, league picker, header date fix. No changes to data fetching, API, state, or non-navigation views.

---

## Summary

Three problems to solve:

1. **Desktop bottom bar** feels too small/thin and non-native.
2. **Mobile league strip** is a cramped horizontal scroll — hard to use, too small.
3. **Mobile header date** gets squished when DateNav is also in the header.

Solution: responsive navigation that is a bottom tab bar on mobile and a left sidebar with accordion on desktop.

---

## Responsive Breakpoint

**< 960px (mobile / tablet portrait):** Bottom tab bar + bottom sheet league picker.
**≥ 960px (desktop):** Left sidebar with accordion, no bottom bar.

---

## 1. Mobile — Bottom Tab Bar

### Tab bar

The 4 real sports come from `SPORTS` in `sports.js`. "More" is a **hardcoded 5th tab** appended after the `SPORTS.map(...)` render — it is not a member of the `SPORTS` array.

- **5 tabs:** Football · NBA · Tennis · F1 · More
- Height: `72px` content (up from current ~52px)
- Icon size: `26px`
- Label size: `11px`, weight `500`
- Active indicator: `3px` bar at top of tab, `32px` wide
- Safe area: `.bottom-nav` keeps `padding-bottom: env(safe-area-inset-bottom, 0px)` (unchanged)
- `.main-content` mobile padding: `calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))` (unchanged formula, only `--bottom-nav-height` value changes)
- CSS variable `--bottom-nav-height` updated to `72px`
- Active indicator: `3px` height (was 2px), `32px` wide (was 28px) — intentional size increase

Note: `--bottom-nav-height` is reduced from `88px` to `72px`. On desktop (≥ 960px), `.main-content` uses `padding-left` instead of `padding-bottom`, so this variable is only relevant on mobile. The reduction is intentional — the new `72px` height already accounts for safe area inset via `env(safe-area-inset-bottom, 0px)` on the bar itself, and the matching `.main-content` padding formula is updated accordingly.

### "More" tab

Tapping "More" opens the same bottom sheet (see §3) but lists sports instead of leagues:
- Each sport as a full-width row: icon + full name
- Tapping a sport switches to it and dismisses the sheet
- Currently 0 extra sports — sheet shows a "More sports coming soon" placeholder text

### League picker — bottom sheet

Tapping the **active** sport tab opens the league picker sheet **only if the sport has more than 1 league** (i.e., `sport.leagues.filter(l => !l.divider).length > 1`). Tapping an **inactive** sport tab switches to it directly (no sheet).

Sports with sub-leagues: Football (19 selectable leagues), Tennis (ATP + WTA).
Sports without sub-leagues: NBA, F1 — tap switches directly, no sheet.

**Tap behaviour when already active:**
- Football / Tennis (has sub-leagues): tap toggles the sheet open/closed
- NBA / F1 (no sub-leagues): second tap on already-active tab is a no-op

**Important:** When the tapped sport is already `activeSport`, `SportTabs` must NOT call `onSportChange`. It should only toggle `openSheet`. Calling `onSportChange` for an already-active sport causes App.jsx to reset `activeLeague` to the sport's `defaultLeague`, which is wrong.

### Sheet state management

`SportTabs` tracks a single local `openSheet` state: `null | 'leagues' | 'more'`. Opening one dismisses the other. Both sheets render through the same `.league-sheet-panel` structure with different content. The "More" sheet shows a placeholder text row ("More sports coming soon") instead of a league grid.

**Sheet behaviour:**
- Slides up from the bottom, anchored above the tab bar
- Semi-transparent backdrop (`rgba(0,0,0,0.5)`) covers content behind it
- Dismiss: tap backdrop, tap the same sport tab again, or tap any league chip
- Tapping a league chip calls `onLeagueChange(league.id)` AND closes the sheet (`setOpenSheet(null)`)
- Height: `auto` (fits content), max `50vh`

**Sheet contents:**
- Drag handle (28px wide, 3px tall, centered)
- Sport label: small uppercase text (e.g. "Football")
- League grid: 3 columns of chips, each chip = flag emoji + shortName
- Active league chip highlighted with accent background
- Chips use `.league-pill` styles displayed in a CSS grid instead of a row
- **Divider entries (`l.divider === true`) are skipped** — rendered as full-width section labels within the grid using `grid-column: 1 / -1` + `.sidebar-section-label` style. `__divider_cups__` renders label "Cups", `__divider__` renders label "European".

---

## 2. Desktop — Left Sidebar (≥ 960px)

### Layout

- `220px` wide, fixed left, full viewport height
- `position: fixed; top: 0; left: 0; bottom: 0`
- `z-index: 150` (below modal at 1000, above content)
- `.header` gets `padding-left: var(--sidebar-width)` — the header is full-width/sticky, padding shifts its inner content past the sidebar. `.header-inner` retains `max-width: 960px; margin: 0 auto`, which centers correctly within the padded area at all viewport widths ≥ 960px
- `.main-content` gets `margin-left: var(--sidebar-width); margin-right: 0` — this overrides the existing `margin: 0 auto` centering so the content block starts at the sidebar's right edge. `max-width` is set to `none` on desktop so it fills the remaining viewport width naturally
- `padding-bottom` on `.main-content` is set to `0` (bottom nav is hidden on desktop)

### Sidebar structure

```
⚽  Football              ›    ← active, expanded
     🌍 All Leagues            ← active league (accent left bar)
     🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
     🇪🇸 La Liga
     🇩🇪 Bundesliga
     🇫🇷 Ligue 1
     🇮🇹 Serie A
     🇳🇱 Eredivisie
     🇵🇹 Primeira Liga
     🇺🇸 MLS
     ── CUPS ──                ← __divider_cups__ renders as section label
     🏴󠁧󠁢󠁥󠁮󠁧󠁿 FA Cup
     🏴󠁧󠁢󠁥󠁮󠁧󠁿 EFL Cup
     🇪🇸 Copa del Rey
     🇩🇪 DFB-Pokal
     🇮🇹 Coppa Italia
     🇫🇷 Coupe de France
     ── EUROPEAN ──            ← __divider__ renders as section label
     ⭐  Champions League
     🟠  Europa League
     🟢  Conference League
─────────────────────────
🏀  NBA                        ← no sub-items, tap switches directly
─────────────────────────
🎾  Tennis                ›
     🎾 ATP Tour
     🎾 WTA Tour
─────────────────────────
🏁  F1                         ← no sub-items
─────────────────────────
···  More                 ›    ← at bottom, expands for future sports
     (placeholder: "More sports coming soon")
```

**Divider rendering rules (both sidebar and bottom sheet):**

`SOCCER_LEAGUES` contains two divider entries:
- `{ id: '__divider_cups__', divider: true }` — renders as section label **"Cups"**
- `{ id: '__divider__', divider: true }` — renders as section label **"European"**

Both components (`Sidebar` and `SportTabs` sheet) are responsible for handling these entries. When iterating over a sport's `leagues` array, check `league.divider === true` and render a `.sidebar-section-label` element instead of a league item.

### Interaction

- Tapping a sport row **toggles** the accordion (open/close)
- Only one sport open at a time — opening a new sport closes the previous one
- Tapping a league sub-item sets `activeLeague` and `activeSport`
- Sports without sub-leagues (NBA, F1) switch `activeSport` on tap — no accordion toggle
- Tapping an already-active sport that has no sub-leagues is a no-op
- Active sport row: accent background tint, sport name in accent colour
- Active league sub-item: `2px` left accent bar, accent colour text
- Sidebar scrolls vertically if content overflows (Football list is long)

### "More" section

Last item in sidebar. Expands to list additional sports. Currently shows "More sports coming soon" as a muted placeholder row. Not driven by `SPORTS` data — hardcoded placeholder.

---

## 3. Header — Mobile Date Fix

**Problem:** On narrow mobile screens, the header renders:
`[⚡ Matchboard] [Monday, March 16, 2026] [‹ Today ›]`

The long static date label (`.header-date`) has `margin-left: auto`, pushing it and the `.header-action` DateNav to the right. When `.header-date` is hidden with `display: none`, the `margin-left: auto` disappears with it, and `.header-action` collapses to the left.

**Fix:** Hide `.header-date` on mobile AND transfer the `margin-left: auto` to `.header-action`:

```css
@media (max-width: 959px) {
  .header-date { display: none; }
  .header-action { margin-left: auto; }
}
```

The DateNav in the action slot already provides date context on mobile. The static label stays visible on desktop (≥ 960px) where there is plenty of room.

---

## 4. CSS Changes

### New custom properties

```css
--bottom-nav-height: 72px;   /* was 88px — intentionally reduced, see §1 */
--sidebar-width: 220px;       /* new */
```

### New classes

- `.sidebar` — the left nav container (desktop only, hidden on mobile)
- `.sidebar-sport` — a sport row (icon + name + optional chevron)
- `.sidebar-sport.active` — active state
- `.sidebar-leagues` — the collapsible sub-list for a sport
- `.sidebar-league` — individual league item
- `.sidebar-league.active` — active league with left accent bar
- `.sidebar-divider` — thin horizontal rule between sport groups
- `.sidebar-section-label` — small muted uppercase label (used for "Cups", "European")
- `.league-sheet` — the bottom sheet overlay container
- `.league-sheet-backdrop` — the semi-transparent backdrop
- `.league-sheet-panel` — the sliding panel
- `.league-sheet-grid` — 3-column CSS grid of league chips inside the panel

### Responsive rules

```css
/* Hide sidebar on mobile */
@media (max-width: 959px) { .sidebar { display: none; } }

/* Hide bottom nav on desktop */
@media (min-width: 960px) { .bottom-nav { display: none; } }

/* Offset content for sidebar on desktop */
@media (min-width: 960px) {
  .header { padding-left: var(--sidebar-width); }
  .main-content {
    margin-left: var(--sidebar-width);
    margin-right: 0;
    max-width: none;
    padding-bottom: 0;
  }
}

/* Mobile header: hide static date label, keep DateNav right-aligned */
@media (max-width: 959px) {
  .header-date { display: none; }
  .header-action { margin-left: auto; }
}
```

---

## 5. Component Changes

| File | Change |
|---|---|
| `src/components/SportTabs.jsx` | Full rewrite. Renders the mobile bottom tab bar + manages bottom sheet open/close state locally. Hardcodes "More" as the 5th tab. Handles divider entries in the sheet grid. |
| `src/components/Sidebar.jsx` | **New component.** Desktop sidebar with accordion open/close state (local). Accepts: `activeSport`, `onSportChange`, `activeLeague`, `onLeagueChange`. Iterates `SPORTS` directly (imported from `sports.js`) — does not need a `leagues` prop. Handles divider entries in the league sub-list. |
| `src/App.jsx` | Add `<Sidebar>` import and render it alongside `<SportTabs>`. Pass `activeSport`, `onSportChange`, `activeLeague`, `onLeagueChange` to both. No state changes. |
| `src/App.css` | New sidebar, sheet, and responsive CSS as above. Update `--bottom-nav-height` to `72px`. Add `--sidebar-width: 220px`. |

Note: Both `Sidebar` and `SportTabs` import `SPORTS` directly from `sports.js` — neither receives a `leagues` prop. The `leagues` prop that App.jsx currently passes to `SportTabs` is dropped in the rewrite. App.jsx no longer needs to compute `getSport(activeSport).leagues` for nav purposes.

The existing `.league-strip` row inside `.bottom-nav` (the horizontal scrolling pills) is removed entirely. This accounts for the height reduction from `88px` to `72px`.

---

## 6. What Does NOT Change

- `Header.jsx` — no JSX changes (only CSS affects `.header-date` / `.header-action`)
- All API, data fetching, state management in `App.jsx`
- `MatchCard.jsx`, `TennisCard.jsx`, `F1Card.jsx`, `MatchModal.jsx`
- `Standings.jsx`, `TeamPage.jsx`, `TennisRankings.jsx`
- All existing `activeSport` / `activeLeague` logic
- PWA manifest, icons, meta tags

---

## 7. Branch & Delivery

- Branch: `feature/redesign-v1`
- Test at `localhost:5174` (Vite dev server)
- User handles final `git push && vercel --prod`
