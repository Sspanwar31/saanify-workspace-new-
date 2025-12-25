import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 500 });
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      BEGIN;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- 1. FIX ADMINS TABLE
      CREATE TABLE IF NOT EXISTS admins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL
      );
      -- Add columns if they are missing (Self-Healing)
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Admin';
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ADMIN';
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      -- 2. FIX SYSTEM SETTINGS
      CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY DEFAULT 1
      );
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_username TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_repo TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_token TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main';
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT FALSE;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS trial_days INT DEFAULT 15;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS max_users_basic INT DEFAULT 25;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS max_users_pro INT DEFAULT 100;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT TRUE;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_notify BOOLEAN DEFAULT TRUE;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      -- 3. FIX CLIENTS TABLE
      CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL
      );
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS society_name TEXT;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'BASIC';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      -- 4. MEMBERS TABLE (Linked to Client)
      CREATE TABLE IF NOT EXISTS members (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          name TEXT NOT NULL,
          father_name TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          join_date DATE DEFAULT CURRENT_DATE,
          status TEXT DEFAULT 'active',
          total_deposits NUMERIC DEFAULT 0
      );

      -- Add auth_user_id column to existing members table if not exists
      ALTER TABLE members ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

      -- RLS Policy for Members
      ALTER TABLE members ENABLE ROW LEVEL SECURITY;

      -- Drop existing policy if it exists
      DROP POLICY IF EXISTS "Client Manage Members" ON members;

      -- Allow Clients to Select, Update, Delete their own members
      CREATE POLICY "Client Select Members" ON members FOR SELECT USING (client_id = auth.uid());
      CREATE POLICY "Client Update Members" ON members FOR UPDATE USING (client_id = auth.uid());
      CREATE POLICY "Client Delete Members" ON members FOR DELETE USING (client_id = auth.uid());

      -- Allow Clients to Insert (WITH CHECK ensures they mark it as their own)
      CREATE POLICY "Client Insert Members" ON members FOR INSERT WITH CHECK (client_id = auth.uid());

      -- 6. TRANSACTIONS TABLE (Passbook)
      CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          member_id UUID REFERENCES members(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          date DATE DEFAULT CURRENT_DATE,
          amount NUMERIC NOT NULL,
          type TEXT NOT NULL, -- deposit, loan, interest, withdrawal
          payment_mode TEXT DEFAULT 'CASH', -- CASH, BANK, UPI
          description TEXT,
          balance NUMERIC DEFAULT 0 -- Running balance snapshot
      );

      -- RLS for Transactions
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Client Manage Transactions" ON transactions FOR ALL USING (client_id = auth.uid());

      -- 8. LOANS TABLE
      CREATE TABLE IF NOT EXISTS loans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          member_id UUID REFERENCES members(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          amount NUMERIC NOT NULL,
          interest_rate NUMERIC DEFAULT 2,
          duration_months INT DEFAULT 12,
          status TEXT DEFAULT 'pending', -- pending, active, completed, rejected
          remaining_balance NUMERIC DEFAULT 0,
          start_date DATE,
          end_date DATE
      );

      -- RLS for Loans
      ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Client Manage Loans" ON loans;
      CREATE POLICY "Client Manage Loans" ON loans FOR ALL USING (client_id = auth.uid());

      -- 7. AUTOMATION LOGS TABLE
      CREATE TABLE IF NOT EXISTS system_tasks (
          task_key TEXT PRIMARY KEY, -- e.g., 'schema_sync', 'email_welcome'
          label TEXT,
          last_run TIMESTAMP WITH TIME ZONE,
          status TEXT, -- 'SUCCESS', 'FAILED', 'PENDING'
          meta JSONB -- Store counts like { sent: 24, pending: 0 }
      );

      -- 5. SEED DATA
      INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
      
      -- 1. System Tasks
      INSERT INTO system_tasks (task_key, label, status, meta) VALUES
      ('schema_sync', 'Schema Sync', 'SUCCESS', '{}'),
      ('backup', 'Database Backup', 'PENDING', '{}'),
      ('restore', 'Database Restore', 'PENDING', '{}'),
      ('auto_sync', 'Auto Data Sync', 'PENDING', '{}'),
      ('health', 'System Health', 'SUCCESS', '{"latency": "0ms"}')
      ON CONFLICT (task_key) DO NOTHING;

      -- 2. Email Workflows
      INSERT INTO system_tasks (task_key, label, status, meta) VALUES
      ('email_welcome', 'Welcome Email', 'ACTIVE', '{"sent": 0, "pending": 0}'),
      ('email_expiry', 'Trial Expiry Warning', 'ACTIVE', '{"sent": 0, "pending": 0}'),
      ('email_fail', 'Payment Failed Alert', 'ACTIVE', '{"sent": 0, "pending": 0}'),
      ('email_renew', 'Renewal Reminder', 'ACTIVE', '{"sent": 0, "pending": 0}')
      ON CONFLICT (task_key) DO NOTHING;

      -- 3. Push Notifications
      INSERT INTO system_tasks (task_key, label, status, meta) VALUES
      ('push_signup', 'New Client Signup', 'ACTIVE', '{"last_run": null}'),
      ('push_renew', 'Subscription Renewed', 'ACTIVE', '{"last_run": null}'),
      ('push_fail', 'Payment Failed', 'ACTIVE', '{"last_run": null}'),
      ('push_maint', 'System Maintenance', 'ACTIVE', '{"last_run": null}')
      ON CONFLICT (task_key) DO NOTHING;
      
      -- Insert Default Admin (This will now succeed because columns exist)
      INSERT INTO admins (email, password, name, role, status)
      VALUES ('admin@saanify.com', 'admin123', 'Super Admin', 'ADMIN', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING;

      COMMIT;
    `);

    await client.end();
    return NextResponse.json({ success: true, message: "Database Repaired & Initialized!" });

  } catch (error: any) {
    console.error("DB Setup Error:", error);
    if (client) await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}