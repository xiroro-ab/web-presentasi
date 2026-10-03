import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { context, customApiKey, customModel } = body;

    if (!context) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    // Gunakan custom API key jika ada, jika tidak gunakan dari server (env)
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key tidak ditemukan. Silakan masukkan API Key Anda.' }, { status: 400 });
    }

    // Gunakan custom model jika ada, jika tidak default ke gemini-1.5-flash
    const modelName = customModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const systemPrompt = `
      Anda adalah pembuat soal kuis Kahoot profesional.
      Tugas Anda adalah membaca materi presentasi yang diberikan, lalu membuat 3-5 pertanyaan pilihan ganda yang menarik, edukatif, dan menguji pemahaman audiens terhadap materi tersebut.
      
      Struktur yang HARUS Anda kembalikan adalah format JSON MURNI (tanpa markdown \`\`\`json) berupa array objek slide kuis, dengan skema berikut:
      [
        {
          "id": "q1", // biarkan ID unik sembarang
          "title": "Kuis: [Topik Pertanyaan]",
          "content": "Pertanyaan Kuis", // opsional, biarkan kosong atau isi deskripsi singkat
          "isQuiz": true,
          "quizQuestion": "Tuliskan pertanyaan kuis secara lengkap di sini.",
          "quizOptionA": "Pilihan A",
          "quizOptionB": "Pilihan B",
          "quizOptionC": "Pilihan C",
          "quizOptionD": "Pilihan D",
          "quizCorrectAnswer": "A", // WAJIB salah satu dari: "A", "B", "C", atau "D"
          "quizTimer": 20 // Waktu menjawab dalam detik (default 20 atau 30)
        }
      ]

      PERATURAN PENTING:
      1. Hasil HARUS BERUPA ARRAY JSON MURNI. Anda Boleh membungkusnya dalam markdown \`\`\`json.
      2. Buat tepat 3 hingga 5 pertanyaan kuis berdasarkan materi.
      3. Kunci jawaban (quizCorrectAnswer) HARUS benar dan sesuai materi, gunakan HANYA huruf "A", "B", "C", atau "D".
      4. Gunakan bahasa Indonesia yang baik dan benar.
      5. Jangan tambahkan penjelasan apapun di luar JSON.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nMateri Presentasi:\n${context}` }] }],
      generationConfig: {
        temperature: 0.7
      }
    });

    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let slides = [];
    try {
      slides = JSON.parse(text);
      if (!Array.isArray(slides)) {
        throw new Error("Format balasan AI bukan Array");
      }
    } catch (parseError) {
      console.error("Gagal parse JSON dari AI:", text);
      return NextResponse.json({ error: 'AI mengembalikan format yang tidak valid. Coba lagi.' }, { status: 500 });
    }

    return NextResponse.json({ slides });
  } catch (error: any) {
    console.error("AI Generate Quiz Error:", error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat memproses AI.' }, { status: 500 });
  }
}
