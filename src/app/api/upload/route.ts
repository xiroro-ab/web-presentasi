import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Pastikan Anda menaruh ini di file .env.local nantinya
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'GANTI_DENGAN_URL_SUPABASE_ANDA';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'GANTI_DENGAN_ANON_KEY_SUPABASE_ANDA';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Anda bisa mengatur limit lebih besar (misal 5MB = 5000000) karena Supabase gratis 1GB
    if (buffer.length > 5000000) {
      return NextResponse.json({ error: 'File terlalu besar (Max 5MB)' }, { status: 413 });
    }

    // Buat nama file unik
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload ke Supabase Storage (bucket bernama 'presentations')
    const { data, error } = await supabase
      .storage
      .from('presentations')
      .upload(filename, buffer, {
        contentType: file.type || 'image/png',
        upsert: false
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: `Supabase Error: ${error.message}` }, { status: 500 });
    }

    // Dapatkan Public URL langsung dari Supabase
    const { data: publicUrlData } = supabase
      .storage
      .from('presentations')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload: ' + error.message }, { status: 500 });
  }
}
