import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('admin_session');

    // ✅ FIX 1: NEVER send 401 here
    if (!cookie) {
      return NextResponse.json({
        isImpersonating: false
      }, { status: 200 });
    }

    const session = JSON.parse(cookie.value);

    // ✅ FIX 2: Sirf tab true agar cookie mein flag set hai
    return NextResponse.json({
      isImpersonating: session?.isImpersonating === true,
      adminSession: session
    });

  } catch (err) {
    return NextResponse.json({
      isImpersonating: false
    }, { status: 500 });
  }
}
