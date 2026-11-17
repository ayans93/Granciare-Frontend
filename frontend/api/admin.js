/**
 * POST /api/admin — admin-only actions (caller must be a signed-in admin).
 *   { action: 'create-user', name, email, password }
 *   { action: 'delete-user', id }
 *   { action: 'ical-url' }            → feed URL, including the token if ICAL_SECRET is set
 */
import { getServerClient, requireAdmin } from './_lib/supabase.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const admin = await requireAdmin(req, res)
  if (!admin) return
  const supabase = getServerClient()
  const body = req.body || {}

  if (body.action === 'create-user') {
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' })
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })

    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })
    if (error) return res.status(400).json({ error: error.message })
    const { error: dbErr } = await supabase.from('admin_users').insert({ id: data.user.id, name, email })
    if (dbErr) {
      await supabase.auth.admin.deleteUser(data.user.id).catch(() => {})
      return res.status(500).json({ error: dbErr.message })
    }
    return res.status(200).json({ ok: true, userId: data.user.id })
  }

  if (body.action === 'delete-user') {
    const id = String(body.id || '')
    if (!id) return res.status(400).json({ error: 'Missing user.' })
    if (id === admin.id) return res.status(400).json({ error: 'You cannot remove your own account.' })
    const { count } = await supabase.from('admin_users').select('id', { count: 'exact', head: true })
    if ((count ?? 0) <= 1) return res.status(400).json({ error: 'At least one admin must remain.' })
    const { error: dbErr } = await supabase.from('admin_users').delete().eq('id', id)
    if (dbErr) return res.status(500).json({ error: dbErr.message })
    const { error: authErr } = await supabase.auth.admin.deleteUser(id)
    if (authErr && !/not.?found/i.test(authErr.message)) console.error('auth delete error:', authErr.message)
    return res.status(200).json({ ok: true })
  }

  if (body.action === 'ical-url') {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'granciare.com'
    const secret = process.env.ICAL_SECRET
    const url = `https://${host}/api/calendar.ics${secret ? `?token=${encodeURIComponent(secret)}` : ''}`
    return res.status(200).json({ url, protected: Boolean(secret) })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
