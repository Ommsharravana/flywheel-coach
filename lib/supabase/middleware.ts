import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Placeholder values for build time - will be replaced with actual values at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/cycle', '/portfolio', '/settings', '/admin']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Institution selection is a special protected route (needs auth but no institution)
  const isSelectInstitutionRoute = request.nextUrl.pathname === '/select-institution'

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // For protected routes (except select-institution), check if user has institution
  if (user && (isProtectedRoute || isSelectInstitutionRoute)) {
    // Fetch user profile to check role and institution
    // Use maybeSingle() to avoid error when profile doesn't exist
    const { data: profile } = await supabase
      .from('users')
      .select('role, institution_id')
      .eq('id', user.id)
      .maybeSingle()

    // Superadmins don't need an institution - they manage the entire system
    const isSuperadmin = profile?.role === 'superadmin'

    // If no institution set, not a superadmin, and not on select-institution page, redirect there
    if (!profile?.institution_id && !isSuperadmin && !isSelectInstitutionRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/select-institution'
      return NextResponse.redirect(url)
    }

    // If has institution OR is superadmin, and on select-institution page, redirect to dashboard
    if ((profile?.institution_id || isSuperadmin) && isSelectInstitutionRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Admin routes require superadmin or institution_admin role
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

    if (isAdminRoute) {
      const allowedRoles = ['superadmin', 'institution_admin']
      if (!profile || !allowedRoles.includes(profile.role)) {
        // Not authorized, redirect to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
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
