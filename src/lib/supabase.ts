import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
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
