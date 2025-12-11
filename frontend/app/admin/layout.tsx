"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Music2,
  LayoutDashboard,
  Upload,
  Library,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logout, getCurrentUser } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { PlayerProvider } from '@/contexts/player-context'
import { PlaylistProvider } from '@/contexts/playlist-context'
import { MusicPlayerBar } from '@/components/player/music-player-bar'

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/albums", icon: Music2, label: "Albums" },
  { href: "/admin/upload", icon: Upload, label: "Music Upload" },
  { href: "/admin/library", icon: Library, label: "Music Library" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  // Skip auth check for login and register pages
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register"

  const getPageTitle = () => {
    if (pathname === "/admin/upload") return "Add New Track"
    if (pathname === "/admin/albums/create") return "Create New Album"
    if (pathname.startsWith("/admin/albums/") && pathname !== "/admin/albums/create") return "Album Details"
    
    const item = navItems.find((item) => item.href === pathname)
    if (item) return item.label
    
    return "Dashboard"
  }

  useEffect(() => {
    if (isLoading || isAuthPage) return

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    if (!isAdmin) {
      // User is authenticated but not an admin, redirect to user home
      toast.error("Access denied. Admin privileges required.")
      router.push("/")
    }
  }, [isAuthenticated, isAdmin, isLoading, router, isAuthPage])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
      router.push("/admin/login")
    } catch (error) {
      toast.error("Logout failed")
      console.error("Logout error:", error)
    }
  }

  // Show nothing while checking auth (except for auth pages)
  if (!isAuthPage && (isLoading || !isAuthenticated || !isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // For auth pages, render without the admin layout
  if (isAuthPage) {
    return <>{children}</>
  }

  const currentUser = getCurrentUser()

  return (
    <PlaylistProvider>
      <PlayerProvider>
        <div className="min-h-screen bg-background text-foreground font-inter">
          {/* Mobile Menu Button */}
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-background border border-border"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Sidebar */}
          <AnimatePresence>
            {(isSidebarOpen || true) && (
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "fixed left-0 top-0 h-screen bg-background border-r border-border z-40",
                  "lg:w-64 w-64",
                  isSidebarOpen ? "block" : "hidden lg:block"
                )}
              >
                <div className="flex flex-col h-full p-6">
                  {/* Logo */}
                  <Link href="/admin/dashboard" className="flex items-center gap-3 mb-8">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Music2 className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-bold">Musicly</span>
                  </Link>

                  {/* Navigation */}
                  <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* User Section */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Admin</p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email || 'admin@musicly.com'}</p>
                      </div>
                    </div>
                    
                    {/* Logout Button */}
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </Button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="lg:ml-64 min-h-screen flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
              <div className="flex items-center justify-between px-6 lg:px-8 py-4">
                <div className="flex items-center gap-4">
                  <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
                  <h2 className="text-xl font-semibold">
                    {getPageTitle()}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="p-6 lg:p-8 pb-24 flex-1">{children}</main>
          </div>
          <MusicPlayerBar />
        </div>
      </PlayerProvider>
    </PlaylistProvider>
  )
}
