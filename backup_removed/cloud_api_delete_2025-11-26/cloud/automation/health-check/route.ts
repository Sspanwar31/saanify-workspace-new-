import { supabase } from '@/lib/real-supabase'

export async function GET() {
  try {
    const { count, error } = await supabase.from('sessions').select('id', { count: 'exact' })
    if (error) throw error

    return new Response(JSON.stringify({ success: true, active_sessions: count }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
