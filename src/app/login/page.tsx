'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Lock, Mail, Key, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

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
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
      
      {/* Kiri: Form Login */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#3b82f6', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', margin: '0 auto 1.5rem auto', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.5)' }}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Ruang Guru</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Masuk untuk mengelola presentasi dan kuis</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Alamat Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', color: '#0f172a' }}
                  placeholder="guru@sekolah.com"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <Key size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', color: '#0f172a' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>Masuk Sekarang <ArrowRight size={20} /></>
              )}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
            Tambahkan akun guru baru melalui Dashboard Supabase.
          </div>
        </div>
      </div>

      {/* Kanan: Ilustrasi / Dekorasi (Bisa dihilangkan jika di layar HP) */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem', color: '#fff' }} className="hide-on-mobile">
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>Selamat Datang Kembali, Guru Hebat!</h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>Kelola materi presentasi Anda, atur kuis interaktif, dan jadikan proses belajar mengajar lebih menyenangkan dari sebelumnya.</p>
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
