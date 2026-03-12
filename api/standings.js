import {
  fetchSoccerStandings,
  fetchNBAStandings,
  fetchF1Standings,
} from './_espn.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { sport = 'soccer', league } = req.query
  if (!league) return res.status(400).json({ error: 'league is required' })

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

  return res.status(200).json(data)
}
