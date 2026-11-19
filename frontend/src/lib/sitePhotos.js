import { useEffect, useState } from 'react';

// One request per page load, shared by every gallery component.
let cache;
let pending;
export function fetchSitePhotos() {
  if (cache !== undefined) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch('/api/photos')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { cache = Array.isArray(d?.photos) && d.photos.length ? d.photos : null; return cache; })
      .catch(() => { cache = null; return null; });
  }
  return pending;
}

/** null until loaded or if unavailable — callers then keep their built-in images. */
export function useSitePhotos() {
  const [photos, setPhotos] = useState(cache ?? null);
  useEffect(() => {
    let alive = true;
    fetchSitePhotos().then(p => { if (alive) setPhotos(p); });
    return () => { alive = false; };
  }, []);
  return photos;
}

function keyOf(src) {
  if (!src) return '';
  try { return decodeURI(new URL(src, window.location.origin).pathname); } catch { return src; }
}

const isBundled = p => (p.path || '').startsWith('/images/');
const photoKey = p => (isBundled(p) ? keyOf(p.path) : keyOf(p.url));

export function prettify(alt = '') {
  const s = alt.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/**
 * Applies Admin > Photos to a built-in list of images.
 *  - images deleted in admin are hidden
 *  - photos uploaded in admin for `categories` are added
 *  - the featured photo of `featuredCategory` moves to the front
 * items: [{ src, caption }]. Falls back to the built-in list if anything is off.
 */
export function applyAdminPhotos(items, photos, categories = [], featuredCategory, { strict = false } = {}) {
  if (!photos) return items;
  const byKey = new Map(photos.map(p => [photoKey(p), p]));
  const builtIn = new Set(items.map(i => keyOf(i.src)));

  // Built-in images stay unless deleted in admin. In strict mode (the photo album)
  // they must also still belong to one of this section's admin categories.
  let out = items.filter(i => {
    const p = byKey.get(keyOf(i.src));
    return p && (!strict || !categories.length || categories.includes(p.category));
  });
  // Every other admin photo in these categories is added: uploads, and built-in
  // images that admin has moved into this category.
  const extra = photos.filter(p => categories.includes(p.category) && !builtIn.has(photoKey(p)));
  out = out.concat(extra.map(p => ({ src: isBundled(p) ? p.path : p.url, caption: prettify(p.alt) })));

  if (featuredCategory) {
    const f = photos.find(p => p.featured && p.category === featuredCategory);
    if (f) {
      const k = photoKey(f);
      const idx = out.findIndex(i => keyOf(i.src) === k);
      const lead = idx >= 0 ? out.splice(idx, 1)[0] : { src: isBundled(f) ? f.path : f.url, caption: prettify(f.alt) };
      out.unshift(lead);
    }
  }
  return out.length ? out : items;
}

export function featuredPhoto(photos, category) {
  const f = photos?.find(p => p.featured && p.category === category);
  return f ? (isBundled(f) ? f.path : f.url) : null;
}
