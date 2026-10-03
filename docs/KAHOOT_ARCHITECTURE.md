# Dokumentasi Arsitektur Web Presentasi & Kahoot Mode

Dokumentasi ini ditulis untuk memberikan pemahaman menyeluruh mengenai struktur program, sistem *database*, dan alur kerja (terutama pada fitur interaktif bergaya Kahoot) dari Web Presentasi ini. Jika di masa depan ada *AI Agent* atau *Developer* yang ingin menambahkan fitur baru, baca panduan ini terlebih dahulu.

---

## 1. Tech Stack Utama
- **Framework:** Next.js 14+ (App Router) dengan TypeScript.
- **Styling:** Inline styles, Tailwind CSS (opsional jika dikonfigurasi), atau CSS kustom (terpusat).
- **Animasi:** `framer-motion` (sangat krusial untuk transisi *micro-interactions* dan slide yang mulus).
- **Database & Real-time:** Supabase.
- **Komunikasi Host-Client:** Mengandalkan **Supabase Realtime** (bukan melalui polling API/Database) dengan sistem *Channel*, *Presence*, dan *Broadcast*.

---

## 2. Struktur Aplikasi (App Router)

### A. Admin Panel (`/src/app/admin/page.tsx`)
Tempat guru/pemateri mengatur presentasi.
- **Fitur Kuis Kahoot:** Setiap *chapter* bisa diaktifkan sebagai mode kuis. Di dalamnya, setiap slide individu bisa dicentang sebagai "Kuis Interaktif".
- **Data Kuis:** Menyimpan judul soal, opsi A/B/C/D, kunci jawaban yang benar (contoh: "A"), dan pengatur waktu kuis (misal: 20 detik).

### B. Proyektor / Presenter (`/src/app/view/[id]/KahootPresenter.tsx`)
Aplikasi layar besar yang ditampilkan di proyektor. Komponen ini **adalah Otak Utama (Single Source of Truth)** dari seluruh siklus game Kahoot. Segala penentuan skor, status game, dan waktu dilakukan dari sini.

### C. HP Siswa / Player (`/src/app/kahoot/[roomId]/page.tsx`)
Aplikasi tipis (*dumb client*) yang dibuka oleh siswa via scan barcode.
Tugasnya hanya 2:
1. Mengikuti instruksi tampilan (*Lobby, Reading, Answering, Result*) dari Proyektor.
2. Mengirimkan jawaban (A, B, C, D) ke Proyektor.

---

## 3. Sistem Database & Supabase Realtime

Berbeda dengan aplikasi *CRUD* biasa, Kahoot Mode **tidak menyimpan jawaban siswa atau skor mereka secara permanen di dalam tabel SQL Supabase**. 

Semua komunikasi terjadi secara **Volatile (sementara) dan Real-time** melalui memori server Supabase (WebSocket) untuk kecepatan maksimal:
1. **Supabase Channel:** Setiap ruang kuis membuat jalur khusus: `kahoot-{presentationId}_{chapter.id}`.
2. **Presence (Kehadiran):** Melacak siapa saja yang sedang *online*. HP siswa melacak identitas mereka via ID acak.
3. **Broadcast (Pesan Kilat):** Mengirim pesan bolak-balik tanpa masuk ke tabel *database*. 
   - Proyektor (Host) mem- *broadcast*: `state_change` (berubah babak), `reset_game`.
   - Siswa mem- *broadcast*: `request_state` (minta kondisi terbaru), `submit_answer` (mengirim jawaban).

---

## 4. Alur Kerja State Machine (Kahoot Mode)

Ada 6 fase status utama (`kahootState`) yang dikendalikan secara absolut oleh Proyektor:

1. **`lobby` (Ruang Tunggu):**
   - Menampilkan *Barcode*. Siswa mendaftar dan namanya muncul berjatuhan.
   - Proyektor menyinkronkan data pemain secara eksak (jika siswa *disconnect*, namanya langsung hilang).
2. **`reading` (Membaca Soal):**
   - Proyektor menampilkan teks soal besar-besar (bisa di-*scroll* atau mengecil otomatis menyesuaikan layar).
   - Di HP siswa, hanya muncul teks "Bersiaplah melihat ke layar".
3. **`answering` (Menjawab Soal):**
   - Proyektor menampilkan kotak jawaban A, B, C, D dengan *timer* mundur.
   - Di HP siswa, muncul 4 kotak warna. Jika diklik, mereka mengirim `submit_answer` dan layarnya terkunci (`hasAnswered = true`).
4. **`result` (Hasil Jawaban):**
   - Proyektor mengkalkulasi skor berdasarkan **rumus Kahoot**: `Math.round((1 - (waktuJawab / waktuMaks) / 2) * 1000)`. Jawaban benar mendapat poin minimal 500, maksimal 1000. Jawaban salah 0.
   - Proyektor mengirimkan data koreksi (`playerResults`) ke setiap HP siswa agar HP mereka masing-masing bisa memunculkan layar Hijau (Benar) atau Merah (Salah).
5. **`interim_leaderboard` (Klasemen Sementara):**
   - Proyektor menampilkan Top 5 poin tertinggi sementara antar soal.
6. **`podium` (Selesai/Juara):**
   - Proyektor menampilkan Juara 1, 2, 3 di tengah, lalu Juara Harapan (4-10) meluncur masuk dari sisi kiri dan kanan.
   - HP siswa mendapat perintah bahwa permainan usai.

---

## 5. Solusi Edge Cases & Bug Kritis (Penting!)

Fitur real-time sangat rentan terhadap putus jaringan (*disconnect*) dan siklus *render* di React. Berikut adalah *bug-bug* yang pernah dipecahkan agar **jangan sampai terjadi/diubah lagi sembarangan**:

### A. Persistensi Sesi (Siswa Keluar lalu Masuk Lagi)
**Masalah:** HP siswa mati atau tertutup. Saat di-buka, mereka dianggap siswa baru (ID di-*hash* ulang) dan kehilangan skor.
**Solusi:** ID, Nama, dan Avatar siswa dikunci ke dalam `localStorage`. Jika *link* diakses lagi, HP siswa langsung melakukan *Auto-Reconnect* dengan ID lamanya (melewati layar daftar). Karena Proyektor melacak berdasarkan ID tersebut, skor mereka tidak akan hangus.

### B. Bug "Lobby Nyangkut" (Siswa Terjebak di Sesi Sebelumnya)
**Masalah:** Saat Host memulai kuis baru, siswa yang HP-nya tersangkut memori `localStorage` sebelumnya akan otomatis masuk dan menunggu selamanya.
**Solusi Lapis Ganda:**
1. Di layar *Lobby* siswa, terdapat tombol darurat **"Ganti Nama / Keluar"** untuk menghancurkan paksa memori `localStorage`.
2. Proyektor akan menembakkan sinyal sakti **`reset_game`** di momen pertama kali Proyektor diluncurkan (saat `SUBSCRIBED`). Sinyal ini menyuruh SEMUA HP SISWA yang nyangkut di *link* itu untuk membersihkan memori mereka dan mereload halaman secara serempak.

### C. Stale Closures pada Pengatur Waktu (Timer setInterval)
**Masalah:** *Bug* di mana jawaban 'A' selalu dinilai sebagai default, atau semua jawaban dianggap salah, atau *state* nyangkut di 'lobby'.
**Penyebab:** Di React, `setInterval` (seperti saat menghitung mundur waktu) sangat rawan menangkap variabel yang "kadaluarsa" dari awal render.
**Solusi:** DIlarang menggunakan *state* lokal secara langsung (seperti `kahootState` atau `activeSlideIndex` atau `currentAnswers`) di dalam blok *event listener* Supabase `.on()` ataupun `setInterval()`. **Selalu gunakan `useRef`** (`stateRef`, `slideIndexRef`, `answersRef`) agar blok yang sedang mengunci memori tetap bisa membaca nilai dunia-nyata yang paling terbaru. 

---

## 6. Pengembangan Fitur AI Selanjutnya

Jika AI ingin menambahkan mode baru (contoh: *Polling, Q&A, Essay*):
1. Tetap gunakan pola **Supabase Realtime Channel**.
2. Gunakan Proyektor (Host) sebagai pengalkulasi logika tunggal (*Single Source of Truth*).
3. Hati-hati dengan *Stale Closures*. Selalu bungkus *state* dinamis ke dalam `useRef` jika akan dieksekusi di dalam fungsi tertutup seperti `channel.on` atau `setTimeout`.
4. Ingat hukum Persistensi: Kelola `localStorage` di sisi *client* secara cerdas agar tidak menimbulkan bentrok identitas di ronde-ronde selanjutnya.

**Akhir Dokumen.**
