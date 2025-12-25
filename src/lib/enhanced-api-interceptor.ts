'use client'

// Enhanced API interceptor with comprehensive logging and error handling
import { toast } from 'sonner'

interface ApiLogEntry {
  id: string
  url: string
  method: string
  startTime: number
  endTime?: number
  duration?: number
  status?: number
  success?: boolean
  error?: string
  requestHeaders?: Record<string, string>
  requestBody?: any
  responseBody?: any
}

class EnhancedApiLogger {
  private activeCalls = new Map<string, ApiLogEntry>()
  private completedCalls: ApiLogEntry[] = []
  private maxCompletedCalls = 100

  // Generate unique ID for API call
  private generateId(): string {
    return `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Log API call start
  logStart(url: string, method: string = 'GET', options?: RequestInit): string {
    const id = this.generateId()
    const entry: ApiLogEntry = {
      id,
      url,
      method,
      startTime: Date.now(),
      requestHeaders: options?.headers as Record<string, string>,
      requestBody: options?.body ? this.parseRequestBody(options.body) : undefined
    }

    this.activeCalls.set(id, entry)

    console.log(`🚀 [API] Starting ${method} ${url}`, {
      id,
      headers: options?.headers,
      body: entry.requestBody,
      timestamp: new Date().toISOString()
    })

    return id
  }

  // Log API call completion
  logComplete(id: string, success: boolean, response?: Response, error?: Error) {
    const entry = this.activeCalls.get(id)
    if (!entry) {
      console.warn(`⚠️ [API] No active call found for ID: ${id}`)
      return
    }

    const endTime = Date.now()
    const duration = endTime - entry.startTime

    entry.endTime = endTime
    entry.duration = duration
    entry.success = success
    entry.status = response?.status
    entry.error = error?.message

    if (success) {
      console.log(`✅ [API] Success ${entry.method} ${entry.url}`, {
        id,
        status: response?.status,
        duration: `${duration}ms`,
        headers: response ? Object.fromEntries(response.headers.entries()) : undefined,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error(`❌ [API] Error ${entry.method} ${entry.url}`, {
        id,
        status: response?.status,
        duration: `${duration}ms`,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      })
    }

    // Move to completed calls
    this.activeCalls.delete(id)
    this.completedCalls.push(entry)

    // Limit completed calls history
    if (this.completedCalls.length > this.maxCompletedCalls) {
      this.completedCalls = this.completedCalls.slice(-this.maxCompletedCalls)
    }

    return entry
  }

  // Parse request body safely
  private parseRequestBody(body: any): any {
    try {
      if (typeof body === 'string') {
        return JSON.parse(body)
      }
      return body
    } catch {
      return '[Unparseable Body]'
    }
  }

  // Get active calls
  getActiveCalls(): ApiLogEntry[] {
    return Array.from(this.activeCalls.values()).map(entry => ({
      ...entry,
      duration: Date.now() - entry.startTime
    }))
  }

  // Get completed calls
  getCompletedCalls(): ApiLogEntry[] {
    return [...this.completedCalls].reverse() // Most recent first
  }

  // Get API statistics
  getStats() {
    const total = this.completedCalls.length
    const successful = this.completedCalls.filter(call => call.success).length
    const failed = total - successful
    const avgDuration = total > 0 
      ? this.completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / total 
      : 0

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      activeCalls: this.activeCalls.size
    }
  }

  // Clear all logs
  clearLogs() {
    this.activeCalls.clear()
    this.completedCalls = []
    console.log('🧹 [API] Logs cleared')
  }
}

// Enhanced fetch wrapper
export const makeApiCall = async (url: string, options: RequestInit = {}): Promise<any> => {
  const method = options.method || 'GET'
  const id = apiLogger.logStart(url, method, options)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    let responseData: any
    let responseText: string

    try {
      responseText = await response.text()
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (parseError) {
      responseText = await response.text()
      responseData = { rawResponse: responseText }
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${responseText}`)
      apiLogger.logComplete(id, false, response, error)
      throw error
    }

    apiLogger.logComplete(id, true, response)
    
    console.log(`📊 [API] Response data for ${method} ${url}`, {
      id,
      data: responseData
    })

    return responseData

  } catch (error) {
    const duration = Date.now() - (apiLogger.getActiveCalls().find(call => call.id === id)?.startTime || Date.now())
    console.error(`💥 [API] Fetch Error ${method} ${url}`, {
      id,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    })

    apiLogger.logComplete(id, false, undefined, error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

// Create global instance
export const apiLogger = new EnhancedApiLogger()

// Export convenience functions
export const logApiCall = (url: string, method: string = 'GET', options?: RequestInit) => 
  apiLogger.logStart(url, method, options)

export const logApiComplete = (id: string, success: boolean, response?: Response, error?: Error) => 
  apiLogger.logComplete(id, success, response, error)

export const getActiveCalls = () => apiLogger.getActiveCalls()
export const getCompletedCalls = () => apiLogger.getCompletedCalls()
export const getApiStats = () => apiLogger.getStats()
export const clearApiLogs = () => apiLogger.clearLogs()

// Auto-initialize
console.log('🔧 Enhanced API Logger initialized')

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).apiLogger = apiLogger
  (window as any).makeApiCall = makeApiCall
}