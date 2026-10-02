"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay, Search, BookOpen, User, PlusCircle } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/presentations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPresentations(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const filtered = presentations.filter(p => 
    p.teacher_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.subject?.toLowerCase().includes(search.toLowerCase()) ||
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MonitorPlay color="#3b82f6" /> 
              Katalog Presentasi
            </h1>
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>Eksplorasi modul pembelajaran dari berbagai guru.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <PlusCircle size={18} /> Kelola Presentasi
            </Link>
          </div>
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
    </div>
  );
}
