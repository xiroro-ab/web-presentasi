'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Lock, Mail, Key, ArrowRight, AlertCircle, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    // Cek apakah sudah login
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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#09090b', color: '#fff', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      {/* Kiri: Form Login */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '2rem', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='#a1a1aa'}>
            <ArrowLeft size={16} /> Kembali ke Halaman Utama
          </Link>

          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#60a5fa', margin: '0 auto 1.5rem auto', boxShadow: '0 0 30px rgba(59,130,246,0.2)' }}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>Ruang Guru</h1>
            <p style={{ color: '#a1a1aa', margin: 0 }}>Masuk untuk mengelola presentasi dan kuis</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500, backdropFilter: 'blur(10px)' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.5rem' }}>Alamat Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="#71717a" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', outline: 'none', fontSize: '1rem', color: '#fff', transition: 'border 0.2s' }}
                  onFocus={e=>e.currentTarget.style.border='1px solid rgba(59,130,246,0.5)'}
                  onBlur={e=>e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)'}
                  placeholder="guru@sekolah.com"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.5rem' }}>Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <Key size={20} color="#71717a" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', outline: 'none', fontSize: '1rem', color: '#fff', transition: 'border 0.2s' }}
                  onFocus={e=>e.currentTarget.style.border='1px solid rgba(59,130,246,0.5)'}
                  onBlur={e=>e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)'}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
              onMouseOver={e=> { if(!loading) e.currentTarget.style.background='#2563eb' }}
              onMouseOut={e=> { if(!loading) e.currentTarget.style.background='#3b82f6' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>Masuk Sekarang <ArrowRight size={20} /></>
              )}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#52525b' }}>
            Tambahkan akun guru baru melalui Dashboard Supabase.
          </div>
        </div>
      </div>

      {/* Kanan: Ilustrasi / Dekorasi (Bisa dihilangkan jika di layar HP) */}
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem', color: '#fff', zIndex: 1, backdropFilter: 'blur(20px)' }} className="hide-on-mobile">
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#c084fc', margin: '0 auto 2rem auto', boxShadow: '0 0 40px rgba(168,85,247,0.2)' }}>
            <Sparkles size={40} />
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>Selamat Datang Kembali, Guru Hebat!</h2>
          <p style={{ fontSize: '1.1rem', color: '#a1a1aa', lineHeight: 1.6 }}>Kelola materi presentasi Anda, atur kuis interaktif, dan jadikan proses belajar mengajar lebih menyenangkan dengan sentuhan magis AI.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
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
