import { useState } from 'react'

function TeamCell({ team }) {
  const [err, setErr] = useState(false)
  return (
    <td>
      <div className="standings-team-cell">
        {team.logo && !err ? (
          <img
            className="standings-team-logo"
            src={team.logo}
            alt={team.shortName}
            onError={() => setErr(true)}
          />
        ) : (
          <div className="standings-team-logo-placeholder">
            {team.shortName?.slice(0, 3) || '?'}
          </div>
        )}
        <span className="standings-team-name">{team.name}</span>
      </div>
    </td>
  )
}

function ConferenceTable({ entries }) {
  return (
    <div className="standings-group">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>PCT</th>
            <th>GB</th>
            <th>HOME</th>
            <th>AWAY</th>
            <th>L10</th>
            <th>STK</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row, i) => (
            <tr key={row.team.id || i}>
              <td className="standings-rank">{i + 1}</td>
              <TeamCell team={row.team} />
              <td>{row.wins}</td>
              <td>{row.losses}</td>
              <td>{row.pct}</td>
              <td>{row.gb}</td>
              <td>{row.home}</td>
              <td>{row.away}</td>
              <td>{row.last10}</td>
              <td>{row.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NBAStandings({ conferences, loading, error }) {
  const [tab, setTab] = useState(0)

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
        ⚠ Could not load standings: {error}
      </div>
    )
  }

  if (!conferences || conferences.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: 40 }}>
        <div className="empty-state-icon">📊</div>
        <h3>No standings available</h3>
      </div>
    )
  }

  return (
    <div className="standings-wrap">
      <div className="f1-standings-tabs">
        {conferences.map((conf, i) => (
          <button
            key={conf.name}
            className={`view-toggle-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
          >
            {conf.name}
          </button>
        ))}
      </div>
      <ConferenceTable entries={conferences[tab]?.entries || []} />
    </div>
  )
}
