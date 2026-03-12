import { useState, useRef } from 'react'
import { getLeague } from '../leagues.js'

function formatKickoff(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function TeamLogo({ logo, shortName, size = 36, onClick }) {
  const [err, setErr] = useState(false)

  const img = (!logo || err) ? (
    <div className="team-logo-placeholder" style={{ width: size, height: size }}>
      {shortName?.slice(0, 3) || '?'}
    </div>
  ) : (
    <img
      className="team-logo"
      src={logo}
      alt={shortName}
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
    />
  )

  if (onClick) {
    return (
      <button
        className="team-logo-btn"
        title={`View ${shortName} schedule`}
        onClick={e => { e.stopPropagation(); onClick() }}
      >
        {img}
      </button>
    )
  }
  return img
}

function StatusBadge({ state, name, detail, displayClock, period, sport }) {
  if (state === 'in') {
    let label
    if (sport === 'basketball') {
      if (name === 'STATUS_HALFTIME') return <span className="status-badge live">&#x2B24; HT</span>
      const qtr = period ? (period > 4 ? 'OT' : `Q${period}`) : ''
      label = [qtr, displayClock].filter(Boolean).join(' ')
    } else {
      const isHT = name === 'STATUS_HALFTIME'
      label = isHT ? 'HT' : (displayClock ? `${displayClock}'` : 'LIVE')
    }
    return <span className="status-badge live">&#x2B24; {label || 'LIVE'}</span>
  }
  if (state === 'post') {
    if (name === 'STATUS_POSTPONED') return <span className="status-badge finished">PP</span>
    if (name === 'STATUS_CANCELLED') return <span className="status-badge finished">CANC</span>
    return <span className="status-badge finished">{detail || 'FT'}</span>
  }
  return null
}

export default function MatchCard({ match, onClick, onTeamClick, noSpoilers }) {
  const league = getLeague(match.leagueId)
  const hasScore = match.statusState !== 'pre' && match.home.score != null && match.away.score != null
  const [revealed, setRevealed] = useState(false)
  const lastTapRef = useRef(0)

  function handleScoreTap(e) {
    e.stopPropagation()
    const now = Date.now()
    if (now - lastTapRef.current < 350) {
      setRevealed(r => !r)
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  let broadcasts = match.broadcasts || []
  if (broadcasts.length === 0 && league?.knownBroadcasts) {
    broadcasts = [...(league.knownBroadcasts.streaming || []), ...(league.knownBroadcasts.tv || [])]
  }

  return (
    <div
      className="match-card"
      style={{
        '--league-color': league?.primaryColor,
        '--league-accent': league?.accentColor,
      }}
      onClick={onClick}
    >
      {/* Card header: league badge + time + status */}
      <div className="match-card-header">
        {league && league.id !== 'all' && (
          <span className="match-league-badge">{league.flag} {league.shortName}</span>
        )}
        {match.legLabel && (
          <span className="leg-badge">{match.legLabel}</span>
        )}
        <span className="match-time">{formatKickoff(match.date)}</span>
        <StatusBadge
          state={match.statusState}
          name={match.statusName}
          detail={match.statusDetail}
          displayClock={match.displayClock}
          period={match.period}
          sport={match.sport}
        />
      </div>

      {/* Teams and score */}
      <div className="match-body">
        <div className="match-team">
          <TeamLogo
            logo={match.home.logo}
            shortName={match.home.shortName}
            onClick={onTeamClick ? () => onTeamClick(match.home) : null}
          />
          <div>
            <span className="team-name">{match.home.name}</span>
            <span className="team-name-short">{match.home.shortName}</span>
          </div>
        </div>

        <div
          className="match-score-wrap"
          onClick={noSpoilers && hasScore ? handleScoreTap : undefined}
          style={noSpoilers && hasScore && !revealed ? { cursor: 'pointer' } : undefined}
        >
          <div className="match-score">
            {hasScore ? (
              <>
                <span className={`score-number${(noSpoilers && !revealed) ? ' spoiler-blur' : ''}`}>{match.home.score}</span>
                <span className={`score-sep${(noSpoilers && !revealed) ? ' spoiler-blur' : ''}`}>&ndash;</span>
                <span className={`score-number${(noSpoilers && !revealed) ? ' spoiler-blur' : ''}`}>{match.away.score}</span>
              </>
            ) : (
              <span className="score-vs">vs</span>
            )}
          </div>
          {noSpoilers && hasScore && !revealed && (
            <span className="score-reveal-hint">double tap</span>
          )}
          {match.leg === 2 && match.aggregate && (
            <span className="agg-score">
              Agg: {match.aggregate.home}–{match.aggregate.away}
            </span>
          )}
        </div>

        <div className="match-team away">
          <TeamLogo
            logo={match.away.logo}
            shortName={match.away.shortName}
            onClick={onTeamClick ? () => onTeamClick(match.away) : null}
          />
          <div>
            <span className="team-name">{match.away.name}</span>
            <span className="team-name-short">{match.away.shortName}</span>
          </div>
        </div>
      </div>

      {/* Footer: broadcasts + venue */}
      {(broadcasts.length > 0 || match.venue) && (
        <div className="match-footer">
          {broadcasts.slice(0, 4).map(b => (
            <span key={b} className="broadcast-chip">&#128250; {b}</span>
          ))}
          {match.venue && (
            <span className="venue-chip">&#127967; {match.venue}</span>
          )}
        </div>
      )}
    </div>
  )
}
