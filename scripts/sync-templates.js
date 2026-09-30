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

async function syncTemplates() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: config } = await supabase.from('whatsapp_config').select('*').single();
  const token = decrypt(config.access_token);

  console.log('Fetching templates from Meta for WABA:', config.waba_id);
  const res = await fetch(`https://graph.facebook.com/v21.0/${config.waba_id}/message_templates`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  if (!json.data) {
    console.error('Failed to get templates:', json);
    return;
  }

  for (const t of json.data) {
    console.log(`Processing template: ${t.name} (${t.status})`);
    let headerType = 'none';
    let headerContent = null;
    let bodyText = '';
    let footerText = null;
    let buttons = null;

    for (const c of t.components || []) {
      if (c.type === 'HEADER') {
        headerType = (c.format || 'text').toLowerCase();
        headerContent = c.text || null;
      } else if (c.type === 'BODY') {
        bodyText = c.text || '';
      } else if (c.type === 'FOOTER') {
        footerText = c.text || null;
      } else if (c.type === 'BUTTONS') {
        buttons = c.buttons || [];
      }
    }

    const templateRow = {
      user_id: config.user_id,
      account_id: config.account_id,
      name: t.name,
      category: t.category,
      language: t.language,
      header_type: headerType,
      header_content: headerContent,
      body_text: bodyText,
      footer_text: footerText,
      buttons: buttons,
      status: t.status,
      meta_template_id: t.id,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('message_templates')
      .select('id')
      .eq('name', t.name)
      .maybeSingle();

    if (existing) {
      await supabase.from('message_templates').update(templateRow).eq('id', existing.id);
      console.log(`Updated template: ${t.name}`);
    } else {
      await supabase.from('message_templates').insert(templateRow);
      console.log(`Inserted template: ${t.name}`);
    }
  }
}

syncTemplates().catch(console.error);
