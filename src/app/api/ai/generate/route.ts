import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, customApiKey, customModel } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
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
      Anda adalah asisten pembuat materi presentasi profesional.
      Tugas Anda adalah membuat struktur presentasi lengkap berdasarkan topik yang diberikan.
      
      Struktur yang HARUS Anda kembalikan adalah format JSON MURNI (tanpa markdown \`\`\`json) dengan skema berikut:
      {
        "chapters": [
          {
            "id": "c1", // ID unik berurutan c1, c2, c3
            "title": "Judul Bab",
            "subtitle": "Subjudul opsional",
            "slides": [
              {
                "id": "s1", // ID unik berurutan s1, s2, s3 (jangan reset per chapter)
                "title": "Judul Slide",
                "content": "Konten HTML. Gunakan tag <p>, <ul>, <li>, <strong>, <em> untuk format. Jangan berlebihan, buat agar enak dibaca saat presentasi.",
                "image": "URL_GAMBAR" // Opsional. Jika slide butuh ilustrasi, buat URL seperti ini: https://image.pollinations.ai/prompt/{kata_kunci_gambar_berbahasa_inggris_dipisahkan_dengan_spasi}?width=1200&height=800&nologo=true
              }
            ]
          }
        ]
      }

      PERATURAN PENTING:
      1. Hasil HARUS BERUPA OBJEK JSON MURNI. Jangan tambahkan teks apapun sebelum atau sesudah JSON. Jangan gunakan blockquote markdown.
      2. Buat materi selengkap mungkin, 3-5 chapter, masing-masing 3-6 slide.
      3. Gunakan bahasa Indonesia yang baik, benar, dan edukatif (kecuali topik meminta bahasa lain).
      4. Untuk properti "image", JIKA materi slide tersebut sangat terbantu dengan gambar, hasilkan prompt bahasa Inggris yang deskriptif untuk gambar tersebut dan format menjadi URL pollinations.ai (misal: https://image.pollinations.ai/prompt/astronaut%20walking%20on%20mars?width=1200&height=800&nologo=true). Biarkan kosong/undefined jika tidak butuh gambar.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nTopik/Permintaan User: ${prompt}` }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      // Jika masih ada sisa markdown meski sudah diset responseMimeType
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal generate materi dari AI' }, { status: 500 });
  }
}
