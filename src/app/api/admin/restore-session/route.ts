import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('admin_session');

    console.log("🍪 RAW COOKIE:", cookie);

    if (!cookie) {
      console.log("❌ NO COOKIE FOUND");
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const session = JSON.parse(cookie.value);

    console.log("✅ SESSION PARSED:", !!session);

    return NextResponse.json({
      success: true,
      session
    });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
