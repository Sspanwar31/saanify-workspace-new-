import { supabase } from '@/lib/real-supabase'

export async function POST(req: Request) {
  const { taskId } = await req.json()

  try {
    let result
    switch (taskId) {
      case 'backup-now':
      case 'auto-sync':
      case 'schema-sync':
      case 'auto-backup':
      case 'health-check':
      case 'log-rotation':
      case 'ai-optimization':
      case 'security-scan':
        result = await supabase.from('automation_logs').insert([
          { task_name: taskId, status: 'running', started_at: new Date() }
        ])
        break
      default:
        return new Response(JSON.stringify({ error: 'Unknown task' }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true, result }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
