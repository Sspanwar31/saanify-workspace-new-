import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('admin_session');

    if (!cookie) {
      return NextResponse.json({
        isImpersonating: false
      }, { status: 401 });
    }

    const session = JSON.parse(cookie.value);

    return NextResponse.json({
      isImpersonating: true,
      adminSession: session
    });

  } catch (err) {
    return NextResponse.json({
      isImpersonating: false
    }, { status: 500 });
  }
}
