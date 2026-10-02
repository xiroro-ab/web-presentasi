import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { data, error } = await supabase
      .from('presentations')
      .select('content')
      .eq('title', `POLL_SESSION_${id}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    
    return NextResponse.json({ results: data?.content || { A: 0, B: 0, C: 0, D: 0 } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, answer } = await request.json(); // answer: 'A', 'B', 'C', 'D'
    
    if (!id || !answer) return NextResponse.json({ error: 'Missing ID or answer' }, { status: 400 });

    const { data: existing } = await supabase
      .from('presentations')
      .select('id, content')
      .eq('title', `POLL_SESSION_${id}`)
      .maybeSingle();
      
    let newContent: Record<string, number> = existing?.content || { A: 0, B: 0, C: 0, D: 0 };
    newContent[answer] = (newContent[answer] || 0) + 1;

    if (existing) {
      await supabase.from('presentations').update({ content: newContent }).eq('id', existing.id);
    } else {
      await supabase.from('presentations').insert({ title: `POLL_SESSION_${id}`, content: newContent, user_id: 'default_user_id', subject: 'Poll', theme: 'default', chapters: [] });
    }

    return NextResponse.json({ success: true, results: newContent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await supabase.from('presentations').delete().eq('title', `POLL_SESSION_${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset poll' }, { status: 500 });
  }
}
