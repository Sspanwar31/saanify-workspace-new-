import { createClient } from '@supabase/supabase-js';
import * as supabaseJS from '@supabase/supabase-js';

// 🕵️‍♂️ STEP 1: DETECTIVE LOGIC (Isey top par rakhein)
const originalCreateClient = supabaseJS.createClient;

// @ts-ignore - Override the global createClient function to find culprits
(supabaseJS as any).createClient = (...args: any[]) => {
  console.warn("🚨 [DETECTIVE] createClient was called!");
  console.trace("📍 Trace the culprit file here:"); // Is line par click karke file milegi
  return originalCreateClient(...args as any);
};

// ---------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ STEP 2: AAPKA ORIGINAL SINGLETON LOGIC
const createSupabaseClient = () => {
  return originalCreateClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        events_per_second: 10,
      },
    },
  });
};

declare global {
  var supabase: ReturnType<typeof createSupabaseClient> | undefined;
}

export const supabase = globalThis.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabase = supabase;
}
