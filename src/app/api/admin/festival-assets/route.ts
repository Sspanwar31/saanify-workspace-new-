import { NextResponse } from 'next/server';
import { Client } from 'pg';

const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
};

// 🚀 PATCH: Sirf Visuals aur Theme badalne ke liye
export async function PATCH(req: Request) {
  let client;
  try {
    const body = await req.json();
    const { festival_key, hero_config, theme_config } = body;
    
    client = await getDbClient();
    if (!client) return NextResponse.json({ error: "DB Error" }, { status: 500 });

    // 1. Database mein JSON Data update karein
    const query = `
      UPDATE festival_assets_v2 
      SET 
        hero_config = $1, 
        theme_config = $2,
        updated_at = NOW()
      WHERE festival_key = $3
      RETURNING *;
    `;

    // 🚀 Dhyan dein: Hum pura JSON object save kar rahe hain
    const values = [
      JSON.stringify(hero_config), 
      JSON.stringify(theme_config), 
      festival_key
    ];

    const result = await client.query(query, values);
    await client.end();

    if (result.rowCount === 0) {
        return NextResponse.json({ error: "Festival not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    if (client) await client.end();
    console.error("Asset Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
