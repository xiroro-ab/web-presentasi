import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Prepare data for Catbox
    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { type: file.type || 'application/octet-stream' });
    
    const catboxFormData = new FormData();
    catboxFormData.append('reqtype', 'fileupload');
    catboxFormData.append('fileToUpload', blob, file.name || 'upload.png');

    // Upload to Catbox
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxFormData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Catbox error:", err);
      throw new Error('Catbox upload failed');
    }

    // Catbox returns the URL directly as plain text
    const imageUrl = await res.text();

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
