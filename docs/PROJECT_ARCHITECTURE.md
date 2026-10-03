# Arsitektur Keseluruhan Web Presentasi

Dokumen ini merupakan panduan utama (*Master Guide*) untuk struktur program, fungsi, dan arsitektur *Web Presentasi* secara keseluruhan. Panduan ini dirancang agar *AI Agent* atau pengembang di masa depan dapat langsung memahami visi, teknologi, dan alur kerja proyek ini tanpa harus meraba-raba.

---

## 1. Visi & Fitur Utama Aplikasi
Web Presentasi ini bukan sekadar alat *slide* biasa seperti PowerPoint, melainkan platform presentasi interaktif dan dinamis berbasis *web*. Fitur utamanya meliputi:
- **Tema Dinamis:** Mendukung tema antarmuka yang berbeda (contoh: *Gaming* dengan efek *glassmorphism/neon* dan *Formal* untuk profesional).
- **AI Generator:** Mampu membuat materi presentasi lengkap (struktur bab, isi slide, hingga gambar) hanya bermodalkan satu kalimat (menggunakan **Gemini API** dan **Pollinations AI**).
- **Mode Kahoot (Interactive Quiz):** Mengubah presentasi pasif menjadi arena kuis *real-time* yang melibatkan *smartphone* audiens.
- **Embedded Web & Media:** Mendukung penyisipan (*embed*) *link* eksternal dan gambar.

---

## 2. Tech Stack Utama (Dependencies)
- **Core:** Next.js 16+ (App Router), React 19, TypeScript.
- **Styling:** Inline CSS & `framer-motion` (untuk transisi halaman, efek mikro-interaksi, dan *layouting* dinamis).
- **Database & Backend:** Supabase (Database relasional untuk menyimpan data materi + Realtime WebSocket untuk interaksi kuis).
- **AI Integrations:** 
  - `@google/generative-ai` (Gemini) untuk pembuat kerangka teks.
  - URL *on-the-fly* `image.pollinations.ai` untuk *text-to-image*.
- **Visual & Chart:** `qrcode.react` (untuk *scan barcode*), `recharts` (untuk grafik *polling* jika ada), `@react-three/fiber` (opsional untuk efek 3D).

---

## 3. Struktur Folder App Router (`/src/app`)

Peta rute aplikasi ini sangat *straightforward*:

| Rute (Route) | Deskripsi / Fungsi |
| :--- | :--- |
| `/page.tsx` | **Halaman Utama (Landing Page)**. Halaman awal untuk menyambut pengguna. |
| `/admin/page.tsx` | **Admin Panel (Editor)**. Pusat kendali untuk membuat, mengedit, dan menghapus presentasi. Berisi *Rich Text Editor*, pengaturan Tema, generator AI, dan pengaturan mode Kahoot per bab. |
| `/view/[id]/page.tsx` | **Proyektor (Viewer Mode)**. Halaman yang ditampilkan di proyektor besar. Menampilkan daftar Bab (Chapter). Jika Bab biasa, akan masuk ke mode *Slide*. Jika Bab tersebut dicentang sebagai "Kuis Kahoot", halaman ini akan merender komponen `KahootPresenter.tsx`. |
| `/view/[id]/KahootPresenter.tsx` | **Otak Utama Kahoot (Host)**. Komponen yang memimpin jalannya kuis interaktif (mengatur kapan soal muncul, kapan waktu habis, dan menghitung skor). |
| `/kahoot/[roomId]/page.tsx` | **Layar Siswa (Client Kahoot)**. Layar yang diakses siswa via HP. Sangat ringan dan sepenuhnya dikendalikan oleh sinyal *broadcast* dari `KahootPresenter`. |
| `/play/[id]` & `/quiz/[id]` | *(Fitur Ekstra)* Mode khusus kuis mandiri atau polling (bila diaktifkan). |

---

## 4. Struktur Database (Supabase)

Ada dua mekanisme *database* yang berjalan secara paralel di aplikasi ini:

### A. Tabel Permanen (SQL Table)
- **Tabel:** `presentations`
- **Fungsi:** Menyimpan seluruh kerangka presentasi. 
- **Struktur Logis (Disimpan dalam format JSON di dalam kolom):**
  - `title`, `theme`, `transition`
  - `chapters`: Array yang berisi daftar Bab.
    - `slides`: Array yang berisi daftar halaman presentasi. 
    - Setiap slide memiliki properti teks biasa atau properti kuis (`isQuiz`, `quizCorrectAnswer`, `quizTimer`, dll).
- *Catatan AI:* Jika mengubah kerangka data di `admin`, Anda sedang memodifikasi *blob* JSON yang kemudian di-*push* ke dalam tabel `presentations`.

### B. Saluran Volatile (Supabase Realtime Channels)
- **Fungsi:** Tidak ada penyimpanan SQL permanen untuk interaksi Kahoot. Semuanya berjalan di memori WebSocket server Supabase (kecepatan tinggi, latensi rendah).
- **Mekanisme:**
  - **Presence:** Digunakan untuk melacak daftar pemain secara *real-time* di *Lobby*.
  - **Broadcast:** Digunakan untuk melempar state permainan (misal: "Sekarang ganti ke soal nomor 2!", atau "Ini daftar juaranya!").

*(Lihat `docs/KAHOOT_ARCHITECTURE.md` untuk detail ekstrem tentang alur Realtime ini).*

---

## 5. Alur Kerja AI Generator (Gemini)

Terletak di `/api/ai/generate/route.ts`. Ini adalah salah satu fitur paling brilian di aplikasi ini:
1. **Prompt Engineering:** *Endpoint* ini menerima topik dari *user*, lalu membungkusnya dalam *System Prompt* yang sangat ketat.
2. **Strict JSON:** Gemini dipaksa untuk merespon HANYA dalam format JSON Murni (bukan Markdown teks biasa) yang strukturnya sama persis dengan properti `chapters` aplikasi ini.
3. **Auto-Image:** Alih-alih membuat fungsi *generate image* yang rumit, AI diprogram untuk mengisi kolom URL gambar slide dengan format `https://image.pollinations.ai/prompt/{deskripsi_gambar}?width=1200&height=800`. Ini memungkinkan gambar tercipta *on-the-fly* saat slide dirender di layar proyektor tanpa perlu di- *hosting* manual!

---

## 6. Aturan Modifikasi untuk AI/Developer di Masa Depan

Jika Anda (AI di masa depan) ditugaskan untuk mengedit proyek ini, HAFALKAN aturan ini:
1. **Gunakan Supabase Realtime untuk Interaktivitas:** Jika *user* meminta fitur "Polling Langsung", "Tanya Jawab Live", atau "Emoticon Terbang", jangan buat tabel SQL baru. Gunakan Supabase `channel.send({ type: 'broadcast' })`.
2. **Kendalikan Stale Closure:** Di React, penggunaan `setInterval` atau `setTimeout` bersamaan dengan status WebSocket sangat berbahaya. Selalu gunakan `useRef` untuk variabel yang nilainya terus berubah jika variabel itu mau dibaca dari dalam fungsi *timer*.
3. **Framer Motion:** Aplikasi ini sangat bergantung pada animasi. Jangan hapus tag `<motion.div>` atau `<AnimatePresence>` tanpa alasan yang sangat jelas. Pastikan `key` pada *motion div* selalu unik untuk memicu animasi yang benar.
4. **Data JSON:** Jika menambah fitur baru di *Admin Panel* (contoh: menambah opsi jenis soal baru), pastikan antarmuka di `view/[id]/page.tsx` juga diperbarui untuk merender bentuk komponen yang sesuai dengan data baru tersebut.

**Akhir Dokumen.**
