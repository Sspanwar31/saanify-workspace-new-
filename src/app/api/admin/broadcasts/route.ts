import { NextResponse } from 'next/server';
import { Client } from 'pg';

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

// 1. GET: Saare broadcasts ki list laane ke liye
export async function GET() {
  let client;
  try {
    client = await getDbClient();
    if (!client) return NextResponse.json([]);

    const result = await client.query('SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 10');
    await client.end();
    return NextResponse.json(result.rows);
  } catch (error: any) {
    if (client) await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Naya broadcast create karne ke liye
export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    client = await getDbClient();
    if (!client) return NextResponse.json({ error: "DB Connection Failed" }, { status: 500 });

    const query = `
      INSERT INTO broadcasts (
        title, message, image_url, type, style, 
        is_active, starts_at, ends_at, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;

    const values = [
      body.title,
      body.message,
      body.image_url || null,
      body.type || 'INFO',
      body.style || 'BANNER',
      body.is_active ?? true,
      body.starts_at || new Date().toISOString(),
      body.ends_at || null
    ];

    const result = await client.query(query, values);
    await client.end();
    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    if (client) await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PATCH: Toggle ON/OFF karne ke liye
export async function PATCH(req: Request) {
    let client;
    try {
      const { id, is_active } = await req.json();
      client = await getDbClient();
      if (!client) return NextResponse.json({ error: "DB Error" });
  
      await client.query('UPDATE broadcasts SET is_active = $1 WHERE id = $2', [is_active, id]);
      await client.end();
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (client) await client.end();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// 4. DELETE: Hatane ke liye
export async function DELETE(req: Request) {
    let client;
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      client = await getDbClient();
      if (!client) return NextResponse.json({ error: "DB Error" });
  
      await client.query('DELETE FROM broadcasts WHERE id = $1', [id]);
      await client.end();
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (client) await client.end();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
