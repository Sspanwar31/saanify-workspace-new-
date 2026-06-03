import { NextResponse } from 'next/server';
import { Client } from 'pg';

const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
};

export async function GET() {
  let client;
  try {
    client = await getDbClient();
    if (!client) return NextResponse.json([]);
    
    const result = await client.query(`
      SELECT *
      FROM broadcasts
      ORDER BY priority DESC, created_at DESC
    `);
    
    await client.end();
    return NextResponse.json(result.rows);
  } catch (error: any) {
    if (client) await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    
    // Step 1: Log Body
    console.log("BODY =", body);
    
    client = await getDbClient();
    if (!client) return NextResponse.json({ error: "DB Error" }, { status: 500 });

    const query = `
      INSERT INTO broadcasts (
        title,
        message,
        image_url,
        type,
        style,
        is_active,
        starts_at,
        ends_at,
        target_audience,
        animation_type,

        category,
        festival_key,
        theme,
        hero_enabled,
        auto_generated,
        priority,
        dismissible,
        show_once,

        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,
        $15,$16,$17,$18,
        NOW()
      )
      RETURNING *;
    `;

    const values = [
      body.title,
      body.message,
      body.image_url || null,
      body.type || 'INFO',
      body.style || 'POPUP',
      true,

      body.starts_at || new Date().toISOString(),
      body.ends_at || null,

      body.target_audience || 'BOTH',
      body.animation_type || 'NONE',

      body.category || 'CUSTOM',
      body.festival_key || null,
      body.theme || 'default',

      body.hero_enabled ?? false,
      body.auto_generated ?? false,

      body.priority ?? 1,
      body.dismissible ?? true,
      body.show_once ?? false
    ];

    // Step 2: Log Values
    console.log("VALUES =", values);

    const result = await client.query(query, values);
    await client.end();
    return NextResponse.json({ success: true, data: result.rows[0] });
    
  // Step 3: Detailed Error Handling
  } catch (error: any) {
    console.error("POST ERROR =", error);

    if (client) await client.end();

    return NextResponse.json(
      {
        error: error.message,
        detail: error.detail,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

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
