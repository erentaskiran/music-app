"use client"

import { useEffect, useCallback, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, getUserRole } from "./api"
import type { UserRole } from "./types"

// Subscribe function for useSyncExternalStore (no-op since auth doesn't change externally)
const subscribe = () => () => {}

// Server snapshot always returns false to avoid hydration mismatch
// This ensures server and initial client render match
const getServerSnapshot = () => false
const getServerRoleSnapshot = (): UserRole | null => null

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
 * Higher-Order Component (HOC) to protect admin routes
 * Redirects non-admin users to the appropriate page
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AdminProtectedRoute(props: P) {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    
    const isAuthed = useSyncExternalStore(
      subscribe,
      isAuthenticated,
      getServerSnapshot
    )
    
    const userRole = useSyncExternalStore(
      subscribe,
      getUserRole,
      getServerRoleSnapshot
    )

    useEffect(() => {
      setIsChecking(false)
      
      if (!isAuthed) {
        router.push("/admin/login")
        return
      }
      
      if (userRole !== 'admin') {
        // User is authenticated but not an admin, redirect to user home
        router.push("/")
      }
    }, [router, isAuthed, userRole])

    // Show nothing while checking auth or if not admin
    if (isChecking || !isAuthed || userRole !== 'admin') {
      return null
    }

    return <Component {...props} />
  }
}

/**
 * Higher-Order Component (HOC) to protect user routes
 * Redirects admin users to the admin dashboard
 */
export function withUserAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function UserProtectedRoute(props: P) {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    
    const isAuthed = useSyncExternalStore(
      subscribe,
      isAuthenticated,
      getServerSnapshot
    )
    
    const userRole = useSyncExternalStore(
      subscribe,
      getUserRole,
      getServerRoleSnapshot
    )

    useEffect(() => {
      setIsChecking(false)
      
      if (!isAuthed) {
        router.push("/login")
        return
      }
      
      if (userRole === 'admin') {
        // Admin users should not access user routes
        router.push("/admin/dashboard")
      }
    }, [router, isAuthed, userRole])

    // Show nothing while checking auth or if admin
    if (isChecking || !isAuthed || userRole === 'admin') {
      return null
    }

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
  
  const userRole = useSyncExternalStore(
    subscribe,
    getUserRole,
    getServerRoleSnapshot
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
   * Redirects to admin login if not authenticated as admin
   * @returns true if admin, false if redirected
   */
  const requireAdmin = useCallback(() => {
    if (!isAuthed) {
      router.push("/admin/login")
      return false
    }
    if (userRole !== 'admin') {
      router.push("/")
      return false
    }
    return true
  }, [isAuthed, userRole, router])

  /**
   * Redirects to login if not authenticated as user
   * @returns true if user, false if redirected
   */
  const requireUser = useCallback(() => {
    if (!isAuthed) {
      router.push("/login")
      return false
    }
    if (userRole === 'admin') {
      router.push("/admin/dashboard")
      return false
    }
    return true
  }, [isAuthed, userRole, router])

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
    role: userRole,
    isAdmin: userRole === 'admin',
    isUser: userRole === 'user',
    requireAuth,
    requireAdmin,
    requireUser,
    withAuthCheck,
  }
}
