function TabButton({ league, activeLeague, onChange }) {
  return (
    <button
      className={`league-tab ${activeLeague === league.id ? 'active' : ''}`}
      style={{ '--league-accent': league.accentColor }}
      onClick={() => onChange(league.id)}
    >
      <span className="league-tab-flag">{league.flag}</span>
      {league.shortName}
    </button>
  )
}

export default function LeagueTabs({ leagues, activeLeague, onChange }) {
  if (!leagues || leagues.length <= 1) return null

  // Split on all dividers to get sections
  const sections = []
  let current = []
  for (const l of leagues) {
    if (l.divider) {
      sections.push(current)
      current = []
    } else {
      current.push(l)
    }
  }
  sections.push(current)

  const [domestic, cups, european] = sections

  return (
    <div className="league-tabs-wrap">
      <div className="league-tabs">
        {domestic.map(league => (
          <TabButton key={league.id} league={league} activeLeague={activeLeague} onChange={onChange} />
        ))}
      </div>
      {cups && cups.length > 0 && (
        <div className="league-tabs league-tabs-cups">
          {cups.map(league => (
            <TabButton key={league.id} league={league} activeLeague={activeLeague} onChange={onChange} />
          ))}
        </div>
      )}
      {european && european.length > 0 && (
        <div className="league-tabs league-tabs-european">
          {european.map(league => (
            <TabButton key={league.id} league={league} activeLeague={activeLeague} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  )
}
