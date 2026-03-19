import {
  fetchSoccerScoreboard,
  fetchNBAScoreboard,
  fetchTennisScoreboard,
  fetchF1Scoreboard,
} from './_espn.js'
import { getCached, setCached, isFresh, scoreboardCacheControl } from './_cache.js'

// Convert YYYYMMDD string to a JS Date (UTC midnight)
function parseDateParam(dateStr) {
  return new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00Z`)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { sport = 'soccer', league, date } = req.query
  if (!league) return res.status(400).json({ error: 'league is required' })

  // Cache key unique to this request
  const cacheKey = `scoreboard:${sport}:${league}:${date || 'all'}`

  // TTL: past dates = 1 day, live = 20s, today-finished = 60s, future = 5min
  // We'll use a conservative 60s for DB lookup (HTTP headers will be set tighter)
  const isF1 = sport === 'f1'
  const todayStr = (() => {
    const now = new Date()
    return `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}${String(now.getUTCDate()).padStart(2,'0')}`
  })()
  const isPast = date && date < todayStr
  const dbTtl = isF1 ? 30 : isPast ? 86400 : 30

  // 1. Try DB cache
  const cached = await getCached(cacheKey)
  if (cached && isFresh(cached.fetchedAt, dbTtl)) {
    const hasLive = cached.data.some?.(m => m.statusState === 'in') ?? false
    res.setHeader('Cache-Control', scoreboardCacheControl(date || null, hasLive))
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json(cached.data)
  }

  // 2. Fetch from ESPN
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
    // ESPN is down — serve stale DB data if available
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=30')
      res.setHeader('X-Cache', 'STALE')
      return res.status(200).json(cached.data)
    }
    return res.status(502).json({ error: err.message })
  }

  // 3. Persist to DB (non-blocking)
  setCached(cacheKey, matches)

  // 4. Set HTTP cache headers for Vercel CDN
  const hasLive = matches.some(m => m.statusState === 'in')
  res.setHeader('Cache-Control', scoreboardCacheControl(date || null, hasLive))
  res.setHeader('X-Cache', 'MISS')

  return res.status(200).json(matches)
}
