import {
  fetchSoccerScoreboard,
  fetchNBAScoreboard,
  fetchTennisScoreboard,
  fetchF1Scoreboard,
} from './_espn.js'

// Convert YYYYMMDD string to a JS Date (UTC midnight)
function parseDateParam(dateStr) {
  return new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00Z`)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { sport = 'soccer', league, date } = req.query

  if (!league) return res.status(400).json({ error: 'league is required' })

  let matches
  try {
    if (sport === 'f1') {
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

  return res.status(200).json(matches)
}
