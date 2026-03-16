import { useState, useEffect, useCallback, useRef } from 'react'
import Header from './components/Header.jsx'
import SportTabs from './components/SportTabs.jsx'
import DateNav from './components/DateNav.jsx'
import MatchCard from './components/MatchCard.jsx'
import TennisCard from './components/TennisCard.jsx'
import F1Card from './components/F1Card.jsx'
import F1Standings from './components/F1Standings.jsx'
import NBAStandings from './components/NBAStandings.jsx'
import F1DriverPage from './components/F1DriverPage.jsx'
import F1ConstructorPage from './components/F1ConstructorPage.jsx'
import MatchModal from './components/MatchModal.jsx'
import Standings from './components/Standings.jsx'
import TeamPage from './components/TeamPage.jsx'
import TennisRankings from './components/TennisRankings.jsx'
import {
  fetchScoreboard, fetchStandings,
  fetchNBAScoreboard, fetchNBAStandings, fetchTennisScoreboard, fetchTennisRankings, fetchF1Scoreboard, fetchF1Standings,
} from './api.js'
import { FETCHABLE_LEAGUES, getSport } from './sports.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupMatchesByStatus(matches) {
  const live = matches.filter(m => m.statusState === 'in')
  const finished = matches.filter(m => m.statusState === 'post')
  const upcoming = matches.filter(m => m.statusState === 'pre')
  return { live, finished, upcoming }
}

function dateCacheKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function SkeletonCards() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeSport, setActiveSport] = useState('soccer')
  const [activeLeague, setActiveLeague] = useState('all')
  const [activeView, setActiveView] = useState('matches') // 'matches' | 'standings' | 'team' | 'f1-driver' | 'f1-constructor'
  const [selectedTeam, setSelectedTeam] = useState(null)  // { team, leagueId }
  const [teamBackView, setTeamBackView] = useState('standings')

  // F1-specific state
  const [f1Standings, setF1Standings] = useState(null)
  const [loadingF1Standings, setLoadingF1Standings] = useState(false)
  const [f1StandingsError, setF1StandingsError] = useState(null)
  const [selectedF1Driver, setSelectedF1Driver] = useState(null)
  const [selectedF1Constructor, setSelectedF1Constructor] = useState(null)
  const [f1PageBackView, setF1PageBackView] = useState('matches')

  // NBA standings state
  const [nbaStandings, setNBAStandings] = useState(null)
  const [loadingNBAStandings, setLoadingNBAStandings] = useState(false)
  const [nbaStandingsError, setNBAStandingsError] = useState(null)

  // Tennis rankings state (keyed by league id: 'atp' | 'wta')
  const [tennisRankingsCache, setTennisRankingsCache] = useState({})
  const [loadingTennisRankings, setLoadingTennisRankings] = useState(false)
  const [tennisRankingsError, setTennisRankingsError] = useState(null)
  const [activeTennisRankingsTab, setActiveTennisRankingsTab] = useState('atp')

  const [date, setDate] = useState(new Date())

  // Soccer caches
  const [matchCache, setMatchCache] = useState({})
  const [standingsCache, setStandingsCache] = useState({})

  // Other sports cache (key: `${sport}-${leagueId}-${dateStr}` or `f1`)
  const [otherCache, setOtherCache] = useState({})

  const [loadingMatches, setLoadingMatches] = useState(false)
  const [loadingStandings, setLoadingStandings] = useState(false)
  const [matchError, setMatchError] = useState(null)
  const [standingsError, setStandingsError] = useState(null)
  const [otherLoading, setOtherLoading] = useState(false)
  const [otherError, setOtherError] = useState(null)

  const [selectedMatch, setSelectedMatch] = useState(null)
  const [noSpoilers, setNoSpoilers] = useState(() => localStorage.getItem('noSpoilers') !== '0')

  const refreshRef = useRef(null)

  // ─── Sport switching ──────────────────────────────────────────────────────

  function handleSportChange(sportId) {
    const sport = getSport(sportId)
    setActiveSport(sportId)
    setActiveLeague(sport?.defaultLeague || 'all')
    setActiveView('matches')
    setSelectedTeam(null)
    setSelectedF1Driver(null)
    setSelectedF1Constructor(null)
    setMatchError(null)
    setOtherError(null)
  }

  function handleLeagueChange(leagueId) {
    setActiveLeague(leagueId)
    setActiveView('matches')
  }

  // ─── F1 standings fetch ───────────────────────────────────────────────────

  const loadF1Standings = useCallback(async () => {
    if (f1Standings) return
    setLoadingF1Standings(true)
    setF1StandingsError(null)
    try {
      const data = await fetchF1Standings()
      setF1Standings(data)
    } catch (err) {
      setF1StandingsError(err.message)
    } finally {
      setLoadingF1Standings(false)
    }
  }, [f1Standings])

  // ─── Tennis rankings fetch ────────────────────────────────────────────────

  const loadTennisRankings = useCallback(async (leagueId) => {
    if (tennisRankingsCache[leagueId]) return
    setLoadingTennisRankings(true)
    setTennisRankingsError(null)
    try {
      const data = await fetchTennisRankings(leagueId)
      setTennisRankingsCache(prev => ({ ...prev, [leagueId]: data }))
    } catch (err) {
      setTennisRankingsError(err.message)
    } finally {
      setLoadingTennisRankings(false)
    }
  }, [tennisRankingsCache])

  // ─── NBA standings fetch ──────────────────────────────────────────────────

  const loadNBAStandings = useCallback(async () => {
    if (nbaStandings) return
    setLoadingNBAStandings(true)
    setNBAStandingsError(null)
    try {
      const data = await fetchNBAStandings()
      setNBAStandings(data)
    } catch (err) {
      setNBAStandingsError(err.message)
    } finally {
      setLoadingNBAStandings(false)
    }
  }, [nbaStandings])

  // ─── Soccer fetch ─────────────────────────────────────────────────────────

  function matchKey(leagueId, d) {
    return `${leagueId}-${dateCacheKey(d)}`
  }

  const loadMatches = useCallback(async (leagueId, forDate, forceRefresh = false) => {
    const leaguesToFetch = leagueId === 'all' ? FETCHABLE_LEAGUES : [{ id: leagueId }]
    const toFetch = leaguesToFetch.filter(l => forceRefresh || !matchCache[matchKey(l.id, forDate)])

    if (toFetch.length === 0) return

    setLoadingMatches(true)
    setMatchError(null)

    try {
      const results = await Promise.allSettled(
        toFetch.map(l => fetchScoreboard(l.id, forDate))
      )
      const newCache = { ...matchCache }
      results.forEach((result, i) => {
        const lid = toFetch[i].id
        const key = matchKey(lid, forDate)
        if (result.status === 'fulfilled') {
          newCache[key] = result.value
        } else {
          newCache[key] = newCache[key] || []
          console.warn(`Failed to fetch ${lid}:`, result.reason)
        }
      })
      setMatchCache(newCache)
      if (results.every(r => r.status === 'rejected')) setMatchError('Could not load matches. Please try again.')
    } catch (err) {
      setMatchError(err.message)
    } finally {
      setLoadingMatches(false)
    }
  }, [matchCache])

  // ─── Soccer standings ─────────────────────────────────────────────────────

  const loadStandings = useCallback(async (leagueId) => {
    if (leagueId === 'all') return
    if (standingsCache[leagueId]) return

    setLoadingStandings(true)
    setStandingsError(null)

    try {
      const groups = await fetchStandings(leagueId)
      setStandingsCache(prev => ({ ...prev, [leagueId]: groups }))
    } catch (err) {
      setStandingsError(err.message)
    } finally {
      setLoadingStandings(false)
    }
  }, [standingsCache])

  // ─── Other sports fetch ───────────────────────────────────────────────────

  const loadOtherSport = useCallback(async (sport, leagueId, forDate, forceRefresh = false) => {
    const key = sport === 'f1' ? 'f1' : `${sport}-${leagueId}-${dateCacheKey(forDate)}`
    if (!forceRefresh && otherCache[key] !== undefined) return

    setOtherLoading(true)
    setOtherError(null)

    try {
      let data
      if (sport === 'basketball') data = await fetchNBAScoreboard(forDate)
      else if (sport === 'tennis' && leagueId === 'combined') {
        const [atp, wta] = await Promise.all([
          fetchTennisScoreboard('atp', forDate),
          fetchTennisScoreboard('wta', forDate),
        ])
        data = [...atp, ...wta].sort((a, b) => (a.date || 0) - (b.date || 0))
      }
      else if (sport === 'tennis') data = await fetchTennisScoreboard(leagueId, forDate)
      else if (sport === 'f1') data = await fetchF1Scoreboard()
      setOtherCache(prev => ({ ...prev, [key]: data || [] }))
    } catch (err) {
      setOtherError(err.message)
      setOtherCache(prev => ({ ...prev, [key]: [] }))
    } finally {
      setOtherLoading(false)
    }
  }, [otherCache])

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeSport === 'soccer') {
      loadMatches(activeLeague, date)
    } else {
      loadOtherSport(activeSport, activeLeague, date)
    }
  }, [activeSport, activeLeague, date]) // eslint-disable-line

  useEffect(() => {
    if (activeView === 'standings' && activeLeague !== 'all' && activeSport === 'soccer') {
      loadStandings(activeLeague)
    }
    if (activeView === 'standings' && activeSport === 'f1') {
      loadF1Standings()
    }
    if (activeView === 'standings' && activeSport === 'basketball') {
      loadNBAStandings()
    }
    if (activeView === 'standings' && activeSport === 'tennis') {
      loadTennisRankings(activeTennisRankingsTab)
    }
  }, [activeView, activeLeague, activeSport, activeTennisRankingsTab]) // eslint-disable-line

  // Auto-refresh every 60s for today's matches
  useEffect(() => {
    const todayStr = dateCacheKey(new Date())
    const viewingToday = dateCacheKey(date) === todayStr
    if (viewingToday && activeView === 'matches') {
      refreshRef.current = setInterval(() => {
        if (activeSport === 'soccer') loadMatches(activeLeague, date, true)
        else loadOtherSport(activeSport, activeLeague, date, true)
      }, 60_000)
    }
    return () => clearInterval(refreshRef.current)
  }, [activeSport, activeLeague, date, activeView]) // eslint-disable-line

  // ─── Derived data ─────────────────────────────────────────────────────────

  function getSoccerMatches() {
    if (activeLeague === 'all') {
      return FETCHABLE_LEAGUES.flatMap(l => matchCache[matchKey(l.id, date)] || [])
        .sort((a, b) => a.date - b.date)
    }
    return matchCache[matchKey(activeLeague, date)] || []
  }

  const otherKey = activeSport === 'f1' ? 'f1' : `${activeSport}-${activeLeague}-${dateCacheKey(date)}`

  function getOtherMatches() {
    return otherCache[otherKey] || []
  }

  const isSoccer = activeSport === 'soccer'
  const displayMatches = isSoccer ? getSoccerMatches() : getOtherMatches()
  const { live, finished, upcoming } = groupMatchesByStatus(displayMatches)

  const currentStandings = standingsCache[activeLeague]
  const hasSoccerCache = activeLeague === 'all'
    ? FETCHABLE_LEAGUES.some(l => matchCache[matchKey(l.id, date)])
    : !!matchCache[matchKey(activeLeague, date)]
  const hasAnyCache = isSoccer ? hasSoccerCache : (otherKey in otherCache)

  const isLoading = isSoccer ? loadingMatches : otherLoading
  const error = isSoccer ? matchError : otherError

  // Current sport definition
  const sportDef = getSport(activeSport)

  // ─── Team click handler ───────────────────────────────────────────────────

  function handleTeamClick(team, leagueId, fromView = 'matches') {
    setSelectedTeam({ team, leagueId })
    setTeamBackView(fromView)
    setActiveView('team')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Header action={activeView === 'matches' && sportDef?.hasDateNav
        ? <DateNav date={date} onChange={setDate} />
        : null
      } />

      {/* Sport selector + league pills */}
      <SportTabs
        activeSport={activeSport}
        onSportChange={handleSportChange}
        activeLeague={activeLeague}
        onLeagueChange={handleLeagueChange}
        leagues={sportDef?.leagues}
      />

      {/* No Spoilers card */}
      <div
        className={`ns-card ${noSpoilers ? 'on' : ''}`}
        onClick={() => {
          const next = !noSpoilers
          setNoSpoilers(next)
          localStorage.setItem('noSpoilers', next ? '1' : '0')
        }}
        role="switch"
        aria-checked={noSpoilers}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const next = !noSpoilers; setNoSpoilers(next); localStorage.setItem('noSpoilers', next ? '1' : '0') } }}
      >
        <div className="ns-card-text">
          <span className={`ns-card-title ${noSpoilers ? 'on' : 'off'}`}>
            {noSpoilers ? 'Spoilers Off — Scores Hidden' : 'Spoiler Alert — Scores Showing'}
          </span>
          <span className="ns-card-subtitle">
            {noSpoilers ? 'Tap to reveal scores and results' : 'Tap to hide scores and results'}
          </span>
        </div>
        <div className={`ns-toggle-track ${noSpoilers ? 'on' : ''}`}>
          <div className="ns-toggle-thumb" />
        </div>
      </div>

      <div className="main-content">
        {/* View toggle (only soccer supports standings + team views) */}
        <div style={{ display: ['team', 'f1-driver', 'f1-constructor'].includes(activeView) ? 'none' : 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${activeView === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveView('matches')}
            >
              {activeSport === 'f1' ? 'Races' : 'Matches'}
            </button>
            {((isSoccer && activeLeague !== 'all') || activeSport === 'f1' || activeSport === 'basketball') && (
              <button
                className={`view-toggle-btn ${activeView === 'standings' ? 'active' : ''}`}
                onClick={() => setActiveView('standings')}
              >
                Standings
              </button>
            )}
            {activeSport === 'tennis' && (
              <button
                className={`view-toggle-btn ${activeView === 'standings' ? 'active' : ''}`}
                onClick={() => setActiveView('standings')}
              >
                Rankings
              </button>
            )}
          </div>
        </div>

        {/* ── Matches View ── */}
        {activeView === 'matches' && (
          <>
            {error && !hasAnyCache && (
              <div className="error-banner">&#9888; {error}</div>
            )}

            {isLoading && !hasAnyCache && <SkeletonCards />}

            {!isLoading && hasAnyCache && displayMatches.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">&#128197;</div>
                <h3>No matches scheduled</h3>
                <p>There are no matches on this date for the selected competition.</p>
              </div>
            )}

            {/* F1: show upcoming/live/finished races without date nav */}
            {activeSport === 'f1' && displayMatches.length > 0 && (
              <>
                {live.length > 0 && (
                  <>
                    <div className="section-label">Live</div>
                    <div className="match-list">
                      {live.map(r => <F1Card key={r.id} race={r} noSpoilers={noSpoilers} onDriverClick={d => { setSelectedF1Driver(d); setF1PageBackView('matches'); setActiveView('f1-driver') }} />)}
                    </div>
                  </>
                )}
                {(() => {
                  const in14Days = Date.now() + 14 * 24 * 60 * 60 * 1000
                  const soonRaces = upcoming.filter(r => r.date <= in14Days)
                  return soonRaces.length > 0 && (
                    <>
                      <div className="section-label">Upcoming Races</div>
                      <div className="match-list">
                        {soonRaces.map(r => <F1Card key={r.id} race={r} noSpoilers={noSpoilers} onDriverClick={d => { setSelectedF1Driver(d); setF1PageBackView('matches'); setActiveView('f1-driver') }} />)}
                      </div>
                    </>
                  )
                })()}
                {finished.length > 0 && (
                  <>
                    <div className="section-label">Past Races</div>
                    <div className="match-list">
                      {finished.map(r => <F1Card key={r.id} race={r} noSpoilers={noSpoilers} onDriverClick={d => { setSelectedF1Driver(d); setF1PageBackView('matches'); setActiveView('f1-driver') }} />)}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Tennis cards */}
            {activeSport === 'tennis' && displayMatches.length > 0 && (
              <>
                {live.length > 0 && (
                  <>
                    <div className="section-label">Live</div>
                    <div className="match-list">
                      {live.map(m => <TennisCard key={m.id} match={m} noSpoilers={noSpoilers} />)}
                    </div>
                  </>
                )}
                {upcoming.length > 0 && (
                  <>
                    <div className="section-label">Upcoming</div>
                    <div className="match-list">
                      {upcoming.map(m => <TennisCard key={m.id} match={m} noSpoilers={noSpoilers} />)}
                    </div>
                  </>
                )}
                {finished.length > 0 && (
                  <>
                    <div className="section-label">Results</div>
                    <div className="match-list">
                      {finished.map(m => <TennisCard key={m.id} match={m} noSpoilers={noSpoilers} />)}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Soccer + NBA: standard match cards */}
            {(isSoccer || activeSport === 'basketball') && (
              <>
                {live.length > 0 && (
                  <>
                    <div className="section-label">Live Now</div>
                    <div className="match-grid">
                      {live.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          noSpoilers={noSpoilers}
                          onClick={() => setSelectedMatch(m)}
                          onTeamClick={isSoccer ? (team) => handleTeamClick(team, m.leagueId, 'matches') : null}
                        />
                      ))}
                    </div>
                  </>
                )}

                {upcoming.length > 0 && (
                  <>
                    <div className="section-label">Upcoming</div>
                    <div className="match-grid">
                      {upcoming.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          noSpoilers={noSpoilers}
                          onClick={() => setSelectedMatch(m)}
                          onTeamClick={isSoccer ? (team) => handleTeamClick(team, m.leagueId, 'matches') : null}
                        />
                      ))}
                    </div>
                  </>
                )}

                {finished.length > 0 && (
                  <>
                    <div className="section-label">Results</div>
                    <div className="match-grid">
                      {finished.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          noSpoilers={noSpoilers}
                          onClick={() => setSelectedMatch(m)}
                          onTeamClick={isSoccer ? (team) => handleTeamClick(team, m.leagueId, 'matches') : null}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── Team View ── */}
        {activeView === 'team' && selectedTeam && (
          <TeamPage
            team={selectedTeam.team}
            leagueId={selectedTeam.leagueId}
            backLabel={teamBackView === 'standings' ? '← Standings' : '← Matches'}
            onBack={() => {
              setActiveView(teamBackView)
              setSelectedTeam(null)
            }}
            onMatchClick={setSelectedMatch}
            onTeamClick={(t, lid) => handleTeamClick(t, lid, 'matches')}
          />
        )}

        {/* ── Standings View ── */}
        {activeView === 'standings' && isSoccer && (
          <>
            {activeLeague === 'all' ? (
              <div className="empty-state" style={{ paddingTop: 40 }}>
                <div className="empty-state-icon">&#128202;</div>
                <h3>Select a league</h3>
                <p>Choose a specific league to see the standings table.</p>
              </div>
            ) : (
              <Standings
                groups={currentStandings}
                loading={loadingStandings && !currentStandings}
                error={standingsError}
                onTeamClick={team => {
                  setSelectedTeam({ team, leagueId: activeLeague })
                  setTeamBackView('standings')
                  setActiveView('team')
                }}
              />
            )}
          </>
        )}

        {/* ── F1 Standings View ── */}
        {activeView === 'standings' && activeSport === 'f1' && (
          <F1Standings
            standings={f1Standings}
            loading={loadingF1Standings && !f1Standings}
            error={f1StandingsError}
            onDriverClick={driver => {
              setSelectedF1Driver(driver)
              setF1PageBackView('standings')
              setActiveView('f1-driver')
            }}
            onConstructorClick={ctor => {
              setSelectedF1Constructor(ctor)
              setF1PageBackView('standings')
              setActiveView('f1-constructor')
            }}
          />
        )}

        {/* ── Tennis Rankings View ── */}
        {activeView === 'standings' && activeSport === 'tennis' && (
          <>
            <div className="view-toggle" style={{ marginBottom: 12 }}>
              <button
                className={`view-toggle-btn ${activeTennisRankingsTab === 'atp' ? 'active' : ''}`}
                onClick={() => setActiveTennisRankingsTab('atp')}
              >
                ATP
              </button>
              <button
                className={`view-toggle-btn ${activeTennisRankingsTab === 'wta' ? 'active' : ''}`}
                onClick={() => setActiveTennisRankingsTab('wta')}
              >
                WTA
              </button>
            </div>
            <TennisRankings
              entries={tennisRankingsCache[activeTennisRankingsTab]}
              loading={loadingTennisRankings && !tennisRankingsCache[activeTennisRankingsTab]}
              error={tennisRankingsError}
            />
          </>
        )}

        {/* ── NBA Standings View ── */}
        {activeView === 'standings' && activeSport === 'basketball' && (
          <NBAStandings
            conferences={nbaStandings}
            loading={loadingNBAStandings && !nbaStandings}
            error={nbaStandingsError}
          />
        )}

        {/* ── F1 Driver View ── */}
        {activeView === 'f1-driver' && selectedF1Driver && (
          <F1DriverPage
            driver={selectedF1Driver}
            allRaces={otherCache['f1'] || []}
            standings={f1Standings}
            backLabel={f1PageBackView === 'standings' ? '← Standings' : '← Races'}
            onBack={() => {
              setActiveView(f1PageBackView)
              setSelectedF1Driver(null)
            }}
          />
        )}

        {/* ── F1 Constructor View ── */}
        {activeView === 'f1-constructor' && selectedF1Constructor && (
          <F1ConstructorPage
            constructor={selectedF1Constructor}
            allRaces={otherCache['f1'] || []}
            standings={f1Standings}
            backLabel={f1PageBackView === 'standings' ? '← Standings' : '← Races'}
            onBack={() => {
              setActiveView(f1PageBackView)
              setSelectedF1Constructor(null)
            }}
          />
        )}
      </div>

      {/* Match detail modal (soccer only) */}
      {selectedMatch && isSoccer && (
        <MatchModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onTeamClick={team => {
            setSelectedMatch(null)
            handleTeamClick(team, selectedMatch.leagueId, 'matches')
          }}
        />
      )}
    </div>
  )
}
