"use client"

import { useEffect, useCallback, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "./api"

// Subscribe function for useSyncExternalStore (no-op since auth doesn't change externally)
const subscribe = () => () => {}

// Server snapshot always returns false to avoid hydration mismatch
// This ensures server and initial client render match
const getServerSnapshot = () => false

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
    
    // Use useSyncExternalStore to safely read auth state
    const isAuthed = useSyncExternalStore(
      subscribe,
      isAuthenticated,
      getServerSnapshot
    )

    useEffect(() => {
      setIsChecking(false)
      
      if (!isAuthed) {
        router.push("/login")
      }
    }, [router, isAuthed])

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
 * Uses useSyncExternalStore to avoid hydration mismatch
 */
export function useAuth() {
  const router = useRouter()
  
  // Track if we've mounted on the client to avoid hydration mismatch
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // This is a valid use case for setting state in useEffect - mount detection pattern
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
  }, [])

  // Use useSyncExternalStore to safely read auth state from cookies
  const isAuthed = useSyncExternalStore(
    subscribe,
    isAuthenticated,
    getServerSnapshot
  )

  // isLoading is true until we've mounted on the client
  // This ensures server render and initial client render both show loading state
  const isLoading = !hasMounted

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
