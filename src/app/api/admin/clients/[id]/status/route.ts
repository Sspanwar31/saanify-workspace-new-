import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const { action } = await req.json()

    if (!clientId || !action) {
      return NextResponse.json(
        { error: 'Client ID or action missing' },
        { status: 400 }
      )
    }

    // ✅ allowed actions only
    let newStatus: 'LOCKED' | 'EXPIRED'

    if (action === 'LOCK') {
      newStatus = 'LOCKED'
    } else if (action === 'EXPIRE') {
      newStatus = 'EXPIRED'
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // ✅ ONLY DB UPDATE (NO LOGOUT)
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ status: newStatus })
      .eq('id', clientId)

    if (error) {
      console.error('Status update failed:', error)
      return NextResponse.json(
        { error: 'Failed to update client status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: newStatus
    })

  } catch (err) {
    console.error('Client status API error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
