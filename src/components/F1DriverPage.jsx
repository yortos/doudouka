const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function PositionBadge({ pos }) {
  return (
    <span className="f1-result-pos">
      {MEDAL[pos] ? <span>{MEDAL[pos]}</span> : <span className="f1-pos-num">{pos}</span>}
    </span>
  )
}

export default function F1DriverPage({ driver, allRaces, standings, onBack, backLabel }) {
  // Find championship standing for this driver
  const standing = standings?.drivers?.find(d => d.id === driver.id)
  const rank = standing?.rank || null
  const totalPoints = standing?.points ?? driver.points ?? 0

  // Split races into past (post) and upcoming (pre/in)
  const pastRaces = []
  const upcomingRaces = []

  for (const race of allRaces) {
    const driverInRace = race.drivers.find(d => d.id === driver.id)
    if (race.statusState === 'post') {
      if (driverInRace) {
        pastRaces.push({ race, result: driverInRace })
      }
    } else {
      upcomingRaces.push(race)
    }
  }

  // Newest first for past races
  pastRaces.reverse()

  return (
    <div className="f1-detail-page">
      {/* Back button */}
      <button className="back-btn" onClick={onBack}>{backLabel || '← Back'}</button>

      {/* Driver header */}
      <div className="f1-detail-header">
        {driver.flagHref && (
          <img
            className="f1-detail-flag"
            src={driver.flagHref}
            alt={driver.flagAlt || ''}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div className="f1-detail-header-info">
          <div className="f1-detail-name">{driver.name}</div>
          <div className="f1-detail-sub">{driver.team}</div>
        </div>
        <div className="f1-detail-stats">
          {rank && <div className="f1-detail-stat"><span className="f1-detail-stat-val">{ordinal(rank)}</span><span className="f1-detail-stat-label">Championship</span></div>}
          <div className="f1-detail-stat"><span className="f1-detail-stat-val">{totalPoints}</span><span className="f1-detail-stat-label">Points</span></div>
        </div>
      </div>

      {/* Upcoming races */}
      {upcomingRaces.length > 0 && (
        <div className="f1-detail-section">
          <div className="section-label">Upcoming Races</div>
          <div className="f1-result-list">
            {upcomingRaces.map(race => (
              <div key={race.id} className="f1-result-row f1-result-upcoming">
                <div className="f1-result-round">Rd {race.round}</div>
                <div className="f1-result-race-name">{race.shortName || race.name}</div>
                <div className="f1-result-date">{formatDate(race.date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past results */}
      {pastRaces.length > 0 && (
        <div className="f1-detail-section">
          <div className="section-label">Race Results</div>
          <div className="f1-result-list">
            {pastRaces.map(({ race, result }) => (
              <div key={race.id} className="f1-result-row">
                <div className="f1-result-round">Rd {race.round}</div>
                <div className="f1-result-race-name">{race.shortName || race.name}</div>
                <PositionBadge pos={result.position} />
                {result.points != null && result.points > 0 && (
                  <div className="f1-result-points">+{result.points} pts</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pastRaces.length === 0 && upcomingRaces.length === 0 && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-state-icon">🏎️</div>
          <h3>No race data yet</h3>
          <p>Results will appear once the season begins.</p>
        </div>
      )}
    </div>
  )
}
