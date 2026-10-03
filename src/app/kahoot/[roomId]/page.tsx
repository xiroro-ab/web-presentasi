"use client";

import { useState, useEffect, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🦉', '🦄', '🦖', '🐙'];

export default function KahootStudentView({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState('');
  const [myId, setMyId] = useState('');
  const [avatar, setAvatar] = useState('');
  
  const [gameState, setGameState] = useState<'lobby' | 'reading' | 'answering' | 'result' | 'interim_leaderboard' | 'podium'>('lobby');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean, scoreAdded: number } | null>(null);
  
  const channelRef = useRef<any>(null);
  const answeringStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Generate unique ID for this player
    setMyId(Math.random().toString(36).substring(2, 10));
    setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const roomId = `kahoot-${resolvedParams.roomId}`;
    const channel = supabase.channel(roomId, {
      config: { presence: { key: myId } }
    });

    channel
      .on('broadcast', { event: 'state_change' }, ({ payload }) => {
        setGameState(payload.state);
        
        if (payload.state === 'reading') {
          setHasAnswered(false);
          setAnswerResult(null);
        } else if (payload.state === 'answering') {
          answeringStartTimeRef.current = Date.now();
        } else if (payload.state === 'result') {
          // Check if my answer was correct
          if (payload.playerResults && payload.playerResults[myId]) {
            const myAns = payload.playerResults[myId].answer;
            const isCorrect = myAns === payload.correctAnswer;
            // Calculate what my score was for display
            const maxTime = 20; // fallback
            const timeTaken = payload.playerResults[myId].timeTaken;
            const scoreAdded = isCorrect ? Math.round((1 - (timeTaken / maxTime) / 2) * 1000) : 0;
            setAnswerResult({ isCorrect, scoreAdded });
          } else {
            setAnswerResult({ isCorrect: false, scoreAdded: 0 }); // Missed
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: myId, name, avatar, isHost: false });
          setJoined(true);
          
          // Request current state from host
          channel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: {}
          });
        }
      });

    channelRef.current = channel;
  };

  const submitAnswer = (ans: string) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    
    const timeTaken = (Date.now() - answeringStartTimeRef.current) / 1000;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'submit_answer',
      payload: { id: myId, answer: ans, timeTaken }
    });
  };

  if (!joined) {
    return (
      <div style={{ width: '100vw', height: '100dvh', background: '#2563eb', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-sans)' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', textAlign: 'center' }}>KAHOOT MODE</h1>
        <form onSubmit={handleJoin} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Masukkan Nama Anda" 
            required
            style={{ width: '100%', padding: '1.5rem', fontSize: '1.5rem', borderRadius: '12px', border: 'none', textAlign: 'center', fontWeight: 700, outline: 'none' }}
          />
          <button type="submit" style={{ width: '100%', padding: '1.5rem', fontSize: '1.5rem', borderRadius: '12px', border: 'none', background: '#111', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            Masuk Game
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: '#fff' }}>
            <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>{avatar}</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Halo, {name}!</h2>
            <p style={{ fontSize: '1.25rem', marginTop: '2rem', fontWeight: 600, opacity: 0.8 }}>Tunggu guru memulai kuis...</p>
          </motion.div>
        )}

        {gameState === 'reading' && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', marginBottom: '2rem' }}>Bersiaplah!</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>Lihat soal di layar proyektor!</p>
          </motion.div>
        )}

        {gameState === 'answering' && !hasAnswered && (
          <motion.div key="answering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0.5rem', padding: '0.5rem' }}>
            {[
              { id: 'A', color: '#ef4444', shape: '▲' },
              { id: 'B', color: '#3b82f6', shape: '◆' },
              { id: 'C', color: '#eab308', shape: '●' },
              { id: 'D', color: '#22c55e', shape: '■' }
            ].map((btn) => (
              <button 
                key={btn.id}
                onClick={() => submitAnswer(btn.id)}
                style={{ background: btn.color, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.2)' }}
              >
                {btn.shape}
              </button>
            ))}
          </motion.div>
        )}

        {gameState === 'answering' && hasAnswered && (
          <motion.div key="waiting-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#475569' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Jawaban Terekam!</div>
            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Menunggu waktu habis...</p>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: answerResult?.isCorrect ? '#22c55e' : '#ef4444', color: '#fff' }}>
            {answerResult?.isCorrect ? (
              <>
                <div style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1rem' }}>BENAR!</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1.5rem', borderRadius: '100px' }}>+{answerResult.scoreAdded} Poin</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1rem' }}>SALAH!</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>Coba lagi lebih cepat & teliti!</div>
              </>
            )}
          </motion.div>
        )}

        {gameState === 'interim_leaderboard' && (
          <motion.div key="interim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: '#fff', textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Klasemen Sementara</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>Cek posisi Anda di layar proyektor!</p>
          </motion.div>
        )}

        {gameState === 'podium' && (
          <motion.div key="podium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: '#eab308' }}>Kuis Selesai!</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#cbd5e1' }}>Lihat posisi juara Anda di layar proyektor!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
