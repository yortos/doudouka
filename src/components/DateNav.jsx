export default function DateNav({ date, onChange }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const current = new Date(date)
  current.setHours(0, 0, 0, 0)
  const isToday = current.getTime() === today.getTime()

  function shift(days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    onChange(d)
  }

  function goToday() {
    onChange(new Date())
  }

  const label = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="date-nav">
      <button className="date-nav-btn" onClick={() => shift(-1)} title="Previous day">
        ‹
      </button>
      <span className="date-nav-label">{label}</span>
      <button className="date-nav-btn" onClick={() => shift(1)} title="Next day">
        ›
      </button>
      {!isToday && (
        <button className="date-today-btn" onClick={goToday}>
          Today
        </button>
      )}
    </div>
  )
}
