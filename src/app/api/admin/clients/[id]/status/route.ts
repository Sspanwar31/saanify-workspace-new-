import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- 🔐 SAFER BASE64 DECODER ---
const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  
  if (!b64Key) {
    console.error("❌ Environment Variable 'SUPABASE_SERVICE_ROLE_KEY_B64' missing in Vercel.");
    return null;
  }

  try {
    // Agar key pehle se hi 'eyJ' se shuru ho rahi hai, matlab wo already decoded hai
    if (b64Key.startsWith('eyJ')) return b64Key;
    
    // Base64 se decode karein
    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) {
    console.error("❌ Failed to decode Base64 key:", e);
    return null;
  }
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;
    const body = await req.json();
    const { action } = body;

    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json({ error: "Server Configuration Error: Key Missing" }, { status: 500 });
    }

    // Initialize Supabase only when needed inside the handler
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Mapping Logic (Standardizing Status)
    let updateData: any = {};
    const cmd = action?.toUpperCase();

    if (cmd === 'LOCK') {
      updateData = { status: 'LOCKED', subscription_status: 'locked' };
    } else if (cmd === 'EXPIRE') {
      updateData = { status: 'EXPIRED', subscription_status: 'expired' };
    } else if (cmd === 'ACTIVATE' || cmd === 'UNLOCK' || cmd === 'ACTIVE') {
      updateData = { status: 'ACTIVE', subscription_status: 'active' };
    } else {
      return NextResponse.json({ error: 'Invalid Action: ' + action }, { status: 400 });
    }

    // 2. Database Update (Bypassing RLS)
    const { data, error: dbError } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select();

    if (dbError) {
      console.error('Supabase DB Error:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: updateData.status,
      message: `Client status updated to ${updateData.status}`
    });

  } catch (err: any) {
    console.error('Fatal API Crash:', err.message);
    return NextResponse.json({ error: "API Internal Error: " + err.message }, { status: 500 });
  }
}
