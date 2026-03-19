import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

// supabase is null when env vars are not configured — all cache functions
// below degrade gracefully so the app works without a DB.
export const supabase = (url && key) ? createClient(url, key) : null
