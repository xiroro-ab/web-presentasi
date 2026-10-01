"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ArrowLeft, Settings, LayoutGrid, CheckCircle, ExternalLink, X, PenTool, MousePointer2, Target, Lightbulb, Pencil, Eraser } from 'lucide-react';
import Link from 'next/link';

type Slide = { id: string; title: string; content: string; image?: string; embedUrl?: string; embedTitle?: string; };
type Chapter = { id: string; title: string; subtitle?: string; image?: string; slides: Slide[] };
type PresentationData = { title: string; theme?: 'gaming' | 'formal'; chapters: Chapter[] };

const GAMING_IMAGES = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=1200&auto=format&fit=crop'
];

const FORMAL_IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507676184212-d0330a151f84?q=80&w=1200&auto=format&fit=crop'
];

// Reusable Editor Toolbar
function EditorToolbar() {
  return (
    <div style={{ padding: '1rem', background: '#f4f4f5', display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e5e5', alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => document.execCommand('bold')} style={{ fontWeight: 'bold', padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}>B</button>
      <button onClick={() => document.execCommand('italic')} style={{ fontStyle: 'italic', padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}>I</button>
      <button onClick={() => document.execCommand('underline')} style={{ textDecoration: 'underline', padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}>U</button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #ccc', paddingLeft: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>Color:</span>
        <input type="color" onChange={(e) => document.execCommand('foreColor', false, e.target.value)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', width: '30px', height: '30px' }} title="Text Color" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #ccc', paddingLeft: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>Size:</span>
        <select onChange={(e) => document.execCommand('fontSize', false, e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', outline: 'none' }}>
          <option value="3">Normal</option>
          <option value="5">Besar</option>
          <option value="7">Sangat Besar</option>
        </select>
      </div>
    </div>
  );
}

// --- GAMING VIEWER ---
function GamingViewer({ data }: { data: PresentationData }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [direction, setDirection] = useState(1);
  const [showFrame, setShowFrame] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [slideNotes, setSlideNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('presentation_notes');
    if (saved) setSlideNotes(JSON.parse(saved));
  }, []);

  const saveNote = (slideId: string, html: string) => {
    const newNotes = { ...slideNotes, [slideId]: html };
    setSlideNotes(newNotes);
    localStorage.setItem('presentation_notes', JSON.stringify(newNotes));
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const xOffset = useTransform(springX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-15, 15]);
  const yOffset = useTransform(springY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [-15, 15]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const activeChapter = activeChapterIndex !== null ? data.chapters[activeChapterIndex] : null;
  const isLastSlide = activeChapter ? activeSlideIndex === activeChapter.slides.length - 1 : false;
  const activeSlide = activeChapter ? activeChapter.slides[activeSlideIndex] : null;
  const progressPercent = activeChapter && activeChapter.slides.length > 0 ? ((activeSlideIndex + 1) / activeChapter.slides.length) * 100 : 0;

  useEffect(() => { setShowFrame(false); setShowNotes(false); }, [activeSlideIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFrame) { if (e.key === 'Escape') setShowFrame(false); return; }
      if (showNotes) { if (e.key === 'Escape') setShowNotes(false); return; }
      
      if (activeChapterIndex !== null) {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') setActiveChapterIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapterIndex, activeSlideIndex, data, showFrame, showNotes]);

  const handleEnterChapter = (index: number) => { setActiveChapterIndex(index); setActiveSlideIndex(0); setDirection(1); };
  
  const nextSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex < activeChapter.slides.length - 1) {
      setDirection(1);
      setActiveSlideIndex(prev => prev + 1);
    }
  };
  
  const prevSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex > 0) {
      setDirection(-1);
      setActiveSlideIndex(prev => prev - 1);
    }
  };

  const gamingSlideVariants: any = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5, type: 'spring', bounce: 0, staggerChildren: 0.1 } },
    exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0, transition: { duration: 0.3 } })
  };

  const itemVariants: any = { enter: { x: -40, opacity: 0 }, center: { x: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#09090b', color: '#fff', fontFamily: 'var(--font-sans)' }}>
      {activeChapterIndex === null && (
        <div style={{ position: 'absolute', top: '2.5rem', right: '3rem', zIndex: 100 }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#a1a1aa', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Settings size={16} /> Configuration
          </Link>
        </div>
      )}

      {/* Media Embed Modal */}
      <AnimatePresence>
        {showFrame && activeSlide?.embedUrl && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(20px)' }} exit={{ opacity: 0, backdropFilter: 'blur(0px)' }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '85vw', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={() => setShowFrame(false)} style={{ background: '#fff', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> Tutup Frame
              </button>
            </div>
            <motion.iframe initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ delay: 0.1, duration: 0.4 }} src={activeSlide.embedUrl} style={{ width: '85vw', height: '80vh', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} allowFullScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Notes Modal */}
      <AnimatePresence>
        {showNotes && activeSlide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80vw', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>Live Papan Catatan: {activeSlide.title}</h2>
              <button onClick={() => setShowNotes(false)} style={{ background: '#fff', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> Tutup Catatan
              </button>
            </div>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} style={{ width: '80vw', maxWidth: '1000px', background: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <EditorToolbar />
              <div 
                contentEditable 
                suppressContentEditableWarning
                onBlur={(e) => saveNote(activeSlide.id, e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: slideNotes[activeSlide.id] || '<p>Mulai mengetik catatan interaktif Anda di sini...</p>' }}
                style={{ flex: 1, minHeight: '50vh', padding: '2rem', color: '#111', fontSize: '1.25rem', lineHeight: 1.8, outline: 'none', overflowY: 'auto', fontFamily: 'var(--font-sans)' }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeChapterIndex === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.8 }} style={{ width: '100%', height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }} className="hide-scrollbar">
            {data.chapters.map((chap, i) => {
              const bgImg = chap.image || GAMING_IMAGES[i % GAMING_IMAGES.length];
              return (
                <div key={chap.id} style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'start', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
                    <motion.div style={{ width: '100%', height: '100%', backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) contrast(1.1)', scale: 1.05, x: xOffset, y: yOffset }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #09090b 0%, transparent 60%, #09090b 100%)' }} />
                  </div>
                  <motion.div initial={{ x: -60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.1 }} style={{ zIndex: 10, paddingLeft: '8%', maxWidth: '800px' }}>
                    <p style={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1.5rem' }}>MODULE {String(i + 1).padStart(2, '0')} // {chap.subtitle || 'Chapter'}</p>
                    <h1 style={{ fontSize: '5rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', marginBottom: '3rem' }}>{chap.title}</h1>
                    <button onClick={() => handleEnterChapter(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', padding: '1rem 2rem', background: 'transparent', border: '1px solid rgba(59,130,246,0.5)', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Enter Module <ArrowRight size={18} color="#3b82f6" />
                    </button>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="slide-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <motion.div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${activeChapter?.image || GAMING_IMAGES[activeChapterIndex! % GAMING_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(15px) brightness(0.2)', zIndex: 0, scale: 1.05, x: xOffset, y: yOffset }} />
            
            <div style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: 'rgba(255,255,255,0.05)', width: '100%', zIndex: 50 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: '100%', background: '#3b82f6' }} />
            </div>

            <button onClick={() => setActiveChapterIndex(null)} style={{ position: 'fixed', top: '2.5rem', left: '3rem', zIndex: 50, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#a1a1aa', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Exit Module
            </button>

            {/* Content Container */}
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8rem 6% 10rem 6%' }} className="hide-scrollbar">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div key={activeSlideIndex} custom={direction} variants={gamingSlideVariants} initial="enter" animate="center" exit="exit" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', background: 'rgba(9, 9, 11, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '4rem', borderRadius: '16px' }}>
                  <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '30px', height: '2px', background: '#3b82f6' }} />
                    <p style={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.8rem' }}>SEQ {String(activeSlideIndex + 1).padStart(2, '0')} / {String(activeChapter?.slides.length || 0).padStart(2, '0')}</p>
                  </motion.div>
                  
                  <motion.h1 variants={itemVariants} style={{ fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '2.5rem', color: '#fff' }}>
                    {activeSlide?.title}
                  </motion.h1>
                  
                  {activeSlide?.image && (
                    <motion.div variants={itemVariants} style={{ marginBottom: '2.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <img src={activeSlide.image} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} alt="Slide" />
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} style={{ fontSize: '1.25rem', color: '#a1a1aa', lineHeight: 1.8, fontWeight: 400, whiteSpace: 'pre-wrap', textAlign: 'justify', marginBottom: '3rem' }}>
                    {activeSlide?.content}
                  </motion.div>

                  {/* Interactive Elements Area */}
                  <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                    {activeSlide?.embedUrl && (
                      <button onClick={() => setShowFrame(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '100px', transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.background='#3b82f6'; e.currentTarget.style.color='#fff'}} onMouseOut={e => {e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#3b82f6'}}>
                        <ExternalLink size={18} /> {activeSlide.embedTitle || 'Buka Link Interaktif'}
                      </button>
                    )}
                    
                    <button onClick={() => setShowNotes(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '100px', transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.background='rgba(255,255,255,0.1)'}} onMouseOut={e => {e.currentTarget.style.background='transparent'}}>
                      <PenTool size={18} /> Buka Papan Catatan
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    {!isLastSlide ? (
                      <button onClick={nextSlide} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Proceed to Next <ArrowRight size={18} /></button>
                    ) : (
                      <button onClick={() => setActiveChapterIndex(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}><CheckCircle size={18} /> Complete Module</button>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            <div style={{ position: 'fixed', bottom: '3rem', right: '3rem', zIndex: 50, display: 'flex', gap: '1rem' }}>
              <button onClick={prevSlide} disabled={activeSlideIndex === 0} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: activeSlideIndex === 0 ? 'not-allowed' : 'pointer', opacity: activeSlideIndex === 0 ? 0.3 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
              <button onClick={nextSlide} disabled={isLastSlide} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: '#fff', color: '#09090b', cursor: isLastSlide ? 'not-allowed' : 'pointer', opacity: isLastSlide ? 0.3 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- ELEGANT FORMAL VIEWER ---
function FormalViewer({ data }: { data: PresentationData }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [direction, setDirection] = useState(1);
  const [showFrame, setShowFrame] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [slideNotes, setSlideNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('presentation_notes');
    if (saved) setSlideNotes(JSON.parse(saved));
  }, []);

  const saveNote = (slideId: string, html: string) => {
    const newNotes = { ...slideNotes, [slideId]: html };
    setSlideNotes(newNotes);
    localStorage.setItem('presentation_notes', JSON.stringify(newNotes));
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const xOffset = useTransform(springX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-15, 15]);
  const yOffset = useTransform(springY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [-15, 15]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const activeChapter = activeChapterIndex !== null ? data.chapters[activeChapterIndex] : null;
  const isLastSlide = activeChapter ? activeSlideIndex === activeChapter.slides.length - 1 : false;
  const activeSlide = activeChapter ? activeChapter.slides[activeSlideIndex] : null;
  const progressPercent = activeChapter && activeChapter.slides.length > 0 ? ((activeSlideIndex + 1) / activeChapter.slides.length) * 100 : 0;

  useEffect(() => { setShowFrame(false); setShowNotes(false); }, [activeSlideIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFrame) { if (e.key === 'Escape') setShowFrame(false); return; }
      if (showNotes) { if (e.key === 'Escape') setShowNotes(false); return; }

      if (activeChapterIndex !== null) {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') setActiveChapterIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapterIndex, activeSlideIndex, data, showFrame, showNotes]);

  const handleEnterChapter = (index: number) => { setActiveChapterIndex(index); setActiveSlideIndex(0); setDirection(1); };
  
  const nextSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex < activeChapter.slides.length - 1) {
      setDirection(1);
      setActiveSlideIndex(prev => prev + 1);
    }
  };
  
  const prevSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex > 0) {
      setDirection(-1);
      setActiveSlideIndex(prev => prev - 1);
    }
  };

  const formalVariants: any = {
    enter: (dir: number) => ({ y: dir > 0 ? 30 : -30, opacity: 0 }),
    center: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 } },
    exit: (dir: number) => ({ y: dir < 0 ? 30 : -30, opacity: 0, transition: { duration: 0.3 } })
  };

  const itemVariants: any = { enter: { x: -40, opacity: 0 }, center: { x: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff', color: '#111', fontFamily: 'var(--font-sans)' }}>
      {activeChapterIndex === null && (
        <div style={{ position: 'absolute', top: '2.5rem', right: '3rem', zIndex: 100 }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', textDecoration: 'none', fontWeight: 500, fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '100px' }}>
            <Settings size={16} /> Settings
          </Link>
        </div>
      )}

      {/* Frame Modal Overlay */}
      <AnimatePresence>
        {showFrame && activeSlide?.embedUrl && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(20px)' }} exit={{ opacity: 0, backdropFilter: 'blur(0px)' }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '85vw', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={() => setShowFrame(false)} style={{ background: '#111', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 500, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> Tutup View
              </button>
            </div>
            <motion.iframe initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ delay: 0.1, duration: 0.4 }} src={activeSlide.embedUrl} style={{ width: '85vw', height: '80vh', border: '1px solid #e5e5e5', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} allowFullScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Notes Modal */}
      <AnimatePresence>
        {showNotes && activeSlide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80vw', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Catatan Interaktif: {activeSlide.title}</h2>
              <button onClick={() => setShowNotes(false)} style={{ background: '#111', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 500, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> Tutup Catatan
              </button>
            </div>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} style={{ width: '80vw', maxWidth: '1000px', background: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e5e5e5' }}>
              <EditorToolbar />
              <div 
                contentEditable 
                suppressContentEditableWarning
                onBlur={(e) => saveNote(activeSlide.id, e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: slideNotes[activeSlide.id] || '<p>Mulai mengetik catatan interaktif Anda di sini...</p>' }}
                style={{ flex: 1, minHeight: '50vh', padding: '2rem', color: '#111', fontSize: '1.25rem', lineHeight: 1.8, outline: 'none', overflowY: 'auto', fontFamily: 'var(--font-sans)' }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeChapterIndex === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.8 }} style={{ width: '100%', height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }} className="hide-scrollbar">
            {data.chapters.map((chap, i) => {
              const bgImg = chap.image || FORMAL_IMAGES[i % FORMAL_IMAGES.length];
              return (
                <div key={chap.id} style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'start', position: 'relative', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8%', background: '#fff', zIndex: 2 }}>
                    <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.1 }}>
                      <p style={{ color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem', fontSize: '0.8rem' }}>{chap.subtitle || `Section ${String(i + 1).padStart(2, '0')}`}</p>
                      <h1 style={{ fontSize: '4.5rem', fontWeight: 400, lineHeight: 1.1, color: '#111', marginBottom: '3rem', letterSpacing: '-0.03em' }}>{chap.title}</h1>
                      <button onClick={() => handleEnterChapter(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', padding: '0', background: 'transparent', border: 'none', color: '#111', cursor: 'pointer', fontWeight: 500 }}>
                        Begin Module <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e5e5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ArrowRight size={16} /></div>
                      </button>
                    </motion.div>
                  </div>
                  <div style={{ width: '55%', height: '100%', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
                    <motion.div style={{ width: '100%', height: '100%', scale: 1.05, x: xOffset, y: yOffset }}>
                      <motion.div initial={{ scale: 1.1 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ width: '100%', height: '100%' }}>
                        <img src={bgImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="slide-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', height: '100%', position: 'relative', background: '#fafafa' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: '#e5e5e5', width: '100%', zIndex: 50 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: '100%', background: '#111' }} />
            </div>

            <button onClick={() => setActiveChapterIndex(null)} style={{ position: 'fixed', top: '2.5rem', left: '3rem', zIndex: 50, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <LayoutGrid size={16} /> Back to Index
            </button>

            {/* Content Container */}
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8rem 6% 10rem 6%' }} className="hide-scrollbar">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div key={activeSlideIndex} custom={direction} variants={formalVariants} initial="enter" animate="center" exit="exit" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                  <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <p style={{ color: '#888', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                      Slide {String(activeSlideIndex + 1).padStart(2, '0')} of {String(activeChapter?.slides.length || 0).padStart(2, '0')}
                    </p>
                  </motion.div>
                  
                  <motion.h1 variants={itemVariants} style={{ fontSize: '3.5rem', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '2.5rem', color: '#111' }}>
                    {activeSlide?.title}
                  </motion.h1>
                  
                  {activeSlide?.image && (
                    <motion.div variants={itemVariants} style={{ marginBottom: '2.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e5', display: 'flex', justifyContent: 'center', background: '#f4f4f5' }}>
                      <img src={activeSlide.image} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} alt="Slide" />
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} style={{ fontSize: '1.4rem', color: '#555', lineHeight: 1.8, fontWeight: 300, whiteSpace: 'pre-wrap', textAlign: 'justify', marginBottom: '3rem' }}>
                    {activeSlide?.content}
                  </motion.div>

                  {/* Interactive Elements Area */}
                  <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                    {activeSlide?.embedUrl && (
                      <button onClick={() => setShowFrame(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #111', color: '#111', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '100px', transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.background='#111'; e.currentTarget.style.color='#fff'}} onMouseOut={e => {e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#111'}}>
                        <ExternalLink size={18} /> {activeSlide.embedTitle || 'Buka Link Interaktif'}
                      </button>
                    )}
                    
                    <button onClick={() => setShowNotes(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #e5e5e5', color: '#555', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '100px', transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.background='#f4f4f5'}} onMouseOut={e => {e.currentTarget.style.background='transparent'}}>
                      <PenTool size={18} /> Buka Papan Catatan
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e5e5e5', paddingTop: '2rem' }}>
                    {!isLastSlide ? (
                      <button onClick={nextSlide} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#111', color: '#fff', border: 'none', borderRadius: '100px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' }}>Continue <ArrowRight size={16} /></button>
                    ) : (
                      <button onClick={() => setActiveChapterIndex(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#fff', color: '#111', border: '1px solid #e5e5e5', borderRadius: '100px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' }}><CheckCircle size={16} /> Finish Section</button>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div style={{ position: 'fixed', bottom: '3rem', right: '3rem', zIndex: 50, display: 'flex', gap: '1rem' }}>
              <button onClick={prevSlide} disabled={activeSlideIndex === 0} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #e5e5e5', background: '#fff', color: '#111', cursor: activeSlideIndex === 0 ? 'not-allowed' : 'pointer', opacity: activeSlideIndex === 0 ? 0.3 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
              <button onClick={nextSlide} disabled={isLastSlide} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: '#111', color: '#fff', cursor: isLastSlide ? 'not-allowed' : 'pointer', opacity: isLastSlide ? 0.3 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- PRESENTATION TOOLS OVERLAY ---
function PresentationToolsOverlay({ children }: { children: React.ReactNode }) {
  const [activeTool, setActiveTool] = useState<'none' | 'laser' | 'flashlight' | 'draw'>('none');
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [lines, setLines] = useState<{points: {x:number, y:number}[]}[]>([]);
  const [currentLine, setCurrentLine] = useState<{x:number, y:number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.scrollTop !== undefined) {
        setScrollOffset({ x: target.scrollLeft || 0, y: target.scrollTop || 0 });
      }
    };
    window.addEventListener('scroll', handleScroll, true); // true = capture phase
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setActiveTool('laser');
      if (e.key === '2') setActiveTool('flashlight');
      if (e.key === '3') setActiveTool('draw');
      if (e.key === '0' || e.key === 'Escape') {
        if (activeTool !== 'none') setActiveTool('none');
      }
      if (e.key === 'c' || e.key === 'C') setLines([]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool !== 'draw') return;
    if ((e.target as Element).closest('#presentation-toolbar')) return;

    setIsDrawing(true);
    setCurrentLine([{ x: e.clientX + scrollOffset.x, y: e.clientY + scrollOffset.y }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeTool !== 'draw' || !isDrawing) return;
    setCurrentLine(prev => [...prev, { x: e.clientX + scrollOffset.x, y: e.clientY + scrollOffset.y }]);
  };

  const handlePointerUp = () => {
    if (activeTool !== 'draw' || !isDrawing) return;
    setIsDrawing(false);
    if (currentLine.length > 0) {
      setLines(prev => [...prev, { points: currentLine }]);
      setCurrentLine([]);
    }
  };

  return (
    <div 
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Base Presentation */}
      <div style={{ userSelect: activeTool === 'draw' ? 'none' : 'auto', width: '100%', height: '100%' }}>
        {children}
      </div>

      {/* Flashlight Overlay */}
      {activeTool === 'flashlight' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998,
          pointerEvents: 'none',
          background: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.85) 100%)`
        }} />
      )}

      {/* Laser Mouse Overlay */}
      {activeTool === 'laser' && (
        <motion.div 
          animate={{ x: mousePos.x - 10, y: mousePos.y - 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.5 }}
          style={{
            position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 20px 10px rgba(239, 68, 68, 0.5)'
          }}
        />
      )}

      {/* Drawing Overlay */}
      {(activeTool === 'draw' || lines.length > 0) && (
        <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9997, pointerEvents: 'none' }}>
          <g style={{ transform: `translate(${-scrollOffset.x}px, ${-scrollOffset.y}px)`, transition: 'transform 0.05s linear' }}>
            {lines.map((line, i) => (
              <polyline
                key={i}
                points={line.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {isDrawing && currentLine.length > 0 && (
              <polyline
                points={currentLine.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        </svg>
      )}

      {/* Floating Tools Control */}
      <div id="presentation-toolbar" style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 10000, display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.75rem', borderRadius: '100px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => setActiveTool('none')} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: activeTool === 'none' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Cursor Normal (0)"><MousePointer2 size={18} /></button>
        <button onClick={() => setActiveTool('laser')} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: activeTool === 'laser' ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Laser Pointer (1)"><Target size={18} /></button>
        <button onClick={() => setActiveTool('flashlight')} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: activeTool === 'flashlight' ? '#eab308' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Senter / Flashlight (2)"><Lightbulb size={18} /></button>
        <button onClick={() => setActiveTool('draw')} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: activeTool === 'draw' ? '#10b981' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Mode Coret / Draw (3)"><Pencil size={18} /></button>
        {lines.length > 0 && (
          <button onClick={() => setLines([])} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: '0.5rem' }} title="Hapus Semua Coretan (C)"><Eraser size={18} /></button>
        )}
      </div>
    </div>
  );
}

// --- MAIN WRAPPER ---
export default function PresentationViewer() {
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/presentation')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#09090b', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Experience...</div>;
  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>Error loading data.</div>;

  const theme = data.theme || 'gaming';
  return (
    <PresentationToolsOverlay>
      {theme === 'gaming' ? <GamingViewer data={data} /> : <FormalViewer data={data} />}
    </PresentationToolsOverlay>
  );
}
