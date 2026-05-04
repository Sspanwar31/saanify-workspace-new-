import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // ✅ Get admin session cookie
    const cookie = req.cookies.get('admin_session');

    // 🔴 No session → safe response
    if (!cookie) {
      return NextResponse.json({
        isImpersonating: false,
        adminSession: null,
      }, { status: 200 });
    }

    let session: any = null;

    try {
      session = JSON.parse(cookie.value);
    } catch (e) {
      // ❌ corrupted cookie → clean exit
      return NextResponse.json({
        isImpersonating: false,
        adminSession: null,
      }, { status: 200 });
    }

    // ✅ SAFE DEFAULT STRUCTURE
    const response = NextResponse.json({
      isImpersonating: session?.isImpersonating === true,
      adminSession: session ?? null,
      originalAdminId: session?.originalAdminId ?? null,
      currentClientId: session?.client_id ?? null,
    });

    return response;

  } catch (err) {
    return NextResponse.json({
      isImpersonating: false,
      adminSession: null,
    }, { status: 500 });
  }
}
