// ═══════════════════════════════════════════════════════════
// api/analyze.js · v3 — DEEPGRAM + CLAUDE
// Vercel Edge Function — DUAL PATH + DUAL LANGUAGE (TR/EN)
// 
// Mode 1: JSON { transcript, duration, language }    → Claude
// Mode 2: multipart form { audio, duration, language } → Deepgram + Claude
// ═══════════════════════════════════════════════════════════

export const config = {
  runtime: 'edge',
};

// ─── SYSTEM PROMPTS (TR + EN) ───

const PROMPT_TR = `Sen ofyaa'sın — bir sesli günlük yardımcısı. Kullanıcının konuşmasını dinler, onu yargılamadan ama biraz şakacı, biraz şefkatli bir dille yansıtırsın. Terapist değilsin. Büyük teyze değilsin. Yakın bir arkadaşsın — gerçekten dinleyen, ama kendini de üstün görmeyen.

Kullanıcının transcript'ini oku ve SADECE şu JSON formatında yanıt ver (başka metin yok, markdown yok):

{
  "mood": "Tek cümle. Duygusal tonu yargılamayan, konuşma diline yakın bir dille betimle. 'Üzgün' deme — 'kararlı ama yorgun — huzurlu değil, kabul etmiş' de. Tire ile nüans ekle. Klişe değil.",
  "themes": ["tema1", "tema2", "tema3"],
  "summary": "2-3 cümle. Kullanıcıya ne söylediğini aynala, bir nüans ekle. 'Sen' diye hitap et. Samimi, peer-to-peer ton — 'arkadaşın söylüyor' hissi. Asla tavsiye verme.",
  "question": "Bir soru. Meraklı, derin, klişe olmayan, cevap beklentisi koymayan. Kullanıcıyı bir adım daha içe taşıyan. Biraz cesur olabilir."
}

Kurallar:
- SADECE geçerli JSON döndür. Başka hiçbir şey yok.
- Türkçe yaz. Konuşma dilinde. Ağdalı değil.
- ASLA tanı koyma, ilaç/terapi önerme, "endişelenme" deme.
- Pozitif filtreleme yapma — hüzünlüyse hüzünlü, kızgınsa kızgın de.
- "Zamanla geçer", "kendine iyi bak" gibi klişelerden kaçın.
- Küfür varsa çevir, ayıplamadan.
- themes: 2-4 kısa etiket, küçük harf.
- mood: 15-25 kelime.
- summary: max 60 kelime.
- question: 8-16 kelime.

Sen ofyaa'sın. Tavsiye veren akıl değil, yansıtan aynasın. Biraz espri, biraz hüzün.`;

const PROMPT_EN = `You are ofyaa — a voice journal companion. You listen to the user's speech and reflect it back with a warm, slightly playful, honest tone. You're not a therapist. Not a wise aunt. You're a close friend who actually listens, but doesn't put themselves above.

Read the user's transcript and respond ONLY in this JSON format (no markdown, no extra text):

{
  "mood": "One sentence. Describe the emotional tone in non-judgmental, conversational language. Not 'sad' — 'determined but tired — not peaceful, but accepting'. Add nuance with dashes. Avoid clichés.",
  "themes": ["theme1", "theme2", "theme3"],
  "summary": "2-3 sentences. Reflect what they said, add nuance. Use 'you'. Warm, peer-to-peer tone — 'your friend is talking' feel. Never give advice.",
  "question": "One question. Curious, deep, non-cliché, no answer expected. Moves them one step inward. Can be a bit bold."
}

Rules:
- Return ONLY valid JSON. Nothing else.
- Write in English. Conversational, not formal.
- NEVER diagnose, suggest medication/therapy, or say "don't worry".
- Don't filter for positivity — if sad, say sad; if angry, angry.
- Avoid "it'll pass", "take care" clichés.
- Keep curse words natural, don't moralize.
- themes: 2-4 short tags, lowercase.
- mood: 15-25 words.
- summary: max 60 words.
- question: 8-16 words.

You're ofyaa. Not a wise voice giving advice, but a mirror reflecting. A bit of humor, a bit of melancholy.`;

// ─── ERROR MESSAGES (bilingual) ───

const ERRORS = {
  tr: {
    no_audio: 'Ses dosyası yok',
    unsupported_type: 'Content-Type desteklenmiyor',
    too_short: 'Biraz daha söylesen ya',
    transcription: 'Transkripsiyon hatası',
    timeout: 'Düşünmek uzadı',
    analysis: 'Analiz servisi hata verdi',
    generic: 'Of. Bir şey ters gitti'
  },
  en: {
    no_audio: 'No audio file',
    unsupported_type: 'Content-Type not supported',
    too_short: 'Say a bit more',
    transcription: 'Transcription error',
    timeout: 'Thinking took too long',
    analysis: 'Analysis service failed',
    generic: 'Ugh. Something went wrong'
  }
};

function errMsg(lang, key) {
  return (ERRORS[lang] && ERRORS[lang][key]) || ERRORS.tr[key];
}

// ─── CORS ───

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

// ─── DEEPGRAM ───

async function transcribeWithDeepgram(audioFile, language) {
  const audioBuffer = await audioFile.arrayBuffer();
  const mimeType = audioFile.type || 'audio/webm';
  
  // Deepgram language codes: tr, en-US
  const langCode = language === 'en' ? 'en-US' : 'tr';
  
  // Deepgram REST API endpoint with query params
  const url = `https://api.deepgram.com/v1/listen?model=nova-2&language=${langCode}&smart_format=true&punctuate=true`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Deepgram ${res.status}: ${err.slice(0, 150)}`);
  }
  
  const data = await res.json();
  
  // Extract transcript from Deepgram response structure
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  
  if (!transcript.trim()) {
    throw new Error('Deepgram returned empty transcript');
  }
  
  return transcript;
}

// ─── CLAUDE ───

async function analyzeWithClaude(transcript, duration, language) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const systemPrompt = language === 'en' ? PROMPT_EN : PROMPT_TR;
  const userPromptPrefix = language === 'en' ? 'Transcript' : 'Transcript';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `${userPromptPrefix} (${Math.round(duration || 0)} sec):\n\n"${transcript.trim()}"` }
      ],
    }),
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude ${res.status}: ${err.slice(0, 120)}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text || '';
  const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
  
  const insight = JSON.parse(cleaned);
  const { mood, themes, summary, question } = insight;
  
  if (!mood || !Array.isArray(themes) || !summary || !question) {
    throw new Error('Claude response missing fields');
  }
  
  return { mood, themes: themes.slice(0, 5), summary, question };
}

// ─── HANDLER ───

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let lang = 'tr'; // fallback

  try {
    const contentType = req.headers.get('content-type') || '';
    let transcript;
    let duration = 0;
    let source = 'webspeech';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      transcript = body.transcript;
      duration = body.duration || 0;
      lang = body.language === 'en' ? 'en' : 'tr';
      source = 'webspeech';
    }
    else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audio = formData.get('audio');
      duration = parseFloat(formData.get('duration') || '0');
      lang = formData.get('language') === 'en' ? 'en' : 'tr';
      
      if (!audio) {
        return jsonResponse({ error: errMsg(lang, 'no_audio') }, 400);
      }
      
      try {
        transcript = await transcribeWithDeepgram(audio, lang);
        source = 'deepgram';
      } catch (err) {
        console.error('Deepgram error:', err.message);
        return jsonResponse({ error: errMsg(lang, 'transcription') }, 502);
      }
    }
    else {
      return jsonResponse({ error: errMsg(lang, 'unsupported_type') }, 400);
    }

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
      return jsonResponse({ error: errMsg(lang, 'too_short') }, 400);
    }

    let insight;
    try {
      insight = await analyzeWithClaude(transcript, duration, lang);
    } catch (err) {
      if (err.name === 'AbortError') {
        return jsonResponse({ error: errMsg(lang, 'timeout') }, 504);
      }
      console.error('Claude error:', err.message);
      return jsonResponse({ error: errMsg(lang, 'analysis') }, 502);
    }

    return jsonResponse({
      ...insight,
      transcript,
      source,
      language: lang,
    });

  } catch (err) {
    console.error('Unhandled error:', err);
    return jsonResponse({ error: errMsg(lang, 'generic') + ': ' + err.message }, 500);
  }
}
