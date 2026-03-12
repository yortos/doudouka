import { useEffect, useState } from 'react'
import { fetchMatchSummary, fetchEventDate } from '../api.js'
import { getLeague } from '../leagues.js'

function TeamLogo({ logo, shortName, size = 52, onClick }) {
  const [err, setErr] = useState(false)
  const img = (!logo || err) ? (
    <div className="modal-team-logo-placeholder" style={{ width: size, height: size }}>
      {shortName?.slice(0, 3) || '?'}
    </div>
  ) : (
    <img
      className="modal-team-logo"
      src={logo}
      alt={shortName}
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
    />
  )
  if (onClick) {
    return (
      <button className="modal-team-logo-btn" onClick={onClick} title={`View ${shortName}`}>
        {img}
      </button>
    )
  }
  return img
}

function GoalIcon({ penalty, ownGoal }) {
  if (ownGoal) return <span title="Own goal">⚽🔴</span>
  if (penalty) return <span title="Penalty">⚽(P)</span>
  return <span>⚽</span>
}

function CardIcon({ type }) {
  return type === 'red' ? <span>🟥</span> : <span>🟨</span>
}

export default function MatchModal({ match, onClose, onTeamClick }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [secondLegDate, setSecondLegDate] = useState(null)

  const league = getLeague(match.leagueId)
  const isLive = match.statusState === 'in'
  const isFinished = match.statusState === 'post'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchMatchSummary(match.leagueId, match.id)
      .then(data => {
        if (cancelled) return
        setSummary(data)
        setLoading(false)
        if (match.leg === 1 && data.otherLegId) {
          fetchEventDate(match.leagueId, data.otherLegId)
            .then(d => { if (!cancelled) setSecondLegDate(d) })
        }
      })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [match.id, match.leagueId])

  // Close on overlay click
  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const hasScore = match.home.score != null && match.away.score != null

  let statusLabel = ''
  if (isLive) {
    statusLabel = match.statusName === 'STATUS_HALFTIME'
      ? 'Half Time'
      : (match.displayClock ? `${match.displayClock}'` : 'Live')
  } else if (isFinished) {
    statusLabel = match.statusDetail || 'Full Time'
  } else {
    const t = match.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    statusLabel = `Kick-off ${t}`
  }

  // Separate goals by team
  const homeGoals = summary?.goals?.filter(g => g.teamId === match.home.id) || []
  const awayGoals = summary?.goals?.filter(g => g.teamId === match.away.id) || []
  const homeCards = summary?.cards?.filter(c => c.teamId === match.home.id) || []
  const awayCards = summary?.cards?.filter(c => c.teamId === match.away.id) || []
  const allEvents = summary
    ? [
        ...((summary.goals || []).map(g => ({ ...g, kind: 'goal' }))),
        ...((summary.cards || []).map(c => ({ ...c, kind: 'card' }))),
      ].sort((a, b) => {
        const toMin = s => parseInt(s?.replace("'", '') || '0', 10)
        return toMin(a.clock) - toMin(b.clock)
      })
    : []

  // Broadcast info
  let broadcasts = match.broadcasts || []
  if (broadcasts.length === 0 && league?.knownBroadcasts) {
    broadcasts = [
      ...(league.knownBroadcasts.streaming || []),
      ...(league.knownBroadcasts.tv || []),
    ]
  }

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>✕</button>
          <div className="modal-league">
            {league?.flag} {league?.name}
            {' · '}
            {match.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {match.legLabel && (
              <span className="leg-badge" style={{ marginLeft: 8 }}>{match.legLabel}</span>
            )}
          </div>

          <div className="modal-scoreboard">
            <div className="modal-team">
              <TeamLogo
                logo={match.home.logo}
                shortName={match.home.shortName}
                onClick={onTeamClick ? () => onTeamClick(match.home) : null}
              />
              <span className="modal-team-name">{match.home.name}</span>
            </div>

            <div className="modal-score-block">
              {hasScore ? (
                <div className="modal-score">
                  {match.home.score}
                  <span className="modal-score-sep">–</span>
                  {match.away.score}
                </div>
              ) : (
                <div className="modal-score" style={{ fontSize: 22, color: 'var(--text-secondary)' }}>vs</div>
              )}
              <div className={`modal-status${isLive ? ' live' : ''}`}>{statusLabel}</div>
              {match.leg === 2 && match.aggregate && (
                <div className="modal-agg">
                  Agg: {match.aggregate.home}–{match.aggregate.away}
                </div>
              )}
              {match.leg === 1 && secondLegDate && (
                <div className="modal-second-leg-date">
                  2nd leg · {secondLegDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>

            <div className="modal-team">
              <TeamLogo
                logo={match.away.logo}
                shortName={match.away.shortName}
                onClick={onTeamClick ? () => onTeamClick(match.away) : null}
              />
              <span className="modal-team-name">{match.away.name}</span>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {/* Match events */}
          {loading && <div className="modal-loading">Loading match details…</div>}

          {error && (
            <div className="error-banner" style={{ margin: '0 0 12px' }}>
              ⚠ Could not load match details
            </div>
          )}

          {!loading && !error && allEvents.length === 0 && (isFinished || isLive) && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
              No event data available for this match.
            </div>
          )}

          {!loading && allEvents.length > 0 && (
            <>
              <div className="modal-section-title">Match Events</div>
              <div className="event-list">
                {allEvents.map((ev, i) => {
                  const isHome = ev.teamId === match.home.id
                  if (ev.kind === 'goal') {
                    const playerInfo = (
                      <div>
                        <div className="event-player">{ev.scorer}</div>
                        {ev.assist && <div className="event-assist">↳ {ev.assist}</div>}
                        {ev.penalty && <div className="event-pen">(Pen)</div>}
                        {ev.ownGoal && <div className="event-og">(OG)</div>}
                      </div>
                    )
                    return (
                      <div key={i} className="event-row">
                        <div className={`event-home${isHome ? '' : ' empty'}`}>
                          {isHome ? playerInfo : null}
                        </div>
                        <div className="event-icon">
                          <GoalIcon penalty={ev.penalty} ownGoal={ev.ownGoal} />
                          <span className="event-clock">{ev.clock}</span>
                        </div>
                        <div className={`event-away${!isHome ? '' : ' empty'}`}>
                          {!isHome ? playerInfo : null}
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div key={i} className="event-row">
                        <div className={`event-home${isHome ? '' : ' empty'}`}>
                          {isHome ? <div className="event-player">{ev.player}</div> : null}
                        </div>
                        <div className="event-icon">
                          <CardIcon type={ev.type} />
                          <span className="event-clock">{ev.clock}</span>
                        </div>
                        <div className={`event-away${!isHome ? '' : ' empty'}`}>
                          {!isHome ? <div className="event-player">{ev.player}</div> : null}
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </>
          )}

          {/* Broadcast info */}
          {broadcasts.length > 0 && (
            <div className="modal-info-row">
              <div className="modal-info-label">Where to Watch (USA)</div>
              {broadcasts.map(b => (
                <span key={b} className="broadcast-chip">📺 {b}</span>
              ))}
            </div>
          )}

          {/* Venue */}
          {match.venue && (
            <div className="modal-info-row" style={{ paddingBottom: 0, borderTop: 'none', paddingTop: 4 }}>
              <span className="modal-venue">🏟 {match.venue}{match.venueCity ? `, ${match.venueCity}` : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
