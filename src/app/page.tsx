"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay, Search, BookOpen, User, PlusCircle, Settings, Image as ImageIcon, X, Upload } from 'lucide-react';
import { AboutMeModal } from '../../AboutMeModal';
import { saveBackgroundToDB, getBackgroundFromDB, deleteBackgroundFromDB } from '../lib/indexedDbHelper';

type PresentationMeta = {
  id: string;
  teacher_name: string;
  subject: string;
  title: string;
  theme: string;
  created_at: string;
};

export default function CatalogPage() {
  const [presentations, setPresentations] = useState<PresentationMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [globalBg, setGlobalBg] = useState('');
  const [isBgConfigOpen, setIsBgConfigOpen] = useState(false);
  const [tempBgUrl, setTempBgUrl] = useState('');

  useEffect(() => {
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
      } catch (e) {
        console.error('Failed to load global bg', e);
      }
    };
    loadBg();

    fetch('/api/presentations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPresentations(data.filter((d: any) => d.title !== 'GLOBAL_SETTINGS'));
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const convertGithubLink = (url: string) => {
    if (url.includes('github.com') && url.includes('/blob/')) {
      return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return url;
  };

  const filtered = presentations.filter(p => 
    p.teacher_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.subject?.toLowerCase().includes(search.toLowerCase()) ||
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const isVideoBg = globalBg.match(/\.(mp4|webm|ogg)$/i) || globalBg.startsWith('data:video/');

  return (
    <div style={{ minHeight: '100vh', background: globalBg ? '#000' : '#09090b', color: '#fff', fontFamily: 'var(--font-sans)', padding: '2rem', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      
      {/* Dynamic Background */}
      {globalBg && isVideoBg && (
        <video autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0, opacity: 0.6 }}>
          <source src={globalBg} type="video/mp4" />
        </video>
      )}
      {globalBg && !isVideoBg && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${globalBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: 0.6 }} />
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)', zIndex: 0, pointerEvents: 'none' }} />
      
      {/* Floating Buttons */}
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 100, display: 'flex', gap: '1rem' }}>
        <button onClick={() => { setTempBgUrl(globalBg); setIsBgConfigOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', backdropFilter: 'blur(10px)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
          <ImageIcon size={18} /> Ganti Background
        </button>
        <button onClick={() => setIsAboutOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', backdropFilter: 'blur(10px)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
          <User size={18} /> About Me
        </button>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', backdropFilter: 'blur(10px)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
          <Settings size={18} /> Configuration
        </Link>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '4rem', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MonitorPlay color="#3b82f6" /> 
              Katalog Presentasi
            </h1>
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>Eksplorasi modul pembelajaran dari berbagai guru.</p>
          </div>
          {/* Sembunyikan tombol header ini jika sudah ada tombol floating */}
          {/* <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <PlusCircle size={18} /> Kelola Presentasi
            </Link>
          </div> */}
        </header>

        {/* Search */}
        <div style={{ marginBottom: '3rem', position: 'relative', maxWidth: '500px' }}>
          <Search size={20} color="#a1a1aa" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cari nama guru, mata pelajaran, atau judul..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa' }}>Memuat data presentasi...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            Belum ada presentasi yang ditemukan.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={p.id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        <User size={12} /> {p.teacher_name || 'Tanpa Nama'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        <BookOpen size={12} /> {p.subject || 'Umum'}
                      </span>
                    </div>
                    
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem 0', lineHeight: 1.3 }}>{p.title || 'Presentasi Tanpa Judul'}</h2>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <Link href={`/view/${p.id}`} style={{ display: 'block', textAlign: 'center', width: '100%', background: '#fff', color: '#000', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                        Buka Presentasi
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      <AboutMeModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Background Config Modal */}
      <AnimatePresence>
        {isBgConfigOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: 'rgba(30,30,35,0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
              <button onClick={() => setIsBgConfigOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
              
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={24} color="#3b82f6" /> 
                Konfigurasi Background
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '2rem' }}>Ubah tampilan latar belakang. Mendukung format gambar (JPG/PNG) dan video (MP4/WEBM).</p>
              
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>URL Gambar / Video</label>
              <input 
                type="text" 
                value={tempBgUrl.startsWith('data:') ? 'Local File Selected' : tempBgUrl}
                onChange={(e) => setTempBgUrl(e.target.value)}
                placeholder="https://..."
                disabled={tempBgUrl.startsWith('data:')}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: tempBgUrl.startsWith('data:') ? '#3b82f6' : '#fff', borderRadius: '12px', outline: 'none', marginBottom: '1rem', fontSize: '1rem' }}
              />
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Upload size={16} /> Atau Upload File Lokal
                  <input type="file" accept="image/*, video/mp4, video/webm" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setTempBgUrl(evt.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={async () => { 
                  setTempBgUrl(''); 
                  setGlobalBg(''); 
                  await deleteBackgroundFromDB(); 
                  await fetch('/api/settings', { method: 'POST', body: JSON.stringify({ bg: '' }) });
                  setIsBgConfigOpen(false); 
                }} style={{ flex: 1, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Hapus Background
                </button>
                <button onClick={async () => { 
                  const finalUrl = tempBgUrl.startsWith('data:') ? 'INDEXEDDB' : convertGithubLink(tempBgUrl);
                  
                  if (tempBgUrl.startsWith('data:')) {
                    await saveBackgroundToDB(tempBgUrl);
                  }
                  
                  await fetch('/api/settings', { method: 'POST', body: JSON.stringify({ bg: finalUrl }) });
                  
                  setGlobalBg(tempBgUrl.startsWith('data:') ? tempBgUrl : finalUrl); 
                  setIsBgConfigOpen(false); 
                }} style={{ flex: 1, padding: '1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
