'use client';
import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  // The id format is: {presentationId}_{slideId}
  const [presentationId, slideId] = resolvedParams.id.split('_');

  const [studentName, setStudentName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slideData, setSlideData] = useState<any>(null);
  
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (hasJoined && timeLeft !== null && timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (hasJoined && timeLeft === 0 && !submitted) {
      handleSubmit('TIMEOUT');
    }
  }, [hasJoined, timeLeft, submitted]);

  useEffect(() => {
    // Fetch presentation to get quiz data
    fetch(`/api/presentations/${presentationId}`)
      .then(res => res.json())
      .then(data => {
        if (data.content && data.content.chapters) {
          let foundSlide = null;
          for (const chap of data.content.chapters) {
            const slide = chap.slides.find((s: any) => s.id === slideId);
            if (slide) {
              foundSlide = slide;
              break;
            }
          }
          setSlideData(foundSlide);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [presentationId, slideId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setHasJoined(true);
    setTimeLeft(slideData?.quizTimer || 30);
  };

  const handleSubmit = async (ans: string) => {
    if (submitting) return;
    setSubmitting(true);
    setSelected(ans === 'TIMEOUT' ? 'Waktu Habis!' : ans);
    
    const correctAns = slideData?.quizCorrectAnswer || 'A';
    const correct = ans === correctAns;
    setIsCorrect(correct);

    const maxTime = slideData?.quizTimer || 30;
    const points = correct ? Math.max(10, Math.round(((timeLeft || 1) / maxTime) * 100)) : 0;

    try {
      await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resolvedParams.id, studentName, points })
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim jawaban. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat kuis...</div>;
  }

  if (!slideData || !slideData.isQuiz) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Kuis Tidak Ditemukan</h1>
        <p style={{ color: '#a1a1aa' }}>Slide ini bukan slide kuis interaktif.</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #171720 100%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-sans)', overflowY: 'auto' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '3rem 2rem', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#3b82f6' }}>Siap Bermain?</h1>
          <p style={{ color: '#a1a1aa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Masukkan nama kamu untuk ikut kuis ini.</p>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>⏱ Waktu Menjawab: {slideData?.quizTimer || 30} Detik</p>
            <p style={{ margin: '0.5rem 0 0 0', color: '#bfdbfe', fontSize: '0.8rem' }}>Semakin cepat kamu menjawab dengan benar, <b>semakin tinggi poin yang didapat!</b></p>
          </div>
          
          <form onSubmit={handleJoin}>
            <input 
              type="text" 
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Nama Lengkap..."
              required
              style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', fontSize: '1.1rem', marginBottom: '1rem', outline: 'none', textAlign: 'center' }}
            />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.4)' }}>
              Mulai Kuis
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: isCorrect ? 'linear-gradient(135deg, #166534 0%, #064e3b 100%)' : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{isCorrect ? '🎉' : '❌'}</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{isCorrect ? 'Benar Sekali!' : 'Sayang Sekali Salah...'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>Pilihan Anda: <b>{selected}</b></p>
          <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Silakan lihat layar proyektor untuk skor leaderboard.</p>
        </motion.div>
      </div>
    );
  }

  const options = ['A', 'B', 'C', 'D'];
  const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', background: '#09090b', color: '#fff', padding: '2rem', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>
          Peserta: <b>{studentName}</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: (timeLeft || 0) <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', padding: '0.4rem 1rem', borderRadius: '100px', color: (timeLeft || 0) <= 5 ? '#ef4444' : '#60a5fa', fontWeight: 800, border: `1px solid ${(timeLeft || 0) <= 5 ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.5)'}` }}>
          ⏱ {timeLeft}s
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '2rem', width: '100%', maxWidth: '600px' }}>
        {slideData.quizQuestion ? (
          <div className="quiz-question-html" style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', lineHeight: 1.4, textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: slideData.quizQuestion }} />
        ) : (
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>Kuis Interaktif</h1>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '600px', flex: 1 }}>
        {options.map((opt, i) => {
          const optText = slideData[`quizOption${opt}`];
          if (!optText) return null;

          return (
            <motion.button
              key={opt}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubmit(opt)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '1.5rem',
                borderRadius: '16px',
                border: 'none',
                background: colors[i],
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                opacity: submitting ? 0.7 : 1,
                textAlign: 'left'
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{opt}</div>
              <div style={{ flex: 1 }}>{optText}</div>
            </motion.button>
          )
        })}
      </div>
    </div>
  );
}
