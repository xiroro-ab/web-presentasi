import { NextResponse } from 'next/server';

const UPSTASH_URL = "https://splendid-ewe-317847.upstash.io";
const UPSTASH_TOKEN = "gQAAAAAABNmXAAIgcDJiYmY5MTIwNTIyOWE0MmY5YmMyZTc2MmFiMTM3ODA0Mw";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing id', { status: 400 });
  }

  try {
    const res = await fetch(`${UPSTASH_URL}/get/${id}`, {
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`
      }
    });

    if (!res.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const data = await res.json();
    if (!data.result) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // data.result is the base64 dataUri string: "data:image/png;base64,iVBORw0KGgo..."
    const dataUri = data.result;
    const matches = dataUri.match(/^data:(.+);base64,(.*)$/);

    if (!matches || matches.length !== 3) {
      return new NextResponse('Invalid image data', { status: 500 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
