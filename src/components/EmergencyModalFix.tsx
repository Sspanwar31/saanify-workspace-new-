'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cleanupStuckModals } from '@/lib/modal-cleanup'

export default function EmergencyModalFix() {
  const handleEmergencyFix = () => {
    // Force close all modals
    cleanupStuckModals()
    
    // Force page reload if needed
    if (confirm('Force close all stuck modals and reload page?')) {
      window.location.reload()
    }
  }

  return (
    <Button
      onClick={handleEmergencyFix}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-[9999] bg-red-500 hover:bg-red-600 text-white border-red-600"
      style={{ display: 'none' }} // Hidden by default, can be shown via console
      id="emergency-modal-fix"
    >
      <X className="h-4 w-4 mr-2" />
      Fix Stuck Modal
    </Button>
  )
}

// Expose globally for emergency use
if (typeof window !== 'undefined') {
  (window as any).emergencyModalFix = () => {
    const btn = document.getElementById('emergency-modal-fix')
    if (btn) {
      btn.style.display = 'block'
    }
  }
  
  // Auto-show if there are stuck modals
  setTimeout(() => {
    const modals = document.querySelectorAll('[role="dialog"]')
    const openModals = Array.from(modals).filter(modal => {
      const style = window.getComputedStyle(modal)
      return style.display !== 'none' && modal.getAttribute('aria-hidden') !== 'true'
    })
    
    if (openModals.length > 0) {
      console.log('🚨 Stuck modals detected! Run emergencyModalFix() in console to show fix button')
    }
  }, 2000)
}