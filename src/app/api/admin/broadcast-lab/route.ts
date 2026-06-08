import { NextResponse } from 'next/server';
import { Client } from 'pg';

const getDbClient = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL missing');
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();
  return client;
};

export async function POST(req: Request) {
  let client: Client | null = null;

  try {
    const body = await req.json();

    client = await getDbClient();

    // Step 1: Sirf ye lo request body se
    const festivalKey = body.festival_key;
    const language_mode = body.language_mode;
    const full_screen_animation = body.full_screen_animation;
    const dashboard_overlay = body.dashboard_overlay;

    // Step 2: festival_assets se data fetch karo
    const assetResult = await client.query(
      `
      SELECT *
      FROM festival_assets
      WHERE festival_key = $1
      LIMIT 1
      `,
      [festivalKey]
    );

    const asset = assetResult.rows[0];

    // Step 3: festival_messages se content fetch karo
    const messageResult = await client.query(
      `
      SELECT *
      FROM festival_messages
      WHERE festival_key = $1
      LIMIT 1
      `,
      [festivalKey]
    );

    const festivalMessage = messageResult.rows[0];

    // Problem 1 Fix: Language Logic
    let title;
    let message;

    if (language_mode === 'HI') {
      title = festivalMessage?.title_hi || 'Greeting';
      message = festivalMessage?.message_hi || 'Wishing you happiness';
    }
    else if (language_mode === 'EN') {
      title = festivalMessage?.title_en || 'Greeting';
      message = festivalMessage?.message_en || 'Wishing you happiness';
    }
    else {
      title = festivalMessage?.default_title || 'Greeting';
      message = festivalMessage?.default_message || 'Wishing you happiness';
    }

    // Step 4: broadcasts table me automation data save karo
    const insertQuery = `
      INSERT INTO broadcasts (
        title,
        message,
        festival_key,
        language_mode,
        full_screen_animation,
        dashboard_overlay,
        hero_visual,
        animation_theme,
        theme_color,
        resolved_title,
        resolved_message,
        preview_mode,
        is_active,
        auto_generated,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        true,
        true,
        false,
        NOW()
      )
      RETURNING *;
    `;

    const values = [
      title,
      message,
      festivalKey,
      language_mode,
      full_screen_animation,
      dashboard_overlay,
      asset?.hero_visual || null,
      asset?.animation_theme || 'NONE',
      asset?.theme_color || 'DEFAULT',
      title, // resolved_title
      message // resolved_message
    ];

    const result = await client.query(
      insertQuery,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Broadcast Lab Entry Created via Automation',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Broadcast Lab Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}
