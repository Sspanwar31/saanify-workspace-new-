import { supabaseAdmin } from './supabase-service'; 
import { Pool } from 'pg';

export async function repairSystemSettingsTable() {
  console.log('🔧 Starting system_settings table repair...');
  
  try {
    // SQL to ensure the table and columns exist
    const repairSQL = `
      -- Create table if it doesn't exist
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY DEFAULT 1
      );
      
      -- Add columns if they don't exist
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_username TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_repo TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_token TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main';
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS last_backup TIMESTAMP;
      
      -- Ensure default row exists
      INSERT INTO system_settings (id, github_branch) 
      VALUES (1, 'main') 
      ON CONFLICT (id) DO NOTHING;
      
      -- Set default branch if null
      UPDATE system_settings 
      SET github_branch = 'main' 
      WHERE github_branch IS NULL;
    `;

    // Execute the repair SQL using Supabase RPC
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: repairSQL });

    if (error) {
      console.error('❌ Error executing repair SQL:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative repair approach...');
      
      // Create the table using raw SQL through Supabase's SQL editor
      const { error: tableError } = await supabaseAdmin
        .from('system_settings')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist, we need to create it
        console.log('📋 Creating system_settings table...');
        
        // Use the setup-db API to create the table
        const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/setup-db`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_system_settings'
          })
        });

        if (!setupResponse.ok) {
          throw new Error(`Failed to create system_settings table: ${setupResponse.statusText}`);
        }
      }

      // Now try to insert default row
      const { error: insertError } = await supabaseAdmin
        .from('system_settings')
        .upsert({
          id: 1,
          github_username: '',
          github_repo: '',
          github_token: '',
          github_branch: 'main'
        }, {
          onConflict: 'id'
        });

      if (insertError) {
        console.error('❌ Error inserting default row:', insertError);
        throw insertError;
      }
    }

    console.log('✅ System settings table repaired successfully');
    
    // Verify the table structure
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying table:', verifyError);
      throw verifyError;
    }

    console.log('✅ Verification successful:', verifyData);
    
    return {
      success: true,
      message: 'System settings table repaired successfully',
      data: verifyData
    };

  } catch (error) {
    console.error('💥 Database repair failed:', error);
    throw error;
  }
}

// Alternative approach using direct PostgreSQL connection if available
export async function repairWithDirectConnection() {
  console.log('🔧 Trying direct PostgreSQL connection...');
  
  const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!pgUrl) {
    throw new Error('No PostgreSQL connection string available');
  }

  const pool = new Pool({
    connectionString: pgUrl,
  });

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY DEFAULT 1
        )
      `);
      
      // Add columns if not exist
      const columns = [
        'github_username TEXT',
        'github_repo TEXT', 
        'github_token TEXT',
        'github_branch TEXT DEFAULT \'main\'',
        'last_backup TIMESTAMP'
      ];
      
      for (const column of columns) {
        try {
          await client.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS ${column}`);
        } catch (err) {
          console.log(`⚠️ Column may already exist: ${column}`);
        }
      }
      
      // Insert default row
      await client.query(`
        INSERT INTO system_settings (id, github_branch) 
        VALUES (1, 'main') 
        ON CONFLICT (id) DO NOTHING
      `);
      
      await client.query('COMMIT');
      
      console.log('✅ Direct PostgreSQL repair successful');
      
      return {
        success: true,
        message: 'System settings table repaired using direct PostgreSQL connection'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } finally {
    await pool.end();
  }
}

// Main repair function that tries both approaches
export async function runDatabaseRepair() {
  console.log('🚀 Starting database repair process...');
  
  try {
    // Try Supabase approach first
    return await repairSystemSettingsTable();
  } catch (supabaseError) {
    console.log('❌ Supabase repair failed, trying direct connection...');
    
    try {
      return await repairWithDirectConnection();
    } catch (directError) {
      console.error('💥 Both repair approaches failed');
      throw new Error(`Database repair failed. Supabase error: ${supabaseError.message}. Direct connection error: ${directError.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  runDatabaseRepair()
    .then((result) => {
      console.log('🎉 Repair completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Repair failed:', error);
      process.exit(1);
    });
}
