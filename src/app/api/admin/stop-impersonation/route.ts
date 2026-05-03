import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true
  });

  // ✅ UPDATED LOGIC: Clear Impersonation Cookies
  response.cookies.set('impersonation_active', '', { 
    maxAge: 0,
    path: '/' 
  });
  response.cookies.set('impersonated_client_id', '', { 
    maxAge: 0,
    path: '/' 
  });

  return response;
}
