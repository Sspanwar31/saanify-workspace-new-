import { supabase } from '@/lib/real-supabase'

export async function POST(req: Request) {
  const { file } = await req.json()

  try {
    const { data, error } = await supabase.storage
      .from('automated-backups')
      .upload(`restore/${file.name}`, file)

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
