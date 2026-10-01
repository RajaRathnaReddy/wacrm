import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID || '';
    const configId = process.env.META_CONFIG_ID || process.env.NEXT_PUBLIC_META_CONFIG_ID || '';

    return NextResponse.json({
      appId,
      configId,
      isConfigured: Boolean(appId),
    });
  } catch (err) {
    console.error('Error fetching embedded signup config:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
