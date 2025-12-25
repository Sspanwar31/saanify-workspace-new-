import { supabase } from '@/lib/real-supabase'

export async function POST() {
  try {
    const { error } = await supabase.from('automation_logs').delete().lt('started_at', new Date(Date.now() - 7*24*3600*1000))
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
