import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('🔧 Database Repair API called');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to create the system_settings table and insert default data using upsert
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1,
        github_username: '',
        github_repo: '',
        github_token: '',
        github_branch: 'main'
      }, {
        onConflict: 'id'
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error repairing database:', error);
      
      // If table doesn't exist, we need to create it via SQL
      if (error.code === 'PGRST116') {
        console.log('🔧 Table does not exist, calling setup-db...');
        
        // Call the setup-db API to create the table
        const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/setup-db`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!setupResponse.ok) {
          const setupError = await setupResponse.text();
          throw new Error(`Failed to create database tables: ${setupError}`);
        }

        // Retry the upsert after table creation
        const { data: retryData, error: retryError } = await supabase
          .from('system_settings')
          .upsert({
            id: 1,
            github_username: '',
            github_repo: '',
            github_token: '',
            github_branch: 'main'
          }, {
            onConflict: 'id'
          })
          .select('*')
          .single();
          
        if (retryError) {
          throw new Error(`Failed to insert default settings after table creation: ${retryError.message}`);
        }

        console.log('✅ Database repair completed successfully (table created)');
        return NextResponse.json({
          success: true,
          message: 'Database repair completed successfully (table created)',
          data: retryData
        });
      }
      
      throw new Error(`Failed to repair system_settings table: ${error.message}`);
    }

    console.log('✅ Database repair completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database repair completed successfully',
      data
    });
    
  } catch (error: any) {
    console.error('💥 Database repair failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Database repair failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}