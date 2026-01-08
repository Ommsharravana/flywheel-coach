'use client'
/* eslint-disable react-hooks/set-state-in-effect */

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
import { Shield, Database, Bug, Trophy, Menu, Home, Briefcase, Settings, Users } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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
  role?: 'builder' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin' | null
  isImpersonating?: boolean
  isEventAdmin?: boolean  // User is in event_admins table (event-scoped admin)
}

export function Header({ user, role, isImpersonating, isEventAdmin }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

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
    <header className={`fixed left-0 right-0 z-50 border-b border-amber-100/20 bg-gradient-to-r from-stone-950/95 via-stone-900/95 to-stone-950/95 backdrop-blur-xl ${isImpersonating ? 'top-10' : 'top-0'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between">
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

          {/* Navigation - Logged In Users */}
          {user && !isAuthPage && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                {t('nav.home')}
              </NavLink>
              <NavLink href="/portfolio" active={pathname === '/portfolio'}>
                {t('nav.portfolio')}
              </NavLink>
              <NavLink href="/dashboard/problem-bank" active={pathname.startsWith('/dashboard/problem-bank')}>
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Problem Bank
                </span>
              </NavLink>
              <NavLink href="/settings" active={pathname === '/settings'}>
                {t('nav.settings')}
              </NavLink>
              {(role === 'superadmin' || role === 'institution_admin' || role === 'event_admin' || isEventAdmin) && (
                <NavLink href="/admin" active={pathname.startsWith('/admin')}>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {role === 'superadmin' ? t('nav.superAdmin') : t('nav.admin') || 'Admin'}
                  </span>
                </NavLink>
              )}
            </nav>
          )}

          {/* Navigation - Public (Not Logged In) */}
          {!user && !isAuthPage && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/showcase" active={pathname === '/showcase'}>
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  Showcase
                </span>
              </NavLink>
              <NavLink href="/metrics" active={pathname === '/metrics'}>
                Metrics
              </NavLink>
            </nav>
          )}

          {/* Mobile Menu */}
          {!isAuthPage && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-stone-300 hover:text-stone-100 hover:bg-stone-800/50"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[280px] bg-stone-950 border-stone-800 p-0"
              >
                <SheetHeader className="border-b border-stone-800 p-4">
                  <SheetTitle className="text-stone-100 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-stone-950"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4" />
                        <path d="M12 18v4" />
                      </svg>
                    </div>
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-4 gap-1">
                  {user ? (
                    <>
                      <MobileNavLink
                        href="/dashboard"
                        active={pathname === '/dashboard'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Home className="h-4 w-4" />}
                      >
                        {t('nav.home')}
                      </MobileNavLink>
                      <MobileNavLink
                        href="/portfolio"
                        active={pathname === '/portfolio'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Briefcase className="h-4 w-4" />}
                      >
                        {t('nav.portfolio')}
                      </MobileNavLink>
                      <MobileNavLink
                        href="/dashboard/problem-bank"
                        active={pathname.startsWith('/dashboard/problem-bank')}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Database className="h-4 w-4" />}
                      >
                        Problem Bank
                      </MobileNavLink>
                      <MobileNavLink
                        href="/dashboard/mentoring"
                        active={pathname === '/dashboard/mentoring'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Users className="h-4 w-4" />}
                      >
                        My Mentoring
                      </MobileNavLink>
                      <MobileNavLink
                        href="/settings"
                        active={pathname === '/settings'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Settings className="h-4 w-4" />}
                      >
                        {t('nav.settings')}
                      </MobileNavLink>
                      {(role === 'superadmin' || role === 'institution_admin' || role === 'event_admin' || isEventAdmin) && (
                        <MobileNavLink
                          href="/admin"
                          active={pathname.startsWith('/admin')}
                          onClick={() => setMobileMenuOpen(false)}
                          icon={<Shield className="h-4 w-4" />}
                        >
                          {role === 'superadmin' ? t('nav.superAdmin') : t('nav.admin') || 'Admin'}
                        </MobileNavLink>
                      )}
                      <div className="my-2 border-t border-stone-800" />
                      <MobileNavLink
                        href="/my-bugs"
                        active={pathname === '/my-bugs'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Bug className="h-4 w-4" />}
                      >
                        My Bug Reports
                      </MobileNavLink>
                      <MobileNavLink
                        href="/bug-leaderboard"
                        active={pathname === '/bug-leaderboard'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Trophy className="h-4 w-4" />}
                      >
                        Bug Leaderboard
                      </MobileNavLink>
                    </>
                  ) : (
                    <>
                      <MobileNavLink
                        href="/showcase"
                        active={pathname === '/showcase'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Trophy className="h-4 w-4" />}
                      >
                        Showcase
                      </MobileNavLink>
                      <MobileNavLink
                        href="/metrics"
                        active={pathname === '/metrics'}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={<Briefcase className="h-4 w-4" />}
                      >
                        Metrics
                      </MobileNavLink>
                    </>
                  )}
                </nav>
                {/* Mobile Language Toggle */}
                <div className="absolute bottom-4 left-4 right-4">
                  <LanguageToggle showLabel={true} className="w-full justify-center" />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Auth / User Menu */}
          <div className="flex items-center gap-3">
            {/* Language Toggle - Always visible */}
            <LanguageToggle showLabel={false} className="hidden sm:flex" />

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
                      <p className="text-sm font-medium">{user.user_metadata?.name || t('common.learner')}</p>
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-stone-800" />
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/dashboard">{t('nav.home')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/portfolio">{t('nav.portfolio')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/dashboard/problem-bank" className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-purple-400" />
                        <span>Problem Bank</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/dashboard/mentoring" className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-400" />
                        <span>My Mentoring</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/settings">{t('nav.settings')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-stone-800" />
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/my-bugs" className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-blue-400" />
                        <span>My Bug Reports</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                      <Link href="/bug-leaderboard" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span>Bug Leaderboard</span>
                      </Link>
                    </DropdownMenuItem>
                    {(role === 'superadmin' || role === 'institution_admin' || role === 'event_admin' || isEventAdmin) && (
                      <>
                        <DropdownMenuSeparator className="bg-stone-800" />
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800">
                          <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-400" />
                            <span>{role === 'superadmin' ? t('nav.superAdminPanel') : t('nav.admin') || 'Admin'}</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-stone-800" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-rose-400 hover:bg-stone-800 hover:text-rose-300 focus:bg-stone-800"
                    >
                      {t('common.signOut')}
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
                  <Link href="/login">{t('common.logIn')}</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25"
                >
                  <Link href="/signup">{t('common.getStarted')}</Link>
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

function MobileNavLink({
  href,
  active,
  children,
  onClick,
  icon,
}: {
  href: string
  active: boolean
  children: React.ReactNode
  onClick: () => void
  icon?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-amber-500/10 text-amber-400'
          : 'text-stone-300 hover:bg-stone-800/50 hover:text-stone-100'
      }`}
    >
      {icon && (
        <span className={active ? 'text-amber-400' : 'text-stone-500'}>
          {icon}
        </span>
      )}
      {children}
    </Link>
  )
}
