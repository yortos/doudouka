import { supabase } from './_db.js'
import {
  fetchSoccerScoreboard,
  fetchNBAScoreboard,
  fetchTennisScoreboard,
  fetchF1Scoreboard,
} from './_espn.js'

const MINUTE = 60_000
const TWO_HOURS = 2 * 60 * 60_000

// Convert YYYYMMDD string to a JS Date (UTC midnight)
function parseDateParam(dateStr) {
  return new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00Z`)
}

// YYYYMMDD for today in UTC
function todayUTC() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// DB date column format: YYYY-MM-DD
function toDbDate(dateStr) {
  // dateStr is YYYYMMDD or 'f1-YYYY' sentinel
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { sport = 'soccer', league, date } = req.query

  if (!league) return res.status(400).json({ error: 'league is required' })

  const today = todayUTC()

  // F1 uses the whole season (no date), keyed by league_id='f1' and date=Jan 1 of the year
  const isF1 = sport === 'f1'
  const year = new Date().getUTCFullYear()
  const dbLeagueId = league   // eng.1, nba, atp, f1 – already unique across sports
  const dbDate = isF1
    ? `${year}-01-01`
    : toDbDate(date)

  const isFuture = !isF1 && date > today
  const isToday = !isF1 && date === today

  // ── Cache read ────────────────────────────────────────────────────────────────
  if (supabase && !isFuture) {
    const { data: cached } = await supabase
      .from('matches')
      .select('data, fetched_at, all_final')
      .eq('league_id', dbLeagueId)
      .eq('date', dbDate)
      .maybeSingle()

    if (cached) {
      const ageMs = Date.now() - new Date(cached.fetched_at).getTime()

      let stale = false
      if (isToday || isF1) {
        stale = ageMs > MINUTE          // live data: refresh every minute
      } else if (!cached.all_final) {
        stale = ageMs > TWO_HOURS       // unfinished past day: retry after 2h
      }
      // fully finished past day: never stale

      if (!stale) {
        return res.status(200).json(cached.data)
      }
    }
  }

  // ── Fetch from ESPN ───────────────────────────────────────────────────────────
  let matches
  try {
    if (isF1) {
      matches = await fetchF1Scoreboard()
    } else {
      const dateObj = parseDateParam(date)
      if (sport === 'soccer') {
        matches = await fetchSoccerScoreboard(league, dateObj)
      } else if (sport === 'basketball') {
        matches = await fetchNBAScoreboard(dateObj)
      } else if (sport === 'tennis') {
        matches = await fetchTennisScoreboard(league, dateObj)
      } else {
        return res.status(400).json({ error: `Unknown sport: ${sport}` })
      }
    }
  } catch (err) {
    console.error('[scoreboard] ESPN fetch error:', err.message)
    return res.status(502).json({ error: err.message })
  }

  // ── Cache write ───────────────────────────────────────────────────────────────
  if (supabase && !isFuture) {
    const allFinal = matches.every(m => m.statusState === 'post')
    await supabase.from('matches').upsert({
      league_id: dbLeagueId,
      date: dbDate,
      data: matches,
      fetched_at: new Date().toISOString(),
      all_final: allFinal,
    })
  }

  return res.status(200).json(matches)
}
