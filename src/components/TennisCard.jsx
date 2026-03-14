import { useState, useRef } from 'react'
import { getLeague } from '../leagues.js'

function formatKickoff(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function StatusBadge({ state, name, detail }) {
  if (state === 'in') {
    return <span className="status-badge live">&#x2B24; LIVE</span>
  }
  if (state === 'post') {
    if (name === 'STATUS_POSTPONED') return <span className="status-badge finished">PP</span>
    if (name === 'STATUS_ABANDONED') return <span className="status-badge finished">ABD</span>
    return <span className="status-badge finished">{detail || 'Final'}</span>
  }
  return null
}

function PlayerRow({ player, isWinner, state, noSpoilers }) {
  const winnerStyle = isWinner && state === 'post' && !noSpoilers
    ? { fontWeight: 800, color: 'var(--text)' }
    : { color: 'var(--text-secondary)' }

  return (
    <div className="tennis-player-row">
      <div className="tennis-player-info">
        {player.countryAbbr && (
          <span className="tennis-country">{player.countryAbbr}</span>
        )}
        <span className="tennis-player-name" style={winnerStyle}>
          {player.name}
          {player.seed && <span className="tennis-seed">({player.seed})</span>}
        </span>
      </div>
      <div className="tennis-sets">
        {player.sets.map((s, i) => (
          <span
            key={i}
            className={`tennis-set-score ${isWinner && state === 'post' ? 'winner' : ''} ${noSpoilers ? 'spoiler-blur' : ''}`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function TennisCard({ match, noSpoilers }) {
  const league = getLeague(match.leagueId)
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
  const p1Winning = match.statusState !== 'post' && match.player1.sets.length > 0
    && match.player1.sets[match.player1.sets.length - 1] > match.player2.sets[match.player2.sets.length - 1]

  let broadcasts = match.broadcasts || []
  if (broadcasts.length === 0 && league?.knownBroadcasts) {
    broadcasts = [...(league.knownBroadcasts.streaming || []), ...(league.knownBroadcasts.tv || [])]
  }

  return (
    <div
      className="match-card tennis-card"
      style={{ '--league-color': league?.primaryColor, '--league-accent': league?.accentColor }}
    >
      {/* Header */}
      <div className="match-card-header">
        {league && (
          <span className="match-league-badge">{league.flag} {league.shortName}</span>
        )}
        {match.round && (
          <span className="tennis-round-badge">{match.round}</span>
        )}
        {match.statusState === 'pre' && (
          <span className="match-time">{formatKickoff(match.date)}</span>
        )}
        <StatusBadge state={match.statusState} name={match.statusName} detail={match.statusDetail} />
      </div>

      {/* Tournament */}
      {match.tournament && (
        <div className="tennis-tournament">{match.tournament}</div>
      )}

      {/* Players */}
      <div
        className="tennis-players"
        onClick={noSpoilers ? handleScoreTap : undefined}
        style={noSpoilers && !revealed ? { cursor: 'pointer' } : undefined}
        title={noSpoilers && !revealed ? 'Double-tap to reveal scores' : undefined}
      >
        <PlayerRow
          player={match.player1}
          isWinner={match.player1.winner}
          state={match.statusState}
          noSpoilers={noSpoilers && !revealed}
        />
        <PlayerRow
          player={match.player2}
          isWinner={match.player2.winner}
          state={match.statusState}
          noSpoilers={noSpoilers && !revealed}
        />
      </div>

      {/* Footer */}
      {broadcasts.length > 0 && (
        <div className="match-footer">
          {broadcasts.slice(0, 3).map(b => (
            <span key={b} className="broadcast-chip">&#128250; {b}</span>
          ))}
          {match.venue && <span className="venue-chip">&#127955; {match.venue}</span>}
        </div>
      )}
    </div>
  )
}
