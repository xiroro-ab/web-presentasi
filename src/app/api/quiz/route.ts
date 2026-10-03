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
      .eq('title', `QUIZ_SESSION_${id}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    
    return NextResponse.json({ results: data?.content || {} });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quiz scores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, studentName, points } = await request.json();
    
    if (!id || !studentName) return NextResponse.json({ error: 'Missing ID or student name' }, { status: 400 });

    const { data: existing } = await supabase
      .from('presentations')
      .select('id, content')
      .eq('title', `QUIZ_SESSION_${id}`)
      .maybeSingle();
      
    let newContent: Record<string, number> = existing?.content || {};
    newContent[studentName] = (newContent[studentName] || 0) + (points || 0);

    if (existing) {
      const { error } = await supabase.from('presentations').update({ content: newContent }).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('presentations').insert([{ 
        title: `QUIZ_SESSION_${id}`, 
        content: newContent, 
        teacher_name: 'SYSTEM', 
        subject: 'Quiz', 
        theme: 'formal' 
      }]);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, results: newContent });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit score' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await supabase.from('presentations').delete().eq('title', `QUIZ_SESSION_${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset quiz' }, { status: 500 });
  }
}
