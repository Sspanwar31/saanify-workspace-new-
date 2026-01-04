import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC ---
// Hum aapke specific variable name (B64) ko target kar rahe hain
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  if (!rawKey) {
    // Agar B64 wala nahi mila, to fallback check (Safety ke liye)
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // Agar key 'eyJ' se start nahi hoti, iska matlab wo Base64 Encoded hai
  // Hum use wapas Original String me badal denge
  if (!rawKey.startsWith('eyJ')) {
    try {
      return Buffer.from(rawKey, 'base64').toString('utf-8');
    } catch (e) {
      console.error("Key decoding failed, using raw value");
      return rawKey;
    }
  }

  // Agar already sahi format me hai
  return rawKey;
};

// Admin Power Client banana
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()! // <--- Ab ye sahi key use karega
);

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
        return NextResponse.json({ error: "Missing details" }, { status: 400 });
    }

    console.log("Updating password for:", userId);

    // Asli Auth System me password update karein
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
        console.error("Supabase Auth Error:", error);
        throw error;
    }

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
