import { supabase } from '@/lib/supabase';

export const createClient = () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check environment variables.');
  }
  return supabase;
};