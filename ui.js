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
      return p.month + '/' + p.day + ' ' + p.hour + ':' + p.minute + U.tzAb(iso, tz);
    } catch (e) { return iso.slice(5, 16).replace('T', ' '); }
  };
  U.fmtHM = function (iso, tz) {
    if (!iso) return '—';
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz || undefined, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)) + U.tzAb(iso, tz); } catch (e) { return iso.slice(11, 16); }
  };
  /** T146w: 학생 시간대로 보일 때 짧은 이름(' EDT') — tz 없으면 빈 글자(보는 기기 시간) */
  U.tzAb = function (iso, tz) {
    if (!tz) return '';
    try { var x = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(iso)).filter(function (q) { return q.type === 'timeZoneName'; })[0]; return x ? ' ' + x.value : ''; } catch (e) { return ''; }
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
  /* T146q (선생님 L6 '모든 대기 시간에 로딩 표시') 서버 호출이 0.15초 넘게 걸리면 화면 맨 위 움직이는 줄 + 보내기(Outbox)면 아래 '보내는 중' 알약.
     모든 서버 호출이 U.call 하나로 지나감 → 여기서 한 번에 켜고 끔 (시험: data-act="net-busy") */
  var NET = { n: 0, send: 0, t: null, bar: null, pill: null };
  function netPaint() {
    var on = NET.n > 0;
    if (on && !NET.bar && document.body) {
      NET.bar = U.el('div', { class: 'netbar', role: 'progressbar', 'aria-label': U.tx('Loading', '불러오는 중'), 'data-act': 'net-busy' }, U.el('i'));
      document.body.appendChild(NET.bar);
    }
    if (NET.bar) NET.bar.hidden = !on;
    if (NET.send > 0 && !NET.pill && document.body) {
      NET.pill = U.el('div', { class: 'netpill', role: 'status', 'aria-live': 'polite', 'data-act': 'net-sending' }, U.el('span', { class: 'spin', 'aria-hidden': 'true' }), U.el('span', {}, U.tx('Sending…', '보내는 중…')));
      document.body.appendChild(NET.pill);
    }
    if (NET.pill) NET.pill.hidden = !(NET.send > 0);
  }
  U.netBusy = function (d, sending) {
    NET.n = Math.max(0, NET.n + d); if (sending) NET.send = Math.max(0, NET.send + d);
    clearTimeout(NET.t);
    if (d > 0) NET.t = setTimeout(netPaint, 150); else netPaint();
  };
  U.call = function (action, payload) {
    U.netBusy(1, action === 'student.step');
    var done = function () { U.netBusy(-1, action === 'student.step'); };
    return U.call0(action, payload).then(function (x) { done(); return x; }, function (e) { done(); throw e; });
  };
  U.call0 = function (action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    if (U.PREVIEW && U.PREVIEW_WRITES.indexOf(action) >= 0) { var pe = new Error('미리 보기 — 저장 안 함'); pe.server = true; pe.preview = true; return Promise.reject(pe); }
    if (body.key && !body.tz_client && !U.PREVIEW) { try { body.tz_client = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* 없음 */ } }   // 시간대 모르는 학생 → 서버가 한 번 저장
    if (window.DemoApi && window.DemoApi.enabled()) return window.DemoApi.call(body);
    // T130 서버가 잠깐 바쁨(502·503·504·546) → 0.7·2초 뒤 두 번 더. 쓰기는 client_id 로 겹치지 않음
    var send = function (n) {
      return fetch(window.HW_CONFIG.API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
        .then(function (r) {
          if (!r.ok && n < 2 && [502, 503, 504, 546].indexOf(r.status) >= 0) return new Promise(function (ok) { setTimeout(ok, n ? 2000 : 700); }).then(function () { return send(n + 1); });
          if (!r.ok) throw new NetError('HTTP ' + r.status); return r.json();
        }, function (e) { throw new NetError(e && e.message || 'network'); });
    };
    return send(0)
      .then(function (j) { if (!j.ok) { var err = new Error(j.error || 'error'); err.server = true; throw err; } return j.data; });
  };
  /* T146q (선생님 A4) 활동 시간 = 화면이 보이고(visibilitychange) 마지막 손길(누름·입력·스크롤)이 2분 안인 동안만 5초씩 셈 [기본안].
     세트마다 이 기기에 저장(hw_act_<dayset_id>) → 끝 화면이 보여 주고 student.day_end 로 보냄 */
  var ACT = { id: null, last: Date.now(), idle: 120000, tick: 5000 };
  /* T146s 활동 시계 하나: 보이는 동안 + 마지막 손길 2분 안만 흐름(ms, 1부터). 끝 화면 활동 시간·문항 time_ms·dwell_ms 가 모두 이 시계 */
  var CLK = { acc: 1, at: Date.now(), vis: !document.hidden, day: 1 };
  function clk() {
    var now = Date.now();
    if (CLK.vis) { var end = Math.min(now, ACT.last + ACT.idle); if (end > CLK.at) CLK.acc += end - CLK.at; }
    CLK.at = now; return CLK.acc;
  }
  U.actMs = clk;
  ['pointerdown', 'keydown', 'touchstart', 'scroll', 'input'].forEach(function (ev) { window.addEventListener(ev, function () { clk(); ACT.last = Date.now(); }, { passive: true, capture: true }); });
  document.addEventListener('visibilitychange', function () { clk(); CLK.vis = !document.hidden; if (CLK.vis) ACT.last = Date.now(); });
  setInterval(function () {
    var a = clk(), d = a - CLK.day; CLK.day = a;
    if (!ACT.id || d <= 0) return;
    var k = 'hw_act_' + ACT.id; U.store.set(k, (U.store.get(k, 0) || 0) + d / 1000);
  }, ACT.tick);
  U.activeDay = function (id) { CLK.day = clk(); ACT.id = id || null; ACT.last = Date.now(); };
  U.activeSec = function (id) { return Math.round(U.store.get('hw_act_' + id, 0) || 0); };
  /** 오프라인 대기열: 제출을 먼저 저장, 연결되면 보냄. client_id 로 중복 방지 */
  /** 선생님 미리 보기 (student.html?k=…#preview): 보기만, 저장·열람 기록 안 함 */
  U.PREVIEW = /(^|[#&])preview\b/.test(location.hash || '');
  U.PREVIEW_WRITES = ['student.open', 'student.notif', 'student.step', 'student.skip', 'student.skip_task', 'student.mark', 'student.consent', 'student.push_sub', 'student.device'];
  /** 이 기기에서 한국어를 어떻게 쓰나 (처음 열 때 학생이 고름): pad = 화면에 손글씨 · paper = 종이에 쓰고 사진 · type = 타자 */
  U.WRITE_MODES = { pad: 'On the screen', paper: 'On paper + photo', type: 'Typing' };
  /** T109e 화면 글자 언어: ?lang= 또는 기기에 저장한 hw_lang (기본 영어). 학습 내용(한국어 문장)은 언제나 한국어 */
  /* T146a 플래시카드 앱과 같은 4단계: en = 모두 영어 · mix1 = 버튼만 한국어 · mix2 = 버튼·제목 한국어, 도움말만 영어 · ko = 모두 한국어 */
  U.LEVELS = ['en', 'mix1', 'mix2', 'ko'];
  U.TIER = { en: 0, mix1: 1, mix2: 2, ko: 3 };
  /* T146k 학생 기본 설정(R15): 화면 언어 = 영어(정본에 언어 칸이 생기면 그 값) · 로마자 = web/prefs/ui.json(tools/ui_prefs.py). 이 기기에서 고른 값이 먼저.
     선생님 미리 보기(#preview)는 이 기기(선생님 폰)에 저장된 값 대신 학생 설정을 보여 줌 — 화면에서 바꾸면 이 창에서만 */
  U.PF = {}; U.PV = {};
  var PREFS = null;
  U.prefs = function (sid) {
    if (!PREFS) PREFS = fetch('prefs/ui.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    return PREFS.then(function (m) { var before = U.level() + '|' + U.roman(); U.PF = (m && m[sid]) || {}; return before !== U.level() + '|' + U.roman(); });
  };
  U.level = function () {
    var q = U.qs('lang'); if (U.TIER[q] !== undefined) return q;
    var v = U.PREVIEW ? U.PV.lang : U.store.get('hw_lang', 'en');   // T146t 첫 언어는 언제나 영어 (학생이 고른 값은 그대로)
    return U.TIER[v] !== undefined ? v : 'en';
  };
  U.setLevel = function (v) { if (U.PREVIEW) U.PV.lang = v; else U.store.set('hw_lang', v); };
  U.roman = function () { return U.PREVIEW ? (U.PV.roman !== undefined ? U.PV.roman : !!U.PF.roman) : !!U.store.get('hw_roman', !!U.PF.roman); };
  U.setRoman = function (v) { if (U.PREVIEW) U.PV.roman = !!v; else U.store.set('hw_roman', !!v); };
  /** 로마자 한 줄 (켰을 때만, pron.js Pron.roman = 국어의 로마자 표기법, 발음 기준·된소리 표기 안 함) */
  U.romanNode = function (ko, small) {
    if (!U.roman() || !window.Pron || !window.Pron.roman || !ko) return null;
    var r = window.Pron.roman(ko); return r ? U.el('span', { class: small ? 'roman sm' : 'roman', lang: 'ko-Latn', 'data-act': 'roman' }, r) : null;
  };
  /* T146k 지시문 = 학생 언어(R16): 한국어 지시문(…해 보세요)은 영어 짝이 있으면 언어 설정을 따름(한국어 4단계만 한국어). 내용 질문(…어요?)은 그대로 한국어 */
  U.KO_DIR = /(?:보세요|하세요|쓰세요|고르세요|읽으세요|말하세요|만드세요|답하세요|넣으세요|바꾸세요|고치세요|들으세요|연습하세요)\s*[.!]?\s*$/;
  U.dirTx = function (ko, en) { return ko && en && U.KO_DIR.test(String(ko)) && !/[?？]\s*$/.test(String(ko)) ? U.tx(en, ko, 3) : ko; };
  U.lang = function () { return U.level() === 'ko' ? 'ko' : 'en'; };
  U.tx = function (en, ko, tier) { return ko != null && U.TIER[U.level()] >= (tier || 3) ? ko : en; };
  // T126 번역 묶음 = 번역할 문장만. 지시형(Say that…·Record: …·대시 설명)은 문장 묶음으로 (Code.gs isDirective_ 와 같은 규칙 — 옛 서버·저장된 과제도)
  U.DIRECTIVE_EN = /^\s*(say|tell (?!me\b)|describe|explain|talk about|ask (?!me\b)|introduce|record|report|state|write about|mention|express|give (?:a|an|your)\b|share|translate|confirm|react|make a (?:soft|formal|polite|casual)|add a)\b|[.;:!?]\s+(say|write|ask|describe|confirm|answer|explain|tell)\b(?!\s+(?:me|him|her|them|us)\b)|^[^:.?!]{1,70}:\s|[^?!.\s]\s[—–]\s|\s-\s|\(in korean\b/i;
  U.DIRECTIVE_KO = /(?:라고|다고|자고|냐고)\s*(?:말해\s*보세요|써\s*보세요|말하세요|쓰세요)\s*[.!]?\s*$|[^?!.\s]\s[—–]\s/;
  U.isDirective = function (t) {
    if (t.tk === 'translate') return false;   // T146g (Code.gs isDirective_ 와 같음)
    if (t.type === 'sp_en_ko') return U.DIRECTIVE_EN.test(String(t.en || ''));
    if (t.type === 'sp_ko_en') return U.DIRECTIVE_KO.test(String(t.ko || ''));
    return false;
  };
  /** T146g 단어 카드 타자 답 정답 후보 = 사전형 + 표시('가다 / 가요') + 해요체(서버 card.yo). Code.gs cardTargets_ 와 같음 */
  U.cardTargets = function (c) { return [c.ko].concat(String(c.display || '').split(' / ')).concat(String(c.yo || '').split(' / ')).filter(function (x, i, a) { return x && a.indexOf(x) === i; }); };
  /** T146g 단어 카드 뒷면 = 플래시카드 앱과 같은 데이터(tools/card_notes.py → web/cn/<nn>.json). nn = 글자 코드 합 % 256 */
  U.cnKey = function (ko) { var h = 0; Array.from(String(ko || '')).forEach(function (ch) { h = (h + ch.codePointAt(0)) % 256; }); return (h < 16 ? '0' : '') + h.toString(16); };
  var CN = {};
  /** 카드에 맞는 앱 노트 1개 → Promise({x, xe, p, e} 또는 null). card.note_id 먼저, 아니면 영어 뜻 낱말이 가장 많이 겹치는 것 */
  U.cardNote = function (c) {
    var ko = String(c.ko || '').trim(), k = U.cnKey(ko);
    if (!CN[k]) CN[k] = fetch('cn/' + k + '.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete CN[k]; return {}; });
    return CN[k].then(function (d) {
      var list = d[ko] || []; if (!list.length) return null;
      var hit = list.filter(function (n) { return c.note_id && n.i === c.note_id; })[0]; if (hit) return hit;
      var ws = String(c.en || '').toLowerCase().match(/[a-z]+/g) || [];
      return list.map(function (n) { var e = String(n.en || '').toLowerCase(); return [ws.filter(function (w) { return w.length > 2 && e.indexOf(w) >= 0; }).length, n]; })
        .sort(function (a, b) { return b[0] - a[0]; })[0][1];
    });
  };
  /** T146j 카드 예문 영어(tools/ex_en.py → web/xe/<nn>.json {예문: 영어}) → Promise(문자열 또는 '') */
  var XE = {};
  U.exEn = function (ko) {
    ko = String(ko || '').replace(/\s+/g, ' ').trim(); if (!ko) return Promise.resolve('');
    var k = U.cnKey(ko);
    if (!XE[k]) XE[k] = fetch('xe/' + k + '.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete XE[k]; return {}; });
    return XE[k].then(function (d) { return d[ko] || ''; });
  };
  /** T146j 형용사 뜻 = 동사형 (dark → to be dark). 이미 to·be 로 시작하거나 괄호 설명이면 그대로 */
  /* T146t(선생님 3) 단어 카드 앞면 힌트: 1~2글자 말 = 첫 글자의 첫 자음(매우 → ㅁ…), 3글자 이상 = 첫 글자(전화받다 → 전…).
     글자 수 = 한글 음절만(띄어쓰기 뺌). 첫 글자가 한글이 아니면 '' — tools/hw_rules.py ko_hint 와 같은 규칙(R34) */
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  /* T146t R35 읽기 탭: 한 글자 말이 어절 앞에 붙어 걸리면 남은 것이 조사·어미일 때만 (어제 → 어 ✗) — tools/hw_rules.gloss_ok 와 같음 */
  var G_N = ' 은 는 이 가 을 를 에 에서 에게 에는 에도 에서는 도 만 의 와 과 로 으로 랑 이랑 하고 쯤 예요 이에요 이야 야 아 처럼 보다 까지 부터 한테 께 들 들아 들이 들은 들을 마다 밖에 해요 했어요 하다 이면 이라서 이니까 이라고 이고 이지만 인데 ';
  var G_V = ' 요 고 서 면 세요 지만 는 니까 게 어요 아요 었어요 았어요 어서 아서 어 아 지 죠 네요 기 고요 려고 러 던 기로 었다 았다 였다 다 다고 는다 었고 았고 면서 는데 은 셨어요 시 기도 아도 어도 아야 어야 았던 었던 여 여요 였어요 으면 으니까 으세요 으러 으려고 으면서 은데 을 을까요 거나 ';
  U.glossOk = function (tok, g) {
    var ko = String((g && (g.display || g.ko)) || ''), last = ko.split(' ').pop();
    if (!last) return true;
    if (tok.indexOf(last) === 0 && (tok === last || G_N.indexOf(' ' + tok.slice(last.length) + ' ') >= 0)) return true;
    var verb = /다$/.test(last) && last.length > 1, stem = verb ? last.slice(0, -1) : last;
    if (stem.length >= 2 || tok.indexOf(stem) !== 0) return true;
    var rest = tok.slice(stem.length);
    if (verb && /^[으을은]/.test(rest) && (stem.charCodeAt(stem.length - 1) - 0xac00) % 28 === 0) return false;   // 가을 → 가다 ✗
    return rest === '' || (verb ? G_V : G_N).indexOf(' ' + rest + ' ') >= 0;
  };
  U.koHint = function (c) {
    var w = String((c && (c.display || c.ko)) || '').replace(/\s*\(.*?\)\s*/g, '').trim(), syl = w.match(/[가-힣]/g) || [];
    var f = w.charAt(0), code = f.charCodeAt(0) - 0xac00;
    if (!syl.length || code < 0 || code > 11171) return '';
    return (syl.length <= 2 ? CHO.charAt(Math.floor(code / 588)) : f) + '…';
  };
  U.cardEn = function (c) {
    var en = String(c.en || ''); if (!/^adj/i.test(String(c.pos || '')) && c.pos !== '형용사') return en;
    return en.split(/\s*;\s*/).map(function (x) { return !x || /^(to |\(|~)/i.test(x) ? x : /^be /i.test(x) ? 'to ' + x : 'to be ' + x; }).join('; ');
  };
  /** T146j 문형 카드(-아야/어야 하다, -고): 단어가 아니라 '문형' 표시 */
  U.isPattern = function (c) { var k = String(c.ko || '').trim(); return /^[-~]/.test(k) || c.pos === '문형' || c.pos === 'pattern' || c.kind === 'pattern'; };
  U.grp = function (t) { var g = t.group || 'sentence'; return (g === 'ko_en' || g === 'en_ko') && U.isDirective(t) ? 'sentence' : g; };
  U.writeMode = function () { var m = U.store.get('hw_write_mode', null); if (!U.WRITE_MODES[m]) m = U.store.get('hw_type_mode', false) ? 'type' : null; return m; };
  U.setWriteMode = function (m) { U.store.set('hw_write_mode', m); U.store.set('hw_type_mode', m === 'type'); };
  /** T146a 영어로 옮기기(뜻 쓰기) 답 방식: type 타자 · speak 말하기(녹음) · photo 종이에 쓰고 사진. 처음 한 번 고르면 이 기기에 기억 */
  U.EN_MODES = { type: ['Type', '타자'], speak: ['Say it (record)', '말하기 (녹음)'], photo: ['Write on paper + photo', '종이에 써서 사진'] };
  U.enMode = function () { var m = U.store.get('hw_en_mode', null); return U.EN_MODES[m] ? m : null; };
  U.setEnMode = function (m) { U.store.set('hw_en_mode', U.EN_MODES[m] ? m : null); };
  /** T146a 오늘 화면 저장본 (학생 키마다 하나): {v 서버 버전, at 받은 때, d student.today 응답}. 서버에는 버전만 물어 같으면 안 받음 */
  U.dayCache = {
    name: function (k) { return 'hw_day_' + String(k || '').slice(0, 80); },
    get: function (k) { var c = U.store.get(this.name(k), null); return c && c.d && c.d.day && c.d.student ? c : null; },
    set: function (k, d) {
      try { var s = JSON.stringify({ v: d.ver || null, at: Date.now(), d: d }); if (s.length > 1500000) return false; localStorage.setItem(this.name(k), s); return true; }
      catch (e) { try { localStorage.removeItem(this.name(k)); } catch (e2) { /* 무시 */ } return false; }
    },
    drop: function (k) { try { localStorage.removeItem(this.name(k)); } catch (e) { /* 무시 */ } }
  };
  /** 그 시간대의 오늘 (YYYY-MM-DD) — 저장본이 오늘 것인지 */
  U.todayIn = function (tz) { try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  U.hasTouch = function () { try { return (navigator.maxTouchPoints || 0) > 0 || window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
  U.Outbox = function (name) {
    this.key = 'hw2_outbox_' + name; this.mem = U.store.get(this.key, []); this.busy = false; this.wait = 2000; this.listeners = [];
    var self = this;
    window.addEventListener('online', function () { self.flush(); });
    // T127 탭이 안 보이면 다시 보내기 멈춤 · 실패 뒤 기다리는 시간(2초→60초) 전에는 15초 타이머도 안 보냄
    var due = function () { if (!document.hidden && Date.now() >= self.next) self.flush(); };
    this.next = 0;
    setInterval(due, 15000);
    document.addEventListener('visibilitychange', due);
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
      self.mem.shift(); self.busy = false; self.wait = 2000; self.next = 0; self.save();
      if (item.resolve) item.resolve(res);
      self.flush();
    }, function (err) {
      self.busy = false;
      var transient = err.server && /^server: |lock|timed out|시간/i.test(String(err.message || ''));   // 서버가 바쁨(잠금 대기) → 다시 보냄. 잘못된 요청만 버림
      if (err.server && !transient) { self.mem.shift(); self.save(); if (item.reject) item.reject(err); self.flush(); return; }
      item.tries++; self.save();
      // 화면은 '보낼 예정'으로 — T119: 앞 줄이 막혀 있어도 뒤에 쌓인 제출까지 모두 바로 '저장함'으로 (화면이 '보내는 중…'에 멈추지 않게)
      self.mem.forEach(function (it) { if (it.resolve) { it.resolve({ queued: true }); it.resolve = null; it.reject = null; } });
      self.wait = Math.min(self.wait * 2, 60000); self.next = Date.now() + self.wait;
      setTimeout(function () { if (!document.hidden) self.flush(); }, self.wait);
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
      box.appendChild(U.btn([U.el('span', { 'aria-hidden': 'true' }, '●'), ' ', opts.label || U.tx('Record', '녹음')], 'rec', start, { 'data-act': 'rec' }));
      if (opts.hint) box.appendChild(U.el('span', { class: 'tiny' }, opts.hint));
    }
    var off = false;
    function start() {
      rec = new U.Recorder(opts.max || 60, function (s) { var t = box.querySelector('.timer'); if (t) t.textContent = fmt(s); });
      rec.start().then(function () {
        box.innerHTML = '';
        box.appendChild(U.btn([U.el('span', { class: 'pulse' }), ' ' + U.tx('Stop', '멈춤')], 'rec', stop, { 'data-act': 'stop' }));
        box.appendChild(U.el('span', { class: 'timer' }, '0:00'));
      }, noMic);
    }
    function stop() { rec.stop().then(function (r) { result = r; done(); }); }
    function done() {
      box.innerHTML = '';
      var a = U.el('audio', { controls: true, src: URL.createObjectURL(result.blob) });
      box.appendChild(a);
      box.appendChild(U.btn(U.tx('Re-record', '다시 녹음'), 'ghost sm', function () { result = null; idle(); opts.onReady(null); }, { 'data-act': 'rerec' }));
      opts.onReady(result);
    }
    function noMic() {   // T119 마이크 거부·지원 안 됨: 녹음 칸 대신 한 줄 (녹음 없이 완료 가능) + 녹음 파일 올리기는 그대로
      if (off) return; off = true;
      box.innerHTML = ''; box.setAttribute('data-act', 'no-mic');
      box.appendChild(U.el('div', { class: 'small', role: 'status' }, U.tx('The microphone is off on this device. You can finish without recording.', '이 기기에서는 마이크를 쓸 수 없어요. 녹음 없이 완료해도 돼요.')));
      if (opts.onNoMic) opts.onNoMic();
      box.appendChild(U.el('span', { class: 'tiny' }, U.tx('Or upload a voice memo: ', '녹음 파일을 올려도 돼요: ')));
      var f = U.el('input', { type: 'file', accept: 'audio/*', onchange: function () {
        var file = f.files && f.files[0]; if (!file) return;
        result = { blob: file, mime: file.type || 'audio/mp4', sec: 0 }; done();
      } });
      box.appendChild(f);
    }
    idle();
    // T119 처음부터 녹음을 못 하는 기기·이미 거부한 권한이면 바로 한 줄 안내
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) noMic();
    else if (navigator.permissions && navigator.permissions.query) { try { navigator.permissions.query({ name: 'microphone' }).then(function (q) { if (q.state === 'denied' && !result) noMic(); }, function () {}); } catch (e) { /* 지원 안 함 */ } }
    return { node: box, result: function () { return result; }, off: function () { return off; } };
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
        var shoot = U.btn(U.tx('Take photo', '사진 찍기'), 'primary', function () {
          var c = document.createElement('canvas'); c.width = video.videoWidth || 1280; c.height = video.videoHeight || 720;
          c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
          c.toBlob(function (b) { close(b); }, 'image/jpeg', 0.9);
        }, { 'data-act': 'cam-shoot' });
        var sheet = U.el('div', { class: 'sheet cam', role: 'dialog', 'aria-label': U.tx('Camera', '카메라'), 'data-act': 'cam-sheet' },
          U.el('div', { class: 'wrap' }, video, U.el('div', { class: 'tiny' }, U.camHint || U.tx('Hold your paper flat and fill the frame.', '종이를 평평하게 두고 화면 가득 맞추세요.')),
            U.el('div', { class: 'actions' }, shoot, U.btn(U.tx('Cancel', '취소'), 'ghost', function () { close(null); }, { 'data-act': 'cam-cancel' }))));
        document.body.appendChild(sheet);
      }, fallback);
    });
  };

  /* ---------- 손글씨 판: 손가락·펜으로 쓰기(펜 압력 반영) 또는 종이 사진 ---------- */
  U.handPad = function (opts) {
    var wrap = U.el('div'), pad = U.el('div', { class: 'pad' }), canvas = U.el('canvas', { 'aria-label': U.tx('Handwriting area', '손글씨 칸') }), strokes = [], cur = null, photo = null;
    pad.appendChild(U.el('div', { class: 'guide' })); pad.appendChild(canvas); pad.appendChild(U.el('div', { class: 'hint' }, opts.hint || U.tx('Write here with your finger or pen', '손가락이나 펜으로 여기에 쓰세요')));
    var ctx = canvas.getContext('2d'), dpr = Math.max(1, window.devicePixelRatio || 1);
    var INK = '#1b1a17', RED = '#d0021b', pen = INK;   // T146t 빨간 펜 = 사전·노트를 보고 쓴 말 (채점 감점 없음, 복습 단어로)
    function size() {
      var w = canvas.clientWidth || 320, h = canvas.clientHeight || 210;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); redraw(); }
    }
    function redraw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.forEach(function (s) { ctx.strokeStyle = s.c || INK; for (var i = 1; i < s.length; i++) { ctx.lineWidth = s[i].w; ctx.beginPath(); ctx.moveTo(s[i - 1].x, s[i - 1].y); ctx.lineTo(s[i].x, s[i].y); ctx.stroke(); } });
    }
    function pt(e) { var r = canvas.getBoundingClientRect(); var p = e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5; return { x: e.clientX - r.left, y: e.clientY - r.top, w: 1.6 + p * 3.2 }; }
    canvas.addEventListener('pointerdown', function (e) { size(); canvas.setPointerCapture(e.pointerId); cur = [pt(e)]; cur.c = pen; ctx.strokeStyle = pen; strokes.push(cur); pad.querySelector('.hint').style.display = 'none'; e.preventDefault(); });
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
      photoBox.appendChild(U.el('img', { class: 'pad-img', src: URL.createObjectURL(photo), alt: U.tx('Photo of your handwriting', '내 손글씨 사진') }));
      changed();
    }
    // 종이 모드 (노트북처럼 펜이 없는 기기): 종이에 쓰고 사진 — 화면 판 대신 큰 사진 버튼
    var mode0 = U.writeMode(), paper = mode0 === 'paper';
    var paperBox = U.el('div', { class: 'paperbox hidden', 'data-act': 'paper-box' },
      U.el('div', { class: 'small' }, U.tx('Write it on paper, then take a photo. Words you looked up: write them in red.', '종이에 쓰고 사진을 찍으세요. 찾아보고 쓴 말은 빨간 펜으로 써 주세요.')),
      U.el('div', { class: 'actions' },
        U.btn([U.icon('camera'), U.tx('Take photo', '사진 찍기')], 'primary sm', function () { U.camera().then(usePhoto); }, { 'data-act': 'paper-photo' }),
        U.btn([U.icon('image'), U.tx('Choose file', '사진 고르기')], 'sm', function () { file.value = ''; file.click(); }, { 'data-act': 'paper-pick' })),
      U.el('button', { class: 'linkbtn', type: 'button', 'data-act': 'paper-off', onclick: function () { setPaper(false); U.setWriteMode('pad'); } }, U.tx('Write on the screen instead', '화면에 쓰기로 바꾸기')));
    function layout() {
      pad.classList.toggle('hidden', typing || paper || !!photo); photoBox.classList.toggle('hidden', typing || !photo);
      paperBox.classList.toggle('hidden', typing || !paper || !!photo);
      tools.classList.toggle('hidden', typing || (paper && !photo));
      penRow.classList.toggle('hidden', typing || paper || !!photo);
      if (typeBox) typeBox.classList.toggle('hidden', !typing);
    }
    function setPaper(on) { paper = on; layout(); if (!on) setTimeout(size, 0); }
    function setTyping(on) {
      typing = on; U.setWriteMode(on ? 'type' : (paper ? 'paper' : 'pad'));
      layout();
      switchBtn.textContent = on ? U.tx('Write by hand instead', '손글씨로 바꾸기') : U.tx('Type instead', '타자로 쓰기');
      if (on) setTimeout(function () { typeInp.focus({ preventScroll: true }); }, 30);
      changed();
    }
    var switchBtn = null;
    if (opts.allowType) {
      typeInp = U.el('textarea', { class: 'text', lang: 'ko', rows: 2, 'data-act': 'type-ko', placeholder: U.tx('Type in Korean (Korean keyboard)', '한국어 자판으로 쓰세요'), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', oninput: changed });
      typeBox = U.el('div', { class: 'hidden typebox' }, typeInp);   // T146u M5 지시 되풀이('No pen?…') 뺌
      switchBtn = U.btn(U.tx('Type instead', '타자로 쓰기'), 'ghost xs', function () { setTyping(!typing); }, { 'data-act': 'type-toggle' });
    }
    function penBtn(c, en, ko, act) {
      var b = U.btn([U.el('span', { class: 'pen-dot', style: { background: c } }), U.tx(en, ko)], 'ghost xs' + (c === pen ? ' on' : ''), function () {
        pen = c; [penK, penR].forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }, { 'data-act': act, 'aria-pressed': c === pen ? 'true' : 'false' });
      return b;
    }
    var penK = penBtn(INK, 'Black', '검정', 'pen-black'), penR = penBtn(RED, 'Red', '빨강', 'pen-red');
    var penRow = U.el('div', { class: 'actions pen-row' }, penK, penR, U.el('span', { class: 'tiny grow', 'data-act': 'pen-note' }, U.tx('Red = words you looked up. No points off.', '빨강 = 찾아보고 쓴 말. 감점 없어요.')));
    var tools = U.el('div', { class: 'actions pad-tools' },
      U.btn(U.tx('Undo', '되돌리기'), 'ghost xs', function () { strokes.pop(); redraw(); changed(); }, { 'data-act': 'undo' }),
      U.btn(U.tx('Clear', '지우기'), 'ghost xs', function () { strokes = []; photo = null; layout(); redraw(); changed(); }, { 'data-act': 'clear' }),
      U.el('span', { class: 'grow' }),
      U.btn([U.icon('camera'), U.tx('Take photo', '사진 찍기')], 'ghost xs', function () { U.camera().then(usePhoto); }, { 'data-act': 'photo' }),
      U.btn([U.icon('image'), U.tx('Choose file', '사진 고르기')], 'ghost xs', function () { file.value = ''; file.click(); }, { 'data-act': 'photo-pick' }));
    wrap.appendChild(penRow); wrap.appendChild(pad); wrap.appendChild(paperBox); wrap.appendChild(photoBox); wrap.appendChild(tools); wrap.appendChild(file);
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
        x.setTransform(2, 0, 0, 2, (-minX + pad2) * 2, (-minY + pad2) * 2); x.lineCap = 'round'; x.lineJoin = 'round';
        strokes.forEach(function (s) { x.strokeStyle = s.c === RED ? RED : '#111'; for (var i = 1; i < s.length; i++) { x.lineWidth = s[i].w; x.beginPath(); x.moveTo(s[i - 1].x, s[i - 1].y); x.lineTo(s[i].x, s[i].y); x.stroke(); } });
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
