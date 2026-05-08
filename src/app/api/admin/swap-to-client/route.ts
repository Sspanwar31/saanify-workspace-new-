import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ✅ ROBUST KEY HANDLER
// Ye function check karega ki key Base64 hai ya Raw text
const getServiceKey = () => {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envKeyB64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  let keyToUse = envKeyB64 || envKey || '';

  if (!keyToUse) return '';

  // Agar key 'eyJ' se start ho rahi hai, to wo likely JWT hai (already decoded/base64 not needed)
  if (keyToUse.startsWith('eyJ')) return keyToUse;

  try {
    // Try decode karke dekhte hain
    const decoded = Buffer.from(keyToUse, 'base64').toString('utf-8').trim();
    
    // Agar decoded string valid lag rahi hai (length check), to use karein
    if (decoded.length > 20 && !decoded.includes(' ')) {
      return decoded;
    }
  } catch (e) {
    console.log("Key decode failed, using as-is");
  }

  // Agar decode fail ho ya raw key thi, to wapas original return kar do
  return keyToUse;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const serviceKey = getServiceKey();

    if (!serviceKey) {
      return NextResponse.json({ error: 'Server Misconfiguration: Service Key missing' }, { status: 500 });
    }

    // 1. INITIALIZE ADMIN CLIENT
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 2. VERIFY CALLER
    const authHeader = req.headers.get('authorization');
    
    // Debugging: Agar Header missing hai to console mein dikhega
    if (!authHeader) {
      console.log("Missing Auth Header");
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Agar Token khali hai to error
    if (!token) {
       return NextResponse.json({ error: 'Unauthorized: Empty token' }, { status: 401 });
    }

    // Admin token ko verify karein
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.getUser(token);

    // Debugging: Console mein exact Supabase error print karein
    if (adminError) {
      console.error("🚨 Supabase Auth Error:", adminError.message);
      console.error("Token snippet:", token.substring(0, 20) + "...");
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Token', details: adminError.message }, { status: 401 });
    }

    if (!adminData.user) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
    }

    // 3. CHECK ADMIN TABLE
    const { data: isAdminCheck, error: roleError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', adminData.user.id)
      .maybeSingle();

    if (roleError) {
      console.error("DB Error checking admin:", roleError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!isAdminCheck) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 4. GET TARGET CLIENT DETAILS
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(clientId);

    if (userError || !targetUser.user) {
      return NextResponse.json({ error: 'Target Client not found' }, { status: 404 });
    }

    // 5. GENERATE TOKENS
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

    const accessToken = linkData.properties?.access_token;
    const refreshToken = linkData.properties?.refresh_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
    }

    // 6. RETURN SUCCESS
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: targetUser.user
    });

  } catch (error: any) {
    console.error("API Critical Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
