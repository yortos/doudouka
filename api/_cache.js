// Supabase-backed cache for ESPN API responses.
// All functions degrade gracefully when supabase = null.
//
// Cache key format:
//   scoreboard:<sport>:<leagueId>:<YYYYMMDD>
//   standings:<sport>:<leagueId>
//   summary:<leagueId>:<eventId>
//
// TTLs (in seconds):
//   past date scoreboards  → 86400  (1 day  — score won't change)
//   live / today scoreboard → 20     (20s    — refresh frequently)
//   today finished          → 120    (2 min  — might still be more games)
//   future scoreboard       → 300    (5 min  — schedule won't change often)
//   standings               → 3600   (1 hour — updated daily)
//   summary (final)         → 86400  (1 day  — goal list is permanent)
//   summary (live)          → 20     (20s)

import { supabase } from './_db.js'

export async function getCached(key) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('api_cache')
      .select('data, fetched_at')
      .eq('key', key)
      .maybeSingle()
    if (error || !data) return null
    return { data: data.data, fetchedAt: new Date(data.fetched_at) }
  } catch {
    return null
  }
}

export async function setCached(key, data) {
  if (!supabase) return
  try {
    await supabase
      .from('api_cache')
      .upsert({ key, data, fetched_at: new Date().toISOString() }, { onConflict: 'key' })
  } catch {
    // non-fatal — cache write failure should never break the response
  }
}

// Returns true when a cached entry is still fresh enough to serve.
export function isFresh(fetchedAt, ttlSeconds) {
  return (Date.now() - fetchedAt.getTime()) < ttlSeconds * 1000
}

// Determine HTTP Cache-Control value for a scoreboard response.
// dateStr = YYYYMMDD | null (for F1 which has no date param)
// hasLive  = whether any match in the response is currently live
export function scoreboardCacheControl(dateStr, hasLive) {
  if (!dateStr) {
    // F1 — could have a live race at any time
    return 'public, s-maxage=30, stale-while-revalidate=60'
  }

  const todayStr = (() => {
    const now = new Date()
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, '0')
    const d = String(now.getUTCDate()).padStart(2, '0')
    return `${y}${m}${d}`
  })()

  if (dateStr < todayStr) {
    // Past date — scores are final, cache aggressively
    return 'public, s-maxage=86400, stale-while-revalidate=604800'
  }
  if (dateStr > todayStr) {
    // Future date — fixtures unlikely to change frequently
    return 'public, s-maxage=300, stale-while-revalidate=600'
  }
  // Today
  if (hasLive) {
    return 'public, s-maxage=20, stale-while-revalidate=40'
  }
  return 'public, s-maxage=60, stale-while-revalidate=120'
}

export const STANDINGS_TTL = 3600   // 1 hour
export const SUMMARY_FINAL_TTL = 86400  // 1 day
export const SUMMARY_LIVE_TTL = 20
