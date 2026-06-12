import { NextResponse } from 'next/server';
import { Client } from 'pg';

const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL missing');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
};

export async function POST(req: Request) {
  let client: Client | null = null;

  try {
    const body = await req.json();
    client = await getDbClient();

    const festivalKey = body.festival_key;
    const broadcastType = body.broadcast_type;
    const language_mode = body.language_mode;

    // ━━━ 1. ASSET FETCH (V2 TABLE) ━━━
    let asset = null;
    if (festivalKey) {
      const assetResult = await client.query(
        `SELECT * FROM festival_assets_v2 WHERE festival_key = $1 LIMIT 1`,
        [festivalKey]
      );
      asset = assetResult.rows[0];
    }

    // ━━━ 2. MESSAGE FETCH (Same as before) ━━━
    let content = null;
    if (festivalKey) {
      const result = await client.query(
        `SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1`,
        [festivalKey]
      );
      content = result.rows[0];
    }
    // ... logic for broadcastType same ...

    if (!content) throw new Error(`Content not found for: ${festivalKey}`);

    // ━━━ 3. TITLE & MESSAGE LOGIC ━━━
    let title = content.title_hi || content.default_title;
    let message = content.message_hi || content.default_message;
    // ... apply language_mode logic as you had before ...

    // ━━━ 4. MASTER V2 INSERT ━━━
    const insertQuery = `
      INSERT INTO broadcasts (
        title, message, festival_key, language_mode,
        hero_visual, 
        hero_config,  -- 🚀 NEW JSON COLUMN
        theme_config, -- 🚀 NEW JSON COLUMN
        image_url,
        animation_theme,
        theme_color,
        resolved_title, resolved_message,
        preview_mode, is_active, content_mode, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true, 'AUTO', NOW())
      RETURNING *;
    `;

    const values = [
      title,
      message,
      festivalKey || broadcastType,
      language_mode,
      asset?.hero_config?.visual_key || 'SPARKLES', // Fallback for old engines
      asset?.hero_config || {},   // 🚀 Saving full JSON to DB
      asset?.theme_config || {},  // 🚀 Saving full JSON to DB
      asset?.media_config?.web_image || null,
      asset?.hero_config?.animation || 'NONE',
      asset?.theme_config?.primary_color || '#fbbf24',
      title,
      message
    ];

    const result = await client.query(insertQuery, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error('Broadcast Lab Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}
