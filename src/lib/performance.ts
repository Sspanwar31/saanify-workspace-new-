'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface UseDataCacheOptions {
  cacheKey: string
  ttl?: number // Time to live in milliseconds
  refetchInterval?: number // Auto refetch interval
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useDataCache<T>(
  fetcher: () => Promise<T>,
  options: UseDataCacheOptions
) {
  const { cacheKey, ttl = 5 * 60 * 1000, refetchInterval, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Get data from cache
  const getCachedData = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()

      if (now > entry.timestamp + entry.expiry) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return entry.data
    } catch {
      localStorage.removeItem(cacheKey)
      return null
    }
  }, [cacheKey])

  // Set data in cache
  const setCachedData = useCallback((newData: T) => {
    try {
      const entry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now(),
        expiry: ttl
      }
      localStorage.setItem(cacheKey, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to cache data:', error)
    }
  }, [cacheKey, ttl])

  // Fetch data with caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      // Try cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData()
        if (cachedData) {
          setData(cachedData)
          setLoading(false)
          onSuccess?.(cachedData)
          return cachedData
        }
      }

      // Fetch fresh data
      const freshData = await fetcher()
      setData(freshData)
      setCachedData(freshData)
      onSuccess?.(freshData)
      return freshData
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetcher, getCachedData, setCachedData, onSuccess, onError])

  // Initial fetch - prevent infinite re-renders
  useEffect(() => {
    fetchData()
  }, []) // Remove fetchData dependency to prevent infinite re-renders

  // Set up auto refetch - prevent infinite re-renders
  useEffect(() => {
    if (refetchInterval) {
      intervalRef.current = setInterval(() => {
        fetchData(true)
      }, refetchInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refetchInterval]) // Remove fetchData dependency to prevent infinite re-renders

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey)
    setData(null)
  }, [cacheKey])

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  }
}

// Validation utilities
export const validators = {
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  phone: (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  },

  name: (name: string) => {
    return name.trim().length >= 2 && name.trim().length <= 100
  },

  required: (value: any) => {
    return value !== null && value !== undefined && value !== ''
  }
}

// Form validation hook
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, (value: any) => boolean>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))

    // Validate field
    const rule = validationRules[field]
    if (rule && !rule(value)) {
      setErrors(prev => ({ 
        ...prev, 
        [field]: `Invalid ${String(field).toLowerCase()}` 
      }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [validationRules])

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.entries(validationRules).forEach(([field, rule]) => {
      const key = field as keyof T
      if (!rule(values[key])) {
        newErrors[key] = `Invalid ${String(key).toLowerCase()}`
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {}) as Partial<Record<keyof T, boolean>>)

    return isValid
  }, [values, validationRules])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

// Performance monitoring
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number>()

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current
      console.log(`${name} took ${duration.toFixed(2)}ms`)
      
      // Log slow operations
      if (duration > 1000) {
        toast.warning(`Slow operation detected`, {
          description: `${name} took ${duration.toFixed(0)}ms`,
          duration: 3000
        })
      }
      
      return duration
    }
    return 0
  }, [name])

  return { start, end }
}

// Optimized fetch wrapper
export function optimizedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  })
}

// Batch operations
export function useBatchOperations<T>() {
  const [operations, setOperations] = useState<Array<{
    id: string
    action: () => Promise<T>
    resolve: (value: T) => void
    reject: (error: Error) => void
  }>>([])

  const addOperation = useCallback((action: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36)
      setOperations(prev => [...prev, { id, action, resolve, reject }])
    })
  }, [])

  const processBatch = useCallback(async () => {
    if (operations.length === 0) return

    const batch = [...operations]
    setOperations([])

    try {
      const results = await Promise.allSettled(
        batch.map(op => op.action())
      )

      results.forEach((result, index) => {
        const operation = batch[index]
        if (result.status === 'fulfilled') {
          operation.resolve(result.value)
        } else {
          operation.reject(result.reason)
        }
      })

      toast.success(`Processed ${batch.length} operations successfully`)
    } catch (error) {
      toast.error('Some operations failed')
    }
  }, [operations])

  return {
    addOperation,
    processBatch,
    pendingCount: operations.length
  }
}