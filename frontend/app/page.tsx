"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MusicStreamingHome } from "@/components/music-streaming-home"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // If user is authenticated and is an admin, redirect to admin dashboard
    if (isAuthenticated && isAdmin) {
      toast.info("Admins should use the admin dashboard")
      router.push("/admin/dashboard")
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If admin, show loading while redirecting
  if (isAuthenticated && isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <MusicStreamingHome />
    </>
  )
}
