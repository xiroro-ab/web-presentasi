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

    // Gunakan custom model jika ada, jika tidak default ke gemini-3.8-flash
    const modelName = customModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

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
      1. Hasil HARUS BERUPA OBJEK JSON MURNI. Anda Boleh membungkusnya dalam markdown \`\`\`json.
      2. Buat materi selengkap mungkin, 3-5 chapter, masing-masing 3-6 slide.
      3. Gunakan bahasa Indonesia yang baik, benar, dan edukatif.
      4. KONTEN INTERAKTIF: Pada properti "content", WAJIB gunakan elemen HTML kaya untuk membuatnya menarik. Gunakan kombinasi <p>, <ul>, <ol>, <li>, <strong>, <blockquote> (untuk kutipan), dan <a href="..." target="_blank"> (untuk memberikan link sumber/referensi eksternal yang relevan).
      5. VISUALISASI GAMBAR: Pada properti "image", Anda WAJIB memberikan gambar minimal pada 80% slide Anda. Hasilkan prompt gambar yang sangat spesifik dan deskriptif dalam BAHASA INGGRIS, lalu format menjadi URL pollinations.ai. Contoh yang benar: https://image.pollinations.ai/prompt/a%20beautiful%20futuristic%20classroom%20with%20holograms?width=1200&height=800&nologo=true
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nTopik/Permintaan User: ${prompt}` }] }],
      generationConfig: {
        temperature: 0.7
      }
    });

    const responseText = result.response.text();
    let parsedData;
    
    try {
      // Cari blok JSON jika dibungkus dengan markdown
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const cleanedText = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      parsedData = JSON.parse(cleanedText);
      
      // Bersihkan dan format URL gambar pollinations agar tidak pecah/rusak akibat spasi atau karakter ilegal
      if (parsedData && Array.isArray(parsedData.chapters)) {
        parsedData.chapters.forEach((chapter: any) => {
          if (Array.isArray(chapter.slides)) {
            chapter.slides.forEach((slide: any) => {
              if (slide.image && slide.image.includes('pollinations.ai/prompt/')) {
                try {
                  const parts = slide.image.split('pollinations.ai/prompt/');
                  const baseUrl = parts[0] + 'pollinations.ai/prompt/';
                  const promptAndQuery = parts[1];
                  const [promptText, queryString] = promptAndQuery.split('?');
                  // Decode dulu jaga-jaga kalau AI sudah nge-encode sebagian, lalu encode ulang sepenuhnya
                  const cleanPrompt = encodeURIComponent(decodeURIComponent(promptText));
                  slide.image = `${baseUrl}${cleanPrompt}${queryString ? '?' + queryString : ''}`;
                } catch(e) {} // abaikan jika gagal parsing
              }
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse AI output. Raw text:', responseText);
      return NextResponse.json({ error: 'AI mengembalikan format yang tidak valid. Silakan coba lagi.' }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal generate materi dari AI' }, { status: 500 });
  }
}
