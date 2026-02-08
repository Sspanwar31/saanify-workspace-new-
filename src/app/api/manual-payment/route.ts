import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ IMPORTANT: Buffer use karne ke liye Node environment jaruri hai
export const runtime = 'nodejs';

// 🔐 KEY FIXING LOGIC (Admin Power)
const getServiceRoleKey = () => {
const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

// ❌ Agar key nahi hai to ERROR throw karo, Anon key mat use karo
if (!b64) {
console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY_B64 is missing");
throw new Error("Server Configuration Error: Admin Key Missing");
}

// ✅ Sahi Decoding Logic (Jo Admin API me use kiya)
try {
// Agar pehle se eyJ... hai to wahi use karo
if (b64.trim().startsWith('eyJ')) return b64.trim();

// Nahi to decode karo
return Buffer.from(b64, 'base64').toString('utf-8').trim();
} catch (e) {
return b64; // Fallback
}
};

export async function POST(req: Request) {
try {
const serviceKey = getServiceRoleKey();

// 👑 Admin Client (RLS Bypass karega)
const supabaseAdmin = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
serviceKey,
{
auth: {
autoRefreshToken: false,
persistSession: false // Admin mode ON
}
}
);

const { clientId, planName, amount, transactionId, screenshotUrl, durationDays } = await req.json();

if (!clientId || !amount || !transactionId) {
return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}

// 🛠️ SCREENSHOT URL FIXER (Ye code image ko sahi karega)
let finalScreenshotUrl = screenshotUrl;

// Case 1: Agar object aa gaya ({ publicUrl: '...' })
if (typeof screenshotUrl === 'object' && screenshotUrl?.publicUrl) {
finalScreenshotUrl = screenshotUrl.publicUrl;
}
// Case 2: Agar JSON String aa gayi ('{"publicUrl": "..."}')
else if (typeof screenshotUrl === 'string' && screenshotUrl.trim().startsWith('{')) {
try {
const parsed = JSON.parse(screenshotUrl);
if (parsed.publicUrl) finalScreenshotUrl = parsed.publicUrl;
} catch (e) {
// Parsing fail hui to original string hi rahne do
}
}

console.log("Processing Manual Payment:", { clientId, transactionId, finalScreenshotUrl });

// ✅ STEP 1: Duplicate Check
const { data: existingOrder } = await supabaseAdmin
.from('subscription_orders')
.select('id, status')
.eq('client_id', clientId)
.eq('payment_method', 'manual')
.in('status', ['pending', 'approved'])
.maybeSingle();

if (existingOrder) {
return NextResponse.json(
{
error: existingOrder.status === 'approved'
? 'Payment already approved'
: 'Payment already pending verification'
},
{ status: 400 }
);
}

// ✅ STEP 2: Insert (RLS Bypass ke sath)
const { data, error } = await supabaseAdmin
.from('subscription_orders')
.insert([{
client_id: clientId,
plan_name: planName,
amount,
payment_method: 'manual', // lowercase
status: 'pending',
transaction_id: transactionId,
screenshot_url: finalScreenshotUrl, // ✅ Fixed URL
duration_days: durationDays || 30 // Duration bhi add kar diya
}])
.select()
.single();

if (error) {
console.error("Insert Failed:", error);
throw error;
}

return NextResponse.json({
success: true,
message: 'Payment submitted for verification',
orderId: data.id
});

} catch (error: any) {
console.error("Manual Payment API Error:", error);
// Client ko readable error bhejo
return NextResponse.json(
{ error: error.message || "Internal Server Error" },
{ status: 500 }
);
}
}
