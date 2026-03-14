export default function Header() {
  const now = new Date()
  const label = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <img src="/apple-touch-icon.png" alt="" className="header-logo-icon" />
          Matchboard
        </div>
        <div className="header-date">{label}</div>
      </div>
    </header>
  )
}
