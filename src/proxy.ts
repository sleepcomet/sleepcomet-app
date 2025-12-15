import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public images (svg, png, jpg, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Skip if it's a static asset (handled by matcher but good for safety)
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  const envUrl = process.env.NEXT_PUBLIC_STATUS_URL || 'status.sleepcomet.com'
  const baseHost = envUrl.replace(/^https?:\/\//, '')

  // If the request is for the base host, we might want to show the creation page or a landing page
  // But strictly following the "proxy" logic:
  // If it matches a custom domain (not the base host), we rewrite to /status/[domain]

  const isStatusHost = hostname === baseHost
  const isAppHost = hostname === 'localhost:3000' || hostname === 'sleepcomet.com' || hostname === 'vercel.app' // Add other app domains if needed

  if (isStatusHost) {
    // Current logic: status.localhost:3000/slug -> /status/slug
    // We rewrite to the status folder
    return NextResponse.rewrite(new URL(`/status${pathname}`, request.url))
  }

  // If it's the main app, checking for auth
  if (isAppHost) {
    if (pathname.startsWith("/auth")) {
      return NextResponse.next();
    }

    // Check for session cookie presence
    // Using getSessionCookie from better-auth/cookies to avoid bundling Prisma in middleware
    const { getSessionCookie } = await import("better-auth/cookies");
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    return NextResponse.next()
  }

  // Otherwise, assume it's a custom domain mapping to a status page
  // custom-domain.com -> /status/custom-domain.com
  return NextResponse.rewrite(new URL(`/status/${hostname}${pathname}`, request.url))
}
