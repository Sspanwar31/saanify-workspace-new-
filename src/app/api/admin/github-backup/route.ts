import { NextResponse } from 'next/server';
import { Client } from 'pg';
import CryptoJS from 'crypto-js';

// Helper: Decrypt Token
const decryptToken = (encryptedToken: string) => {
  const secret = process.env.ENCRYPTION_SECRET_KEY;
  if (!secret) {
    console.error("CRITICAL: ENCRYPTION_SECRET_KEY is missing in Vercel!");
    return null;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secret);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch (e) {
    console.error("Decryption Failed:", e);
    return null;
  }
};

export async function POST() {
  // 1. Safety Checks
  if (!process.env.DATABASE_URL) {
    // Preview Mode Handling
    return NextResponse.json({ success: true, message: "Preview Mode: Backup Simulated" });
  }
  
  if (!process.env.ENCRYPTION_SECRET_KEY) {
    return NextResponse.json({ error: "Server Error: ENCRYPTION_SECRET_KEY is missing in Vercel." }, { status: 500 });
  }

  let client;
  try {
    // 2. Connect to Database (Direct SQL)
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // 3. Get Settings
    const { rows: settingsRows } = await client.query('SELECT * FROM system_settings WHERE id = 1');
    const settings = settingsRows[0];

    if (!settings || !settings.github_username || !settings.github_repo || !settings.github_token) {
      await client.end();
      return NextResponse.json(
        { error: "Configuration Missing! Go to Settings and save GitHub details." }, 
        { status: 400 }
      );
    }

    // 4. Decrypt the Token
    const realToken = decryptToken(settings.github_token);
    
    if (!realToken) {
        await client.end();
        return NextResponse.json({ error: "Security Error: Could not decrypt GitHub Token. Please re-save settings." }, { status: 500 });
    }

    // 5. Fetch Data Payload
    const { rows: clients } = await client.query('SELECT * FROM clients');
    const { rows: invoices } = await client.query('SELECT * FROM invoices');
    
    const backupPayload = {
      timestamp: new Date().toISOString(),
      metadata: {
        total_clients: clients.length,
        total_invoices: invoices.length
      },
      data: { clients, invoices }
    };

    // 6. Push to GitHub
    const fileName = `backups/backup-${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify(backupPayload, null, 2)).toString('base64');
    const url = `https://api.github.com/repos/${settings.github_username}/${settings.github_repo}/contents/${fileName}`;

    console.log(`Uploading to GitHub: ${url}`);

    const ghResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${realToken}`, // Use DECRYPTED token
        'Content-Type': 'application/json',
        'User-Agent': 'Saanify-Backup-Bot'
      },
      body: JSON.stringify({
        message: `Auto-Backup: ${new Date().toISOString()}`,
        content: content,
        branch: settings.github_branch || 'main'
      })
    });

    await client.end();

    if (!ghResponse.ok) {
      const errText = await ghResponse.text();
      console.error("GitHub Error:", errText);
      return NextResponse.json({ error: `GitHub Failed: ${ghResponse.statusText} - ${errText}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Backup successfully stored in GitHub!" });

  } catch (error: any) {
    if (client) await client.end();
    console.error("Backup Crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}