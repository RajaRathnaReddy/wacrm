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

  console.log('Submitting utility template...');
  const payload = {
    name: 'rasa_inquiry_update',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Rasa Productions Update'
      },
      {
        type: 'BODY',
        text: 'Hello {{1}}, thank you for contacting Rasa Productions. We have received your inquiry regarding {{2}}. Our production team is reviewing your requirements and will connect with you shortly.',
        example: {
          body_text: [['Raja', 'Commercial Video Production']]
        }
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
            text: 'Call Us',
            phone_number: '+919133777017'
          },
          {
            type: 'URL',
            text: 'Our Portfolio',
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
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Utility template response:', data);
}

main().catch(console.error);
