import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Power Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B64 
    ? Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY_B64, 'base64').toString('utf-8')
    : process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, password, name, phone, role, clientId, status } = body;

    if (!role || !['member', 'treasurer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // --- EDIT EXISTING USER ---
    if (id) {
      if (role === 'member') {
        const { error: dbError } = await supabaseAdmin
          .from('members')
          .update({ name, phone, status })
          .eq('id', id);
        if (dbError) throw dbError;
      } else if (role === 'treasurer') {
        const { error: dbError } = await supabaseAdmin
          .from('clients')
          .update({ name, phone, status })
          .eq('id', id);
        if (dbError) throw dbError;
      }

      if (password && password.trim() !== "") {
        const table = role === 'member' ? 'members' : 'clients';
        const { data: userData } = await supabaseAdmin.from(table).select('auth_user_id').eq('id', id).single();
        if (userData?.auth_user_id) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userData.auth_user_id,
            { password, email }
          );
          if (authError) throw authError;
        }
      }

      return NextResponse.json({ success: true, message: 'User updated successfully' });
    }

    // --- CREATE NEW USER ---
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and Password required' }, { status: 400 });
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });
    if (authError) throw authError;

    // 2. Insert into appropriate table
    if (role === 'member') {
      const { error: dbError } = await supabaseAdmin
        .from('members')
        .insert([{
          client_id: clientId,
          auth_user_id: authData.user.id,
          name,
          email,
          phone,
          role: 'member',
          status: 'active',
          join_date: new Date().toISOString()
        }]);
      if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }
    } else if (role === 'treasurer') {
      const { error: dbError } = await supabaseAdmin
        .from('clients')
        .insert([{
          id: authData.user.id,
          email,
          name,
          society_name: 'Default Society',
          phone,
          plan: 'BASIC',
          status: 'active',
          is_lifetime: false,
          subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          created_at: new Date().toISOString(),
          plan_name: 'Free',
          plan_start_date: new Date().toISOString(),
          plan_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          subscription_status: 'active',
          currency: 'INR',
          interest_rate: 12,
          loan_limit_percent: 80,
          fine_amount: 10,
          grace_period_day: 10,
          theme: 'light',
          auto_backup: true,
          email_notifications: true,
          sms_notifications: false,
          role_permissions: {
            treasurer: [
              "View Dashboard", "View Passbook", "View Loans", "View Members",
              "Manage Finance", "Manage Expenses", "Manage Passbook"
            ]
          },
          role: 'treasurer',
          client_id: clientId
        }]);
      if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }
    }

    return NextResponse.json({ success: true, message: 'User created successfully' });
    
  } catch (error: any) {
    console.error("User Manage Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
