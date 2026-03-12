import { fetchSoccerSummary } from './_espn.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { league, event: eventId } = req.query
  if (!league || !eventId) return res.status(400).json({ error: 'league and event are required' })

  let summary
  try {
    ({ summary } = await fetchSoccerSummary(league, eventId))
  } catch (err) {
    console.error('[summary] ESPN fetch error:', err.message)
    return res.status(502).json({ error: err.message })
  }

  return res.status(200).json(summary)
}
