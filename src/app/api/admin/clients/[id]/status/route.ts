import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 🔐 Decode Base64 Service Role Key
const serviceRoleKey = Buffer.from(
  process.env.SUPABASE_SERVICE_ROLE_KEY_B64!,
  'base64'
).toString('utf-8')

// 🔥 Admin Supabase Client (FULL POWER)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey
)

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await req.json()
    const clientId = params.id

    if (!['LOCK', 'UNLOCK', 'EXPIRE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const statusMap: any = {
      LOCK: 'LOCKED',
      UNLOCK: 'ACTIVE',
      EXPIRE: 'EXPIRED'
    }

    // 1️⃣ update client status
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ status: statusMap[action] })
      .eq('id', clientId)

    if (error) throw error

    // 2️⃣ revoke ALL auth sessions (🔥 main power)
    await supabaseAdmin.auth.admin.signOut(clientId, {
      scope: 'global'
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
