'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

// Simplified user type that works with both auth user and effective user (impersonation)
interface HeaderUser {
  id: string
  email?: string | null
  user_metadata?: {
    name?: string | null
    avatar_url?: string | null
  }
}

interface HeaderProps {
  user?: HeaderUser | null
  role?: 'learner' | 'facilitator' | 'admin' | 'superadmin' | null
}

export function Header({ user, role }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-amber-100/20 bg-gradient-to-r from-stone-950/95 via-stone-900/95 to-stone-950/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="group flex items-center gap-3">
            {/* Flywheel Icon */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 opacity-80 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-stone-950 transition-transform duration-500 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="M4.93 4.93l2.83 2.83" />
                  <path d="M16.24 16.24l2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="M4.93 19.07l2.83-2.83" />
                  <path d="M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-stone-100">
              JKKN
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {' '}Solution Studio
              </span>
            </span>
          </Link>

          {/* Navigation */}
          {user && !isAuthPage && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                Home
              </NavLink>
              <NavLink href="/portfolio" active={pathname === '/portfolio'}>
                Portfolio
              </NavLink>
              <NavLink href="/settings" active={pathname === '/settings'}>
                Settings
              </NavLink>
              {role === 'superadmin' && (
                <NavLink href="/admin" active={pathname.startsWith('/admin')}>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Super Admin
                  </span>
                </NavLink>
              )}
            </nav>
          )}

          {/* Auth / User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                      <Avatar className="h-8 w-8 ring-2 ring-amber-500/30">
                        <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 font-semibold text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-stone-900 border-stone-800 text-stone-100"
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user.user_metadata?.name || 'Learner'}</p>
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-stone-800" />
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/dashboard">Home</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/portfolio">Portfolio</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    {role === 'superadmin' && (
                      <>
                        <DropdownMenuSeparator className="bg-stone-800" />
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                          <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-400" />
                            <span>Super Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-stone-800" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-rose-400 hover:bg-stone-800 hover:text-rose-300 focus:bg-stone-800"
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Static placeholder during SSR to prevent hydration mismatch
                <div className="flex items-center gap-2 rounded-full p-1">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 ring-2 ring-amber-500/30" />
                </div>
              )
            ) : !isAuthPage ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  asChild
                  className="text-stone-300 hover:text-stone-100 hover:bg-stone-800/50"
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25"
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'text-amber-400'
          : 'text-stone-400 hover:text-stone-200'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
      )}
    </Link>
  )
}
