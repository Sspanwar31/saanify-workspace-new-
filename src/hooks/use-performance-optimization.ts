"use client"

import { useCallback, useRef, useEffect, useState } from 'react'

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())
  
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    },
    [callback, delay]
  ) as T

  return throttledCallback
}

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [options, hasIntersected])

  return { targetRef, isIntersecting, hasIntersected }
}

export function useLazyLoad() {
  const [isLoading, setIsLoading] = useState(true)
  const { targetRef, hasIntersected } = useIntersectionObserver()

  useEffect(() => {
    if (hasIntersected) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [hasIntersected])

  return { targetRef, isLoading, hasIntersected }
}

export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  )
  
  const visibleItems = items.slice(startIndex, endIndex + 1)
  const offsetY = startIndex * itemHeight
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  return {
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
    totalHeight: items.length * itemHeight
  }
}

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

export function useCachedAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const depsRef = useRef(deps)

  // Update deps ref when deps change
  useEffect(() => {
    depsRef.current = deps
  }, [deps])

  const execute = useCallback(async () => {
    const cacheKey = JSON.stringify(depsRef.current)
    const cached = cacheRef.current.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      setData(cached.data)
      return cached.data
    }

    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      setData(result)
      cacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [asyncFn])

  useEffect(() => {
    execute()
  }, [execute, ...deps])

  return { data, loading, error, refetch: execute }
}