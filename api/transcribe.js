// api/transcribe.js
// Tarayıcıdan gelen ses kaydını (audio/webm veya audio/ogg veya audio/mp4)
// Deepgram'a yollar, transcript döner.
// Edge runtime — hızlı, küçük.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY missing' }), { status: 500 });
  }

  // Body — direkt binary audio
  const audioBuffer = await req.arrayBuffer();
  if (!audioBuffer || audioBuffer.byteLength < 500) {
    return new Response(JSON.stringify({ error: 'audio too short or empty' }), { status: 400 });
  }
  if (audioBuffer.byteLength > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'audio too large' }), { status: 413 });
  }

  // Query params — dil ve content-type
  const url = new URL(req.url);
  const lang = url.searchParams.get('lang') || 'tr';
  const dgLang = lang === 'en' ? 'en' : 'tr';
  const contentType = req.headers.get('content-type') || 'audio/webm';

  // Deepgram nova-3 modeli Türkçeyi destekler, yapamıyorsa nova-2'ye düş
  const dgUrl = `https://api.deepgram.com/v1/listen?model=nova-2&language=${dgLang}&smart_format=true&punctuate=true`;

  try {
    const dgResp = await fetch(dgUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': contentType
      },
      body: audioBuffer
    });

    if (!dgResp.ok) {
      const errText = await dgResp.text();
      console.error('deepgram error', dgResp.status, errText);
      return new Response(JSON.stringify({
        error: 'transcription service error',
        status: dgResp.status,
        detail: errText.slice(0, 200)
      }), { status: 502 });
    }

    const data = await dgResp.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return new Response(JSON.stringify({
      transcript: transcript.trim(),
      confidence,
      lang: dgLang
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('transcribe fatal', e);
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 500 });
  }
}
