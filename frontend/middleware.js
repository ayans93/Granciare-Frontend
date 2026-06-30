/**
 * Vercel Edge Middleware — IP Whitelist
 *
 * Set IP_WHITELIST in Vercel environment variables as a comma-separated list
 * of allowed IP addresses (e.g. "1.2.3.4,5.6.7.8").
 *
 * - If IP_WHITELIST is empty → everyone can access (use this to go fully live)
 * - If IP_WHITELIST has entries → only those IPs see the site; others see the
 *   coming-soon page
 */

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|robots.txt).*)'],
};

const COMING_SOON_HTML = `<!DOCTYPE html>
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
      letter-spacing: 0.22em;
      color: #c9a96e;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    h1 {
      font-size: clamp(48px, 10vw, 80px);
      font-weight: 400;
      line-height: 1;
      color: #faf8f5;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: clamp(16px, 3vw, 20px);
      font-style: italic;
      color: #c9a96e;
      margin-bottom: 40px;
    }
    .rule {
      width: 48px;
      height: 1.5px;
      background: #c9a96e;
      opacity: 0.65;
      margin: 0 auto 40px;
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
  <div class="rule"></div>
  <p class="message">
    We are putting the finishing touches on something beautiful.<br>
    The estate will be ready to welcome you very soon.
  </p>
  <footer>granciare.com &nbsp;·&nbsp; 2026</footer>
</body>
</html>`;

export default function middleware(request) {
  const rawList = process.env.IP_WHITELIST || '';
  const whitelist = rawList.split(',').map(s => s.trim()).filter(Boolean);

  // No whitelist configured → let everyone through
  if (whitelist.length === 0) return;

  const ip =
    request.headers.get('x-vercel-ip-address') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '';

  // IP is whitelisted → let through
  if (ip && whitelist.includes(ip)) return;

  // Not whitelisted → coming soon page
  return new Response(COMING_SOON_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}
