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

```
client = await getDbClient();

if (!client) {
  return NextResponse.json(
    { error: 'DB Connection Failed' },
    { status: 500 }
  );
}

const festivalKey = body.festival_key;

// 1. Message
const messageResult = await client.query(
  `
  SELECT *
  FROM festival_messages
  WHERE festival_key = $1
  LIMIT 1
  `,
  [festivalKey]
);

if (!messageResult.rows.length) {
  throw new Error(`Festival message not found: ${festivalKey}`);
}

const festivalMessage = messageResult.rows[0];

// 2. Mapping
const mappingResult = await client.query(
  `
  SELECT *
  FROM festival_mappings
  WHERE festival_key = $1
  LIMIT 1
  `,
  [festivalKey]
);

const festivalCategory =
  mappingResult.rows[0]?.festival_category ?? null;

// 3. Template
const templateResult = await client.query(
  `
  SELECT *
  FROM festival_templates
  WHERE festival_category = $1
  LIMIT 1
  `,
  [festivalCategory]
);

const template = templateResult.rows[0] ?? {};

// 4. Assets
const assetResult = await client.query(
  `
  SELECT *
  FROM festival_assets
  WHERE festival_key = $1
  LIMIT 1
  `,
  [festivalKey]
);

const asset = assetResult.rows[0] ?? {};

// Language
const languageMode = body.language_mode ?? 'BOTH';

let resolvedTitle = festivalMessage.default_title;
let resolvedMessage = festivalMessage.default_message;
let resolvedCta = festivalMessage.cta_text;

if (languageMode === 'HI') {
  resolvedTitle =
    festivalMessage.title_hi ||
    festivalMessage.default_title;

  resolvedMessage =
    festivalMessage.message_hi ||
    festivalMessage.default_message;

  resolvedCta =
    festivalMessage.cta_hi ||
    festivalMessage.cta_text;
}

if (languageMode === 'EN') {
  resolvedTitle =
    festivalMessage.title_en ||
    festivalMessage.default_title;

  resolvedMessage =
    festivalMessage.message_en ||
    festivalMessage.default_message;

  resolvedCta =
    festivalMessage.cta_en ||
    festivalMessage.cta_text;
}

if (languageMode === 'BOTH') {
  resolvedTitle =
    `${festivalMessage.title_hi || ''}\n\n${festivalMessage.title_en || ''}`;

  resolvedMessage =
    `${festivalMessage.message_hi || ''}\n\n${festivalMessage.message_en || ''}`;

  resolvedCta =
    festivalMessage.cta_hi ||
    festivalMessage.cta_text;
}

const insertResult = await client.query(
  `
  INSERT INTO broadcasts
  (
    title,
    message,

    type,
    style,

    festival_key,
    festival_category,

    hero_visual,
    animation_theme,
    layout_template,

    theme_color,

    cta_text,

    language_mode,

    resolved_title,
    resolved_message,
    resolved_cta,

    hero_enabled,
    auto_generated,

    is_active,

    background_image,
    mobile_image,
    web_image,

    video_url,
    lottie_file,

    full_screen_animation,
    dashboard_overlay,

    created_at
  )
  VALUES
  (
    $1,$2,

    'FESTIVAL',
    'POPUP',

    $3,$4,

    $5,$6,$7,

    $8,

    $9,

    $10,

    $11,$12,$13,

    true,
    true,

    true,

    $14,$15,$16,

    $17,$18,

    $19,$20,

    NOW()
  )
  RETURNING *
  `,
  [
    resolvedTitle,
    resolvedMessage,

    festivalKey,
    festivalCategory,

    asset.hero_visual || template.hero_visual,
    asset.animation_theme || template.animation_theme,
    template.layout_template,

    asset.theme_color ||
      festivalMessage.theme_color,

    resolvedCta,

    languageMode,

    resolvedTitle,
    resolvedMessage,
    resolvedCta,

    asset.background_image,
    asset.mobile_image,
    asset.web_image,

    asset.video_url,
    asset.lottie_file,

    asset.full_screen_animation ?? false,
    asset.dashboard_overlay ?? false
  ]
);

await client.end();

return NextResponse.json({
  success: true,
  data: insertResult.rows[0]
});
```

} catch (error: any) {
if (client) await client.end();

```
return NextResponse.json(
  {
    error: error.message
  },
  {
    status: 500
  }
);
```

}
}
