import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role Key se client banayenge (Admin Power)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();

    // Asli Auth System me password update karein
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
