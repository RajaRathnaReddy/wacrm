const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const GCM_IV_LENGTH = 12;

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  if (parts.length === 3) {
    const [ivHex, ctHex, tagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ctHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  throw new Error('Unknown format');
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: config, error } = await supabase.from('whatsapp_config').select('*').single();
  if (error || !config) {
    console.error('Config error:', error);
    return;
  }
  const token = decrypt(config.access_token);

  console.log('Phone ID:', config.phone_number_id);
  console.log('WABA ID:', config.waba_id);

  // 1. Phone number details
  const phoneRes = await fetch(`https://graph.facebook.com/v21.0/${config.phone_number_id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const phoneInfo = await phoneRes.json();
  console.log('Phone Info:', JSON.stringify(phoneInfo, null, 2));

  // 2. Fetch Templates
  const tmplRes = await fetch(`https://graph.facebook.com/v21.0/${config.waba_id}/message_templates`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const tmplData = await tmplRes.json();
  console.log('Templates Count:', tmplData.data ? tmplData.data.length : 0);
  console.log('Templates:', JSON.stringify(tmplData, null, 2));
}

main().catch(console.error);
