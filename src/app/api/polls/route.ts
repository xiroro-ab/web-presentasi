import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const voterId = searchParams.get('voterId');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { data, error } = await supabase
      .from('presentations')
      .select('content')
      .eq('title', `POLL_SESSION_${id}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    
    const content = data?.content;
    if (!content) {
      return NextResponse.json({
        results: { A: 0, B: 0, C: 0, D: 0 },
        totalVotes: 0,
        hasVoted: false,
        myVote: null
      });
    }

    const voters = (content._voters && typeof content._voters === 'object') ? content._voters : {};
    const hasVoted = voterId ? Boolean(voters[voterId]) : false;
    const myVote = voterId ? voters[voterId] || null : null;

    const results = {
      A: Number(content.A) || 0,
      B: Number(content.B) || 0,
      C: Number(content.C) || 0,
      D: Number(content.D) || 0
    };

    const totalVotes = Object.keys(voters).length > 0 
      ? Object.keys(voters).length 
      : (results.A + results.B + results.C + results.D);

    return NextResponse.json({
      results,
      totalVotes,
      hasVoted,
      myVote
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, answer, voterId } = await request.json(); // answer: 'A', 'B', 'C', 'D'
    
    if (!id || !answer) return NextResponse.json({ error: 'Missing ID or answer' }, { status: 400 });
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      return NextResponse.json({ error: 'Pilihan tidak valid' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('presentations')
      .select('id, content')
      .eq('title', `POLL_SESSION_${id}`)
      .maybeSingle();
      
    let content: any = existing?.content || { A: 0, B: 0, C: 0, D: 0, _voters: {} };
    content.A = Number(content.A) || 0;
    content.B = Number(content.B) || 0;
    content.C = Number(content.C) || 0;
    content.D = Number(content.D) || 0;
    if (!content._voters || typeof content._voters !== 'object') {
      content._voters = {};
    }

    // Single-vote protection per voter / device
    if (voterId) {
      if (content._voters[voterId]) {
        return NextResponse.json({
          success: true,
          alreadyVoted: true,
          message: 'Anda sudah memberikan suara pada polling ini.',
          selected: content._voters[voterId],
          results: { A: content.A, B: content.B, C: content.C, D: content.D }
        });
      }
      content._voters[voterId] = answer;
    }

    content[answer] = (content[answer] || 0) + 1;

    if (existing) {
      const { error } = await supabase.from('presentations').update({ content }).eq('id', existing.id);
      if (error) { console.error('Supabase Update Error:', error); throw error; }
    } else {
      const { error } = await supabase.from('presentations').insert([{ 
        title: `POLL_SESSION_${id}`, 
        content, 
        teacher_name: 'SYSTEM', 
        subject: 'Poll', 
        theme: 'formal' 
      }]);
      if (error) { console.error('Supabase Insert Error:', error); throw error; }
    }

    return NextResponse.json({
      success: true,
      results: { A: content.A, B: content.B, C: content.C, D: content.D }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit vote' }, { status: 500 });
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
