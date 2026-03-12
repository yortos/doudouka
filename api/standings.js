import { supabase } from './_db.js'
import {
  fetchSoccerStandings,
  fetchNBAStandings,
  fetchF1Standings,
} from './_espn.js'

const HOUR = 60 * 60_000

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { sport = 'soccer', league } = req.query
  if (!league) return res.status(400).json({ error: 'league is required' })

  // ── Cache read ────────────────────────────────────────────────────────────────
  if (supabase) {
    const { data: cached } = await supabase
      .from('standings')
      .select('data, fetched_at')
      .eq('league_id', league)
      .maybeSingle()

    if (cached) {
      const ageMs = Date.now() - new Date(cached.fetched_at).getTime()
      if (ageMs < HOUR) {
        return res.status(200).json(cached.data)
      }
    }
  }

  // ── Fetch from ESPN ───────────────────────────────────────────────────────────
  let data
  try {
    if (sport === 'soccer') {
      data = await fetchSoccerStandings(league)
    } else if (sport === 'basketball') {
      data = await fetchNBAStandings()
    } else if (sport === 'f1') {
      data = await fetchF1Standings()
    } else {
      return res.status(400).json({ error: `Unknown sport: ${sport}` })
    }
  } catch (err) {
    console.error('[standings] ESPN fetch error:', err.message)
    return res.status(502).json({ error: err.message })
  }

  // ── Cache write ───────────────────────────────────────────────────────────────
  if (supabase) {
    await supabase.from('standings').upsert({
      league_id: league,
      data,
      fetched_at: new Date().toISOString(),
    })
  }

  return res.status(200).json(data)
}
