/**
 * Bug Reporter API Client
 * Interacts with JKKN Centralized Bug Reporter
 */

const BUG_REPORTER_URL = process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL || 'https://jkkn-centralized-bug-reporter.vercel.app'
const API_KEY = process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY || ''
const APPLICATION_NAME = 'JKKN Solution Studio'

export interface BugReport {
  uuid: string
  page_url: string
  description: string
  category: string
  status: 'new' | 'seen' | 'in_progress' | 'resolved' | 'wont_fix'
  console_logs?: string
  screenshot_url?: string
  fix_commit_url?: string
  fix_summary?: string
  fixed_by?: string
  metadata: {
    reporter_email?: string
    reporter_name?: string
    browser_info?: string
    viewport?: string
    timestamp?: string
  }
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  email: string
  name: string
  total_bugs: number
  resolved_bugs: number
  resolution_rate: number
}

/**
 * Fetch bugs for a specific user by email
 * Note: API reporter_email filter is broken, so we filter client-side
 */
export async function getUserBugs(email: string): Promise<BugReport[]> {
  try {
    // Fetch all bugs for the application (API filter is broken)
    const params = new URLSearchParams({
      application: APPLICATION_NAME,
      limit: '1000',
    })
    const response = await fetch(
      `${BUG_REPORTER_URL}/api/v1/public/bug-reports/me?${params.toString()}`,
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always live fetch per user decision
      }
    )

    if (!response.ok) {
      throw new Error(`Bug Reporter API error: ${response.status}`)
    }

    const data = await response.json()
    const allBugs: BugReport[] = data.data?.bug_reports || []

    // Filter client-side by reporter email (case-insensitive)
    const normalizedEmail = email.toLowerCase()
    return allBugs.filter(bug =>
      bug.metadata?.reporter_email?.toLowerCase() === normalizedEmail
    )
  } catch (error) {
    console.error('Failed to fetch user bugs:', error)
    return []
  }
}

/**
 * Fetch all bugs for leaderboard calculation
 */
export async function getAllBugs(): Promise<BugReport[]> {
  try {
    const params = new URLSearchParams({
      application: APPLICATION_NAME,
      limit: '1000',
    })
    const response = await fetch(
      `${BUG_REPORTER_URL}/api/v1/public/bug-reports/me?${params.toString()}`,
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      throw new Error(`Bug Reporter API error: ${response.status}`)
    }

    const data = await response.json()
    // API returns { success, data: { bug_reports, pagination } }
    return data.data?.bug_reports || []
  } catch (error) {
    console.error('Failed to fetch all bugs:', error)
    return []
  }
}

/**
 * Calculate leaderboard from all bugs
 * Ranked by resolution rate (% of bugs that got resolved)
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const bugs = await getAllBugs()

  // Group by reporter email
  const reporterMap = new Map<string, { name: string; total: number; resolved: number }>()

  for (const bug of bugs) {
    const email = bug.metadata?.reporter_email
    if (!email) continue

    const existing = reporterMap.get(email) || {
      name: bug.metadata?.reporter_name || email.split('@')[0],
      total: 0,
      resolved: 0,
    }

    existing.total++
    if (bug.status === 'resolved') {
      existing.resolved++
    }

    reporterMap.set(email, existing)
  }

  // Convert to array and calculate resolution rate
  const leaderboard: LeaderboardEntry[] = []

  for (const [email, stats] of reporterMap) {
    // Only include users with at least 1 bug
    if (stats.total > 0) {
      leaderboard.push({
        email,
        name: stats.name,
        total_bugs: stats.total,
        resolved_bugs: stats.resolved,
        resolution_rate: Math.round((stats.resolved / stats.total) * 100),
      })
    }
  }

  // Sort by resolution rate (descending), then by total bugs (descending) as tiebreaker
  leaderboard.sort((a, b) => {
    if (b.resolution_rate !== a.resolution_rate) {
      return b.resolution_rate - a.resolution_rate
    }
    return b.total_bugs - a.total_bugs
  })

  return leaderboard
}

/**
 * Reopen a resolved bug
 */
export async function reopenBug(bugId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BUG_REPORTER_URL}/api/v1/public/bug-reports/${bugId}`,
      {
        method: 'PATCH',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'new',
          fix_summary: null,
          fix_commit_url: null,
          fixed_by: null,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to reopen bug:', error)
    return false
  }
}

/**
 * Get status display info
 */
export function getStatusDisplay(status: BugReport['status']): {
  label: string
  color: string
  bgColor: string
} {
  const statusMap = {
    new: { label: 'New', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    seen: { label: 'Seen', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    in_progress: { label: 'In Progress', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    resolved: { label: 'Resolved', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    wont_fix: { label: "Won't Fix", color: 'text-stone-400', bgColor: 'bg-stone-500/20' },
  }

  return statusMap[status] || statusMap.new
}
