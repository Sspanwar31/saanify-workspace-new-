import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ NEXT.JS SAFE SINGLETON
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
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

// Poori app mein sirf ye hi use hoga
export const supabase = globalThis.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabase = supabase;
}
