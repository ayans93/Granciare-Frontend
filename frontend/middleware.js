/**
 * Vercel Edge Middleware — IP Whitelist + Admin Password Gate
 *
 * Access is granted if ANY of the following are true:
 *   1. IP_WHITELIST env var is empty (open to all — use to go live)
 *   2. Visitor's IP is in the IP_WHITELIST
 *   3. Visitor has a valid granciare_admin session cookie (set via /api/admin-login)
 *
 * Admin login: click "Admin Login" on the maintenance page → enter email + password.
 */

// Session token — must match SESSION_TOKEN in api/admin-login.js
const SESSION_TOKEN = 'grc-adm-2026-x7k9m4p2';

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};

// ── Helper: parse cookies from Cookie header ────────────────────
function getCookies(request) {
  const header = request.headers.get('cookie') || '';
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=').trim()];
    })
  );
}

// ── Branded maintenance page with Admin Login modal ─────────────
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

    /* ── Admin login button ── */
    #admin-btn {
      position: fixed;
      top: 20px;
      right: 24px;
      background: transparent;
      border: 1px solid rgba(201, 169, 110, 0.4);
      color: rgba(201, 169, 110, 0.7);
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 8px 16px;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      z-index: 10;
    }
    #admin-btn:hover {
      border-color: #c9a96e;
      color: #c9a96e;
      background: rgba(201, 169, 110, 0.06);
    }

    /* ── Modal overlay ── */
    #modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 10, 0.82);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 24px;
    }
    #modal.open { display: flex; }

    .modal-box {
      background: #2a2724;
      border: 1px solid rgba(201, 169, 110, 0.2);
      padding: 40px 36px;
      width: 100%;
      max-width: 380px;
      text-align: left;
      position: relative;
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 18px;
      background: none;
      border: none;
      color: rgba(250, 248, 245, 0.35);
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      transition: color 0.15s;
    }
    .modal-close:hover { color: #faf8f5; }

    .modal-eyebrow {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #c9a96e;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .modal-title {
      font-size: 22px;
      font-weight: 400;
      color: #faf8f5;
      margin-bottom: 28px;
    }

    .modal-field {
      margin-bottom: 16px;
    }
    .modal-field label {
      display: block;
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(250, 248, 245, 0.45);
      margin-bottom: 7px;
    }
    .modal-field input {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(201, 169, 110, 0.2);
      color: #faf8f5;
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 14px;
      padding: 11px 14px;
      outline: none;
      transition: border-color 0.2s;
      -webkit-appearance: none;
    }
    .modal-field input::placeholder { color: rgba(250, 248, 245, 0.25); }
    .modal-field input:focus { border-color: #c9a96e; }

    #login-submit {
      width: 100%;
      margin-top: 8px;
      background: #c9a96e;
      color: #1e1c1a;
      border: none;
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 14px;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }
    #login-submit:hover { background: #d4b87a; }
    #login-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    #login-error {
      margin-top: 14px;
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 12px;
      color: #e07070;
      min-height: 18px;
      text-align: center;
    }

    /* ── Main page content ── */
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

  <!-- Admin login button (top-right) -->
  <button id="admin-btn" onclick="openModal()">Admin Login</button>

  <!-- Login modal -->
  <div id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
      <p class="modal-eyebrow">Granciare Estate</p>
      <h2 class="modal-title" id="modal-title">Admin Access</h2>

      <div class="modal-field">
        <label for="email">Email Address</label>
        <input type="email" id="email" placeholder="your@email.com" autocomplete="email" />
      </div>
      <div class="modal-field">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="••••••••••••" autocomplete="current-password" />
      </div>

      <button id="login-submit" onclick="submitLogin()">Enter Estate</button>
      <p id="login-error"></p>
    </div>
  </div>

  <!-- Main content -->
  <p class="eyebrow">Umbria, Italy &nbsp;·&nbsp; Luxury Estate</p>
  <h1>Granciare</h1>
  <p class="subtitle">Estate &amp; Agri-Tourism</p>
  <div class="divider"></div>
  <p class="message">
    We are putting the finishing touches on something beautiful.<br>
    The estate will be ready to welcome you very soon.
  </p>
  <footer>granciare.com &nbsp;·&nbsp; 2026</footer>

  <script>
    function openModal() {
      document.getElementById('modal').classList.add('open');
      setTimeout(() => document.getElementById('email').focus(), 50);
    }
    function closeModal() {
      document.getElementById('modal').classList.remove('open');
      document.getElementById('login-error').textContent = '';
    }

    // Close on backdrop click
    document.getElementById('modal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });

    // Enter key submits form
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter' && document.getElementById('modal').classList.contains('open')) {
        submitLogin();
      }
    });

    async function submitLogin() {
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn      = document.getElementById('login-submit');
      const errEl    = document.getElementById('login-error');

      if (!email || !password) {
        errEl.textContent = 'Please enter your email and password.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Verifying…';
      errEl.textContent = '';

      try {
        const res = await fetch('/api/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          btn.textContent = 'Welcome ✓';
          window.location.reload();
        } else {
          const data = await res.json().catch(() => ({}));
          errEl.textContent = data.error || 'Invalid email or password.';
          btn.disabled = false;
          btn.textContent = 'Enter Estate';
          document.getElementById('password').value = '';
          document.getElementById('password').focus();
        }
      } catch (err) {
        errEl.textContent = 'Connection error. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Enter Estate';
      }
    }
  </script>
</body>
</html>`;

// ── Middleware handler ──────────────────────────────────────────
export default function middleware(request) {
  // 1. Check for valid admin session cookie — always grants access
  const cookies = getCookies(request);
  if (cookies['granciare_admin'] === SESSION_TOKEN) return;

  // 2. Check IP whitelist
  const ip =
    request.headers.get('x-vercel-ip-address') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '';

  const rawList  = process.env.IP_WHITELIST || '';
  const whitelist = rawList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // If no whitelist configured → let everyone through
  if (whitelist.length === 0) return;

  // If IP is whitelisted → let through
  if (ip && whitelist.includes(ip)) return;

  // 3. Otherwise → branded maintenance page with login modal
  return new Response(MAINTENANCE_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
