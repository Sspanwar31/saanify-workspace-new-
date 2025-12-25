import { supabase } from '@/lib/real-supabase'

export async function POST(req: Request) {
  const { taskId, enabled } = await req.json()

  try {
    const { data, error } = await supabase
      .from('automation_tasks')
      .update({ enabled })
      .eq('task_name', taskId)

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
