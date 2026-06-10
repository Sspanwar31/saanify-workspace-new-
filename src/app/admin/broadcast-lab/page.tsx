import { NextResponse } from 'next/server';
import { Client } from 'pg';

const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
};

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    const { festival_key, language_mode, preview_mode } = body;
    client = await getDbClient();

    if (!client) return NextResponse.json({ error: 'DB Connection Failed' }, { status: 500 });

    // 🚀 STEP 1: Determine if it's a Corporate Update or a Festival
    const corporateTypes = ['ANNOUNCEMENT', 'SYSTEM_UPDATE', 'SPECIAL_OFFER', 'MAINTENANCE', 'EMERGENCY', 'EVENT'];
    
    // Yahan check kar rahe hain ki kya jo key aayi hai wo corporate type mein hai?
    const isCorporate = corporateTypes.includes(festival_key);

    let finalAssets: any = {};
    let finalTitle = "";
    let finalMsg = "";

    if (isCorporate) {
      // ━━━ PATH A: CORPORATE UPDATES ━━━
      
      // 1. Corporate Database table se assets (animation, colors) nikalo
      const assetRes = await client.query('SELECT * FROM broadcast_assets WHERE broadcast_type = $1 LIMIT 1', [festival_key]);
      finalAssets = assetRes.rows[0] || {};
      
      // 2. 🚀 CRITICAL FIX: Hardcoded Corporate Messages
      // Kyunki corporate message database ke 'festival_messages' table mein nahi hote.
      const corporateMsgs: any = {
        SYSTEM_UPDATE: { t: "New System Update 🚀", m: "We have upgraded our servers for a faster experience. | Humne system ko behtar banaya hai." },
        MAINTENANCE: { t: "Maintenance Alert ⚙️", m: "We are performing routine maintenance for better stability. | System ki safai chal rahi hai." },
        EMERGENCY: { t: "Emergency Alert ⚠️", m: "Please take immediate note of this critical system message. | Mahatvapurn suchna." },
        SPECIAL_OFFER: { t: "Exclusive Offer 🎁", m: "Unlock premium features at special prices today! | Naye offers ka labh uthayein." },
        ANNOUNCEMENT: { t: "Announcement 📢", m: "Important update for all society members. Check details below. | Sabhi ke liye sandesh." }
      };

      // 3. Set Final Message based on type
      const msg = corporateMsgs[festival_key] || corporateMsgs.ANNOUNCEMENT;
      finalTitle = msg.t;
      finalMsg = msg.m;

    } else {
      // ━━━ PATH B: FESTIVALS ━━━
      const msgRes = await client.query('SELECT * FROM festival_messages WHERE festival_key = $1 LIMIT 1', [festival_key]);
      const assetRes = await client.query('SELECT * FROM festival_assets WHERE festival_key = $1 LIMIT 1', [festival_key]);
      
      if (!msgRes.rows.length) throw new Error(`Message not found for ${festival_key}`);
      
      const festMsg = msgRes.rows[0];
      finalAssets = assetRes.rows[0] || {};
      
      if (language_mode === 'HI') {
        finalTitle = festMsg.title_hi || festMsg.default_title;
        finalMsg = festMsg.message_hi || festMsg.default_message;
      } else if (language_mode === 'EN') {
        finalTitle = festMsg.title_en || festMsg.default_title;
        finalMsg = festMsg.message_en || festMsg.default_message;
      } else {
        finalTitle = (festMsg.title_hi || '') + " | " + (festMsg.title_en || '');
        finalMsg = (festMsg.message_hi || '') + " | " + (festMsg.message_en || '');
      }
    }

    // 🚀 STEP 2: MASTER INSERT INTO BROADCASTS TABLE
    const insertQuery = `
      INSERT INTO broadcasts (
        title, message, festival_key, type, style, theme_color,
        hero_visual, animation_theme, layout_template,
        resolved_title, resolved_message, is_active, 
        hero_enabled, preview_mode, created_at, content_mode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true, $12, NOW(), 'AUTO')
      RETURNING *;
    `;

    const values = [
      finalTitle,
      finalMsg,
      festival_key,
      isCorporate ? 'INFO' : 'FESTIVAL',
      isCorporate ? 'BANNER' : 'POPUP',
      finalAssets.theme_color || '#2563EB',
      finalAssets.hero_visual || 'GEAR_ICON',
      finalAssets.animation_theme || 'NONE',
      finalAssets.layout_template || 'CORPORATE_BANNER',
      finalTitle,
      finalMsg,
      preview_mode ?? true
    ];

    const result = await client.query(insertQuery, values);
    await client.end();

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    if (client) await client.end();
    console.error("Lab API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
