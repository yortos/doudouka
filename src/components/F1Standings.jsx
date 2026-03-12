import { useState } from 'react'

function DriverRow({ entry, rank, onDriverClick }) {
  return (
    <tr
      className={`standings-row-clickable`}
      onClick={() => onDriverClick?.(entry)}
    >
      <td className="standings-rank">{rank}</td>
      <td>
        <div className="f1-standings-athlete-cell">
          {entry.flag && (
            <img
              className="f1-driver-flag"
              src={entry.flag}
              alt={entry.flagAlt}
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <div>
            <div className="f1-standings-name">{entry.name}</div>
            <div className="f1-standings-sub">{entry.team}</div>
          </div>
        </div>
      </td>
      <td className="standings-pts">{entry.points}</td>
    </tr>
  )
}

function ConstructorRow({ entry, rank, onConstructorClick }) {
  return (
    <tr
      className="standings-row-clickable"
      onClick={() => onConstructorClick?.(entry)}
    >
      <td className="standings-rank">{rank}</td>
      <td>
        <div className="f1-standings-athlete-cell">
          <div
            className="f1-constructor-color-swatch"
            style={{ background: entry.color || '#888' }}
          />
          <div className="f1-standings-name">{entry.name}</div>
        </div>
      </td>
      <td className="standings-pts">{entry.points}</td>
    </tr>
  )
}

export default function F1Standings({ standings, loading, error, onDriverClick, onConstructorClick }) {
  const [tab, setTab] = useState('drivers')

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

  if (!standings) return null

  const { drivers, constructors } = standings

  return (
    <div className="standings-wrap">
      <div className="f1-standings-tabs">
        <button
          className={`view-toggle-btn ${tab === 'drivers' ? 'active' : ''}`}
          onClick={() => setTab('drivers')}
        >
          Drivers
        </button>
        <button
          className={`view-toggle-btn ${tab === 'constructors' ? 'active' : ''}`}
          onClick={() => setTab('constructors')}
        >
          Constructors
        </button>
      </div>

      {tab === 'drivers' && (
        <div className="standings-group">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Driver</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => (
                <DriverRow
                  key={d.id || i}
                  entry={d}
                  rank={d.rank || i + 1}
                  onDriverClick={onDriverClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'constructors' && (
        <div className="standings-group">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Constructor</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((c, i) => (
                <ConstructorRow
                  key={c.id || i}
                  entry={c}
                  rank={c.rank || i + 1}
                  onConstructorClick={onConstructorClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
