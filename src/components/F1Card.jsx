import { useState, useRef } from 'react'
import { getLeague } from '../leagues.js'

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

function PositionIcon({ pos }) {
  if (MEDAL[pos]) return <span style={{ fontSize: 14 }}>{MEDAL[pos]}</span>
  return <span className="f1-pos-num">{pos}</span>
}

function formatLocalDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatLocalTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function SessionRow({ session, isExpanded, onClick }) {
  const isDone = session.statusState === 'post'
  const isLive = session.statusState === 'in'
  const hasResults = (isDone || isLive) && session.drivers?.length > 0
  const isClickable = hasResults

  return (
    <div
      className={`f1-session-row ${isClickable ? 'f1-session-row-clickable' : ''} ${isExpanded ? 'f1-session-row-expanded' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      <span className="f1-session-label">{session.label}</span>
      <span className="f1-session-datetime">
        {formatLocalDate(session.date)} · {formatLocalTime(session.date)}
        <span className="f1-session-time-label"> local</span>
      </span>
      {isDone && (
        <span className="f1-session-status-done">
          {isClickable ? (isExpanded ? '▲' : '▼') : '✓'}
        </span>
      )}
      {isLive && (
        <span className="f1-session-status-live">
          ● LIVE{session.lap ? ` Lap ${session.lap}` : ''}{session.displayClock ? ` ${session.displayClock}` : ''}
          {isClickable && <span> {isExpanded ? '▲' : '▼'}</span>}
        </span>
      )}
    </div>
  )
}

function SessionResults({ session }) {
  const drivers = session.drivers || []
  if (drivers.length === 0) return null
  return (
    <div className="f1-session-results">
      {drivers.map(d => (
        <div key={d.id || d.position} className="f1-session-result-row">
          <PositionIcon pos={d.position} />
          <span className="f1-driver-name">{d.name}</span>
          <span className="f1-driver-team">{d.teamAbbr || d.team}</span>
          {d.gap && (
            <span className="f1-driver-gap">{d.gap}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function F1Card({ race, onDriverClick, noSpoilers }) {
  const league = getLeague('f1')
  const [expandedSession, setExpandedSession] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const lastTapRef = useRef(0)

  function handleRevealTap(e) {
    e.stopPropagation()
    const now = Date.now()
    if (now - lastTapRef.current < 350) {
      setRevealed(r => !r)
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  const isLive = race.statusState === 'in'
  const isFinished = race.statusState === 'post'
  const isUpcoming = race.statusState === 'pre'

  const raceSession = race.sessions?.find(s => s.type === 'Race' || s.label === 'Race')
  let broadcasts = raceSession?.broadcasts?.length
    ? raceSession.broadcasts
    : race.broadcasts || []
  if (broadcasts.length === 0 && league?.knownBroadcasts) {
    broadcasts = [...(league.knownBroadcasts.tv || []), ...(league.knownBroadcasts.streaming || [])]
  }

  const showDrivers = (isLive || isFinished) && race.drivers.length > 0
  const driversToShow = race.drivers.slice(0, isLive ? 5 : 3)

  const locationParts = [race.circuit, race.city, race.country].filter(Boolean)
  const locationLine = locationParts.slice(0, 2).join(' · ')

  function toggleSession(idx) {
    setExpandedSession(prev => prev === idx ? null : idx)
  }

  return (
    <div
      className="match-card f1-card"
      style={{ '--league-color': league?.primaryColor, '--league-accent': league?.accentColor }}
    >
      {/* Header */}
      <div className="match-card-header">
        <span className="f1-round-badge">
          Round {race.round}{race.totalRounds ? ` of ${race.totalRounds}` : ''}
        </span>
        {isLive && (
          <span className="status-badge live">
            ● {race.lap ? `Lap ${race.lap}` : 'LIVE'}
            {race.displayClock ? ` ${race.displayClock}` : ''}
          </span>
        )}
        {isFinished && <span className="status-badge finished">Finished</span>}
        {isUpcoming && race.date && (
          <span className="match-time">{formatLocalDate(race.date)}</span>
        )}
      </div>

      {/* Race name */}
      <div className="f1-race-name">{race.name}</div>

      {/* Location */}
      {locationLine && <div className="f1-circuit">📍 {locationLine}</div>}

      {/* Sessions timeline */}
      {race.sessions?.length > 0 && (
        <div className="f1-sessions-list">
          {race.sessions.map((s, i) => (
            <div key={i}>
              <SessionRow
                session={s}
                isExpanded={expandedSession === i}
                onClick={() => toggleSession(i)}
              />
              {expandedSession === i && (
                (noSpoilers && !revealed) ? (
                  <div className="spoiler-section" onClick={handleRevealTap} style={{ cursor: 'pointer' }}>
                    <div className="spoiler-blur"><SessionResults session={s} /></div>
                    <div className="spoiler-section-overlay">Double-tap to reveal</div>
                  </div>
                ) : (
                  <SessionResults session={s} />
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Race podium / live leaderboard */}
      {showDrivers && (
        (noSpoilers && !revealed) ? (
          <div className="f1-leaderboard spoiler-section" onClick={handleRevealTap} style={{ cursor: 'pointer' }}>
            <div className="spoiler-blur">
              <div className="f1-leaderboard-title">
                {isLive ? 'Current Order' : 'Result'}
              </div>
              {driversToShow.map(driver => (
                <div key={driver.id || driver.position} className="f1-driver-row">
                  <PositionIcon pos={driver.position} />
                  <span className="f1-driver-name">{driver.name}</span>
                  <span className="f1-driver-team">{driver.teamAbbr || driver.team}</span>
                  {driver.gap && <span className="f1-driver-gap">{driver.gap}</span>}
                </div>
              ))}
            </div>
            <div className="spoiler-section-overlay">Double-tap to reveal</div>
          </div>
        ) : (
          <div className="f1-leaderboard">
            <div className="f1-leaderboard-title">
              {isLive ? 'Current Order' : 'Result'}
            </div>
            {driversToShow.map(driver => (
              <div
                key={driver.id || driver.position}
                className={`f1-driver-row ${onDriverClick ? 'f1-driver-row-clickable' : ''}`}
                onClick={onDriverClick ? () => onDriverClick(driver) : undefined}
              >
                <PositionIcon pos={driver.position} />
                <span className="f1-driver-name">{driver.name}</span>
                <span className="f1-driver-team">{driver.teamAbbr || driver.team}</span>
                {driver.gap && (
                  <span className="f1-driver-gap">{driver.gap}</span>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Broadcasts */}
      {broadcasts.length > 0 && (
        <div className="match-footer">
          {broadcasts.slice(0, 4).map(b => (
            <span key={b} className="broadcast-chip">📺 {b}</span>
          ))}
        </div>
      )}
    </div>
  )
}
