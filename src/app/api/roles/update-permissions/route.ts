import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientId, role, permissions } = body

    if (!clientId || !role || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 🔒 only treasurer editable (safe guard)
    if (role !== 'treasurer') {
      return NextResponse.json(
        { error: 'Role not allowed' },
        { status: 403 }
      )
    }

    // ✅ UPDATE permissions in clients table
    const { error } = await supabase
      .from('clients')
      .update({
        role_permissions: {
          treasurer: permissions
        }
      })
      .eq('id', clientId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
