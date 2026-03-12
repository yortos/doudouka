// Server-side ESPN fetch + parse
// Dates are kept as ISO strings (not Date objects) so they survive JSON serialisation
// The client deserialises them back to Date objects in src/api.js

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function getBroadcasts(comp) {
  const set = new Set()
  comp.broadcasts?.forEach(b => b.names?.forEach(n => set.add(n)))
  comp.geoBroadcasts?.forEach(b => { if (b.media?.shortName) set.add(b.media.shortName) })
  return [...set]
}

const toScore = s => {
  if (s == null) return null
  const raw = typeof s === 'object' ? (s.value ?? s.displayValue) : s
  const n = parseInt(raw, 10)
  return isNaN(n) ? null : n
}

// ─── Soccer / NBA shared parser ────────────────────────────────────────────────

function parseTeam(competitor, score) {
  return {
    id: competitor?.team?.id,
    name: competitor?.team?.name,
    shortName: competitor?.team?.abbreviation,
    logo: competitor?.team?.logos?.[0]?.href || competitor?.team?.logo,
    color: competitor?.team?.color ? `#${competitor.team.color}` : null,
    alternateColor: competitor?.team?.alternateColor ? `#${competitor.team.alternateColor}` : null,
    score,
  }
}

function parseEvents(events, leagueId, sport = 'soccer') {
  return events.map(event => {
    const comp = event.competitions?.[0] || {}
    const competitors = comp.competitors || []
    const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {}
    const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {}
    const status = event.status?.type || comp.status?.type || {}

    const seriesComps = comp.series?.competitors || []
    const homeTeamId = home?.team?.id
    const awayTeamId = away?.team?.id
    const homeAgg = seriesComps.find(c => c.id === homeTeamId)
    const awayAgg = seriesComps.find(c => c.id === awayTeamId)
    const aggregate = (homeAgg && awayAgg) ? {
      home: homeAgg.aggregateScore ?? null,
      away: awayAgg.aggregateScore ?? null,
    } : null

    return {
      id: event.id,
      sport,
      leagueId,
      name: event.name,
      shortName: event.shortName,
      date: event.date,  // ISO string
      statusState: status.state,
      statusName: status.name,
      statusDetail: status.shortDetail || status.detail,
      statusDescription: status.description,
      displayClock: event.status?.displayClock,
      period: event.status?.period,
      home: parseTeam(home, toScore(home?.score)),
      away: parseTeam(away, toScore(away?.score)),
      broadcasts: getBroadcasts(comp),
      venue: comp.venue?.fullName || null,
      venueCity: comp.venue?.address?.city || null,
      leg: comp.leg?.value || null,
      legLabel: comp.leg?.displayValue || null,
      seriesTitle: comp.series?.title || null,
      aggregate,
    }
  })
}

// ─── Soccer ────────────────────────────────────────────────────────────────────

export async function fetchSoccerScoreboard(leagueId, date) {
  const url = `${ESPN_BASE}/soccer/${leagueId}/scoreboard?dates=${formatDate(date)}&limit=100&lang=en&region=us`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Soccer scoreboard failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseEvents(data.events || [], leagueId, 'soccer')
}

export async function fetchSoccerStandings(leagueId) {
  const url = `https://site.web.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings?lang=en&region=us`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Soccer standings failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseSoccerStandings(data)
}

function parseSoccerStandings(data) {
  const flatEntries = data.standings?.entries
  if (flatEntries?.length) {
    return [{ name: null, entries: parseStandingsEntries(flatEntries) }]
  }
  const children = data.children || []
  if (children.length) {
    return children.map(child => ({
      name: child.name || child.abbreviation || 'Group',
      entries: parseStandingsEntries(child.standings?.entries || []),
    }))
  }
  const groups = data.standings?.groups || []
  if (groups.length) {
    return groups.map(g => ({
      name: g.name || 'Group',
      entries: parseStandingsEntries(g.entries || []),
    }))
  }
  return []
}

function parseStandingsEntries(entries) {
  return entries
    .map(entry => {
      const stats = {}
      entry.stats?.forEach(s => { stats[s.name] = { value: s.value, display: s.displayValue } })
      const gd = stats.pointDifferential?.value ?? 0
      return {
        team: {
          id: entry.team?.id,
          name: entry.team?.nickname || entry.team?.name,
          fullName: entry.team?.name,
          shortName: entry.team?.abbreviation,
          logo: entry.team?.logos?.[0]?.href || entry.team?.logo,
        },
        gp: stats.gamesPlayed?.value ?? 0,
        wins: stats.wins?.value ?? 0,
        draws: stats.ties?.value ?? 0,
        losses: stats.losses?.value ?? 0,
        gf: stats.pointsFor?.value ?? stats.goalsFor?.value ?? 0,
        ga: stats.pointsAgainst?.value ?? stats.goalsAgainst?.value ?? 0,
        gd,
        gdDisplay: stats.pointDifferential?.display ?? (gd > 0 ? `+${gd}` : String(gd)),
        points: stats.points?.value ?? 0,
      }
    })
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
}

export async function fetchSoccerSummary(leagueId, eventId) {
  const url = `${ESPN_BASE}/soccer/${leagueId}/summary?event=${eventId}&lang=en&region=us`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Summary failed: HTTP ${res.status}`)
  const data = await res.json()
  const statusState = data.header?.competitions?.[0]?.status?.type?.state
  return { summary: parseSoccerSummary(data, eventId), isFinal: statusState === 'post' }
}

function parseSoccerSummary(data, currentEventId) {
  const comp = data.header?.competitions?.[0] || {}
  const details = comp.details || []
  const goals = []
  const cards = []

  details.forEach(d => {
    const type = d.type?.text?.toLowerCase() || ''
    const clock = d.clock?.displayValue || ''
    const teamId = d.team?.id
    const participants = d.participants || []

    if (d.scoringPlay || type.includes('goal')) {
      const scorer = participants[0]?.athlete
      const assist = participants.length > 1 ? participants[1]?.athlete : null
      goals.push({
        clock, teamId,
        scorer: scorer?.displayName || scorer?.shortName || 'Unknown',
        assist: assist?.displayName || assist?.shortName || null,
        ownGoal: d.ownGoal || false,
        penalty: d.penaltyKick || false,
      })
    } else if (type.includes('yellow card')) {
      const athlete = participants[0]?.athlete
      cards.push({ type: 'yellow', clock, teamId, player: athlete?.displayName || athlete?.shortName || 'Unknown' })
    } else if (type.includes('red card')) {
      const athlete = participants[0]?.athlete
      cards.push({ type: 'red', clock, teamId, player: athlete?.displayName || athlete?.shortName || 'Unknown' })
    }
  })

  const competitors = comp.competitors || []
  const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {}
  const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {}

  const seriesData = Array.isArray(comp.series) ? comp.series[0] : comp.series
  const otherLegId = seriesData?.events
    ?.map(e => String(e.id))
    ?.find(id => id !== String(currentEventId)) || null

  return { homeId: home?.team?.id, awayId: away?.team?.id, goals, cards, otherLegId }
}

// ─── NBA ───────────────────────────────────────────────────────────────────────

export async function fetchNBAScoreboard(date) {
  const url = `${ESPN_BASE}/basketball/nba/scoreboard?dates=${formatDate(date)}&limit=50`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NBA scoreboard failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseEvents(data.events || [], 'nba', 'basketball')
}

export async function fetchNBAStandings() {
  const url = 'https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NBA standings failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseNBAStandings(data)
}

function parseNBAStandings(data) {
  return (data.children || []).map(conf => {
    const entries = (conf.standings?.entries || []).map(entry => {
      const stats = {}
      entry.stats?.forEach(s => { stats[s.name] = s })
      return {
        team: {
          id: entry.team?.id,
          name: entry.team?.nickname || entry.team?.name,
          fullName: entry.team?.displayName || entry.team?.name,
          shortName: entry.team?.abbreviation,
          logo: entry.team?.logos?.[0]?.href || entry.team?.logo,
          color: entry.team?.color ? `#${entry.team.color}` : null,
        },
        wins: stats.wins?.value ?? 0,
        losses: stats.losses?.value ?? 0,
        pct: stats.winPercent?.displayValue ?? stats.winPercent?.value?.toFixed(3) ?? '.000',
        gb: stats.gamesBehind?.displayValue ?? stats.gamesBehind?.value ?? '-',
        home: stats.Home?.displayValue ?? '-',
        away: stats.Road?.displayValue ?? '-',
        last10: stats['Last Ten']?.displayValue ?? stats.last10?.displayValue ?? '-',
        streak: stats.streak?.displayValue ?? '-',
      }
    }).sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    return { name: conf.name || conf.abbreviation, entries }
  })
}

// ─── Tennis ────────────────────────────────────────────────────────────────────

export async function fetchTennisScoreboard(leagueId, date) {
  const url = `${ESPN_BASE}/tennis/${leagueId}/scoreboard?dates=${formatDate(date)}&limit=100`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Tennis scoreboard failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseTennisEvents(data.events || [], leagueId, date)
}

function parseTennisEvents(events, leagueId, filterDate) {
  // ESPN nests individual match competitions inside event.groupings[].competitions.
  // Filter to the relevant gender based on leagueId (atp=men, wta=women).
  const isWTA = leagueId === 'wta'
  // Date filter: ESPN returns all tournament matches; we only want the requested date.
  const filterDateStr = filterDate ? formatDate(filterDate) : null  // YYYYMMDD
  const matches = []
  events.forEach(event => {
    // Collect competitions from groupings, filtered by gender
    let allComps = []
    if (event.groupings?.length) {
      event.groupings.forEach(g => {
        const name = g.grouping?.displayName?.toLowerCase() || ''
        const isWomens = name.includes("women")
        if (isWTA ? isWomens : !isWomens) {
          allComps.push(...(g.competitions || []))
        }
      })
    }
    // Fallback: older API responses may have competitions directly on the event
    if (!allComps.length) {
      allComps = event.competitions || []
    }

    // Filter competitions to the requested date
    if (filterDateStr) {
      allComps = allComps.filter(comp => {
        const compDate = (comp.date || '').slice(0, 10).replace(/-/g, '')
        return compDate === filterDateStr
      })
    }

    allComps.forEach((comp, ci) => {
      if (!comp) return
      const competitors = comp.competitors || []
      if (competitors.length < 2) return
      const p1 = competitors[0]
      const p2 = competitors[1]
      const status = comp.status?.type || event.status?.type || {}
      const getSets = c => (c.linescores || []).map(ls => {
        if (ls.displayValue != null) return ls.displayValue
        const score = String(Math.round(ls.value ?? 0))
        // Show loser's tiebreak points in parentheses (e.g. "6(4)")
        if (ls.tiebreak != null && ls.winner === false) return `${score}(${ls.tiebreak})`
        return score
      })
      matches.push({
        id: `${event.id}-${ci}`,
        sport: 'tennis',
        leagueId,
        name: event.name || comp.name,
        date: comp.date || event.date,  // ISO string
        statusState: status.state,
        statusName: status.name,
        statusDetail: status.shortDetail || status.detail,
        tournament: event.season?.displayName || event.name || '',
        round: comp.type?.text || status.shortDetail || '',
        player1: {
          id: p1.athlete?.id || p1.id,
          name: p1.athlete?.displayName || p1.athlete?.shortName || 'Player 1',
          shortName: p1.athlete?.shortName || (p1.athlete?.displayName?.split(' ').slice(-1)[0] ?? 'P1'),
          countryAbbr: p1.athlete?.flag?.alt || p1.athlete?.country?.abbreviation || '',
          seed: p1.curatedRank?.current || null,
          sets: getSets(p1),
          winner: p1.winner || false,
        },
        player2: {
          id: p2.athlete?.id || p2.id,
          name: p2.athlete?.displayName || p2.athlete?.shortName || 'Player 2',
          shortName: p2.athlete?.shortName || (p2.athlete?.displayName?.split(' ').slice(-1)[0] ?? 'P2'),
          countryAbbr: p2.athlete?.flag?.alt || p2.athlete?.country?.abbreviation || '',
          seed: p2.curatedRank?.current || null,
          sets: getSets(p2),
          winner: p2.winner || false,
        },
        broadcasts: getBroadcasts(comp),
        venue: comp.venue?.fullName || null,
        surface: comp.venue?.grass ? 'Grass' : comp.surface || null,
      })
    })
  })
  return matches
}

// ─── F1 ────────────────────────────────────────────────────────────────────────

const SESSION_LABELS = {
  FP1: 'Practice 1', FP2: 'Practice 2', FP3: 'Practice 3',
  Qual: 'Qualifying', Race: 'Race',
  Sprint: 'Sprint Race', SprintQ: 'Sprint Qualifying',
}

const F1_TOTAL_ROUNDS = 24

function parseF1SessionDrivers(comp) {
  return (comp.competitors || [])
    .map(c => ({
      id: c.athlete?.id || c.id,
      position: parseInt(c.order, 10) || 999,
      name: c.athlete?.displayName || c.athlete?.shortName || 'Driver',
      shortName: c.athlete?.shortName || (c.athlete?.displayName?.split(' ').slice(-1)[0] ?? ''),
      team: c.team?.displayName || c.team?.name || '',
      teamAbbr: c.team?.abbreviation || '',
      gap: c.status?.displayValue || '',
      flagHref: c.athlete?.flag?.href || null,
      flagAlt: c.athlete?.flag?.alt || '',
    }))
    .sort((a, b) => a.position - b.position)
}

export async function fetchF1Scoreboard() {
  const year = new Date().getFullYear()
  const url = `${ESPN_BASE}/racing/f1/scoreboard?limit=30&dates=${year}0101-${year}1231`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`F1 scoreboard failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseF1Events(data.events || [])
}

function parseF1Events(events) {
  return events.map((event, idx) => {
    const allComps = event.competitions || []
    const raceComp = allComps.find(c =>
      c.type?.abbreviation?.toLowerCase() === 'race' ||
      c.type?.text?.toLowerCase() === 'race'
    ) || allComps[allComps.length - 1] || {}

    const raceStatus = raceComp.status?.type || event.status?.type || {}

    const sessions = allComps.map(comp => {
      const abbr = comp.type?.abbreviation || comp.type?.text || 'Session'
      const sessStatus = comp.status?.type || {}
      return {
        type: abbr,
        label: SESSION_LABELS[abbr] || abbr,
        date: comp.date || comp.startDate || event.date,  // ISO string
        statusState: sessStatus.state || 'pre',
        statusDetail: sessStatus.shortDetail || sessStatus.detail || '',
        broadcasts: getBroadcasts(comp),
        lap: comp.status?.period || null,
        displayClock: comp.status?.displayClock || null,
        drivers: parseF1SessionDrivers(comp),
      }
    })

    const drivers = (raceComp.competitors || [])
      .map(c => ({
        id: c.athlete?.id || c.id,
        position: parseInt(c.order, 10) || parseInt(c.place, 10) || 999,
        name: c.athlete?.displayName || c.athlete?.shortName || 'Driver',
        shortName: c.athlete?.shortName || (c.athlete?.displayName?.split(' ').slice(-1)[0] ?? ''),
        number: c.athlete?.jersey || c.jersey || '',
        team: c.team?.displayName || c.team?.name || '',
        teamAbbr: c.team?.abbreviation || '',
        gap: c.status?.displayValue || '',
        points: toScore(c.score),
        flagHref: c.athlete?.flag?.href || null,
        flagAlt: c.athlete?.flag?.alt || '',
      }))
      .sort((a, b) => a.position - b.position)
      .slice(0, 20)

    return {
      id: event.id,
      sport: 'f1',
      leagueId: 'f1',
      name: event.name,
      shortName: event.shortName,
      date: event.date,  // ISO string
      round: idx + 1,
      totalRounds: F1_TOTAL_ROUNDS,
      statusState: raceStatus.state,
      statusName: raceStatus.name,
      statusDetail: raceStatus.shortDetail || raceStatus.detail,
      displayClock: raceComp.status?.displayClock || event.status?.displayClock,
      lap: raceComp.status?.period || event.status?.period,
      circuit: raceComp.venue?.fullName || event.circuit?.fullName || null,
      city: raceComp.venue?.address?.city || event.circuit?.address?.city || null,
      country: raceComp.venue?.address?.country || event.circuit?.address?.country || null,
      sessions,
      drivers,
      broadcasts: getBroadcasts(raceComp),
    }
  })
}

export async function fetchF1Standings() {
  const url = 'https://site.web.api.espn.com/apis/v2/sports/racing/f1/standings'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`F1 standings failed: HTTP ${res.status}`)
  const data = await res.json()
  return parseF1Standings(data)
}

function parseF1Standings(data) {
  const children = data.children || []
  const driverChild = children.find(c => c.name?.toLowerCase().includes('driver') || c.id === '0') || children[0]
  const constructorChild = children.find(c => c.name?.toLowerCase().includes('constructor') || c.id === '1') || children[1]

  const drivers = (driverChild?.standings?.entries || []).map(entry => {
    const stats = {}
    entry.stats?.forEach(s => { stats[s.name] = s })
    const rank = parseInt(stats.rank?.displayValue, 10) || 0
    const points = stats.championshipPts?.value ?? stats.points?.value ?? 0
    return {
      id: entry.athlete?.id,
      name: entry.athlete?.displayName || entry.athlete?.name || 'Driver',
      shortName: entry.athlete?.shortName || '',
      flag: entry.athlete?.flag?.href || null,
      flagAlt: entry.athlete?.flag?.alt || '',
      team: entry.team?.displayName || entry.team?.name || '',
      teamColor: entry.team?.color ? `#${entry.team.color}` : null,
      rank,
      points,
    }
  }).sort((a, b) => a.rank - b.rank || b.points - a.points)

  const constructors = (constructorChild?.standings?.entries || []).map(entry => {
    const stats = {}
    entry.stats?.forEach(s => { stats[s.name] = s })
    const rank = parseInt(stats.rank?.displayValue, 10) || 0
    const points = stats.points?.value ?? stats.championshipPts?.value ?? 0
    return {
      id: entry.team?.id,
      name: entry.team?.displayName || entry.team?.name || 'Team',
      shortName: entry.team?.abbreviation || '',
      color: entry.team?.color ? `#${entry.team.color}` : '#888',
      rank,
      points,
    }
  }).sort((a, b) => a.rank - b.rank || b.points - a.points)

  return { drivers, constructors }
}
