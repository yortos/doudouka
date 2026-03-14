function PlayerFlag({ flagHref, countryAbbr }) {
  if (flagHref) {
    return (
      <img
        src={flagHref}
        alt={countryAbbr}
        style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  if (countryAbbr) {
    return (
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 28, textAlign: 'center' }}>
        {countryAbbr}
      </span>
    )
  }
  return null
}

export default function TennisRankings({ entries, loading, error }) {
  if (loading) {
    return (
      <div className="standings-wrap">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton skeleton-card" style={{ height: 200, marginBottom: 16 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-banner" style={{ marginTop: 16 }}>
        &#9888; Could not load rankings: {error}
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: 40 }}>
        <div className="empty-state-icon">&#127931;</div>
        <h3>No rankings available</h3>
      </div>
    )
  }

  return (
    <div className="standings-wrap">
      <div className="standings-group">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ textAlign: 'left' }}>Player</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row, i) => (
              <tr key={row.id || i}>
                <td className="standings-rank">{row.rank || i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlayerFlag flagHref={row.flagHref} countryAbbr={row.flagAlt || row.countryAbbr} />
                    <span className="standings-team-name">{row.name}</span>
                  </div>
                </td>
                <td className="standings-pts">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
