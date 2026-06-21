import { NextResponse } from 'next/server';
import { Client } from 'pg';
import CryptoJS from 'crypto-js';

// --- SECURITY: ENCRYPTION KEY ---
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_SECRET_KEY;
  if (!key) {
    console.error("CRITICAL: ENCRYPTION_SECRET_KEY is NOT SET!");
    throw new Error("Server Misconfiguration: Encryption key missing.");
  }
  return key;
};

// --- ENCRYPTION/DECRYPTION FUNCTIONS ---
const encryptToken = (token: string): string => {
  if (!token || token === "••••••••••••") return token;
  return CryptoJS.AES.encrypt(token, getEncryptionKey()).toString();
};

const decryptToken = (encryptedToken: string): string => {
  if (!encryptedToken || encryptedToken.startsWith("••••")) return encryptedToken;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, getEncryptionKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      console.warn("Token decryption returned empty - possibly not encrypted");
      return encryptedToken; // Return as-is if not actually encrypted
    }
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e);
    return "";
  }
};

// ✅ NEW: Proper boolean converter
const toBoolean = (value: any, defaultValue: boolean): boolean => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value === 1;
  return defaultValue;
};

// ✅ NEW: Proper date converter
const toPostgresTimestamp = (value: any): string | null => {
  if (!value) return null;
  if (value === '' || value === 'null' || value === 'undefined') return null;
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date value:", value);
      return null;
    }
    // PostgreSQL compatible ISO format
    return date.toISOString();
  } catch (e) {
    console.warn("Date parse error:", e);
    return null;
  }
};

// Helper: Get DB Client
const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
};

export async function GET() {
  let client;
  try {
    client = await getDbClient();
    if (!client) return NextResponse.json({ github_branch: 'main' });

    const result = await client.query('SELECT * FROM system_settings WHERE id = 1');
    const data = result.rows[0] || {};
    
    // SECURITY: Decrypt token then Mask for UI
    if (data.github_token) {
        data.github_token = decryptToken(data.github_token);
        data.github_token = "••••••••••••";
    }

    // ✅ Log maintenance mode status for debugging
    console.log("⚙️ Maintenance Mode Status:", {
      is_maintenance_mode: data.is_maintenance_mode,
      is_maintenance_scheduled: data.is_maintenance_scheduled,
      maintenance_start: data.maintenance_start,
      maintenance_end: data.maintenance_end
    });

    await client.end();
    return NextResponse.json(data);

  } catch (error: any) {
    if (client) await client.end();
    console.error("Settings GET Error:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    
    // ✅ Debug log - kya data aa raha hai
    console.log("📝 Incoming Settings Data:", {
      is_maintenance_mode: body.is_maintenance_mode,
      is_maintenance_scheduled: body.is_maintenance_scheduled,
      maintenance_start: body.maintenance_start,
      maintenance_end: body.maintenance_end,
      type_maintenance_mode: typeof body.is_maintenance_mode
    });

    client = await getDbClient();
    if (!client) return NextResponse.json({ success: true, message: "Preview Mode: Simulated Save" });

    // 1. Handle Token Logic
    let tokenValue = body.github_token;
    if (tokenValue === "••••••••••••") {
        const existing = await client.query('SELECT github_token FROM system_settings WHERE id = 1');
        tokenValue = existing.rows[0]?.github_token;
        // ✅ Check if already encrypted (don't double encrypt)
        if (tokenValue && !tokenValue.startsWith("U2FsdGVk")) {
          tokenValue = encryptToken(tokenValue);
        }
    } else if (tokenValue) {
      tokenValue = encryptToken(tokenValue);
    }

    // 2. SQL Upsert with maintenance fields
    const query = `
      INSERT INTO system_settings (
        id, 
        github_username, github_repo, github_token, github_branch,
        is_maintenance_mode, trial_days, max_users_basic, max_users_pro,
        auto_renewal, email_notify, updated_at,
        maintenance_title, maintenance_msg, maintenance_start, 
        maintenance_end, is_maintenance_scheduled
      )
      VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(),
        $11, $12, $13, $14, $15
      )
      ON CONFLICT (id) DO UPDATE SET
        github_username = EXCLUDED.github_username,
        github_repo = EXCLUDED.github_repo,
        github_token = EXCLUDED.github_token,
        github_branch = EXCLUDED.github_branch,
        is_maintenance_mode = EXCLUDED.is_maintenance_mode,
        trial_days = EXCLUDED.trial_days,
        max_users_basic = EXCLUDED.max_users_basic,
        max_users_pro = EXCLUDED.max_users_pro,
        auto_renewal = EXCLUDED.auto_renewal,
        email_notify = EXCLUDED.email_notify,
        updated_at = NOW(),
        maintenance_title = EXCLUDED.maintenance_title,
        maintenance_msg = EXCLUDED.maintenance_msg,
        maintenance_start = EXCLUDED.maintenance_start,
        maintenance_end = EXCLUDED.maintenance_end,
        is_maintenance_scheduled = EXCLUDED.is_maintenance_scheduled
      RETURNING *;
    `;

    // 3. ✅ FIXED: Map values with proper type conversion
    const values = [
      body.github_username || null,
      body.github_repo || null,
      tokenValue || null,
      body.github_branch || 'main',
      
      // ✅ FIXED: Proper boolean conversion
      toBoolean(body.is_maintenance_mode, false),
      
      parseInt(body.trial_days) || 10,
      parseInt(body.max_users_basic) || 200,
      parseInt(body.max_users_pro) || 500,
      
      // ✅ FIXED: Proper boolean conversion
      toBoolean(body.auto_renewal, true),
      toBoolean(body.email_notify, true),
      
      // ✅ FIXED: Maintenance fields with proper conversion
      body.maintenance_title || 'Saanify Maintenance Mode',
      body.maintenance_msg || 'We are currently upgrading our systems...',
      
      // ✅ FIXED: Proper date conversion
      toPostgresTimestamp(body.maintenance_start),
      toPostgresTimestamp(body.maintenance_end),
      
      // ✅ FIXED: Proper boolean conversion
      toBoolean(body.is_maintenance_scheduled, false)
    ];

    console.log("📋 SQL Values:", values);

    const result = await client.query(query, values);
    
    // ✅ Verify what was saved
    console.log("✅ Saved Successfully:", {
      is_maintenance_mode: result.rows[0]?.is_maintenance_mode,
      is_maintenance_scheduled: result.rows[0]?.is_maintenance_scheduled
    });

    await client.end();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Settings Save Error:", error.message);
    console.error("❌ Full Error:", error);
    if (client) await client.end();
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
