import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    report: "Environment Variable Diagnostic",
    timestamp: new Date().toISOString(),
    checks: {
      SUPABASE_URL: {
        defined: !!url,
        value: url // Safe to show
      },
      ANON_KEY: {
        defined: !!anonKey,
        length: anonKey?.length || 0,
        starts_with_ey: anonKey?.startsWith('ey')
      },
      SERVICE_ROLE_KEY: {
        defined: !!serviceKey,
        length: serviceKey?.length || 0,
        starts_with_ey: serviceKey?.startsWith('ey'),
        // CRITICAL CHECK: Did we accidentally paste the Anon Key here?
        is_duplicate_of_anon: serviceKey === anonKey 
      }
    }
  });
}