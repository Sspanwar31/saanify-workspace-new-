import { useEffect, useRef, useCallback } from 'react'
import { createRazorpayInstance, configureRazorpayCheckout, RazorpayOptions } from '@/lib/razorpay-config'

interface UseRazorpayOptions {
  onPaymentSuccess?: (response: any) => void
  onPaymentError?: (error: any) => void
  onModalClose?: () => void
}

export function useRazorpay(options: UseRazorpayOptions = {}) {
  const razorpayRef = useRef<any>(null)
  const isInitializingRef = useRef(false)

  // Initialize Razorpay with security fixes
  const initializeRazorpay = useCallback(async (razorpayOptions: Partial<RazorpayOptions>) => {
    if (isInitializingRef.current) {
      console.warn('Razorpay initialization already in progress')
      return null
    }

    if (!window.Razorpay) {
      console.error('Razorpay SDK not loaded')
      options.onPaymentError?.(new Error('Razorpay SDK not loaded'))
      return null
    }

    isInitializingRef.current = true

    try {
      // Configure with security fixes
      const config = configureRazorpayCheckout({
        ...razorpayOptions,
        handler: function(response: any) {
          console.log('Payment successful:', response)
          options.onPaymentSuccess?.(response)
          cleanup()
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed')
            options.onModalClose?.()
            cleanup()
          },
          escape: true,
          handleback: true,
          confirm_close: false,
          persist: 'company_session_token'
        }
      })

      // Create secure instance
      const razorpay = createRazorpayInstance(config)
      razorpayRef.current = razorpay

      return razorpay
    } catch (error) {
      console.error('Failed to initialize Razorpay:', error)
      options.onPaymentError?.(error)
      return null
    } finally {
      isInitializingRef.current = false
    }
  }, [options])

  // Open payment modal with security fixes
  const openPayment = useCallback(async (razorpayOptions: Partial<RazorpayOptions>) => {
    const razorpay = await initializeRazorpay(razorpayOptions)
    
    if (!razorpay) {
      console.error('Failed to initialize Razorpay for payment')
      return false
    }

    try {
      // Monitor for iframe creation and apply security fixes
      const iframeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.nodeName === 'IFRAME') {
              const iframe = node as HTMLIFrameElement
              
              // Check if it's a Razorpay iframe
              if (iframe.src && iframe.src.includes('razorpay')) {
                console.log('Applying security fixes to Razorpay iframe')
                
                // Set proper permissions
                iframe.setAttribute('allow', 
                  'camera *; microphone *; payment *; clipboard-write *; web-share *; ' +
                  'publickey-credentials-get *; publickey-credentials-create *; fullscreen *; ' +
                  'accelerometer *; gyroscope *; magnetometer *; geolocation *'
                )
                
                // Fix sandbox attribute if present
                if (iframe.hasAttribute('sandbox')) {
                  const sandboxValue = iframe.getAttribute('sandbox')
                  if (sandboxValue && sandboxValue.includes('allow-same-origin') && sandboxValue.includes('allow-scripts')) {
                    // Remove allow-same-origin to prevent sandbox escape
                    iframe.setAttribute('sandbox', 
                      sandboxValue.replace('allow-same-origin', '').trim()
                    )
                  }
                }
                
                // Add security event listeners
                iframe.addEventListener('load', () => {
                  console.log('Razorpay iframe loaded securely')
                })
                
                iframe.addEventListener('error', (e) => {
                  console.error('Razorpay iframe error:', e)
                  options.onPaymentError?.(e)
                })
              }
            }
          })
        })
      })

      // Start observing for iframe creation
      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true
      })

      // Open Razorpay modal
      razorpay.open()

      // Stop observing after modal opens (with delay)
      setTimeout(() => {
        iframeObserver.disconnect()
      }, 2000)

      return true
    } catch (error) {
      console.error('Failed to open Razorpay payment:', error)
      options.onPaymentError?.(error)
      return false
    }
  }, [initializeRazorpay, options])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (razorpayRef.current) {
      try {
        // Close any open modals
        if (razorpayRef.current.close && typeof razorpayRef.current.close === 'function') {
          razorpayRef.current.close()
        }
      } catch (error) {
        console.warn('Error closing Razorpay modal:', error)
      }
      
      razorpayRef.current = null
    }
  }, [])

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    initializeRazorpay,
    openPayment,
    cleanup,
    isReady: !!window.Razorpay
  }
}

// Hook for secure iframe monitoring
export function useIframeSecurity() {
  useEffect(() => {
    // Monitor all iframes in the document
    const monitorIframes = () => {
      const iframes = document.querySelectorAll('iframe')
      
      iframes.forEach((iframe, index) => {
        // Skip if already processed
        if (iframe.hasAttribute('data-secure-processed')) {
          return
        }
        
        console.log(`Processing iframe ${index + 1}:`, iframe.src)
        
        // Apply security fixes
        if (iframe.src) {
          // Razorpay iframes
          if (iframe.src.includes('razorpay')) {
            iframe.setAttribute('allow', 
              'camera *; microphone *; payment *; clipboard-write *; web-share *; ' +
              'publickey-credentials-get *; publickey-credentials-create *; fullscreen *; ' +
              'accelerometer *; gyroscope *; magnetometer *; geolocation *'
            )
          }
          
          // GitHub iframes
          if (iframe.src.includes('github')) {
            iframe.setAttribute('allow', 
              'clipboard-write *; web-share *; publickey-credentials-get *'
            )
          }
          
          // Fix sandbox vulnerabilities
          if (iframe.hasAttribute('sandbox')) {
            const sandboxValue = iframe.getAttribute('sandbox')
            if (sandboxValue && sandboxValue.includes('allow-same-origin') && sandboxValue.includes('allow-scripts')) {
              console.warn('Fixed sandbox escape vulnerability in iframe:', iframe.src)
              iframe.setAttribute('sandbox', 
                sandboxValue.replace('allow-same-origin', '').trim()
              )
            }
          }
        }
        
        // Mark as processed
        iframe.setAttribute('data-secure-processed', 'true')
      })
    }

    // Initial scan
    monitorIframes()

    // Monitor for new iframes
    const observer = new MutationObserver((mutations) => {
      let hasNewIframes = false
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.nodeName === 'IFRAME') {
            hasNewIframes = true
          }
        })
      })
      
      if (hasNewIframes) {
        setTimeout(monitorIframes, 100) // Small delay for iframe to fully load
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])
}