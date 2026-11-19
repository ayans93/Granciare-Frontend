import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { BOTTLE_SIZES, sizeById } from '../lib/oilRules'
import './Admin.css'

// ── CONSTANTS ──────────────────────────────────────────────
const TABS = [
  { id: 'stay-requests',       label: 'Stay Requests',       icon: '🏠' },
  { id: 'stay-confirmations',  label: 'Stay Confirmations',  icon: '✅' },
  { id: 'oil-requests',        label: 'Oil Requests',        icon: '🫙' },
  { id: 'oil-confirmations',   label: 'Oil Confirmations',   icon: '✅' },
  { id: 'photos',              label: 'Photos',              icon: '📷' },
  { id: 'testimonials',        label: 'Testimonials',        icon: '💬' },
  { id: 'pricing',             label: 'Pricing',             icon: '💶' },
  { id: 'granciare-details',   label: 'Granciare Details',   icon: '🏛️' },
  { id: 'solive-details',      label: 'Solivé Details',      icon: '🫒' },
  { id: 'leads',               label: 'Leads',               icon: '✉️' },
  { id: 'users',               label: 'Users',               icon: '👤' },
]

const STATUS_COLORS = {
  enquiry:   'status--enquiry',
  confirmed: 'status--confirmed',
  cancelled: 'status--cancelled',
}

const PHOTO_CATEGORIES = [
  'mansion', 'landscape', 'pool', 'dining', 'kitchen',
  'bedrooms', 'living_areas', 'bathrooms', 'lounge_bar', 'olive_oil', 'awards',
]

const FEATURED_SECTIONS = {
  landscape:   'Landscape',
  pool:        'Facilities and Amenities',
  bedrooms:    'Rooms & Suites',
  olive_oil:   'Olive Oil',
}

// Bottle size shown on an oil order (own column, or written into the message by older setups)
function oilSize(row) {
  const z = sizeById(row.bottle_size)
  if (z) return z.label
  const m = /Bottle size:\s*([^\n]+)/.exec(row.message || '')
  return m ? m[1].trim() : '500 ml'
}

const VILLA_PRICING_DEFAULTS = [
  { label: 'Low Season',          date_from: '2027-01-01', date_to: '2027-03-31', price_per_night: 2000 },
  { label: 'Spring Shoulder',     date_from: '2027-04-01', date_to: '2027-05-31', price_per_night: 3000 },
  { label: 'Peak Summer',         date_from: '2027-06-01', date_to: '2027-08-31', price_per_night: 4500 },
  { label: 'Harvest Season',      date_from: '2027-09-01', date_to: '2027-10-31', price_per_night: 3500 },
  { label: 'Autumn / Winter',     date_from: '2027-11-01', date_to: '2027-12-20', price_per_night: 2000 },
  { label: 'Christmas & New Year',date_from: '2027-12-21', date_to: '2028-01-06', price_per_night: 4000 },
]

// ── HELPERS ────────────────────────────────────────────────
function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function stayRef(id) {
  return id ? 'GRC-' + String(id).replace(/-/g, '').slice(0, 6).toUpperCase() : ''
}
function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return aFrom <= bTo && bFrom <= aTo
}
function nights(ci, co) {
  if (!ci || !co) return 0
  return Math.round((new Date(co) - new Date(ci)) / 86400000)
}

// Admin API calls carry the signed-in admin's token; the server rejects anything else.
async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── NOTIFICATION BELL ──────────────────────────────────────
// Read state is kept per admin (in this browser), so one admin reading an
// alert does not clear it for the others.
function readStore(userId) {
  const key = `admin-notif-read-${userId}`
  let st
  try { st = JSON.parse(localStorage.getItem(key)) } catch {}
  if (!st || !st.before) st = { before: new Date().toISOString(), ids: [] }  // first visit: older alerts count as read
  const save = next => { try { localStorage.setItem(key, JSON.stringify(next)) } catch {} }
  save(st)
  return { st, save }
}

function NotificationBell({ theme, userId }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState([])
  const [readState, setReadState] = useState(() => readStore(userId).st)
  const ref = useRef()

  useEffect(() => {
    fetchNotifs()
    const ch = supabase.channel('notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchNotifs())
      .subscribe()
    // Realtime may not be enabled on the table, so also poll and refresh when the tab regains focus
    const poll = setInterval(fetchNotifs, 30000)
    const onFocus = () => fetchNotifs()
    window.addEventListener('focus', onFocus)
    return () => { supabase.removeChannel(ch); clearInterval(poll); window.removeEventListener('focus', onFocus) }
  }, [])

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  async function fetchNotifs() {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30)
    setNotes(data || [])
  }

  const isRead = n => n.created_at <= readState.before || readState.ids.includes(n.id)
  function persist(next) { readStore(userId).save(next); setReadState(next) }
  function markRead(id) { if (!readState.ids.includes(id)) persist({ ...readState, ids: [...readState.ids, id].slice(-200) }) }
  function markAllRead() { persist({ before: new Date().toISOString(), ids: [] }) }

  const unread = notes.filter(n => !isRead(n)).length

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>
      {open && (
        <div className={`notif-dropdown ${theme === 'dark' ? 'dark' : ''}`}>
          <div className="notif-header">
            <span>Notifications</span>
            {unread > 0 && <button onClick={markAllRead} className="notif-mark-all">Mark all read</button>}
          </div>
          {notes.length === 0 && <p className="notif-empty">No notifications</p>}
          {notes.map(n => (
            <div key={n.id} className={`notif-item ${!isRead(n) ? 'notif-item--unread' : ''}`} onClick={() => markRead(n.id)}>
              <p className="notif-title">{n.title}</p>
              {n.body && <p className="notif-body">{n.body}</p>}
              <p className="notif-time">{fmt(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── NOTES PANEL ────────────────────────────────────────────
function NotesPanel({ table, id, adminName }) {
  const [notes, setNotes] = useState([])
  const [text, setText] = useState('')
  const fkCol = table === 'stay_request_notes' ? 'stay_request_id' : 'oil_request_id'

  useEffect(() => { fetchNotes() }, [id])

  async function fetchNotes() {
    const { data } = await supabase.from(table).select('*').eq(fkCol, id).order('created_at')
    setNotes(data || [])
  }

  async function addNote() {
    if (!text.trim()) return
    await supabase.from(table).insert({ [fkCol]: id, note: text.trim(), author_name: adminName })
    setText('')
    fetchNotes()
  }

  return (
    <div className="notes-panel">
      <p className="notes-label">Notes & call log</p>
      <div className="notes-list">
        {notes.length === 0 && <p className="notes-empty">No notes yet</p>}
        {notes.map(n => (
          <div key={n.id} className="note-item">
            <p className="note-text">{n.note}</p>
            <p className="note-meta">{n.author_name} · {fmt(n.created_at)}</p>
          </div>
        ))}
      </div>
      <div className="notes-add">
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add a note…" rows={2} />
        <button onClick={addNote} disabled={!text.trim()}>Add</button>
      </div>
    </div>
  )
}

// ── REQUEST ROW (shared by Stay + Oil) ────────────────────
function RequestRow({ row, onStatusChange, isStay, adminName }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className={`req-row ${expanded ? 'req-row--open' : ''}`} onClick={() => setExpanded(e => !e)}>
        <td><span className={`status-badge ${STATUS_COLORS[row.status]}`}>{row.status}</span></td>
        <td>{row.name}</td>
        <td>{row.email}</td>
        {isStay ? (
          <>
            <td>{fmt(row.check_in)} → {fmt(row.check_out)}</td>
            <td>{nights(row.check_in, row.check_out)}n · {row.adults}A {row.children > 0 ? `${row.children}C` : ''}{row.booking_type === 'floor' && <span className="type-badge">Floor</span>}</td>
          </>
        ) : (
          <td>{row.quantity} × {oilSize(row)}</td>
        )}
        <td>{fmt(row.created_at)}</td>
        <td className="req-actions" onClick={e => e.stopPropagation()}>
          <select value={row.status} onChange={e => onStatusChange(row.id, e.target.value)} className="status-select">
            <option value="enquiry">Enquiry</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </td>
      </tr>
      {expanded && (
        <tr className="req-detail">
          <td colSpan={isStay ? 7 : 6}>
            <div className="req-detail-inner">
              {isStay && <p><strong>Reference:</strong> {stayRef(row.id)}</p>}
              {isStay && <p><strong>Booking:</strong> {row.booking_type === 'floor' ? 'One floor (up to 8 guests)' : 'Entire villa'}</p>}
              {row.phone && <p><strong>Phone:</strong> {row.phone}</p>}
              {(row.message || row.notes) && <p className="req-message"><strong>Message:</strong> {row.message || row.notes}</p>}
              {row.special_requests && <p><strong>Special requests:</strong> {row.special_requests}</p>}
              <NotesPanel
                table={isStay ? 'stay_request_notes' : 'oil_request_notes'}
                id={row.id}
                adminName={adminName}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── STAY REQUESTS TAB ──────────────────────────────────────
function StayRequests({ adminName }) {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetch() }, [filter])

  async function fetch() {
    let q = supabase.from('stay_requests').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRows(data || [])
  }

  async function changeStatus(id, status) {
    await supabase.from('stay_requests').update({ status }).eq('id', id)
    await supabase.from('notifications').insert({
      type: 'status_changed', title: 'Stay request updated',
      body: `Status changed to ${status}`, related_id: id,
    })
    fetch()
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Stay Requests</h2>
        <div className="filter-row">
          {['all','enquiry','confirmed','cancelled'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? <p className="empty-state">{filter === 'all' ? 'No stay requests yet.' : `No ${filter} stay requests.`}</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th><th>Name</th><th>Email</th>
                <th>Dates</th><th>Guests</th><th>Received</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <RequestRow key={r.id} row={r} onStatusChange={changeStatus} isStay={true} adminName={adminName} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── STAY CONFIRMATIONS TAB ────────────────────────────────
function StayConfirmations() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    supabase.from('stay_requests').select('*').eq('status', 'confirmed')
      .order('check_in').then(({ data }) => setRows(data || []))
  }, [])

  const [icalUrl, setIcalUrl] = useState(`${window.location.origin}/api/calendar.ics`)
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ action: 'ical-url' }) })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.url) setIcalUrl(json.url)
    })()
  }, [])
  const [copied, setCopied] = useState(false)
  function copyIcal() {
    navigator.clipboard.writeText(icalUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="tab-content">
      <div className="tab-header"><h2>Stay Confirmations</h2></div>

      {/* iCal feed */}
      <div className="ical-banner">
        <div className="ical-banner__info">
          <span className="ical-banner__title">📅 iCal Feed</span>
          <span className="ical-banner__sub">Share this URL with Airbnb, Booking.com, or any calendar app to sync confirmed bookings automatically.</span>
        </div>
        <div className="ical-banner__url">
          <code className="ical-banner__code">{icalUrl}</code>
          <button className="btn-action btn-sm--save" onClick={copyIcal}>{copied ? '✓ Copied' : 'Copy URL'}</button>
          <a className="btn-action btn-sm--save" href={icalUrl} download="granciare-bookings.ics" style={{ textDecoration: 'none' }}>Download .ics</a>
        </div>
      </div>

      {rows.length === 0 ? <p className="empty-state">No confirmed bookings yet.</p> : (
        <div className="confirm-grid">
          {rows.map(r => (
            <div key={r.id} className="confirm-card">
              <div className="confirm-card__dates">
                <span>{fmt(r.check_in)}</span>
                <span className="confirm-arrow">→</span>
                <span>{fmt(r.check_out)}</span>
                <span className="confirm-nights">{nights(r.check_in, r.check_out)} nights</span>
              </div>
              <div className="confirm-card__body">
                <p className="confirm-name">{r.name} <span className="confirm-ref">{stayRef(r.id)}</span></p>
                <p className="confirm-meta">{r.email} {r.phone && `· ${r.phone}`}</p>
                <p className="confirm-guests">{r.booking_type === 'floor' ? 'One floor · ' : 'Entire villa · '}{r.adults} adults{r.children > 0 ? `, ${r.children} children` : ''}</p>
                {r.special_requests && (
                  <div className="confirm-special">
                    <span>Special requests:</span> {r.special_requests}
                  </div>
                )}
                {(r.message || r.notes) && <p className="confirm-msg">"{r.message || r.notes}"</p>}
              </div>
              <div className="confirm-card__footer">
                Booked {fmt(r.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── OIL REQUESTS TAB ──────────────────────────────────────
function OilRequests({ adminName }) {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetch() }, [filter])

  async function fetch() {
    let q = supabase.from('oil_requests').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRows(data || [])
  }

  async function changeStatus(id, status) {
    await supabase.from('oil_requests').update({ status }).eq('id', id)
    await supabase.from('notifications').insert({
      type: 'status_changed', title: 'Oil request updated',
      body: `Status changed to ${status}`, related_id: id,
    })
    fetch()
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Olive Oil Requests</h2>
        <div className="filter-row">
          {['all','enquiry','confirmed','cancelled'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? <p className="empty-state">{filter === 'all' ? 'No oil requests yet.' : `No ${filter} oil requests.`}</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th><th>Name</th><th>Email</th>
                <th>Qty</th><th>Received</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <RequestRow key={r.id} row={r} onStatusChange={changeStatus} isStay={false} adminName={adminName} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── OIL CONFIRMATIONS TAB ─────────────────────────────────
function OilConfirmations() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    supabase.from('oil_requests').select('*').eq('status', 'confirmed')
      .order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  }, [])

  return (
    <div className="tab-content">
      <div className="tab-header"><h2>Oil Confirmations</h2></div>
      {rows.length === 0 ? <p className="empty-state">No confirmed oil orders yet.</p> : (
        <div className="confirm-grid">
          {rows.map(r => (
            <div key={r.id} className="confirm-card">
              <div className="confirm-card__dates">
                <span className="confirm-nights">{r.quantity} × {oilSize(r)}</span>
              </div>
              <div className="confirm-card__body">
                <p className="confirm-name">{r.name}</p>
                <p className="confirm-meta">{r.email} {r.phone && `· ${r.phone}`}</p>
                {r.message && <p className="confirm-msg">"{r.message}"</p>}
              </div>
              <div className="confirm-card__footer">Ordered {fmt(r.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PHOTOS TAB ────────────────────────────────────────────
function Photos() {
  const [tab, setTab] = useState('stay')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const fileRef = useRef()

  const stayCategories = ['mansion','landscape','pool','dining','kitchen','bedrooms','living_areas','bathrooms','lounge_bar','awards']
  const oilCategories  = ['olive_oil','awards']
  const activeCats     = tab === 'stay' ? stayCategories : oilCategories

  useEffect(() => { fetchPhotos() }, [tab, catFilter])

  async function fetchPhotos() {
    let q = supabase.from('photos').select('*').in('category', tab === 'stay' ? stayCategories : oilCategories)
      .order('created_at', { ascending: false }).order('storage_path', { ascending: true })
    if (catFilter !== 'all') q = q.eq('category', catFilter)
    const { data } = await q
    setPhotos(data || [])
  }

  async function upload(files) {
    setUploading(true)
    setUploadErr('')
    const failed = []
    const guessed = []
    for (const file of Array.from(files)) {
      try {
        const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', path)
        formData.append('tab', tab)
        const res  = await fetch('/api/admin-upload', { method: 'POST', headers: await authHeader(), body: formData })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json.publicUrl) throw new Error(json.error || `Upload failed (${res.status})`)
        const { error } = await supabase.from('photos').insert({ storage_path: path, public_url: json.publicUrl, category: json.category, alt_text: file.name })
        if (error) throw new Error(error.message)
        await supabase.from('notifications').insert({ type: 'photo_added', title: 'New photo added', body: `Category: ${json.category}` })
        if (json.categorised === false) guessed.push(`${file.name}${json.reason ? ` (${json.reason})` : ''}`)
      } catch (e) {
        failed.push(`${file.name}: ${e.message}`)
      }
    }
    if (failed.length) setUploadErr(`Could not upload ${failed.join(' · ')}`)
    else if (guessed.length) setUploadErr(`The category could not be detected for ${guessed.join(', ')}. Please check it below.`)
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    fetchPhotos()
  }

  async function changeCategory(photo, category) {
    const patch = { category }
    if (photo.is_featured && !FEATURED_SECTIONS[category]) patch.is_featured = false
    if (photo.is_featured && FEATURED_SECTIONS[category]) {
      await supabase.from('photos').update({ is_featured: false }).eq('category', category).neq('id', photo.id)
    }
    await supabase.from('photos').update(patch).eq('id', photo.id)
    fetchPhotos()
  }

  async function toggleFeatured(photo) {
    if (!FEATURED_SECTIONS[photo.category]) return
    // Only one lead photo per section: featuring this one un-features the others
    if (!photo.is_featured) {
      await supabase.from('photos').update({ is_featured: false }).eq('category', photo.category).neq('id', photo.id)
    }
    await supabase.from('photos').update({ is_featured: !photo.is_featured }).eq('id', photo.id)
    fetchPhotos()
  }

  async function deletePhoto(photo) {
    if (!confirm('Delete this photo?')) return
    await fetch('/api/admin-upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ path: photo.storage_path }),
    })
    await supabase.from('photos').delete().eq('id', photo.id)
    await supabase.from('notifications').insert({ type: 'photo_deleted', title: 'Photo deleted', body: photo.alt_text })
    fetchPhotos()
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Photos</h2>
        <div className="sub-tabs">
          <button className={`sub-tab ${tab === 'stay' ? 'active' : ''}`} onClick={() => { setTab('stay'); setCatFilter('all') }}>Stay</button>
          <button className={`sub-tab ${tab === 'oil'  ? 'active' : ''}`} onClick={() => { setTab('oil');  setCatFilter('all') }}>Olive Oil</button>
        </div>
      </div>

      <div className="photos-toolbar">
        <div className="filter-row">
          <button className={`filter-btn ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
          {activeCats.map(c => (
            <button key={c} className={`filter-btn ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
              {c.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '+ Upload photos'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => upload(e.target.files)} />
      </div>

      {uploadErr && <p className="form-err" role="alert">{uploadErr}</p>}

      {photos.length === 0 ? <p className="empty-state">No photos in this category.</p> : (
        <div className="photos-grid">
          {photos.map(p => (
            <div key={p.id} className={`photo-card ${p.is_featured ? 'photo-card--featured' : ''}`}>
              <img src={p.public_url} alt={p.alt_text} loading="lazy" />
              <div className="photo-card__info">
                <select className="photo-cat-select" value={p.category} onChange={e => changeCategory(p, e.target.value)} aria-label="Photo category">
                  {activeCats.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
                {p.is_featured && <span className="photo-featured-badge">Featured</span>}
              </div>
              <div className="photo-card__actions">
                {FEATURED_SECTIONS[p.category] && (
                  <button onClick={() => toggleFeatured(p)} className={`btn-sm ${p.is_featured ? 'btn-sm--active' : ''}`}>
                    {p.is_featured ? '★ Featured' : `Feature as ${FEATURED_SECTIONS[p.category]}`}
                  </button>
                )}
                <button onClick={() => deletePhoto(p)} className="btn-sm btn-sm--danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TESTIMONIALS TAB ──────────────────────────────────────
const EMPTY_TESTIMONIAL = { reviewer_name: '', location: '', rating: 5, review_text: '', stay_date: '' }
function Testimonials() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY_TESTIMONIAL)
  const [editingId, setEditingId] = useState(null)   // null = closed, 'new' = adding, id = editing
  const [err, setErr] = useState('')

  useEffect(() => { fetchRows() }, [])

  // Same order as the home page carousel
  async function fetchRows() {
    const { data } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true })
    setRows(data || [])
  }

  function startAdd() { setForm(EMPTY_TESTIMONIAL); setEditingId(editingId === 'new' ? null : 'new'); setErr('') }
  function startEdit(r) {
    setForm({ reviewer_name: r.reviewer_name || '', location: r.location || '', rating: r.rating || 5, review_text: r.review_text || '', stay_date: r.stay_date || '' })
    setEditingId(r.id); setErr('')
  }
  function cancel() { setEditingId(null); setForm(EMPTY_TESTIMONIAL); setErr('') }

  async function save() {
    const clean = {
      reviewer_name: form.reviewer_name.trim(), location: form.location.trim(),
      stay_date: form.stay_date.trim(), review_text: form.review_text.trim(), rating: Number(form.rating) || 5,
    }
    if (!clean.reviewer_name || !clean.review_text) { setErr('Name and review text are required.'); return }
    if (clean.review_text.length > 600) { setErr('Please keep the review under 600 characters so it fits the carousel.'); return }
    const { error } = editingId === 'new'
      ? await supabase.from('testimonials').insert({ ...clean, sort_order: rows.length })
      : await supabase.from('testimonials').update(clean).eq('id', editingId)
    if (error) { setErr(error.message); return }
    cancel()
    fetchRows()
  }

  async function move(index, dir) {
    const next = [...rows]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setRows(next)
    await Promise.all(next.map((r, i) => r.sort_order === i ? null : supabase.from('testimonials').update({ sort_order: i }).eq('id', r.id)))
    fetchRows()
  }

  async function toggleVisible(id, val) {
    await supabase.from('testimonials').update({ is_visible: !val }).eq('id', id)
    fetchRows()
  }
  async function remove(id) {
    if (!confirm('Delete this testimonial?')) return
    await supabase.from('testimonials').delete().eq('id', id)
    fetchRows()
  }

  const formCard = (
    <div className="form-card">
      <div className="form-row">
        <input placeholder="Reviewer name *" maxLength={80} value={form.reviewer_name} onChange={e => setForm({ ...form, reviewer_name: e.target.value })} />
        <input placeholder="Location (e.g. London, UK)" maxLength={80} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      </div>
      <div className="form-row">
        <input placeholder="Stay date (e.g. October 2026)" maxLength={40} value={form.stay_date} onChange={e => setForm({ ...form, stay_date: e.target.value })} />
        <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })}>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} stars</option>)}
        </select>
      </div>
      <textarea placeholder="Review text *" rows={4} maxLength={600} value={form.review_text} onChange={e => setForm({ ...form, review_text: e.target.value })} />
      <p className="field-count">{form.review_text.length} / 600</p>
      {err && <p className="form-err">{err}</p>}
      <div className="form-actions">
        <button className="btn-primary" onClick={save} disabled={!form.reviewer_name.trim() || !form.review_text.trim()}>{editingId === 'new' ? 'Save' : 'Save changes'}</button>
        <button className="btn-ghost" onClick={cancel}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Testimonials</h2>
        <button className="btn-primary" onClick={startAdd}>+ Add testimonial</button>
      </div>
      <p className="pricing-note">Shown on the home page in this order. Use the arrows to reorder.</p>
      {editingId === 'new' && formCard}
      <div className="testimonial-list">
        {rows.length === 0 && <p className="empty-state">No testimonials yet.</p>}
        {rows.map((r, i) => editingId === r.id ? <div key={r.id}>{formCard}</div> : (
          <div key={r.id} className={`testimonial-row ${!r.is_visible ? 'testimonial-row--hidden' : ''}`}>
            <div className="testimonial-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <p className="testimonial-text">"{r.review_text}"</p>
            <p className="testimonial-meta">{r.reviewer_name}{r.location ? `, ${r.location}` : ''}{r.stay_date ? ` · ${r.stay_date}` : ''}</p>
            <div className="testimonial-actions">
              <button className="btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button className="btn-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
              <button className="btn-sm" onClick={() => startEdit(r)}>Edit</button>
              <button className="btn-sm" onClick={() => toggleVisible(r.id, r.is_visible)}>{r.is_visible ? 'Hide' : 'Show'}</button>
              <button className="btn-sm btn-sm--danger" onClick={() => remove(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PRICING TAB ───────────────────────────────────────────
function Pricing() {
  const [oilPrices, setOilPrices] = useState({})
  const [villaPrices, setVillaPrices] = useState([])
  const [oilSaving, setOilSaving] = useState(false)
  const [oilSaved, setOilSaved] = useState(false)
  const [newRange, setNewRange] = useState({ label: '', date_from: '', date_to: '', price_per_night: '' })
  const [addingRange, setAddingRange] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editRow, setEditRow] = useState({})
  const [priceErr, setPriceErr] = useState('')
  const [rangeErr, setRangeErr] = useState('')

  // Returns an error message, or '' if the range is valid
  function validateRange(r, ignoreId) {
    const price = parseFloat(r.price_per_night)
    if (!String(r.label || '').trim()) return 'Please give the range a label.'
    if (!r.date_from || !r.date_to) return 'Please choose both dates.'
    if (r.date_to < r.date_from) return 'The end date is before the start date.'
    if (!(price > 0)) return 'The nightly rate must be above €0.'
    const clash = villaPrices.find(v => v.id !== ignoreId && rangesOverlap(r.date_from, r.date_to, v.date_from, v.date_to))
    if (clash) return `These dates overlap "${clash.label}" (${fmt(clash.date_from)} – ${fmt(clash.date_to)}).`
    return ''
  }

  // Price per bottle for each bottle size (stored in site_config)
  useEffect(() => {
    Promise.all([
      supabase.from('site_config').select('key,value').in('key', BOTTLE_SIZES.map(z => z.priceKey)),
      supabase.from('oil_pricing').select('quantity,price_per_bottle').eq('quantity', 5),
    ]).then(([cfg, legacy]) => {
      const map = {}
      ;(cfg.data || []).forEach(r => { map[r.key] = r.value })
      if (!map.oil_price_500ml && legacy.data?.[0]?.price_per_bottle) map.oil_price_500ml = String(legacy.data[0].price_per_bottle)
      setOilPrices(map)
    })
    fetchVilla()
  }, [])

  async function fetchVilla() {
    const { data } = await supabase.from('villa_pricing').select('*').order('date_from')
    setVillaPrices(data || [])
  }

  async function saveAllOilPrices() {
    setPriceErr('')
    // A blank price is allowed (shown as "Price on request"); anything entered must be above €0
    const bad = BOTTLE_SIZES.filter(z => String(oilPrices[z.priceKey] ?? '').trim() !== '' && !(parseFloat(oilPrices[z.priceKey]) > 0))
    if (bad.length) { setPriceErr(`Enter a price above €0 (or leave it blank) for: ${bad.map(z => z.label).join(', ')}.`); return }
    setOilSaving(true)
    const rows = BOTTLE_SIZES.map(z => {
      const v = String(oilPrices[z.priceKey] ?? '').trim()
      return { key: z.priceKey, value: v ? String(Math.round(parseFloat(v) * 100) / 100) : '' }
    })
    const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key' })
    if (error) { setOilSaving(false); setPriceErr(error.message); return }
    await supabase.from('notifications').insert({ type: 'pricing_updated', title: 'Oil pricing updated', body: 'All bottle prices saved' })
    setOilSaving(false)
    setOilSaved(true)
    setTimeout(() => setOilSaved(false), 2500)
  }

  async function addVillaRange() {
    const msg = validateRange(newRange)
    setRangeErr(msg)
    if (msg) return
    await supabase.from('villa_pricing').insert({ ...newRange, label: newRange.label.trim(), price_per_night: parseFloat(newRange.price_per_night) })
    await supabase.from('notifications').insert({ type: 'pricing_updated', title: 'Villa pricing updated', body: `New range: ${newRange.label}` })
    setNewRange({ label: '', date_from: '', date_to: '', price_per_night: '' })
    setAddingRange(false)
    fetchVilla()
  }

  async function deleteVillaRange(id) {
    if (!confirm('Remove this pricing range?')) return
    await supabase.from('villa_pricing').delete().eq('id', id)
    fetchVilla()
  }

  async function updateVillaRange(id) {
    const msg = validateRange(editRow, id)
    setRangeErr(msg)
    if (msg) return
    await supabase.from('villa_pricing').update({
      label: editRow.label.trim(),
      date_from: editRow.date_from,
      date_to: editRow.date_to,
      price_per_night: parseFloat(editRow.price_per_night),
    }).eq('id', id)
    setEditingId(null)
    fetchVilla()
  }

  async function seedVillaDefaults() {
    if (!confirm('This will add 6 default seasonal pricing ranges for 2027. Continue?')) return
    await supabase.from('villa_pricing').insert(VILLA_PRICING_DEFAULTS)
    await supabase.from('notifications').insert({ type: 'pricing_updated', title: 'Villa pricing seeded', body: 'Default seasonal ranges added for 2027' })
    fetchVilla()
  }

  return (
    <div className="tab-content">
      <div className="tab-header"><h2>Pricing Control</h2></div>

      <div className="pricing-sections">
        {/* Olive oil pricing */}
        <div className="pricing-block">
          <h3>Olive Oil Bottle Pricing</h3>
          <p className="pricing-note">Price per bottle for each size. Leave a size blank to show "Price on request". Order limits: 250 ml and 500 ml up to 3 L per order (12 × 250 ml or 6 × 500 ml); 5 L up to 10 bottles.</p>
          <table className="data-table pricing-table">
            <thead><tr><th>Bottle size</th><th>Price per bottle (€)</th></tr></thead>
            <tbody>
              {BOTTLE_SIZES.map(z => (
                <tr key={z.id}>
                  <td>{z.label}</td>
                  <td>
                    <input
                      type="number" step="0.50" min="0.5"
                      value={oilPrices[z.priceKey] || ''}
                      onChange={e => setOilPrices({ ...oilPrices, [z.priceKey]: e.target.value })}
                      className="price-input"
                      placeholder="On request"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {priceErr && <p className="form-err">{priceErr}</p>}
          <div className="pricing-save-row">
            <button className="btn-primary" onClick={saveAllOilPrices} disabled={oilSaving}>
              {oilSaving ? 'Saving…' : oilSaved ? '✓ Saved' : 'Save all prices'}
            </button>
          </div>
        </div>

        {/* Villa pricing */}
        <div className="pricing-block">
          <div className="pricing-block-header">
            <h3>Villa Pricing</h3>
            <button className="btn-primary btn-sm-ver" onClick={() => { setAddingRange(a => !a); setEditingId(null); setRangeErr('') }}>+ Add range</button>
          </div>
          <p className="pricing-note">Set price per night for specific date ranges (peak season, shoulder, etc.). Ranges cannot overlap; dates without a range show "Price on request" on the website.</p>
          {rangeErr && <p className="form-err">{rangeErr}</p>}

          {addingRange && (
            <div className="form-card">
              <div className="form-row">
                <input placeholder="Label (e.g. Peak Summer)" value={newRange.label} onChange={e => setNewRange({...newRange, label: e.target.value})} />
                <input placeholder="€ per night" type="number" value={newRange.price_per_night} onChange={e => setNewRange({...newRange, price_per_night: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-field"><label>From</label><input type="date" value={newRange.date_from} onChange={e => setNewRange({...newRange, date_from: e.target.value})} /></div>
                <div className="form-field"><label>To</label><input type="date" value={newRange.date_to} onChange={e => setNewRange({...newRange, date_to: e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={addVillaRange} disabled={!newRange.label || !newRange.date_from || !newRange.date_to || !newRange.price_per_night}>Save range</button>
                <button className="btn-ghost" onClick={() => { setAddingRange(false); setRangeErr('') }}>Cancel</button>
              </div>
            </div>
          )}

          {villaPrices.length === 0 && !addingRange && (
            <div className="empty-state-with-action">
              <p className="empty-state">No pricing ranges set yet.</p>
              <button className="btn-ghost" onClick={seedVillaDefaults}>Seed default seasonal pricing</button>
            </div>
          )}
          {villaPrices.length > 0 && (
            <table className="data-table">
              <thead><tr><th>Label</th><th>From</th><th>To</th><th>€/night</th><th></th></tr></thead>
              <tbody>
                {villaPrices.map(r => (
                  editingId === r.id ? (
                    <tr key={r.id} className="editing-row">
                      <td><input value={editRow.label} onChange={e => setEditRow({...editRow, label: e.target.value})} /></td>
                      <td><input type="date" value={editRow.date_from} onChange={e => setEditRow({...editRow, date_from: e.target.value})} /></td>
                      <td><input type="date" value={editRow.date_to} onChange={e => setEditRow({...editRow, date_to: e.target.value})} /></td>
                      <td><input type="number" value={editRow.price_per_night} onChange={e => setEditRow({...editRow, price_per_night: e.target.value})} className="price-input" /></td>
                      <td className="row-actions">
                        <button className="btn-sm btn-sm--save" onClick={() => updateVillaRange(r.id)}>Save</button>
                        <button className="btn-sm" onClick={() => { setEditingId(null); setRangeErr('') }}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id}>
                      <td>{r.label}</td>
                      <td>{fmt(r.date_from)}</td>
                      <td>{fmt(r.date_to)}</td>
                      <td>€{r.price_per_night}</td>
                      <td className="row-actions">
                        <button className="btn-sm" onClick={() => { setEditingId(r.id); setEditRow({...r}); setAddingRange(false) }}>Edit</button>
                        <button className="btn-sm btn-sm--danger" onClick={() => deleteVillaRange(r.id)}>Remove</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── LEADS TAB (Poderetto interest + harvest sign-ups) ─────
const LEAD_KINDS = { poderetto: 'Poderetto interest', harvest: 'Next harvest sign-up' }
function Leads() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')
  useEffect(() => {
    supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setErr(error.message)
      else setRows(data || [])
    })
  }, [])
  return (
    <div className="tab-content">
      <div className="tab-header"><h2>Leads</h2></div>
      {err ? (
        <p className="empty-state">Leads table not available yet ({err}). New leads are still emailed to the estate inbox.</p>
      ) : rows.length === 0 ? <p className="empty-state">No leads yet.</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Form</th><th>Name</th><th>Email</th><th>Received</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{LEAD_KINDS[r.kind] || r.kind}</td>
                  <td>{r.name || '—'}</td>
                  <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                  <td>{fmt(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── USER MANAGEMENT TAB ───────────────────────────────────
const EMPTY_USER = { name: '', email: '', password: '' }
function Users({ adminId }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_USER)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('admin_users').select('id, name, email, created_at').order('created_at')
    setUsers(data || [])
  }

  async function callAdmin(payload) {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Something went wrong')
    return json
  }

  async function createUser() {
    setErr('')
    if (form.password.length < 8) { setErr('Password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      await callAdmin({ action: 'create-user', ...form })
      closeForm()
      fetchUsers()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeUser(u) {
    if (!confirm(`Remove ${u.name || u.email} as an admin? They will no longer be able to sign in.`)) return
    setErr('')
    try {
      await callAdmin({ action: 'delete-user', id: u.id })
      fetchUsers()
    } catch (e) {
      setErr(e.message)
    }
  }

  function closeForm() { setAdding(false); setForm(EMPTY_USER); setErr('') }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Admin Users</h2>
        <button className="btn-primary" onClick={() => (adding ? closeForm() : setAdding(true))}>+ Add user</button>
      </div>
      {adding && (
        <div className="form-card">
          <div className="form-row">
            <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <input placeholder="Temporary password (min 8 characters)" type="password" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <div className="form-actions">
            <button className="btn-primary" onClick={createUser} disabled={saving || !form.name.trim() || !form.email.trim() || !form.password}>
              {saving ? 'Creating…' : 'Create user'}
            </button>
            <button className="btn-ghost" onClick={closeForm}>Cancel</button>
          </div>
        </div>
      )}
      {err && <p className="form-err">{err}</p>}
      <table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Added</th><th></th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name} {u.id === adminId && <span className="you-badge">you</span>}</td>
              <td>{u.email}</td>
              <td>{fmt(u.created_at)}</td>
              <td className="row-actions">
                {u.id !== adminId && <button className="btn-sm btn-sm--danger" onClick={() => removeUser(u)}>Remove</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── LOGIN ─────────────────────────────────────────────────
function AdminLogin({ theme, setTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function login(e) {
    e.preventDefault()
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErr(error.message); setLoading(false) }
  }

  return (
    <div className={`admin-login ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="login-card">
        <div className="login-logo">Granciare</div>
        <p className="login-sub">Admin Portal</p>
        <form onSubmit={login}>
          <div className="login-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <button className="theme-toggle-sm" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
      </div>
    </div>
  )
}

// ── SITE CONFIG EDITOR (shared by Granciare + Solivé details) ──
function useSiteConfig(defaults) {
  const [config, setConfig] = useState(defaults)
  useEffect(() => {
    supabase.from('site_config').select('key,value').in('key', Object.keys(defaults))
      .then(({ data }) => {
        if (data && data.length) {
          const merged = { ...defaults }
          data.forEach(r => { merged[r.key] = r.value })
          setConfig(merged)
        }
      })
  }, [])
  return [config, setConfig]
}

function ConfigField({ label, value, onChange, max, hint }) {
  return (
    <div className="cfg-field">
      <label className="cfg-label">{label}</label>
      <input className="cfg-input" value={value || ''} maxLength={max} onChange={e => onChange(e.target.value)} />
      <span className="cfg-count">{hint ? `${hint} · ` : ''}{(value || '').length} / {max}</span>
    </div>
  )
}

function SaveButton({ saving, saved, onClick }) {
  return (
    <button className="btn-primary cfg-save" onClick={onClick} disabled={saving}>
      {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
    </button>
  )
}

function useSaver(config) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  async function save(keys, validate) {
    setErr('')
    const msg = validate ? validate() : ''
    if (msg) { setErr(msg); return }
    setSaving(true)
    const rows = keys.map(key => ({ key, value: String(config[key] ?? '').trim() }))
    const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    if (error) { setErr(error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return { saving, saved, err, save }
}

// ── GRANCIARE DETAILS ─────────────────────────────────────
const STAT_KEYS = ['granciare_stat1_value', 'granciare_stat1_label', 'granciare_stat2_value', 'granciare_stat2_label', 'granciare_stat3_value', 'granciare_stat3_label']
const DEFAULT_BOOKING_TAGS = ['Private Chef', 'Truffle Hunting', 'Regular Cleaning', 'Wine Tasting', 'Olive Oil Tour', 'Airport Transfer', 'Yoga Sessions']
function parseList(v, fallback) {
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : fallback } catch { return fallback }
}

function GranciareDetails() {
  const [config, setConfig] = useSiteConfig({
    granciare_stat1_value: '7,000', granciare_stat1_label: 'Olive Trees',
    granciare_stat2_value: '194 ha', granciare_stat2_label: 'Estate Hectares',
    granciare_stat3_value: '8',     granciare_stat3_label: 'Bedrooms',
    booking_tags: JSON.stringify(DEFAULT_BOOKING_TAGS),
    booking_default_tags: JSON.stringify(['Olive Oil Tour']),
    allow_partial_bookings: 'no',
  })
  const stats = useSaver(config)
  const partialSaver = useSaver(config)
  const partialOn = String(config.allow_partial_bookings).toLowerCase() === 'yes'
  const tagsSaver = useSaver(config)
  const [newTag, setNewTag] = useState('')
  const set = key => v => setConfig(c => ({ ...c, [key]: v }))

  const tags = parseList(config.booking_tags, DEFAULT_BOOKING_TAGS)
  const defaults = parseList(config.booking_default_tags, [])
  const setTags = (list, defs = defaults) => setConfig(c => ({
    ...c, booking_tags: JSON.stringify(list), booking_default_tags: JSON.stringify(defs.filter(d => list.includes(d))),
  }))
  function addTag() {
    const tag = newTag.trim().slice(0, 40)
    if (!tag || tags.some(x => x.toLowerCase() === tag.toLowerCase())) { setNewTag(''); return }
    setTags([...tags, tag]); setNewTag('')
  }
  const toggleDefault = tag => setConfig(c => ({ ...c, booking_default_tags: JSON.stringify(defaults.includes(tag) ? defaults.filter(d => d !== tag) : [...defaults, tag]) }))
  const moveTag = (i, dir) => { const j = i + dir; if (j < 0 || j >= tags.length) return; const n = [...tags]; [n[i], n[j]] = [n[j], n[i]]; setTags(n) }

  const validateStats = () => STAT_KEYS.some(k => !String(config[k] || '').trim()) ? 'Every value and label needs to be filled in.' : ''

  return (
    <div className="cfg-page">
      <p className="cfg-intro">Edit the three headline stats shown on the Granciare page beneath the intro text.</p>
      {[1, 2, 3].map(n => (
        <div key={n} className="cfg-card">
          <h3 className="cfg-card__title">Stat {n}</h3>
          <ConfigField label="Value" max={12} value={config[`granciare_stat${n}_value`]} onChange={set(`granciare_stat${n}_value`)} hint="e.g. 7,000" />
          <ConfigField label="Label" max={24} value={config[`granciare_stat${n}_label`]} onChange={set(`granciare_stat${n}_label`)} hint="e.g. Olive Trees" />
        </div>
      ))}
      {stats.err && <p className="form-err">{stats.err}</p>}
      <SaveButton saving={stats.saving} saved={stats.saved} onClick={() => stats.save(STAT_KEYS, validateStats)} />

      <div className="cfg-card cfg-card--spaced">
        <h3 className="cfg-card__title">Booking form · partial bookings</h3>
        <p className="cfg-intro">When on, guests choose "Book a floor" (up to 8 guests) or "Book entire villa" on the booking form. When off, the choice is hidden and every enquiry is for the entire villa.</p>
        <div className="cfg-toggle" role="radiogroup" aria-label="Allow partial bookings">
          <span className="cfg-label" style={{ marginBottom: 0 }}>Allow partial bookings</span>
          {['yes', 'no'].map(v => (
            <button key={v} type="button" role="radio" aria-checked={(partialOn ? 'yes' : 'no') === v}
              className={`cfg-toggle__opt ${(partialOn ? 'yes' : 'no') === v ? 'cfg-toggle__opt--on' : ''}`}
              onClick={() => setConfig(c => ({ ...c, allow_partial_bookings: v }))}>
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
        {partialSaver.err && <p className="form-err">{partialSaver.err}</p>}
        <SaveButton saving={partialSaver.saving} saved={partialSaver.saved} onClick={() => partialSaver.save(['allow_partial_bookings'])} />
      </div>

      <div className="cfg-card cfg-card--spaced">
        <h3 className="cfg-card__title">Booking form · special-request tags</h3>
        <p className="cfg-intro">Tags guests can pick on the booking form. ★ marks the tags that are pre-selected.</p>
        <div className="cfg-tags">
          {tags.map((tag, i) => (
            <div key={tag} className={`cfg-tag ${defaults.includes(tag) ? 'cfg-tag--default' : ''}`}>
              <button className="cfg-tag__btn" onClick={() => toggleDefault(tag)} title="Pre-select on the form">{defaults.includes(tag) ? '★' : '☆'}</button>
              <span>{tag}</span>
              <button className="cfg-tag__btn" onClick={() => moveTag(i, -1)} disabled={i === 0} aria-label="Move left">‹</button>
              <button className="cfg-tag__btn" onClick={() => moveTag(i, 1)} disabled={i === tags.length - 1} aria-label="Move right">›</button>
              <button className="cfg-tag__btn" onClick={() => setTags(tags.filter(x => x !== tag))} aria-label={`Remove ${tag}`}>✕</button>
            </div>
          ))}
        </div>
        <div className="cfg-tag-add">
          <input className="cfg-input" placeholder="New tag (e.g. Truffle Hunting)" maxLength={40} value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTag() }} />
          <button className="btn-ghost" onClick={addTag} disabled={!newTag.trim()}>Add tag</button>
        </div>
        {tagsSaver.err && <p className="form-err">{tagsSaver.err}</p>}
        <SaveButton saving={tagsSaver.saving} saved={tagsSaver.saved}
          onClick={() => tagsSaver.save(['booking_tags', 'booking_default_tags'], () => tags.length ? '' : 'Keep at least one tag.')} />
      </div>
    </div>
  )
}

// ── SOLIVÉ DETAILS ────────────────────────────────────────
const SOLIVE_KEYS = ['solive_acidity', 'solive_polyphenols', 'solive_harvest_year', 'solive_cultivar']
function SoliveDetails() {
  const [config, setConfig] = useSiteConfig({
    solive_acidity: '< 0.2%', solive_polyphenols: '487', solive_harvest_year: '2026-2027', solive_cultivar: 'Moraiolo',
  })
  const saver = useSaver(config)
  const set = key => v => setConfig(c => ({ ...c, [key]: v }))
  const validate = () => {
    if (SOLIVE_KEYS.some(k => !String(config[k] || '').trim())) return 'Every field needs to be filled in.'
    if (!/^\d{4}(\s*[-–]\s*\d{4})?$/.test(String(config.solive_harvest_year).trim())) return 'Harvest year must be a year or season, e.g. 2026 or 2026-2027.'
    return ''
  }
  return (
    <div className="cfg-page">
      <p className="cfg-intro">Edit the Solivé chemistry panel. The harvest year also updates the product heading and the sticky order bar on the Olive Oil page.</p>
      <div className="cfg-card">
        <h3 className="cfg-card__title">Chemistry Panel</h3>
        <div className="cfg-grid">
          <ConfigField label="Acidity" max={12} value={config.solive_acidity} onChange={set('solive_acidity')} hint="e.g. < 0.2%" />
          <ConfigField label="Polyphenols mg/kg" max={8} value={config.solive_polyphenols} onChange={set('solive_polyphenols')} hint="e.g. 487" />
          <ConfigField label="Harvest Year" max={11} value={config.solive_harvest_year} onChange={set('solive_harvest_year')} hint="e.g. 2026-2027" />
          <ConfigField label="Cultivar" max={20} value={config.solive_cultivar} onChange={set('solive_cultivar')} hint="e.g. Moraiolo" />
        </div>
      </div>
      {saver.err && <p className="form-err">{saver.err}</p>}
      <SaveButton saving={saver.saving} saved={saver.saved} onClick={() => saver.save(SOLIVE_KEYS, validate)} />
    </div>
  )
}

// ── ADMIN PANEL (authenticated) ───────────────────────────
function AdminPanel({ session, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('stay-requests')
  const adminName = session.user.user_metadata?.name || session.user.email
  const adminId = session.user.id
  const [navOpen, setNavOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
  }

  const tabMap = {
    'stay-requests':      <StayRequests adminName={adminName} />,
    'stay-confirmations': <StayConfirmations />,
    'oil-requests':       <OilRequests adminName={adminName} />,
    'oil-confirmations':  <OilConfirmations />,
    'photos':             <Photos />,
    'testimonials':       <Testimonials />,
    'pricing':            <Pricing />,
    'granciare-details':  <GranciareDetails />,
    'solive-details':     <SoliveDetails />,
    'leads':              <Leads />,
    'users':              <Users adminId={adminId} />,
  }

  return (
    <div className={`admin-shell ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${navOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">G</span>
          <span className="sidebar-name">Granciare</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sidebar-item ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.id); setNavOpen(false) }}
            >
              <span className="sidebar-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user">{adminName}</p>
          <button className="sidebar-logout" onClick={logout}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setNavOpen(o => !o)} aria-label="Menu">☰</button>
          <h1 className="topbar-title">{TABS.find(t => t.id === activeTab)?.label}</h1>
          <div className="topbar-right">
            <NotificationBell theme={theme} userId={adminId} />
            <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        <div className="admin-body">
          {tabMap[activeTab]}
        </div>
      </main>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────
export default function Admin() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('admin-theme') || 'light')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-theme', theme)
  }, [theme])

  if (loading) return (
    <div className={`admin-loading ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="loading-spinner" />
    </div>
  )

  if (!session) return <AdminLogin theme={theme} setTheme={setTheme} />
  return <AdminPanel session={session} theme={theme} setTheme={setTheme} />
}
