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

function toHost(url: string | undefined, fallback: string) {
  if (!url) return fallback;
  try {
    return new URL(url).hostname;
  } catch {
    const v = url.replace(/^https?:\/\//, "").split("/")[0].trim();
    return v || fallback;
  }
}

// Copied from auth.ts for Edge compatibility
const getCookieDomain = () => {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "";
  try {
    const hostname = new URL(websiteUrl).hostname;
    if (hostname === "localhost" || hostname.endsWith(".vercel.app")) return undefined;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return "." + parts.slice(-2).join('.');
    }
  } catch { }
  return undefined;
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  const appHost = toHost(process.env.NEXT_PUBLIC_CONSOLE_URL, 'console.sleepcomet.com')
  const statusHost = toHost(process.env.NEXT_PUBLIC_STATUS_URL, 'status.sleepcomet.com')

  if (hostname === statusHost) {
    return NextResponse.rewrite(new URL(`/status${pathname}`, request.url))
  }

  const isLocal = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')
  if (hostname === appHost || isLocal) {
    if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    const { getSessionCookie } = await import('better-auth/cookies')
    const session = await getSessionCookie(request)

    // Fallback: Check standard cookie names if helper returns null
    // This ensures we don't incorrectly redirect authenticated users due to config mismatches in edge

    // We explicitly check for __Secure-better-auth.session_token first as it is the production default
    const hasSessionCookie = session ||
      request.cookies.get("__Secure-better-auth.session_token")?.value ||
      request.cookies.get("better-auth.session_token")?.value;

    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return NextResponse.next()
  }

  if (hostname && !hostname.endsWith('vercel.app') && !isLocal) {
    return NextResponse.rewrite(new URL(`/status/${hostname}${pathname}`, request.url))
  }

  return NextResponse.next()
}
