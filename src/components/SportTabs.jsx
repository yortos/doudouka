import { useState } from 'react'
import { SPORTS } from '../sports.js'

export default function SportTabs({ activeSport, onSportChange, activeLeague, onLeagueChange, leagues }) {
  // null | 'leagues' | 'more'
  const [openSheet, setOpenSheet] = useState(null)

  const activeSportDef = SPORTS.find(s => s.id === activeSport)

  function sportHasLeagues(sport) {
    return sport.leagues && sport.leagues.filter(l => !l.divider).length > 1
  }

  function handleSportTabClick(sport) {
    if (sport.id === activeSport) {
      // Already active: toggle sheet if sport has sub-leagues, otherwise no-op
      if (sportHasLeagues(sport)) {
        setOpenSheet(prev => prev === 'leagues' ? null : 'leagues')
      }
      // NBA / F1 already active → no-op (do NOT call onSportChange)
    } else {
      // Switch to new sport, close any open sheet
      onSportChange(sport.id)
      setOpenSheet(null)
    }
  }

  function handleMoreTabClick() {
    setOpenSheet(prev => prev === 'more' ? null : 'more')
  }

  function closeSheet() {
    setOpenSheet(null)
  }

  function handleLeagueChipClick(leagueId) {
    onLeagueChange(leagueId)
    setOpenSheet(null)
  }

  // ── Legacy (list) design ──────────────────────────────────────────────────

  if (leagues) {
    return (
      <div className="sport-tabs-wrap">
        <div className="sport-tabs" role="tablist" aria-label="Sport">
          {SPORTS.map(sport => (
            <button
              key={sport.id}
              role="tab"
              aria-selected={activeSport === sport.id}
              className={`sport-tab${activeSport === sport.id ? ' active' : ''}`}
              onClick={() => onSportChange(sport.id)}
            >
              <span className="sport-tab-icon" aria-hidden="true">{sport.icon}</span>
              <span className="sport-tab-name">{sport.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Redesign (grid) design ────────────────────────────────────────────────

  return (
    <>
      {/* Bottom sheet overlay */}
      {openSheet && (
        <div className="league-sheet">
          <div className="league-sheet-backdrop" onClick={closeSheet} />
          <div className="league-sheet-panel">
            <div className="league-sheet-handle" />

            {openSheet === 'leagues' && activeSportDef && (
              <>
                <div className="league-sheet-label">{activeSportDef.name}</div>
                <div className="league-sheet-grid">
                  {activeSportDef.leagues.map(league => {
                    if (league.divider) {
                      const label = league.id === '__divider_cups__' ? 'Cups' : 'European'
                      return (
                        <div
                          key={league.id}
                          className="sidebar-section-label"
                          style={{ gridColumn: '1 / -1' }}
                        >
                          {label}
                        </div>
                      )
                    }
                    return (
                      <button
                        key={league.id}
                        className={`league-pill${activeLeague === league.id ? ' active' : ''}`}
                        onClick={() => handleLeagueChipClick(league.id)}
                      >
                        {league.flag && <span aria-hidden="true">{league.flag}</span>}{' '}
                        {league.shortName}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {openSheet === 'more' && (
              <>
                <div className="league-sheet-label">More</div>
                <div className="league-sheet-more-placeholder">More sports coming soon</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="bottom-nav" aria-label="Sport navigation">
        <div className="sport-tabs" role="tablist">
          {SPORTS.map(sport => (
            <button
              key={sport.id}
              role="tab"
              aria-selected={activeSport === sport.id}
              className={`sport-tab${activeSport === sport.id ? ' active' : ''}`}
              onClick={() => handleSportTabClick(sport)}
            >
              <span className="sport-tab-icon" aria-hidden="true">{sport.icon}</span>
              <span className="sport-tab-name">{sport.name}</span>
            </button>
          ))}
          <button
            className="sport-tab"
            role="tab"
            aria-selected={false}
            aria-expanded={openSheet === 'more'}
            onClick={handleMoreTabClick}
          >
            <span className="sport-tab-icon" aria-hidden="true" style={{ fontSize: '16px', lineHeight: '26px' }}>···</span>
            <span className="sport-tab-name">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
