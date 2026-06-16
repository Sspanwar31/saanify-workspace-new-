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

    // ━━━ 2. MESSAGE FETCH ━━━
    let content = null;
    if (festivalKey) {
      const result = await client.query(
        `SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1`,
        [festivalKey]
      );
      content = result.rows[0];
    }

    if (!content) throw new Error(`Content not found for: ${festivalKey}`);

    // ━━━ 3. LANGUAGE RESOLUTION (BOL-CHAAL) ━━━
    let resolvedTitle = content.default_title;
    let resolvedMessage = content.default_message;
    let resolvedCta = content.cta_text;

    if (language_mode === 'HI') {
      resolvedTitle = content.title_hi || content.default_title;
      resolvedMessage = content.message_hi || content.default_message;
      resolvedCta = content.cta_hi || content.cta_text;
    } else if (language_mode === 'EN') {
      resolvedTitle = content.title_en || content.default_title;
      resolvedMessage = content.message_en || content.default_message;
      resolvedCta = content.cta_en || content.cta_text;
    }

    // ━━━ 4. 🚀 CRITICAL FIX: SMART JSON PARSING ━━━
    // Kabhi-kabhi PG JSON ko string ki tarah bhejta hai, isliye hum safety check karenge
    const themeConfig = typeof asset?.theme_config === 'string' ? JSON.parse(asset.theme_config) : (asset?.theme_config || {});
    const heroConfig = typeof asset?.hero_config === 'string' ? JSON.parse(asset.hero_config) : (asset?.hero_config || {});
    const mediaConfig = typeof asset?.media_config === 'string' ? JSON.parse(asset.media_config) : (asset?.media_config || {});

    // 🎯 1. Animation Logic: hero_config ke andar se dhoondo
    // Hum 'animation' aur 'overlay' dono check karenge taaki Lohri ya Diwali miss na ho
    const finalAnimation = heroConfig.animation || heroConfig.overlay || 'GOLDEN_PARTICLES';

    // 🎯 2. Color Logic: theme_config se dhoondo
    const bgStyle = themeConfig.background_style || 'DARK_GOLD';
    const autoColorMap: any = {
        'SKY': '#38bdf8', 'FIRE': '#f97316', 'RAINBOW': '#ff0080', 
        'WINTER': '#60a5fa', 'EMERALD': '#10b981', 'SAFFRON': '#ff9933', 
        'DARK_BLUE': '#3b82f6', 'DARK_GOLD': '#fbbf24', 'GOLD': '#fbbf24'
    };
    const finalThemeColor = themeConfig.primary_color || autoColorMap[bgStyle] || '#fbbf24';

    // ━━━ 5. MASTER V2 INSERT ━━━
    const insertQuery = `
      INSERT INTO broadcasts (
        title, message, festival_key, language_mode,
        hero_visual, hero_config, theme_config, image_url,
        animation_theme, theme_color,
        resolved_title, resolved_message, resolved_cta,
        preview_mode, is_active, content_mode, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        true, true, 'AUTO', NOW()
      )
      RETURNING *;
    `;

    const values = [
      resolvedTitle,                               // $1
      resolvedMessage,                             // $2
      festivalKey || broadcastType,                // $3
      language_mode,                               // $4
      heroConfig.visual_key || 'SPARKLES',         // $5
      heroConfig,                                  // $6 (Poora Hero JSON)
      themeConfig,                                 // $7 (Poora Theme JSON)
      mediaConfig.web_image || null,               // $8
      finalAnimation,                              // 🚀 $9: FIXED (Ab 'animation' key se data aayega)
      finalThemeColor,                             // 🚀 $10: FIXED (Ab 'theme_config' se color aayega)
      resolvedTitle,                               // $11
      resolvedMessage,                             // $12
      resolvedCta                                  // $13
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
