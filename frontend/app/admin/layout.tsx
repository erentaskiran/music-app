"use client"

import { ReactNode, useState } from "react"
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
import { logout } from "@/lib/api"
import { toast } from "sonner"

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/upload", icon: Upload, label: "Music Upload" },
  { href: "/admin/library", icon: Library, label: "Music Library" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white font-inter">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-[#0a0a0a] border border-gray-800"
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
              "fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-gray-800 z-40",
              "lg:w-64 w-64",
              isSidebarOpen ? "block" : "hidden lg:block"
            )}
          >
            <div className="flex flex-col h-full p-6">
              {/* Logo */}
              <Link href="/admin/dashboard" className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                  <Music2 className="w-6 h-6 text-white" />
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
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* User Section */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500 text-white">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Admin</p>
                    <p className="text-xs text-gray-400">admin@musicly.com</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50"
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
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-gray-800">
          <div className="flex items-center justify-between px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
              <h2 className="text-xl font-semibold">
                {navItems.find((item) => item.href === pathname)?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                  A
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
