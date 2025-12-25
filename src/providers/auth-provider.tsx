'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// User Type Definition
interface User {
  id: string
  email: string
  name: string
  role: string
  societyAccountId?: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to check session from LocalStorage
  const checkAuth = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('current_user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      console.error("Failed to check LocalStorage session", error)
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_user')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to refresh session
  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    checkAuth()
  }, [checkAuth])

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      // Clear client-side state
      setUser(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_user')
        sessionStorage.clear()
      }
      
      // Redirect to login page
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed', error)
    }
  }, [router])

  // Check auth on mount
  useEffect(() => {
    // Only run on mount for significant auth-related paths
    const isAuthRelatedPath = pathname?.startsWith('/login') || 
                             pathname?.startsWith('/signup') || 
                             pathname?.startsWith('/dashboard') ||
                             pathname?.startsWith('/admin')
    
    if (isAuthRelatedPath) {
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [pathname, checkAuth])

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}