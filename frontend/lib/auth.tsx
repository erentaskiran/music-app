"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "./api"

/**
 * Higher-Order Component (HOC) to protect routes
 * Redirects unauthenticated users to the login page
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedRoute(props: P) {
    const router = useRouter()

    useEffect(() => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        router.push("/admin/login")
      }
    }, [router])

    // If not authenticated, don't render the component
    if (!isAuthenticated()) {
      return null
    }

    // Render the protected component
    return <Component {...props} />
  }
}

/**
 * Hook to check authentication status
 * Can be used in components to conditionally render content
 */
export function useAuth() {
  const router = useRouter()
  const authenticated = isAuthenticated()

  const requireAuth = () => {
    if (!authenticated) {
      router.push("/admin/login")
    }
  }

  return {
    isAuthenticated: authenticated,
    requireAuth,
  }
}
