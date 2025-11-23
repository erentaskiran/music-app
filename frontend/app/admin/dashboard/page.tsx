"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Music, Upload, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { makeAuthenticatedRequest } from "@/lib/api"

const stats = [
  {
    title: "Total Tracks",
    value: "1,234",
    icon: Music,
    change: "+12%",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Total Uploads",
    value: "856",
    icon: Upload,
    change: "+8%",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Active Users",
    value: "12.5K",
    icon: Users,
    change: "+23%",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Streams Today",
    value: "45.2K",
    icon: TrendingUp,
    change: "+15%",
    color: "from-orange-500 to-red-500",
  },
]

const recentUploads = [
  { title: "Summer Vibes", artist: "DJ Maxwell", date: "2 hours ago" },
  { title: "Midnight Dreams", artist: "Luna Rose", date: "5 hours ago" },
  { title: "Electric Pulse", artist: "Neon Beats", date: "1 day ago" },
  { title: "Ocean Waves", artist: "Calm Collective", date: "1 day ago" },
  { title: "City Lights", artist: "Urban Symphony", date: "2 days ago" },
]

export default function DashboardPage() {
  // Check authentication and refresh token if needed when page loads
  useEffect(() => {
    async function checkAuth() {
      try {
        // This will automatically refresh the token if needed
        await makeAuthenticatedRequest('/me', { method: 'GET' })
      } catch (error) {
        // If auth fails, user will be redirected by the error handler
        console.log('Auth check completed')
      }
    }
    checkAuth()
  }, [])

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-green-500 mt-1">
                    {stat.change} from last month
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
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUploads.map((upload, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {upload.title}
                      </p>
                      <p className="text-xs text-gray-400">{upload.artist}</p>
                    </div>
                    <div className="text-xs text-gray-500">{upload.date}</div>
                  </motion.div>
                ))}
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
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-white">Upload New Track</p>
                    <p className="text-xs text-gray-400">Add music to your library</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-white">Manage Library</p>
                    <p className="text-xs text-gray-400">View all music tracks</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 transition-all duration-200 text-left group">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-white">User Analytics</p>
                    <p className="text-xs text-gray-400">View user statistics</p>
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
