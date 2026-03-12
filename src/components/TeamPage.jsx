import { useState, useEffect } from 'react'
import { fetchTeamSchedule, fetchStandings } from '../api.js'
import { getLeague } from '../leagues.js'
import MatchCard from './MatchCard.jsx'

const EUROPEAN_IDS = ['UEFA.CHAMPIONS', 'UEFA.EUROPA', 'UEFA.CONFERENCE']

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function findInStandings(groups, teamId) {
  for (const group of groups) {
    const idx = group.entries.findIndex(e => e.team.id === teamId)
    if (idx !== -1) return { position: idx + 1, total: group.entries.length, group: group.name }
  }
  return null
}

function SummaryPill({ info, variant }) {
  const league = getLeague(info.leagueId)
  const pos = ordinal(info.position)
  const label = info.group ? `${pos} · ${info.group}` : pos
  return (
    <span className={`summary-pill${variant ? ` summary-pill-${variant}` : ''}`}>
      {league?.flag} {label} <span className="summary-pill-league">{league?.shortName}</span>
    </span>
  )
}

export default function TeamPage({ team, leagueId, onBack, backLabel = '← Back', onMatchClick, onTeamClick }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const league = getLeague(leagueId)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setSummary(null)

    async function load() {
      // Schedule is critical
      try {
        const schedule = await fetchTeamSchedule(leagueId, team.id)
        setMatches(schedule)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      // Standings are best-effort (fail silently)
      const isEuropean = EUROPEAN_IDS.includes(leagueId)

      const [domesticGroups, ...europeanResults] = await Promise.all([
        !isEuropean
          ? fetchStandings(leagueId).catch(() => null)
          : Promise.resolve(null),
        ...EUROPEAN_IDS.map(id =>
          fetchStandings(id).then(groups => ({ id, groups })).catch(() => null)
        ),
      ])

      const newSummary = {}

      if (domesticGroups) {
        const found = findInStandings(domesticGroups, team.id)
        if (found) newSummary.domestic = { ...found, leagueId }
      }

      for (const result of europeanResults) {
        if (!result) continue
        const found = findInStandings(result.groups, team.id)
        if (found) { newSummary.european = { ...found, leagueId: result.id }; break }
      }

      setSummary(newSummary)
    }

    load()
  }, [team.id, leagueId])

  const live = matches.filter(m => m.statusState === 'in')

  const upcoming = matches
    .filter(m => m.statusState === 'pre')
    .sort((a, b) => a.date - b.date)

  // Recent results: newest first
  const finished = matches
    .filter(m => m.statusState === 'post')
    .sort((a, b) => b.date - a.date)

  const nextTwo = upcoming.slice(0, 2)

  return (
    <div>
      {/* Team header */}
      <div className="team-page-header">
        <button className="back-btn" onClick={onBack}>{backLabel}</button>
        <div className="team-page-identity">
          {team.logo && (
            <img
              src={team.logo}
              alt={team.name}
              className="team-page-logo"
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <div>
            <h2 className="team-page-name">{team.name}</h2>
            {league && <div className="team-page-league">{league.flag} {league.name}</div>}
          </div>
        </div>
      </div>

      {/* Summary: standing pills + next 2 upcoming matches */}
      {(summary && (summary.domestic || summary.european)) || nextTwo.length > 0 ? (
        <div className="team-summary-block">
          {summary && (summary.domestic || summary.european) && (
            <div className="team-summary">
              {summary.domestic && <SummaryPill info={summary.domestic} />}
              {summary.european && <SummaryPill info={summary.european} variant="european" />}
            </div>
          )}
          {nextTwo.length > 0 && (
            <div className="team-next-matches">
              {nextTwo.map(m => {
                const opp = m.home.id === team.id ? m.away : m.home
                const isHome = m.home.id === team.id
                const compLeague = getLeague(m.leagueId)
                const dateStr = m.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                const timeStr = m.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                return (
                  <div key={m.id} className="team-next-match-row" onClick={() => onMatchClick(m)}>
                    <span className="team-next-match-date">{dateStr} · {timeStr}</span>
                    <span className="team-next-match-vs">{isHome ? 'vs' : '@'} <strong>{opp.name}</strong></span>
                    {compLeague && <span className="team-next-match-comp">{compLeague.flag} {compLeague.shortName}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {loading && (
        <div>{[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      )}

      {error && (
        <div className="error-banner">Could not load schedule</div>
      )}

      {!loading && !error && (
        <>
          {/* Live match */}
          {live.length > 0 && (
            <>
              <div className="section-label">Live Now</div>
              <div className="match-list">
                {live.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onClick={() => onMatchClick(m)}
                    onTeamClick={onTeamClick ? t => onTeamClick(t, m.leagueId) : null}
                  />
                ))}
              </div>
            </>
          )}

          {/* Next 2 upcoming matches */}
          {nextTwo.length > 0 && (
            <>
              <div className="section-label">Upcoming</div>
              <div className="match-list">
                {nextTwo.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onClick={() => onMatchClick(m)}
                    onTeamClick={onTeamClick ? t => onTeamClick(t, m.leagueId) : null}
                  />
                ))}
              </div>
            </>
          )}

          {/* Recent results — newest first */}
          {finished.length > 0 && (
            <>
              <div className="section-label">Recent Results</div>
              <div className="match-list">
                {finished.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onClick={() => onMatchClick(m)}
                    onTeamClick={onTeamClick ? t => onTeamClick(t, m.leagueId) : null}
                  />
                ))}
              </div>
            </>
          )}

          {live.length === 0 && upcoming.length === 0 && finished.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">&#128197;</div>
              <h3>No schedule available</h3>
              <p>No matches found for this team.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
