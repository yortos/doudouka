import { fetchSoccerSummary } from './_espn.js'
import { getCached, setCached, isFresh, SUMMARY_FINAL_TTL, SUMMARY_LIVE_TTL } from './_cache.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { league, event: eventId } = req.query
  if (!league || !eventId) return res.status(400).json({ error: 'league and event are required' })

  const cacheKey = `summary:${league}:${eventId}`

  // 1. Try DB cache — use final TTL only; live matches are never served from DB cache
  const cached = await getCached(cacheKey)
  if (cached && isFresh(cached.fetchedAt, SUMMARY_FINAL_TTL)) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json(cached.data)
  }

  // 2. Fetch from ESPN
  let summary, isFinal
  try {
    ;({ summary, isFinal } = await fetchSoccerSummary(league, eventId))
  } catch (err) {
    console.error('[summary] ESPN fetch error:', err.message)
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=60')
      res.setHeader('X-Cache', 'STALE')
      return res.status(200).json(cached.data)
    }
    return res.status(502).json({ error: err.message })
  }

  // 3. Persist finished matches to DB (non-blocking); skip live — they change every second
  if (isFinal) {
    setCached(cacheKey, summary)
  }

  // 4. HTTP cache headers
  if (isFinal) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  } else {
    res.setHeader('Cache-Control', `public, s-maxage=${SUMMARY_LIVE_TTL}, stale-while-revalidate=${SUMMARY_LIVE_TTL * 2}`)
  }
  res.setHeader('X-Cache', 'MISS')

  return res.status(200).json(summary)
}
