"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PresentationsList() {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/presentations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPresentations(data);
        } else {
          setPresentations([]);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#151515] text-white font-sans p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-center">Daftar Presentasi Guru</h1>
        
        <div className="mb-12 flex justify-center">
          <Link href="/" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-sm font-bold shadow-lg border border-white/10">
            Kembali ke Beranda
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-slate-400">Loading presentations...</div>
        ) : presentations.length === 0 ? (
          <div className="text-center text-slate-400 bg-[#242424] p-12 rounded-3xl border border-white/5">
            Belum ada presentasi yang dibuat.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {presentations.map((item, i) => (
              <Link key={i} href={`/p/${item.slug}`} className="block bg-[#242424] p-6 rounded-3xl border border-white/5 hover:border-blue-500/50 hover:bg-[#2a2a2a] transition-all hover:-translate-y-1">
                <div className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">Oleh: {item.teacherName}</div>
                <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                <div className="text-sm text-slate-500">ID: {item.slug}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
