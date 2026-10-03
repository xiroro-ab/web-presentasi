"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, ArrowRight, X, Trophy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Player = { id: string; name: string; avatar: string; score: number };

function AutoResizeText({ text, maxFontSize = 60, minFontSize = 16, align = 'center' }: { text: string, maxFontSize?: number, minFontSize?: number, align?: 'center' | 'left' | 'justify' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const adjustFontSize = () => {
      if (!containerRef.current || !textRef.current) return;
      let currentSize = maxFontSize;
      textRef.current.style.fontSize = `${currentSize}px`;

      while (
        currentSize > minFontSize &&
        (textRef.current.scrollHeight > containerRef.current.clientHeight ||
         textRef.current.scrollWidth > containerRef.current.clientWidth)
      ) {
        currentSize -= 2;
        textRef.current.style.fontSize = `${currentSize}px`;
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [text, maxFontSize, minFontSize]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', overflow: 'hidden' }}>
      <div ref={textRef} style={{ fontWeight: 800, textAlign: align, wordWrap: 'break-word', overflowWrap: 'break-word', width: '100%', lineHeight: 1.2 }}>
        {text}
      </div>
    </div>
  );
}

export default function KahootPresenter({ chapter, presentationId, onExit }: any) {
  const [kahootState, setKahootState] = useState<'lobby' | 'reading' | 'answering' | 'result' | 'interim_leaderboard' | 'podium'>('lobby');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const channelRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const stateRef = useRef(kahootState);
  const slideIndexRef = useRef(activeSlideIndex);
  const answersRef = useRef(currentAnswers);

  useEffect(() => {
    stateRef.current = kahootState;
    slideIndexRef.current = activeSlideIndex;
    answersRef.current = currentAnswers;
  }, [kahootState, activeSlideIndex, currentAnswers]);

  const activeSlide = chapter.slides[activeSlideIndex];
  const kahootSlides = chapter.slides.filter((s: any) => s.isQuiz);

  useEffect(() => {
    const roomId = `kahoot-${presentationId}_${chapter.id}`;
    const channel = supabase.channel(roomId, {
      config: { presence: { key: 'host' } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        if (stateRef.current === 'lobby') {
          // Exact match in lobby to remove disconnected players
          const lobbyPlayers: Record<string, Player> = {};
          for (const key in state) {
            const clients = state[key] as any[];
            for (const client of clients) {
              if (!client.isHost && client.id) {
                lobbyPlayers[client.id] = { id: client.id, name: client.name, avatar: client.avatar, score: 0 };
              }
            }
          }
          setPlayers(lobbyPlayers);
        } else {
          // Accumulate during game to preserve scores
          setPlayers(prev => {
            const updated: Record<string, Player> = { ...prev };
            for (const key in state) {
              const clients = state[key] as any[];
              for (const client of clients) {
                if (!client.isHost && client.id) {
                  if (!updated[client.id]) {
                    updated[client.id] = { id: client.id, name: client.name, avatar: client.avatar, score: 0 };
                  }
                }
              }
            }
            return updated;
          });
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        broadcastState(stateRef.current, slideIndexRef.current, { 
          answeredPlayers: Object.keys(answersRef.current) 
        });
      })
      .on('broadcast', { event: 'submit_answer' }, ({ payload }) => {
        if (stateRef.current === 'answering') {
          setCurrentAnswers(prev => ({
            ...prev,
            [payload.id]: { answer: payload.answer, timeTaken: payload.timeTaken }
          }));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ isHost: true });
          
          // Force all lingering student sessions to reset
          channel.send({
            type: 'broadcast',
            event: 'reset_game',
            payload: {}
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const broadcastState = (state: string, slideIdx: number, extra = {}) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'state_change',
      payload: { state, slideIndex: slideIdx, ...extra }
    });
  };

  // State Transitions
  const startReading = (overrideIndex?: number) => {
    const idx = overrideIndex !== undefined ? overrideIndex : slideIndexRef.current;
    const readingTime = chapter.kahootReadingTime || 5;
    setKahootState('reading');
    setTimeLeft(readingTime);
    setCurrentAnswers({});
    broadcastState('reading', idx, { timeLeft: readingTime });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startAnswering();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startAnswering = () => {
    const currentSlide = chapter.slides[slideIndexRef.current];
    const answerTime = currentSlide?.quizTimer || 20;
    setKahootState('answering');
    setTimeLeft(answerTime);
    broadcastState('answering', slideIndexRef.current, { timeLeft: answerTime });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          showResult();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showResult = () => {
    setKahootState('result');
    
    // Calculate scores
    const newPlayers = { ...players };
    const currentSlide = chapter.slides[slideIndexRef.current];
    const maxTime = currentSlide?.quizTimer || 20;
    const correctAns = currentSlide?.quizCorrectAnswer || 'A';
    
    const currentAnswersLatest = answersRef.current;
    
    Object.keys(currentAnswersLatest).forEach(pid => {
      const ans = currentAnswersLatest[pid];
      if (ans.answer === correctAns) {
        // Kahoot style scoring: max 1000, min 500 if correct
        const score = Math.round((1 - (ans.timeTaken / maxTime) / 2) * 1000);
        if (newPlayers[pid]) {
          newPlayers[pid].score += score;
        }
      }
    });
    setPlayers(newPlayers);
    
    // Create leaderboard data to broadcast
    const leaderboard = Object.values(newPlayers).sort((a, b) => b.score - a.score).slice(0, 5);
    
    broadcastState('result', slideIndexRef.current, { 
      correctAnswer: correctAns, 
      leaderboard,
      playerResults: currentAnswersLatest
    });
  };

  const showInterimLeaderboard = () => {
    setKahootState('interim_leaderboard');
    const leaderboard = Object.values(players).sort((a, b) => b.score - a.score).slice(0, 5);
    broadcastState('interim_leaderboard', activeSlideIndex, { leaderboard });
  };

  const nextSlide = () => {
    // Find the NEXT quiz slide in chapter.slides
    const nextIdx = chapter.slides.findIndex((s: any, idx: number) => idx > slideIndexRef.current && s.isQuiz);
    
    if (nextIdx !== -1) {
      setActiveSlideIndex(nextIdx);
      startReading(nextIdx);
    } else {
      setKahootState('podium');
      const leaderboard = Object.values(players).sort((a, b) => b.score - a.score).slice(0, 3);
      broadcastState('podium', slideIndexRef.current, { leaderboard });
    }
  };

  // RENDERS
  if (kahootState === 'lobby') {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#2563eb', color: '#fff', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>Mulai Kahoot!</div>
          <button onClick={onExit} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={32}/></button>
        </div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#111', fontSize: '1.5rem', margin: '0 0 1.5rem 0', fontWeight: 700 }}>Scan untuk Bergabung</h2>
            <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/kahoot/${presentationId}_${chapter.id}`} size={300} />
            <div style={{ marginTop: '1.5rem', color: '#3b82f6', fontWeight: 700, fontSize: '1.25rem' }}>{presentationId}_{chapter.id}</div>
          </div>
          
          <div style={{ width: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <Users size={32} />
              <span style={{ fontSize: '2rem', fontWeight: 700 }}>{Object.keys(players).length} Peserta</span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              <AnimatePresence>
                {Object.values(players).map(p => (
                  <motion.div key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{p.avatar}</span> {p.name}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => {
            // Find first quiz slide
            const firstQuizIdx = chapter.slides.findIndex((s: any) => s.isQuiz);
            if (firstQuizIdx !== -1) {
              setActiveSlideIndex(firstQuizIdx);
              // Provide index explicitly since state update is async
              startReading(firstQuizIdx);
            } else {
              alert('Tidak ada slide kuis di chapter ini!');
            }
          }} style={{ background: '#fff', color: '#2563eb', padding: '1rem 4rem', fontSize: '1.5rem', fontWeight: 800, borderRadius: '100px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            Mulai Kuis <Play fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  if (kahootState === 'podium') {
    const leaderboardAll = Object.values(players).sort((a, b) => b.score - a.score);
    const podium = leaderboardAll.slice(0, 3);
    const runnersUp = leaderboardAll.slice(3, 10).map((p, i) => ({ ...p, rank: i + 4 }));
    
    const leftRunners = runnersUp.filter((_, i) => i % 2 === 0);
    const rightRunners = runnersUp.filter((_, i) => i % 2 !== 0);

    const renderRunnerUp = (p: any, isLeft: boolean, index: number) => (
      <motion.div key={p.id} initial={{ opacity: 0, x: isLeft ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 + (index * 0.2) }} style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '300px' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8' }}>#{p.rank}</div>
        <div style={{ fontSize: '1.5rem' }}>{p.avatar}</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: '1rem', color: '#cbd5e1' }}>{p.score} pts</div>
        </div>
      </motion.div>
    );

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '2rem', color: '#eab308' }}><Trophy size={64} style={{ display: 'inline', verticalAlign: 'middle' }} /> PODIUM JUARA</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '100%', padding: '0 2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, alignItems: 'flex-end' }}>
            {leftRunners.map((p, i) => renderRunnerUp(p, true, i))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: '300px' }}>
            {podium[1] && (
              <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} style={{ width: '200px', height: '200px', background: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '1rem', borderRadius: '16px 16px 0 0' }}>
                <div style={{ fontSize: '3rem' }}>{podium[1].avatar}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{podium[1].name}</div>
                <div style={{ color: '#334155', fontWeight: 600 }}>{podium[1].score} pts</div>
                <div style={{ fontSize: '4rem', fontWeight: 900, color: '#cbd5e1', marginTop: 'auto' }}>2</div>
              </motion.div>
            )}
            {podium[0] && (
              <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} style={{ width: '220px', height: '300px', background: '#eab308', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '1rem', borderRadius: '16px 16px 0 0', boxShadow: '0 0 50px rgba(234, 179, 8, 0.4)' }}>
                <div style={{ fontSize: '3rem' }}>{podium[0].avatar}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{podium[0].name}</div>
                <div style={{ color: '#713f12', fontWeight: 700 }}>{podium[0].score} pts</div>
                <div style={{ fontSize: '5rem', fontWeight: 900, color: '#fef08a', marginTop: 'auto' }}>1</div>
              </motion.div>
            )}
            {podium[2] && (
              <motion.div initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0 }} style={{ width: '200px', height: '150px', background: '#b45309', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '1rem', borderRadius: '16px 16px 0 0' }}>
                <div style={{ fontSize: '3rem' }}>{podium[2].avatar}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{podium[2].name}</div>
                <div style={{ color: '#fde68a', fontWeight: 600 }}>{podium[2].score} pts</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#d97706', marginTop: 'auto' }}>3</div>
              </motion.div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, alignItems: 'flex-start' }}>
            {rightRunners.map((p, i) => renderRunnerUp(p, false, i))}
          </div>

        </div>

        <button onClick={onExit} style={{ marginTop: '3rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '1rem 2rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 600 }}>Selesai</button>
      </div>
    );
  }

  if (kahootState === 'interim_leaderboard') {
    const leaderboard = Object.values(players).sort((a, b) => b.score - a.score).slice(0, 5);
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', color: '#fff' }}>KLASEMEN SEMENTARA</h1>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {leaderboard.map((p, i) => (
              <motion.div key={p.id} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} style={{ background: i === 0 ? '#eab308' : 'rgba(255,255,255,0.1)', padding: '1.5rem 2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1.5rem', color: i === 0 ? '#111' : '#fff' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, width: '40px' }}>#{i+1}</div>
                <div style={{ fontSize: '2.5rem' }}>{p.avatar}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, flex: 1 }}>{p.name}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{p.score}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem' }}>
          <button onClick={nextSlide} style={{ background: '#3b82f6', color: '#fff', padding: '1rem 3rem', fontSize: '1.25rem', fontWeight: 700, borderRadius: '100px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Lanjut ke Soal Berikutnya <ArrowRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  // Reading, Answering, Result phase
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>Pertanyaan {kahootSlides.findIndex((s: any) => s.id === activeSlide.id) + 1} / {kahootSlides.length}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, background: '#ef4444', color: '#fff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {timeLeft}
          </div>
          <button onClick={onExit} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24}/></button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '3rem 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: 0 }}>
        
        <div style={{ width: '100%', maxWidth: '1200px', height: '25vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 3rem 0' }}>
          <AutoResizeText 
            text={activeSlide.title || activeSlide.quizQuestion || 'Pertanyaan Kuis'} 
            maxFontSize={80} 
            minFontSize={20} 
            align="justify"
          />
        </div>

        {kahootState === 'reading' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
              Baca soal dan persiapkan jawaban Anda!<br/>
              <span style={{ fontSize: '4rem', color: '#3b82f6', fontWeight: 800, display: 'block', marginTop: '1rem' }}>{timeLeft}</span>
            </div>
          </motion.div>
        )}

        {(kahootState === 'answering' || kahootState === 'result') && (
          <div style={{ width: '100%', maxWidth: '1200px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
            {['A', 'B', 'C', 'D'].map((opt, i) => {
              const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
              const shapes = ['▲', '◆', '●', '■'];
              const isCorrect = activeSlide.quizCorrectAnswer === opt;
              const text = activeSlide[`quizOption${opt}`] || `Pilihan ${opt}`;
              
              const isFaded = kahootState === 'result' && !isCorrect;

              return (
                <motion.div key={opt} style={{ background: colors[i], borderRadius: '16px', display: 'flex', alignItems: 'center', padding: '1.5rem', color: '#fff', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', opacity: isFaded ? 0.3 : 1, transition: 'opacity 0.3s', overflow: 'hidden', minWidth: 0, height: '100%', minHeight: 0 }}>
                  <span style={{ fontSize: '3rem', marginRight: '1.5rem', opacity: 0.8, flexShrink: 0 }}>{shapes[i]}</span>
                  <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
                    <AutoResizeText text={text} maxFontSize={40} minFontSize={10} align="left" />
                  </div>
                  
                  {kahootState === 'result' && isCorrect && (
                    <div style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: 'clamp(0.8rem, 1.2vw, 1.5rem)', flexShrink: 0, whiteSpace: 'nowrap' }}>✓ BENAR</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {kahootState === 'result' && (
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'flex-end', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={showInterimLeaderboard} style={{ background: '#2563eb', color: '#fff', padding: '1rem 3rem', fontSize: '1.25rem', fontWeight: 700, borderRadius: '100px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Lihat Klasemen <ArrowRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
