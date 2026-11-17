// POST /api/admin-create-user — create a new Supabase Auth user + admin_users row
import { getServerClient, requireAdmin } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Only a signed-in admin may create another admin
  const admin = await requireAdmin(req, res)
  if (!admin) return
  const supabase = getServerClient()

  const { name, email, password } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' })

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })
  if (error) return res.status(400).json({ error: error.message })

  // Insert into admin_users table
  const { error: dbErr } = await supabase.from('admin_users').insert({
    id: data.user.id,
    name,
    email,
  })
  if (dbErr) return res.status(500).json({ error: dbErr.message })

  return res.status(200).json({ ok: true, userId: data.user.id })
}
