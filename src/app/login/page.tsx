'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Mail, Key, ArrowRight, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackgroundFromDB } from '../../lib/indexedDbHelper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Animation State
  const [focusState, setFocusState] = useState<'idle' | 'email' | 'password'>('idle');

  // Background state
  const [globalBg, setGlobalBg] = useState('');
  const [globalBgOpacity, setGlobalBgOpacity] = useState(0.6);

  useEffect(() => {
    // Load background
    const loadBg = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data && data.bg) {
          if (data.bg === 'INDEXEDDB') {
            const idbBg = await getBackgroundFromDB();
            if (idbBg) setGlobalBg(idbBg);
          } else {
            setGlobalBg(data.bg);
          }
        }
        if (data && data.bgOpacity !== undefined) {
          setGlobalBgOpacity(data.bgOpacity);
        }
      } catch (e) {
        console.error('Failed to load global bg', e);
      }
    };
    loadBg();

    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/admin');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Email atau Password salah. Silakan coba lagi.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  const isVideoBg = globalBg.match(/\.(mp4|webm|ogg)$/i) || globalBg.startsWith('data:video/');

  if (checking) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#09090b' }}>
        <Loader2 className="animate-spin" size={48} color="#3b82f6" />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}} />
      </div>
    );
  }

  // Animasi untuk Avatar Emoji
  const getAvatarEmoji = () => {
    if (focusState === 'password') return '🙈';
    if (focusState === 'email') return '👀';
    return '👋';
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: globalBg ? '#000' : '#09090b', color: '#fff', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Dynamic Background */}
      {globalBg && isVideoBg && (
        <video autoPlay loop muted playsInline style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0, opacity: globalBgOpacity }}>
          <source src={globalBg} type="video/mp4" />
        </video>
      )}
      {globalBg && !isVideoBg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: \`url(\${globalBg})\`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: globalBgOpacity }} />
      )}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Main Form Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '440px', padding: '2rem', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', padding: '0.5rem 1rem', borderRadius: '100px', backdropFilter: 'blur(10px)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', marginBottom: '2.5rem' }} onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#fff'}} onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'}}>
          <ArrowLeft size={16} /> Kembali ke Halaman Utama
        </Link>

        {/* Animated Avatar Box */}
        <div style={{ marginBottom: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div 
            key={focusState}
            initial={{ scale: 0.8, rotate: focusState === 'password' ? -10 : focusState === 'email' ? 10 : 0 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{ width: '80px', height: '80px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto', boxShadow: '0 0 40px rgba(59,130,246,0.2)', backdropFilter: 'blur(10px)' }}
          >
            {getAvatarEmoji()}
          </motion.div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Ruang Guru</h1>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(0,0,0,0.4)', padding: '2.5rem', borderRadius: '32px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '0.5rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 500 }}
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color={focusState === 'email' ? '#60a5fa' : "rgba(255,255,255,0.4)"} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusState('email')}
                onBlur={() => setFocusState('idle')}
                style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', outline: 'none', fontSize: '1rem', color: '#fff', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                onMouseOver={e=>{if(focusState !== 'email') e.currentTarget.style.border='1px solid rgba(255,255,255,0.2)'}}
                onMouseOut={e=>{if(focusState !== 'email') e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)'}}
                placeholder="guru@sekolah.com"
              />
            </div>
          </motion.div>

          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Key size={20} color={focusState === 'password' ? '#60a5fa' : "rgba(255,255,255,0.4)"} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusState('password')}
                onBlur={() => setFocusState('idle')}
                style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', outline: 'none', fontSize: '1rem', color: '#fff', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                onMouseOver={e=>{if(focusState !== 'password') e.currentTarget.style.border='1px solid rgba(255,255,255,0.2)'}}
                onMouseOut={e=>{if(focusState !== 'password') e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)'}}
                placeholder="••••••••"
              />
            </div>
          </motion.div>

          <motion.button 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            type="submit" 
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', border: 'none', padding: '1.25rem', borderRadius: '16px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, boxShadow: '0 10px 25px -5px rgba(59,130,246,0.5)', transition: 'all 0.2s' }}
            onMouseOver={e=> { if(!loading) e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseOut={e=> { if(!loading) e.currentTarget.style.transform='translateY(0)' }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <>Masuk Sekarang <ArrowRight size={20} /></>
            )}
          </motion.button>
        </form>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          Hanya guru yang berwenang yang dapat mengakses.
        </motion.div>
      </motion.div>
    </div>
  );
}
