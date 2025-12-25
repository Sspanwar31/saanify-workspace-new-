'use client'

import { useEffect } from 'react'
import { initializePerformanceFixes } from '@/lib/performance-fix'

/**
 * PerformanceFix Component
 * 
 * This component ensures that performance fixes are applied as early as possible
 * in the React component lifecycle. It should be placed high in the component tree.
 */
export default function PerformanceFix() {
  useEffect(() => {
    // Apply fixes when component mounts
    initializePerformanceFixes()
    
    // Apply additional fixes after a short delay
    const timeout1 = setTimeout(() => {
      initializePerformanceFixes()
    }, 50)
    
    // And again after a longer delay to catch any late-initializing code
    const timeout2 = setTimeout(() => {
      initializePerformanceFixes()
    }, 200)
    
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [])

  // This component doesn't render anything
  return null
}