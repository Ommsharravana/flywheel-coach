'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/bug-reporter/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy,
  Medal,
  RefreshCw,
  TrendingUp,
  Bug,
  CheckCircle2,
  Percent
} from 'lucide-react'
import { toast } from 'sonner'

export default function BugLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  const fetchLeaderboard = async () => {
    const data = await getLeaderboard()
    setLeaderboard(data)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setCurrentUserEmail(user.email)
      }
      await fetchLeaderboard()
      setLoading(false)
    }

    init()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeaderboard()
    setRefreshing(false)
    toast.success('Leaderboard refreshed')
  }

  // Find current user's rank
  const currentUserRank = currentUserEmail
    ? leaderboard.findIndex(e => e.email === currentUserEmail) + 1
    : null

  // Get top 3 for podium
  const podium = leaderboard.slice(0, 3)

  // Get rest of leaderboard
  const restOfLeaderboard = leaderboard.slice(3)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Bug Leaderboard
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Ranked by resolution rate - quality matters more than quantity
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

      {/* Current User Rank */}
      {currentUserRank && currentUserRank > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-stone-400">Your Rank</p>
                  <p className="text-xl font-bold text-amber-400">#{currentUserRank}</p>
                </div>
              </div>
              {leaderboard[currentUserRank - 1] && (
                <div className="text-right">
                  <p className="text-sm text-stone-400">Resolution Rate</p>
                  <p className="text-xl font-bold text-green-400">
                    {leaderboard[currentUserRank - 1].resolution_rate}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Second Place */}
          {podium[1] && (
            <Card className="bg-stone-900/50 border-stone-700 md:order-1 order-2">
              <CardContent className="pt-6 text-center">
                <Medal className="h-10 w-10 text-stone-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-stone-400 mb-2">#2</div>
                <h3 className="font-medium text-stone-200 truncate">{podium[1].name}</h3>
                <p className="text-xs text-stone-500 truncate">{podium[1].email}</p>
                <div className="mt-4 flex justify-center gap-4 text-xs">
                  <div>
                    <p className="text-stone-500">Rate</p>
                    <p className="font-bold text-green-400">{podium[1].resolution_rate}%</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Bugs</p>
                    <p className="font-bold text-stone-300">{podium[1].total_bugs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* First Place */}
          {podium[0] && (
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40 md:order-2 order-1 md:-mt-4">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-amber-400 mb-2">#1</div>
                <h3 className="font-semibold text-stone-100 truncate">{podium[0].name}</h3>
                <p className="text-xs text-stone-400 truncate">{podium[0].email}</p>
                <div className="mt-4 flex justify-center gap-4 text-sm">
                  <div>
                    <p className="text-stone-400">Rate</p>
                    <p className="font-bold text-green-400">{podium[0].resolution_rate}%</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Bugs</p>
                    <p className="font-bold text-stone-200">{podium[0].total_bugs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Third Place */}
          {podium[2] && (
            <Card className="bg-stone-900/50 border-stone-700 md:order-3 order-3">
              <CardContent className="pt-6 text-center">
                <Medal className="h-10 w-10 text-orange-700 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700 mb-2">#3</div>
                <h3 className="font-medium text-stone-200 truncate">{podium[2].name}</h3>
                <p className="text-xs text-stone-500 truncate">{podium[2].email}</p>
                <div className="mt-4 flex justify-center gap-4 text-xs">
                  <div>
                    <p className="text-stone-500">Rate</p>
                    <p className="font-bold text-green-400">{podium[2].resolution_rate}%</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Bugs</p>
                    <p className="font-bold text-stone-300">{podium[2].total_bugs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-300 mb-2">No bug reports yet</h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              Be the first to report bugs and climb the leaderboard!
            </p>
          </CardContent>
        </Card>
      ) : restOfLeaderboard.length > 0 && (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-stone-200">Full Rankings</CardTitle>
            <CardDescription>All bug reporters ranked by resolution rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-stone-500 font-medium">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Reporter</div>
                <div className="col-span-2 text-center flex items-center justify-center gap-1">
                  <Bug className="h-3 w-3" /> Total
                </div>
                <div className="col-span-2 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Resolved
                </div>
                <div className="col-span-2 text-center flex items-center justify-center gap-1">
                  <Percent className="h-3 w-3" /> Rate
                </div>
              </div>

              {/* Rows */}
              {restOfLeaderboard.map((entry, index) => {
                const rank = index + 4 // Starting from 4th place
                const isCurrentUser = entry.email === currentUserEmail

                return (
                  <div
                    key={entry.email}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg items-center ${
                      isCurrentUser
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="col-span-1 font-bold text-stone-400">#{rank}</div>
                    <div className="col-span-5 min-w-0">
                      <p className={`font-medium truncate ${isCurrentUser ? 'text-amber-400' : 'text-stone-200'}`}>
                        {entry.name}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{entry.email}</p>
                    </div>
                    <div className="col-span-2 text-center font-medium text-stone-300">
                      {entry.total_bugs}
                    </div>
                    <div className="col-span-2 text-center font-medium text-green-400">
                      {entry.resolved_bugs}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`font-bold ${
                        entry.resolution_rate >= 75 ? 'text-green-400' :
                        entry.resolution_rate >= 50 ? 'text-amber-400' :
                        'text-stone-400'
                      }`}>
                        {entry.resolution_rate}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
