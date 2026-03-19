import {
  fetchSoccerStandings,
  fetchNBAStandings,
  fetchF1Standings,
  fetchTennisRankings,
} from './_espn.js'
import { getCached, setCached, isFresh, STANDINGS_TTL } from './_cache.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { sport = 'soccer', league } = req.query
  if (!league) return res.status(400).json({ error: 'league is required' })

  const cacheKey = `standings:${sport}:${league}`

  // 1. Try DB cache (1 hour TTL)
  const cached = await getCached(cacheKey)
  if (cached && isFresh(cached.fetchedAt, STANDINGS_TTL)) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json(cached.data)
  }

  // 2. Fetch from ESPN
  let data
  try {
    if (sport === 'soccer') {
      data = await fetchSoccerStandings(league)
    } else if (sport === 'basketball') {
      data = await fetchNBAStandings()
    } else if (sport === 'f1') {
      data = await fetchF1Standings()
    } else if (sport === 'tennis') {
      data = await fetchTennisRankings(league)
    } else {
      return res.status(400).json({ error: `Unknown sport: ${sport}` })
    }
  } catch (err) {
    console.error('[standings] ESPN fetch error:', err.message)
    // ESPN is down — serve stale if available
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=60')
      res.setHeader('X-Cache', 'STALE')
      return res.status(200).json(cached.data)
    }
    return res.status(502).json({ error: err.message })
  }

  // 3. Persist to DB (non-blocking)
  setCached(cacheKey, data)

  // 4. HTTP cache headers — standings update once a day at most
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.setHeader('X-Cache', 'MISS')

  return res.status(200).json(data)
}
