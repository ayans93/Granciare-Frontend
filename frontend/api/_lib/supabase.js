// Shared server-side Supabase helpers. Files under api/_lib are not exposed as endpoints.
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
// Service key first (bypasses RLS); the anon key is only a last resort.
const KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

export const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)

let client = null
export function getServerClient() {
  if (!URL || !KEY) return null
  if (!client) client = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

/**
 * Verifies the caller is a signed-in admin.
 * Expects "Authorization: Bearer <supabase access token>".
 * Sends 401/403 itself and returns null when the check fails.
 */
export async function requireAdmin(req, res) {
  const sb = getServerClient()
  if (!sb) { res.status(500).json({ error: 'Supabase not configured.' }); return null }

  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) { res.status(401).json({ error: 'Sign in required.' }); return null }

  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); return null }

  const { data: row, error: rowErr } = await sb.from('admin_users').select('id').eq('id', data.user.id).maybeSingle()
  if (rowErr || !row) { res.status(403).json({ error: 'This account is not an admin.' }); return null }

  return data.user
}
