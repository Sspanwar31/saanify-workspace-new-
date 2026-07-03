import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

const getDbClient = async (appName: string = 'API_Broadcast_Lab') => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL missing');
  
  const urlWithAppName = connectionString.includes('?') 
    ? `${connectionString}&application_name=${appName}`
    : `${connectionString}?application_name=${appName}`;

  const client = new Client({
    connectionString: urlWithAppName,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
};

// ━━━ 1. GET: Keys, types, aur schedules (List Planner) fetch karein ━━━
export async function GET(req: Request) {
  let client: Client | null = null;
  try {
    const url = new URL(req.url);
    const actionParam = url.searchParams.get('action');

    // Planner Grid ke liye saved schedules ki list return karein
    if (actionParam === 'get_schedules' || actionParam === 'list_schedules') {
      client = await getDbClient('API_System_Health');
      const res = await client.query(
        `SELECT * FROM broadcasts WHERE starts_at IS NOT NULL ORDER BY starts_at ASC`
      );
      await client.end();
      return NextResponse.json({ schedules: res.rows });
    }

    client = await getDbClient('API_System_Health');
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

// ━━━ 2. POST: operations handle karein ━━━
export async function POST(req: Request) {
  let client: Client | null = null;

  try {
    const body = await req.json();
    
    console.log("📥 POST API BODY RECEIVED:", JSON.stringify(body, null, 2));

    client = await getDbClient('API_Broadcast_Lab');

    let festivalKey = body.festival_key;
    let broadcastType = body.broadcast_type;
    const language_mode = body.language_mode || 'BOTH';
    const action = body.action || 'generate';
    const broadcastMode = action === 'start' ? 'MANUAL' : 'SCHEDULED';
    const broadcastId = body.id;

    // 🚀 FAILSAFE: Agar ID aa rahi hai par Key gayab hai (shceduler trigger), to use DB se khud dhoondh lein
    if (broadcastId && !festivalKey && !broadcastType) {
      const rowRes = await client.query(
        'SELECT festival_key, category FROM broadcasts WHERE id = $1 LIMIT 1', 
        [broadcastId]
      );
      if (rowRes.rows.length > 0) {
        const row = rowRes.rows[0];
        if (row.category === 'CORPORATE') {
          broadcastType = row.festival_key;
        } else {
          festivalKey = row.festival_key;
        }
      }
    }

    // Consistent targetKey Resolution
    const targetKey = broadcastType || festivalKey;

    // ============================================
    // THE ACTUAL FIX - 3 CHECKS
    // ============================================
    let heroEnabled = false;
    
    if (body.hero_enabled === true) {
      heroEnabled = true;
    }
    
    if (body.full_screen_animation === true) {
      heroEnabled = true;
    }
    
    if (!heroEnabled && body.overlay) {
      const overlayStr = String(body.overlay).toLowerCase().replace(/\s+/g, '_');
      if (['full_anim', 'fullanim', 'full_anim'].includes(overlayStr)) {
        heroEnabled = true;
      }
    }
    // ============================================

    // Master fallback theme colors map (24 Festivals)
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

    // A. DELETE ALL ACTION
    if (action === 'delete_all') {
      await client.query(`DELETE FROM broadcasts`);
      await client.end();
      return NextResponse.json({
        success: true,
        action: 'delete_all',
        message: 'All broadcasts cleared successfully'
      });
    }

    // B. SINGLE DELETE SCHEDULE ACTION
    if (action === 'delete_schedule') {
      const scheduleId = body.id;
      const result = await client.query('DELETE FROM broadcasts WHERE id = $1 RETURNING *', [scheduleId]);
      await client.end();
      return NextResponse.json({ success: true, action: 'delete_schedule', data: result.rows[0] || null });
    }

    // C. SAVE ALL SCHEDULES ACTION
    if (action === 'save_schedules') {
      const schedulesArray = body.schedules || [];
      const debugLog: string[] = [];
      let insertedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < schedulesArray.length; i++) {
        const item = schedulesArray[i];
        const category = item.category === 'CORPORATE' ? 'CORPORATE' : 'FESTIVAL';
        const key = category === 'CORPORATE' ? item.broadcast_type : item.festival_key;
        const startsAt = item.starts_at;
        const endsAt = item.ends_at;

        debugLog.push(`[Row ${i}] category=${category}, key="${key}", starts="${startsAt}", ends="${endsAt}"`);

        if (!key) { skippedCount++; continue; }
        if (!startsAt || !endsAt) { skippedCount++; continue; }

        let asset, content;

        if (category === 'CORPORATE') {
          const assetRes = await client.query('SELECT * FROM broadcast_assets WHERE broadcast_type = $1 LIMIT 1', [key]);
          asset = assetRes.rows[0];
          const msgRes = await client.query('SELECT * FROM broadcast_messages WHERE broadcast_type = $1 LIMIT 1', [key]);
          content = msgRes.rows[0];
        } else {
          // 🚀 FIXED: scoping bug completely fixed
          const assetRes = await client.query('SELECT * FROM festival_assets_v2 WHERE festival_key = $1 LIMIT 1', [key]);
          asset = assetRes.rows[0];
          const msgRes = await client.query('SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1', [key]);
          content = msgRes.rows[0];
        }

        if (!content || !asset) {
          if (!asset) {
            asset = {
              theme_config: { primary_color: '#fbbf24', background_style: 'DARK_GOLD' },
              hero_config: { render_type: 'COMPONENT', visual_key: 'ROYAL_DIYA', animation: 'GOLDEN_PARTICLES', scale: 1.2, speed: 4 },
              media_config: { web_image: null }
            };
          }
          if (!content) {
            content = {
              default_title: key.replace(/_/g, ' '),
              default_message: `${key.replace(/_/g, ' ')} broadcast scheduled.`,
              cta_text: 'View'
            };
          }
        }

        const themeConfig = typeof asset.theme_config === 'string' ? JSON.parse(asset.theme_config) : (asset.theme_config || {});
        const heroConfig = typeof asset.hero_config === 'string' ? JSON.parse(asset.hero_config) : (asset.hero_config || {});
        const mediaConfig = typeof asset.media_config === 'string' ? JSON.parse(asset.media_config) : (asset.media_config || {});

        // 🚀 FIXED: Aligned Color Priority (DB color first, Master map fallback next)
        const finalThemeColor = themeConfig.primary_color || MASTER_THEME_MAP[key] || '#fbbf24';

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

        const resTitle = content.default_title || content.title_en || key.replace(/_/g, ' ');
        const resMsg = content.default_message || content.message_en || `${key.replace(/_/g, ' ')} broadcast.`;
        const resCta = content.cta_text || content.cta_en || 'Celebrate';

        const existing = await client.query(
          `SELECT id FROM broadcasts WHERE festival_key = $1 AND category = $2 AND broadcast_mode = 'SCHEDULED' LIMIT 1`,
          [key, category]
        );

        try {
          if (existing.rows.length > 0) {
            await client.query(
              `UPDATE broadcasts SET
                category=$1, title=$2, message=$3, hero_visual=$4, hero_config=$5, theme_config=$6,
                image_url=$7, animation_theme=$8, theme_color=$9, resolved_title=$10, resolved_message=$11,
                resolved_cta=$12, starts_at=$13, ends_at=$14, is_active=true, status='scheduled', 
                broadcast_mode='SCHEDULED', manual_stop=false, updated_at=NOW()
              WHERE id=$15;`,
              [
                category, resTitle, resMsg, normalizedHeroConfig.visual_key, JSON.stringify(normalizedHeroConfig), JSON.stringify(normalizedThemeConfig),
                mediaConfig.web_image || null, normalizedHeroConfig.animation, finalThemeColor, resTitle, resMsg,
                resCta, startsAt, endsAt, existing.rows[0].id
              ]
            );
            debugLog.push(`[Row ${i}] ✅ UPDATED id=${existing.rows[0].id}`);
          } else {
            const insertRes = await client.query(
              `INSERT INTO broadcasts (
                category, title, message, festival_key, hero_visual, hero_config, theme_config,
                image_url, animation_theme, theme_color, resolved_title, resolved_message,
                resolved_cta, starts_at, ends_at, is_active, status, broadcast_mode, manual_stop, 
                hero_enabled, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, 'scheduled', 
                'SCHEDULED', false, false, NOW()) RETURNING id;`,
              [
                category, resTitle, resMsg, key, normalizedHeroConfig.visual_key, JSON.stringify(normalizedHeroConfig), JSON.stringify(normalizedThemeConfig),
                mediaConfig.web_image || null, normalizedHeroConfig.animation, finalThemeColor, resTitle, resMsg,
                resCta, startsAt, endsAt
              ]
            );
            debugLog.push(`[Row ${i}] ✅ INSERTED id=${insertRes.rows[0]?.id}`);
          }
          insertedCount++;
        } catch (dbErr: any) {
          debugLog.push(`[Row ${i}] ❌ ERROR: ${dbErr.message}`);
          errorCount++;
        }
      }

      await client.end();
      return NextResponse.json({ 
        success: true, 
        action: 'save_schedules',
        debug: { total: schedulesArray.length, inserted: insertedCount, skipped: skippedCount, errors: errorCount, log: debugLog }
      });
    }

    const isSchedulerAction = ['save_schedules', 'delete_schedule', 'delete_all'].includes(action);
    if (!targetKey && !isSchedulerAction) {
      throw new Error("festival_key or broadcast_type is required");
    }

    let forceActive = false;

    // ━━━ START ACTION ━━━
    if (action === 'start') {
      await client.query(
        `UPDATE broadcasts SET is_active=false, status='stopped', manual_stop=true, updated_at=NOW() WHERE broadcast_mode='MANUAL' AND festival_key != $1`,
        [targetKey]
      );

      let existing;

      if (broadcastId) {
        existing = await client.query(`SELECT * FROM broadcasts WHERE id=$1 LIMIT 1`, [broadcastId]);
      } else {
        existing = await client.query(`SELECT * FROM broadcasts WHERE festival_key=$1 AND broadcast_mode='MANUAL' LIMIT 1`, [targetKey]);
      }

      forceActive = true;
    }

    // ━━━ STOP ACTION ━━━
    if (action === 'stop') {
      let result;

      if (broadcastId) {
        result = await client.query(
          `UPDATE broadcasts SET status='stopped', is_active=false, manual_stop=true, updated_at=NOW() WHERE id=$1 RETURNING *;`,
          [broadcastId]
        );
      } else {
        result = await client.query(
          `UPDATE broadcasts SET status='stopped', is_active=false, manual_stop=true, updated_at=NOW() WHERE festival_key=$1 AND broadcast_mode='MANUAL' RETURNING *;`,
          [targetKey]
        );
      }

      await client.end();
      return NextResponse.json({ success: true, action: 'stop', data: result.rows[0] || null });
    }

    // ━━━ DELETE ACTION ━━━
    if (action === 'delete') {
      let result;

      if (broadcastId) {
        result = await client.query(`DELETE FROM broadcasts WHERE id=$1 RETURNING *`, [broadcastId]);
      } else {
        result = await client.query(`DELETE FROM broadcasts WHERE festival_key=$1 AND broadcast_mode='MANUAL' RETURNING *`, [targetKey]);
      }

      await client.end();
      return NextResponse.json({ success: true, action: 'delete', data: result.rows[0] || null });
    }

    // ━━━ GENERATE LOGIC ━━━
    let asset, content, resolvedFestivalKey;

    const corpCheck = await client.query(
      'SELECT * FROM broadcast_assets WHERE broadcast_type = $1 LIMIT 1',
      [targetKey]
    );

    if (corpCheck.rows.length > 0) {
      asset = corpCheck.rows[0];
      const msgRes = await client.query('SELECT * FROM broadcast_messages WHERE broadcast_type = $1 LIMIT 1', [targetKey]);
      content = msgRes.rows[0];
      resolvedFestivalKey = targetKey; 
    } else {
      const assetResult = await client.query(`SELECT * FROM festival_assets_v2 WHERE festival_key = $1 LIMIT 1`, [festivalKey]);
      asset = assetResult.rows[0];
      const messageResult = await client.query(`SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1`, [festivalKey]);
      content = messageResult.rows[0];
      resolvedFestivalKey = festivalKey;
    }

    if (!content) throw new Error(`Data not found in DB for: ${targetKey}`);

    const themeConfig = typeof asset?.theme_config === 'string' ? JSON.parse(asset.theme_config) : (asset?.theme_config || {});
    const heroConfig = typeof asset?.hero_config === 'string' ? JSON.parse(asset.hero_config) : (asset?.hero_config || {});
    const mediaConfig = typeof asset?.media_config === 'string' ? JSON.parse(asset.media_config) : (asset?.media_config || {});

    // 🚀 FIXED: Dynamic Color Priority (DB theme_config first, MASTER_THEME_MAP fallback next)
    const finalThemeColor = themeConfig.primary_color || MASTER_THEME_MAP[resolvedFestivalKey] || '#fbbf24';

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

    // Aligned Language Resolution
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
      resTitle = content.default_title || content.title_en || content.title_hi;
      resMsg = content.default_message || content.message_en || content.message_hi;
      resCta = content.cta_text || content.cta_en || content.cta_hi || "Celebrate";
    }

    if (!resTitle) resTitle = "Untitled Broadcast";
    if (!resMsg) resMsg = "No content available.";
    if (!resCta) resCta = "Celebrate";

    const existingBroadcast = await client.query(
      `SELECT id FROM broadcasts WHERE festival_key = $1 AND broadcast_mode = $2 LIMIT 1`,
      [resolvedFestivalKey, broadcastMode]
    );

    let result;
    const activeStatus = forceActive ? 'active' : 'draft';
    const resolvedCategory = corpCheck.rows.length > 0 ? 'CORPORATE' : 'FESTIVAL';

    if (activeStatus === 'active') {
      await client.query(
        `UPDATE broadcasts SET is_active=false, status='stopped', manual_stop=true, updated_at=NOW() WHERE broadcast_mode='MANUAL' AND festival_key != $1`,
        [resolvedFestivalKey]
      );
    }

    if (existingBroadcast.rows.length > 0) {
      result = await client.query(
        `UPDATE broadcasts SET
          title=$1, message=$2, language_mode=$3, hero_visual=$4, hero_config=$5,
          theme_config=$6, image_url=$7, animation_theme=$8, theme_color=$9, resolved_title=$10,
          resolved_message=$11, resolved_cta=$12, preview_mode=true, is_active=true, status=$14,
          broadcast_mode=$15, category=$16, manual_stop=$17, hero_enabled=$18,
          updated_at=NOW()
        WHERE id=$13
        RETURNING *;`,
        [
          resTitle, resMsg, language_mode, normalizedHeroConfig.visual_key, JSON.stringify(normalizedHeroConfig),
          JSON.stringify(normalizedThemeConfig), mediaConfig.web_image || null, normalizedHeroConfig.animation, finalThemeColor,
          resTitle, resMsg, resCta, existingBroadcast.rows[0].id, activeStatus, broadcastMode, resolvedCategory,
          forceActive ? false : true,
          heroEnabled
        ]
      );
    } else {
      result = await client.query(
        `INSERT INTO broadcasts (
          title, message, festival_key, language_mode, hero_visual, hero_config,
          theme_config, image_url, animation_theme, theme_color, resolved_title, resolved_message,
          resolved_cta, preview_mode, is_active, content_mode, status, broadcast_mode, category, 
          manual_stop, hero_enabled, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, true, 'AUTO', $14, $15, $16, $17, $18, NOW())
        RETURNING *;`,
        [
          resTitle, resMsg, resolvedFestivalKey, language_mode, normalizedHeroConfig.visual_key, JSON.stringify(normalizedHeroConfig),
          JSON.stringify(normalizedThemeConfig), mediaConfig.web_image || null, normalizedHeroConfig.animation, finalThemeColor,
          resTitle, resMsg, resCta, activeStatus, broadcastMode, resolvedCategory,
          forceActive ? false : true,
          heroEnabled
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
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
