import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// HELPER: Create a Mock Client to prevent crashes when keys are missing (Preview/Build mode)
const createMockClient = () => {
  console.warn("⚠️ Supabase Keys missing. App running in UI-Only Mode.");
  
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: any) => ({
          eq: (col2: string, val2: any) => ({
            single: async () => ({ data: null, error: { message: "PREVIEW MODE: Database disconnected" } }),
            maybeSingle: async () => ({ data: null, error: null })
          }),
        }),
        order: async () => ({ data: [], error: null })
      }),
      insert: async () => ({ error: { message: "PREVIEW MODE: Cannot write data" } }),
      update: async () => ({ eq: async () => ({ error: null }) }),
    }),
    auth: {
      signInWithPassword: async () => ({ data: { user: null }, error: { message: "Preview Mode: Auth disconnected" } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }) }), // Mock realtime
  } as any;
};

// ✅ NEXT.js Development mein multiple instances rokne ke liye global cache use karein
const globalForSupabase = global as unknown as { supabase: any };

// ✅ INITIALIZE: Sirf ek baar create hoga
export const supabase = globalForSupabase.supabase || (
  (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            events_per_second: 10,
          },
        },
      }) 
    : createMockClient()
);

// Development environment mein instance ko global save karlo
if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase;
