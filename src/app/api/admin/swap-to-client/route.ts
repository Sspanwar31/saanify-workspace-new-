import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// 🔹 SERVICE ROLE KEY WITH BASE64 DECODE
const serviceRoleKeyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceRoleKey = Buffer.from(serviceRoleKeyRaw, 'base64').toString('utf-8');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // 1. INITIALIZE ADMIN CLIENT (God Mode)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 2. VERIFY CALLER (Security Layer)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // Admin token ko verify karein
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (adminError || !adminData.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Token' }, { status: 401 });
    }

    // Check karein ki kya ye 'admins' table mein hai
    const { data: isAdminCheck, error: roleError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', adminData.user.id)
      .maybeSingle();

    if (roleError || !isAdminCheck) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 3. GET TARGET CLIENT DETAILS
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(clientId);

    if (userError || !targetUser.user) {
      return NextResponse.json({ error: 'Target Client not found' }, { status: 404 });
    }

    // 4. GENERATE MAGIC LINK (TOKEN GENERATION)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
      options: {
        redirectTo: 'http://localhost:3000/dummy', 
      }
    });

    if (linkError) {
      console.error("Generate Link Error:", linkError);
      return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
    }

    // 5. EXTRACT TOKENS
    const accessToken = linkData.properties?.access_token;
    const refreshToken = linkData.properties?.refresh_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
    }

    // 6. RETURN DATA TO FRONTEND
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: targetUser.user
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
