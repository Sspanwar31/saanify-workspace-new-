import { NextResponse } from 'next/server';
import { Client } from 'pg';

const getClient = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
};

// GET: Fetch latest stats for the UI
export async function GET() {
  const client = await getClient();
  try {
    const { rows } = await client.query('SELECT * FROM system_tasks');
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally { await client.end(); }
}

// POST: Run a specific task
export async function POST(req: Request) {
  const client = await getClient();
  try {
    const { task_key } = await req.json();
    
    // Simulate Task Execution (In real app, this triggers logic)
    // For Backup, we assume another API handles it, but we log it here.
    
    let status = 'SUCCESS';
    const now = new Date().toISOString();
    let meta = {};

    // REAL LOGIC: Auto Data Sync (Expire Subscriptions)
    if (task_key === 'auto_sync') {
       const result = await client.query(`
          UPDATE clients 
          SET status = 'EXPIRED' 
          WHERE subscription_expiry < NOW() 
          AND status = 'ACTIVE'
          AND is_lifetime = FALSE
       `);
       // Add info to meta so we can see how many were updated
       meta = { ...meta, updated_count: result.rowCount, message: `Expired ${result.rowCount} subscriptions` };
    }

    // REAL LOGIC: Database Restore (Placeholder for safety)
    if (task_key === 'restore') {
       // We skip actual restore for now as it requires file selection logic
       meta = { message: "Restore requires manual file selection (Safety Lock)" };
       status = 'PENDING'; // Don't mark as SUCCESS
    }

    // Mock Logic for demonstration (replace with real logic calls later)
    if (task_key === 'health') meta = { latency: Math.floor(Math.random() * 100) + 'ms' };
    if (task_key.startsWith('email_')) meta = { sent: Math.floor(Math.random() * 50), pending: 0 };

    await client.query(
        `INSERT INTO system_tasks (task_key, last_run, status, meta) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (task_key) DO UPDATE SET last_run = $2, status = $3, meta = $4`,
        [task_key, now, status, meta]
    );

    return NextResponse.json({ success: true, last_run: now, status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally { await client.end(); }
}