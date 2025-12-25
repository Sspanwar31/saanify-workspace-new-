import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import SupabaseService from '@/lib/supabase-service'

// SQL statements to create required tables in Supabase
const SUPABASE_TABLES_SETUP = [
  {
    name: 'automation_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS automation_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        task_name TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms INTEGER,
        details TEXT,
        error TEXT,
        run_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_automation_logs_task_name ON automation_logs(task_name);
      CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
      CREATE INDEX IF NOT EXISTS idx_automation_logs_run_time ON automation_logs(run_time);
      
      -- Enable Row Level Security
      ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
      
      -- Policy to allow service role full access
      CREATE POLICY "Service role full access" ON automation_logs
        FOR ALL USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    `
  },
  {
    name: 'users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'CLIENT',
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP WITH TIME ZONE,
        society_account_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_society_account_id ON users(society_account_id);
      
      -- Enable RLS
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      
      -- Policies
      CREATE POLICY "Service role full access" ON users
        FOR ALL USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
        
      CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid()::text = id);
    `
  },
  {
    name: 'society_accounts',
    sql: `
      CREATE TABLE IF NOT EXISTS society_accounts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        admin_name TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        subscription_plan TEXT DEFAULT 'TRIAL',
        status TEXT DEFAULT 'TRIAL',
        trial_ends_at TIMESTAMP WITH TIME ZONE,
        subscription_ends_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_society_accounts_email ON society_accounts(email);
      CREATE INDEX IF NOT EXISTS idx_society_accounts_status ON society_accounts(status);
      
      -- Enable RLS
      ALTER TABLE society_accounts ENABLE ROW LEVEL SECURITY;
      
      -- Policies
      CREATE POLICY "Service role full access" ON society_accounts
        FOR ALL USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    `
  },
  {
    name: 'societies',
    sql: `
      CREATE TABLE IF NOT EXISTS societies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        society_account_id UUID NOT NULL REFERENCES society_accounts(id) ON DELETE CASCADE,
        created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_societies_society_account_id ON societies(society_account_id);
      CREATE INDEX IF NOT EXISTS idx_societies_created_by_user_id ON societies(created_by_user_id);
      
      -- Enable RLS
      ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
      
      -- Policies
      CREATE POLICY "Service role full access" ON societies
        FOR ALL USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    `
  },
  {
    name: 'clients',
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        society_name TEXT,
        society_account_id UUID REFERENCES society_accounts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_clients_society_account_id ON clients(society_account_id);
      
      -- Enable RLS
      ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
      
      -- Policies
      CREATE POLICY "Service role full access" ON clients
        FOR ALL USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    `
  },
  {
    name: 'posts',
    sql: `
      CREATE TABLE IF NOT EXISTS posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT false,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
      
      -- Enable RLS
      ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
      
      -- Policies
      CREATE POLICY "Service role full access" ON posts
        FOR ALL USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
        
      CREATE POLICY "Authors can manage own posts" ON posts
        FOR ALL USING (auth.uid()::text = author_id);
    `
  }
]

// Storage bucket setup
const STORAGE_BUCKETS_SETUP = [
  {
    name: 'automated-backups',
    public: false,
    description: 'Storage for automated backups and security reports'
  }
]

export const POST = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    const supabaseService = SupabaseService.getInstance()
    const client = await supabaseService.getClient()

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client. Please check your secrets configuration.'
      }, { status: 500 })
    }

    const results = []
    const errors = []

    // Create tables
    for (const table of SUPABASE_TABLES_SETUP) {
      try {
        console.log(`Creating table: ${table.name}`)
        
        // Try to execute SQL directly (this might not work with standard Supabase client)
        // So we'll use a workaround approach
        const { error: tableError } = await client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', table.name)
          .eq('table_schema', 'public')
          .single()

        if (tableError && tableError.code === 'PGRST116') {
          // Table doesn't exist, we need to create it
          console.log(`Table ${table.name} does not exist. Please create it manually using SQL:`)
          console.log(table.sql)
          
          results.push({
            type: 'table',
            name: table.name,
            status: 'needs_manual_creation',
            message: 'SQL provided for manual execution'
          })
        } else if (!tableError) {
          // Table exists
          results.push({
            type: 'table',
            name: table.name,
            status: 'exists',
            message: 'Table already exists'
          })
        } else {
          errors.push({
            type: 'table',
            name: table.name,
            error: tableError.message
          })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          type: 'table',
          name: table.name,
          error: errorMsg
        })
      }
    }

    // Create storage buckets
    for (const bucket of STORAGE_BUCKETS_SETUP) {
      try {
        console.log(`Creating storage bucket: ${bucket.name}`)
        
        const { error: bucketError } = await client.storage.createBucket(bucket.name, {
          public: bucket.public,
          description: bucket.description
        })

        if (bucketError) {
          if (bucketError.message.includes('already exists')) {
            results.push({
              type: 'bucket',
              name: bucket.name,
              status: 'exists',
              message: 'Storage bucket already exists'
            })
          } else {
            errors.push({
              type: 'bucket',
              name: bucket.name,
              error: bucketError.message
            })
          }
        } else {
          results.push({
            type: 'bucket',
            name: bucket.name,
            status: 'created',
            message: 'Storage bucket created successfully'
          })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          type: 'bucket',
          name: bucket.name,
          error: errorMsg
        })
      }
    }

    // Generate SQL script for manual execution
    const sqlScript = SUPABASE_TABLES_SETUP.map(table => 
      `-- ${table.name}\n${table.sql}\n`
    ).join('\n')

    return NextResponse.json({
      success: true,
      message: 'Supabase setup analysis completed',
      results,
      errors: errors.length > 0 ? errors : undefined,
      sql_script: sqlScript,
      instructions: {
        title: 'Manual Setup Required',
        steps: [
          '1. Go to your Supabase project dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL script provided below',
          '4. Execute the script to create all required tables',
          '5. Verify tables were created in the Table Editor',
          '6. Run automation tasks to test the setup'
        ],
        note: 'Some tables may already exist. The SQL script uses CREATE TABLE IF NOT EXISTS to avoid conflicts.'
      }
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Supabase setup error:', error)
    
    return NextResponse.json({
      success: false,
      error: errorMsg,
      message: 'Failed to setup Supabase tables'
    }, { status: 500 })
  }
})

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    const supabaseService = SupabaseService.getInstance()
    const client = await supabaseService.getClient()

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client'
      }, { status: 500 })
    }

    // Check existing tables
    const { data: existingTables, error: tablesError } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: tablesError.message
      }, { status: 500 })
    }

    // Check existing buckets
    const { data: existingBuckets, error: bucketsError } = await client.storage.listBuckets()

    if (bucketsError) {
      console.warn('Could not check storage buckets:', bucketsError.message)
    }

    const requiredTables = SUPABASE_TABLES_SETUP.map(t => t.name)
    const requiredBuckets = STORAGE_BUCKETS_SETUP.map(b => b.name)
    
    const existingTableNames = existingTables?.map(t => t.table_name) || []
    const existingBucketNames = existingBuckets?.map(b => b.name) || []

    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table))
    const missingBuckets = requiredBuckets.filter(bucket => !existingBucketNames.includes(bucket))

    return NextResponse.json({
      success: true,
      status: {
        tables: {
          required: requiredTables,
          existing: existingTableNames,
          missing: missingTables,
          complete: missingTables.length === 0
        },
        buckets: {
          required: requiredBuckets,
          existing: existingBucketNames,
          missing: missingBuckets,
          complete: missingBuckets.length === 0
        }
      },
      setup_complete: missingTables.length === 0 && missingBuckets.length === 0
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 })
  }
})