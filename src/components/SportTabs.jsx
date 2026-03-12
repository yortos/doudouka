import { SPORTS } from '../sports.js'

export default function SportTabs({ activeSport, onChange }) {
  return (
    <div className="sport-tabs-wrap">
      <div className="sport-tabs">
        {SPORTS.map(sport => (
          <button
            key={sport.id}
            className={`sport-tab ${activeSport === sport.id ? 'active' : ''}`}
            onClick={() => onChange(sport.id)}
          >
            <span className="sport-tab-icon">{sport.icon}</span>
            {sport.name}
          </button>
        ))}
      </div>
    </div>
  )
}
