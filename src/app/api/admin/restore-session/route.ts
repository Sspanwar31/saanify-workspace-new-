import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const adminSession = req.cookies.get('admin_session')?.value;

  if (!adminSession) {
    return NextResponse.json({ error: 'No session found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    session: JSON.parse(adminSession),
  });
}
