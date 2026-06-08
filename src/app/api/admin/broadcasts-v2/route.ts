import { NextResponse } from 'next/server';
import { Client } from 'pg';

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

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    client = await getDbClient();

    if (!client) {
      return NextResponse.json({ error: 'DB Connection Failed' }, { status: 500 });
    }

    const festivalKey = body.festival_key;

    // 1. Fetch Message Content
    const messageResult = await client.query(
      'SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1',
      [festivalKey]
    );

    if (!messageResult.rows.length) {
      throw new Error(`Festival message not found for: ${festivalKey}`);
    }
    const festivalMessage = messageResult.rows[0];

    // 2. Fetch Mapping & Category
    const mappingResult = await client.query(
      'SELECT * FROM festival_mappings WHERE festival_key = $1 LIMIT 1',
      [festivalKey]
    );
    const festivalCategory = mappingResult.rows[0]?.festival_category ?? 'GENERAL';

    // 3. Fetch Style Template
    const templateResult = await client.query(
      'SELECT * FROM festival_templates WHERE festival_category = $1 LIMIT 1',
      [festivalCategory]
    );
    const template = templateResult.rows[0] ?? {};

    // 4. Fetch Assets (Images/Lottie/Animations)
    const assetResult = await client.query(
      'SELECT * FROM festival_assets WHERE festival_key = $1 LIMIT 1',
      [festivalKey]
    );
    const asset = assetResult.rows[0] ?? {};

    // ━━━ Language Resolution Logic ━━━
    const languageMode = body.language_mode ?? 'BOTH';
    let resolvedTitle = festivalMessage.default_title;
    let resolvedMessage = festivalMessage.default_message;
    let resolvedCta = festivalMessage.cta_text;

    if (languageMode === 'HI') {
      resolvedTitle = festivalMessage.title_hi || festivalMessage.default_title;
      resolvedMessage = festivalMessage.message_hi || festivalMessage.default_message;
      resolvedCta = festivalMessage.cta_hi || festivalMessage.cta_text;
    } else if (languageMode === 'EN') {
      resolvedTitle = festivalMessage.title_en || festivalMessage.default_title;
      resolvedMessage = festivalMessage.message_en || festivalMessage.default_message;
      resolvedCta = festivalMessage.cta_en || festivalMessage.cta_text;
    } else if (languageMode === 'BOTH') {
      // 🚀 Fix: Standard format for Dashboard split logic
      resolvedTitle = (festivalMessage.title_hi || '') + " | " + (festivalMessage.title_en || '');
      resolvedMessage = (festivalMessage.message_hi || '') + " | " + (festivalMessage.message_en || '');
      resolvedCta = festivalMessage.cta_hi || festivalMessage.cta_text;
    }

    // ━━━ Final Insert into Master Broadcasts Table ━━━
    const insertQuery = `
      INSERT INTO broadcasts (
        title, message, type, style, 
        festival_key, festival_category,
        hero_visual, animation_theme, layout_template,
        theme_color, cta_text, language_mode,
        resolved_title, resolved_message, resolved_cta,
        hero_enabled, auto_generated, is_active,
        background_image, mobile_image, web_image,
        video_url, lottie_file,
        full_screen_animation, dashboard_overlay,
        created_at
      )
      VALUES (
        $1, $2, 'FESTIVAL', 'POPUP',
        $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, true, true, true,
        $14, $15, $16, $17, $18, $19, $20, NOW()
      )
      RETURNING *;
    `;

    const values = [
      resolvedTitle,
      resolvedMessage,
      festivalKey,
      festivalCategory,
      asset.hero_visual || template.hero_visual,
      asset.animation_theme || template.animation_theme,
      template.layout_template || 'DEFAULT',
      asset.theme_color || festivalMessage.theme_color || '#2563EB',
      resolvedCta,
      languageMode,
      resolvedTitle,
      resolvedMessage,
      resolvedCta,
      asset.background_image || null,
      asset.mobile_image || null,
      asset.web_image || null,
      asset.video_url || null,
      asset.lottie_file || null,
      asset.full_screen_animation ?? false,
      asset.dashboard_overlay ?? false
    ];

    const insertResult = await client.query(insertQuery, values);
    await client.end();

    return NextResponse.json({
      success: true,
      data: insertResult.rows[0]
    });

  } catch (error: any) {
    if (client) await client.end();
    console.error("Auto Broadcast Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
