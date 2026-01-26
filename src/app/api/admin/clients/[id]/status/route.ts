import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get the Base64 Key from Env
    const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
    
    if (!b64Key) {
      console.error("❌ Missing Env: SUPABASE_SERVICE_ROLE_KEY_B64");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. DECODE KEY (Base64 -> UTF-8 String)
    const serviceRoleKey = Buffer.from(b64Key, 'base64')
      .toString('utf-8')
      .trim();

    // 3. Initialize Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 4. Parse Request
    const { action } = await req.json();
    const clientId = params.id;

    console.log(`🚀 Admin Action: ${action} on Client: ${clientId}`);

    // 5. Update Status Map
    const statusMap: any = {
      LOCK: 'LOCKED',
      UNLOCK: 'ACTIVE',
      EXPIRE: 'EXPIRED'
    };

    if (!statusMap[action]) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 6. Update Database
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ status: statusMap[action] })
      .eq('id', clientId);

    if (dbError) {
      console.error("DB Update Error:", dbError);
      throw dbError;
    }

    // 7. Force Logout (Sign Out User)
    // Sirf LOCK ya EXPIRE par logout karo, UNLOCK par nahi
    if (action === 'LOCK' || action === 'EXPIRE') {
        const { error: authError } = await supabaseAdmin.auth.admin.signOut(clientId, {
            scope: 'global'
        });
        
        if (authError) {
            console.warn("Auth SignOut Warning (User might be offline):", authError.message);
        } else {
            console.log("✅ User session revoked successfully");
        }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("API Critical Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
