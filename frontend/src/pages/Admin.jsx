import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
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
  pool:        'Pool & Amenities',
  bedrooms:    'Rooms & Suites',
  olive_oil:   'Olive Oil',
}

const OIL_QUANTITIES = [1, 5, 12, 25, 50, 100]

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
function nights(ci, co) {
  if (!ci || !co) return 0
  return Math.round((new Date(co) - new Date(ci)) / 86400000)
}

// ── NOTIFICATION BELL ──────────────────────────────────────
function NotificationBell({ theme }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState([])
  const ref = useRef()

  useEffect(() => {
    fetchNotifs()
    const ch = supabase.channel('notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchNotifs())
      .subscribe()
    return () => supabase.removeChannel(ch)
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

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    fetchNotifs()
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    fetchNotifs()
  }

  const unread = notes.filter(n => !n.is_read).length

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)}>
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
            <div key={n.id} className={`notif-item ${!n.is_read ? 'notif-item--unread' : ''}`} onClick={() => markRead(n.id)}>
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
            <td>{nights(row.check_in, row.check_out)}n · {row.adults}A {row.children > 0 ? `${row.children}C` : ''}</td>
          </>
        ) : (
          <td>{row.quantity} bottles</td>
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
              {row.phone && <p><strong>Phone:</strong> {row.phone}</p>}
              {row.message && <p><strong>Message:</strong> {row.message}</p>}
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
      {rows.length === 0 ? <p className="empty-state">No stay requests yet.</p> : (
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

  return (
    <div className="tab-content">
      <div className="tab-header"><h2>Stay Confirmations</h2></div>
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
                <p className="confirm-name">{r.name}</p>
                <p className="confirm-meta">{r.email} {r.phone && `· ${r.phone}`}</p>
                <p className="confirm-guests">{r.adults} adults{r.children > 0 ? `, ${r.children} children` : ''}</p>
                {r.special_requests && (
                  <div className="confirm-special">
                    <span>Special requests:</span> {r.special_requests}
                  </div>
                )}
                {r.message && <p className="confirm-msg">"{r.message}"</p>}
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
      {rows.length === 0 ? <p className="empty-state">No oil requests yet.</p> : (
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
                <span className="confirm-nights">{r.quantity} bottles</span>
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
  const [catFilter, setCatFilter] = useState('all')
  const fileRef = useRef()

  const stayCategories = ['mansion','landscape','pool','dining','kitchen','bedrooms','living_areas','bathrooms','lounge_bar','awards']
  const oilCategories  = ['olive_oil','awards']
  const activeCats     = tab === 'stay' ? stayCategories : oilCategories

  useEffect(() => { fetchPhotos() }, [tab, catFilter])

  async function fetchPhotos() {
    let q = supabase.from('photos').select('*').in('category', tab === 'stay' ? stayCategories : oilCategories).order('created_at', { ascending: false })
    if (catFilter !== 'all') q = q.eq('category', catFilter)
    const { data } = await q
    setPhotos(data || [])
  }

  async function upload(files) {
    setUploading(true)
    for (const file of Array.from(files)) {
      const ext  = file.name.split('.').pop()
      const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', path)
      formData.append('tab', tab)
      const res  = await fetch('/api/admin-upload', { method: 'POST', body: formData })
      const { publicUrl, category } = await res.json()
      await supabase.from('photos').insert({ storage_path: path, public_url: publicUrl, category, alt_text: file.name })
      await supabase.from('notifications').insert({ type: 'photo_added', title: 'New photo added', body: `Category: ${category}` })
    }
    setUploading(false)
    fetchPhotos()
  }

  async function toggleFeatured(photo) {
    if (!FEATURED_SECTIONS[photo.category]) return
    await supabase.from('photos').update({ is_featured: !photo.is_featured }).eq('id', photo.id)
    fetchPhotos()
  }

  async function deletePhoto(photo) {
    if (!confirm('Delete this photo?')) return
    await fetch('/api/admin-upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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

      {photos.length === 0 ? <p className="empty-state">No photos in this category.</p> : (
        <div className="photos-grid">
          {photos.map(p => (
            <div key={p.id} className={`photo-card ${p.is_featured ? 'photo-card--featured' : ''}`}>
              <img src={p.public_url} alt={p.alt_text} loading="lazy" />
              <div className="photo-card__info">
                <span className="photo-cat">{p.category.replace('_', ' ')}</span>
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
function Testimonials() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ reviewer_name: '', location: '', rating: 5, review_text: '', stay_date: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchRows() }, [])

  async function fetchRows() {
    const { data } = await supabase.from('testimonials').select('*').order('sort_order').order('created_at', { ascending: false })
    setRows(data || [])
  }

  async function save() {
    await supabase.from('testimonials').insert(form)
    setForm({ reviewer_name: '', location: '', rating: 5, review_text: '', stay_date: '' })
    setAdding(false)
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

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Testimonials</h2>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>+ Add testimonial</button>
      </div>

      {adding && (
        <div className="form-card">
          <div className="form-row">
            <input placeholder="Reviewer name *" value={form.reviewer_name} onChange={e => setForm({...form, reviewer_name: e.target.value})} />
            <input placeholder="Location (e.g. London, UK)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
          </div>
          <div className="form-row">
            <input placeholder="Stay date (e.g. October 2026)" value={form.stay_date} onChange={e => setForm({...form, stay_date: e.target.value})} />
            <select value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})}>
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} stars</option>)}
            </select>
          </div>
          <textarea placeholder="Review text *" rows={4} value={form.review_text} onChange={e => setForm({...form, review_text: e.target.value})} />
          <div className="form-actions">
            <button className="btn-primary" onClick={save} disabled={!form.reviewer_name || !form.review_text}>Save</button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="testimonial-list">
        {rows.length === 0 && <p className="empty-state">No testimonials yet.</p>}
        {rows.map(r => (
          <div key={r.id} className={`testimonial-row ${!r.is_visible ? 'testimonial-row--hidden' : ''}`}>
            <div className="testimonial-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <p className="testimonial-text">"{r.review_text}"</p>
            <p className="testimonial-meta">— {r.reviewer_name}{r.location ? `, ${r.location}` : ''}{r.stay_date ? ` · ${r.stay_date}` : ''}</p>
            <div className="testimonial-actions">
              <button className="btn-sm" onClick={() => toggleVisible(r.id, r.is_visible)}>
                {r.is_visible ? 'Hide' : 'Show'}
              </button>
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

  useEffect(() => {
    supabase.from('oil_pricing').select('*').order('quantity').then(({ data }) => {
      const map = {}
      ;(data || []).forEach(r => { map[r.quantity] = r.price_per_bottle })
      setOilPrices(map)
    })
    fetchVilla()
  }, [])

  async function fetchVilla() {
    const { data } = await supabase.from('villa_pricing').select('*').order('date_from')
    setVillaPrices(data || [])
  }

  async function saveAllOilPrices() {
    setOilSaving(true)
    const upserts = OIL_QUANTITIES.map(qty => ({
      quantity: qty,
      price_per_bottle: parseFloat(oilPrices[qty]) || 0,
      updated_at: new Date().toISOString(),
    }))
    await supabase.from('oil_pricing').upsert(upserts)
    await supabase.from('notifications').insert({ type: 'pricing_updated', title: 'Oil pricing updated', body: 'All bottle prices saved' })
    setOilSaving(false)
    setOilSaved(true)
    setTimeout(() => setOilSaved(false), 2500)
  }

  async function addVillaRange() {
    await supabase.from('villa_pricing').insert({ ...newRange, price_per_night: parseFloat(newRange.price_per_night) })
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
    await supabase.from('villa_pricing').update({
      label: editRow.label,
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
          <p className="pricing-note">Set price per bottle for each quantity tier.</p>
          <table className="data-table pricing-table">
            <thead><tr><th>Quantity</th><th>Price per bottle (€)</th></tr></thead>
            <tbody>
              {OIL_QUANTITIES.map(qty => (
                <tr key={qty}>
                  <td>{qty} bottle{qty > 1 ? 's' : ''}</td>
                  <td>
                    <input
                      type="number" step="0.50" min="0"
                      value={oilPrices[qty] || ''}
                      onChange={e => setOilPrices({ ...oilPrices, [qty]: e.target.value })}
                      className="price-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <button className="btn-primary btn-sm-ver" onClick={() => { setAddingRange(a => !a); setEditingId(null) }}>+ Add range</button>
          </div>
          <p className="pricing-note">Set price per night for specific date ranges (peak season, shoulder, etc.)</p>

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
                <button className="btn-ghost" onClick={() => setAddingRange(false)}>Cancel</button>
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
                        <button className="btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
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

// ── USER MANAGEMENT TAB ───────────────────────────────────
function Users({ adminName }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('admin_users').select('id, name, email, created_at').order('created_at')
    setUsers(data || [])
  }

  async function createUser() {
    setSaving(true); setErr('')
    const res = await fetch('/api/admin-create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setErr(json.error || 'Failed to create user'); setSaving(false); return }
    setForm({ name: '', email: '', password: '' })
    setAdding(false)
    setSaving(false)
    fetchUsers()
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Admin Users</h2>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>+ Add user</button>
      </div>

      {adding && (
        <div className="form-card">
          <div className="form-row">
            <input placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <input placeholder="Temporary password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          {err && <p className="form-err">{err}</p>}
          <div className="form-actions">
            <button className="btn-primary" onClick={createUser} disabled={saving || !form.name || !form.email || !form.password}>
              {saving ? 'Creating…' : 'Create user'}
            </button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setErr('') }}>Cancel</button>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Added</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name} {u.name === adminName && <span className="you-badge">you</span>}</td>
              <td>{u.email}</td>
              <td>{fmt(u.created_at)}</td>
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

// ── GRANCIARE DETAILS ─────────────────────────────────────
function GranciareDetails() {
  const DEFAULTS = {
    granciare_stat1_value: '7,000',
    granciare_stat1_label: 'Olive Trees',
    granciare_stat2_value: '194 ha',
    granciare_stat2_label: 'Estate Hectares',
    granciare_stat3_value: '8',
    granciare_stat3_label: 'Bedrooms',
  }
  const [config, setConfig] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('site_config').select('key,value').in('key', Object.keys(DEFAULTS))
      .then(({ data }) => {
        if (data && data.length) {
          const merged = { ...DEFAULTS }
          data.forEach(r => { merged[r.key] = r.value })
          setConfig(merged)
        }
      })
  }, [])

  async function save() {
    setSaving(true)
    const rows = Object.entries(config).map(([key, value]) => ({ key, value }))
    await supabase.from('site_config').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function field(key, label) {
    return (
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px' }}>{label}</label>
        <input
          value={config[key] || ''}
          onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, padding: '32px 0' }}>
      <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>
        Edit the three headline stats shown on the Granciare page beneath the intro text.
      </p>
      <div style={{ background: '#f8f7f5', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: '#555' }}>Stat 1</h3>
        {field('granciare_stat1_value', 'Value (e.g. 7,000)')}
        {field('granciare_stat1_label', 'Label (e.g. Olive Trees)')}
      </div>
      <div style={{ background: '#f8f7f5', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: '#555' }}>Stat 2</h3>
        {field('granciare_stat2_value', 'Value (e.g. 194 ha)')}
        {field('granciare_stat2_label', 'Label (e.g. Estate Hectares)')}
      </div>
      <div style={{ background: '#f8f7f5', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: '#555' }}>Stat 3</h3>
        {field('granciare_stat3_value', 'Value (e.g. 8)')}
        {field('granciare_stat3_label', 'Label (e.g. Bedrooms)')}
      </div>
      <button className="btn-action" onClick={save} disabled={saving} style={{ minWidth: '140px' }}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── SOLIVÉ DETAILS ────────────────────────────────────────
function SoliveDetails() {
  const DEFAULTS = {
    solive_rating:        '5',
    solive_review_count:  '47',
    solive_acidity:       '< 0.2%',
    solive_polyphenols:   '487',
    solive_harvest_year:  '2025',
    solive_cultivar:      'Moraiolo',
  }
  const [config, setConfig] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('site_config').select('key,value').in('key', Object.keys(DEFAULTS))
      .then(({ data }) => {
        if (data && data.length) {
          const merged = { ...DEFAULTS }
          data.forEach(r => { merged[r.key] = r.value })
          setConfig(merged)
        }
      })
  }, [])

  async function save() {
    setSaving(true)
    const rows = Object.entries(config).map(([key, value]) => ({ key, value }))
    await supabase.from('site_config').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function field(key, label) {
    return (
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px' }}>{label}</label>
        <input
          value={config[key] || ''}
          onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
        />
      </div>
    )
  }

  const stars = parseInt(config.solive_rating) || 5

  return (
    <div style={{ maxWidth: 560, padding: '32px 0' }}>
      <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>
        Edit the Solivé product stats shown on the Olive Oil page — ratings, review count, and chemistry panel.
      </p>

      <div style={{ background: '#f8f7f5', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: '#555' }}>Ratings</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '24px', color: '#2d6a4f', letterSpacing: '2px' }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </span>
          <span style={{ fontSize: '13px', color: '#888' }}>Preview</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            {field('solive_rating', 'Star Rating (1–5)')}
          </div>
          <div>
            {field('solive_review_count', 'Number of Reviews')}
          </div>
        </div>
      </div>

      <div style={{ background: '#f8f7f5', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: '#555' }}>Chemistry Panel</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {field('solive_acidity', 'Acidity (e.g. < 0.2%)')}
          {field('solive_polyphenols', 'Polyphenols mg/kg (e.g. 487)')}
          {field('solive_harvest_year', 'Harvest Year (e.g. 2025)')}
          {field('solive_cultivar', 'Cultivar (e.g. Moraiolo)')}
        </div>
      </div>

      <button className="btn-action" onClick={save} disabled={saving} style={{ minWidth: '140px' }}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── ADMIN PANEL (authenticated) ───────────────────────────
function AdminPanel({ session, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('stay-requests')
  const adminName = session.user.user_metadata?.name || session.user.email

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
    'users':              <Users adminName={adminName} />,
  }

  return (
    <div className={`admin-shell ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">G</span>
          <span className="sidebar-name">Granciare</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sidebar-item ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
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
          <h1 className="topbar-title">{TABS.find(t => t.id === activeTab)?.label}</h1>
          <div className="topbar-right">
            <NotificationBell theme={theme} />
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
