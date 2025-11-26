"use client"

import { useEffect, useCallback, useState } from "react"
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
    const [isChecking, setIsChecking] = useState(true)
    const [isAuthed, setIsAuthed] = useState(false)

    useEffect(() => {
      const authed = isAuthenticated()
      setIsAuthed(authed)
      setIsChecking(false)
      
      if (!authed) {
        router.push("/login")
      }
    }, [router])

    // Show nothing while checking auth
    if (isChecking || !isAuthed) {
      return null
    }

    // Render the protected component
    return <Component {...props} />
  }
}

/**
 * Hook to check authentication status and require auth for actions
 * Can be used in components to conditionally render content or require login
 * Uses state to avoid hydration mismatch
 */
export function useAuth() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth status on client side only
  useEffect(() => {
    setIsAuthed(isAuthenticated())
    setIsLoading(false)
  }, [])

  /**
   * Redirects to login page if not authenticated
   * @returns true if authenticated, false if redirected
   */
  const requireAuth = useCallback(() => {
    if (!isAuthed) {
      router.push("/login")
      return false
    }
    return true
  }, [isAuthed, router])

  /**
   * Wraps an action to require authentication
   * @param action The action to perform if authenticated
   * @returns A function that will check auth before executing the action
   */
  const withAuthCheck = useCallback(<T extends (...args: unknown[]) => unknown>(action: T) => {
    return (...args: Parameters<T>) => {
      if (!isAuthed) {
        router.push("/login")
        return
      }
      return action(...args)
    }
  }, [isAuthed, router])

  return {
    isAuthenticated: isAuthed,
    isLoading,
    requireAuth,
    withAuthCheck,
  }
}
