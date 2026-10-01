"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, MonitorPlay, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

type EmbedLink = { title: string; url: string; };
type Slide = { id: string; title: string; content: string; image?: string; embedUrl?: string; embedTitle?: string; embeds?: EmbedLink[]; };
type Chapter = { id: string; title: string; subtitle?: string; image?: string; slides: Slide[] };
type PresentationData = { title: string; theme?: 'gaming' | 'formal'; chapters: Chapter[] };

const AdminEditorToolbar = ({ onUploadStart, onUploadSuccess, isGaming }: any) => {
  return (
    <div style={{ padding: '0.5rem', background: isGaming ? 'rgba(0,0,0,0.3)' : '#f4f4f5', display: 'flex', gap: '0.5rem', borderBottom: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : '#e5e5e5'}`, alignItems: 'center', flexWrap: 'wrap', borderRadius: '8px 8px 0 0' }}>
      <button onClick={() => document.execCommand('bold')} style={{ fontWeight: 'bold', padding: '0.4rem 0.8rem', cursor: 'pointer', border: 'none', borderRadius: '4px', background: isGaming ? 'rgba(255,255,255,0.05)' : '#fff', color: isGaming ? '#fff' : '#111' }}>B</button>
      <button onClick={() => document.execCommand('italic')} style={{ fontStyle: 'italic', padding: '0.4rem 0.8rem', cursor: 'pointer', border: 'none', borderRadius: '4px', background: isGaming ? 'rgba(255,255,255,0.05)' : '#fff', color: isGaming ? '#fff' : '#111' }}>I</button>
      <button onClick={() => document.execCommand('underline')} style={{ textDecoration: 'underline', padding: '0.4rem 0.8rem', cursor: 'pointer', border: 'none', borderRadius: '4px', background: isGaming ? 'rgba(255,255,255,0.05)' : '#fff', color: isGaming ? '#fff' : '#111' }}>U</button>
      <button onClick={() => document.execCommand('insertUnorderedList')} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', border: 'none', borderRadius: '4px', background: isGaming ? 'rgba(255,255,255,0.05)' : '#fff', color: isGaming ? '#fff' : '#111' }}>• List</button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: `1px solid ${isGaming ? 'rgba(255,255,255,0.2)' : '#ccc'}`, paddingLeft: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          Insert Image (At Bottom)
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              onUploadStart();
              try {
                const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                const formData = new FormData();
                formData.append('file', compressed);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.url) {
                  onUploadSuccess(result.url);
                }
              } catch (err) {}
              e.target.value = '';
            }} 
          />
        </label>
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const [data, setData] = useState<PresentationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

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
        showToast('Perubahan berhasil disimpan!');
      }
    } catch (e) {
      showToast('Gagal menyimpan perubahan.');
    }
    setSaving(false);
  };

  const exportData = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `presentasi_backup_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('File backup berhasil diunduh!');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.chapters) {
          setData(parsed);
          showToast('Data berhasil di-import! Jangan lupa klik Save Changes.');
        } else {
          showToast('Format file JSON tidak valid!');
        }
      } catch (err) {
        showToast('Gagal membaca file JSON!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
    showToast('Chapter baru ditambahkan!');
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
    showToast('Slide baru ditambahkan!');
  };

  const removeChapter = (index: number) => {
    setConfirmAction({
      message: 'Hapus Chapter ini beserta seluruh slidenya?',
      onConfirm: () => {
        if (!data) return;
        const newData = { ...data };
        newData.chapters.splice(index, 1);
        setData(newData);
        showToast('Chapter berhasil dihapus!');
      }
    });
  };

  const removeSlide = (chapterIndex: number, slideIndex: number) => {
    setConfirmAction({
      message: 'Hapus Slide ini?',
      onConfirm: () => {
        if (!data) return;
        const newData = { ...data };
        newData.chapters[chapterIndex].slides.splice(slideIndex, 1);
        setData(newData);
        showToast('Slide berhasil dihapus!');
      }
    });
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
            
            {/* Export Button */}
            <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isGaming ? 'rgba(255,255,255,0.1)' : '#e4e4e7', color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.15)':'#d4d4d8'} onMouseOut={e=>e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.1)':'#e4e4e7'} title="Download Backup (JSON)">
              <Download size={16} /> Export
            </button>

            {/* Import Button */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isGaming ? 'rgba(255,255,255,0.1)' : '#e4e4e7', color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.15)':'#d4d4d8'} onMouseOut={e=>e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.1)':'#e4e4e7'} title="Upload Backup (JSON)">
              <Upload size={16} /> Import
              <input type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
            </label>

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
                                try {
                                  setMessage('Compressing...');
                                  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                  const formData = new FormData();
                                  formData.append('file', compressed);
                                  setMessage('Uploading...');
                                  const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                  const result = await res.json();
                                  if (result.url) {
                                    const newData = { ...data };
                                    newData.chapters[cIdx].image = result.url;
                                    setData(newData);
                                    setMessage('Upload successful!');
                                    setTimeout(() => setMessage(''), 2000);
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
                          <div style={{ border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px', marginBottom: '1.5rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fff' }}>
                            <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', background: isGaming ? 'rgba(59,130,246,0.1)' : '#eff6ff', display: 'flex', justifyContent: 'space-between', borderRadius: '8px 8px 0 0', borderBottom: `1px solid ${isGaming ? 'rgba(59,130,246,0.2)' : '#dbeafe'}` }}>
                              <span>💡 Hint: Klik 2x (Double-Click) pada gambar untuk menghapusnya.</span>
                              <span>Mendukung Drag & Drop gambar</span>
                            </div>
                            <AdminEditorToolbar 
                              onUploadStart={() => showToast('Uploading image...')} 
                              onUploadSuccess={(url: string) => { 
                                const imgHtml = `<img src="${url}" />`;
                                const newData: any = { ...data };
                                newData.chapters[cIdx].slides[sIdx].content = (newData.chapters[cIdx].slides[sIdx].content || '') + '<br/>' + imgHtml + '<br/>';
                                setData(newData);
                                showToast('Gambar berhasil ditambahkan!'); 
                              }} 
                              isGaming={isGaming} 
                            />
                            <div 
                              contentEditable 
                              suppressContentEditableWarning
                              className="rich-text-content"
                              onBlur={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].content = e.currentTarget.innerHTML; setData(newData); }}
                              onDoubleClick={(e) => {
                                const target = e.target as HTMLElement;
                                const container = e.currentTarget;
                                if (target.tagName === 'IMG') {
                                  const parent = target.parentNode;
                                  const nextSibling = target.nextSibling;
                                  
                                  // Temporarily remove to compute the exact new HTML safely
                                  target.remove();
                                  const nextHtml = container.innerHTML;
                                  // Put it immediately back to avoid visual glitch
                                  parent?.insertBefore(target, nextSibling);
                                  
                                  setConfirmAction({
                                    message: 'Hapus gambar ini?',
                                    onConfirm: () => {
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = nextHtml;
                                      setData(newData);
                                      showToast('Gambar berhasil dihapus!');
                                    }
                                  });
                                }
                              }}
                              onPaste={async (e) => {
                                const file = e.clipboardData.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                  e.preventDefault();
                                  setMessage('Compressing pasted image...');
                                  const tempId = 'img-' + Date.now();
                                  const placeholder = `<img id="${tempId}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=" style="opacity: 0.5;" />`;
                                  document.execCommand('insertHTML', false, placeholder);
                                  try {
                                    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                    const formData = new FormData(); formData.append('file', compressed);
                                    setMessage('Uploading pasted image...');
                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                    const result = await res.json();
                                    console.log('Paste result:', result);
                                    if (result.url) {
                                      const img = document.getElementById(tempId) as HTMLImageElement;
                                      if (img) {
                                        img.src = result.url;
                                        img.style.opacity = '1';
                                        img.removeAttribute('id');
                                      }
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = e.currentTarget.innerHTML;
                                      setData(newData);
                                      setMessage('Image pasted successfully!');
                                      setTimeout(() => setMessage(''), 2000);
                                    } else {
                                      setMessage('Paste failed: no URL');
                                      setTimeout(() => setMessage(''), 2000);
                                    }
                                  } catch (err) { 
                                    console.error('Paste error:', err);
                                    setMessage('Paste failed');
                                    setTimeout(() => setMessage(''), 2000);
                                  }
                                }
                              }}
                              onDrop={async (e) => {
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                  e.preventDefault();
                                  setMessage('Compressing dropped image...');
                                  const tempId = 'img-' + Date.now();
                                  const placeholder = `<img id="${tempId}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=" style="opacity: 0.5;" />`;
                                  document.execCommand('insertHTML', false, placeholder);
                                  try {
                                    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                    const formData = new FormData(); formData.append('file', compressed);
                                    setMessage('Uploading dropped image...');
                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                    const result = await res.json();
                                    console.log('Drop result:', result);
                                    if (result.url) {
                                      const img = document.getElementById(tempId) as HTMLImageElement;
                                      if (img) {
                                        img.src = result.url;
                                        img.style.opacity = '1';
                                        img.removeAttribute('id');
                                      }
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = e.currentTarget.innerHTML;
                                      setData(newData);
                                      setMessage('Image dropped successfully!');
                                      setTimeout(() => setMessage(''), 2000);
                                    } else {
                                      setMessage('Drop failed: no URL');
                                      setTimeout(() => setMessage(''), 2000);
                                    }
                                  } catch (err) { 
                                    console.error('Drop error:', err);
                                    setMessage('Drop failed');
                                    setTimeout(() => setMessage(''), 2000);
                                  }
                                }
                              }}
                              dangerouslySetInnerHTML={{ __html: slide.content }}
                              style={{ width: '100%', minHeight: '150px', fontSize: '0.95rem', lineHeight: 1.6, color: isGaming ? '#d4d4d8' : '#3f3f46', padding: '1rem', outline: 'none' }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', textTransform: 'uppercase' }}>Interactive Links (Embeds)</label>
                                <button onClick={() => {
                                  const newData = { ...data };
                                  if (!newData.chapters[cIdx].slides[sIdx].embeds) newData.chapters[cIdx].slides[sIdx].embeds = [];
                                  newData.chapters[cIdx].slides[sIdx].embeds!.push({ title: '', url: '' });
                                  setData(newData);
                                }} style={{ background: 'transparent', border: 'none', color: isGaming ? '#3b82f6' : '#111', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Plus size={12}/> Add Link</button>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(!slide.embeds || slide.embeds.length === 0) && !slide.embedUrl && (
                                  <p style={{ fontSize: '0.8rem', color: isGaming ? '#71717a' : '#a1a1aa', margin: 0, fontStyle: 'italic' }}>No embed links added yet.</p>
                                )}
                                {/* Legacy Embed Support */}
                                {slide.embedUrl && (
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" value={slide.embedTitle || ''} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embedTitle = e.target.value; setData(newData); }} placeholder="Title" style={{ flex: 1, fontSize: '0.85rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }} />
                                    <input type="text" value={slide.embedUrl} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embedUrl = e.target.value; setData(newData); }} placeholder="URL" style={{ flex: 2, fontSize: '0.85rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }} />
                                    <button onClick={() => { const newData = { ...data }; delete newData.chapters[cIdx].slides[sIdx].embedUrl; delete newData.chapters[cIdx].slides[sIdx].embedTitle; setData(newData); }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={14}/></button>
                                  </div>
                                )}
                                {/* Dynamic Embeds Support */}
                                {slide.embeds?.map((emb, eIdx) => (
                                  <div key={eIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" value={emb.title} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embeds![eIdx].title = e.target.value; setData(newData); }} placeholder="Title" style={{ flex: 1, fontSize: '0.85rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }} />
                                    <input type="text" value={emb.url} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embeds![eIdx].url = e.target.value; setData(newData); }} placeholder="URL" style={{ flex: 2, fontSize: '0.85rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.5rem', borderRadius: '6px', outline: 'none' }} />
                                    <button onClick={() => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embeds!.splice(eIdx, 1); setData(newData); }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={14}/></button>
                                  </div>
                                ))}
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

      {/* Floating Custom Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }} style={{ position: 'fixed', bottom: '2rem', left: '50%', background: '#3b82f6', color: '#fff', padding: '1rem 2rem', borderRadius: '100px', boxShadow: '0 10px 25px rgba(59,130,246,0.4)', fontWeight: 600, zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: isGaming ? '#18181b' : '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: isGaming ? '#fff' : '#111' }}>Konfirmasi</h3>
              <p style={{ fontSize: '1rem', color: isGaming ? '#a1a1aa' : '#52525b', marginBottom: '2rem' }}>{confirmAction.message}</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '0.75rem', background: isGaming ? 'rgba(255,255,255,0.1)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.2)':'#e4e4e7'} onMouseOut={e=>e.currentTarget.style.background=isGaming?'rgba(255,255,255,0.1)':'#f4f4f5'}>Batal</button>
                <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#dc2626'} onMouseOut={e=>e.currentTarget.style.background='#ef4444'}>Ya, Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
