"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Settings, LayoutGrid, CheckCircle, ExternalLink, X, PenTool, Sun, Moon, Map, Pointer, Edit3, Lightbulb, Search } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, PresentationControls } from '@react-three/drei';

function Model3D({ url }: { url: string }) {
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch(e) {
    return null;
  }
}

export type Slide = { id: string; title: string; content: string; image?: string; backgroundImage?: string; videoBackground?: string; chartData?: string; model3DUrl?: string; timelineData?: string; embedUrl?: string; embedTitle?: string; };
export type Chapter = { id: string; title: string; subtitle?: string; image?: string; slides: Slide[] };
export type PresentationData = { title: string; theme?: 'gaming' | 'formal'; chapters: Chapter[] };

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

// --- 1. INTERACTION LAYER (LASER, DRAW, SPOTLIGHT, MAGNIFY) ---
function InteractionLayer({ mode }: { mode: 'none' | 'laser' | 'draw' | 'spotlight' | 'magnify' }) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (mode === 'none') return;
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mode]);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        contextRef.current = ctx;
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(e.clientX, e.clientY);
    setIsDrawing(true);
  };
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || mode !== 'draw' || !contextRef.current) return;
    contextRef.current.lineTo(e.clientX, e.clientY);
    contextRef.current.stroke();
  };
  const stopDrawing = () => {
    if (mode !== 'draw' || !contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  if (mode === 'none') return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: mode === 'draw' ? 'auto' : 'none' }}>
      {mode === 'laser' && (
        <motion.div className="no-print" animate={{ x: mousePos.x - 10, y: mousePos.y - 10 }} transition={{ type: 'spring', stiffness: 800, damping: 30, mass: 0.2 }} style={{ position: 'absolute', width: '20px', height: '20px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 25px 15px rgba(239, 68, 68, 0.5)', mixBlendMode: 'screen' }} />
      )}
      {mode === 'spotlight' && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.95) 100%)` }} />
      )}
      {mode === 'magnify' && (
        <div style={{ position: 'absolute', left: mousePos.x - 150, top: mousePos.y - 150, width: '300px', height: '300px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '50%', backdropFilter: 'saturate(2) contrast(1.5) brightness(1.2)', boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.4)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: -20, backdropFilter: 'blur(1px)' }} />
        </div>
      )}
      <canvas className="no-print" ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} style={{ display: mode === 'draw' ? 'block' : 'none', cursor: 'crosshair', width: '100%', height: '100%' }} />
    </div>
  );
}

// --- 2. SLIDE CONTENT COMPONENT ---
function SlideContent({ slide, isGaming }: { slide: Slide, isGaming: boolean }) {
  const textColor = isGaming ? '#fff' : '#111';
  const descColor = isGaming ? '#a1a1aa' : '#52525b';
  
  let timeline = null;
  if (slide.timelineData) { try { timeline = JSON.parse(slide.timelineData); } catch(e) {} }
  let chart = null;
  if (slide.chartData) { try { chart = JSON.parse(slide.chartData); } catch(e) {} }

  return (
    <div style={{ display: 'flex', gap: '4rem', flex: 1, alignItems: 'center', width: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.03em', lineHeight: 1.1, color: textColor }}>{slide.title}</motion.h1>
          <div style={{ fontSize: '1.25rem', lineHeight: 1.8, color: descColor, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {slide.content.split('\n').map((p, j) => (
              <motion.p key={j} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (j * 0.1) }} style={{ margin: 0 }}>{p}</motion.p>
            ))}
          </div>
        </div>
        {timeline && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '1rem 0', width: '100%' }} className="hide-scrollbar">
            {timeline.map((item: any, i: number) => (
              <div key={i} style={{ minWidth: '200px', background: isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: '1.5rem', borderRadius: '16px', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.5rem' }}>{item.year}</div>
                <div style={{ color: textColor, fontWeight: 500, fontSize: '1rem' }}>{item.event}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        {chart ? (
          <div style={{ width: '100%', height: '450px', background: isGaming ? 'rgba(0,0,0,0.6)' : '#fff', padding: '2rem', borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="name" stroke={descColor} />
                <Tooltip contentStyle={{ background: isGaming ? '#111' : '#fff', border: 'none', borderRadius: '12px', color: textColor, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : slide.model3DUrl ? (
          <div style={{ width: '100%', height: '550px', cursor: 'grab', background: isGaming ? 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)', borderRadius: '32px' }}>
            <Suspense fallback={<div style={{color: textColor, display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center'}}>Loading 3D...</div>}>
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 10]} intensity={1.5} />
                <PresentationControls speed={1.5} global zoom={0.8} polar={[-Math.PI / 4, Math.PI / 4]}>
                  <Stage environment="city" intensity={0.8}>
                    <Model3D url={slide.model3DUrl} />
                  </Stage>
                </PresentationControls>
              </Canvas>
            </Suspense>
          </div>
        ) : slide.image ? (
          <motion.img initial={{ opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: 'spring' }} src={slide.image} alt={slide.title} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
        ) : slide.embedUrl ? (
          <div style={{ width: '100%', maxWidth: '600px', background: isGaming ? 'rgba(255,255,255,0.05)' : '#fff', padding: '3rem', borderRadius: '24px', backdropFilter: 'blur(10px)', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: textColor, fontWeight: 700, fontSize: '1.5rem' }}>
              <ExternalLink size={48} color="#3b82f6" />
              {slide.embedTitle || 'Buka Konten Tambahan'}
            </div>
            <button onClick={() => document.dispatchEvent(new CustomEvent('openEmbed', { detail: slide.embedUrl }))} style={{ display: 'inline-flex', marginTop: '2rem', padding: '1rem 2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' }}>Lihat 3D / Buka Frame</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// --- 2. EDITOR TOOLBAR ---
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

// --- 3. MINIMAP COMPONENT ---
function Minimap({ data, isGaming, activeChapterIndex, onJump, onClose }: any) {
  return (
    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '300px', height: '100vh', background: isGaming ? 'rgba(9, 9, 11, 0.95)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRight: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : '#e5e5e5'}`, zIndex: 9999, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, color: isGaming ? '#fff' : '#111', fontSize: '1.2rem' }}>Navigasi Cepat</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: isGaming ? '#a1a1aa' : '#555', cursor: 'pointer' }}><X size={20} /></button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
        {data.chapters.map((chap: any, cIdx: number) => (
          <div key={chap.id} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: isGaming ? '#3b82f6' : '#111', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{chap.title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chap.slides.map((slide: any, sIdx: number) => (
                <button key={slide.id} onClick={() => { onJump(cIdx, sIdx); onClose(); }} style={{ textAlign: 'left', background: 'transparent', border: 'none', color: isGaming ? '#a1a1aa' : '#555', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.05)':'#f4f4f5'; e.currentTarget.style.color=isGaming?'#fff':'#000'}} onMouseOut={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color=isGaming?'#a1a1aa':'#555'}}>
                  {sIdx + 1}. {slide.title || 'Untitled Slide'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- 4. GAMING VIEWER ---
function GamingViewer({ data, onToggleTheme, interactionMode, setInteractionMode }: any) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [direction, setDirection] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [slideNotes, setSlideNotes] = useState<Record<string, string>>({});
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('presentation_notes');
    if (saved) setSlideNotes(JSON.parse(saved));
    
    // Cross-tab Sync Listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sync_state' && e.newValue) {
        const state = JSON.parse(e.newValue);
        if (state.cIdx !== activeChapterIndex || state.sIdx !== activeSlideIndex) {
          setActiveChapterIndex(state.cIdx);
          setActiveSlideIndex(state.sIdx);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeChapterIndex, activeSlideIndex]);

  const syncState = (cIdx: number | null, sIdx: number) => {
    localStorage.setItem('sync_state', JSON.stringify({ cIdx, sIdx, ts: Date.now() }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    setBgOffset({ x, y });
  };

  const saveNote = (slideId: string, html: string) => {
    const newNotes = { ...slideNotes, [slideId]: html };
    setSlideNotes(newNotes);
    localStorage.setItem('presentation_notes', JSON.stringify(newNotes));
  };

  const activeChapter = activeChapterIndex !== null ? data.chapters[activeChapterIndex] : null;
  const isLastSlide = activeChapter && activeSlideIndex === activeChapter.slides.length - 1;
  const activeSlide = activeChapter ? activeChapter.slides[activeSlideIndex] : null;
  const progressPercent = activeChapter && activeChapter.slides.length > 0 ? ((activeSlideIndex + 1) / activeChapter.slides.length) * 100 : 0;

  useEffect(() => { setShowNotes(false); }, [activeSlideIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNotes || showMinimap) {
        if (e.key === 'Escape') { setShowNotes(false); setShowMinimap(false); }
        return;
      }
      if (activeChapterIndex !== null) {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') { setActiveChapterIndex(null); syncState(null, 0); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapterIndex, activeSlideIndex, data, showNotes, showMinimap]);

  const handleEnterChapter = (index: number) => { setActiveChapterIndex(index); setActiveSlideIndex(0); setDirection(1); syncState(index, 0); };
  
  const nextSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex < activeChapter.slides.length - 1) {
      setDirection(1); setActiveSlideIndex(prev => prev + 1); syncState(activeChapterIndex, activeSlideIndex + 1);
    }
  };
  
  const prevSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex > 0) {
      setDirection(-1); setActiveSlideIndex(prev => prev - 1); syncState(activeChapterIndex, activeSlideIndex - 1);
    }
  };

  const gamingSlideVariants: any = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5, type: 'spring', bounce: 0, staggerChildren: 0.1 } },
    exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0, transition: { duration: 0.3 } })
  };

  const itemVariants: any = { enter: { y: 20, opacity: 0 }, center: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } } };

  return (
    <div onMouseMove={handleMouseMove} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#09090b', color: '#fff', fontFamily: 'var(--font-sans)' }}>
      {/* Floating Global Controls */}
      <div className="no-print" style={{ position: 'absolute', top: '2.5rem', right: '3rem', zIndex: 10000, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={() => setInteractionMode((m: string) => m === 'laser' ? 'none' : 'laser')} title="Laser" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'laser' ? '#ef4444' : '#555', cursor: 'pointer' }}><Pointer size={16} /></button>
        <button onClick={() => setInteractionMode((m: string) => m === 'draw' ? 'none' : 'draw')} title="Draw" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'draw' ? '#3b82f6' : '#555', cursor: 'pointer' }}><Edit3 size={16} /></button>
        <button onClick={() => setInteractionMode((m: string) => m === 'spotlight' ? 'none' : 'spotlight')} title="Spotlight" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'spotlight' ? '#f59e0b' : '#555', cursor: 'pointer' }}><Lightbulb size={16} /></button>
        <button onClick={() => setInteractionMode((m: string) => m === 'magnify' ? 'none' : 'magnify')} title="Magnify" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'magnify' ? '#10b981' : '#555', cursor: 'pointer' }}><Search size={16} /></button>
        <button onClick={onToggleTheme} title="Ganti Tema" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: '#555', cursor: 'pointer' }}><Moon size={16} /></button>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', textDecoration: 'none', fontWeight: 500, fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '100px', border: '1px solid #e5e5e5' }}>
          <Settings size={16} /> Settings
        </Link>
      </div>

      <AnimatePresence>{showMinimap && <Minimap data={data} isGaming={true} activeChapterIndex={activeChapterIndex} onJump={(cIdx: number, sIdx: number) => { setActiveChapterIndex(cIdx); setActiveSlideIndex(sIdx); setDirection(1); syncState(cIdx, sIdx); }} onClose={() => setShowMinimap(false)} />}</AnimatePresence>



      <AnimatePresence>
        {showNotes && activeSlide && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80vw', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>Live Papan Catatan: {activeSlide.title}</h2>
              <button onClick={() => setShowNotes(false)} style={{ background: '#fff', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> Tutup Catatan
              </button>
            </div>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} style={{ width: '80vw', maxWidth: '1000px', background: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <EditorToolbar />
              <div contentEditable suppressContentEditableWarning onBlur={(e) => saveNote(activeSlide.id, e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: slideNotes[activeSlide.id] || '<p>Mulai mengetik catatan interaktif Anda di sini...</p>' }} style={{ flex: 1, minHeight: '50vh', padding: '2rem', color: '#111', fontSize: '1.25rem', lineHeight: 1.8, outline: 'none', overflowY: 'auto', fontFamily: 'var(--font-sans)' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeChapterIndex === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.8 }} style={{ width: '100%', height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }} className="hide-scrollbar">
            {data.chapters.map((chap: any, i: number) => {
              const bgImg = chap.image || GAMING_IMAGES[i % GAMING_IMAGES.length];
              return (
                <div key={chap.id} style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'start', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  <motion.div animate={{ x: bgOffset.x, y: bgOffset.y }} transition={{ type: 'spring', damping: 50 }} style={{ position: 'absolute', inset: -50, zIndex: 0 }}>
                    <div style={{ width: '100%', height: '100%', backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) contrast(1.1)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #09090b 0%, transparent 60%, #09090b 100%)' }} />
                  </motion.div>
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
          <motion.div key="slide-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <motion.div animate={{ x: bgOffset.x, y: bgOffset.y, scale: 1.05 }} transition={{ type: 'spring', damping: 50 }} style={{ position: 'absolute', inset: -50, zIndex: 0 }}>
              {activeSlide?.videoBackground ? (
                <video src={activeSlide.videoBackground} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundImage: `url(${activeSlide?.backgroundImage || activeChapter?.image || GAMING_IMAGES[activeChapterIndex! % GAMING_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px) brightness(0.25)' }} />
              )}
            </motion.div>
            
            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: 'rgba(255,255,255,0.05)', width: '100%', zIndex: 50 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: '100%', background: '#3b82f6' }} />
            </div>

            <div className="no-print" style={{ position: 'fixed', top: '2.5rem', left: '3rem', zIndex: 50, display: 'flex', gap: '1.5rem' }}>
              <button onClick={() => { setActiveChapterIndex(null); syncState(null, 0); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#a1a1aa', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Exit Module
              </button>
              <button onClick={() => setShowMinimap(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#a1a1aa', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Map size={16} /> Minimap
              </button>
            </div>

            <div style={{ width: '100%', height: '100%', overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8rem 6% 10rem 6%' }} className="hide-scrollbar">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div key={activeSlideIndex} custom={direction} variants={gamingSlideVariants} initial="enter" animate="center" exit="exit" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', background: 'rgba(9, 9, 11, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '4rem', borderRadius: '16px' }}>
                  <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '30px', height: '2px', background: '#3b82f6' }} />
                    <p style={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.8rem' }}>SEQ {String(activeSlideIndex + 1).padStart(2, '0')} / {String(activeChapter?.slides.length || 0).padStart(2, '0')}</p>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <SlideContent slide={activeSlide!} isGaming={true} />
                  </motion.div>

                  <motion.div variants={itemVariants} className="no-print" style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowNotes(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '100px' }}>
                      <PenTool size={18} /> Buka Papan Catatan
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    {!isLastSlide ? (
                      <button onClick={nextSlide} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Proceed to Next <ArrowRight size={18} /></button>
                    ) : (
                      <button onClick={() => { setActiveChapterIndex(null); syncState(null, 0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}><CheckCircle size={18} /> Complete Module</button>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="no-print" style={{ position: 'fixed', bottom: '3rem', right: '3rem', zIndex: 50, display: 'flex', gap: '1rem' }}>
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

// --- 5. ELEGANT FORMAL VIEWER ---
function FormalViewer({ data, onToggleTheme, interactionMode, setInteractionMode }: any) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [direction, setDirection] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [slideNotes, setSlideNotes] = useState<Record<string, string>>({});
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('presentation_notes');
    if (saved) setSlideNotes(JSON.parse(saved));
    
    // Cross-tab Sync Listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sync_state' && e.newValue) {
        const state = JSON.parse(e.newValue);
        if (state.cIdx !== activeChapterIndex || state.sIdx !== activeSlideIndex) {
          setActiveChapterIndex(state.cIdx);
          setActiveSlideIndex(state.sIdx);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeChapterIndex, activeSlideIndex]);

  const syncState = (cIdx: number | null, sIdx: number) => {
    localStorage.setItem('sync_state', JSON.stringify({ cIdx, sIdx, ts: Date.now() }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    setBgOffset({ x, y });
  };

  const saveNote = (slideId: string, html: string) => {
    const newNotes = { ...slideNotes, [slideId]: html };
    setSlideNotes(newNotes);
    localStorage.setItem('presentation_notes', JSON.stringify(newNotes));
  };

  const activeChapter = activeChapterIndex !== null ? data.chapters[activeChapterIndex] : null;
  const isLastSlide = activeChapter && activeSlideIndex === activeChapter.slides.length - 1;
  const activeSlide = activeChapter ? activeChapter.slides[activeSlideIndex] : null;
  const progressPercent = activeChapter && activeChapter.slides.length > 0 ? ((activeSlideIndex + 1) / activeChapter.slides.length) * 100 : 0;

  useEffect(() => { setShowNotes(false); }, [activeSlideIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNotes || showMinimap) {
        if (e.key === 'Escape') { setShowNotes(false); setShowMinimap(false); }
        return;
      }
      if (activeChapterIndex !== null) {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') { setActiveChapterIndex(null); syncState(null, 0); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapterIndex, activeSlideIndex, data, showNotes, showMinimap]);

  const handleEnterChapter = (index: number) => { setActiveChapterIndex(index); setActiveSlideIndex(0); setDirection(1); syncState(index, 0); };
  
  const nextSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex < activeChapter.slides.length - 1) {
      setDirection(1); setActiveSlideIndex(prev => prev + 1); syncState(activeChapterIndex, activeSlideIndex + 1);
    }
  };
  
  const prevSlide = () => {
    if (activeChapterIndex === null || !activeChapter) return;
    if (activeSlideIndex > 0) {
      setDirection(-1); setActiveSlideIndex(prev => prev - 1); syncState(activeChapterIndex, activeSlideIndex - 1);
    }
  };

  const formalVariants: any = {
    enter: (dir: number) => ({ y: dir > 0 ? 30 : -30, opacity: 0 }),
    center: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 } },
    exit: (dir: number) => ({ y: dir < 0 ? 30 : -30, opacity: 0, transition: { duration: 0.3 } })
  };

  const itemVariants: any = { enter: { y: 15, opacity: 0 }, center: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } } };

  return (
    <div onMouseMove={handleMouseMove} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff', color: '#111', fontFamily: 'var(--font-sans)' }}>
      {/* Floating Global Controls */}
      <div className="no-print" style={{ position: 'absolute', top: '2.5rem', right: '3rem', zIndex: 10000, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={() => setInteractionMode((m: string) => m === 'laser' ? 'none' : 'laser')} title="Laser" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'laser' ? '#ef4444' : '#555', cursor: 'pointer' }}><Pointer size={16} /></button>
        <button onClick={() => setInteractionMode((m: string) => m === 'draw' ? 'none' : 'draw')} title="Draw" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'draw' ? '#3b82f6' : '#555', cursor: 'pointer' }}><Edit3 size={16} /></button>
        <button onClick={() => setInteractionMode((m: string) => m === 'spotlight' ? 'none' : 'spotlight')} title="Spotlight" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'spotlight' ? '#f59e0b' : '#555', cursor: 'pointer' }}><Lightbulb size={16} /></button>
        <button onClick={() => setInteractionMode((m: string) => m === 'magnify' ? 'none' : 'magnify')} title="Magnify" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: interactionMode === 'magnify' ? '#10b981' : '#555', cursor: 'pointer' }}><Search size={16} /></button>
        <button onClick={onToggleTheme} title="Ganti Tema" style={{ background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%', border: '1px solid #e5e5e5', color: '#555', cursor: 'pointer' }}><Moon size={16} /></button>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', textDecoration: 'none', fontWeight: 500, fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '100px', border: '1px solid #e5e5e5' }}>
          <Settings size={16} /> Settings
        </Link>
      </div>

      <AnimatePresence>{showMinimap && <Minimap data={data} isGaming={false} activeChapterIndex={activeChapterIndex} onJump={(cIdx: number, sIdx: number) => { setActiveChapterIndex(cIdx); setActiveSlideIndex(sIdx); setDirection(1); syncState(cIdx, sIdx); }} onClose={() => setShowMinimap(false)} />}</AnimatePresence>



      <AnimatePresence>
        {showNotes && activeSlide && (
          <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80vw', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Catatan Interaktif: {activeSlide.title}</h2>
              <button onClick={() => setShowNotes(false)} style={{ background: '#111', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 500, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> Tutup Catatan
              </button>
            </div>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} style={{ width: '80vw', maxWidth: '1000px', background: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e5e5e5' }}>
              <EditorToolbar />
              <div contentEditable suppressContentEditableWarning onBlur={(e) => saveNote(activeSlide.id, e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: slideNotes[activeSlide.id] || '<p>Mulai mengetik catatan interaktif Anda di sini...</p>' }} style={{ flex: 1, minHeight: '50vh', padding: '2rem', color: '#111', fontSize: '1.25rem', lineHeight: 1.8, outline: 'none', overflowY: 'auto', fontFamily: 'var(--font-sans)' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeChapterIndex === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.8 }} style={{ width: '100%', height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }} className="hide-scrollbar">
            {data.chapters.map((chap: any, i: number) => {
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
                    <motion.div animate={{ x: bgOffset.x, y: bgOffset.y, scale: 1.05 }} transition={{ type: 'spring', damping: 50 }} style={{ position: 'absolute', inset: -50, width: 'calc(100% + 100px)', height: 'calc(100% + 100px)' }}>
                      <img src={bgImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="slide-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', height: '100%', position: 'relative', background: '#fafafa' }}>
            <motion.div animate={{ x: bgOffset.x, y: bgOffset.y, scale: 1.05 }} transition={{ type: 'spring', damping: 50 }} style={{ position: 'absolute', inset: -50, zIndex: 0 }}>
              {activeSlide?.videoBackground ? (
                <video src={activeSlide.videoBackground} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'opacity(0.3)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundImage: `url(${activeSlide?.backgroundImage || activeChapter?.image || FORMAL_IMAGES[activeChapterIndex! % FORMAL_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px)', opacity: 0.25 }} />
              )}
            </motion.div>
            
            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: '#e5e5e5', width: '100%', zIndex: 50 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: '100%', background: '#111' }} />
            </div>

            <div className="no-print" style={{ position: 'fixed', top: '2.5rem', left: '3rem', zIndex: 50, display: 'flex', gap: '1.5rem' }}>
              <button onClick={() => { setActiveChapterIndex(null); syncState(null, 0); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <LayoutGrid size={16} /> Back to Index
              </button>
              <button onClick={() => setShowMinimap(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Map size={16} /> Minimap
              </button>
            </div>

            <div style={{ width: '100%', height: '100%', overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8rem 6% 10rem 6%' }} className="hide-scrollbar">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div key={activeSlideIndex} custom={direction} variants={formalVariants} initial="enter" animate="center" exit="exit" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                  <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <p style={{ color: '#888', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                      Slide {String(activeSlideIndex + 1).padStart(2, '0')} of {String(activeChapter?.slides.length || 0).padStart(2, '0')}
                    </p>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <SlideContent slide={activeSlide!} isGaming={false} />
                  </motion.div>

                  <motion.div variants={itemVariants} className="no-print" style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowNotes(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#111', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '100px' }}>
                      <PenTool size={18} /> Buka Papan Catatan
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e5e5e5', paddingTop: '2rem' }}>
                    {!isLastSlide ? (
                      <button onClick={nextSlide} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#111', color: '#fff', border: 'none', borderRadius: '100px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' }}>Continue <ArrowRight size={16} /></button>
                    ) : (
                      <button onClick={() => { setActiveChapterIndex(null); syncState(null, 0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: '#fff', color: '#111', border: '1px solid #e5e5e5', borderRadius: '100px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' }}><CheckCircle size={16} /> Finish Section</button>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="no-print" style={{ position: 'fixed', bottom: '3rem', right: '3rem', zIndex: 50, display: 'flex', gap: '1rem' }}>
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

// --- 6. MAIN APP WRAPPER ---
export default function PresentationViewer() {
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideTheme, setOverrideTheme] = useState<'gaming' | 'formal' | null>(null);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'none' | 'laser' | 'draw' | 'spotlight' | 'magnify'>('none');
  const [embedOverlayUrl, setEmbedOverlayUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenEmbed = (e: any) => setEmbedOverlayUrl(e.detail);
    document.addEventListener('openEmbed', handleOpenEmbed);
    return () => document.removeEventListener('openEmbed', handleOpenEmbed);
  }, []);

  useEffect(() => {
    fetch('/api/presentation')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        setIsLaserActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        setInteractionMode(m => m === 'laser' ? 'none' : 'laser');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#09090b', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Experience...</div>;
  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>Error loading data.</div>;

  const currentTheme = overrideTheme || data.theme || 'gaming';
  
  const toggleTheme = async () => {
    const newTheme = currentTheme === 'gaming' ? 'formal' : 'gaming';
    setOverrideTheme(newTheme);
    try {
      const updatedData = { ...data, theme: newTheme };
      await fetch('/api/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      setData(updatedData as PresentationData);
    } catch (e) {
      console.error("Failed to save theme toggle to backend", e);
    }
  };

  return (
    <>
      <InteractionLayer mode={interactionMode} />
      {currentTheme === 'gaming' 
        ? <GamingViewer data={data} onToggleTheme={toggleTheme} interactionMode={interactionMode} setInteractionMode={setInteractionMode} /> 
        : <FormalViewer data={data} onToggleTheme={toggleTheme} interactionMode={interactionMode} setInteractionMode={setInteractionMode} />}
      
      <AnimatePresence>
        {embedOverlayUrl && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <button onClick={() => setEmbedOverlayUrl(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 100000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
              <X size={24} />
            </button>
            <div style={{ width: '100%', height: '100%', maxWidth: '1400px', background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe src={embedOverlayUrl} width="100%" height="100%" style={{ border: 'none' }} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
