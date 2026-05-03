import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('admin_session');

    if (!cookie) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const session = JSON.parse(cookie.value);

    return NextResponse.json({
      success: true,
      session
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
