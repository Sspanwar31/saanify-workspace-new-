'use client'

import { useEffect } from 'react'
import { cleanupStuckModals } from '@/lib/modal-cleanup'

export default function ModalCleanup() {
  useEffect(() => {
    // Clean up any stuck modals on component mount (with delay)
    const timer = setTimeout(() => {
      cleanupStuckModals()
    }, 1000) // Delay to avoid React conflicts
    
    // Add escape key listener only
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupStuckModals()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    
    return () => {
      window.removeEventListener('keydown', handleEscape)
      clearTimeout(timer)
      // Final cleanup on unmount
      setTimeout(cleanupStuckModals, 100)
    }
  }, [])

  return null // This component doesn't render anything
}