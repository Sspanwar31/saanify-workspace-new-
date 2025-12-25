// Utility functions for payment mode management
export type PaymentMode = 'MANUAL' | 'RAZORPAY' | null

export const PAYMENT_MODE_CONFIG = {
  MANUAL: {
    name: 'Manual Mode',
    description: 'Users upload payment proofs for manual admin approval',
    icon: '📄',
    color: 'blue',
    features: [
      'Payment proof upload',
      'Admin approval workflow',
      'Manual verification',
      'Flexible payment methods'
    ]
  },
  RAZORPAY: {
    name: 'Razorpay Mode', 
    description: 'Users pay directly via Razorpay instant payment gateway',
    icon: '💳',
    color: 'green',
    features: [
      'Instant payment processing',
      'Multiple payment methods',
      'Automatic receipts',
      'Real-time confirmation'
    ]
  }
} as const

export function getPaymentMode(): PaymentMode {
  // Check environment variable first (for SSR)
  if (typeof window === 'undefined') {
    return (process.env.NEXT_PUBLIC_PAYMENT_MODE as PaymentMode) || null
  }
  
  // Check localStorage on client side
  try {
    const stored = localStorage.getItem('payment-mode')
    return (stored as PaymentMode) || null
  } catch {
    return null
  }
}

export function setPaymentMode(mode: PaymentMode) {
  if (typeof window !== 'undefined') {
    try {
      if (mode) {
        localStorage.setItem('payment-mode', mode)
      } else {
        localStorage.removeItem('payment-mode')
      }
    } catch (error) {
      console.error('Failed to save payment mode to localStorage:', error)
    }
  }
}

export function isPaymentModeConfigured(): boolean {
  const mode = getPaymentMode()
  return mode === 'MANUAL' || mode === 'RAZORPAY'
}

export function getPaymentModeConfig(mode: PaymentMode) {
  if (!mode) return null
  return PAYMENT_MODE_CONFIG[mode]
}