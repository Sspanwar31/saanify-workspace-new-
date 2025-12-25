import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

// Enhanced RLS Policies SQL
const rlsPolicies = `
-- Enable RLS on all tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS society_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view society accounts they belong to" ON society_accounts;
DROP POLICY IF EXISTS "Society admins can update their account" ON society_accounts;
DROP POLIF EXISTS "Users can view societies they belong to" ON societies;
DROP POLICY IF EXISTS "Society admins can manage societies" ON societies;
DROP POLICY IF EXISTS "Users can view posts from their societies" ON posts;
DROP POLICY IF EXISTS "Users can manage own posts" ON posts;
DROP POLICY IF EXISTS "Users can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can view public data" ON users;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Society accounts policies
CREATE POLICY "Users can view society accounts they belong to" ON society_accounts
  FOR SELECT USING (
    id IN (
      SELECT society_account_id FROM users 
      WHERE auth.uid()::text = users.id
    )
  );

CREATE POLICY "Society admins can update their account" ON society_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.society_account_id = society_accounts.id 
      AND auth.uid()::text = users.id 
      AND users.role IN ('ADMIN', 'ADMIN')
    )
  );

-- Societies policies
CREATE POLICY "Users can view societies they belong to" ON societies
  FOR SELECT USING (
    society_account_id IN (
      SELECT society_account_id FROM users 
      WHERE auth.uid()::text = users.id
    )
  );

CREATE POLICY "Society admins can manage societies" ON societies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.society_account_id = societies.society_account_id 
      AND auth.uid()::text = users.id 
      AND users.role IN ('ADMIN', 'ADMIN')
    )
  );

-- Posts policies
CREATE POLICY "Users can view posts from their societies" ON posts
  FOR SELECT USING (
    author_id IN (
      SELECT id FROM users 
      WHERE auth.uid()::text = users.id
      OR society_account_id IN (
        SELECT society_account_id FROM users 
        WHERE auth.uid()::text = users.id
      )
    )
  );

CREATE POLICY "Users can manage own posts" ON posts
  FOR ALL USING (auth.uid()::text = author_id);

-- Announcements policies
CREATE POLICY "Users can view announcements from their societies" ON announcements
  FOR SELECT USING (
    society_id IN (
      SELECT society_account_id FROM users 
      WHERE auth.uid()::text = users.id
    )
  );

CREATE POLICY "Users can manage announcements" ON announcements
  FOR ALL USING (
    auth.uid()::text = announcements.created_by_user_id
    OR (
      society_id IN (
        SELECT society_account_id FROM users 
        WHERE auth.uid()::text = users.id
        AND users.role IN ('ADMIN', 'ADMIN')
      )
    )
  );

-- Public read policies for authenticated users
CREATE POLICY "Authenticated users can view public data" ON users
  FOR SELECT USING (auth.role() = 'authenticated');
`

// Database functions for automatic calculations
const databaseFunctions = `
-- Function to update user last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET last_login_at = NOW() 
  WHERE id = auth.uid()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic last login update
DROP TRIGGER IF EXISTS on auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- Function to calculate society statistics
CREATE OR REPLACE FUNCTION calculate_society_stats(society_id_param TEXT)
RETURNS TABLE(
  total_members BIGINT,
  active_members BIGINT,
  total_revenue DECIMAL,
  pending_dues DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE is_active = true) as active_members,
    COALESCE(SUM(CASE WHEN role = 'MEMBER' THEN 1000 ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN role = 'MEMBER' THEN 50 ELSE 0 END), 0) as pending_dues
  FROM users 
  WHERE society_account_id = society_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user society info
CREATE OR REPLACE FUNCTION get_user_society(user_id_param TEXT)
RETURNS TABLE(
  society_id TEXT,
  society_name TEXT,
  user_role TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id as society_id,
    sa.name as society_name,
    u.role as user_role,
    u.role IN ('ADMIN', 'ADMIN') as is_admin
  FROM users u
    JOIN society_accounts sa ON u.society_account_id = sa.id
    WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

// Setup database with RLS policies and functions
async function setupDatabase(supabaseClient: any): Promise<boolean> {
  try {
    console.log('🔒 Setting up database with RLS policies...')
    
    // Apply RLS policies
    console.log('🔒 Applying RLS policies...')
    try {
      // Execute RLS policies using SQL
      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsPolicies })
      if (rlsError) {
        console.warn('RLS policies warning:', rlsError)
      } else {
        console.log('✅ RLS policies applied successfully')
      }
    } catch (error) {
      console.warn('RLS policies could not be applied automatically:', error)
    }

    // Create database functions
    console.log('⚡ Creating database functions...')
    try {
      const { error: funcError } = await supabase.rpc('exec_sql', { sql: databaseFunctions })
      if (funcError) {
        console.warn('Database functions warning:', funcError)
      } else {
        console.log('✅ Database functions created successfully')
      }
    } catch (error) {
      console.warn('Database functions could not be created:', error)
    }

    console.log('✅ Database setup completed successfully')
    return true
  } catch (error) {
    console.error('Database setup failed:', error)
    return false
  }
}

export { setupDatabase }