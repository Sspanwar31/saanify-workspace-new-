import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SubscriptionStatus {
  plan: string
  status: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
  daysRemaining?: number
}

export function useSubscriptionRedirect() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)

  useEffect(() => {
    checkSubscriptionAndRedirect()
  }, [checkSubscriptionAndRedirect])

  const checkSubscriptionAndRedirect = useCallback(async () => {
    try {
      // Get current path
      const currentPath = window.location.pathname
      
      // Skip redirect for public pages and auth pages
      const publicPaths = [
        '/',
        '/login',
        '/auth/signup',
        '/subscription/select-plan',
        '/subscription/payment-upload'
      ]
      
      if (publicPaths.some(path => currentPath.startsWith(path))) {
        setIsLoading(false)
        return
      }

      // Check if user is authenticated
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        // Redirect to subscription selection if not authenticated
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/auth/')) {
          router.push('/subscription/select-plan')
        }
        setIsLoading(false)
        return
      }

      // Fetch subscription status
      const response = await fetch('/api/client/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
        
        // Apply redirection logic
        applyRedirectionLogic(data, currentPath, router)
      } else {
        // If failed to get subscription, redirect to subscription selection
        router.push('/subscription/select-plan')
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      // On error, redirect to subscription selection
      router.push('/subscription/select-plan')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const applyRedirectionLogic = (
    subscription: SubscriptionStatus,
    currentPath: string,
    router: ReturnType<typeof useRouter>
  ) => {
    const { status, daysRemaining } = subscription

    // If user is on subscription-related pages, allow access
    if (currentPath.includes('/subscription') || currentPath.includes('/payment-upload')) {
      return
    }

    // If trial is active
    if (status === 'TRIAL' && daysRemaining && daysRemaining > 0) {
      // Allow access to dashboard
      if (currentPath === '/' || currentPath === '/subscription/select-plan') {
        router.push('/client/dashboard')
      }
      return
    }

    // If payment is pending
    if (status === 'PENDING_PAYMENT') {
      if (!currentPath.includes('/client/subscription')) {
        router.push('/client/subscription')
      }
      return
    }

    // If subscription is active
    if (status === 'ACTIVE') {
      // Allow access to dashboard
      if (currentPath === '/' || currentPath === '/subscription/select-plan') {
        router.push('/client/dashboard')
      }
      return
    }

    // If trial is expired or no valid subscription
    if (status === 'EXPIRED' || (status === 'TRIAL' && daysRemaining !== undefined && daysRemaining <= 0)) {
      router.push('/subscription/select-plan')
      return
    }
  }

  return {
    isLoading,
    subscriptionStatus,
    checkSubscriptionAndRedirect
  }
}

export function useRequireSubscription() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkSubscription = useCallback(async () => {
    try {
      // Check if user is authenticated
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/subscription/select-plan')
        return
      }

      // Fetch subscription status
      const response = await fetch('/api/client/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        router.push('/subscription/select-plan')
        return
      }

      const data = await response.json()
      const { status, daysRemaining } = data

      // Check if user has valid subscription
      const hasValidSubscription = 
        status === 'ACTIVE' || 
        (status === 'TRIAL' && daysRemaining && daysRemaining > 0) ||
        status === 'PENDING_PAYMENT'

      if (hasValidSubscription) {
        setIsAuthorized(true)
      } else {
        router.push('/subscription/select-plan')
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      router.push('/subscription/select-plan')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  return {
    isAuthorized,
    isLoading
  }
}