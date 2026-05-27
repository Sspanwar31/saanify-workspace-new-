import { createClient } from '@supabase/supabase-js';

const getServiceKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let key = b64 || raw || '';
  
  if (!key) return '';

  // Agar key eyJ se shuru nahi ho rahi aur B64 hai, toh decode karein
  if (!key.startsWith('eyJ')) {
    try {
      return Buffer.from(key, 'base64').toString('utf-8').trim();
    } catch (e) {
      return key;
    }
  }
  return key;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = getServiceKey();

if (!supabaseUrl || !serviceKey) {
  console.error("❌ CRITICAL ERROR: Supabase URL or Service Key missing!");
}

// ✅ SINGLETON ADMIN CLIENT
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
