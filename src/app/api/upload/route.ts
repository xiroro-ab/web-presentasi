import { NextResponse } from 'next/server';

const IMGBB_API_KEY = "79b9816e71b8ecce3de146d30dc66d4f";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Prepare data for ImgBB using URLSearchParams
    const params = new URLSearchParams();
    params.append('key', IMGBB_API_KEY);
    params.append('image', base64Image);

    // Upload to ImgBB
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("ImgBB error:", err);
      throw new Error('ImgBB upload failed');
    }

    const data = await res.json();
    const imageUrl = data.data.url;

    // Return the URL provided by ImgBB
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
