import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const { clientId, role, permissions } = body

  if (!clientId || !role || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // 1️⃣ Fetch existing permissions
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('role_permissions')
    .eq('id', clientId)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // 2️⃣ Merge permissions
  const updatedPermissions = {
    ...(client?.role_permissions || {}),
    [role]: permissions
  }

  // 3️⃣ Save back to DB
  const { error: updateError } = await supabase
    .from('clients')
    .update({ role_permissions: updatedPermissions })
    .eq('id', clientId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
