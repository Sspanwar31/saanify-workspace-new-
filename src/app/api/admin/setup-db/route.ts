import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const runtime = 'nodejs';

export async function POST() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL is missing in Vercel." }, { status: 500 });
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

      -- 1. SYSTEM TABLES
      CREATE TABLE IF NOT EXISTS admins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          name TEXT,
          role TEXT DEFAULT 'ADMIN',
          status TEXT DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY DEFAULT 1,
          github_username TEXT,
          github_repo TEXT,
          github_token TEXT,
          github_branch TEXT DEFAULT 'main',
          is_maintenance_mode BOOLEAN DEFAULT FALSE,
          trial_days INT DEFAULT 15,
          max_users_basic INT DEFAULT 25,
          max_users_pro INT DEFAULT 100,
          auto_renewal BOOLEAN DEFAULT TRUE,
          email_notify BOOLEAN DEFAULT TRUE,
          CONSTRAINT single_row CHECK (id = 1)
      );
      INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS system_tasks (
          task_key TEXT PRIMARY KEY,
          label TEXT,
          last_run TIMESTAMP WITH TIME ZONE,
          status TEXT,
          meta JSONB
      );

      -- 2. CLIENTS & MEMBERS
      CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          society_name TEXT,
          phone TEXT,
          password TEXT,
          plan TEXT DEFAULT 'BASIC',
          status TEXT DEFAULT 'ACTIVE',
          is_lifetime BOOLEAN DEFAULT FALSE,
          subscription_expiry TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS members (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          auth_user_id UUID,
          name TEXT NOT NULL,
          father_name TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          join_date DATE DEFAULT CURRENT_DATE,
          status TEXT DEFAULT 'active',
          total_deposits NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 3. FINANCIAL TABLES (Passbook & Loans)
      CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          member_id UUID REFERENCES members(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          date DATE DEFAULT CURRENT_DATE,
          amount NUMERIC NOT NULL,
          type TEXT NOT NULL, -- deposit, loan, interest, withdrawal
          payment_mode TEXT DEFAULT 'CASH',
          description TEXT,
          balance NUMERIC DEFAULT 0
      );

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

      -- 4. RLS & POLICIES (Safe Re-creation)
      
      -- Enable RLS
      ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
      ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to prevent conflicts
      DROP POLICY IF EXISTS "Allow All" ON admins;
      DROP POLICY IF EXISTS "Public Read Settings" ON system_settings;
      DROP POLICY IF EXISTS "Client Manage Members" ON members;
      DROP POLICY IF EXISTS "Client Manage Transactions" ON transactions;
      DROP POLICY IF EXISTS "Client Manage Loans" ON loans;

      -- Create Policies
      CREATE POLICY "Allow All" ON admins FOR ALL USING (true);
      CREATE POLICY "Public Read Settings" ON system_settings FOR SELECT USING (true);
      CREATE POLICY "Client Manage Members" ON members FOR ALL USING (client_id = auth.uid());
      CREATE POLICY "Client Manage Transactions" ON transactions FOR ALL USING (client_id = auth.uid());
      CREATE POLICY "Client Manage Loans" ON loans FOR ALL USING (client_id = auth.uid());

      COMMIT;
    `);

    await client.end();

    return NextResponse.json({ success: true, message: "Database Tables Created & Repaired!" });

  } catch (error: any) {
    console.error("DB Setup Error:", error);
    if (client) await client.end();
    // Return actual error message for debugging
    return NextResponse.json({ error: "SQL Error: " + error.message }, { status: 500 });
  }
}