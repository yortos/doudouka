import { useState } from 'react'

// Zone highlighting for top leagues (PL, La Liga, Bundesliga, Serie A)
// Positions: 1-4 = UCL, 5 = UEL, 6 = UECL, 18-20 = Relegation
function getZoneClass(rank, totalTeams) {
  if (rank <= 4) return 'zone-cl'
  if (rank === 5) return 'zone-uel'
  if (rank === 6) return 'zone-uecl'
  if (totalTeams >= 18 && rank > totalTeams - 3) return 'zone-relegation'
  return ''
}

function GDCell({ value, display }) {
  const cls = value > 0 ? 'standings-gd-pos' : value < 0 ? 'standings-gd-neg' : 'standings-gd-zero'
  return <td className={cls}>{display}</td>
}

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

function StandingsGroup({ group, showGroupName, onTeamClick }) {
  const { name, entries } = group
  const total = entries.length

  return (
    <div className="standings-group">
      {showGroupName && name && (
        <div className="standings-group-name">Group {name}</div>
      )}
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>GP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row, i) => {
            const rank = i + 1
            const zoneClass = showGroupName ? '' : getZoneClass(rank, total)
            return (
              <tr
                key={row.team.id || i}
                className={`${zoneClass} standings-row-clickable`}
                onClick={() => onTeamClick?.(row.team)}
              >
                <td className="standings-rank">{rank}</td>
                <TeamCell team={row.team} />
                <td>{row.gp}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.gf}</td>
                <td>{row.ga}</td>
                <GDCell value={row.gd} display={row.gdDisplay} />
                <td className="standings-pts">{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Standings({ groups, loading, error, onTeamClick }) {
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

  if (!groups || groups.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: 40 }}>
        <div className="empty-state-icon">📊</div>
        <h3>No standings available</h3>
        <p>Standings may not be available for this competition or phase.</p>
      </div>
    )
  }

  const isGrouped = groups.length > 1
  return (
    <div className="standings-wrap">
      {/* Zone legend for non-grouped leagues */}
      {!isGrouped && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { cls: 'zone-cl', label: 'Champions League' },
            { cls: 'zone-uel', label: 'Europa League' },
            { cls: 'zone-uecl', label: 'Conference League' },
            { cls: 'zone-relegation', label: 'Relegation' },
          ].map(({ cls, label }) => (
            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div
                style={{
                  width: 3,
                  height: 14,
                  background: cls === 'zone-cl' ? '#00a0b0'
                    : cls === 'zone-uel' ? '#eb6841'
                    : cls === 'zone-uecl' ? '#edc951'
                    : '#cc2a36',
                  borderRadius: 2,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {groups.map((group, i) => (
        <StandingsGroup key={group.name || i} group={group} showGroupName={isGrouped} onTeamClick={onTeamClick} />
      ))}
    </div>
  )
}
