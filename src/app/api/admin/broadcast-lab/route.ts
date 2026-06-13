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

    if (!content) throw new Error(`Content not found for: ${festivalKey}`);

    // ━━━ 3. ADVANCED LANGUAGE RESOLUTION (Updated Logic) ━━━
    let resolvedTitle = "";
    let resolvedMessage = "";
    let resolvedCta = "";

    if (language_mode === 'HI') {
      resolvedTitle = content.title_hi || content.default_title || 'शुभकामनाएं';
      resolvedMessage = content.message_hi || content.default_message || 'बधाई हो';
      resolvedCta = content.cta_hi || content.cta_text || 'अभी मनाएं';
    } 
    else if (language_mode === 'EN') {
      resolvedTitle = content.title_en || content.default_title || 'Greetings';
      resolvedMessage = content.message_en || content.default_message || 'Congratulations';
      resolvedCta = content.cta_en || content.cta_text || 'CELEBRATE NOW';
    } 
    else if (language_mode === 'BOTH') {
      // 🚀 PROFESSIONAL BILINGUAL FORMAT: Using '|' for Frontend Splitting
      resolvedTitle = `${content.title_hi || ''} | ${content.title_en || ''}`;
      resolvedMessage = `${content.message_hi || ''} | ${content.message_en || ''}`;
      // Button par bhi dono bhashayein dikhane ke liye:
      resolvedCta = `${content.cta_hi || ''} | ${content.cta_en || ''}`;
    }

    // ━━━ 4. MASTER V2 INSERT (100% Correct Column Mapping) ━━━
    const insertQuery = `
      INSERT INTO broadcasts (
        title, 
        message, 
        festival_key, 
        language_mode,
        hero_visual, 
        hero_config, 
        theme_config, 
        image_url,
        animation_theme, 
        theme_color,
        resolved_title, 
        resolved_message, 
        resolved_cta,
        preview_mode, 
        is_active, 
        content_mode, 
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        true, true, 'AUTO', NOW()
      )
      RETURNING *;
    `;

    const values = [
      resolvedTitle,               // $1
      resolvedMessage,             // $2
      festivalKey || broadcastType,// $3
      language_mode,               // $4
      asset?.hero_config?.visual_key || 'SPARKLES', // $5
      asset?.hero_config || {},    // $6
      asset?.theme_config || {},   // $7
      asset?.media_config?.web_image || null, // $8
      asset?.hero_config?.animation || 'NONE', // $9
      asset?.theme_config?.primary_color || '#fbbf24', // $10
      resolvedTitle,               // $11
      resolvedMessage,             // $12
      resolvedCta                  // $13 (New Fixed Column)
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
