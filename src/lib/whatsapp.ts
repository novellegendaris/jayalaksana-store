import { supabase } from './supabase';

/**
 * WhatsApp OTP Service
 * 
 * Sends a 6-digit OTP to the given WhatsApp number via the whatsapp-otp edge function.
 * In mock mode, the OTP code is returned in the response for demo purposes.
 * 
 * Production integration options:
 *   Option A: Meta WhatsApp Cloud API — 1,000 free monthly service conversations
 *   Option B: Baileys / whatsapp-web.js webhook — QR-pairing, free forever
 */

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-otp`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

export interface OTPResponse {
  success: boolean;
  otp_code?: string;
  error?: string;
}

export async function sendWhatsAppOTP(
  targetNumber: string,
  purpose: 'registration' | 'whatsapp_change'
): Promise<OTPResponse> {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ target_number: targetNumber, purpose }),
    });

    if (!res.ok) {
      return { success: false, error: `Failed to send OTP (${res.status})` };
    }

    const data = await res.json();
    if (data.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      otp_code: data.otp_code,
    };
  } catch {
    return { success: false, error: 'Network error sending OTP' };
  }
}

export async function verifyWhatsAppOTP(
  targetNumber: string,
  otpCode: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('otp_logs')
    .select('id, otp_code')
    .eq('target_number', targetNumber)
    .eq('is_verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  if (data.otp_code !== otpCode) return false;

  await supabase
    .from('otp_logs')
    .update({ is_verified: true })
    .eq('id', data.id);

  return true;
}
