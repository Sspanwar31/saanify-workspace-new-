import { createClient } from '@supabase/supabase-js'

/**
 * Browser/client-side Supabase client
 * Uses anonymous/public keys only
 * For client-side authentication and public data access
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase public configuration missing. Using mock client for development.')
    
    // Return a mock client for development
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Not configured') }),
        signUp: async () => ({ data: { user: null, session: null }, error: new Error('Not configured') }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: new Error('Not configured') })
      },
      from: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: new Error('Not configured') }),
      update: () => ({ data: null, error: new Error('Not configured') }),
      delete: () => ({ data: null, error: new Error('Not configured') }),
      select: () => ({ data: [], error: null }),
      rpc: () => ({ data: null, error: new Error('Not configured') })
    } as any
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

// Singleton instance for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// Export the singleton instance as supabaseBrowser for compatibility
export const supabaseBrowser = getBrowserClient()