'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserBugs, reopenBug, getStatusDisplay, type BugReport } from '@/lib/bug-reporter/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bug,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Calendar,
  Monitor,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function MyBugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const fetchBugs = async (email: string) => {
    const userBugs = await getUserBugs(email)
    // Sort by created_at descending (newest first)
    userBugs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setBugs(userBugs)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        setUserEmail(user.email)
        await fetchBugs(user.email)
      }
      setLoading(false)
    }

    init()
  }, [])

  const handleRefresh = async () => {
    if (!userEmail) return
    setRefreshing(true)
    await fetchBugs(userEmail)
    setRefreshing(false)
    toast.success('Bug reports refreshed')
  }

  const handleReopen = async (bugId: string) => {
    const success = await reopenBug(bugId)
    if (success) {
      toast.success('Bug reopened successfully')
      if (userEmail) {
        await fetchBugs(userEmail)
      }
    } else {
      toast.error('Failed to reopen bug')
    }
  }

  // Calculate stats
  const stats = {
    total: bugs.length,
    resolved: bugs.filter(b => b.status === 'resolved').length,
    inProgress: bugs.filter(b => b.status === 'in_progress').length,
    pending: bugs.filter(b => b.status === 'new' || b.status === 'seen').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
            <Bug className="h-6 w-6 text-amber-400" />
            My Bug Reports
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Track the status of bugs you&apos;ve reported
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-stone-700 hover:bg-stone-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-400">Total Reports</p>
                <p className="text-2xl font-bold text-stone-100">{stats.total}</p>
              </div>
              <Bug className="h-8 w-8 text-stone-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-400">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-400">In Progress</p>
                <p className="text-2xl font-bold text-amber-400">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-400">Pending Review</p>
                <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
              </div>
              <XCircle className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bug List */}
      {bugs.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="py-12 text-center">
            <Bug className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-300 mb-2">No bug reports yet</h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              When you report bugs using the bug reporter widget, they&apos;ll appear here so you can track their status.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => {
            const statusDisplay = getStatusDisplay(bug.status)
            const timeAgo = formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })

            return (
              <Card key={bug.uuid} className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${statusDisplay.bgColor} ${statusDisplay.color} border-0`}>
                          {statusDisplay.label}
                        </Badge>
                        <Badge variant="outline" className="border-stone-700 text-stone-400">
                          {bug.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-stone-200 line-clamp-2">
                        {bug.description}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {timeAgo}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Monitor className="h-3 w-3" />
                          {bug.page_url.replace('https://jkkn-solution-studio.vercel.app', '')}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bug.status === 'resolved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReopen(bug.uuid)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reopen
                        </Button>
                      )}
                      <Link
                        href={bug.page_url}
                        target="_blank"
                        className="text-stone-400 hover:text-stone-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                {(bug.fix_summary || bug.fixed_by) && (
                  <CardContent className="pt-0">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-sm text-green-400 font-medium mb-1">
                        {bug.fixed_by === 'Claude Code' ? 'Auto-resolved' : `Fixed by ${bug.fixed_by}`}
                      </p>
                      {bug.fix_summary && (
                        <p className="text-xs text-green-300/70">{bug.fix_summary}</p>
                      )}
                      {bug.fix_commit_url && (
                        <Link
                          href={bug.fix_commit_url}
                          target="_blank"
                          className="text-xs text-green-400 hover:underline flex items-center gap-1 mt-2"
                        >
                          View fix commit <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
