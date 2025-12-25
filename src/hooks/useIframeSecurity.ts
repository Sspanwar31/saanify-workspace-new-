import { useEffect, useRef, useCallback } from 'react'

// Hook to monitor and fix iframe security issues
export function useIframeSecurity() {
  const processedIframes = useRef(new Set<HTMLIFrameElement>())

  useEffect(() => {
    // Function to apply security fixes to iframes
    const fixIframeSecurity = (iframe: HTMLIFrameElement) => {
      // Skip if already processed
      if (processedIframes.current.has(iframe)) {
        return
      }

      console.log('🔒 Applying security fixes to iframe:', iframe.src)

      // Apply required permissions for payment iframes
      if (iframe.src && iframe.src.includes('razorpay')) {
        iframe.setAttribute('allow', 
          'camera *; microphone *; payment *; clipboard-write *; web-share *; ' +
          'publickey-credentials-get *; publickey-credentials-create *; fullscreen *; ' +
          'accelerometer *; gyroscope *; magnetometer *; geolocation *'
        )
      }

      // Fix sandbox attribute if it's too restrictive
      if (iframe.hasAttribute('sandbox')) {
        const sandboxValue = iframe.getAttribute('sandbox')
        if (sandboxValue && sandboxValue.includes('allow-same-origin') && sandboxValue.includes('allow-scripts')) {
          console.warn('🔒 Fixing sandbox escape vulnerability')
          iframe.setAttribute('sandbox', 
            sandboxValue.replace('allow-same-origin', '').trim()
          )
        }
      }

      // Mark as processed
      processedIframes.current.add(iframe)
    }

    // Monitor for new iframes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.nodeName === 'IFRAME') {
              fixIframeSecurity(node as HTMLIFrameElement)
            }
            
            // Check for iframes within added nodes
            const iframes = (node as Element).querySelectorAll ? 
              (node as Element).querySelectorAll('iframe') : []
            iframes.forEach(iframe => fixIframeSecurity(iframe))
          }
        })
      })
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Process existing iframes
    const existingIframes = document.querySelectorAll('iframe')
    existingIframes.forEach(iframe => fixIframeSecurity(iframe))

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])
}

// Hook to handle Razorpay specifically
export function useRazorpaySecurity() {
  const razorpayRef = useRef<any>(null)

  const initializeSecureRazorpay = useCallback((options: any) => {
    if (!window.Razorpay) {
      console.error('Razorpay not loaded')
      return null
    }

    try {
      // Create Razorpay instance
      const razorpay = new (window as any).Razorpay(options)
      razorpayRef.current = razorpay

      // Override the open method to apply security fixes
      const originalOpen = razorpay.open.bind(razorpay)
      razorpay.open = function() {
        const result = originalOpen()
        
        // Apply security fixes after opening
        setTimeout(() => {
          const iframes = document.querySelectorAll('iframe')
          iframes.forEach(iframe => {
            if (iframe.src && iframe.src.includes('razorpay')) {
              console.log('🔒 Securing Razorpay iframe')
              iframe.setAttribute('allow', 
                'camera *; microphone *; payment *; clipboard-write *; web-share *; ' +
                'publickey-credentials-get *; publickey-credentials-create *; fullscreen *; ' +
                'accelerometer *; gyroscope *; magnetometer *; geolocation *'
              )
              
              // Fix sandbox if needed
              if (iframe.hasAttribute('sandbox')) {
                const sandboxValue = iframe.getAttribute('sandbox')
                if (sandboxValue && sandboxValue.includes('allow-same-origin') && sandboxValue.includes('allow-scripts')) {
                  iframe.setAttribute('sandbox', 
                    sandboxValue.replace('allow-same-origin', '').trim()
                  )
                }
              }
            }
          })
        }, 100)
        
        return result
      }

      return razorpay
    } catch (error) {
      console.error('Failed to initialize Razorpay:', error)
      return null
    }
  }, [])

  return {
    initializeSecureRazorpay,
    razorpay: razorpayRef.current
  }
}

// Type declarations
declare global {
  interface Window {
    Razorpay: any
  }
}