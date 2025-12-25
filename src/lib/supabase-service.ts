import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Service client for server-side operations only
 * Uses SERVICE_ROLE_KEY for elevated privileges
 * NEVER expose this to client-side code
 */
export function getServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Get service client with admin context for automation tasks
 */
export function getAutomationClient() {
  const client = getServiceClient()
  
  // Set service role context for elevated operations
  return client
}

/**
 * Export supabaseService as function for lazy initialization
 */
export function supabaseService() {
  return getServiceClient()
}

/**
 * Class-based service for backward compatibility
 */
class SupabaseServiceClass {
  private static instance: SupabaseServiceClass | null = null
  private client: SupabaseClient | null = null

  static getInstance(): SupabaseServiceClass {
    if (!SupabaseServiceClass.instance) {
      SupabaseServiceClass.instance = new SupabaseServiceClass()
    }
    return SupabaseServiceClass.instance
  }

  async getClient(): Promise<SupabaseClient | null> {
    if (!this.client) {
      try {
        this.client = getServiceClient()
      } catch (error) {
        console.error('Failed to create Supabase client:', error)
        return null
      }
    }
    return this.client
  }
}

/**
 * Default export for class-based usage
 */
export default SupabaseServiceClass