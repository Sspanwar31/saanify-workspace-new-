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
          single: async () => ({ data: null, error: { message: "PREVIEW MODE: Database disconnected" } }),
          order: async () => ({ data: [], error: null })
        }),
        order: () => Promise.resolve({ data: [], error: null }),
        insert: async () => ({ error: { message: "PREVIEW MODE: Cannot write data" } }),
        update: async () => ({ eq: async () => ({ error: null }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
      insert: async () => ({ error: null }),
      upsert: async () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) })
    }),
    auth: {
      signUp: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: "Preview Mode: Auth disconnected" } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  } as any;
};

// INITIALIZE: Use Real Client if keys exist, otherwise Mock Client
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : createMockClient();