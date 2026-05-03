import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('admin_session');

    // ✅ FIX 1: NEVER send 401 here
    if (!cookie) {
      return NextResponse.json({
        isImpersonating: false
      });
    }

    // ✅ FIX 2: safe parse
    let session = null;
    try {
      session = JSON.parse(cookie.value);
    } catch {
      session = null;
    }

    // ✅ FIX 3: extra safety
    if (!session) {
      return NextResponse.json({
        isImpersonating: false
      });
    }

    return NextResponse.json({
      isImpersonating: true,
      adminSession: session
    });

  } catch (err) {
    return NextResponse.json({
      isImpersonating: false
    });
  }
}
