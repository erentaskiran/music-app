"use client"

import { useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"

interface UserLayoutWrapperProps {
  children: ReactNode
}

/**
 * Wrapper component that enforces user-only access
 * Redirects admin users to the admin dashboard
 */
export function UserLayoutWrapper({ children }: UserLayoutWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  // Pages that don't require authentication or role check
  const publicPages = ["/login", "/register"]
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    // Don't check auth for public pages
    if (isLoading || isPublicPage) return

    // If user is authenticated and is an admin, redirect to admin dashboard
    if (isAuthenticated && isAdmin) {
      toast.info("Admins should use the admin dashboard")
      router.push("/admin/dashboard")
    }
  }, [isAuthenticated, isAdmin, isLoading, router, isPublicPage])

  // Show loading state while checking (except for public pages)
  if (!isPublicPage && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If authenticated admin on non-public page, show loading while redirecting
  if (!isPublicPage && isAuthenticated && isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
