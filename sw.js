/* sw.js — 앱 푸시 받기 (PWA). 받으면 Apps Script 에 'delivered', 누르면 학생 화면 열기(→ 'opened' 는 학생 화면이 기록) */
var CFG = { key: null, api: null };
// 10/20 홈 화면 앱: 오프라인 껍데기 — 같은 사이트 화면 파일만, 인터넷 먼저(늘 최신) · 안 되면 저장본. 서버(Apps Script) 요청은 손대지 않음
var SHELL = 'kwd-shell-v1', SHELL_FILES = ['student.html', 'app.css', 'config.js', 'hangul.js', 'pron.js', 'ui.js', 'student.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(SHELL_FILES); }).catch(function () {})); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('kwd-shell-') === 0 && k !== SHELL; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;   // 서버(Apps Script)·다른 곳은 그대로
  var name = u.pathname.split('/').pop();
  if (SHELL_FILES.indexOf(name) < 0) return;   // 화면 파일만 (주소 뒤 ?k= 같은 것은 저장 이름에 안 넣음 — 학생 키가 캐시에 남지 않게)
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok) { var cp = r.clone(); caches.open(SHELL).then(function (c) { c.put(name, cp); }); }
    return r;
  }).catch(function () { return caches.match(name).then(function (m) { return m || Response.error(); }); }));
});
self.addEventListener('message', function (e) { if (e.data && e.data.type === 'key') { CFG.key = e.data.key; CFG.api = e.data.api; } });
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Korean with Dongjae', body: e.data && e.data.text() }; }
  var key = d.k || CFG.key, api = d.api || CFG.api;
  var report = key && api && d.n ? fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'student.notif', key: key, notif_id: d.n, event: 'delivered' }) }).catch(function () {}) : Promise.resolve();
  e.waitUntil(Promise.all([report, self.registration.showNotification(d.title || 'Korean with Dongjae', {
    body: d.body || 'Today’s Korean is ready.', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'kwd-today',
    actions: [{ action: 'busy', title: 'Too busy today 😭' }],   // 한 번 누르면 오늘은 쉬는 날 (연속 기록 유지)
    data: { url: d.url || './student.html', k: key, n: d.n, api: api } })]));
});
/** '오늘 너무 바빠요' 버튼: 앱을 열지 않고 바로 쉬는 날로. 서버 주소를 모르면 화면을 열어서 처리(&busy=1) */
function skipToday(data) {
  var url = (data.url || './student.html') + ((data.url || '').indexOf('?') >= 0 ? '&' : '?') + 'busy=1';
  if (!data.k || !data.api) return self.clients.openWindow(url);
  return fetch(data.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'student.skip', key: data.k, n: data.n, reason: 'busy' }) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j.ok) throw new Error(j.error);
      return self.registration.showNotification('Rest today 😴', { body: 'No homework today — your streak is safe. See you tomorrow! 내일 만나요', icon: 'icon-192.png', tag: 'kwd-today', data: { url: data.url } });
    })
    .catch(function () { return self.clients.openWindow(url); });
}
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  if (e.action === 'busy') { e.waitUntil(skipToday(e.notification.data || {})); return; }
  var url = (e.notification.data && e.notification.data.url) || './student.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) { cs[i].navigate(url); return cs[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
