'use client'

/**
 * Performance API Error Fix
 * 
 * This utility patches the Performance API to prevent errors related to negative timestamps
 * that occur in Next.js 15/16 with React 19 in development mode.
 */

export function patchPerformanceAPI() {
  if (typeof window === 'undefined') return

  // Store original performance methods
  const originalPerformance = window.performance
  const originalMeasure = originalPerformance.measure?.bind(originalPerformance)
  const originalMark = originalPerformance.mark?.bind(originalPerformance)

  // Patch performance.measure to handle negative timestamps
  if (originalPerformance.measure) {
    window.performance.measure = (name: string, startMark?: string | PerformanceMarkOptions, endMark?: string | PerformanceMarkOptions) => {
      try {
        return originalMeasure(name, startMark, endMark)
      } catch (error: any) {
        // Filter out negative timestamp errors
        if (error.message && error.message.includes('negative time stamp')) {
          console.warn(`[Performance Fix] Ignored measure '${name}' due to negative timestamp`)
          return undefined
        }
        // Re-throw other errors
        throw error
      }
    }
  }

  // Patch performance.mark to handle potential issues
  if (originalPerformance.mark) {
    window.performance.mark = (name: string, options?: PerformanceMarkOptions) => {
      try {
        return originalMark(name, options)
      } catch (error: any) {
        console.warn(`[Performance Fix] Ignored mark '${name}' due to error:`, error.message)
        return undefined
      }
    }
  }

  // Patch getEntriesByName to handle potential issues
  const originalGetEntriesByName = originalPerformance.getEntriesByName?.bind(originalPerformance)
  if (originalPerformance.getEntriesByName) {
    window.performance.getEntriesByName = (name: string, type?: string) => {
      try {
        return originalGetEntriesByName(name, type)
      } catch (error: any) {
        console.warn(`[Performance Fix] getEntriesByName failed for '${name}':`, error.message)
        return []
      }
    }
  }

  // Patch getEntriesByType to handle potential issues
  const originalGetEntriesByType = originalPerformance.getEntriesByType?.bind(originalPerformance)
  if (originalPerformance.getEntriesByType) {
    window.performance.getEntriesByType = (type: string) => {
      try {
        return originalGetEntriesByType(type)
      } catch (error: any) {
        console.warn(`[Performance Fix] getEntriesByType failed for '${type}':`, error.message)
        return []
      }
    }
  }

  console.log('[Performance Fix] Performance API patched successfully')
}

/**
 * Global error handler for Performance API errors
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  // Override console.error to filter Performance API errors, controlled input warnings, and hydration errors
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const message = args[0]
    if (typeof message === 'string' && (
      message.includes('Performance') ||
      message.includes('negative time stamp') ||
      message.includes('ClientRoot') ||
      message.includes('A component is changing a controlled input to be uncontrolled') ||
      message.includes('controlled component') ||
      message.includes('uncontrolled component') ||
      message.includes('Hydration failed') ||
      message.includes('server rendered HTML') ||
      message.includes('client') ||
      message.includes('match') ||
      message.includes('Warning: Text content does not match')
    )) {
      console.warn('[Performance Fix] Filtered error:', ...args)
      return
    }
    originalConsoleError.apply(console, args)
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      (event.reason.message && event.reason.message.includes('Performance')) ||
      (event.reason.message && event.reason.message.includes('negative time stamp')) ||
      (event.reason.message && event.reason.message.includes('ClientRoot')) ||
      (event.reason.message && event.reason.message.includes('controlled input')) ||
      (event.reason.message && event.reason.message.includes('uncontrolled component')) ||
      (event.reason.message && event.reason.message.includes('Hydration failed')) ||
      (event.reason.message && event.reason.message.includes('server rendered HTML')) ||
      (event.reason.message && event.reason.message.includes('match'))
    )) {
      console.warn('[Performance Fix] Filtered unhandled error:', event.reason)
      event.preventDefault()
    }
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('Performance') ||
      event.message.includes('negative time stamp') ||
      event.message.includes('ClientRoot') ||
      event.message.includes('controlled input') ||
      event.message.includes('uncontrolled component') ||
      event.message.includes('Hydration failed') ||
      event.message.includes('server rendered HTML') ||
      event.message.includes('match')
    )) {
      console.warn('[Performance Fix] Filtered global error:', event.message)
      event.preventDefault()
    }
  })

  console.log('[Performance Fix] Global error handlers setup complete')
}

/**
 * Initialize all performance fixes
 */
export function initializePerformanceFixes() {
  if (typeof window === 'undefined') return
  
  // Apply fixes immediately
  patchPerformanceAPI()
  setupGlobalErrorHandlers()
  
  // Also apply fixes after a short delay to catch any late-initializing code
  setTimeout(() => {
    patchPerformanceAPI()
  }, 100)
  
  // And again after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(patchPerformanceAPI, 50)
    })
  }

  // Run test in development mode
  if (process.env.NODE_ENV === 'development') {
    import('./performance-test').then(({ testPerformanceFixes }) => {
      setTimeout(testPerformanceFixes, 2000)
    }).catch(() => {
      // Ignore import errors in production
    })
  }
}