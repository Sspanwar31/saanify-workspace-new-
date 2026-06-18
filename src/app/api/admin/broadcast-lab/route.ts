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

// ━━━ 1. GET: Database se saari keys fetch karein (Updated for Safety)
export async function GET() {
  let client: Client | null = null;
  try {
    client = await getDbClient();
    if (!client) throw new Error("DB connection failed");

    // Fetch Festival Keys (Updated to list all tables)
    const festRes = await client.query(`
      SELECT festival_key
      FROM festival_assets_v2
      WHERE is_active = true
      ORDER BY festival_key ASC
    `);
    
    // Fetch Corporate Types
    const corpRes = await client.query(
      'SELECT broadcast_type FROM broadcast_assets ORDER BY broadcast_type ASC'
    );

    await client.end();

    // 🚀 SAFETY: Always return arrays, never undefined
    // Note: Mapped to table_name to match the new query result
    return NextResponse.json({
      festivals: festRes.rows?.map((r) => r.festival_key) || [],
      types: corpRes.rows?.map((r) => r.broadcast_type) || []
    });
  } catch (e: any) {
    console.error("GET ERROR =", e);

    return NextResponse.json({
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
}

// ━━━ 2. POST: Publish Logic (Corporate vs Festival Check)
export async function POST(req: Request) {
  let client: Client | null = null;

  try {
    const body = await req.json();
    client = await getDbClient();

    const festivalKey = body.festival_key;
    const broadcastType = body.broadcast_type;
    const language_mode = body.language_mode;
    const preview_mode = body.preview_mode;

    // 🚀 Logic: Corporate check karein agar festival key nahi mili
    // Hum priority dete hain broadcastType ko agar wo diya hai, warna festivalKey use hoga
    const targetKey = broadcastType || festivalKey;

    let asset, content, resolvedFestivalKey;

    // ━━━ Step A: Corporate Check ━━━
    // Pehle check karein kya ye Corporate table mein hai
    const corpCheck = await client.query(
      'SELECT * FROM broadcast_assets WHERE broadcast_type = $1 LIMIT 1',
      [targetKey]
    );

    if (corpCheck.rows.length > 0) {
      // ━━━ Corporate Path ━━━
      asset = corpCheck.rows[0];
      const msgRes = await client.query(
        'SELECT * FROM broadcast_messages WHERE broadcast_type = $1 LIMIT 1',
        [targetKey]
      );
      content = msgRes.rows[0];
      resolvedFestivalKey = targetKey; // Corporate ko bhi key ke roop mein store karenge
    } else {
      // ━━━ Festival Path (Fallback) ━━━
      const assetResult = await client.query(
        `SELECT * FROM festival_assets_v2 WHERE festival_key = $1 LIMIT 1`,
        [festivalKey]
      );
      asset = assetResult.rows[0];

      const messageResult = await client.query(
        `SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1`,
        [festivalKey]
      );
      content = messageResult.rows[0];
      resolvedFestivalKey = festivalKey;
    }

    if (!content) throw new Error(`Data not found in DB for: ${targetKey}`);

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
    const finalThemeColor = MASTER_THEME_MAP[resolvedFestivalKey] || themeConfig.primary_color || '#fbbf24';

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
      resTitle, resMsg, resolvedFestivalKey, language_mode,
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
    console.error("POST ERROR =", error);

    if (client) await client.end();

    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        detail: error.detail,
        hint: error.hint,
        code: error.code
      },
      { status: 500 }
    );
  }
}
