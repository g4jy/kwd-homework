/* sw-teacher.js — T120b 선생님 화면 설치용. 범위 = teacher.html 하나(학생 sw.js 와 자리·저장본 이름이 겹치지 않음).
 * 같은 사이트 화면 파일만 인터넷 먼저, 망이 안 되거나 8초 멈추면 저장본. 서버(Apps Script) 요청은 손대지 않음. 키는 주소 해시·이 브라우저 저장소에만 있고 저장본에 들어가지 않음. */
var SHELL = 'kwd-teacher-v3', FILES = ['teacher.html', 'app.css', 'teacher-view.css', 'config.js', 'hangul.js', 'ui.js', 'charts.js', 'criteria.js', 'teacher.js', 'teacher-home.js', 'teacher-install.js', 'manifest-teacher.webmanifest', 'icon-teacher-192.png', 'icon-teacher-512.png', 'icon-teacher-180.png'];
self.addEventListener('install', function (e) { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).catch(function () {})); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('kwd-teacher-') === 0 && k !== SHELL; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  var name = u.pathname.split('/').pop();
  if (FILES.indexOf(name) < 0) return;
  e.respondWith(new Promise(function (ok) {
    var sent = false, give = function (x) { if (!sent) { sent = true; ok(x); } };
    var tm = setTimeout(function () { caches.match(name).then(function (m) { if (m) give(m); }); }, 8000);
    fetch(e.request).then(function (r) {
      clearTimeout(tm);
      if (r.ok) { var cp = r.clone(); caches.open(SHELL).then(function (c) { c.put(name, cp); }); }
      give(r);
    }).catch(function () { clearTimeout(tm); caches.match(name).then(function (m) { give(m || Response.error()); }); });
  }));
});
