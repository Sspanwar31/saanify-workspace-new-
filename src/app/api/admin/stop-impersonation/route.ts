import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  // ✅ clear impersonation flags ONLY
  response.cookies.set('impersonation_active', '', {
    ...cookieOptions,
    expires: new Date(0),
  });

  response.cookies.set('impersonated_client_id', '', {
    ...cookieOptions,
    expires: new Date(0),
  });

  response.cookies.set('impersonation_token', '', {
    ...cookieOptions,
    expires: new Date(0),
  });

  // ❌ DO NOT clear Supabase session here

  return response;
}
