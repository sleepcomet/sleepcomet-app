import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all request paths including API routes
     */
    '/(.*)',
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



export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // CORS handling for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    
    // Define allowed origins
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_WEBSITE_URL,
      process.env.NEXT_PUBLIC_WEBSITE_URL?.replace('://', '://www.'),
      'http://localhost:3001',
      'http://localhost:3000',
    ].filter(Boolean) as string[]

    // Check if the origin is allowed
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      
      if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Origin, Authorization, Content-Type')
      }
      
      return response
    }

    // Handle actual API requests - add CORS headers to the response
    const response = NextResponse.next()
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }

  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  const appHost = toHost(process.env.NEXT_PUBLIC_CONSOLE_URL, 'console.sleepcomet.com')
  const statusHost = toHost(process.env.NEXT_PUBLIC_STATUS_URL, 'status.sleepcomet.com')

  // Check if this is the status subdomain (status.sleepcomet.com or status.localhost)
  const isStatusSubdomain = hostname === statusHost || hostname.startsWith('status.localhost')

  if (isStatusSubdomain) {
    // Rewrite status.localhost:3000/slug -> /status/slug
    return NextResponse.rewrite(new URL(`/status${pathname}`, request.url))
  }

  const isLocal = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')

  // Handle main console app
  if (hostname === appHost || isLocal) {
    // Allow public access to /status/* routes
    if (pathname.startsWith('/status/')) {
      return NextResponse.next()
    }

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

  // Handle custom subdomain for status pages (e.g., mycompany.sleepcomet.com)
  if (hostname && !hostname.endsWith('vercel.app') && !isLocal) {
    // Extract the subdomain as the slug
    const slug = hostname.split('.')[0]
    return NextResponse.rewrite(new URL(`/status/${slug}${pathname}`, request.url))
  }

  return NextResponse.next()
}
