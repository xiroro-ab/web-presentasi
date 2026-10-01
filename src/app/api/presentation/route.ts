import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPSTASH_URL = "https://splendid-ewe-317847.upstash.io";
const UPSTASH_TOKEN = "gQAAAAAABNmXAAIgcDJiYmY5MTIwNTIyOWE0MmY5YmMyZTc2MmFiMTM3ODA0Mw";
const REDIS_KEY = "presentation_data_v1";

export async function GET() {
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${REDIS_KEY}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const upstashData = await res.json();
      if (upstashData.result) {
        // Data found in Upstash
        return NextResponse.json(JSON.parse(upstashData.result));
      }
    }

    // Fallback to local default file if not found in Upstash (first time load)
    const dataFilePath = path.join(process.cwd(), 'data', 'presentation.json');
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Save to Upstash Redis
    const res = await fetch(`${UPSTASH_URL}/set/${REDIS_KEY}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      throw new Error('Failed to save to Upstash');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
  }
}
