import { createClient } from '@supabase/supabase-js';

// Ye client 'GOD MODE' me chalega (RLS Bypass)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Dhyan dein: Hum B64 key use kar rahe hain agar wo available hai
  process.env.SUPABASE_SERVICE_ROLE_KEY_B64 
    ? Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY_B64, 'base64').toString('utf-8')
    : process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
