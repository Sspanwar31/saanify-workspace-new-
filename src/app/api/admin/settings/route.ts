import { NextResponse } from 'next/server';
import { Client } from 'pg';
import CryptoJS from 'crypto-js'; // For encryption

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
  if (!token || token === "••••••••••••") return token; // Don't encrypt mask or empty
  return CryptoJS.AES.encrypt(token, getEncryptionKey()).toString();
};

const decryptToken = (encryptedToken: string): string => {
  if (!encryptedToken || encryptedToken.startsWith("••••")) return encryptedToken; // Don't decrypt mask
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, getEncryptionKey());
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Decryption failed:", e);
    return ""; // Return empty string on failure
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
        data.github_token = decryptToken(data.github_token); // Decrypt first
        data.github_token = "••••••••••••"; // Then mask for UI
    }

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
    client = await getDbClient();
    if (!client) return NextResponse.json({ success: true, message: "Preview Mode: Simulated Save" });

    // 1. Handle Token Logic (Don't overwrite with stars)
    let tokenValue = body.github_token;
    if (tokenValue === "••••••••••••") {
        const existing = await client.query('SELECT github_token FROM system_settings WHERE id = 1');
        tokenValue = existing.rows[0]?.github_token;
    }
    
    // 2. SECURITY: Encrypt token before saving
    tokenValue = encryptToken(tokenValue);

    // 3. Updated SQL Upsert (Added Maintenance Fields)
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

    // 4. Map values from frontend body to SQL parameters
    const values = [
      body.github_username || null,
      body.github_repo || null,
      tokenValue || null,
      body.github_branch || 'main',
      body.is_maintenance_mode ?? false,
      body.trial_days || 10,
      body.max_users_basic || 200,
      body.max_users_pro || 500,
      body.auto_renewal ?? true,
      body.email_notify ?? true,
      // Naye fields yahan se hain:
      body.maintenance_title || 'Saanify Maintenance Mode',
      body.maintenance_msg || 'We are currently upgrading our systems...',
      body.maintenance_start || null,
      body.maintenance_end || null,
      body.is_maintenance_scheduled ?? false
    ];

    await client.query(query, values);
    await client.end();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Settings Save Error:", error);
    if (client) await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
