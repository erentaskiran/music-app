"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Music, Upload, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDashboard, type AdminDashboardResponse } from "@/lib/api"
import { withAuth } from "@/lib/auth"

const statDefinitions = [
  {
    key: "total_tracks",
    title: "Total Tracks",
    icon: Music,
    color: "from-primary/80 to-primary",
    changeLabel: "from last 30 days",
  },
  {
    key: "total_uploads",
    title: "Total Uploads",
    icon: Upload,
    color: "from-blue-500 to-cyan-500",
    changeLabel: "from last 30 days",
  },
  {
    key: "active_users",
    title: "Active Users",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    changeLabel: "from last 30 days",
  },
  {
    key: "streams_today",
    title: "Streams Today",
    icon: TrendingUp,
    color: "from-orange-500 to-red-500",
    changeLabel: "vs yesterday",
  },
]

const emptyDashboard: AdminDashboardResponse = {
  stats: {
    total_tracks: 0,
    total_tracks_change: 0,
    total_uploads: 0,
    total_uploads_change: 0,
    active_users: 0,
    active_users_change: 0,
    streams_today: 0,
    streams_today_change: 0,
  },
  recent_uploads: [],
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse>(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAdminDashboard()
        setDashboard(data)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
        setError("Failed to load dashboard data.")
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const statValues = useMemo(() => {
    return {
      total_tracks: dashboard.stats.total_tracks,
      total_tracks_change: dashboard.stats.total_tracks_change,
      total_uploads: dashboard.stats.total_uploads,
      total_uploads_change: dashboard.stats.total_uploads_change,
      active_users: dashboard.stats.active_users,
      active_users_change: dashboard.stats.active_users_change,
      streams_today: dashboard.stats.streams_today,
      streams_today_change: dashboard.stats.streams_today_change,
    }
  }, [dashboard])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statDefinitions.map((stat, index) => {
          const Icon = stat.icon
          const value = statValues[stat.key as keyof typeof statValues]
          const changeKey = `${stat.key}_change` as keyof typeof statValues
          const change = statValues[changeKey] as number
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {formatNumber(value as number)}
                  </div>
                  <p className="text-xs text-green-500 mt-1">
                    {formatPercent(change)} {stat.changeLabel}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Uploads */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.recent_uploads.map((upload, index) => (
                  <motion.div
                    key={upload.id ?? index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors duration-200"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {upload.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{upload.artist_name}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(upload.created_at)}
                    </div>
                  </motion.div>
                ))}
                {dashboard.recent_uploads.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent uploads yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full p-4 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/50 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-foreground">Upload New Track</p>
                    <p className="text-xs text-muted-foreground">Add music to your library</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-foreground">Manage Library</p>
                    <p className="text-xs text-muted-foreground">View all music tracks</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-foreground">User Analytics</p>
                    <p className="text-xs text-muted-foreground">View user statistics</p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default withAuth(DashboardPage)

function formatRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime()
  if (Number.isNaN(timestamp)) {
    return "Just now"
  }
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (minutes > 0) return `${minutes} min${minutes === 1 ? "" : "s"} ago`
  return "Just now"
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return value.toLocaleString("en-US")
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%"
  const sign = value > 0 ? "+" : ""
  const rounded = Math.round(value * 10) / 10
  return `${sign}${rounded.toFixed(1).replace(/\.0$/, "")}%`
}
