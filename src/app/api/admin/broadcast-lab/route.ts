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

// ━━━ 1. GET: Database se saari keys + total count fetch karein
export async function GET() {
  let client: Client | null = null;
  try {
    client = await getDbClient();
    if (!client) throw new Error("DB connection failed");

    // Fetch Festival Keys
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

    // Get Total Count of Broadcasts currently in the DB
    const countRes = await client.query('SELECT COUNT(*) as count FROM broadcasts');
    const totalCount = parseInt(countRes.rows[0]?.count || '0', 10);

    await client.end();

    return NextResponse.json({
      festivals: festRes.rows?.map((r) => r.festival_key) || [],
      types: corpRes.rows?.map((r) => r.broadcast_type) || [],
      totalCount: totalCount
    });
  } catch (e: any) {
    console.error("GET ERROR =", e);
    if (client) await client.end();
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
    const language_mode = body.language_mode || 'BOTH'; // BOTH को डिफ़ॉल्ट मान कर चलें
    const preview_mode = body.preview_mode;
    const action = body.action || 'generate';

    // Consistent targetKey Resolution
    const targetKey = broadcastType || festivalKey;

    // DELETE ALL ACTION (Table ko poora khali karne ke liye)
    if (action === 'delete_all') {
      await client.query(`DELETE FROM broadcasts`);
      await client.end();

      return NextResponse.json({
        success: true,
        action: 'delete_all',
        message: 'All broadcasts cleared successfully'
      });
    }

    if (!targetKey && action !== 'delete_all') {
      throw new Error("festival_key or broadcast_type is required");
    }

    let forceActive = false;

    // ━━━ START ACTION ━━━
    if (action === 'start') {
      
      // Isko chalu karne se pehle baki sabhi active broadcasts ko automatic stop karein
      await client.query(
        `
        UPDATE broadcasts
        SET is_active=false, status='stopped', manual_stop=true, updated_at=NOW()
        WHERE festival_key != $1
        `,
        [targetKey]
      );

      // STEP 1 → Existing broadcast check
      const existing = await client.query(
        `SELECT * FROM broadcasts WHERE festival_key=$1 LIMIT 1`,
        [targetKey]
      );

      if (existing.rows.length > 0) {
        // डायरेक्ट स्टार्ट होने पर भी सही ट्रांसलेशन अपडेट हो, इसके लिए forceActive = true करेंगे
        forceActive = true; 
      } else {
        forceActive = true;
      }
    }

    // ━━━ STOP ACTION ━━━
    if (action === 'stop') {
      const result = await client.query(
        `
        UPDATE broadcasts
        SET
          status='stopped',
          is_active=false,
          manual_stop=true,
          updated_at=NOW()
        WHERE festival_key=$1
        RETURNING *;
        `,
        [targetKey]
      );

      await client.end();

      return NextResponse.json({
        success: true,
        action: 'stop',
        data: result.rows[0] || null
      });
    }

    // ━━━ DELETE ACTION (Single Delete) ━━━
    if (action === 'delete') {
      const result = await client.query(
        `DELETE FROM broadcasts WHERE festival_key=$1 RETURNING *`,
        [targetKey]
      );

      await client.end();

      return NextResponse.json({
        success: true,
        action: 'delete',
        data: result.rows[0] || null
      });
    }

    // ━━━ GENERATE LOGIC ━━━
    let asset, content, resolvedFestivalKey;

    // Step A: Corporate Check
    const corpCheck = await client.query(
      'SELECT * FROM broadcast_assets WHERE broadcast_type = $1 LIMIT 1',
      [targetKey]
    );

    if (corpCheck.rows.length > 0) {
      asset = corpCheck.rows[0];
      const msgRes = await client.query(
        'SELECT * FROM broadcast_messages WHERE broadcast_type = $1 LIMIT 1',
        [targetKey]
      );
      content = msgRes.rows[0];
      resolvedFestivalKey = targetKey; 
    } else {
      // Festival Path
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

    // ━━━ MASTER THEME MAP (24 Festivals) ━━━
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

    const themeConfig = typeof asset?.theme_config === 'string' ? JSON.parse(asset.theme_config) : (asset?.theme_config || {});
    const heroConfig = typeof asset?.hero_config === 'string' ? JSON.parse(asset.hero_config) : (asset?.hero_config || {});
    const mediaConfig = typeof asset?.media_config === 'string' ? JSON.parse(asset.media_config) : (asset?.media_config || {});

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
      primary_color: finalThemeColor, 
      background_style: themeConfig.background_style || 'DARK_GOLD'
    };

    // ━━━ 🚀 4. LANGUAGE RESOLUTION (FESTIVAL & CORPORATE NOW FULLY ALIGNED) ━━━
    let resTitle = "";
    let resMsg = "";
    let resCta = "";

    if (language_mode === 'HI') {
      resTitle = content.title_hi || content.default_title;
      resMsg = content.message_hi || content.default_message;
      resCta = content.cta_hi || content.cta_text || "विवरण";
    } else if (language_mode === 'EN') {
      resTitle = content.title_en || content.default_title;
      resMsg = content.message_en || content.default_message;
      resCta = content.cta_en || content.cta_text || "Celebrate";
    } else {
      // 'BOTH' (Hinglish/Default mix) - Ab dono tables se seedhe default_title aur default_message uthayega
      resTitle = content.default_title || content.title_en || content.title_hi;
      resMsg = content.default_message || content.message_en || content.message_hi;
      resCta = content.cta_text || content.cta_en || content.cta_hi || "Celebrate";
    }

    // Safety fallback block
    if (!resTitle) resTitle = "Untitled Broadcast";
    if (!resMsg) resMsg = "No content available.";
    if (!resCta) resCta = "Celebrate";

    // UPSERT LOGIC
    const existingBroadcast = await client.query(
      `SELECT id FROM broadcasts WHERE festival_key = $1 LIMIT 1`,
      [resolvedFestivalKey]
    );

    let result;
    const activeStatus = forceActive ? 'active' : 'draft';

    // Agar naya broadcast ACTIVE ban raha hai, toh baki sabhi ko automatic stop karein
    if (activeStatus === 'active') {
      await client.query(
        `
        UPDATE broadcasts
        SET is_active=false, status='stopped', manual_stop=true, updated_at=NOW()
        WHERE festival_key != $1
        `,
        [resolvedFestivalKey]
      );
    }

    // UPDATE if exists
    if (existingBroadcast.rows.length > 0) {
      result = await client.query(
        `
        UPDATE broadcasts
        SET
          title=$1,
          message=$2,
          language_mode=$3,
          hero_visual=$4,
          hero_config=$5,
          theme_config=$6,
          image_url=$7,
          animation_theme=$8,
          theme_color=$9,
          resolved_title=$10,
          resolved_message=$11,
          resolved_cta=$12,
          preview_mode=true,
          is_active=true,
          status=$14,
          updated_at=NOW()
        WHERE id=$13
        RETURNING *;
        `,
        [
          resTitle,
          resMsg,
          language_mode,
          normalizedHeroConfig.visual_key,
          JSON.stringify(normalizedHeroConfig),
          JSON.stringify(normalizedThemeConfig),
          mediaConfig.web_image || null,
          normalizedHeroConfig.animation,
          finalThemeColor,
          resTitle,             // $10 resolved_title
          resMsg,               // $11 resolved_message
          resCta,               // $12 resolved_cta (Correct Translation!)
          existingBroadcast.rows[0].id,
          activeStatus
        ]
      );
    } else {
      // First time insert
      result = await client.query(
        `
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
          status,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,
          true,
          true,
          'AUTO',
          $14,
          NOW()
        )
        RETURNING *;
        `,
        [
          resTitle,
          resMsg,
          resolvedFestivalKey,
          language_mode,
          normalizedHeroConfig.visual_key,
          JSON.stringify(normalizedHeroConfig),
          JSON.stringify(normalizedThemeConfig),
          mediaConfig.web_image || null,
          normalizedHeroConfig.animation,
          finalThemeColor,
          resTitle,             // $11 resolved_title (index shift handled correctly)
          resMsg,               // $12 resolved_message
          resCta,               // $13 resolved_cta (Correct Translation!)
          activeStatus
        ]
      );
    }

    await client.end();

    return NextResponse.json({ 
      success: true, 
      action: forceActive ? 'start' : 'generate', 
      data: result.rows[0] 
    });

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
