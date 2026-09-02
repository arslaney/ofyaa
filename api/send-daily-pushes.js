// api/send-daily-pushes.js
// Üç tip bildirim gönderir:
// 1. SABAH 09:00 — herkes için: "X tarihsiz işin var" + bugün için tarihli işler
// 2. DAY BEFORE — yarın için tarihli görevler: "Yarın saat 14:00 X" (tekil)
// 3. SAATLİ — günlük cron sabah çalıştığı için saat bazlı reminderlar BURADA verilmiyor.
//
// Cron şu an günde 1 kez. Saatli bildirim isteniyorsa cron'u "0 * * * *" yapıp
// her saat başı bu endpoint'i tetiklemek gerek. Şimdilik sabah modu yeterli.

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const hasSecret = auth === `Bearer ${process.env.CRON_SECRET}` ||
                    req.query.secret === process.env.CRON_SECRET;
  if (!isVercelCron && !hasSecret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:arslaney@gmail.com';
  const supaUrl      = process.env.SUPABASE_URL;
  const supaService  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!vapidPublic || !vapidPrivate || !supaUrl || !supaService) {
    return res.status(500).json({ error: 'missing env vars',
      need: ['VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'] });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const supa = createClient(supaUrl, supaService, { auth: { persistSession: false } });

  // İstanbul saatine göre bugün/yarın hesapla
  const tzNow = new Date();
  const istNow = new Date(tzNow.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const todayStart = new Date(istNow); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(istNow); todayEnd.setHours(23,59,59,999);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd   = new Date(todayEnd);   tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  // Istanbul localtime to UTC offset
  const offsetMs = istNow.getTime() - tzNow.getTime();
  const toUtc = (d) => new Date(d.getTime() - offsetMs).toISOString();

  try {
    const { data: subs } = await supa.from('push_subscriptions').select('*');
    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, message: 'no subscriptions' });
    }

    const userIds = [...new Set(subs.map(s => s.user_id))];

    // Tüm aktif görevleri çek (tarihli + tarihsiz)
    const { data: tasks } = await supa.from('tasks')
      .select('id, user_id, title, due_at, reminded_day_before, reminded_day_of')
      .in('user_id', userIds)
      .eq('status', 'todo');

    const tasksByUser = {};
    for (const t of tasks || []) {
      (tasksByUser[t.user_id] ||= []).push(t);
    }

    let sent = 0, removed = 0, failed = 0;
    const updates = []; // toplu reminded_* flag update

    for (const sub of subs) {
      const userTasks = tasksByUser[sub.user_id] || [];
      const undated = userTasks.filter(t => !t.due_at);
      const dueToday = userTasks.filter(t => {
        if (!t.due_at) return false;
        const d = new Date(t.due_at);
        return d >= todayStart && d <= todayEnd;
      });
      const dueTomorrow = userTasks.filter(t => {
        if (!t.due_at) return false;
        const d = new Date(t.due_at);
        return d >= tomorrowStart && d <= tomorrowEnd;
      });

      // Bildirim mesajı kur
      const lines = [];
      const remindIds = { day_of: [], day_before: [] };

      // Bugün için tarihli görevler — "day_of" reminder
      for (const t of dueToday) {
        if (t.reminded_day_of) continue;
        const d = new Date(t.due_at);
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        const timeStr = (hh === '09' && mm === '00') ? '' : `${hh}:${mm} `;
        lines.push(`${timeStr}${t.title}`);
        remindIds.day_of.push(t.id);
      }

      // Yarın için tarihli görevler — "day_before" reminder
      for (const t of dueTomorrow) {
        if (t.reminded_day_before) continue;
        const d = new Date(t.due_at);
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        const timeStr = (hh === '09' && mm === '00') ? '' : ` ${hh}:${mm}`;
        lines.push(`yarın${timeStr} ${t.title}`);
        remindIds.day_before.push(t.id);
      }

      // Tarihsiz toplam
      const undatedCount = undated.length;
      if (undatedCount > 0 && lines.length === 0) {
        lines.push(undatedCount === 1 ? '1 yapılacak işin var' : `${undatedCount} yapılacak işin var`);
      } else if (undatedCount > 0) {
        lines.push(undatedCount === 1 ? '+ 1 tarihsiz iş' : `+ ${undatedCount} tarihsiz iş`);
      }

      if (lines.length === 0) continue; // Bildirim verilecek bir şey yok

      const title = 'ofyaa';
      const body = lines.slice(0, 4).join('\n') + (lines.length > 4 ? `\n+${lines.length - 4} daha` : '');

      const payload = JSON.stringify({ title, body, url: '/app/' });
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      try {
        await webpush.sendNotification(pushSub, payload, { TTL: 60 * 60 * 12 });
        sent++;

        // Reminder flag'leri update et — aynı görev için bir daha gönderme
        for (const id of remindIds.day_of) {
          updates.push({ id, reminded_day_of: true });
        }
        for (const id of remindIds.day_before) {
          updates.push({ id, reminded_day_before: true });
        }
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await supa.from('push_subscriptions').delete().eq('id', sub.id);
          removed++;
        } else {
          failed++;
          console.error('push send failed:', e.statusCode, e.body);
        }
      }
    }

    // Flag update'leri uygula (her görev için tekil update — küçük sayılarda yeterli)
    for (const u of updates) {
      const patch = {};
      if (u.reminded_day_of !== undefined) patch.reminded_day_of = u.reminded_day_of;
      if (u.reminded_day_before !== undefined) patch.reminded_day_before = u.reminded_day_before;
      await supa.from('tasks').update(patch).eq('id', u.id);
    }

    return res.status(200).json({ sent, removed, failed, total: subs.length, flagged: updates.length });
  } catch (e) {
    console.error('cron error:', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
