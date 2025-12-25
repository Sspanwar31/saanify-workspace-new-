'use client'

import { toast } from 'sonner'

// API call types
export interface ApiCallInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  action: string // User-friendly action name
  startTime: number
  id: string
}

// Active API calls tracking
const activeApiCalls = new Map<string, ApiCallInfo>()

// Generate user-friendly action name from URL
export function getActionNameFromUrl(method: string, url: string): string {
  const path = url.split('/').filter(Boolean)
  const lastSegment = path[path.length - 1]
  
  // Handle different API patterns
  if (url.includes('/members')) {
    if (method === 'GET') return 'मेंबर्स लिस्ट लोड कर रहे हैं'
    if (method === 'POST') return 'नया मेंबर जोड़ रहे हैं'
    if (method === 'PUT') return 'मेंबर अपडेट कर रहे हैं'
    if (method === 'DELETE') return 'मेंबर डिलीट कर रहे हैं'
  }
  
  if (url.includes('/loans')) {
    if (method === 'GET') return 'लोन लिस्ट लोड कर रहे हैं'
    if (method === 'POST') return 'लोन अप्लाई कर रहे हैं'
    if (method === 'PUT') return 'लोन अपडेट कर रहे हैं'
    if (method === 'DELETE') return 'लोन डिलीट कर रहे हैं'
  }
  
  if (url.includes('/passbook')) {
    if (method === 'GET') return 'पासबुक लोड कर रहे हैं'
    if (method === 'POST') return 'पासबुक एंट्री जोड़ रहे हैं'
    if (method === 'PUT') return 'पासबुक अपडेट कर रहे हैं'
    if (method === 'DELETE') return 'पासबुक एंट्री डिलीट कर रहे हैं'
  }
  
  if (url.includes('/expenses')) {
    if (method === 'GET') return 'खर्चे लिस्ट लोड कर रहे हैं'
    if (method === 'POST') return 'नया खर्चा जोड़ रहे हैं'
    if (method === 'PUT') return 'खर्चा अपडेट कर रहे हैं'
    if (method === 'DELETE') return 'खर्चा डिलीट कर रहे हैं'
  }
  
  if (url.includes('/reports')) {
    return 'रिपोर्ट लोड कर रहे हैं'
  }
  
  if (url.includes('/dashboard')) {
    return 'डैशबोर्ड डेटा लोड कर रहे हैं'
  }
  
  if (url.includes('/auth/')) {
    if (url.includes('/login')) return 'लॉगिन कर रहे हैं'
    if (url.includes('/logout')) return 'लॉगआउट कर रहे हैं'
    if (url.includes('/check-session')) return 'सेशन चेक कर रहे हैं'
  }
  
  // Default action names
  const actionMap: Record<string, string> = {
    'GET': 'डेटा लोड कर रहे हैं',
    'POST': 'डेटा सेव कर रहे हैं',
    'PUT': 'डेटा अपडेट कर रहे हैं',
    'DELETE': 'डेटा डिलीट कर रहे हैं',
    'PATCH': 'डेटा मॉडिफाई कर रहे हैं'
  }
  
  return actionMap[method] || `${method} request`
}

// Start tracking an API call
export function startApiCall(method: string, url: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const action = getActionNameFromUrl(method, url)
  
  const apiCall: ApiCallInfo = {
    method: method as any,
    url,
    action,
    startTime: Date.now(),
    id
  }
  
  activeApiCalls.set(id, apiCall)
  
  // Show loading toast
  toast.loading(action, {
    id: `api-${id}`,
    description: `${method} ${url}`,
    duration: 0 // Keep loading until completed
  })
  
  return id
}

// Complete an API call with success
export function completeApiCall(id: string, success: boolean, message?: string) {
  const apiCall = activeApiCalls.get(id)
  if (!apiCall) return
  
  const duration = Date.now() - apiCall.startTime
  
  // Remove loading toast
  toast.dismiss(`api-${id}`)
  
  if (success) {
    // Show success toast
    toast.success('✅ API कॉल सफल', {
      description: message || `${apiCall.action} - ${duration}ms में पूरा`,
      duration: 3000,
      id: `success-${id}`
    })
  } else {
    // Show error toast
    toast.error('❌ API कॉल फेल', {
      description: message || `${apiCall.action} में त्रुटि`,
      duration: 5000,
      id: `error-${id}`
    })
  }
  
  // Clean up
  activeApiCalls.delete(id)
}

// Get all active API calls
export function getActiveApiCalls(): ApiCallInfo[] {
  return Array.from(activeApiCalls.values())
}

// Enhanced fetch wrapper with automatic notifications
export async function apiFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method || 'GET'
  const apiCallId = startApiCall(method, url)
  
  try {
    // Use original fetch to avoid recursion
    const response = await fetch(url, options)
    
    if (response.ok) {
      completeApiCall(apiCallId, true)
    } else {
      const errorText = await response.text()
      completeApiCall(apiCallId, false, `HTTP ${response.status}: ${errorText}`)
    }
    
    return response
  } catch (error) {
    completeApiCall(apiCallId, false, `Network error: ${error}`)
    throw error
  }
}

// React hook for API notifications
export function useApiNotifications() {
  return {
    startApiCall,
    completeApiCall,
    getActiveApiCalls,
    apiFetch
  }
}