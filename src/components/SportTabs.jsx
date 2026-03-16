import { SPORTS } from '../sports.js'

export default function SportTabs({ activeSport, onSportChange, activeLeague, onLeagueChange, leagues }) {
  const showLeagues = leagues && leagues.length > 1
  return (
    <nav className="bottom-nav" aria-label="Sport and league navigation">
      {showLeagues && (
        <div className="league-strip" role="tablist" aria-label="League">
          {leagues.map(league => (
            <button
              key={league.id}
              role="tab"
              aria-selected={activeLeague === league.id}
              className={`league-pill${activeLeague === league.id ? ' active' : ''}`}
              onClick={() => onLeagueChange(league.id)}
            >
              {league.flag && <span aria-hidden="true">{league.flag}</span>} {league.shortName}
            </button>
          ))}
        </div>
      )}
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
    </nav>
  )
}
