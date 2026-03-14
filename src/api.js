// Client-side API layer
// All data fetching goes through our own Vercel API routes, which handle
// the ESPN calls and persist results to Supabase for caching / history.
//
// Dates come back from the server as ISO strings and are deserialised here
// into Date objects so the rest of the app works unchanged.

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

async function apiFetch(path) {
  const res = await fetch(path)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: HTTP ${res.status}`)
  }
  return res.json()
}

// Restore Date objects that were serialised as ISO strings by the server
function hydrateDates(matches) {
  return matches.map(m => ({
    ...m,
    date: m.date ? new Date(m.date) : null,
    // F1 sessions also carry dates
    sessions: m.sessions?.map(s => ({ ...s, date: s.date ? new Date(s.date) : null })),
  }))
}

// ─── Soccer ────────────────────────────────────────────────────────────────────

export async function fetchScoreboard(leagueId, date = new Date()) {
  const data = await apiFetch(`/api/scoreboard?sport=soccer&league=${leagueId}&date=${formatDate(date)}`)
  return hydrateDates(data)
}

export async function fetchStandings(leagueId) {
  return apiFetch(`/api/standings?sport=soccer&league=${leagueId}`)
}

export async function fetchMatchSummary(leagueId, eventId) {
  return apiFetch(`/api/summary?league=${leagueId}&event=${eventId}`)
}

// Team schedule and event-date lookup still call ESPN directly from the client.
// They're low-frequency and team-specific so server-side caching adds little value for now.
export async function fetchTeamSchedule(leagueId, teamId) {
  const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'
  const res = await fetch(`${ESPN_BASE}/soccer/${leagueId}/teams/${teamId}/schedule`)
  if (!res.ok) throw new Error(`Team schedule fetch failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseTeamScheduleEvents(data.events || [], leagueId)
}

export async function fetchEventDate(leagueId, eventId) {
  const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'
  const res = await fetch(`${ESPN_BASE}/soccer/${leagueId}/summary?event=${eventId}&lang=en&region=us`)
  if (!res.ok) return null
  const data = await res.json()
  const dateStr = data.header?.competitions?.[0]?.date || data.header?.date
  return dateStr ? new Date(dateStr) : null
}

// Minimal parser for team schedule (same shape as scoreboard, kept client-side)
function parseTeamScheduleEvents(events, leagueId) {
  return events.map(event => {
    const comp = event.competitions?.[0] || {}
    const competitors = comp.competitors || []
    const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {}
    const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {}
    const status = event.status?.type || comp.status?.type || {}
    const toScore = s => {
      if (s == null) return null
      const raw = typeof s === 'object' ? (s.value ?? s.displayValue) : s
      const n = parseInt(raw, 10)
      return isNaN(n) ? null : n
    }
    const parseTeam = (competitor, score) => ({
      id: competitor?.team?.id,
      name: competitor?.team?.name,
      shortName: competitor?.team?.abbreviation,
      logo: competitor?.team?.logos?.[0]?.href || competitor?.team?.logo,
      color: competitor?.team?.color ? `#${competitor.team.color}` : null,
      alternateColor: competitor?.team?.alternateColor ? `#${competitor.team.alternateColor}` : null,
      score,
    })
    return {
      id: event.id,
      sport: 'soccer',
      leagueId,
      name: event.name,
      shortName: event.shortName,
      date: new Date(event.date),
      statusState: status.state,
      statusName: status.name,
      statusDetail: status.shortDetail || status.detail,
      statusDescription: status.description,
      displayClock: event.status?.displayClock,
      period: event.status?.period,
      home: parseTeam(home, toScore(home?.score)),
      away: parseTeam(away, toScore(away?.score)),
      broadcasts: [],
      venue: comp.venue?.fullName || null,
      venueCity: comp.venue?.address?.city || null,
      leg: comp.leg?.value || null,
      legLabel: comp.leg?.displayValue || null,
      seriesTitle: comp.series?.title || null,
      aggregate: null,
    }
  })
}

// ─── NBA ───────────────────────────────────────────────────────────────────────

export async function fetchNBAScoreboard(date = new Date()) {
  const data = await apiFetch(`/api/scoreboard?sport=basketball&league=nba&date=${formatDate(date)}`)
  return hydrateDates(data)
}

export async function fetchNBAStandings() {
  return apiFetch('/api/standings?sport=basketball&league=nba')
}

// ─── Tennis ────────────────────────────────────────────────────────────────────

export async function fetchTennisScoreboard(leagueId = 'atp', date = new Date()) {
  const data = await apiFetch(`/api/scoreboard?sport=tennis&league=${leagueId}&date=${formatDate(date)}`)
  return hydrateDates(data)
}

export async function fetchTennisRankings(leagueId = 'atp') {
  return apiFetch(`/api/standings?sport=tennis&league=${leagueId}`)
}

// ─── F1 ────────────────────────────────────────────────────────────────────────

export async function fetchF1Scoreboard() {
  const data = await apiFetch('/api/scoreboard?sport=f1&league=f1')
  return hydrateDates(data)
}

export async function fetchF1Standings() {
  return apiFetch('/api/standings?sport=f1&league=f1')
}
