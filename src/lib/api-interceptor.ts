'use client'

// Simple API call logger without overriding fetch
import { toast } from 'sonner'

// Track API calls for monitoring
const activeCalls = new Map<string, { url: string; method: string; startTime: number }>()

// Log API call start
export function logApiCall(url: string, method: string = 'GET'): string {
  const id = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  activeCalls.set(id, {
    url,
    method,
    startTime: Date.now()
  })
  
  // Show simple loading message
  console.log(`🌐 API Call: ${method} ${url}`)
  
  return id
}

// Log API call completion
export function logApiComplete(id: string, success: boolean, message?: string) {
  const call = activeCalls.get(id)
  if (!call) return
  
  const duration = Date.now() - call.startTime
  
  if (success) {
    console.log(`✅ API Success: ${call.method} ${call.url} - ${duration}ms`)
  } else {
    console.log(`❌ API Error: ${call.method} ${call.url} - ${duration}ms`)
  }
  
  // Clean up
  activeCalls.delete(id)
}

// Get active calls for monitoring
export function getActiveCalls() {
  return Array.from(activeCalls.entries()).map(([id, call]) => ({
    id,
    ...call,
    duration: Date.now() - call.startTime
  }))
}

// Auto-initialize
console.log('🔧 Simple API Logger initialized')