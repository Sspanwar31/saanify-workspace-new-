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

    const title = body.title || 'Broadcast Lab';
    const message = body.message || 'Testing Broadcast';
    const festivalKey = body.festival_key || 'GENERAL';

    const animationType = body.animation_type || 'NONE';
    const displayMode = body.display_mode || 'POPUP';

    const themeColor = body.theme_color || 'DEFAULT';
    const targetAudience = body.target_audience || 'BOTH';

    const imageUrl = body.image_url || null;

    const ctaText = body.cta_text || null;
    const ctaLink = body.cta_link || null;

    const startsAt = body.starts_at || null;
    const endsAt = body.ends_at || null;

    const insertQuery = `
      INSERT INTO broadcasts (
        title,
        message,
        type,
        style,
        festival_key,
        animation_theme,
        theme_color,
        target_audience,
        background_image,
        cta_text,
        cta_link,
        starts_at,
        ends_at,
        is_active,
        auto_generated,
        created_at
      )
      VALUES (
        $1,
        $2,
        'LAB',
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        true,
        false,
        NOW()
      )
      RETURNING *;
    `;

    const values = [
      title,
      message,
      displayMode,
      festivalKey,
      animationType,
      themeColor,
      targetAudience,
      imageUrl,
      ctaText,
      ctaLink,
      startsAt,
      endsAt,
    ];

    const result = await client.query(
      insertQuery,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Broadcast Lab Entry Created',
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
