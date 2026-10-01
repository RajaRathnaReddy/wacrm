const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const [ivHex, ctHex, tagHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let d = decipher.update(ctHex, 'hex', 'utf8');
  d += decipher.final('utf8');
  return d;
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // 1. Fetch recent messages
  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('--- RECENT MESSAGES IN DB ---');
  console.log(messages?.map(m => ({
    id: m.id,
    direction: m.direction,
    sender_type: m.sender_type,
    content: m.content,
    status: m.status,
    message_id: m.message_id,
    created_at: m.created_at
  })));

  // 2. Fetch config
  const { data: config } = await supabase.from('whatsapp_config').select('*').single();
  const token = decrypt(config.access_token);

  // 3. Check App Subscriptions & Webhook on Meta
  const appSubRes = await fetch(`https://graph.facebook.com/v21.0/3466374920204212/subscriptions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('--- APP WEBHOOK SUBSCRIPTIONS ---');
  console.log(await appSubRes.json());

  // 4. Check WABA Subscribed Apps
  const wabaSubRes = await fetch(`https://graph.facebook.com/v21.0/${config.waba_id}/subscribed_apps`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('--- WABA SUBSCRIBED APPS ---');
  console.log(await wabaSubRes.json());
}

main().catch(console.error);
