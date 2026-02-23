import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MTN_BASE_URL = Deno.env.get('MTN_BASE_URL')!;
const MTN_SUBSCRIPTION_KEY = Deno.env.get('MTN_SUBSCRIPTION_KEY')!;
const MTN_API_USER = Deno.env.get('MTN_API_USER')!;
const MTN_API_KEY = Deno.env.get('MTN_API_KEY')!;
const MTN_TARGET_ENVIRONMENT = Deno.env.get('MTN_TARGET_ENVIRONMENT') || 'sandbox';
const MTN_CALLBACK_URL = Deno.env.get('MTN_CALLBACK_URL') || '';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ── Token cache ──
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = btoa(`${MTN_API_USER}:${MTN_API_KEY}`);
  const res = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Token error:', res.status, text);
    throw new Error(`MTN token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Token typically valid for 3600s, refresh 60s early
  tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  console.log('MTN token obtained, expires in', data.expires_in, 's');
  return cachedToken!;
}

// ── Helpers ──
function validatePhone(phone: string): string {
  // Accept 2567XXXXXXXX, 07XXXXXXXX, +2567XXXXXXXX
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '256' + cleaned.slice(1);
  }
  if (!/^2567\d{8}$/.test(cleaned)) {
    throw new Error('Invalid MTN Uganda phone number. Use format 2567XXXXXXXX');
  }
  return cleaned;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Callback from MTN (PUT) ──
  if (req.method === 'PUT') {
    try {
      const body = await req.json();
      console.log('MTN callback received:', JSON.stringify(body));

      const referenceId = body.externalId || body.referenceId;
      if (!referenceId) {
        return jsonResponse({ error: 'Missing referenceId' }, 400);
      }

      // Fetch current transaction
      const { data: txn } = await supabaseAdmin
        .from('momo_transactions')
        .select('*')
        .eq('reference_id', referenceId)
        .single();

      if (!txn) {
        console.warn('No transaction found for callback referenceId:', referenceId);
        return jsonResponse({ status: 'not_found' }, 404);
      }

      // Already processed — idempotent
      if (txn.status !== 'PENDING') {
        return jsonResponse({ status: txn.status });
      }

      const momoStatus = (body.status || '').toUpperCase() === 'SUCCESSFUL' ? 'SUCCESSFUL' : 'FAILED';

      await supabaseAdmin
        .from('momo_transactions')
        .update({ status: momoStatus, raw_response_json: body })
        .eq('id', txn.id);

      if (momoStatus === 'SUCCESSFUL') {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'paid', status: 'confirmed' })
          .eq('id', txn.order_id);
      } else {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', txn.order_id);
      }

      console.log(`Callback processed: txn=${txn.id}, status=${momoStatus}`);
      return jsonResponse({ status: momoStatus });
    } catch (e) {
      console.error('Callback error:', e);
      return jsonResponse({ error: (e as Error).message }, 500);
    }
  }

  // ── POST actions ──
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { action, ...payload } = await req.json();

    // ── Request to Pay ──
    if (action === 'request-to-pay') {
      const { orderId, phone, amount } = payload;

      if (!orderId || !phone || !amount) {
        return jsonResponse({ error: 'orderId, phone, and amount are required' }, 400);
      }

      const validPhone = validatePhone(phone);

      // Check order exists and isn't already paid
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('id, payment_status, total')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        return jsonResponse({ error: 'Order not found' }, 404);
      }
      if (order.payment_status === 'paid') {
        return jsonResponse({ error: 'Order already paid' }, 400);
      }

      // Check for existing pending transaction (prevents double charge)
      const { data: existingTxn } = await supabaseAdmin
        .from('momo_transactions')
        .select('id, reference_id, status')
        .eq('order_id', orderId)
        .in('status', ['PENDING', 'SUCCESSFUL'])
        .maybeSingle();

      if (existingTxn) {
        if (existingTxn.status === 'SUCCESSFUL') {
          return jsonResponse({ error: 'Order already paid' }, 400);
        }
        // Return existing pending reference for polling
        return jsonResponse({ referenceId: existingTxn.reference_id, status: 'PENDING', message: 'Payment already initiated. Check your phone.' });
      }

      const referenceId = crypto.randomUUID();
      const token = await getAccessToken();

      const requestBody = {
        amount: String(amount),
        currency: 'UGX',
        externalId: referenceId,
        payer: { partyIdType: 'MSISDN', partyId: validPhone },
        payerMessage: 'Payment for your order',
        payeeNote: `Order ${orderId}`,
      };

      // Save transaction first
      await supabaseAdmin.from('momo_transactions').insert({
        order_id: orderId,
        reference_id: referenceId,
        phone: validPhone,
        amount,
        currency: 'UGX',
        status: 'PENDING',
        raw_request_json: requestBody,
      });

      const res = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': MTN_TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
          ...(MTN_CALLBACK_URL ? { 'X-Callback-Url': MTN_CALLBACK_URL } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (res.status === 202) {
        console.log(`RequestToPay accepted: ref=${referenceId}, order=${orderId}`);
        return jsonResponse({ referenceId, status: 'PENDING', message: 'Approve the payment on your phone' });
      }

      const errText = await res.text();
      console.error('RequestToPay failed:', res.status, errText);

      // Mark transaction as failed
      await supabaseAdmin
        .from('momo_transactions')
        .update({ status: 'FAILED', raw_response_json: { error: errText, statusCode: res.status } })
        .eq('reference_id', referenceId);

      return jsonResponse({ error: `Payment request failed: ${errText}` }, 500);
    }

    // ── Check Status ──
    if (action === 'check-status') {
      const { referenceId } = payload;
      if (!referenceId) {
        return jsonResponse({ error: 'referenceId is required' }, 400);
      }

      // First check DB
      const { data: txn } = await supabaseAdmin
        .from('momo_transactions')
        .select('*')
        .eq('reference_id', referenceId)
        .single();

      if (!txn) {
        return jsonResponse({ error: 'Transaction not found' }, 404);
      }

      // If already resolved, return immediately
      if (txn.status !== 'PENDING') {
        return jsonResponse({ status: txn.status, referenceId });
      }

      // Poll MTN API
      const token = await getAccessToken();
      const res = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': MTN_TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Status check failed:', res.status, errText);
        return jsonResponse({ status: 'PENDING', referenceId, message: 'Still processing' });
      }

      const data = await res.json();
      console.log('MTN status response:', JSON.stringify(data));

      const momoStatus = (data.status || '').toUpperCase();
      let finalStatus = 'PENDING';
      if (momoStatus === 'SUCCESSFUL') finalStatus = 'SUCCESSFUL';
      else if (momoStatus === 'FAILED' || momoStatus === 'REJECTED' || momoStatus === 'TIMEOUT' || momoStatus === 'EXPIRED') finalStatus = 'FAILED';

      if (finalStatus !== 'PENDING') {
        await supabaseAdmin
          .from('momo_transactions')
          .update({ status: finalStatus, raw_response_json: data })
          .eq('id', txn.id);

        if (finalStatus === 'SUCCESSFUL') {
          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'paid', status: 'confirmed' })
            .eq('id', txn.order_id);
        } else if (finalStatus === 'FAILED') {
          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', txn.order_id);
        }
      }

      return jsonResponse({
        status: finalStatus,
        referenceId,
        reason: data.reason || null,
      });
    }

    return jsonResponse({ error: 'Unknown action. Use request-to-pay or check-status' }, 400);
  } catch (e) {
    console.error('MoMo edge function error:', e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
