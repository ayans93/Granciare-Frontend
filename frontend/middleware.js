/**
 * Vercel Edge Middleware — IP Whitelist
 *
 * Uses @vercel/edge for reliable pass-through on Vite/non-Next.js deployments.
 *
 * Setup:
 *   1. Add IP_WHITELIST to Vercel environment variables (comma-separated IPs)
 *      e.g.  203.0.113.42,198.51.100.7
 *   2. Redeploy — the middleware activates automatically.
 *   3. To open the site to everyone, delete IP_WHITELIST or leave it empty.
 *
 * Find your current IP: https://whatismyip.com
 */

// @vercel/edge is not needed for Vite deployments.
// Returning undefined from Edge Middleware means "pass through" (same as next()).

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};

// ── Branded maintenance page ────────────────────────────────────
const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Granciare Estate — Coming Soon</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1e1c1a;
      color: #faf8f5;
      font-family: Georgia, 'Times New Roman', serif;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px;
    }
    .eyebrow {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #c9a96e;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    h1 {
      font-size: clamp(48px, 10vw, 80px);
      font-weight: 400;
      line-height: 1;
      color: #faf8f5;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: clamp(16px, 3vw, 20px);
      font-style: italic;
      color: #c9a96e;
      margin-bottom: 40px;
    }
    .divider {
      width: 48px;
      height: 1.5px;
      background: #c9a96e;
      margin: 0 auto 40px;
      opacity: 0.7;
    }
    .message {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: clamp(13px, 2vw, 15px);
      line-height: 1.9;
      color: rgba(250, 248, 245, 0.55);
      max-width: 400px;
    }
    footer {
      position: fixed;
      bottom: 28px;
      left: 0; right: 0;
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 10px;
      letter-spacing: 0.12em;
      color: rgba(250, 248, 245, 0.22);
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <p class="eyebrow">Umbria, Italy &nbsp;·&nbsp; Luxury Estate</p>
  <h1>Granciare</h1>
  <p class="subtitle">Estate &amp; Agri-Tourism</p>
  <div class="divider"></div>
  <p class="message">
    We are putting the finishing touches on something beautiful.<br>
    The estate will be ready to welcome you very soon.
  </p>
  <footer>granciare.com &nbsp;·&nbsp; 2026</footer>
</body>
</html>`;

// ── Middleware handler ──────────────────────────────────────────
export default function middleware(request) {
  // x-vercel-ip-address is Vercel's native real-IP header (most accurate)
  // Fall back to x-forwarded-for if not present
  const ip =
    request.headers.get('x-vercel-ip-address') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '';

  // Parse whitelist from env var (comma-separated IPs)
  const rawList  = process.env.IP_WHITELIST || '';
  const whitelist = rawList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // If no whitelist is configured → let everyone through (safe default)
  if (whitelist.length === 0) return;

  // If the visitor's IP is whitelisted → let them through
  if (ip && whitelist.includes(ip)) return;

  // Otherwise → show the branded maintenance page
  return new Response(MAINTENANCE_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Debug-Detected-IP': ip || 'unknown',
      'X-Debug-Whitelist': rawList || 'empty',
    },
  });
}
