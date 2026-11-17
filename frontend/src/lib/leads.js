/** Sends a lead (Poderetto interest / harvest sign-up) to the server. Throws with a readable message on failure. */
export async function submitLead(kind, { name = '', email }) {
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, name, email }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Sorry, something went wrong. Please try again.');
}
