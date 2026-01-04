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

    // --- CASE 1: EDIT EXISTING USER ---
    if (id) {
        // 1. Update Profile Data in Table
        const { error: dbError } = await supabaseAdmin
            .from('members')
            .update({ name, phone, role, status })
            .eq('id', id);

        if (dbError) throw dbError;

        // 2. Update Password/Email in Auth (Agar password diya hai tabhi)
        if (password && password.trim() !== "") {
            // Hume auth_user_id chahiye password badalne ke liye
            const { data: memberData } = await supabaseAdmin.from('members').select('auth_user_id').eq('id', id).single();
            
            if (memberData?.auth_user_id) {
                const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                    memberData.auth_user_id,
                    { password: password, email: email }
                );
                if (authError) throw authError;
            }
        }
        
        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } 
    
    // --- CASE 2: CREATE NEW USER ---
    else {
        if (!email || !password || !clientId) {
            return NextResponse.json({ error: 'Email, Password and Client ID required' }, { status: 400 });
        }

        // 1. Create Auth User (Login ID)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name, role }
        });

        if (authError) throw authError;

        // 2. Insert into Members Table
        const { error: dbError } = await supabaseAdmin
            .from('members')
            .insert([{
                client_id: clientId,
                auth_user_id: authData.user.id,
                name,
                email,
                phone,
                role, // 'member' or 'treasurer'
                status: 'active',
                join_date: new Date().toISOString()
            }]);

        if (dbError) {
            // Rollback: Delete Auth user if DB fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        return NextResponse.json({ success: true, message: 'User created successfully' });
    }

  } catch (error: any) {
    console.error("User Manage Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
