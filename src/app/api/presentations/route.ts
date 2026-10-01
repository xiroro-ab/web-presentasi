import { NextResponse } from 'next/server';

const UPSTASH_URL = "https://splendid-ewe-317847.upstash.io";
const UPSTASH_TOKEN = "gQAAAAAABNmXAAIgcDJiYmY5MTIwNTIyOWE0MmY5YmMyZTc2MmFiMTM3ODA0Mw";
const LIST_KEY = "presentations_list_v1";

export async function GET() {
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${LIST_KEY}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const upstashData = await res.json();
      if (upstashData.result) {
        return NextResponse.json(JSON.parse(upstashData.result));
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, teacherName, title, data } = body;
    
    // 1. Get current list
    const resList = await fetch(`${UPSTASH_URL}/get/${LIST_KEY}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    let list = [];
    if (resList.ok) {
      const upstashData = await resList.json();
      if (upstashData.result) list = JSON.parse(upstashData.result);
    }
    
    // Update or add to list
    const existingIndex = list.findIndex((item: any) => item.slug === slug);
    if (existingIndex >= 0) {
      list[existingIndex] = { slug, teacherName, title, updatedAt: Date.now() };
    } else {
      list.push({ slug, teacherName, title, createdAt: Date.now(), updatedAt: Date.now() });
    }

    // Save list back
    await fetch(`${UPSTASH_URL}/set/${LIST_KEY}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(list)
    });

    // 2. Save individual presentation data
    const DATA_KEY = `presentation_data_${slug}`;
    await fetch(`${UPSTASH_URL}/set/${DATA_KEY}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
