import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // 1. Init Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Must use Service Role Key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`🗑️ Hard Deleting Client: ${userId}`);

    // 2. Delete from 'clients' table first (Data Cleanup)
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error("DB Delete Error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 3. Delete from Auth (Login Access Cleanup)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.warn("Auth Delete Warning (User might already be gone):", authError.message);
    }

    return NextResponse.json({ success: true, message: "Client Hard Deleted" });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
