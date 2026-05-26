import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ SERVER-SIDE SINGLETON logic
const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Service Role configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false // 🛡️ Server par session persist nahi karna chahiye
    }
  });
};

// Global cache for development (Hot reloading fix)
declare global {
  var cachedSupabaseAdmin: SupabaseClient | undefined;
}

// 🚀 Poore server par sirf ye ek instance use hoga
export const supabaseAdmin = globalThis.cachedSupabaseAdmin ?? createAdminClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.cachedSupabaseAdmin = supabaseAdmin;
}

/**
 * Backward compatibility functions - Ab ye naya singleton return karenge
 */
export function getServiceClient() {
  return supabaseAdmin;
}

export function getAutomationClient() {
  return supabaseAdmin;
}

export function supabaseService() {
  return supabaseAdmin;
}

// Class-based compatibility
class SupabaseServiceClass {
  static getInstance() {
    return new SupabaseServiceClass();
  }
  async getClient() {
    return supabaseAdmin;
  }
}

export default SupabaseServiceClass;
