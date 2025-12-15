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
  const v = (url || '').replace(/^https?:\/\//, '').trim()
  return v || fallback
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  const appHost = toHost(process.env.NEXT_PUBLIC_APP_URL, 'console.sleepcomet.com')
  const statusHost = toHost(process.env.NEXT_PUBLIC_STATUS_URL, 'status.sleepcomet.com')

  if (hostname === statusHost) {
    return NextResponse.rewrite(new URL(`/status${pathname}`, request.url))
  }

  if (hostname === appHost) {
    if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    const { getSessionCookie } = await import('better-auth/cookies')
    const session = getSessionCookie(request)
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return NextResponse.next()
  }

  if (hostname && !hostname.endsWith('vercel.app')) {
    return NextResponse.rewrite(new URL(`/status/${hostname}${pathname}`, request.url))
  }

  return NextResponse.next()
}
