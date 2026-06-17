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
    const preview_mode = body.preview_mode;

    // ━━━ 1. ASSET & MESSAGE FETCH ━━━
    const assetResult = await client.query(`SELECT * FROM festival_assets_v2 WHERE festival_key = $1 LIMIT 1`, [festivalKey]);
    const asset = assetResult.rows[0];

    const messageResult = await client.query(`SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1`, [festivalKey]);
    const content = messageResult.rows[0];

    if (!content) throw new Error(`Content not found for: ${festivalKey}`);

    // ━━━ 2. 🚀 MASTER COLOR & THEME MAP (24 Festivals) ━━━
    const MASTER_THEME_MAP: any = {
      DIWALI: '#fbbf24', HOLI: '#ff0080', JANMASHTAMI: '#3b82f6', CHRISTMAS: '#ef4444',
      EID_UL_FITR: '#10b981', MAHASHIVRATRI: '#6366f1', REPUBLIC_DAY: '#FF9933',
      DUSSEHRA: '#B45309', NAVRATRI: '#DC2626', DURGA_PUJA: '#DC2626',
      NEW_YEAR: '#8b5cf6', RAKSHA_BANDHAN: '#db2777', LOHRI: '#f97316',
      MAKAR_SANKRANTI: '#38bdf8', GANESH_CHATURTHI: '#f97316', RAM_NAVAMI: '#f59e0b',
      HANUMAN_JAYANTI: '#ea580c', KARWA_CHAUTH: '#f59e0b', CHHATH_PUJA: '#F97316',
      PONGAL: '#22c55e', GURU_NANAK_JAYANTI: '#fbbf24', DEV_DEEPAWALI: '#fbbf24',
      EID_AL_ADHA: '#10b981', INDEPENDENCE_DAY: '#16a34a'
    };

    // ━━━ 3. JSON PARSING & NORMALIZATION ━━━
    const themeConfig = typeof asset?.theme_config === 'string' ? JSON.parse(asset.theme_config) : (asset?.theme_config || {});
    const heroConfig = typeof asset?.hero_config === 'string' ? JSON.parse(asset.hero_config) : (asset?.hero_config || {});
    const mediaConfig = typeof asset?.media_config === 'string' ? JSON.parse(asset.media_config) : (asset?.media_config || {});

    // Resolve Final Color (Priority: Master Map > JSON > Default Gold)
    const finalThemeColor = MASTER_THEME_MAP[festivalKey] || themeConfig.primary_color || '#fbbf24';

    const normalizedHeroConfig = {
      render_type: heroConfig.render_type || 'COMPONENT',
      visual_key: heroConfig.visual_key || 'ROYAL_DIYA',
      animation: heroConfig.animation || 'GOLDEN_PARTICLES',
      scale: heroConfig.scale || 1.2,
      speed: heroConfig.speed || 4,
      image_url: heroConfig.image_url || ''
    };

    const normalizedThemeConfig = {
      ...themeConfig,
      primary_color: finalThemeColor, // 🚀 Syncing the Color
      background_style: themeConfig.background_style || 'DARK_GOLD'
    };

    // ━━━ 4. LANGUAGE RESOLUTION ━━━
    let resTitle = content.default_title;
    let resMsg = content.default_message;
    if (language_mode === 'HI') { resTitle = content.title_hi; resMsg = content.message_hi; }
    else if (language_mode === 'EN') { resTitle = content.title_en; resMsg = content.message_en; }

    // ━━━ 5. MASTER INSERT ━━━
    const insertQuery = `
      INSERT INTO broadcasts (
        title, message, festival_key, language_mode,
        hero_visual, hero_config, theme_config, image_url,
        animation_theme, theme_color,
        resolved_title, resolved_message, resolved_cta,
        preview_mode, is_active, content_mode, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, true, 'AUTO', NOW())
      RETURNING *;
    `;

    const values = [
      resTitle, resMsg, festivalKey, language_mode,
      normalizedHeroConfig.visual_key,
      normalizedHeroConfig,
      normalizedThemeConfig,
      mediaConfig.web_image || null,
      normalizedHeroConfig.animation,
      finalThemeColor, // 🚀 $10: theme_color (🎯 Correct Branded Color)
      resTitle, resMsg, content.cta_text
    ];

    const result = await client.query(insertQuery, values);
    await client.end();

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    if (client) await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
