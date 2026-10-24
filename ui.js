/* ui.js — 학생·선생님 화면이 같이 쓰는 것: DOM 도우미, 서버 호출(+오프라인 대기열), 녹음기, 손글씨 판, 국기 */
(function () {
  'use strict';
  var U = {};
  U.el = function (tag, attrs) {
    var e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) { list.forEach(function (k) { if (k === null || k === undefined || k === false) return; if (Array.isArray(k)) add(k); else e.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k))); }); })(kids);
    return e;
  };
  U.btn = function (label, cls, onclick, attrs) { return U.el('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, attrs || {}), label); };
  /** T086 불러오는 중 (돌아가는 원 + 한 줄) */
  U.loading = function (msg) { return U.el('div', { class: 'loading', role: 'status' }, U.el('span', { class: 'spin', 'aria-hidden': 'true' }), U.el('div', {}, msg || '불러오는 중…')); };
  /** T086 선 아이콘(이모지 대신). 글자색을 따르고 화면 읽기는 건너뜀 */
  var ICONS = {
    bookmark: 'M6 3h12v18l-6-4-6 4z', cards: 'M8 4h12v14H8zM4 8v12h12', mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
    pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', chat: 'M4 5h16v11H9l-5 4z', lines: 'M4 7h16M4 12h10M4 17h13',
    book: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z',
    repeat: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4', bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
    clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2', calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5', chart: 'M4 20h16M7 17v-5M12 17V7M17 17v-8',
    flame: 'M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2.5 2 4 1-1.5 1-5 1-8z', snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9',
    speaker: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11', camera: 'M4 8h4l2-3h4l2 3h4v11H4zM12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 8.5h.01', help: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01'
  };
  U.icon = function (name) {
    return U.el('span', { class: 'ico', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + (ICONS[name] || '') + '"/></svg>' });
  };
  /** 짧은 알림. action = { label, fn } 이면 '되돌리기' 같은 버튼 하나 (조금 더 오래 보임) */
  U.toast = function (msg, ms, action) {
    document.querySelectorAll('.toast').forEach(function (x) { x.remove(); });
    var t = U.el('div', { class: 'toast', role: 'status' }, msg,
      action ? U.el('button', { class: 'linkbtn', type: 'button', 'data-act': 'toast-action', onclick: function () { t.remove(); action.fn(); } }, action.label) : null);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || (action ? 6000 : 2600));
  };
  U.store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  /** # 뒤 값 (서버로 안 가는 칸: 선생님 키 t, 미리 볼 세트 d) */
  U.hs = function (name) { var m = new RegExp('[#&]' + name + '=([^&]*)').exec(location.hash || ''); return m ? decodeURIComponent(m[1]) : null; };
  U.qs = function (name) { var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; };
  U.cid = function () { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
  U.fmtTime = function (iso, tz) {
    if (!iso) return '—';
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date(iso)).forEach(function (x) { p[x.type] = x.value; });
      return p.month + '/' + p.day + ' ' + p.hour + ':' + p.minute;
    } catch (e) { return iso.slice(5, 16).replace('T', ' '); }
  };
  U.fmtHM = function (iso, tz) {
    if (!iso) return '—';
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz || undefined, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)); } catch (e) { return iso.slice(11, 16); }
  };
  U.pct = function (x) { return x === null || x === undefined ? '—' : Math.round(x * 100) + '%'; };

  /* ---------- 국기: 이모지 국기가 안 나오는 PC(Windows)에서는 나라 코드만 ---------- */
  var flagOk = null;
  function flagSupported() {
    if (flagOk !== null) return flagOk;
    try {
      var c = document.createElement('canvas'); c.width = c.height = 20;
      var x = c.getContext('2d'); x.font = '16px sans-serif'; x.textBaseline = 'top'; x.fillText('🇩🇪', 0, 0);
      var d = x.getImageData(0, 0, 20, 20).data, colored = 0;
      for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && (Math.abs(d[i] - d[i + 1]) > 30 || Math.abs(d[i + 1] - d[i + 2]) > 30)) colored++;
      flagOk = colored > 10;
    } catch (e) { flagOk = false; }
    return flagOk;
  }
  U.flag = function (cc) {
    cc = String(cc || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return U.el('span', { class: 'flag' }, '—');
    var em = String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65);
    return U.el('span', { class: 'flag', title: cc }, flagSupported() ? U.el('span', { class: 'em', 'aria-hidden': 'true' }, em) : null, cc);
  };

  /* ---------- 서버 호출 ---------- */
  function NetError(msg) { this.message = msg; this.net = true; }
  NetError.prototype = Object.create(Error.prototype);
  U.call = function (action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    if (U.PREVIEW && U.PREVIEW_WRITES.indexOf(action) >= 0) { var pe = new Error('미리 보기 — 저장 안 함'); pe.server = true; pe.preview = true; return Promise.reject(pe); }
    if (body.key && !body.tz_client && !U.PREVIEW) { try { body.tz_client = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* 없음 */ } }   // 시간대 모르는 학생 → 서버가 한 번 저장
    if (window.DemoApi && window.DemoApi.enabled()) return window.DemoApi.call(body);
    return fetch(window.HW_CONFIG.API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new NetError('HTTP ' + r.status); return r.json(); }, function (e) { throw new NetError(e && e.message || 'network'); })
      .then(function (j) { if (!j.ok) { var err = new Error(j.error || 'error'); err.server = true; throw err; } return j.data; });
  };
  /** 오프라인 대기열: 제출을 먼저 저장, 연결되면 보냄. client_id 로 중복 방지 */
  /** 선생님 미리 보기 (student.html?k=…#preview): 보기만, 저장·열람 기록 안 함 */
  U.PREVIEW = /(^|[#&])preview\b/.test(location.hash || '');
  U.PREVIEW_WRITES = ['student.open', 'student.notif', 'student.step', 'student.skip', 'student.mark', 'student.consent', 'student.push_sub', 'student.device'];
  /** 이 기기에서 한국어를 어떻게 쓰나 (처음 열 때 학생이 고름): pad = 화면에 손글씨 · paper = 종이에 쓰고 사진 · type = 타자 */
  U.WRITE_MODES = { pad: 'On the screen', paper: 'On paper + photo', type: 'Typing' };
  U.writeMode = function () { var m = U.store.get('hw_write_mode', null); if (!U.WRITE_MODES[m]) m = U.store.get('hw_type_mode', false) ? 'type' : null; return m; };
  U.setWriteMode = function (m) { U.store.set('hw_write_mode', m); U.store.set('hw_type_mode', m === 'type'); };
  U.hasTouch = function () { try { return (navigator.maxTouchPoints || 0) > 0 || window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
  U.Outbox = function (name) {
    this.key = 'hw2_outbox_' + name; this.mem = U.store.get(this.key, []); this.busy = false; this.wait = 2000; this.listeners = [];
    var self = this;
    window.addEventListener('online', function () { self.flush(); });
    setInterval(function () { self.flush(); }, 15000);
  };
  U.Outbox.prototype.save = function () {
    if (!U.store.set(this.key, this.mem)) U.store.set(this.key, this.mem.filter(function (m) { return !m.payload.media; }));
    var n = this.mem.length; this.listeners.forEach(function (f) { f(n); });
  };
  U.Outbox.prototype.onChange = function (f) { this.listeners.push(f); };
  U.Outbox.prototype.send = function (action, payload) {
    var self = this;
    if (U.PREVIEW) { var pe = new Error('미리 보기 — 저장 안 함'); pe.server = true; pe.preview = true; return Promise.reject(pe); }
    payload.client_id = payload.client_id || U.cid();
    var item = { action: action, payload: payload, tries: 0 };
    this.mem.push(item); this.save();
    return new Promise(function (resolve, reject) { item.resolve = resolve; item.reject = reject; self.flush(); });
  };
  U.Outbox.prototype.flush = function () {
    var self = this;
    if (this.busy || !this.mem.length) return;
    this.busy = true;
    var item = this.mem[0];
    U.call(item.action, item.payload).then(function (res) {
      self.mem.shift(); self.busy = false; self.wait = 2000; self.save();
      if (item.resolve) item.resolve(res);
      self.flush();
    }, function (err) {
      self.busy = false;
      var transient = err.server && /^server: |lock|timed out|시간/i.test(String(err.message || ''));   // 서버가 바쁨(잠금 대기) → 다시 보냄. 잘못된 요청만 버림
      if (err.server && !transient) { self.mem.shift(); self.save(); if (item.reject) item.reject(err); self.flush(); return; }
      item.tries++; self.save();
      if (item.resolve && item.tries === 1) { item.resolve({ queued: true }); item.resolve = null; item.reject = null; }   // 화면은 '보낼 예정'으로
      self.wait = Math.min(self.wait * 2, 60000);
      setTimeout(function () { self.flush(); }, self.wait);
    });
  };
  U.blobToB64 = function (blob) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1]); }; fr.onerror = rej; fr.readAsDataURL(blob); });
  };
  U.b64Url = function (m) { return 'data:' + m.mime + ';base64,' + m.b64; };
  U.shrinkImage = function (file, maxPx) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, maxPx / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('image')); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { rej(new Error('image')); };
      img.src = url;
    });
  };

  /* ---------- 녹음기 (MediaRecorder). 마이크가 없으면 파일 올리기 ---------- */
  U.Recorder = function (maxSec, onTick) { this.max = maxSec || 60; this.onTick = onTick; };
  U.Recorder.prototype.start = function () {
    var self = this;
    if (!navigator.mediaDevices || !window.MediaRecorder) return Promise.reject(new Error('no recorder'));
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'], mime = '';
      for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) { mime = types[i]; break; }
      self.stream = stream; self.chunks = []; self.t0 = Date.now();
      self.rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      self.rec.ondataavailable = function (e) { if (e.data && e.data.size) self.chunks.push(e.data); };
      self.rec.start(250);
      self.timer = setInterval(function () { var s = (Date.now() - self.t0) / 1000; if (self.onTick) self.onTick(s); if (s >= self.max) self.stop(); }, 200);
    });
  };
  U.Recorder.prototype.stop = function () {
    var self = this;
    if (this.stopping) return this.stopping;
    clearInterval(this.timer);
    this.stopping = new Promise(function (res) {
      self.rec.onstop = function () {
        self.stream.getTracks().forEach(function (t) { t.stop(); });
        var type = (self.rec.mimeType || 'audio/webm').split(';')[0];
        res({ blob: new Blob(self.chunks, { type: type }), mime: type, sec: Math.round((Date.now() - self.t0) / 100) / 10 });
      };
      try { self.rec.stop(); } catch (e) { res(null); }
    });
    return this.stopping;
  };
  /** 녹음 위젯: [● 녹음] → [■ 멈춤 0:03] → 재생 + [다시] ; onReady(result|null) */
  U.recWidget = function (opts) {
    var box = U.el('div', { class: 'recbox' }), result = null, rec = null;
    function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
    function idle() {
      box.innerHTML = '';
      box.appendChild(U.btn([U.el('span', { 'aria-hidden': 'true' }, '●'), ' ', opts.label || 'Record'], 'rec', start, { 'data-act': 'rec' }));
      if (opts.hint) box.appendChild(U.el('span', { class: 'tiny' }, opts.hint));
    }
    function start() {
      rec = new U.Recorder(opts.max || 60, function (s) { var t = box.querySelector('.timer'); if (t) t.textContent = fmt(s); });
      rec.start().then(function () {
        box.innerHTML = '';
        box.appendChild(U.btn([U.el('span', { class: 'pulse' }), ' Stop'], 'rec', stop, { 'data-act': 'stop' }));
        box.appendChild(U.el('span', { class: 'timer' }, '0:00'));
      }, noMic);
    }
    function stop() { rec.stop().then(function (r) { result = r; done(); }); }
    function done() {
      box.innerHTML = '';
      var a = U.el('audio', { controls: true, src: URL.createObjectURL(result.blob) });
      box.appendChild(a);
      box.appendChild(U.btn('Re-record', 'ghost sm', function () { result = null; idle(); opts.onReady(null); }, { 'data-act': 'rerec' }));
      opts.onReady(result);
    }
    function noMic() {
      box.innerHTML = '';
      box.appendChild(U.el('span', { class: 'small' }, 'No microphone? Upload a voice memo instead: '));
      var f = U.el('input', { type: 'file', accept: 'audio/*', onchange: function () {
        var file = f.files && f.files[0]; if (!file) return;
        result = { blob: file, mime: file.type || 'audio/mp4', sec: 0 }; done();
      } });
      box.appendChild(f);
    }
    idle();
    return { node: box, result: function () { return result; } };
  };

  /* ---------- 사진 촬영: 화면 안에서 카메라로 바로 (폰·노트북 모두). 카메라를 못 쓰면 기기의 촬영 화면으로 ---------- */
  U.camera = function () {
    return new Promise(function (resolve) {
      function fallback() {   // getUserMedia 안 됨 → <input capture> (폰: 카메라 앱, PC: 파일 고르기)
        var inp = U.el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hidden', onchange: function () { resolve(inp.files && inp.files[0] || null); inp.remove(); } });
        document.body.appendChild(inp); inp.click();
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { fallback(); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false }).then(function (stream) {
        var video = U.el('video', { autoplay: true, playsinline: true, muted: true, class: 'cam-video' });
        video.srcObject = stream;
        function close(v) { stream.getTracks().forEach(function (t) { t.stop(); }); sheet.remove(); resolve(v); }
        var shoot = U.btn('Take photo', 'primary', function () {
          var c = document.createElement('canvas'); c.width = video.videoWidth || 1280; c.height = video.videoHeight || 720;
          c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
          c.toBlob(function (b) { close(b); }, 'image/jpeg', 0.9);
        }, { 'data-act': 'cam-shoot' });
        var sheet = U.el('div', { class: 'sheet cam', role: 'dialog', 'aria-label': 'Camera', 'data-act': 'cam-sheet' },
          U.el('div', { class: 'wrap' }, video, U.el('div', { class: 'tiny' }, 'Hold your paper flat, fill the frame. 종이를 화면 가득 맞추세요.'),
            U.el('div', { class: 'actions' }, shoot, U.btn('Cancel', 'ghost', function () { close(null); }, { 'data-act': 'cam-cancel' }))));
        document.body.appendChild(sheet);
      }, fallback);
    });
  };

  /* ---------- 손글씨 판: 손가락·펜으로 쓰기(펜 압력 반영) 또는 종이 사진 ---------- */
  U.handPad = function (opts) {
    var wrap = U.el('div'), pad = U.el('div', { class: 'pad' }), canvas = U.el('canvas', { 'aria-label': 'Handwriting area' }), strokes = [], cur = null, photo = null;
    pad.appendChild(U.el('div', { class: 'guide' })); pad.appendChild(canvas); pad.appendChild(U.el('div', { class: 'hint' }, opts.hint || 'Write here with your finger or pen'));
    var ctx = canvas.getContext('2d'), dpr = Math.max(1, window.devicePixelRatio || 1);
    function size() {
      var w = canvas.clientWidth || 320, h = canvas.clientHeight || 210;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); redraw(); }
    }
    function redraw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b1a17';
      strokes.forEach(function (s) { for (var i = 1; i < s.length; i++) { ctx.lineWidth = s[i].w; ctx.beginPath(); ctx.moveTo(s[i - 1].x, s[i - 1].y); ctx.lineTo(s[i].x, s[i].y); ctx.stroke(); } });
    }
    function pt(e) { var r = canvas.getBoundingClientRect(); var p = e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5; return { x: e.clientX - r.left, y: e.clientY - r.top, w: 1.6 + p * 3.2 }; }
    canvas.addEventListener('pointerdown', function (e) { size(); canvas.setPointerCapture(e.pointerId); cur = [pt(e)]; strokes.push(cur); pad.querySelector('.hint').style.display = 'none'; e.preventDefault(); });
    canvas.addEventListener('pointermove', function (e) {
      if (!cur) return; var p = pt(e), q = cur[cur.length - 1];
      cur.push(p); ctx.lineWidth = p.w; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault();
    });
    function end() { if (cur) { cur = null; changed(); } }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('pointerleave', end);
    function changed() { opts.onChange(ready()); }
    // 타자 모드 (펜·태블릿이 없을 때). 기기마다 마지막 선택을 기억
    var typing = false, typeBox = null, typeInp = null;
    function ready() { return typing ? !!(typeInp && typeInp.value.trim()) : !!photo || strokes.some(function (s) { return s.length > 1; }); }
    function usePhoto(f) { if (!f) return; U.shrinkImage(f, 1600).then(function (b) { photo = b; showPhoto(); }, function () { photo = f; showPhoto(); }); }
    // 파일 고르기 (사진첩·파일) — 카메라는 아래 '촬영' 버튼
    var file = U.el('input', { type: 'file', accept: 'image/*', class: 'hidden', 'data-act': 'photo-file', onchange: function () { usePhoto(file.files && file.files[0]); } });
    var photoBox = U.el('div', { class: 'hidden' });
    function showPhoto() {
      photoBox.innerHTML = ''; layout();
      photoBox.appendChild(U.el('img', { class: 'pad-img', src: URL.createObjectURL(photo), alt: 'Photo of your handwriting' }));
      changed();
    }
    // 종이 모드 (노트북처럼 펜이 없는 기기): 종이에 쓰고 사진 — 화면 판 대신 큰 사진 버튼
    var mode0 = U.writeMode(), paper = mode0 === 'paper';
    var paperBox = U.el('div', { class: 'paperbox hidden', 'data-act': 'paper-box' },
      U.el('div', { class: 'small' }, 'Write it on paper, then take a photo.'),
      U.el('div', { class: 'actions' },
        U.btn([U.icon('camera'), 'Take photo'], 'primary sm', function () { U.camera().then(usePhoto); }, { 'data-act': 'paper-photo' }),
        U.btn([U.icon('image'), 'Choose file'], 'sm', function () { file.value = ''; file.click(); }, { 'data-act': 'paper-pick' })),
      U.el('button', { class: 'linkbtn', type: 'button', 'data-act': 'paper-off', onclick: function () { setPaper(false); U.setWriteMode('pad'); } }, 'Write on the screen instead'));
    function layout() {
      pad.classList.toggle('hidden', typing || paper || !!photo); photoBox.classList.toggle('hidden', typing || !photo);
      paperBox.classList.toggle('hidden', typing || !paper || !!photo);
      tools.classList.toggle('hidden', typing || (paper && !photo));
      if (typeBox) typeBox.classList.toggle('hidden', !typing);
    }
    function setPaper(on) { paper = on; layout(); if (!on) setTimeout(size, 0); }
    function setTyping(on) {
      typing = on; U.setWriteMode(on ? 'type' : (paper ? 'paper' : 'pad'));
      layout();
      switchBtn.textContent = on ? 'Write by hand instead' : 'Type instead';
      if (on) setTimeout(function () { typeInp.focus({ preventScroll: true }); }, 30);
      changed();
    }
    var switchBtn = null;
    if (opts.allowType) {
      typeInp = U.el('textarea', { class: 'text', lang: 'ko', rows: 2, 'data-act': 'type-ko', placeholder: '한국어로 쓰세요 (Korean keyboard)', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', oninput: changed });
      typeBox = U.el('div', { class: 'hidden typebox' }, typeInp, U.el('div', { class: 'tiny' }, 'No pen? Typing is fine. Handwriting helps you remember spelling — try it when you can.'));
      switchBtn = U.btn('Type instead', 'ghost xs', function () { setTyping(!typing); }, { 'data-act': 'type-toggle' });
    }
    var tools = U.el('div', { class: 'actions pad-tools' },
      U.btn('Undo', 'ghost xs', function () { strokes.pop(); redraw(); changed(); }, { 'data-act': 'undo' }),
      U.btn('Clear', 'ghost xs', function () { strokes = []; photo = null; layout(); redraw(); changed(); }, { 'data-act': 'clear' }),
      U.el('span', { class: 'grow' }),
      U.btn([U.icon('camera'), 'Take photo'], 'ghost xs', function () { U.camera().then(usePhoto); }, { 'data-act': 'photo' }),
      U.btn([U.icon('image'), 'Choose file'], 'ghost xs', function () { file.value = ''; file.click(); }, { 'data-act': 'photo-pick' }));
    wrap.appendChild(pad); wrap.appendChild(paperBox); wrap.appendChild(photoBox); wrap.appendChild(tools); wrap.appendChild(file);
    if (opts.allowType) { wrap.appendChild(typeBox); wrap.appendChild(U.el('div', { class: 'row' }, U.el('span', { class: 'grow' }), switchBtn)); if (mode0 === 'type') setTimeout(function () { setTyping(true); }, 0); }
    layout();
    setTimeout(size, 0); window.addEventListener('resize', size);
    return {
      node: wrap, ready: ready,
      /** PNG(흰 바탕, 글씨 둘레만 잘라서) 또는 사진 → {b64, mime, mode} */
      export: function () {
        if (typing) return Promise.resolve({ typed: typeInp.value.trim(), mode: 'typed' });
        if (photo) return U.blobToB64(photo).then(function (b64) { return { b64: b64, mime: photo.type || 'image/jpeg', mode: 'photo' }; });
        var minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
        strokes.forEach(function (s) { s.forEach(function (p) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }); });
        var pad2 = 16, w = Math.max(40, maxX - minX + pad2 * 2), h = Math.max(40, maxY - minY + pad2 * 2);
        var c = document.createElement('canvas'); c.width = Math.round(w * 2); c.height = Math.round(h * 2);
        var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
        x.setTransform(2, 0, 0, 2, (-minX + pad2) * 2, (-minY + pad2) * 2); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#111';
        strokes.forEach(function (s) { for (var i = 1; i < s.length; i++) { x.lineWidth = s[i].w; x.beginPath(); x.moveTo(s[i - 1].x, s[i - 1].y); x.lineTo(s[i].x, s[i].y); x.stroke(); } });
        var url = c.toDataURL('image/png');
        return Promise.resolve({ b64: url.split(',')[1], mime: 'image/png', mode: 'canvas' });
      }
    };
  };

  /** 한글 입력 칸: 조합 중 Enter 무시 */
  U.textInput = function (opts) {
    var tag = opts.multi ? 'textarea' : 'input';
    var inp = U.el(tag, { class: 'text', type: opts.multi ? null : 'text', placeholder: opts.placeholder || '', lang: opts.lang || 'en', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: opts.lang === 'en' ? 'true' : 'false', 'aria-label': opts.label || opts.placeholder });
    var composing = false;
    inp.addEventListener('compositionstart', function () { composing = true; });
    inp.addEventListener('compositionend', function () { composing = false; opts.onChange && opts.onChange(inp.value); });
    inp.addEventListener('input', function () { opts.onChange && opts.onChange(inp.value); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !opts.multi && !(composing || e.isComposing)) { e.preventDefault(); opts.onEnter && opts.onEnter(); } });
    if (opts.value) inp.value = opts.value;
    return inp;
  };
  U.diffNode = function (answer, target) {
    var d = window.Hangul.diff(answer || '', target || '');
    return U.el('span', { class: 'diff', lang: 'ko' }, d.map(function (x) { return U.el('span', { class: x.op === 'same' ? '' : x.op }, x.ch); }));
  };
  U.stars = function (n) { return U.el('span', { class: 'stars', 'aria-label': n + ' / 5' }, '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)); };
  window.UI = U;
})();
