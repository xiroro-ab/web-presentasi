"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Layout, Code, Monitor, ExternalLink, Smartphone, ArrowDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GRAVITY = 0.9;
const DAMPING = 0.985;
const CONSTRAINT_ITERATIONS = 40;
const ROPE_SEGMENTS = 6;
const SEG_LEN = 14;
const CARD_H = 380;

export function AboutMeModal({ isOpen, onClose }: Props) {
  const [activeSection, setActiveSection] = useState('home');
  const lastScrollY = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pointsRef = useRef<any[]>([]);
  const segLensRef = useRef<number[]>([]);
  const draggedPointRef = useRef<any>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: 0, y: 0 });
  const anchorPosRef = useRef({ x: 0, y: -20 });

  useEffect(() => {
    if (!isOpen) return;

    const sections = ['home', 'tentang', 'skill', 'kontak'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      root: containerRef.current,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    });

    sections.forEach(section => {
      const el = document.getElementById(section);
      if (el) observer.observe(el);
    });

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', () => {}, true);
    }

    return () => {
      sections.forEach(section => {
        const el = document.getElementById(section);
        if (el) observer.unobserve(el);
      });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const points: any[] = [];
    const segLens: number[] = [];

    for (let i = 0; i < ROPE_SEGMENTS; i++) {
      points.push({ x: 0, y: i * SEG_LEN, oldx: 0, oldy: i * SEG_LEN, pinned: i === 0 });
      if (i > 0) segLens.push(SEG_LEN);
    }

    points.push({ x: 0, y: ROPE_SEGMENTS * SEG_LEN + CARD_H * 0.45, oldx: 0, oldy: ROPE_SEGMENTS * SEG_LEN + CARD_H * 0.45, pinned: false });
    segLens.push(CARD_H * 0.45);

    pointsRef.current = points;
    segLensRef.current = segLens;

    let animationFrameId: number;

    const integrate = () => {
      const pts = pointsRef.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.pinned || p === draggedPointRef.current) continue;
        const localDamping = DAMPING - i * 0.001;
        const vx = (p.x - p.oldx) * localDamping;
        const vy = (p.y - p.oldy) * localDamping;
        p.oldx = p.x;
        p.oldy = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }
    };

    const satisfyConstraints = () => {
      const pts = pointsRef.current;
      const slens = segLensRef.current;

      for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const restLen = slens[i];
          const stiffness = 0.98;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          const diff = (dist - restLen) / dist;

          const p1Locked = p1.pinned || p1 === draggedPointRef.current;
          const p2Locked = p2.pinned || p2 === draggedPointRef.current;
          if (p1Locked && p2Locked) continue;

          const offX = dx * 0.5 * diff * stiffness;
          const offY = dy * 0.5 * diff * stiffness;

          if (!p1Locked) { p1.x += offX; p1.y += offY; }
          if (!p2Locked) { p2.x -= offX; p2.y -= offY; }
        }

        pts[0].x = anchorPosRef.current.x;
        pts[0].y = anchorPosRef.current.y;
      }
    };

    const applyDrag = () => {
      if (!draggedPointRef.current) return;
      draggedPointRef.current.x += (pointerRef.current.x - dragOffsetRef.current.x - draggedPointRef.current.x) * 0.6;
      draggedPointRef.current.y += (pointerRef.current.y - dragOffsetRef.current.y - draggedPointRef.current.y) * 0.6;
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const pts = pointsRef.current;

      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 36;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'bevel';

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < ROPE_SEGMENTS; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < ROPE_SEGMENTS; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textIdx = ROPE_SEGMENTS - 3;
      if (pts[textIdx] && pts[textIdx + 1]) {
        const p1 = pts[textIdx];
        const p2 = pts[textIdx + 1];
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillText('A.B', 0, 0);
        ctx.restore();
      }

      if (cardRef.current) {
        const hook = pts[ROPE_SEGMENTS - 1];
        const bob = pts[pts.length - 1];
        let angle = Math.atan2(bob.y - hook.y, bob.x - hook.x) - Math.PI / 2;

        const cardX = hook.x - 130;
        const cardY = hook.y + 25;

        const scale = window.innerWidth < 640 ? 0.75 : window.innerWidth < 768 ? 0.85 : window.innerWidth < 1024 ? 0.75 : 1;

        cardRef.current.style.transform = `translate3d(${cardX}px, ${cardY}px, 0) rotate(${angle}rad) scale(${scale})`;
      }
    };

    const loop = () => {
      applyDrag();
      integrate();
      satisfyConstraints();
      render();
      animationFrameId = requestAnimationFrame(loop);
    };

    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement!.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        anchorPosRef.current = {
          x: rect.width / 2,
          y: -20
        };
        if (pointsRef.current[0].x === 0) {
          for (let i = 0; i < pointsRef.current.length; i++) {
            pointsRef.current[i].x = anchorPosRef.current.x;
            pointsRef.current[i].oldx = anchorPosRef.current.x;
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMoveWindow = (e: PointerEvent) => {
      if (!draggedPointRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handlePointerUpWindow = () => {
      if (draggedPointRef.current) {
        draggedPointRef.current = null;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('pointermove', handlePointerMoveWindow);
    window.addEventListener('pointerup', handlePointerUpWindow);

    return () => {
      window.removeEventListener('pointermove', handlePointerMoveWindow);
      window.removeEventListener('pointerup', handlePointerUpWindow);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const startCardDrag = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointerRef.current = { x: px, y: py };

    const pts = pointsRef.current;
    if (pts.length > 0) {
      draggedPointRef.current = pts[pts.length - 1];
      dragOffsetRef.current = {
        x: px - draggedPointRef.current.x,
        y: py - draggedPointRef.current.y
      };
      document.body.style.cursor = 'grabbing';
    }
  };

  const smoothScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el && containerRef.current) {
      containerRef.current.scrollTo({
        top: el.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const navBtnStyle = (section: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    color: activeSection === section ? '#fff' : 'rgba(255,255,255,0.5)',
    fontWeight: activeSection === section ? 700 : 500,
    fontSize: '0.95rem',
    cursor: 'pointer',
    padding: '0.5rem 0',
    transition: 'color 0.2s',
  });

  const projects = [
    { icon: Code, title: "Sistem Management Guru", desc: "Aplikasi manajemen data guru berbasis web yang fungsional. Dibangun murni dengan vibe coding.", href: "https://smpn58.vercel.app/" },
    { icon: Layout, title: "Aplikasi Ujian CBT Online", desc: "Platform Computer Based Test online untuk pelaksanaan ujian yang stabil. Dibuat dengan vibe coding.", href: "https://xiroro-ab.github.io/ujian-online/" },
    { icon: Smartphone, title: "Asset Bundle Porter MLBB", desc: "Tools porting asset bundle Unity untuk script MLBB. Berjalan responsif, dibuat dengan vibe coding.", href: "https://huggingface.co/spaces/xiroro/PortingApp/" },
    { icon: ExternalLink, title: "Toko Script MLBB", desc: "Toko penjualan online khusus script MLBB. Interface sederhana, dibuat dengan vibe coding.", href: "https://xiroro-ab.github.io/Toko-Online-Script-Mlbb/" },
    { icon: Monitor, title: "Website MPI Informatika", desc: "Website Media Pembelajaran Interaktif untuk mata pelajaran INFORMATIKA. Dibuat dengan vibe coding.", href: "https://mpi-informatika.vercel.app/" },
    { icon: Smartphone, title: "Aplikasi Ujian CBT Android", desc: "Aplikasi ujian berbasis Android untuk memudahkan siswa ujian dari HP. Dibuat dengan vibe coding.", href: "https://drive.google.com/file/d/1wxOVvhZ8TjchsB59UPlpBzE8GDBqdNwb/view?usp=sharing" }
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* Desktop Navbar */}
      <nav style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1100px',
        zIndex: 100,
        background: 'rgba(20, 20, 22, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '100px',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.02em' }}>
          A.B
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <button onClick={() => smoothScrollTo('home')} style={navBtnStyle('home')}>Home</button>
          <button onClick={() => smoothScrollTo('tentang')} style={navBtnStyle('tentang')}>Tentang</button>
          <button onClick={() => smoothScrollTo('skill')} style={navBtnStyle('skill')}>Skill</button>
          <button onClick={() => smoothScrollTo('kontak')} style={navBtnStyle('kontak')}>Kontak</button>
        </div>
        <button onClick={onClose} style={{
          background: '#fff',
          color: '#000',
          padding: '0.6rem 1.2rem',
          borderRadius: '100px',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <X size={16} /> Tutup
        </button>
      </nav>

      {/* Main Content */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        paddingTop: '6rem',
        paddingBottom: '2rem',
        padding: '6rem 1rem 2rem',
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        fontFamily: "'Poppins', sans-serif",
      }}>
        {/* HERO SECTION */}
        <section id="home" style={{
          background: '#141416',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          overflow: 'hidden',
          minHeight: window.innerWidth < 768 ? 'auto' : '500px',
        }}>
          {/* Left: Card & Canvas */}
          <div style={{
            position: 'relative',
            width: window.innerWidth < 768 ? '100%' : '50%',
            height: window.innerWidth < 768 ? '400px' : '500px',
            flexShrink: 0,
          }}>
            <canvas ref={canvasRef} style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }} />

            <div
              ref={cardRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '260px',
                pointerEvents: 'auto',
                cursor: 'grab',
                userSelect: 'none',
                transformOrigin: '50% -25px',
                willChange: 'transform',
              }}
              onPointerDown={startCardDrag}
            >
              {/* Metal Clip & Ring */}
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: '48px',
                  height: '20px',
                  background: 'linear-gradient(to bottom, #9ca3af, #4b5563)',
                  borderRadius: '2px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  borderBottom: '1px solid #374151',
                }} />
                <div style={{
                  width: '24px',
                  height: '32px',
                  border: '4px solid #d1d5db',
                  borderRadius: '50%',
                  marginTop: '-8px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                }} />
              </div>

              {/* ID Card */}
              <div style={{
                width: '100%',
                aspectRatio: '2/3',
                borderRadius: '16px',
                background: 'linear-gradient(to bottom, #f0f0f0, #d4d4d4)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                padding: '12px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.5)',
              }}>
                {/* Hole */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '48px',
                  height: '10px',
                  background: '#111',
                  borderRadius: '50%',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
                  zIndex: 10,
                }} />

                {/* Photo Area */}
                <div style={{
                  width: '100%',
                  flex: 1,
                  background: '#1a1a1a',
                  borderRadius: '12px',
                  marginTop: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '3px solid rgba(0,0,0,0.1)',
                }}>
                  <img
                    src="https://raw.githubusercontent.com/xiroro-ab/bab3-sk-kelas8v2-aris/main/1752495560972.jpg"
                    crossOrigin="anonymous"
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }} />
                </div>

                {/* Bottom Area */}
                <div style={{
                  height: '90px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: 'rgba(0,0,0,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.04em',
                    textAlign: 'center',
                    lineHeight: 1,
                    display: 'block',
                  }}>
                    Aris<br />Bermansyah
                  </span>
                </div>

                {/* Glossy Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top right, transparent, rgba(255,255,255,0.3), transparent)',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }} />
              </div>
            </div>
          </div>

          {/* Right: Text Content */}
          <div style={{
            width: window.innerWidth < 768 ? '100%' : '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: window.innerWidth < 1024 ? 'center' : 'left',
          }}>
            <h2 style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Halo! Saya <span style={{ fontWeight: 700, color: '#fff' }}>Aris</span>
            </h2>
            <h1 style={{
              fontSize: window.innerWidth < 640 ? '2rem' : '3.5rem',
              fontWeight: 900,
              color: '#fff',
              marginBottom: '1.5rem',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              wordBreak: 'break-word',
            }}>
              GURU INFORMATIKA.
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
              maxWidth: '400px',
              margin: window.innerWidth < 1024 ? '0 auto 2.5rem' : '0 0 2.5rem',
            }}>
              Menyukai design, walau tidak paham design. Berbekal antusiasme tinggi untuk terus belajar, mencoba, dan menciptakan karya. Menyelesaikan setiap baris kode dengan insting dan imajinasi. Hanya VIBE CODING.
            </p>
            <div style={{ display: 'flex', justifyContent: window.innerWidth < 1024 ? 'center' : 'flex-start' }}>
              <button
                onClick={() => smoothScrollTo('tentang')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.9rem 1.5rem',
                  background: '#fff',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: '100px',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(255,255,255,0.1)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Tentang Saya
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ArrowDown size={16} />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* TENTANG SECTION */}
        <section id="tentang" style={{
          background: '#141416',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          padding: '2rem',
          textAlign: window.innerWidth < 1024 ? 'center' : 'left',
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            Tentang Saya
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '600px', marginBottom: '1rem', margin: window.innerWidth < 1024 ? '0 auto 1rem' : '0 0 1rem' }}>
            Saya adalah guru Informatika yang memiliki passion di bidang teknologi dan coding. Sehari-hari mengajar di SMPN 58 dan terus belajar untuk mengembangkan karya-karya digital yang bermanfaat.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '600px', margin: window.innerWidth < 1024 ? '0 auto' : '0' }}>
            Saya percaya bahwa coding bukan hanya tentang menulis baris kode, tapi tentang imajinasi, insting, dan antusiasme untuk menciptakan sesuatu yang baru. Itulah yang saya sebut VIBE CODING.
          </p>
        </section>

        {/* SKILL / PORTOFOLIO SECTION */}
        <section id="skill" style={{
          background: '#141416',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          padding: '2rem',
          textAlign: window.innerWidth < 1024 ? 'center' : 'left',
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>
            Portofolio & Project
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '600px', margin: window.innerWidth < 1024 ? '0 auto 2rem' : '0 0 2rem' }}>
            Beberapa project dan karya unggulan yang telah diselesaikan.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.5rem',
          }}>
            {projects.map((item, i) => (
              <a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: '#1c1c1c',
                  padding: '2rem',
                  borderRadius: '24px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-8px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: '#fff',
                  margin: window.innerWidth < 1024 ? '0 auto 1.5rem' : '0 0 1.5rem',
                }}>
                  <item.icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* KONTAK SECTION */}
        <section id="kontak" style={{
          background: '#141416',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>
            Mari Terhubung
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Punya ide project seru, butuh script MLBB, atau hanya sekedar ingin berdiskusi? Jangan ragu untuk menghubungi saya melalui kontak di bawah.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
          }}>
            {[
              { icon: ExternalLink, label: "Instagram", href: "https://www.instagram.com/aris.bermansyah/" },
              { icon: ExternalLink, label: "GitHub", href: "https://github.com/xiroro-ab/" },
              { icon: Mail, label: "Email", href: "mailto:aris.bermansyah14@gmail.com" },
              { icon: ExternalLink, label: "Website", href: "https://xiroro-ab.github.io/Toko-Online-Script-Mlbb/" }
            ].map((soc, i) => (
              <a
                key={i}
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  background: '#1c1c1c',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '100px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <soc.icon size={20} />
                {soc.label}
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
