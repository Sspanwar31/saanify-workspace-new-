"use client"

import { useEffect } from "react"

/**
 * RazorpayLoader Component
 * 
 * This component loads the Razorpay script only on the client side
 * to prevent hydration mismatches.
 */
export default function RazorpayLoader() {
  useEffect(() => {
    // Load Razorpay script only on client side
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}