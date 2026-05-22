import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for Buffer

// ✅ CORS HEADERS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 🔐 Helper to decode Base64 Service Role Key
const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  console.log("🔍 DEBUG: Checking for SUPABASE_SERVICE_ROLE_KEY_B64...");
  
  if (!b64) {
    console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY_B64 is missing in Vercel Env!");
    return null;
  }

  try {
    // Decode Base64 to String
    const decoded = Buffer.from(b64, 'base64').toString('utf-8').trim();
    
    // Safety Check: Service Role keys usually start with 'ey...'
    if (!decoded.startsWith('ey')) {
       console.warn("⚠️ WARNING: Decoded key does not start with 'ey...'. It might be invalid.");
    }
    
    console.log("✅ Key Decoded Successfully (First 10 chars):", decoded.substring(0, 10) + "...");
    return decoded;
  } catch (e) {
    console.error("❌ Key Decoding Failed:", e);
    return null;
  }
};

// ✅ Handle Preflight Requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    console.log("🚀 API HIT: /api/admin/create-client");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = getServiceRoleKey();

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing URL or Key" },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    const { name, email, password, society_name, phone, plan } = body;

    // Validate Input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, Email and Password are required" },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // 1. Create Auth User (Email Auto-Confirmed)
    console.log(`⏳ Creating Auth User for email: ${email}`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, society_name, role: 'client' }
    });

    if (authError) {
      console.error("❌ Auth Create Error:", authError.message);
      return NextResponse.json(
        { error: "Auth Error: " + authError.message },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    if (!authData.user) {
      console.error("❌ User object missing after signup");
      return NextResponse.json(
        { error: "User creation failed internally" },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }

    console.log("✅ Auth User Created. ID:", authData.user.id);

    // 2. Insert into Clients Table
    console.log("⏳ Inserting into Database...");
    
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .insert([{
        id: authData.user.id,
        name,
        email,
        society_name: society_name || '',
        phone: phone || '',
        
        // ✅ FIX IS HERE:
        plan: plan || 'TRIAL',  // System Code (TRIAL)
        plan_name: (plan === 'TRIAL' || !plan) ? 'Trial Plan' : plan, // Display Name (Trial Plan) - NOT 'Free'
        
        // ... (Baaki sab same rahega) ...
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        role: 'client'
      }]); 

    if (dbError) {
       console.error("❌ DB Insert Error:", dbError.message);
       
       // Rollback: Delete auth user if DB insert fails
       console.log("🔄 Rolling back Auth User...");
       await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
       
       return NextResponse.json(
         { error: "Database Error: " + dbError.message },
         {
           status: 500,
           headers: corsHeaders
         }
       );
    }

    console.log("🎉 SUCCESS: Client Created!");
    return NextResponse.json(
      { success: true, userId: authData.user.id },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("🔥 UNHANDLED API ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
