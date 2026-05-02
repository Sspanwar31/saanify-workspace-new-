import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    // 1. Get client email
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Generate magic link
    const { data, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: client.email,
      });

    if (linkError) throw linkError;

    return NextResponse.json({
      success: true,
      url: data.properties.action_link,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
