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
  const { data: config } = await supabase.from('whatsapp_config').select('*').single();
  const token = decrypt(config.access_token);

  console.log('Submitting promotional templates to WABA:', config.waba_id);

  // Template 1: Rasa Welcome Promo with Direct Call button and Website button
  const promoPayload = {
    name: 'rasa_welcome_promo',
    category: 'MARKETING',
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Rasa Productions'
      },
      {
        type: 'BODY',
        text: 'Welcome to Rasa Productions! We bring your creative vision to life with cinematic film production, editing, and commercial media services. Connect with our team today to get started on your project.'
      },
      {
        type: 'FOOTER',
        text: 'Rasa Productions Studio'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'PHONE_NUMBER',
            text: 'Call Studio',
            phone_number: '+919133777017'
          },
          {
            type: 'URL',
            text: 'Visit Website',
            url: 'https://rasaproductions.in'
          }
        ]
      }
    ]
  };

  const res = await fetch(`https://graph.facebook.com/v21.0/${config.waba_id}/message_templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(promoPayload)
  });
  const data = await res.json();
  console.log('Template creation response:', data);
}

main().catch(console.error);
