'use client'

// Global utility to clean up stuck modals
export const cleanupStuckModals = () => {
  if (typeof window === 'undefined') return

  console.log('🧹 Cleaning up stuck modals...')

  try {
    // Close any open dialogs
    const modals = document.querySelectorAll('[role="dialog"]')
    modals.forEach(modal => {
      if (modal instanceof HTMLElement) {
        modal.style.display = 'none'
        modal.setAttribute('data-state', 'closed')
        modal.setAttribute('aria-hidden', 'true')
        modal.classList.add('hidden')
      }
    })

    // Remove any modal backdrops
    const backdrops = document.querySelectorAll('[data-state="open"]')
    backdrops.forEach(backdrop => {
      if (backdrop instanceof HTMLElement) {
        backdrop.setAttribute('data-state', 'closed')
        backdrop.style.display = 'none'
        backdrop.classList.add('hidden')
      }
    })

    // Clear body scroll lock
    document.body.style.overflow = ''
    document.body.classList.remove('modal-open')
    document.body.style.removeProperty('overflow')

    console.log('✅ Modal cleanup completed')
  } catch (error) {
    console.warn('⚠️ Modal cleanup failed:', error)
  }
}

// Hook to automatically clean up modals on mount
export const useModalCleanup = () => {
  if (typeof window !== 'undefined') {
    // Clean up immediately
    cleanupStuckModals()
    
    // Add escape key listener to close any stuck modals
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupStuckModals()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('keydown', handleEscape)
      cleanupStuckModals()
    }
  }
}

// Force close all dialogs and modals
export const forceCloseAllDialogs = () => {
  if (typeof window === 'undefined') return

  try {
    // Find and close all dialogs
    const dialogs = document.querySelectorAll('dialog')
    dialogs.forEach(dialog => {
      if (dialog instanceof HTMLDialogElement) {
        dialog.close()
      }
    })

    // Find and close all radix UI dialogs
    const radixDialogs = document.querySelectorAll('[data-radix-dialog-content]')
    radixDialogs.forEach(dialog => {
      if (dialog instanceof HTMLElement) {
        dialog.setAttribute('data-state', 'closed')
        dialog.style.display = 'none'
      }
    })

    cleanupStuckModals()
  } catch (error) {
    console.warn('⚠️ Force close dialogs failed:', error)
  }
}