import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY')!;
const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET')!;

const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';

async function getAuthToken(): Promise<string> {
  const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function registerIPN(token: string, notificationUrl: string): Promise<string> {
  const response = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: notificationUrl,
      ipn_notification_type: 'GET',
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`IPN registration failed: ${JSON.stringify(data)}`);
  return data.ipn_id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    if (action === 'initiate') {
      const {
        orderNumber,
        amount,
        currency = 'UGX',
        description,
        customerName,
        customerEmail,
        customerPhone,
        callbackUrl,
        notificationUrl,
      } = payload;

      const token = await getAuthToken();
      
      // Register IPN (can cache this in production)
      let ipnId: string;
      try {
        ipnId = await registerIPN(token, notificationUrl);
      } catch {
        // IPN already registered or failed — use a fallback
        ipnId = '';
      }

      const orderRequest = {
        id: orderNumber,
        currency,
        amount,
        description,
        callback_url: callbackUrl,
        notification_id: ipnId,
        billing_address: {
          email_address: customerEmail,
          phone_number: customerPhone,
          first_name: customerName.split(' ')[0] || customerName,
          last_name: customerName.split(' ').slice(1).join(' ') || '',
        },
      };

      const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderRequest),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Order submission failed: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({
        success: true,
        redirect_url: data.redirect_url,
        order_tracking_id: data.order_tracking_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const { orderTrackingId } = payload;
      const token = await getAuthToken();

      const response = await fetch(
        `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Pesapal error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
