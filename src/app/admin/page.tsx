"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, MonitorPlay, Download, Upload, ArrowLeft, Edit2, Sparkles, Target, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { getBackgroundFromDB } from '../../lib/indexedDbHelper';

type EmbedLink = { title: string; url: string; };
type Slide = { id: string; title: string; content: string; image?: string; embedUrl?: string; embedTitle?: string; embeds?: EmbedLink[]; isQuiz?: boolean; quizQuestion?: string; quizOptionA?: string; quizOptionB?: string; quizOptionC?: string; quizOptionD?: string; quizCorrectAnswer?: 'A' | 'B' | 'C' | 'D'; quizTimer?: number; };
type Chapter = { id: string; title: string; subtitle?: string; image?: string; slides: Slide[]; isKahootMode?: boolean; kahootReadingTime?: number; };

type PresentationData = {
  id?: string;
  teacher_name: string;
  subject: string;
  title: string;
  theme: 'gaming' | 'formal';
  transition?: 'slide' | 'fade' | 'zoom' | 'flip' | 'drop' | 'blur' | 'rotate';
  chapters: Chapter[];
  content?: any;
};

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
  const [presentations, setPresentations] = useState<any[]>([]);
  const [data, setData] = useState<PresentationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [mode, setMode] = useState<'list' | 'editor'>('list');
  const [loading, setLoading] = useState(true);
  const [globalBg, setGlobalBg] = useState('');
  const [globalBgOpacity, setGlobalBgOpacity] = useState(0.6);
  const [uploadingChapter, setUploadingChapter] = useState<number | null>(null);
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.8-flash');
  const [aiCustomModel, setAiCustomModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGlobalQuizModal, setShowGlobalQuizModal] = useState(false);
  const [quizCount, setQuizCount] = useState(10);
  const [showAiSettings, setShowAiSettings] = useState(false);
  
  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadPresentations = () => {
    setLoading(true);
    fetch('/api/presentations')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setPresentations(d.filter((p: any) => p.title !== 'GLOBAL_SETTINGS'));
        setLoading(false);
      })
      .catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => {
    loadPresentations();
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
  }, []);

  const handleCreateNew = () => {
    setData({
      teacher_name: '',
      subject: '',
      title: 'Judul Presentasi Baru',
      theme: 'gaming',
      chapters: []
    });
    setMode('editor');
  };

  const handleEdit = (id: string) => {
    setLoading(true);
    fetch(`/api/presentations/${id}`)
      .then(res => res.json())
      .then(d => {
        // Gabungkan metadata dan content
        setData({
          id: d.id,
          teacher_name: d.teacher_name,
          subject: d.subject,
          title: d.title,
          theme: d.theme || 'gaming',
          transition: d.content?.transition || 'slide',
          chapters: d.content?.chapters || []
        });
        setMode('editor');
        setLoading(false);
      })
      .catch(e => { showToast('Gagal memuat data'); setLoading(false); });
  };

  const handleDelete = (id: string) => {
    setConfirmAction({
      message: 'Hapus presentasi ini dari database?',
      onConfirm: async () => {
        try {
          await fetch(`/api/presentations/${id}`, { method: 'DELETE' });
          showToast('Presentasi dihapus');
          loadPresentations();
        } catch(e) {
          showToast('Gagal menghapus');
        }
      }
    });
  };

  const handleSave = async () => {
    if (!data) return;
    if (!data.teacher_name || !data.subject || !data.title) {
      showToast('Nama Guru, Mapel, dan Judul wajib diisi!');
      return;
    }
    
    setSaving(true);
    const payload = {
      teacher_name: data.teacher_name,
      subject: data.subject,
      title: data.title,
      theme: data.theme,
      content: { chapters: data.chapters, transition: data.transition || 'slide' }
    };

    try {
      if (data.id) {
        // Update
        const res = await fetch(`/api/presentations/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) showToast('Perubahan berhasil disimpan!');
      } else {
        // Insert
        const res = await fetch('/api/presentations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const result = await res.json();
          setData({ ...data, id: result.id });
          showToast('Presentasi baru berhasil dibuat!');
        }
      }
    } catch (e) {
      showToast('Gagal menyimpan perubahan.');
    }
    setSaving(false);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt) {
      showToast('Mohon masukkan topik/prompt untuk AI');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          customApiKey: aiApiKey,
          customModel: aiModel === 'custom' ? aiCustomModel : aiModel
        })
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal generate AI');
        setIsGenerating(false);
        return;
      }
      
      if (result.chapters) {
        setData(prev => prev ? { ...prev, chapters: result.chapters } : prev);
        showToast('Materi berhasil digenerate AI!');
        setShowAiModal(false);
      } else {
        showToast('Format balasan AI tidak sesuai');
      }
    } catch (e) {
      showToast('Gagal terhubung ke AI');
    }
    setIsGenerating(false);
  };

  const triggerGlobalQuizModal = () => {
    if (!data || !data.chapters || data.chapters.length === 0) {
      showToast('Tidak ada bab materi untuk di-generate kuisnya.');
      return;
    }
    setQuizCount(10);
    setShowGlobalQuizModal(true);
  };

  const executeGenerateGlobalQuiz = async () => {
    if (!data || !data.chapters || data.chapters.length === 0) return;

    // Kumpulkan seluruh materi dari semua chapter (termasuk yang Kahoot mode agar semua konteks terbaca)
    let contextText = `Materi Keseluruhan Presentasi: ${data.title}\n\n`;
    let validContentFound = false;

    data.chapters.forEach((chapter, cIdx) => {
      contextText += `--- BAB ${cIdx + 1}: ${chapter.title} ---\n`;
      chapter.slides.forEach((s: any, i: number) => {
        const cleanContent = s.content ? s.content.replace(/<[^>]*>?/gm, ' ') : '';
        if (!s.isQuiz) {
          contextText += `Slide ${i+1} (${s.title}): ${cleanContent}\n`;
          validContentFound = true;
        }
      });
      contextText += '\n';
    });

    if (!validContentFound || contextText.length < 50) {
      showToast('Materi presentasi terlalu sedikit untuk digenerate ujian akhirnya.');
      return;
    }

    if (isNaN(quizCount) || quizCount < 1 || quizCount > 50) {
      showToast('Jumlah soal tidak valid (minimal 1, maksimal 50).');
      return;
    }

    setIsGenerating(true);
    showToast(`Sedang menyusun Ujian Akhir dengan ${quizCount} soal, mohon tunggu...`);
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: contextText,
          questionCount: quizCount,
          customApiKey: aiApiKey,
          customModel: aiModel === 'custom' ? aiCustomModel : aiModel
        })
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal generate Ujian Akhir AI');
        setIsGenerating(false);
        return;
      }
      
      if (result.slides && Array.isArray(result.slides)) {
        const newData = { ...data };
        
        // Buat chapter UJIAN AKHIR
        const newQuizChapter = {
          id: 'c' + Date.now(),
          title: `Ujian Akhir: ${data.title || 'Presentasi'}`,
          subtitle: `Evaluasi Komprehensif Seluruh Bab`,
          isKahootMode: true,
          kahootReadingTime: 5,
          slides: result.slides,
          image: data.chapters[0]?.image || '' 
        };

        // Tambahkan ke paling akhir
        newData.chapters.push(newQuizChapter);
        setData(newData);
        showToast(`Berhasil menambahkan Bab Ujian Akhir dengan ${result.slides.length} soal!`);
        setShowGlobalQuizModal(false);
      } else {
        showToast('Format balasan AI tidak sesuai');
      }
    } catch (e) {
      showToast('Gagal terhubung ke AI');
    }
    setIsGenerating(false);
  };

  const exportData = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `presentasi_${data.teacher_name}_backup_${new Date().getTime()}.json`);
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
          setData({ ...data, ...parsed }); // timpa ke form aktif
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
    const newChapter: Chapter = { id: `chap-${Date.now()}`, title: 'New Chapter', subtitle: 'Subtitle', image: '', slides: [] };
    setData({ ...data, chapters: [...data.chapters, newChapter] });
    showToast('Chapter baru ditambahkan!');
  };

  const addSlide = (chapterIndex: number) => {
    if (!data) return;
    const newData = { ...data };
    newData.chapters[chapterIndex].slides.push({ id: `slide-${Date.now()}`, title: 'Slide Title', content: 'Enter your slide content here...' });
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

  if (loading && mode === 'list') return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0c', color: '#fff' }}>Loading data...</div>;

  const isVideoBg = globalBg.match(/\.(mp4|webm|ogg)$/i) || globalBg.startsWith('data:video/');

  if (mode === 'list') {
    return (
      <div style={{ height: '100vh', background: globalBg ? '#000' : '#09090b', color: '#fff', padding: '4rem 2rem', fontFamily: 'var(--font-sans)', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
        
        {/* Dynamic Background */}
        {globalBg && isVideoBg && (
          <video autoPlay loop muted playsInline style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0, opacity: globalBgOpacity }}>
            <source src={globalBg} type="video/mp4" />
          </video>
        )}
        {globalBg && !isVideoBg && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${globalBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: globalBgOpacity }} />
        )}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <div>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '100px', backdropFilter: 'blur(10px)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', marginBottom: '1rem' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                <ArrowLeft size={16} /> Ke Halaman Utama
              </Link>
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Kelola Presentasi</h1>
            </div>
            <button onClick={handleCreateNew} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
              <Plus size={18} /> Buat Presentasi Baru
            </button>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {presentations.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(5px)' }}>Belum ada presentasi di database.</div>
            ) : (
              presentations.map(p => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{p.title}</h3>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>{p.teacher_name} - {p.subject}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(p.id)} style={{ padding: '0.5rem 1rem', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Edit2 size={14}/> Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Trash2 size={14}/> Hapus</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {confirmAction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: 'rgba(30,30,35,0.9)', padding: '2.5rem', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Konfirmasi</h3>
                <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>{confirmAction.message}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setConfirmAction(null); setTimeout(() => confirmAction.onConfirm(), 10); }} style={{ flex: 1, padding: '1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>Ya, Hapus</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {message && (
          <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', padding: '1rem 2rem', borderRadius: '100px', zIndex: 9999 }}>
            {message}
          </div>
        )}
      </div>
    );
  }

  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0c', color: '#fff' }}>Loading editor...</div>;

  const isGaming = data.theme === 'gaming';

  return (
    <div style={{ position: 'relative', height: '100vh', overflowY: 'auto', overflowX: 'hidden', background: isGaming ? (globalBg ? '#000' : '#0a0a0c') : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontFamily: 'var(--font-sans)', scrollBehavior: 'smooth' }}>
      
      {/* Dynamic Background for Editor Mode */}
      {isGaming && globalBg && isVideoBg && (
        <video autoPlay loop muted playsInline style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0, opacity: globalBgOpacity }}>
          <source src={globalBg} type="video/mp4" />
        </video>
      )}
      {isGaming && globalBg && !isVideoBg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${globalBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: globalBgOpacity }} />
      )}
      {isGaming && globalBg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)', zIndex: 0, pointerEvents: 'none' }} />
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 10 }}>
        
        {/* Header Editor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
          <div>
            <button onClick={() => { loadPresentations(); setMode('list'); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: isGaming ? '#fff' : '#111', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '100px', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
              <ArrowLeft size={16} /> Kembali ke Daftar
            </button>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>Presentation Editor</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

            <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
              <Download size={16} /> Export
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
              <Upload size={16} /> Import
              <input type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
            </label>
            <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* AI Generator Banner */}
        <div style={{ background: isGaming ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, padding: '2rem', borderRadius: '16px', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isGaming ? '#fff' : '#111' }}><Sparkles size={20} color={isGaming ? '#a1a1aa' : '#52525b'} /> AI Auto-Generator</h2>
              <p style={{ margin: 0, color: isGaming ? '#a1a1aa' : '#52525b', fontSize: '0.9rem' }}>Hemat waktu berjam-jam. Biarkan AI merancang seluruh materi presentasi dan ujian Anda.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setShowAiSettings(!showAiSettings)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '100px', background: isGaming ? 'rgba(255,255,255,0.1)' : '#f4f4f5', border: 'none', color: isGaming ? '#fff' : '#111', cursor: 'pointer', transition: 'all 0.2s' }} title="Pengaturan Model & API">
                <Settings size={18} />
              </button>
              <button onClick={() => setShowAiModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: isGaming ? '#fff' : '#111', padding: '0.75rem 1.5rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: '0.9rem', transition: 'all 0.2s' }}>
                <Sparkles size={16} /> Generate Materi Baru
              </button>
              <button onClick={triggerGlobalQuizModal} disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '100px', border: 'none', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', opacity: isGenerating ? 0.7 : 1 }}>
                <Target size={16} /> Generate Ujian Akhir (Semua Bab)
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAiSettings && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '2rem' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1.5rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>API Key Anda (Opsional)</label>
                    <input type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} style={{ width: '100%', fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.4)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} placeholder="Kosongkan jika pakai default" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Pilih Model AI</label>
                    <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} style={{ width: '100%', fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.4)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem', borderRadius: '8px', outline: 'none', marginBottom: '0.5rem' }}>
                      <option value="gemini-3.6-flash" style={{color: '#111'}}>Gemini 3.6 Flash (Cepat)</option>
                      <option value="gemini-3.8-flash" style={{color: '#111'}}>Gemini 3.8 Flash (Paling Baru)</option>
                      <option value="gemini-3-flash-preview" style={{color: '#111'}}>Gemini 3 Flash Preview</option>
                      <option value="gemini-3.1-pro-preview" style={{color: '#111'}}>Gemini 3.1 Pro (Pintar)</option>
                      <option value="custom" style={{color: '#111'}}>Ketik Manual / Lainnya...</option>
                    </select>
                    {aiModel === 'custom' && (
                      <input type="text" value={aiCustomModel} onChange={(e) => setAiCustomModel(e.target.value)} style={{ width: '100%', fontSize: '0.9rem', background: isGaming ? 'rgba(0,0,0,0.5)' : '#fff', border: `1px dashed ${isGaming ? 'rgba(255,255,255,0.3)' : '#cbd5e1'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} placeholder="Misal: gemini-4.0-pro" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Settings */}
        <div style={{ background: isGaming ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, padding: '2rem', borderRadius: '16px', marginBottom: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Nama Guru</label>
            <input type="text" value={data.teacher_name} onChange={(e) => setData({ ...data, teacher_name: e.target.value })} style={{ width: '100%', fontSize: '1rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none' }} placeholder="Misal: Aris Bermansyah" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Mata Pelajaran</label>
            <input type="text" value={data.subject} onChange={(e) => setData({ ...data, subject: e.target.value })} style={{ width: '100%', fontSize: '1rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none' }} placeholder="Misal: Informatika" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Judul Modul / Presentasi</label>
            <input type="text" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} style={{ width: '100%', fontSize: '1rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none' }} placeholder="Misal: Bab 1 - Pengenalan Internet" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Transisi Slide (Animasi)</label>
            <select value={data.transition || 'slide'} onChange={(e) => setData({ ...data, transition: e.target.value as any })} style={{ width: '100%', fontSize: '1rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none' }}>
              <option value="slide" style={{ color: '#111' }}>Geser (Slide)</option>
              <option value="fade" style={{ color: '#111' }}>Memudar (Fade)</option>
              <option value="zoom" style={{ color: '#111' }}>Perbesar (Zoom)</option>
              <option value="flip" style={{ color: '#111' }}>Balik (Flip 3D)</option>
              <option value="drop" style={{ color: '#111' }}>Jatuh (Drop)</option>
              <option value="blur" style={{ color: '#111' }}>Kabur (Blur)</option>
              <option value="rotate" style={{ color: '#111' }}>Putar (Rotate)</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '1rem' }}>
              <span>Kecerahan Background</span>
              <span>{Math.round(globalBgOpacity * 100)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={globalBgOpacity} onChange={(e) => setGlobalBgOpacity(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }} />
          </div>
        </div>

        {/* Chapters Section (Sama seperti sebelumnya) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Chapters & Slides</h2>
          
          <AnimatePresence>
            {data.chapters.map((chap, cIdx) => (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={chap.id} style={{ background: isGaming ? 'rgba(255,255,255,0.02)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '2rem', borderBottom: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: isGaming ? 'rgba(255,255,255,0.1)' : '#f4f4f5', color: isGaming ? '#fff' : '#111', fontWeight: 700, fontSize: '1.25rem' }}>{cIdx + 1}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Chapter Title</label>
                        <input type="text" value={chap.title} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].title = e.target.value; setData(newData); }} style={{ width: '100%', fontSize: '1.5rem', fontWeight: 700, background: 'transparent', border: 'none', color: isGaming ? '#fff' : '#111', padding: 0, outline: 'none' }} placeholder="Chapter Title" />
                      </div>
                      <button onClick={() => removeChapter(cIdx)} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={20} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Subtitle</label>
                        <input type="text" value={chap.subtitle || ''} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].subtitle = e.target.value; setData(newData); }} style={{ width: '100%', fontSize: '0.95rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' }} placeholder="Subtitle" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Cover Image</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" value={chap.image || ''} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].image = e.target.value; setData(newData); }} style={{ flex: 1, fontSize: '0.95rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' }} placeholder="URL" />
                          <label style={{ display: 'flex', alignItems: 'center', background: isGaming ? '#3b82f6' : '#111', color: '#fff', padding: '0 1rem', borderRadius: '6px', cursor: uploadingChapter === cIdx ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: uploadingChapter === cIdx ? 0.7 : 1 }}>
                            {uploadingChapter === cIdx ? 'Mengunggah...' : 'Upload'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingChapter === cIdx} onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingChapter(cIdx);
                              showToast('Mengunggah gambar cover...');
                              try {
                                const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                const formData = new FormData(); formData.append('file', compressed);
                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                const result = await res.json();
                                if (result.url) {
                                  const newData = { ...data };
                                  newData.chapters[cIdx].image = result.url;
                                  setData(newData);
                                  showToast('Cover berhasil diunggah!');
                                }
                              } catch (err) {
                                showToast('Gagal mengunggah cover');
                                console.error(err);
                              } finally {
                                setUploadingChapter(null);
                              }
                            }} />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Kahoot Mode Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: isGaming ? 'rgba(59,130,246,0.05)' : '#f0f9ff', padding: '1rem', borderRadius: '8px', border: `1px solid ${isGaming ? 'rgba(59,130,246,0.2)' : '#bae6fd'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: isGaming ? '#fff' : '#0369a1', cursor: 'pointer' }}>
                          <input type="checkbox" checked={chap.isKahootMode || false} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].isKahootMode = e.target.checked; if(e.target.checked && !newData.chapters[cIdx].kahootReadingTime) { newData.chapters[cIdx].kahootReadingTime = 5; } setData(newData); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          Jadikan Chapter ini Kuis Kahoot (Interactive Kahoot Mode)
                        </label>
                      </div>
                      {chap.isKahootMode && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#93c5fd' : '#0284c7', marginBottom: '0.5rem' }}>Waktu Membaca Soal (detik)</label>
                            <input type="number" min={1} value={chap.kahootReadingTime || 5} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].kahootReadingTime = parseInt(e.target.value) || 5; setData(newData); }} style={{ width: '100%', fontSize: '0.95rem', background: isGaming ? 'rgba(0,0,0,0.3)' : '#fff', border: '1px solid transparent', color: isGaming ? '#fff' : '#111', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' }} placeholder="5" />
                          </div>
                          <div style={{ flex: 2, fontSize: '0.8rem', color: isGaming ? '#94a3b8' : '#64748b' }}>
                            Di mode Kahoot, slide yang dicentang "Jadikan Kuis Interaktif" akan menjadi soal Kahoot. Slide pertama akan memunculkan Lobby Code.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slides */}
                <div style={{ padding: '2rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fafafa' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: isGaming ? '#d4d4d8' : '#52525b' }}>Slides</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence>
                      {chap.slides.map((slide, sIdx) => (
                        <motion.div key={slide.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ background: isGaming ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`, borderRadius: '12px', padding: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isGaming ? '#3b82f6' : '#111', textTransform: 'uppercase', background: isGaming ? 'rgba(59,130,246,0.1)' : '#f4f4f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Slide {sIdx + 1}</span>
                            <button onClick={() => removeSlide(cIdx, sIdx)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </div>
                          <input type="text" value={slide.title} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].title = e.target.value; setData(newData); }} style={{ width: '100%', fontSize: '1.2rem', fontWeight: 600, background: 'transparent', border: 'none', color: isGaming ? '#fff' : '#111', padding: '0 0 1rem 0', outline: 'none' }} placeholder="Slide Title" />
                          
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: isGaming ? '#a1a1aa' : '#71717a', fontWeight: 600 }}>
                              <input type="checkbox" checked={slide.isQuiz || false} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].isQuiz = e.target.checked; setData(newData); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                              Jadikan Slide ini sebagai Kuis Interaktif
                            </label>
                          </div>

                          {slide.isQuiz && (
                            <div style={{ background: isGaming ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${isGaming ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)'}`, marginBottom: '1.5rem' }}>
                              <h4 style={{ margin: '0 0 1rem 0', color: isGaming ? '#93c5fd' : '#2563eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Pengaturan Kuis</h4>
                              
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Pertanyaan</label>
                              <div style={{ border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px', marginBottom: '1.5rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fff' }}>
                                <AdminEditorToolbar onUploadStart={() => showToast('Mengunggah gambar...')} onUploadSuccess={(url: string) => { const newData: any = { ...data }; newData.chapters[cIdx].slides[sIdx].quizQuestion = (newData.chapters[cIdx].slides[sIdx].quizQuestion || '') + `<br/><img src="${url}" /><br/>`; setData(newData); showToast('Gambar berhasil diunggah!'); }} isGaming={isGaming} />
                                <div style={{ padding: '0.5rem 1rem', background: isGaming ? 'rgba(255,255,255,0.02)' : '#fafafa', borderBottom: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, fontSize: '0.75rem', color: isGaming ? '#a1a1aa' : '#71717a' }}>
                                  Ketik teks soal kuis di bawah ini. Bisa <b>Drag & Drop</b> gambar ke area ini. <i>(Klik ganda pada gambar untuk menghapus)</i>
                                </div>
                                <div 
                                  contentEditable suppressContentEditableWarning className="rich-text-content"
                                  onBlur={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].quizQuestion = e.currentTarget.innerHTML; setData(newData); }}
                                  dangerouslySetInnerHTML={{ __html: slide.quizQuestion || '' }}
                                  style={{ width: '100%', minHeight: '100px', fontSize: '0.95rem', padding: '1rem', outline: 'none', color: isGaming ? '#fff' : '#111' }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (!file || !file.type.startsWith('image/')) return;
                                    
                                    let savedRange: Range | null = null;
                                    const sel = window.getSelection();
                                    if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0);

                                    showToast('Mengunggah gambar...');
                                    try {
                                      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                      const formData = new FormData(); formData.append('file', compressed);
                                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                      const result = await res.json();
                                      if (result.url) {
                                        if (savedRange) {
                                          sel?.removeAllRanges();
                                          sel?.addRange(savedRange);
                                          document.execCommand('insertHTML', false, `<br/><img src="${result.url}" /><br/>`);
                                          const newData = { ...data };
                                          newData.chapters[cIdx].slides[sIdx].quizQuestion = e.currentTarget.innerHTML;
                                          setData(newData);
                                        } else {
                                          const newData = { ...data };
                                          newData.chapters[cIdx].slides[sIdx].quizQuestion = (newData.chapters[cIdx].slides[sIdx].quizQuestion || '') + `<br/><img src="${result.url}" /><br/>`;
                                          setData(newData);
                                        }
                                        showToast('Gambar berhasil diunggah!');
                                      }
                                    } catch (err) {
                                      showToast('Gagal mengunggah gambar');
                                    }
                                  }}
                                  onPaste={async (e) => {
                                    const items = e.clipboardData?.items;
                                    if (!items) return;
                                    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
                                    if (!imageItem) return;
                                    
                                    const file = imageItem.getAsFile();
                                    if (!file) return;

                                    e.preventDefault();
                                    
                                    let savedRange: Range | null = null;
                                    const sel = window.getSelection();
                                    if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0);

                                    showToast('Mengunggah gambar...');
                                    try {
                                      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                      const formData = new FormData(); formData.append('file', compressed);
                                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                      const result = await res.json();
                                      if (result.url) {
                                        if (savedRange) {
                                          sel?.removeAllRanges();
                                          sel?.addRange(savedRange);
                                          document.execCommand('insertHTML', false, `<br/><img src="${result.url}" /><br/>`);
                                          const newData = { ...data };
                                          newData.chapters[cIdx].slides[sIdx].quizQuestion = e.currentTarget.innerHTML;
                                          setData(newData);
                                        } else {
                                          const newData = { ...data };
                                          newData.chapters[cIdx].slides[sIdx].quizQuestion = (newData.chapters[cIdx].slides[sIdx].quizQuestion || '') + `<br/><img src="${result.url}" /><br/>`;
                                          setData(newData);
                                        }
                                        showToast('Gambar berhasil diunggah!');
                                      }
                                    } catch (err) {
                                      showToast('Gagal mengunggah gambar');
                                    }
                                  }}
                                  onDoubleClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    const editorDiv = e.currentTarget;
                                    if (target.tagName === 'IMG') {
                                      if (confirm('Hapus gambar ini?')) {
                                        target.remove();
                                        const newData = { ...data };
                                        newData.chapters[cIdx].slides[sIdx].quizQuestion = editorDiv.innerHTML;
                                        setData(newData);
                                      }
                                    }
                                  }}
                                />
                              </div>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <div key={opt}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Opsi {opt}</label>
                                    <input type="text" value={(slide as any)[`quizOption${opt}`] || ''} onChange={(e) => { const newData = { ...data }; (newData.chapters[cIdx].slides[sIdx] as any)[`quizOption${opt}`] = e.target.value; setData(newData); }} style={{ width: '100%', padding: '0.75rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: isGaming ? '#fff' : '#111', borderRadius: '8px', outline: 'none' }} placeholder={`Jawaban ${opt}`} />
                                  </div>
                                ))}
                              </div>
                              
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Kunci Jawaban Benar</label>
                              <select value={slide.quizCorrectAnswer || 'A'} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].quizCorrectAnswer = e.target.value as any; setData(newData); }} style={{ width: '100%', padding: '0.75rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: isGaming ? '#fff' : '#111', borderRadius: '8px', outline: 'none', marginBottom: '1rem' }}>
                                <option value="A">Opsi A</option>
                                <option value="B">Opsi B</option>
                                <option value="C">Opsi C</option>
                                <option value="D">Opsi D</option>
                              </select>
                              
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Durasi Timer (Detik)</label>
                              <input type="number" min="5" max="300" value={slide.quizTimer === undefined ? 30 : slide.quizTimer} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].quizTimer = e.target.value === '' ? ('' as any) : parseInt(e.target.value); setData(newData); }} style={{ width: '100%', padding: '0.75rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#fff', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: isGaming ? '#fff' : '#111', borderRadius: '8px', outline: 'none' }} placeholder="Contoh: 30" />
                            </div>
                          )}
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.25rem', textTransform: 'uppercase' }}>URL Gambar Utama Slide</label>
                            <input 
                              type="text" 
                              value={slide.image || ''} 
                              onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].image = e.target.value; setData(newData); }} 
                              placeholder="Contoh: https://image.pollinations.ai/prompt/indonesia?width=1200&height=800" 
                              style={{ width: '100%', padding: '0.75rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', borderRadius: '8px', outline: 'none', fontSize: '0.85rem' }} 
                            />
                            {slide.image && (
                               <a href={slide.image} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem', display: 'inline-block' }}>Lihat Gambar &rarr;</a>
                            )}
                          </div>
                          
                          <div style={{ border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <AdminEditorToolbar onUploadStart={() => showToast('Mengunggah gambar...')} onUploadSuccess={(url: string) => { const newData: any = { ...data }; newData.chapters[cIdx].slides[sIdx].content = (newData.chapters[cIdx].slides[sIdx].content || '') + `<br/><img src="${url}" /><br/>`; setData(newData); showToast('Gambar berhasil diunggah!'); }} isGaming={isGaming} />
                            <div style={{ padding: '0.5rem 1rem', background: isGaming ? 'rgba(255,255,255,0.02)' : '#fafafa', borderBottom: `1px solid ${isGaming ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, fontSize: '0.75rem', color: isGaming ? '#a1a1aa' : '#71717a' }}>
                              Ketik teks di bawah ini. Bisa <b>Drag & Drop</b> gambar ke area ini. <i>(Klik ganda pada gambar untuk menghapus)</i>
                            </div>
                            <div 
                              contentEditable suppressContentEditableWarning className="rich-text-content"
                              onBlur={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].content = e.currentTarget.innerHTML; setData(newData); }}
                              dangerouslySetInnerHTML={{ __html: slide.content }}
                              style={{ width: '100%', minHeight: '150px', fontSize: '0.95rem', padding: '1rem', outline: 'none' }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (!file || !file.type.startsWith('image/')) return;
                                
                                let savedRange: Range | null = null;
                                const sel = window.getSelection();
                                if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0);

                                showToast('Mengunggah gambar...');
                                try {
                                  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                  const formData = new FormData(); formData.append('file', compressed);
                                  const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                  const result = await res.json();
                                  if (result.url) {
                                    if (savedRange) {
                                      sel?.removeAllRanges();
                                      sel?.addRange(savedRange);
                                      document.execCommand('insertHTML', false, `<br/><img src="${result.url}" /><br/>`);
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = e.currentTarget.innerHTML;
                                      setData(newData);
                                    } else {
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = (newData.chapters[cIdx].slides[sIdx].content || '') + `<br/><img src="${result.url}" /><br/>`;
                                      setData(newData);
                                    }
                                    showToast('Gambar berhasil diunggah!');
                                  }
                                } catch (err) {
                                  showToast('Gagal mengunggah gambar');
                                }
                              }}
                              onPaste={async (e) => {
                                const items = e.clipboardData?.items;
                                if (!items) return;
                                const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
                                if (!imageItem) return;
                                
                                const file = imageItem.getAsFile();
                                if (!file) return;

                                e.preventDefault();
                                
                                let savedRange: Range | null = null;
                                const sel = window.getSelection();
                                if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0);

                                showToast('Mengunggah gambar...');
                                try {
                                  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                                  const formData = new FormData(); formData.append('file', compressed);
                                  const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                  const result = await res.json();
                                  if (result.url) {
                                    if (savedRange) {
                                      sel?.removeAllRanges();
                                      sel?.addRange(savedRange);
                                      document.execCommand('insertHTML', false, `<br/><img src="${result.url}" /><br/>`);
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = e.currentTarget.innerHTML;
                                      setData(newData);
                                    } else {
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = (newData.chapters[cIdx].slides[sIdx].content || '') + `<br/><img src="${result.url}" /><br/>`;
                                      setData(newData);
                                    }
                                    showToast('Gambar berhasil diunggah!');
                                  }
                                } catch (err) {
                                  showToast('Gagal mengunggah gambar');
                                }
                              }}
                              onDoubleClick={(e) => {
                                const target = e.target as HTMLElement;
                                const editorDiv = e.currentTarget;
                                if (target.tagName === 'IMG') {
                                  setConfirmAction({
                                    message: 'Hapus gambar ini?',
                                    onConfirm: () => {
                                      target.remove();
                                      const newData = { ...data };
                                      newData.chapters[cIdx].slides[sIdx].content = editorDiv.innerHTML;
                                      setData(newData);
                                    }
                                  });
                                }
                              }}
                            />
                          </div>

                          {/* Embeds */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', textTransform: 'uppercase' }}>Interactive Links</label>
                              <button onClick={() => { const newData = { ...data }; if (!newData.chapters[cIdx].slides[sIdx].embeds) newData.chapters[cIdx].slides[sIdx].embeds = []; newData.chapters[cIdx].slides[sIdx].embeds!.push({ title: '', url: '' }); setData(newData); }} style={{ background: 'transparent', border: 'none', color: isGaming ? '#3b82f6' : '#111', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}><Plus size={12}/> Add</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {slide.embeds?.map((emb, eIdx) => (
                                <div key={eIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input type="text" value={emb.title} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embeds![eIdx].title = e.target.value; setData(newData); }} placeholder="Title" style={{ flex: 1, padding: '0.5rem', borderRadius: '6px' }} />
                                  <input type="text" value={emb.url} onChange={(e) => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embeds![eIdx].url = e.target.value; setData(newData); }} placeholder="URL" style={{ flex: 2, padding: '0.5rem', borderRadius: '6px' }} />
                                  <button onClick={() => { const newData = { ...data }; newData.chapters[cIdx].slides[sIdx].embeds!.splice(eIdx, 1); setData(newData); }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <button onClick={() => addSlide(cIdx)} style={{ padding: '1rem', background: 'transparent', border: `1px dashed ${isGaming ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, color: isGaming ? '#a1a1aa' : '#52525b', borderRadius: '12px', cursor: 'pointer' }}><Plus size={16} /> Add Slide</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={addChapter} style={{ padding: '1.5rem', background: isGaming ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.3)`, color: '#3b82f6', borderRadius: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', transition: 'all 0.2s' }}><Plus size={20} /> Create New Chapter</button>
        </div>
      </div>
      
      {/* Modals & Toasts */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ background: isGaming ? 'rgba(30,30,35,0.9)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, padding: '2.5rem', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: isGaming ? '#fff' : '#111', fontWeight: 700 }}>Konfirmasi</h3>
              <p style={{ marginBottom: '2rem', color: isGaming ? '#a1a1aa' : '#52525b' }}>{confirmAction.message}</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', cursor: 'pointer', background: isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isGaming ? '#fff' : '#111', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, fontWeight: 600 }}>Batal</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setConfirmAction(null); setTimeout(() => confirmAction.onConfirm(), 10); }} style={{ flex: 1, padding: '1rem', background: '#ef4444', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>Ya, Lanjutkan</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ background: isGaming ? 'rgba(30,30,35,0.9)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, padding: '2.5rem', borderRadius: '24px', maxWidth: '600px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', padding: '0.75rem', borderRadius: '50%', color: '#fff' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', color: isGaming ? '#fff' : '#111', fontWeight: 700, margin: 0 }}>AI Auto-Generator</h3>
                  <p style={{ color: isGaming ? '#a1a1aa' : '#52525b', fontSize: '0.9rem', margin: 0 }}>Buat presentasi otomatis dari satu kalimat perintah.</p>
                </div>
              </div>

              {isGenerating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '2rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: '60px', height: '60px', border: '4px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: isGaming ? '#fff' : '#111', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Sedang Meracik Materi...</h4>
                    <p style={{ color: isGaming ? '#a1a1aa' : '#52525b', fontSize: '0.9rem' }}>Proses ini membutuhkan waktu beberapa detik tergantung seberapa rumit topik Anda.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Topik / Perintah Utama (Wajib)</label>
                <textarea 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  style={{ width: '100%', height: '100px', fontSize: '1rem', background: isGaming ? 'rgba(0,0,0,0.2)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '1rem', borderRadius: '12px', outline: 'none', resize: 'vertical' }} 
                  placeholder="Misal: Buatkan materi tentang Sejarah Kemerdekaan Indonesia, buat 3 chapter dan masing-masing 4 slide."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setShowAiModal(false)} disabled={isGenerating} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', background: isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isGaming ? '#fff' : '#111', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, fontWeight: 600 }}>Batal</button>
                <button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', color: '#fff', borderRadius: '12px', border: 'none', cursor: isGenerating || !aiPrompt ? 'not-allowed' : 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)', opacity: (isGenerating || !aiPrompt) ? 0.6 : 1 }}>
                  {isGenerating ? 'Sedang Memikirkan...' : '✨ Generate Sekarang'}
                </button>
              </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Quiz Modal */}
      <AnimatePresence>
        {showGlobalQuizModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }} style={{ width: '90%', maxWidth: '400px', background: isGaming ? 'rgba(30,30,35,0.95)' : '#fff', padding: '2.5rem', borderRadius: '24px', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: isGaming ? '#fff' : '#111' }}>Konfirmasi Ujian Akhir</h3>
                <p style={{ margin: 0, color: isGaming ? '#a1a1aa' : '#52525b', fontSize: '0.9rem' }}>Masukkan jumlah soal yang ingin digenerate dari rangkuman semua bab.</p>
              </div>

              {isGenerating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1.5rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: '50px', height: '50px', border: '4px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%' }} />
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: isGaming ? '#fff' : '#111', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Sedang Menyusun Ujian...</h4>
                    <p style={{ color: isGaming ? '#a1a1aa' : '#52525b', fontSize: '0.85rem', margin: 0 }}>Menganalisis seluruh materi bab Anda.</p>
                  </div>
                </div>
              ) : (
                <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: isGaming ? '#a1a1aa' : '#71717a', marginBottom: '0.5rem' }}>Jumlah Soal (Maks: 50)</label>
                <input type="number" min="1" max="50" value={quizCount} onChange={(e) => setQuizCount(parseInt(e.target.value) || 10)} style={{ width: '100%', fontSize: '1rem', background: isGaming ? 'rgba(0,0,0,0.3)' : '#f4f4f5', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'transparent'}`, color: isGaming ? '#fff' : '#111', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={() => setShowGlobalQuizModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', background: isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isGaming ? '#fff' : '#111', border: `1px solid ${isGaming ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, fontWeight: 600 }}>Batal</button>
                <button onClick={executeGenerateGlobalQuiz} disabled={isGenerating} style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: '#fff', borderRadius: '12px', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isGenerating ? 0.6 : 1 }}>
                  Lanjutkan
                </button>
              </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {message && <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', padding: '1rem 2rem', borderRadius: '100px', zIndex: 9999 }}>{message}</div>}
    </div>
  );
}
