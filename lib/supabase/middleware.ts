import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Placeholder values for build time - will be replaced with actual values at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Add pathname header for layout to detect route
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          // Re-add pathname header after reassignment
          supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('[Middleware] getUser error:', userError)
    } else {
      user = data.user
    }
  } catch (err) {
    console.error('[Middleware] getUser exception:', err)
  }

  // Protected routes - require authentication only
  // Institution selection is handled at UI level, not middleware
  const protectedRoutes = ['/dashboard', '/cycle', '/portfolio', '/settings', '/admin', '/select-institution']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes require superadmin or institution_admin role
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  if (isAdminRoute && user) {
    try {
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { user_id: user.id })

      if (roleError) {
        console.error('[Middleware] get_user_role error:', roleError)
        // On error, redirect to dashboard for safety
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      const profile = roleData?.[0] || null
      const allowedRoles = ['superadmin', 'institution_admin', 'event_admin']

      if (!profile || !allowedRoles.includes(profile.role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch (err) {
      console.error('[Middleware] admin role check exception:', err)
      // On exception, redirect to dashboard for safety
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname === route
  )

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
