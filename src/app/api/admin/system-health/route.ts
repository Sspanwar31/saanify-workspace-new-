import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL missing');

  // 🚀 स्तर 1: ऐप्लीकेशन का नाम सेट करना (API_System_Health)
  const urlWithAppName = connectionString.includes('?') 
    ? `${connectionString}&application_name=API_System_Health`
    : `${connectionString}?application_name=API_System_Health`;

  const client = new Client({
    connectionString: urlWithAppName,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
};

// 1. GET: Active Connections aur Database Size metrics lekar aayein
export async function GET() {
  let client: Client | null = null;
  try {
    client = await getDbClient();

    // Active Connections list
    const connRes = await client.query(`
      SELECT 
        pid, 
        state, 
        query, 
        age(clock_timestamp(), query_start)::text AS duration,
        application_name
      FROM pg_stat_activity 
      WHERE state IS NOT NULL AND application_name != 'postgres_exporter'
      ORDER BY duration DESC;
    `);

    // Live Database Size raw bytes + pretty string (Conflict resolved)
    const sizeRes = await client.query(`
      SELECT 
        pg_database_size(current_database()) AS size_bytes,
        pg_size_pretty(pg_database_size(current_database())) AS size_pretty;
    `);

    await client.end();

    const rawBytes = parseInt(sizeRes.rows[0]?.size_bytes || '0', 10);
    const freePlanLimitBytes = 524288000; // 500 MB in Bytes (Supabase Free Plan Limit)
    const usagePercentage = parseFloat(((rawBytes / freePlanLimitBytes) * 100).toFixed(2));

    return NextResponse.json({
      connections: connRes.rows || [],
      dbSize: sizeRes.rows[0]?.size_pretty || 'Unknown',
      dbSizeBytes: rawBytes,
      dbPercentage: usagePercentage > 100 ? 100 : usagePercentage,
      dbLimit: '500 MB'
    });
  } catch (err: any) {
    console.error("Health GET Error:", err);
    if (client) await client.end();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Kisi bhi hanging/leak connection (PID) ko force-disconnect karein
export async function POST(req: Request) {
  let client: Client | null = null;
  try {
    const body = await req.json();
    const { pid } = body;
    if (!pid) throw new Error("Connection PID is required");

    client = await getDbClient();
    
    // Postgres native connection termination query
    await client.query('SELECT pg_terminate_backend($1);', [pid]);
    
    await client.end();

    return NextResponse.json({ 
      success: true, 
      message: `Connection ${pid} terminated successfully` 
    });
  } catch (err: any) {
    console.error("Health POST Error:", err);
    if (client) await client.end();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
