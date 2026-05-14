// api/send-daily-pushes.js — Vercel cron handler
// Günde 1 kez çalışır. Pending görevi olan kullanıcılara web push yollar.
//
// vercel.json cron config bunu çağırır: 0 6 * * * (UTC) = 09:00 Istanbul.
// Vercel cron'ları otomatik olarak x-vercel-cron header'ı ile gelir.
// CRON_SECRET ile ek doğrulama yapıyoruz (manuel tetiklemelere karşı).

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Sadece GET ve POST kabul et
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  // Doğrulama — Vercel cron header'ı VEYA secret query/header
  const auth = req.headers.authorization || '';
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const hasSecret = auth === `Bearer ${process.env.CRON_SECRET}` ||
                    req.query.secret === process.env.CRON_SECRET;

  if (!isVercelCron && !hasSecret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Env var kontrolü
  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:arslaney@gmail.com';
  const supaUrl      = process.env.SUPABASE_URL;
  const supaService  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!vapidPublic || !vapidPrivate || !supaUrl || !supaService) {
    return res.status(500).json({ error: 'missing env vars', need: ['VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'] });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supa = createClient(supaUrl, supaService, {
    auth: { persistSession: false }
  });

  try {
    // Tüm push subscription'ları çek
    const { data: subs, error: subErr } = await supa.from('push_subscriptions').select('*');
    if (subErr) throw subErr;
    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, message: 'no subscriptions' });
    }

    // Kullanıcı bazında pending görev sayısı çıkar (tek sorguda)
    const userIds = [...new Set(subs.map(s => s.user_id))];
    const { data: tasks, error: tErr } = await supa.from('tasks')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'todo');
    if (tErr) throw tErr;

    const countByUser = {};
    for (const t of tasks || []) {
      countByUser[t.user_id] = (countByUser[t.user_id] || 0) + 1;
    }

    let sent = 0, removed = 0, failed = 0;

    for (const sub of subs) {
      const n = countByUser[sub.user_id] || 0;
      if (n === 0) continue; // pending yoksa sessiz

      const payload = JSON.stringify({
        title: 'ofyaa',
        body: n === 1 ? '1 yapılacak işin var' : `${n} yapılacak işin var`,
        url: '/'
      });

      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, payload, { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Subscription geçersiz, sil
          await supa.from('push_subscriptions').delete().eq('id', sub.id);
          removed++;
        } else {
          failed++;
          console.error('push send failed:', e.statusCode, e.body);
        }
      }
    }

    return res.status(200).json({ sent, removed, failed, total: subs.length });
  } catch (e) {
    console.error('cron error:', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
