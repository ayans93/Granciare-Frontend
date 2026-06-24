/**
 * Vercel Edge Middleware
 *
 * Access gate has been moved to the React layer (AdminGate component)
 * to avoid Vercel CDN caching issues that made the middleware gate unreliable.
 *
 * This middleware now simply passes all requests through.
 * IP whitelisting / maintenance mode is handled client-side.
 */

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};

export default function middleware() {
  // Pass everything through — gate is in React (src/components/AdminGate.jsx)
  return;
}
