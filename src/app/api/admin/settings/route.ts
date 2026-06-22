import { NextResponse } from 'next/server';
import { Pool } from 'pg'; // 🚀 Pool for better performance
import CryptoJS from 'crypto-js';

// 🚀 ZAROORI: Pool ko hamesha POST ke upar (GLOBAL) rakhein
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3, // Serverless ke liye chota pool
});

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
    // ✅ FIX: Agar decrypt empty aaye toh assume karo ye encrypted nahi tha
    if (!decrypted) {
      console.warn("Token decryption returned empty - possibly not encrypted");
      return encryptedToken; 
    }
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e);
    return "";
  }
};

// ✅ ROBUST: Proper boolean converter
const toBoolean = (value: any, defaultValue: boolean): boolean => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value === 1;
  return defaultValue;
};

// ✅ ROBUST: Proper date converter for PostgreSQL
const toPostgresTimestamp = (value: any): string | null => {
  if (!value) return null;
  if (value === '' || value === 'null' || value === 'undefined') return null;
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date value:", value);
      return null;
    }
    return date.toISOString();
  } catch (e) {
    console.warn("Date parse error:", e);
    return null;
  }
};

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM system_settings WHERE id = 1');
    const data = result.rows[0] || {};
    
    // SECURITY: Decrypt token then Mask for UI
    if (data.github_token) {
        data.github_token = decryptToken(data.github_token);
        data.github_token = "••••••••••••";
    }

    // ✅ Debug log for maintenance mode
    console.log("⚙️ Maintenance Mode Status:", {
      is_maintenance_mode: data.is_maintenance_mode,
      is_maintenance_scheduled: data.is_maintenance_scheduled,
      maintenance_start: data.maintenance_start,
      maintenance_end: data.maintenance_end
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ✅ Debug log - incoming data check
    console.log("📝 Incoming Settings Data:", {
      is_maintenance_mode: body.is_maintenance_mode,
      is_maintenance_scheduled: body.is_maintenance_scheduled,
      maintenance_start: body.maintenance_start,
      maintenance_end: body.maintenance_end,
      type_maintenance_mode: typeof body.is_maintenance_mode
    });

    // 1. Handle Token Logic (Double encryption protection)
    let tokenValue = body.github_token;
    if (tokenValue === "••••••••••••") {
        const existing = await pool.query('SELECT github_token FROM system_settings WHERE id = 1');
        tokenValue = existing.rows[0]?.github_token;
        // ✅ FIX: Check if already encrypted (don't double encrypt)
        if (tokenValue && !tokenValue.startsWith("U2FsdGVk")) {
          tokenValue = encryptToken(tokenValue);
        }
    } else if (tokenValue) {
      tokenValue = encryptToken(tokenValue);
    }

    // 2. Optimized SQL Upsert
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

    // 3. Map values with proper type conversion
    const values = [
      body.github_username || null,
      body.github_repo || null,
      tokenValue || null,
      body.github_branch || 'main',
      
      // ✅ Proper boolean conversion
      toBoolean(body.is_maintenance_mode, false),
      
      parseInt(body.trial_days) || 10,
      parseInt(body.max_users_basic) || 200,
      parseInt(body.max_users_pro) || 500,
      
      // ✅ Proper boolean conversion
      toBoolean(body.auto_renewal, true),
      toBoolean(body.email_notify, true),
      
      // ✅ Maintenance fields
      body.maintenance_title || 'Saanify Maintenance Mode',
      body.maintenance_msg || 'We are currently upgrading our systems...',
      
      // ✅ Proper date conversion
      toPostgresTimestamp(body.maintenance_start),
      toPostgresTimestamp(body.maintenance_end),
      
      // ✅ Proper boolean conversion
      toBoolean(body.is_maintenance_scheduled, false)
    ];

    const result = await pool.query(query, values);
    
    // ✅ Verify what was saved
    console.log("✅ Saved Successfully:", {
      is_maintenance_mode: result.rows[0]?.is_maintenance_mode,
      is_maintenance_scheduled: result.rows[0]?.is_maintenance_scheduled
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Settings Save Error:", error.message);
    if (error.code) console.error("❌ DB Error Code:", error.code);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
