import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('content')
      .eq('title', 'GLOBAL_SETTINGS')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // ignore no rows error
    return NextResponse.json({ bg: data?.content?.bg || '', bgOpacity: data?.content?.bgOpacity ?? 0.6 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { bg, bgOpacity } = await request.json();
    const { data: existing } = await supabase
      .from('presentations')
      .select('id, content')
      .eq('title', 'GLOBAL_SETTINGS')
      .maybeSingle();
    
    if (existing) {
      const newContent = { ...existing.content };
      if (bg !== undefined) newContent.bg = bg;
      if (bgOpacity !== undefined) newContent.bgOpacity = bgOpacity;
      
      const { error } = await supabase
        .from('presentations')
        .update({ content: newContent })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('presentations')
        .insert([{ title: 'GLOBAL_SETTINGS', teacher_name: 'SYSTEM', subject: 'SYSTEM', theme: 'system', content: { bg } }]);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
