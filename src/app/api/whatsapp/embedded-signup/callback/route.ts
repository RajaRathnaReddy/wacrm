import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/whatsapp/encryption';
import { resolveVerifyTokenForSave } from '@/lib/whatsapp/verify-token';
import { subscribeWabaToApp } from '@/lib/whatsapp/meta-api';

// Admin client to safely write credentials bypassing RLS
let _adminClient: any = null;
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve account_id from user's profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profErr || !profile?.account_id) {
      return NextResponse.json(
        { error: 'Profile not linked to an account' },
        { status: 403 }
      );
    }
    const accountId = profile.account_id;

    const body = await request.json();
    const { code, phone_number_id, waba_id } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required from Embedded Signup' },
        { status: 400 }
      );
    }

    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'META_APP_ID or META_APP_SECRET is not configured on the server' },
        { status: 500 }
      );
    }

    // 1. Exchange the temporary code for a permanent access token with Meta Graph API
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Meta token exchange error:', tokenData.error);
      return NextResponse.json(
        {
          error: `Meta rejected authorization code: ${tokenData.error.message || 'Unknown error'}`,
          meta: tokenData.error,
        },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token returned from Meta' },
        { status: 502 }
      );
    }

    let targetPhoneNumberId = phone_number_id;
    let targetWabaId = waba_id;

    // 2. If phone_number_id or waba_id was not captured from the popup, attempt to discover them via Graph API
    if (!targetPhoneNumberId || !targetWabaId) {
      try {
        if (targetWabaId && !targetPhoneNumberId) {
          const numbersRes = await fetch(
            `https://graph.facebook.com/v21.0/${targetWabaId}/phone_numbers`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const numbersData = await numbersRes.json();
          if (numbersData.data && numbersData.data.length > 0) {
            targetPhoneNumberId = numbersData.data[0].id;
          }
        }
      } catch (err) {
        console.warn('Could not auto-discover phone number from WABA:', err);
      }
    }

    if (!targetPhoneNumberId || !targetWabaId) {
      return NextResponse.json(
        {
          error:
            'Could not determine phone_number_id or waba_id from the Embedded Signup session. Please complete the registration or enter them manually.',
        },
        { status: 400 }
      );
    }

    // 3. Subscribe the WABA to our app to receive inbound webhooks
    try {
      await subscribeWabaToApp({ wabaId: targetWabaId, accessToken });
    } catch (subErr) {
      console.warn('WABA subscription attempt warning:', subErr);
      // We continue since the token is valid, user can re-trigger subscribe later if needed
    }

    // 4. Fetch phone number details for validation and display
    let displayPhoneNumber = '';
    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v21.0/${targetPhoneNumberId}?fields=display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const phoneData = await phoneRes.json();
      displayPhoneNumber = phoneData.display_phone_number || '';
    } catch (err) {
      console.warn('Could not read phone display details:', err);
    }

    // 5. Look up existing config for this account to preserve verify_token
    const { data: existingConfig } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('id, verify_token')
      .eq('account_id', accountId)
      .maybeSingle();

    const encryptedAccessToken = encrypt(accessToken);

    let encryptedVerifyToken = existingConfig?.verify_token || null;
    if (!encryptedVerifyToken) {
      const defaultToken = `rasa_verify_${crypto.randomBytes(6).toString('hex')}`;
      encryptedVerifyToken = resolveVerifyTokenForSave(defaultToken, null);
    }

    const now = new Date().toISOString();

    // 6. Upsert into whatsapp_config
    const { data: savedConfig, error: saveErr } = await supabaseAdmin()
      .from('whatsapp_config')
      .upsert(
        {
          account_id: accountId,
          user_id: user.id,
          phone_number_id: targetPhoneNumberId,
          waba_id: targetWabaId,
          access_token: encryptedAccessToken,
          verify_token: encryptedVerifyToken,
          status: 'connected',
          connected_at: now,
          registered_at: now,
          subscribed_apps_at: now,
          updated_at: now,
        },
        { onConflict: 'account_id' }
      )
      .select('*')
      .single();

    if (saveErr) {
      console.error('Error saving whatsapp_config via Embedded Signup:', saveErr);
      return NextResponse.json(
        { error: 'Failed to save configuration in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phone_number_id: targetPhoneNumberId,
      waba_id: targetWabaId,
      display_phone_number: displayPhoneNumber,
      message: 'WhatsApp connected successfully via Meta Embedded Signup!',
    });
  } catch (err) {
    console.error('Embedded signup callback uncaught error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
