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
    const broadcastType = body.broadcast_type; // ✅ Added broadcast_type extraction
    const language_mode = body.language_mode;
    const full_screen_animation = body.full_screen_animation;
    const dashboard_overlay = body.dashboard_overlay;

    // ━━━ DEBUG LOGS ━━━
    console.log('festivalKey=', festivalKey);
    console.log('broadcastType=', broadcastType);

    // ━━━ ASSET FETCH SECTION ━━━
    let asset = null;

    if (festivalKey) {
      const assetResult = await client.query(
        `
        SELECT *
        FROM festival_assets
        WHERE festival_key = $1
        LIMIT 1
        `,
        [festivalKey]
      );
      asset = assetResult.rows[0];
    }

    if (broadcastType) {
      const assetResult = await client.query(
        `
        SELECT *
        FROM broadcast_assets
        WHERE broadcast_type = $1
        LIMIT 1
        `,
        [broadcastType]
      );
      asset = assetResult.rows[0];
    }

    // ━━━ MESSAGE FETCH SECTION ━━━
    let content = null;

    if (festivalKey) {
      const result = await client.query(
        `
        SELECT *
        FROM festival_messages
        WHERE festival_key = $1
        LIMIT 1
        `,
        [festivalKey]
      );
      content = result.rows[0];
    }

    if (broadcastType) {
      const result = await client.query(
        `
        SELECT *
        FROM broadcast_messages
        WHERE broadcast_type = $1
        LIMIT 1
        `,
        [broadcastType]
      );
      content = result.rows[0];
    }

    console.log('asset=', asset);
    console.log('content=', content);

    if (!content) {
        throw new Error(`Content not found for Festival: ${festivalKey} or Type: ${broadcastType}`);
    }

    // ━━━ TITLE & MESSAGE LOGIC ━━━
    let title;
    let message;

    if (language_mode === 'HI') {
      title =
        content?.title_hi ||
        'Greeting';

      message =
        content?.message_hi ||
        'Message';
    } else if (language_mode === 'EN') {
      title =
        content?.title_en ||
        'Greeting';

      message =
        content?.message_en ||
        'Message';
    } else {
      // BOTH Mode logic
      title =
        content?.title_hi ||
        content?.title_en ||
        'Greeting';

      message =
        content?.message_hi ||
        content?.message_en ||
        'Message';
    }

    // ━━━ INSERT QUERY (Fixed #1) ━━━
    const insertQuery = `
INSERT INTO broadcasts (
  title,
  message,
  festival_key,
  language_mode,
  full_screen_animation,
  dashboard_overlay,
  hero_visual,
  image_url,
  layout_template,
  animation_theme,
  theme_color,
  resolved_title,
  resolved_message,
  preview_mode,
  is_active,
  auto_generated,
  content_mode,
  created_at
)
VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
  true,true,true,'AUTO',NOW()
)
RETURNING *;
`;

    const values = [
      title,
      message,
      festivalKey || broadcastType,
      language_mode,
      full_screen_animation,
      dashboard_overlay,
      asset?.hero_visual || 'GEAR_ICON',
      asset?.background_image ||
        asset?.web_image ||
        asset?.asset_url ||
        null,
      asset?.layout_template || null,
      asset?.animation_theme || 'NONE',
      asset?.theme_color || '#2563EB',
      title,
      message
    ];

    const result = await client.query(insertQuery, values);

    return NextResponse.json({
      success: true,
      message: `Generated broadcast successfully`,
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error('Broadcast Lab Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}
