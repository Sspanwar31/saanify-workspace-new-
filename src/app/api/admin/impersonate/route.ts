import { NextRequest, NextResponse } from 'next/server'; // ✅ Ensure NextRequest type is imported
import { createClient } from '@supabase-js/supabase-js';
import { process } from 'process';

// --- HELPER FUNCTIONS ---

// ✅ Role Key Decoder Logic (Matches your snippet)
const getServiceRoleKey = () => {
  const b64Key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY_B64;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!b64Key && !rawKey) return null;

  try {
    // Agar key base64 mein hai, toh decode karke use karein (Supabase standard)
    if (b64Key.startsWith('eyJ')) {
      return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
    }
    return rawKey;
  } catch (e) {
    return rawKey;
  }
};

export async function POST(req: NextRequest) {
  try {
    // 1. Parse JSON body safely
    const body = await req.json();
    const { clientId } = body;

    // 2. Get Service Role Key
    const serviceRoleKey = getServiceRoleKey();

    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server Configuration Error (Key Missing)', status: 500 });
    }

    console.log("👉 IMPORTANT REQUEST FOR:", clientId);

    // 3. Initialize Supabase Admin (For Client Auth)
    let supabaseAdmin;
    try {
        supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceRoleKey
        );

        // Config for standard client
        supabaseAdmin.auth.autoRefreshToken = false;
        supabaseAdmin.auth.persistSession = false;
    } catch (e) {
        console.error('❌ Admin Client Init Error:', e);
        return NextResponse.json({ error: 'Admin Config Error' });
    }

    // 4. Check if user exists in 'clients' table to get email
    // Note: Logic assumes 'clients' table is in Public/Public schema
    const { data, error: dbError } = await supabaseAdmin
        .from('clients')
        .select('id, email')
        .eq('id', clientId)
        .maybeSingle();

    if (dbError) {
      console.error("❌ DB Error fetching client:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!data || !data.email) {
      console.log("❌ CLIENT NOT FOUND in DB:", clientId);
      return NextResponse.json({ error: 'Client record or email missing' }, { status: 404 });
    }

    const clientEmail = data.email;

    // 5. Generate Magic Link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin
        .createLink({ type: 'magiclink', email: clientEmail });

    if (linkError || !linkData) {
      console.error("❌ MAGIC LINK GENERATION FAILED:", linkError);
      return NextResponse.json({ error: linkError.message || 'Link generation failed' });
    }

    // 6. Store Admin Session (HTTP Only Cookie)
    // Note: We need to send the session cookie in the response
    const { data: sessionData, error: sessError } = await supabaseAdmin.auth.admin
        .setSession({
          access_token: linkData.access_token,
          refresh_token: linkData.refresh_token,
          expires_at: new Date(linkData.expires_at).toISOString(),
          user: { email: clientEmail } // Storing minimal data in cookie
        });
    
    const adminSession = { email: clientEmail, ...sessionData };

    console.log("✅ ACCESS LINK GENERATED FOR:", clientEmail);

    // 7. Return Success Response with Link
    return NextResponse.json({
      success: true,
      url: linkData.properties.action_link,
      clientName: data.name || 'Admin',
    });

  } catch (err) {
    console.error("❌ CRITICAL IMPERSONATE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
