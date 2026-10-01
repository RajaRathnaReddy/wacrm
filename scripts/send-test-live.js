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

async function sendTest() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: config } = await supabase.from('whatsapp_config').select('*').single();
  const token = decrypt(config.access_token);
  
  const recipient = '919704506779';
  console.log(`Sending hello_world from phone_number_id ${config.phone_number_id} to ${recipient}...`);

  const res = await fetch(`https://graph.facebook.com/v21.0/${config.phone_number_id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: 'hello_world',
        language: { code: 'en_US' }
      }
    })
  });

  const data = await res.json();
  console.log('Send response status:', res.status, data);

  if (data.messages && data.messages[0]) {
    const wamid = data.messages[0].id;
    console.log('WAMID:', wamid);
    
    // Check conversation for contact
    const { data: contact } = await supabase.from('contacts').select('id').eq('phone', '+919704506779').single();
    if (contact) {
      const { data: conv } = await supabase.from('conversations').select('id').eq('contact_id', contact.id).single();
      if (conv) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'agent',
          content_type: 'template',
          content_text: 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.',
          template_name: 'hello_world',
          message_id: wamid,
          status: 'sent'
        });
        await supabase.from('conversations').update({
          last_message_text: 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.',
          last_message_at: new Date().toISOString()
        }).eq('id', conv.id);
        console.log('Message logged in CRM DB!');
      }
    }
  }
}

sendTest().catch(console.error);
