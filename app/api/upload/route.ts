import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const adminSupabase = () => getAdminSupabase();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('photos').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    for (const file of files.slice(0, 3)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `shipments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await adminSupabase().storage
        .from('photos')
        .upload(fileName, buffer, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = adminSupabase().storage.from('photos').getPublicUrl(fileName);
      if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({ urls: uploadedUrls.slice(0, 3) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
