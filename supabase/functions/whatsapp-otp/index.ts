/*
 * WhatsApp OTP Edge Function
 * 
 * Simulates WhatsApp OTP delivery for store registration/activation.
 * In production, this would integrate with either:
 *   Option A: Meta WhatsApp Cloud API (1,000 free monthly messages)
 *   Option B: whatsapp-web.js / Baileys (QR-pairing, Rp 0 free)
 *
 * Currently runs in MOCK mode — generates a 6-digit OTP, stores it in
 * otp_logs table, and returns the code in the response for demo purposes.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OTPRequest {
  target_number: string;
  purpose: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    const { target_number, purpose }: OTPRequest = await req.json();

    if (!target_number || !purpose) {
      return new Response(
        JSON.stringify({ error: "target_number and purpose are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP in database
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/otp_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        target_number,
        otp_code: otpCode,
        purpose,
        is_verified: false,
      }),
    });

    if (!insertRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to store OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- MOCK WhatsApp API ----
    // In production, this is where you'd call either:
    // Option A: Meta WhatsApp Cloud API
    //   POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
    //   with template: "Your ArmadaExpress verification code is {otpCode}"
    //
    // Option B: whatsapp-web.js / Baileys webhook
    //   POST to your local Node.js webhook running the WhatsApp Web client
    //   which sends the message via QR-paired session (free forever)

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully (mock mode)",
        otp_code: otpCode, // Only returned in mock mode for demo
        target: target_number,
        provider: "mock",
        note: "In production, OTP would be sent via Meta WhatsApp Cloud API or Baileys webhook",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
