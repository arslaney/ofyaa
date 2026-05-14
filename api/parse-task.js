// api/parse-task.js
// Claude'a metni gönder, sadece (title, due_at) çıkar. Tarih yoksa null döner.

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT_TR = `Sen ofyaa için tarih-tanıma yardımcısısın. Kullanıcının yazdığı görev metnini oku, içinde bir tarih/saat varsa çıkar.

Yanıtın SADECE şu JSON formatında olsun, markdown yok, başka açıklama yok:

{
  "title": "kısa görev başlığı (max 80 karakter, tarih kısmını çıkar)",
  "due_at": "ISO 8601 datetime VEYA null",
  "has_time": true/false
}

Kurallar:
- Tarih yoksa veya belirsizse → due_at: null
- "yarın", "perşembe", "10 aralık" gibi tarihler → çıkar
- "saat 15", "akşam 7", "19:00" gibi saatler → has_time: true
- Sadece tarih varsa (saat yok) → has_time: false, due_at o günün 09:00'u olsun
- Geçmişte kalan tarih varsa → bir sonraki uyan tarihi al
- title alanından tarih/saat ifadelerini ÇIKAR
- Asla başka alan ekleme
- Türkçe: "sabah" = 09:00, "öğle" = 12:00, "akşam" = 19:00, "gece" = 22:00`;

const SYSTEM_PROMPT_EN = `You are ofyaa's date-extraction helper. Read the user's task text and extract a date/time if mentioned.

Respond ONLY with this JSON format, no markdown:

{
  "title": "short task title (max 80 chars, strip date parts)",
  "due_at": "ISO 8601 datetime OR null",
  "has_time": true/false
}

Rules:
- No date or ambiguous → due_at: null
- "tomorrow", "Thursday", "Dec 10" → extract
- "at 3pm", "19:00" → has_time: true
- Date only → has_time: false, due_at = day's 09:00
- Past date → next matching date
- Strip date/time from title
- "morning" = 09:00, "noon" = 12:00, "evening" = 19:00, "night" = 22:00`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 }); }

  const { text, language, now_iso, timezone } = body || {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'text required' }), { status: 400 });
  }
  if (text.length > 500) {
    return new Response(JSON.stringify({ error: 'text too long' }), { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = { title: text.slice(0, 80), due_at: null, has_time: false };

  if (!apiKey) {
    return new Response(JSON.stringify(fallback), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  const lang = (language === 'en') ? 'en' : 'tr';
  const systemPrompt = lang === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN;

  const userContext = `${lang === 'tr' ? 'Şu an' : 'Now'}: ${now_iso || new Date().toISOString()} (${timezone || 'Europe/Istanbul'})

${lang === 'tr' ? 'Görev metni' : 'Task text'}: "${text.trim()}"`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContext }]
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('claude api error', resp.status, err);
      return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const raw = data?.content?.[0]?.text || '';

    let parsed = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (e) { console.error('parse fail', e, raw); }

    if (!parsed || !parsed.title) {
      return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const result = {
      title: String(parsed.title).slice(0, 200).trim(),
      due_at: parsed.due_at && !isNaN(Date.parse(parsed.due_at)) ? parsed.due_at : null,
      has_time: !!parsed.has_time
    };

    return new Response(JSON.stringify(result), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('parse-task fatal', e);
    return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
