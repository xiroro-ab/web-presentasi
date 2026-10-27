'use client';
import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';

export default function StudentPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const options = ['A', 'B', 'C', 'D'];

  const getVoterId = () => {
    if (typeof window === 'undefined') return '';
    let vid = localStorage.getItem('poll_device_voter_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('poll_device_voter_id', vid);
    }
    return vid;
  };

  useEffect(() => {
    const voterId = getVoterId();
    const pollKey = `poll_voted_${resolvedParams.id}`;

    // Read local cache immediately to prevent voting again on refresh
    const cachedVote = localStorage.getItem(pollKey);
    if (cachedVote) {
      setSelected(cachedVote);
      setSubmitted(true);
    }

    // Verify with server in case student refreshed, or teacher reset poll
    const checkServerStatus = async () => {
      try {
        const res = await fetch(`/api/polls?id=${resolvedParams.id}&voterId=${voterId}`);
        const data = await res.json();
        if (data.hasVoted && data.myVote) {
          setSelected(data.myVote);
          setSubmitted(true);
          localStorage.setItem(pollKey, data.myVote);
        } else if (data.hasVoted === false) {
          // If teacher clicked "Reset Hasil Polling", server poll session was deleted
          if (cachedVote) {
            localStorage.removeItem(pollKey);
            setSelected(null);
            setSubmitted(false);
          }
        }
      } catch (e) {
        console.error('Error verifying poll status:', e);
      }
    };

    checkServerStatus();

    // Check periodically so if teacher resets while student is looking at "Jawaban Terkirim",
    // the page automatically unlocks for the new poll round
    const interval = setInterval(checkServerStatus, 3000);
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  const handleSubmit = async (ans: string) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const voterId = getVoterId();
    const pollKey = `poll_voted_${resolvedParams.id}`;

    // Lock immediately on client to block fast multi-clicks
    setSelected(ans);
    setSubmitted(true);
    localStorage.setItem(pollKey, ans);

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resolvedParams.id, answer: ans, voterId })
      });
      const data = await res.json();
      if (data.alreadyVoted && data.selected) {
        setSelected(data.selected);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim jawaban. Silakan coba lagi.');
      setSubmitted(false);
      localStorage.removeItem(pollKey);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100dvh', background: '#09090b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(1rem, 4vw, 2rem)', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, marginBottom: '0.5rem' }}>Jawaban Terkirim!</h1>
          <p style={{ color: '#a1a1aa' }}>Pilihan Anda: <b>{selected}</b></p>
          <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>✓</span> Suara Anda sudah tersimpan (1 siswa = 1 suara)
          </div>
          <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#71717a' }}>Silakan lihat layar proyektor untuk hasil polling.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090b', color: '#fff', padding: 'clamp(1rem, 4vw, 2rem)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 4vh, 3rem)' }}>
        <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Live Polling</h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Pilih jawaban yang paling tepat (1 siswa hanya 1 suara)</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.75rem, 2vw, 1rem)', flex: 1, alignContent: 'center', maxWidth: '500px', width: '100%', margin: '0 auto' }}>
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
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
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
