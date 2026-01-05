import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Old domain that should redirect to the new canonical domain
const OLD_DOMAINS = ['flywheel-coach.vercel.app']
const CANONICAL_DOMAIN = 'jkkn-solution-studio.vercel.app'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Redirect old domains to canonical domain
  if (OLD_DOMAINS.some(domain => hostname.includes(domain))) {
    const url = request.nextUrl.clone()
    url.host = CANONICAL_DOMAIN
    url.protocol = 'https'
    url.port = ''
    return NextResponse.redirect(url, { status: 301 })
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
