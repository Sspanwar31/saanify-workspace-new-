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
    const language_mode = body.language_mode;
    const full_screen_animation = body.full_screen_animation;
    const dashboard_overlay = body.dashboard_overlay;

    // 🚀 STEP 1: Corporate types ki list
    const corporateTypes = ['ANNOUNCEMENT', 'SYSTEM_UPDATE', 'SPECIAL_OFFER', 'MAINTENANCE', 'EMERGENCY', 'EVENT'];
    const isCorporate = corporateTypes.includes(festival_key);

    let finalAssets: any = null;
    let dbContent: any = null;

    if (isCorporate) {
      // ━━━ PATH A: CORPORATE LOGIC (Fetching from broadcast tables) ━━━
      const assetRes = await client.query(
        'SELECT * FROM broadcast_assets WHERE broadcast_type = $1 LIMIT 1',
        [festivalKey]
      );
      finalAssets = assetRes.rows[0];

      const msgRes = await client.query(
        'SELECT * FROM broadcast_messages WHERE broadcast_type = $1 LIMIT 1',
        [festivalKey]
      );
      dbContent = msgRes.rows[0];

      if (!dbContent) throw new Error(`Corporate message not found for: ${festivalKey}`);

    } else {
      // ━━━ PATH B: FESTIVAL LOGIC (Fetching from festival tables) ━━━
      const assetRes = await client.query(
        'SELECT * FROM festival_assets WHERE festival_key = $1 LIMIT 1',
        [festivalKey]
      );
      finalAssets = assetRes.rows[0];

      const msgRes = await client.query(
        'SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1',
        [festivalKey]
      );
      dbContent = msgRes.rows[0];

      if (!dbContent) throw new Error(`Festival message not found for: ${festivalKey}`);
    }

    // 🚀 STEP 2: DYNAMIC LANGUAGE RESOLUTION (Using DB columns)
    let title;
    let message;

    if (language_mode === 'HI') {
      title = dbContent.title_hi || dbContent.default_title;
      message = dbContent.message_hi || dbContent.default_message;
    } else if (language_mode === 'EN') {
      title = dbContent.title_en || dbContent.default_title;
      message = dbContent.message_en || dbContent.default_message;
    } else {
      // BOTH Mode: Formatting for the Dashboard split logic
      title = (dbContent.title_hi || '') + " | " + (dbContent.title_en || '');
      message = (dbContent.message_hi || '') + " | " + (dbContent.message_en || '');
    }

    // 🚀 STEP 3: MASTER INSERT (Pura data ab DB se hai, koi hardcoding nahi)
    const insertQuery = `
      INSERT INTO broadcasts (
        title, message, festival_key, language_mode,
        full_screen_animation, dashboard_overlay,
        hero_visual, animation_theme, theme_color,
        resolved_title, resolved_message,
        preview_mode, is_active, auto_generated, content_mode, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true, true, 'AUTO', NOW())
      RETURNING *;
    `;

    const values = [
      title,
      message,
      festivalKey,
      language_mode,
      full_screen_animation,
      dashboard_overlay,
      finalAssets?.hero_visual || 'GEAR_ICON',
      finalAssets?.animation_theme || 'NONE',
      finalAssets?.theme_color || '#2563EB',
      title, 
      message 
    ];

    const result = await client.query(insertQuery, values);

    return NextResponse.json({
      success: true,
      message: `Generated from ${isCorporate ? 'broadcast_messages' : 'festival_messages'} table`,
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error('Broadcast Lab Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}
