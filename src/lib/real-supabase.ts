import { createClient } from '@supabase/supabase-js'

// Check if Supabase environment variables are available
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Full admin client - only create if environment variables are available
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Example: create admins table
export const createTables = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }
  await supabase.rpc('create_admins_table')
  await supabase.rpc('create_clients_table')
  await supabase.rpc('create_sessions_table')
}

// Example: run a backup task
export const runBackup = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }
  const { data, error } = await supabase.from('automation_tasks').insert([
    { task_name: 'backup-now', status: 'running', started_at: new Date() }
  ])
  return { data, error }
}
