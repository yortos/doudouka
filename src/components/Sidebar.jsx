import { useState } from 'react'
import { SPORTS } from '../sports.js'

export default function Sidebar({ activeSport, onSportChange, activeLeague, onLeagueChange }) {
  // Track which sport accordion is open. Initialise to the active sport so its
  // leagues are visible on first render.
  const [expandedSport, setExpandedSport] = useState(activeSport)

  function handleSportClick(sport) {
    const hasLeagues = sport.leagues && sport.leagues.filter(l => !l.divider).length > 1

    if (hasLeagues) {
      // Toggle accordion; also switch sport if it wasn't already active
      const willExpand = expandedSport !== sport.id
      setExpandedSport(willExpand ? sport.id : null)
      if (sport.id !== activeSport) {
        onSportChange(sport.id)
      }
    } else {
      // No sub-leagues — direct switch, no accordion change
      if (sport.id !== activeSport) {
        onSportChange(sport.id)
      }
      // else: already active with no leagues → no-op
    }
  }

  function handleLeagueClick(sport, league) {
    if (sport.id !== activeSport) {
      onSportChange(sport.id)
    }
    onLeagueChange(league.id)
  }

  return (
    <aside className="sidebar" aria-label="Navigation">
      {SPORTS.map(sport => {
        const hasLeagues = sport.leagues && sport.leagues.filter(l => !l.divider).length > 1
        const isExpanded = expandedSport === sport.id
        const isActive = activeSport === sport.id

        return (
          <div key={sport.id}>
            <button
              className={`sidebar-sport${isActive ? ' active' : ''}`}
              onClick={() => handleSportClick(sport)}
              aria-expanded={hasLeagues ? isExpanded : undefined}
            >
              <span className="sidebar-sport-icon" aria-hidden="true">{sport.icon}</span>
              <span className="sidebar-sport-name">{sport.name}</span>
              {hasLeagues && (
                <span className={`sidebar-chevron${isExpanded ? ' expanded' : ''}`} aria-hidden="true">
                  ›
                </span>
              )}
            </button>

            {hasLeagues && isExpanded && (
              <div className="sidebar-leagues">
                {sport.leagues.map(league => {
                  if (league.divider) {
                    const label = league.id === '__divider_cups__' ? 'Cups' : 'European'
                    return (
                      <div key={league.id} className="sidebar-section-label">{label}</div>
                    )
                  }
                  const isActiveLeague = isActive && activeLeague === league.id
                  return (
                    <button
                      key={league.id}
                      className={`sidebar-league${isActiveLeague ? ' active' : ''}`}
                      onClick={() => handleLeagueClick(sport, league)}
                    >
                      {league.flag && (
                        <span className="sidebar-league-flag" aria-hidden="true">{league.flag}</span>
                      )}
                      <span className="sidebar-league-name">{league.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="sidebar-divider" />
          </div>
        )
      })}

      {/* More — placeholder for future sports */}
      <div>
        <button className="sidebar-sport" disabled style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="sidebar-sport-icon" aria-hidden="true" style={{ fontSize: '14px' }}>···</span>
          <span className="sidebar-sport-name">More</span>
          <span className="sidebar-chevron" aria-hidden="true">›</span>
        </button>
        <div className="sidebar-leagues">
          <div className="sidebar-section-label" style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
            More sports coming soon
          </div>
        </div>
      </div>
    </aside>
  )
}
