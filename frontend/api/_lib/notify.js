// Adds an item to the admin bell. If the table rejects the specific type
// (e.g. a CHECK constraint on `type`), retry with a generic type so the alert still appears.
export async function notify(sb, { type, title, body, related_id }) {
  const row = { type, title, body };
  if (related_id) row.related_id = related_id;
  let { error } = await sb.from('notifications').insert(row);
  if (error) {
    console.error(`notifications insert (${type}) failed:`, error.message);
    ({ error } = await sb.from('notifications').insert({ ...row, type: 'status_changed' }));
    if (error) console.error('notifications fallback insert failed:', error.message);
  }
  return !error;
}
