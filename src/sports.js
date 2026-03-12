// ─── Soccer Leagues ────────────────────────────────────────────────────────────
export const SOCCER_LEAGUES = [
  {
    id: 'all', sport: 'soccer',
    name: 'All Leagues', shortName: 'All', flag: '\uD83C\uDF0D',
    primaryColor: '#1a100a', accentColor: '#00a0b0', knownBroadcasts: null,
  },
  {
    id: 'gre.1', sport: 'soccer',
    name: 'Super League', shortName: 'SL GR', country: 'Greece', flag: '\uD83C\uDDEC\uD83C\uDDF7',
    primaryColor: '#0D5EAF', accentColor: '#FFFFFF',
    knownBroadcasts: null,
  },
  {
    id: 'eng.1', sport: 'soccer',
    name: 'Premier League', shortName: 'PL', country: 'England', flag: '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F',
    primaryColor: '#38003c', accentColor: '#edc951',
    knownBroadcasts: { tv: ['NBC', 'USA Network', 'Telemundo'], streaming: ['Peacock', 'Fubo TV'] },
  },
  {
    id: 'esp.1', sport: 'soccer',
    name: 'La Liga', shortName: 'LaLiga', country: 'Spain', flag: '\uD83C\uDDEA\uD83C\uDDF8',
    primaryColor: '#190047', accentColor: '#eb6841',
    knownBroadcasts: { tv: ['ESPN', 'ESPN2', 'ESPN Deportes'], streaming: ['ESPN+', 'Fubo TV'] },
  },
  {
    id: 'ger.1', sport: 'soccer',
    name: 'Bundesliga', shortName: 'BL', country: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA',
    primaryColor: '#be1826', accentColor: '#cc2a36',
    knownBroadcasts: { tv: ['ESPN', 'ESPN2', 'ESPN Deportes'], streaming: ['ESPN+', 'Fubo TV'] },
  },
  {
    id: 'fra.1', sport: 'soccer',
    name: 'Ligue 1', shortName: 'L1', country: 'France', flag: '\uD83C\uDDEB\uD83C\uDDF7',
    primaryColor: '#002654', accentColor: '#ED2939',
    knownBroadcasts: { streaming: ['beIN Sports', 'Fubo TV'] },
  },
  {
    id: 'ita.1', sport: 'soccer',
    name: 'Serie A', shortName: 'Serie A', country: 'Italy', flag: '\uD83C\uDDEE\uD83C\uDDF9',
    primaryColor: '#0033a0', accentColor: '#00a0b0',
    knownBroadcasts: { tv: ['CBS Sports Network'], streaming: ['Paramount+', 'Fubo TV'] },
  },
  {
    id: 'ned.1', sport: 'soccer',
    name: 'Eredivisie', shortName: 'ERE', country: 'Netherlands', flag: '\uD83C\uDDF3\uD83C\uDDF1',
    primaryColor: '#FF4500', accentColor: '#f5a623',
    knownBroadcasts: { streaming: ['ESPN+', 'Fubo TV'] },
  },
  {
    id: 'por.1', sport: 'soccer',
    name: 'Primeira Liga', shortName: 'PL PT', country: 'Portugal', flag: '\uD83C\uDDF5\uD83C\uDDF9',
    primaryColor: '#006600', accentColor: '#FF0000',
    knownBroadcasts: null,
  },
  {
    id: 'usa.1', sport: 'soccer',
    name: 'MLS', shortName: 'MLS', country: 'USA', flag: '\uD83C\uDDFA\uD83C\uDDF8',
    primaryColor: '#1a2e4a', accentColor: '#e82128',
    knownBroadcasts: { tv: ['Fox', 'Univision'], streaming: ['Apple TV+'] },
  },
  // ── Domestic Cups ──────────────────────────────────────────────────────────
  { id: '__divider_cups__', divider: true },
  {
    id: 'eng.fa', sport: 'soccer',
    name: 'FA Cup', shortName: 'FA Cup', country: 'England', flag: '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F',
    primaryColor: '#38003c', accentColor: '#edc951',
    knownBroadcasts: null,
  },
  {
    id: 'eng.3', sport: 'soccer',
    name: 'EFL Cup', shortName: 'EFL Cup', country: 'England', flag: '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F',
    primaryColor: '#38003c', accentColor: '#00a8ff',
    knownBroadcasts: null,
  },
  {
    id: 'esp.copa_del_rey', sport: 'soccer',
    name: 'Copa del Rey', shortName: 'Copa Rey', country: 'Spain', flag: '\uD83C\uDDEA\uD83C\uDDF8',
    primaryColor: '#c60b1e', accentColor: '#ffd700',
    knownBroadcasts: null,
  },
  {
    id: 'ger.dfb_pokal', sport: 'soccer',
    name: 'DFB-Pokal', shortName: 'DFB-Pokal', country: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA',
    primaryColor: '#000000', accentColor: '#d4af37',
    knownBroadcasts: null,
  },
  {
    id: 'ita.coppa_italia', sport: 'soccer',
    name: 'Coppa Italia', shortName: 'Coppa IT', country: 'Italy', flag: '\uD83C\uDDEE\uD83C\uDDF9',
    primaryColor: '#0033a0', accentColor: '#00a0b0',
    knownBroadcasts: null,
  },
  {
    id: 'fra.3', sport: 'soccer',
    name: 'Coupe de France', shortName: 'CdF', country: 'France', flag: '\uD83C\uDDEB\uD83C\uDDF7',
    primaryColor: '#002654', accentColor: '#ED2939',
    knownBroadcasts: null,
  },
  // ── European competitions (divider below) ──────────────────────────────────
  { id: '__divider__', divider: true },
  {
    id: 'UEFA.CHAMPIONS', sport: 'soccer',
    name: 'Champions League', shortName: 'UCL', country: 'Europe', flag: '\u2B50',
    primaryColor: '#021d49', accentColor: '#00a0b0',
    knownBroadcasts: { tv: ['CBS', 'CBS Sports Network', 'UniMas', 'TUDN'], streaming: ['Paramount+', 'Fubo TV'] },
  },
  {
    id: 'UEFA.EUROPA', sport: 'soccer',
    name: 'Europa League', shortName: 'UEL', country: 'Europe', flag: '\uD83D\uDFE0',
    primaryColor: '#e06200', accentColor: '#eb6841',
    knownBroadcasts: { tv: ['CBS Sports Network', 'UniMas'], streaming: ['Paramount+', 'Fubo TV'] },
  },
  {
    id: 'UEFA.CONFERENCE', sport: 'soccer',
    name: 'Conference League', shortName: 'UECL', country: 'Europe', flag: '\uD83D\uDFE2',
    primaryColor: '#0a3d25', accentColor: '#00d68f',
    knownBroadcasts: { streaming: ['Paramount+'] },
  },
]

// ─── Other Sports Leagues ───────────────────────────────────────────────────────
const NBA_LEAGUE = {
  id: 'nba', sport: 'basketball',
  name: 'NBA', shortName: 'NBA', flag: '\uD83C\uDFC0',
  primaryColor: '#1d428a', accentColor: '#c9082a',
  knownBroadcasts: { tv: ['ABC', 'ESPN', 'TNT', 'NBA TV'], streaming: ['ESPN+', 'Fubo TV'] },
}

const ATP_LEAGUE = {
  id: 'atp', sport: 'tennis',
  name: 'ATP Tour', shortName: 'ATP', flag: '\uD83C\uDFBE',
  primaryColor: '#0b3d82', accentColor: '#7ec8e3',
  knownBroadcasts: { tv: ['Tennis Channel'], streaming: ['Tennis Channel+'] },
}

const WTA_LEAGUE = {
  id: 'wta', sport: 'tennis',
  name: 'WTA Tour', shortName: 'WTA', flag: '\uD83C\uDFBE',
  primaryColor: '#a01060', accentColor: '#f8c8e0',
  knownBroadcasts: { tv: ['Tennis Channel'], streaming: ['Tennis Channel+'] },
}

const F1_LEAGUE = {
  id: 'f1', sport: 'f1',
  name: 'Formula 1', shortName: 'F1', flag: '\uD83C\uDFC1',
  primaryColor: '#e8002d', accentColor: '#ff8000',
  knownBroadcasts: { tv: ['ESPN', 'ABC'], streaming: ['ESPN+', 'F1 TV Pro'] },
}

// ─── Sports ──────────────────────────────────────────────────────────────────
export const SPORTS = [
  {
    id: 'soccer',
    name: 'Football',
    icon: '\u26BD',
    espnSport: 'soccer',
    defaultLeague: 'all',
    leagues: SOCCER_LEAGUES,
    hasStandings: true,
    hasTeamPage: true,
    hasDateNav: true,
  },
  {
    id: 'basketball',
    name: 'NBA',
    icon: '\uD83C\uDFC0',
    espnSport: 'basketball',
    defaultLeague: 'nba',
    leagues: [NBA_LEAGUE],
    hasStandings: false,
    hasTeamPage: false,
    hasDateNav: true,
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: '\uD83C\uDFBE',
    espnSport: 'tennis',
    defaultLeague: 'atp',
    leagues: [ATP_LEAGUE, WTA_LEAGUE],
    hasStandings: false,
    hasTeamPage: false,
    hasDateNav: true,
  },
  {
    id: 'f1',
    name: 'F1',
    icon: '\uD83C\uDFC1',
    espnSport: 'racing',
    defaultLeague: 'f1',
    leagues: [F1_LEAGUE],
    hasStandings: true,
    hasTeamPage: false,
    hasDateNav: false,
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────
const ALL_LEAGUES = [...SOCCER_LEAGUES, NBA_LEAGUE, ATP_LEAGUE, WTA_LEAGUE, F1_LEAGUE]

export function getSport(id) {
  return SPORTS.find(s => s.id === id)
}

export function getLeague(id) {
  return ALL_LEAGUES.find(l => l.id === id)
}

// Soccer backward compat
export const LEAGUES = SOCCER_LEAGUES
export const FETCHABLE_LEAGUES = SOCCER_LEAGUES.filter(l => l.id !== 'all' && !l.divider)
