'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StudentPlayPage({ params }: { params: { id: string } }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const options = ['A', 'B', 'C', 'D'];

  const handleSubmit = async (ans: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, answer: ans })
      });
      setSelected(ans);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim jawaban. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Jawaban Terkirim!</h1>
          <p style={{ color: '#a1a1aa' }}>Pilihan Anda: <b>{selected}</b></p>
          <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#71717a' }}>Silakan lihat layar proyektor untuk hasil kuis.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', padding: '2rem', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Live Kuis</h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Pilih jawaban yang paling tepat</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, alignContent: 'center' }}>
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSubmit(opt)}
            disabled={submitting}
            style={{
              aspectRatio: '1/1',
              borderRadius: '24px',
              border: 'none',
              background: ['#ef4444', '#3b82f6', '#eab308', '#22c55e'][i],
              color: '#fff',
              fontSize: '4rem',
              fontWeight: 800,
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
