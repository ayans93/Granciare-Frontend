// POST  /api/admin-upload  — upload photo to Supabase Storage, AI-categorise
// DELETE /api/admin-upload  — delete photo from Storage

import Anthropic from '@anthropic-ai/sdk'
import { getServerClient, requireAdmin } from './_lib/supabase.js'

const BUCKET = 'photos'
const MAX_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Creates the public storage bucket on first use, so uploads don't fail with "Bucket not found".
async function ensureBucket(supabase) {
  const { data } = await supabase.storage.getBucket(BUCKET)
  if (data) return null
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
  return error && !/already exists/i.test(error.message) ? error : null
}

const CATEGORIES = [
  'mansion', 'landscape', 'pool', 'dining', 'kitchen',
  'bedrooms', 'living_areas', 'bathrooms', 'lounge_bar', 'olive_oil', 'awards',
]

async function categorise(base64, mediaType, fallback) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('categorise skipped: ANTHROPIC_API_KEY not set')
    return { category: fallback, categorised: false }
  }
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 32,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Categorise this property photo. Reply with ONE word from this list only: ${CATEGORIES.join(', ')}.
            - mansion = exterior/facade of the stone villa building
            - landscape = gardens, trees, countryside views, olive groves (non-harvest)
            - pool = swimming pool, pool area, sun loungers
            - dining = dining room, dining table, formal eating areas
            - kitchen = kitchen, cooking areas
            - bedrooms = bedrooms, beds, sleeping areas
            - living_areas = living rooms, lounges, sitting areas
            - bathrooms = bathrooms, showers, bathtubs
            - lounge_bar = bar area, wine cellar, outdoor lounge
            - olive_oil = olive harvest, olive trees, olive oil bottles, oil production
            - awards = trophies, certificates, award medals, plaques
            Reply with exactly one word.`,
          },
        ],
      }],
    })
    const cat = msg.content[0].text.trim().toLowerCase().replace(/[^a-z_]/g, '')
    if (CATEGORIES.includes(cat)) return { category: cat, categorised: true }
    console.error('categorise: unexpected answer', cat)
  } catch (e) {
    console.error('categorise failed:', e?.message || e)
  }
  return { category: fallback, categorised: false }
}

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Admins only
  const admin = await requireAdmin(req, res)
  if (!admin) return
  const supabase = getServerClient()

  // DELETE
  if (req.method === 'DELETE') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const { path } = JSON.parse(Buffer.concat(chunks).toString())
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // POST — multipart/form-data
  if (req.method === 'POST') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks)

    // Parse multipart manually (simple boundary extraction)
    const contentType = req.headers['content-type'] || ''
    const boundary = '--' + contentType.split('boundary=')[1]
    const parts = raw.toString('binary').split(boundary)

    let fileBuffer = null
    let fileMediaType = 'image/jpeg'
    let filePath = ''
    let tab = 'stay'

    for (const part of parts) {
      if (part.includes('name="file"')) {
        const headerEnd = part.indexOf('\r\n\r\n')
        const header = part.substring(0, headerEnd)
        const mt = header.match(/Content-Type:\s*([^\r\n]+)/)
        if (mt) fileMediaType = mt[1].trim()
        const body = part.substring(headerEnd + 4, part.length - 2)
        fileBuffer = Buffer.from(body, 'binary')
      }
      if (part.includes('name="path"')) {
        const headerEnd = part.indexOf('\r\n\r\n')
        filePath = part.substring(headerEnd + 4, part.length - 2).trim()
      }
      if (part.includes('name="tab"')) {
        const headerEnd = part.indexOf('\r\n\r\n')
        tab = part.substring(headerEnd + 4, part.length - 2).trim()
      }
    }

    if (!fileBuffer || !filePath) return res.status(400).json({ error: 'Missing file' })
    if (!IMAGE_TYPES.includes(fileMediaType)) {
      return res.status(400).json({ error: 'Only JPG, PNG, WebP or GIF images can be uploaded.' })
    }
    if (fileBuffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'Image is larger than 10 MB.' })
    }
    if (!/^photos\/[\w.-]+$/.test(filePath)) {
      return res.status(400).json({ error: 'Invalid file path.' })
    }

    const bucketErr = await ensureBucket(supabase)
    if (bucketErr) return res.status(500).json({ error: `Storage is not ready: ${bucketErr.message}` })

    // AI categorisation
    const base64 = fileBuffer.toString('base64')
    const { category, categorised } = await categorise(base64, fileMediaType, tab === 'oil' ? 'olive_oil' : 'landscape')

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, fileBuffer, {
      contentType: fileMediaType,
      upsert: false,
    })
    if (upErr) return res.status(500).json({ error: upErr.message })

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    return res.status(200).json({ publicUrl, category, categorised })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
