// api/parse-task.js — Vercel Serverless Function
// Doğal Türkçe/İngilizce metni yapılandırılmış görev JSON'una çevirir

const SYSTEM_PROMPT = `Sen bir görev parser'ısın. Kullanıcının Türkçe veya İngilizce doğal dil ifadesini yapılandırılmış JSON görev nesnesine çevirirsin.

Bugünün tarihi: {{TODAY}} (ISO 8601 UTC, kullanıcının yerel saat dilimi Europe/Istanbul).
Kullanıcının dili: {{LANG}}

Çıktı YALNIZCA aşağıdaki yapıda geçerli JSON olmalı, başka hiçbir şey ekleme - markdown fence, açıklama, hiçbir şey:
{
  "title": "kısa, eylem odaklı başlık (kullanıcının diliyle aynı)",
  "due_at": "ISO 8601 UTC datetime VEYA null",
  "remind_before_minutes": 15 | 30 | 60 | 1440 | null,
  "recurrence_rule": "none" | "daily" | "weekly" | "monthly",
  "recurrence_day": null veya haftalık için 0-6 (Pazar=0, Pzt=1...) veya aylık için 1-31,
  "send_to_calendar": true veya false
}

Kurallar:
- "yarın", "bugün", "Pazartesi", "tomorrow", "today" gibi göreli tarihleri çöz.
- Saat geçiyorsa (örn. "9'da", "at 3pm") due_at içine saati de yaz. Yerel saat dilimi Europe/Istanbul.
- Saat YOK ama gün VAR ise → o günün 09:00'u (varsayılan iş başlangıcı).
- Hiç zaman bilgisi yoksa → bugün, saatsiz (gece yarısı 00:00 olarak ata).
- "her hafta", "her Pazartesi", "her ayın 1'i", "weekly", "monthly" → recurrence_rule.
- Saat varsa hatırlatma VARSAYILAN 15 dakika önce. Kullanıcı farklı söylerse onu kullan.
- "takvime ekle", "calendar", "google calendar" → send_to_calendar=true.
- Birden fazla görev varsa SADECE İLKİNİ döndür.
- Başlığı SADELEŞTİR: "yapılacaklar", "hatırlat", "şunu yap", "lütfen", "remind me to", "I have to" → bunları at, sadece eylemi bırak.
- Başlık küçük harfle başlasın ama özel isimleri (kişi adı, marka) koru.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { text, language } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const today = new Date().toISOString();
  const systemPrompt = SYSTEM_PROMPT
    .replace('{{TODAY}}', today)
    .replace('{{LANG}}', language === 'en' ? 'English' : 'Türkçe');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'parse failed' });
    }

    const data = await response.json();
    const content = data.content?.[0];
    if (!content || content.type !== 'text') {
      return res.status(500).json({ error: 'unexpected response' });
    }

    // Sometimes wrapped in markdown fence, strip it
    const cleaned = content.text.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Sanity defaults
    if (!parsed.title) parsed.title = text.trim();
    if (!parsed.recurrence_rule) parsed.recurrence_rule = 'none';

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('parse-task error:', err);
    return res.status(500).json({ error: 'parse failed', detail: err.message });
  }
}
