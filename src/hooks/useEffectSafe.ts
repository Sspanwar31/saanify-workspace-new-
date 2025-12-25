import { useEffect, useRef } from 'react'

/**
 * A safe useEffect hook that prevents infinite loops by:
 * 1. Tracking previous values and only running when dependencies actually change
 * 2. Providing cleanup mechanisms
 * 3. Supporting deep comparison for objects and arrays
 */

interface UseEffectSafeOptions {
  deepCompare?: boolean
  enabled?: boolean
}

export function useEffectSafe(
  effect: () => void | (() => void),
  dependencies: any[],
  options: UseEffectSafeOptions = {}
) {
  const { deepCompare = false, enabled = true } = options
  const prevDepsRef = useRef<any[]>([])
  const isInitialMountRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    const hasChanged = dependencies.some((dep, index) => {
      const prevDep = prevDepsRef.current[index]
      
      if (deepCompare && typeof dep === 'object' && dep !== null) {
        return JSON.stringify(dep) !== JSON.stringify(prevDep)
      }
      
      return dep !== prevDep
    })

    // Only run effect if dependencies have changed or it's the initial mount
    if (hasChanged || isInitialMountRef.current) {
      isInitialMountRef.current = false
      
      // Store current dependencies for next comparison
      prevDepsRef.current = [...dependencies]
      
      return effect()
    }
  }, dependencies)
}

/**
 * A specialized hook for preventing infinite loops in API calls
 */
export function useEffectApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[],
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void,
  options: { enabled?: boolean; retryCount?: number } = {}
) {
  const { enabled = true, retryCount = 0 } = options
  const isCallingRef = useRef(false)
  const retryCountRef = useRef(0)

  useEffectSafe(() => {
    if (isCallingRef.current) return
    
    isCallingRef.current = true
    retryCountRef.current = 0

    const callApi = async () => {
      try {
        const data = await apiCall()
        onSuccess?.(data)
      } catch (error) {
        console.error('API call failed:', error)
        
        // Retry logic
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++
          setTimeout(callApi, 1000 * retryCountRef.current)
        } else {
          onError?.(error as Error)
        }
      } finally {
        isCallingRef.current = false
      }
    }

    callApi()
  }, dependencies, { enabled })
}

/**
 * A hook for debounced effects to prevent rapid-fire calls
 */
export function useEffectDebounced(
  effect: () => void | (() => void),
  dependencies: any[],
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      return effect()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)
}

/**
 * A hook for conditional state updates that prevents infinite loops
 */
export function useEffectConditional(
  condition: () => boolean,
  effect: () => void,
  dependencies: any[]
) {
  const lastConditionRef = useRef<boolean>()

  useEffect(() => {
    const currentCondition = condition()
    
    // Only run effect if condition changed from false to true
    if (currentCondition && !lastConditionRef.current) {
      return effect()
    }
    
    lastConditionRef.current = currentCondition
  }, dependencies)
}