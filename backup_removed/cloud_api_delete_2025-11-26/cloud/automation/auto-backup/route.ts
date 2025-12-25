import { supabase } from '@/lib/real-supabase'

export async function POST() {
  try {
    await supabase.rpc('auto_backup')
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
