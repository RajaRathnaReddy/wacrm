const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const GCM_IV_LENGTH = 12;

function encrypt(text) {
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${ciphertext}:${authTag}`;
}

async function updateToken(rawToken) {
  if (!rawToken || !rawToken.trim().startsWith('EAA')) {
    console.error('Error: Please provide a valid Meta Access Token (starts with EAA...)');
    process.exit(1);
  }
  const token = rawToken.trim();

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: config, error: cfgErr } = await supabase.from('whatsapp_config').select('*').single();
  if (cfgErr || !config) {
    console.error('Error fetching whatsapp_config from Supabase:', cfgErr);
    process.exit(1);
  }

  console.log('Testing token validity against Meta Graph API...');
  const phoneRes = await fetch(`https://graph.facebook.com/v21.0/${config.phone_number_id}?fields=verified_name,display_phone_number,quality_rating`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const phoneData = await phoneRes.json();

  if (phoneData.error) {
    console.error('Meta API rejected the token:', phoneData.error);
    process.exit(1);
  }

  console.log('Token verified with Meta successfully!');
  console.log('Phone details:', phoneData);

  const encrypted = encrypt(token);
  const { error: updErr } = await supabase
    .from('whatsapp_config')
    .update({
      access_token: encrypted,
      status: 'connected',
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id);

  if (updErr) {
    console.error('Failed to update Supabase:', updErr);
    process.exit(1);
  }

  console.log('Successfully updated access_token in Supabase database!');
  console.log('WhatsApp integration is now 100% operational.');
}

const inputToken = process.argv[2];
if (!inputToken) {
  console.log('Usage: node scripts/update-token.js <META_ACCESS_TOKEN>');
} else {
  updateToken(inputToken).catch(console.error);
}
