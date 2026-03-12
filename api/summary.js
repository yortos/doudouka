import { supabase } from './_db.js'
import { fetchSoccerSummary } from './_espn.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { league, event: eventId } = req.query
  if (!league || !eventId) return res.status(400).json({ error: 'league and event are required' })

  // ── Cache read ────────────────────────────────────────────────────────────────
  // Final summaries are cached forever; in-progress ones are always re-fetched
  if (supabase) {
    const { data: cached } = await supabase
      .from('summaries')
      .select('data, is_final')
      .eq('event_id', eventId)
      .maybeSingle()

    if (cached?.is_final) {
      return res.status(200).json(cached.data)
    }
  }

  // ── Fetch from ESPN ───────────────────────────────────────────────────────────
  let summary, isFinal
  try {
    ({ summary, isFinal } = await fetchSoccerSummary(league, eventId))
  } catch (err) {
    console.error('[summary] ESPN fetch error:', err.message)
    return res.status(502).json({ error: err.message })
  }

  // ── Cache write ───────────────────────────────────────────────────────────────
  if (supabase) {
    await supabase.from('summaries').upsert({
      event_id: eventId,
      league_id: league,
      data: summary,
      fetched_at: new Date().toISOString(),
      is_final: isFinal,
    })
  }

  return res.status(200).json(summary)
}
