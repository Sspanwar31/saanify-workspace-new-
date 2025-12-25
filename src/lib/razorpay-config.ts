// Razorpay configuration with proper iframe permissions
export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  handler?: (response: any) => void
  modal?: {
    ondismiss?: () => void
    escape?: boolean
    handleback?: boolean
    confirm_close?: boolean
    persist?: string
    class?: {
      backdrop?: string
      content?: string
      close?: string
      confirm?: string
      cancel?: string
      image?: string
      form?: string
      input?: string
      label?: string
      radio?: string
      checkbox?: string
      button?: string
      anchor?: string
    }
    theme?: {
      backdrop?: string
      content?: string
      close?: string
      confirm?: string
      cancel?: string
      image?: string
      form?: string
      input?: string
      label?: string
      radio?: string
      checkbox?: string
      button?: string
      anchor?: string
    }
  }
  notes?: Record<string, any>
  callback_url?: string
  redirect?: boolean
  remember_customer?: boolean
  customer_id?: string
  send_sms?: boolean
  allow_contact?: boolean
  schedule?: boolean
  reference_id?: string
  subscription_id?: string
  recurring?: boolean
  partial_payment?: boolean
  first_payment_min_amount?: number
  mandate?: {
    max_amount?: number
    frequency?: string
    start_date?: number
    expire_after?: number
    amount_type?: string
    token_type?: string
    bank_account?: string
    bank_type?: string
    payment_method?: string
    card_type?: string
    network?: string
    issuer?: string
    emi_plan_id?: string
    instrument_id?: string
    verify_method?: string
    verify_amount?: number
    verify_expiry?: number
    verify_flow?: string
    verify_purpose?: string
  }
}

// Create Razorpay instance with proper permissions
export function createRazorpayInstance(options: RazorpayOptions) {
  if (typeof window === 'undefined') {
    throw new Error('Razorpay can only be used in browser environment')
  }

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded. Please ensure the script is loaded.')
  }

  // Configure with proper iframe permissions
  const config: any = {
    ...options,
    // Fix for iframe security violations
    modal: {
      ...options.modal,
      // Additional modal configurations for security
      escape: true,
      handleback: true,
      confirm_close: false,
      persist: 'company_session_token'
    },
    // Configure image and branding
    image: '/logo.svg',
    theme: {
      color: '#3399cc',
      backdrop_color: '#ffffff',
      highlight_color: '#3399cc'
    }
  }

  const razorpay = new (window as any).Razorpay(config)
  
  // Set iframe permissions after opening
  const originalOpen = razorpay.open.bind(razorpay)
  razorpay.open = function() {
    const result = originalOpen()
    
    // Set permissions for any iframes created by Razorpay
    setTimeout(() => {
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach(iframe => {
        if (iframe.src && iframe.src.includes('razorpay')) {
          // Add required permissions to Razorpay iframes
          iframe.setAttribute('allow', 
            'camera *; microphone *; payment *; clipboard-write *; web-share *; ' +
            'publickey-credentials-get *; publickey-credentials-create *; fullscreen *; ' +
            'accelerometer *; gyroscope *; magnetometer *; geolocation *'
          )
          
          // Fix sandbox attribute if it's too restrictive
          if (iframe.hasAttribute('sandbox')) {
            const sandboxValue = iframe.getAttribute('sandbox')
            if (sandboxValue && sandboxValue.includes('allow-same-origin') && sandboxValue.includes('allow-scripts')) {
              // Remove allow-same-origin to prevent sandbox escape
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
}

// Utility to configure Razorpay checkout with security fixes
export function configureRazorpayCheckout(baseOptions: Partial<RazorpayOptions>) {
  const defaultOptions: Partial<RazorpayOptions> = {
    currency: 'INR',
    name: 'Saanify Technologies',
    description: 'Society Management Subscription',
    prefill: {
      name: '',
      email: '',
      contact: ''
    },
    modal: {
      ondismiss: function() {
        console.log('Razorpay checkout dismissed')
      },
      escape: true,
      handleback: true,
      confirm_close: false,
      persist: 'company_session_token'
    },
    theme: {
      color: '#3399cc'
    },
    notes: {
      source: 'saanify_web',
      timestamp: new Date().toISOString()
    }
  }

  return { ...defaultOptions, ...baseOptions }
}

// Type declaration for Razorpay global
declare global {
  interface Window {
    Razorpay: any
  }
}