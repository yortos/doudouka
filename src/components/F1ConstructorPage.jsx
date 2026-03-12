const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function PosDisplay({ pos }) {
  if (!pos || pos === 999) return <span className="f1-result-pos-na">—</span>
  return (
    <span className="f1-result-pos">
      {MEDAL[pos] ? <span>{MEDAL[pos]}</span> : <span className="f1-pos-num">{pos}</span>}
    </span>
  )
}

export default function F1ConstructorPage({ constructor: ctor, allRaces, standings, onBack, backLabel }) {
  // Find championship standing
  const standing = standings?.constructors?.find(c => c.id === ctor.id || c.name === ctor.name)
  const rank = standing?.rank || ctor.rank || null
  const totalPoints = standing?.points ?? ctor.points ?? 0
  const color = ctor.color || standing?.color || '#888'

  // Split races
  const pastRaces = []
  const upcomingRaces = []

  for (const race of allRaces) {
    if (race.statusState === 'post') {
      // Find this constructor's drivers in the race
      const teamDrivers = race.drivers.filter(d =>
        d.team === ctor.name ||
        d.teamAbbr === ctor.shortName ||
        d.team?.toLowerCase().includes(ctor.name?.toLowerCase()) ||
        ctor.name?.toLowerCase().includes(d.team?.toLowerCase())
      ).sort((a, b) => a.position - b.position)
      pastRaces.push({ race, drivers: teamDrivers })
    } else {
      upcomingRaces.push(race)
    }
  }

  pastRaces.reverse()

  return (
    <div className="f1-detail-page">
      <button className="back-btn" onClick={onBack}>{backLabel || '← Back'}</button>

      {/* Constructor header */}
      <div className="f1-detail-header">
        <div className="f1-detail-color-bar" style={{ background: color }} />
        <div className="f1-detail-header-info">
          <div className="f1-detail-name">{ctor.name}</div>
          <div className="f1-detail-sub">Constructor</div>
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

      {/* Past race results with both drivers */}
      {pastRaces.length > 0 && (
        <div className="f1-detail-section">
          <div className="section-label">Race Results</div>
          <div className="f1-result-list">
            {pastRaces.map(({ race, drivers }) => {
              const d1 = drivers[0]
              const d2 = drivers[1]
              const totalPts = drivers.reduce((sum, d) => sum + (d.points || 0), 0)
              return (
                <div key={race.id} className="f1-constructor-result-row">
                  <div className="f1-result-round">Rd {race.round}</div>
                  <div className="f1-result-race-name">{race.shortName || race.name}</div>
                  <div className="f1-constructor-drivers">
                    {d1 ? (
                      <div className="f1-constructor-driver-result">
                        <PosDisplay pos={d1.position} />
                        <span className="f1-constructor-driver-name">{d1.shortName || d1.name}</span>
                        {d1.points > 0 && <span className="f1-result-points">+{d1.points}</span>}
                      </div>
                    ) : <div className="f1-constructor-driver-result"><PosDisplay pos={null} /></div>}
                    {d2 ? (
                      <div className="f1-constructor-driver-result">
                        <PosDisplay pos={d2.position} />
                        <span className="f1-constructor-driver-name">{d2.shortName || d2.name}</span>
                        {d2.points > 0 && <span className="f1-result-points">+{d2.points}</span>}
                      </div>
                    ) : <div className="f1-constructor-driver-result"><PosDisplay pos={null} /></div>}
                  </div>
                  {totalPts > 0 && <div className="f1-constructor-race-total">{totalPts} pts</div>}
                </div>
              )
            })}
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
