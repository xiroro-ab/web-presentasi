import { NextResponse } from 'next/server';

const UPSTASH_URL = "https://splendid-ewe-317847.upstash.io";
const UPSTASH_TOKEN = "gQAAAAAABNmXAAIgcDJiYmY5MTIwNTIyOWE0MmY5YmMyZTc2MmFiMTM3ODA0Mw";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Check size limit (Upstash free tier limit is 1MB, so we limit to 800KB for safety)
    if (buffer.length > 800000) {
      return NextResponse.json({ error: 'File too large (Max 800KB)' }, { status: 413 });
    }

    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const redisKey = `img_${id}`;

    // Save to Upstash Redis
    const res = await fetch(`${UPSTASH_URL}/set/${redisKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataUri)
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Redis Error ${res.status}: ${err}` }, { status: 500 });
    }

    // Return the local image route URL
    return NextResponse.json({ url: `/api/image?id=${redisKey}` });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image: ' + error.message }, { status: 500 });
  }
}
