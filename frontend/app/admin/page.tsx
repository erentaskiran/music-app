"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn")
    
    if (isLoggedIn === "true") {
      router.push("/admin/dashboard")
    } else {
      router.push("/admin/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  )
}
