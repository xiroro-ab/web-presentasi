"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Slide = { id: string; title: string; content: string; image?: string; backgroundImage?: string; videoBackground?: string; chartData?: string; model3DUrl?: string; timelineData?: string; embedUrl?: string; embedTitle?: string; };
type Chapter = { id: string; title: string; subtitle?: string; image?: string; slides: Slide[] };
type PresentationData = { title: string; theme?: 'gaming' | 'formal'; chapters: Chapter[] };

function ChartEditor({ slide, isGaming, onChange }: { slide: Slide, isGaming: boolean, onChange: (val: string) => void }) {
  let parsed = [];
  try { parsed = JSON.parse(slide.chartData || '[]'); } catch(e) {}
  if (!Array.isArray(parsed)) parsed = [];

  const update = (idx: number, key: string, val: any) => {
    const newArr = [...parsed];
    newArr[idx] = { ...newArr[idx], [key]: val };
    onChange(JSON.stringify(newArr));
  };
  const add = () => onChange(JSON.stringify([...parsed, { name: 'Item', value: 10 }]));
  const remove = (idx: number) => {
    const newArr = [...parsed];
    newArr.splice(idx, 1);
    onChange(JSON.stringify(newArr));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {parsed.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={item.name || ''} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Nama" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: 'none', outline: 'none', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontSize: '0.85rem' }} />
          <input type="number" value={item.value || 0} onChange={(e) => update(i, 'value', Number(e.target.value))} placeholder="Nilai" style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: 'none', outline: 'none', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontSize: '0.85rem' }} />
          <button onClick={() => remove(i)} style={{ padding: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
        </div>
      ))}
      <button onClick={add} style={{ padding: '0.5rem', background: isGaming ? '#3b82f6' : '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Tambah Data</button>
    </div>
  );
}

function TimelineEditor({ slide, isGaming, onChange }: { slide: Slide, isGaming: boolean, onChange: (val: string) => void }) {
  let parsed = [];
  try { parsed = JSON.parse(slide.timelineData || '[]'); } catch(e) {}
  if (!Array.isArray(parsed)) parsed = [];

  const update = (idx: number, key: string, val: string) => {
    const newArr = [...parsed];
    newArr[idx] = { ...newArr[idx], [key]: val };
    onChange(JSON.stringify(newArr));
  };
  const add = () => onChange(JSON.stringify([...parsed, { year: '2024', event: 'Acara' }]));
  const remove = (idx: number) => {
    const newArr = [...parsed];
    newArr.splice(idx, 1);
    onChange(JSON.stringify(newArr));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {parsed.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={item.year || ''} onChange={(e) => update(i, 'year', e.target.value)} placeholder="Tahun" style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: 'none', outline: 'none', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontSize: '0.85rem' }} />
          <input value={item.event || ''} onChange={(e) => update(i, 'event', e.target.value)} placeholder="Kejadian" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: 'none', outline: 'none', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontSize: '0.85rem' }} />
          <button onClick={() => remove(i)} style={{ padding: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
        </div>
      ))}
      <button onClick={add} style={{ padding: '0.5rem', background: isGaming ? '#3b82f6' : '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Tambah Timeline</button>
    </div>
  );
}

export default function AdminPanel() {
  const [data, setData] = useState<PresentationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/presentation')
      .then(res => res.json())
      .then(d => {
        if (!d.theme) d.theme = 'gaming';
        setData(d);
      })
      .catch(e => console.error(e));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch('/api/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMessage('Changes saved successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      setMessage('Failed to save.');
    }
    setSaving(false);
  };

  const addChapter = () => {
    if (!data) return;
    const newChapter: Chapter = {
      id: `chap-${Date.now()}`,
      title: 'New Chapter',
      subtitle: 'Subtitle',
      image: '',
      slides: []
    };
    setData({ ...data, chapters: [...data.chapters, newChapter] });
  };

  const addSlide = (chapterIndex: number) => {
    if (!data) return;
    const newData = { ...data };
    newData.chapters[chapterIndex].slides.push({
      id: `slide-${Date.now()}`,
      title: 'Slide Title',
      content: 'Enter your slide content here...'
    });
    setData(newData);
  };

  const removeChapter = (index: number) => {
    if (!data) return;
    const newData = { ...data };
    newData.chapters.splice(index, 1);
    setData(newData);
  };

  const removeSlide = (chapterIndex: number, slideIndex: number) => {
    if (!data) return;
    const newData = { ...data };
    newData.chapters[chapterIndex].slides.splice(slideIndex, 1);
    setData(newData);
  };

  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0c', color: '#fff' }}>Loading configuration...</div>;

  const isGaming = data.theme === 'gaming';

  return (
    <div style={{ position: 'relative', height: '100vh', overflowY: 'auto', background: isGaming ? '#0a0a0c' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontFamily: 'var(--font-sans)', scrollBehavior: 'smooth' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: isGaming ? '#a1a1aa' : '#52525b', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.2s' }}>
              <MonitorPlay size={16} /> Return to Presentation
            </Link>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Presentation Editor</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AnimatePresence>
              {message && (
                <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>
                  {message}
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isGaming ? '#3b82f6' : '#111', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Global Settings */}
        <div style={{ background: isGaming ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, padding: '2rem', borderRadius: '16px', marginBottom: '3rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.75rem' }}>Project Title</label>
            <input 
              type="text" 
              value={data.title} 
              onChange={(e) => setData({ ...data, title: e.target.value })} 
              style={{ width: '100%', fontSize: '1.25rem', fontWeight: 600, background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = isGaming ? '#3b82f6' : '#d4d4d8'}
              onBlur={e => e.currentTarget.style.borderColor = isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.75rem' }}>Visual Theme</label>
            <select 
              value={data.theme || 'gaming'} 
              onChange={(e) => setData({ ...data, theme: e.target.value as 'gaming' | 'formal' })}
              style={{ width: '100%', fontSize: '1rem', fontWeight: 500, background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="gaming" style={{ color: '#111' }}>Tema Gelap (Dark Mode)</option>
              <option value="formal" style={{ color: '#111' }}>Tema Terang (Light Mode)</option>
            </select>
          </div>
        </div>

        {/* Chapters Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Chapters & Slides</h2>
          
          <AnimatePresence>
            {data.chapters.map((chap, cIdx) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                key={chap.id} 
                style={{ background: isGaming ? 'rgba(255,255,255,0.02)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                {/* Chapter Header */}
                <div style={{ padding: '2rem', borderBottom: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: isGaming ? 'rgba(255,255,255,0.1)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
                    {cIdx + 1}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Chapter Title</label>
                        <input 
                          type="text" 
                          value={chap.title} 
                          onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].title = e.target.value; setData(newData); }}
                          style={{ width: '100%', fontSize: '1.5rem', fontWeight: 700, background: 'transparent', border: 'none', color: isGaming ? '#fff' : '#111', padding: 0, outline: 'none' }}
                          placeholder="Chapter Title"
                        />
                      </div>
                      <button onClick={() => removeChapter(cIdx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s', alignSelf: 'flex-start' }} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0.7'} title="Delete Chapter">
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Subtitle</label>
                        <input 
                          type="text" 
                          value={chap.subtitle || ''} 
                          onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].subtitle = e.target.value; setData(newData); }}
                          style={{ width: '100%', fontSize: '0.95rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' }}
                          placeholder="Subtitle (e.g. Overview)"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Cover Image</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            value={chap.image || ''} 
                            onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].image = e.target.value; setData(newData); }}
                            style={{ flex: 1, fontSize: '0.95rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' }}
                            placeholder="Image URL or upload..."
                          />
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: isGaming ? '#3b82f6' : '#111', color: '#fff', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                            Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('key', '79b9816e71b8ecce3de146d30dc66d4f');
                                try {
                                  setMessage('Uploading...');
                                  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
                                  const result = await res.json();
                                  if (result.data && result.data.url) {
                                    const newData = { ...data };
                                    newData.chapters[cIdx].image = result.data.url;
                                    setData(newData);
                                    setMessage('Upload successful!');
                                    setTimeout(() => setMessage(''), 2000);
                                  } else {
                                    throw new Error(result.error?.message || 'Failed');
                                  }
                                } catch (err) {
                                  setMessage('Upload failed');
                                }
                              }} 
                            />
                          </label>
                        </div>
                        {chap.image && (
                          <div style={{ marginTop: '0.5rem', height: '100px', width: '100%', borderRadius: '6px', backgroundImage: `url(${chap.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slides List */}
                <div style={{ padding: '2rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fafafa' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: isGaming ? '#d4d4d8' : '#52525b' }}>Slides</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence>
                      {chap.slides.map((slide, sIdx) => (
                        <motion.div key={slide.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ background: isGaming ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`, borderRadius: '12px', padding: '1.5rem', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isGaming ? '#3b82f6' : '#111', textTransform: 'uppercase', letterSpacing: '0.05em', background: isGaming ? 'rgba(59,130,246,0.1)' : '#f4f4f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                              Slide {sIdx + 1}
                            </span>
                            <button onClick={() => removeSlide(cIdx, sIdx)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0.6'}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <input 
                            type="text" 
                            value={slide.title} 
                            onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].title = e.target.value; setData(newData); }}
                            style={{ width: '100%', fontSize: '1.2rem', fontWeight: 600, background: 'transparent', border: 'none', color: isGaming ? '#fff' : '#111', padding: '0 0 1rem 0', outline: 'none' }}
                            placeholder="Slide Title"
                          />
                          <textarea 
                            value={slide.content} 
                            onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].content = e.target.value; setData(newData); }}
                            style={{ width: '100%', minHeight: '80px', fontSize: '0.95rem', lineHeight: 1.6, background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: 'none', color: isGaming ? '#d4d4d8' : '#3f3f46', padding: '1rem', borderRadius: '8px', resize: 'vertical', outline: 'none', marginBottom: '1rem' }}
                            placeholder="Slide content goes here..."
                          />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Inline Slide Image</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input 
                                    type="text" 
                                    value={slide.image || ''} 
                                    onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].image = e.target.value; setData(newData); }}
                                    style={{ flex: 1, fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }}
                                    placeholder="Image URL or upload..."
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: isGaming ? '#3b82f6' : '#111', color: '#fff', padding: '0 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                    Upload
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      style={{ display: 'none' }} 
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        formData.append('key', '79b9816e71b8ecce3de146d30dc66d4f');
                                        try {
                                          setMessage('Uploading...');
                                          const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
                                          const result = await res.json();
                                          if (result.data && result.data.url) {
                                            const newData = { ...data };
                                            newData.chapters[cIdx].slides[sIdx].image = result.data.url;
                                            setData(newData);
                                            setMessage('Upload successful!');
                                            setTimeout(() => setMessage(''), 2000);
                                          } else {
                                            throw new Error('Failed');
                                          }
                                        } catch (err) {
                                          setMessage('Upload failed');
                                        }
                                      }} 
                                    />
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Background Image</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input 
                                    type="text" 
                                    value={slide.backgroundImage || ''} 
                                    onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].backgroundImage = e.target.value; setData(newData); }}
                                    style={{ flex: 1, fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }}
                                    placeholder="Image URL or upload..."
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: isGaming ? '#3b82f6' : '#111', color: '#fff', padding: '0 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                    Upload
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      style={{ display: 'none' }} 
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        formData.append('key', '79b9816e71b8ecce3de146d30dc66d4f');
                                        try {
                                          setMessage('Uploading...');
                                          const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
                                          const result = await res.json();
                                          if (result.data && result.data.url) {
                                            const newData = { ...data };
                                            newData.chapters[cIdx].slides[sIdx].backgroundImage = result.data.url;
                                            setData(newData);
                                            setMessage('Upload successful!');
                                            setTimeout(() => setMessage(''), 2000);
                                          } else {
                                            throw new Error('Failed');
                                          }
                                        } catch (err) {
                                          setMessage('Upload failed');
                                        }
                                      }} 
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                            
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Video Background URL (Feature 5)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <input 
                                    type="text" 
                                    value={slide.videoBackground || ''} 
                                    onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].videoBackground = e.target.value; setData(newData); }}
                                    style={{ flex: 1, fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }}
                                    placeholder="https://...mp4"
                                  />
                                </div>

                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>3D Model URL (Feature 4)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <input 
                                    type="text" 
                                    value={slide.model3DUrl || ''} 
                                    onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].model3DUrl = e.target.value; setData(newData); }}
                                    style={{ flex: 1, fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }}
                                    placeholder="https://...glb"
                                  />
                                </div>

                              </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Data Grafik Batang (Otomatis Animasi)</label>
                                <ChartEditor slide={slide} isGaming={isGaming} onChange={(val: string) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].chartData = val; setData(newData); }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Data Timeline (Garis Waktu)</label>
                                <TimelineEditor slide={slide} isGaming={isGaming} onChange={(val: string) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].timelineData = val; setData(newData); }} />
                              </div>
                            </div>
                            
                            <div style={{ marginTop: '1rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', textTransform: 'uppercase' }}>Embed Title</label>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', textTransform: 'uppercase' }}>Embed URL</label>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                  type="text" 
                                  value={slide.embedTitle || ''} 
                                  onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embedTitle = e.target.value; setData(newData); }}
                                  style={{ flex: 1, fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }}
                                  placeholder="e.g. Watch Video"
                                />
                                <input 
                                  type="text" 
                                  value={slide.embedUrl || ''} 
                                  onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embedUrl = e.target.value; setData(newData); }}
                                  style={{ flex: 2, fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }}
                                  placeholder="https://www.youtube.com/embed/..."
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <button onClick={() => addSlide(cIdx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', background: 'transparent', border: `1px dashed ${isGaming ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, color: isGaming ? '#a1a1aa' : '#52525b', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.02)':'#f4f4f5'; e.currentTarget.style.color=isGaming?'#fff':'#111'}} onMouseOut={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color=isGaming?'#a1a1aa':'#52525b'}}>
                      <Plus size={16} /> Add New Slide
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={addChapter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '1.5rem', background: isGaming ? 'rgba(59,130,246,0.1)' : '#111', border: `1px solid ${isGaming ? 'rgba(59,130,246,0.3)' : '#111'}`, color: isGaming ? '#60a5fa' : '#fff', borderRadius: '16px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)'}} onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)'}}>
            <Plus size={20} /> Create New Chapter
          </button>

        </div>
      </div>
    </div>
  );
}
