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
  /** T146zv 소리 재생 = 진짜 실패만 알림. play() 거절 중 AbortError(앞 소리를 멈추거나 새 소리로 바꿈)·이미 다른 소리로 바뀜·실제로는 재생 중 = 알림 0.
      fail() 은 0.6초 뒤에도 소리가 안 나갈 때(멈춤 + 0초)만 한 번 */
  /** T090 재생 속도(학생이 듣는 소리 전부): 0.75× / 1× / 1.25× [기본안] · 이 기기에 마지막 선택 기억(hw_rate) · 음 높이 유지(preservesPitch).
      모양 = 소리 단추 바로 오른쪽 작은 알약 '1×' 하나, 누르면 1× → 0.75× → 1.25× → 1× (앱 T090 과 같은 꼴). 화면의 알약은 모두 같은 값 */
  /* T090b: 0.5× ~ 2.0× 0.1 간격 [기본안], 알약을 누르면 아래에서 고르기 띠(가로로 밀어 고름, 가운데 = 고른 값)가 올라옴. 옛 값 0.75·1.25 는 가까운 0.1 값으로 */
  U.RATES = []; (function () { for (var i = 5; i <= 20; i++) U.RATES.push(i / 10); })();
  U.normRate = function (v) { v = Number(v); if (!isFinite(v) || v <= 0) return 1; v = Math.round(v * 10) / 10; return Math.min(2, Math.max(0.5, v)); };
  U.rate = function () { return U.normRate(U.store.get('hw_rate', 1)); };
  U.applyRate = function (au) {
    if (!au) return au;
    var r = U.rate();
    try { au.preservesPitch = true; au.mozPreservesPitch = true; au.webkitPreservesPitch = true; au.defaultPlaybackRate = r; au.playbackRate = r; } catch (e) { /* 옛 브라우저 */ }
    return au;
  };
  function rateTxt(r) { return String(r) + '×'; }
  U.setRate = function (r) {
    r = U.normRate(r);
    U.store.set('hw_rate', r);
    document.querySelectorAll('[data-act=rate]').forEach(function (b) { b.textContent = rateTxt(r); b.setAttribute('aria-label', U.tx('Playback speed ', '재생 속도 ') + rateTxt(r)); b.setAttribute('data-rate', String(r)); });
    document.querySelectorAll('audio').forEach(U.applyRate);
    if (PLAYING) U.applyRate(PLAYING);
    if (U._rateHook) U._rateHook();
  };
  U.speedPill = function (cls) {
    var r = U.rate();
    return U.el('button', { class: 'rate-pill' + (cls ? ' ' + cls : ''), type: 'button', 'data-act': 'rate', 'data-rate': String(r), 'aria-label': U.tx('Playback speed ', '재생 속도 ') + rateTxt(r),
      'aria-haspopup': 'dialog',
      onclick: function (e) { e.stopPropagation(); e.preventDefault(); U.ratePicker(); } }, rateTxt(r));
  };
  /** T090b 속도 고르기 띠: 화면 아래 시트 하나(넘침 0), 가로 스크롤 + scroll-snap, 멈춘 곳 가운데 값 = 바로 적용(재생 중에도).
      값을 눌러도 고름 · ←/→ 키 · 바깥/Done = 닫기. 한 번에 하나만 */
  U.ratePicker = function () {
    var old = document.querySelector('.rate-sheet'); if (old) { old.remove(); }
    var shade = U.el('div', { class: 'rate-shade', 'data-act': 'rate-close' });
    var cur = U.el('div', { class: 'rate-cur', 'aria-live': 'polite' }, rateTxt(U.rate()));
    var strip = U.el('div', { class: 'rate-strip', role: 'listbox', tabindex: '0', 'aria-label': U.tx('Playback speed', '재생 속도') });
    var items = U.RATES.map(function (v) {
      var it = U.el('button', { class: 'rate-opt', type: 'button', role: 'option', 'data-v': String(v), 'data-act': 'rate-opt',
        onclick: function (e) { e.stopPropagation(); go(v, true); } }, rateTxt(v));
      strip.appendChild(it); return it;
    });
    var done = U.el('button', { class: 'btn rate-done', type: 'button', 'data-act': 'rate-done', onclick: close }, U.tx('Done', '확인'));
    var sheet = U.el('div', { class: 'rate-panel', role: 'dialog', 'aria-label': U.tx('Playback speed', '재생 속도') },
      U.el('div', { class: 'rate-head' }, U.el('span', { class: 'rate-title' }, U.tx('Speed', '속도')), cur),
      U.el('div', { class: 'rate-wheel' }, strip), done);
    function mark(v) {
      items.forEach(function (it) { var on = Number(it.getAttribute('data-v')) === v; it.classList.toggle('on', on); it.setAttribute('aria-selected', on ? 'true' : 'false'); });
      cur.textContent = rateTxt(v);
    }
    function centerOf(it) { return it.offsetLeft + it.offsetWidth / 2 - strip.clientWidth / 2; }
    function go(v, smooth) {
      v = U.normRate(v); var it = items[U.RATES.indexOf(v)]; if (!it) return;
      lock = true; try { strip.scrollTo({ left: centerOf(it), behavior: smooth ? 'smooth' : 'auto' }); } catch (e) { strip.scrollLeft = centerOf(it); }
      setTimeout(function () { lock = false; }, smooth ? 400 : 50);
      mark(v); if (v !== U.rate()) U.setRate(v);
    }
    var lock = false, tmr = null;
    strip.addEventListener('scroll', function () {
      if (lock) return;
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        var mid = strip.scrollLeft + strip.clientWidth / 2, best = null, bd = 1e9;
        items.forEach(function (it) { var d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = it; } });
        if (best) { var v = Number(best.getAttribute('data-v')); mark(v); if (v !== U.rate()) U.setRate(v); }
      }, 90);
    }, { passive: true });
    strip.addEventListener('keydown', function (e) {
      var i = U.RATES.indexOf(U.rate());
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(U.RATES[Math.max(0, i - 1)], true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(U.RATES[Math.min(U.RATES.length - 1, i + 1)], true); }
      else if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); }
    });
    function close(e) { if (e) e.stopPropagation(); wrap.remove(); }
    shade.addEventListener('click', close);
    var wrap = U.el('div', { class: 'rate-sheet' }, shade, sheet);
    document.body.appendChild(wrap);
    go(U.rate(), false);
    try { strip.focus({ preventScroll: true }); } catch (e) { /* 옛 브라우저 */ }
    return wrap;
  };
  U.playSafe = function (au, fail, alive) {
    var said = false;
    U.applyRate(au);   // T090
    au.addEventListener('play', function () { U.applyRate(au); });   // 소리를 새로 열면(load) 브라우저가 속도를 1로 되돌림
    function bad(e) {
      if (said || (e && e.name === 'AbortError') || (alive && !alive())) return;
      setTimeout(function () { if (said || (alive && !alive())) return; if (!au.paused && au.currentTime > 0) return; if (au.ended) return; said = true; if (fail) fail(e); }, 600);
    }
    au.addEventListener('error', function () { bad(au.error); });
    try { var p = au.play(); if (p && p.catch) p.catch(bad); } catch (e) { bad(e); }
    return au;
  };
  /** T146zv 소리 플레이어 하나(학생 녹음·선생님 목소리 다시 듣기): [재생/멈춤] [진행 막대] [0:03 / 0:07]. 브라우저 기본 컨트롤 0.
      src = 주소 · opts.sec = 길이(녹음 Blob 은 브라우저가 길이를 모를 때가 있음) · opts.auto = 바로 재생 */
  var PLAYING = null;
  U.player = function (src, opts) {
    opts = opts || {};
    var au = new Audio(); au.preload = 'metadata'; au.src = src;
    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
    function dur() { return isFinite(au.duration) && au.duration > 0 ? au.duration : +opts.sec || 0; }
    var ico = U.el('span', { class: 'pl-ico', 'aria-hidden': 'true' }), bar = U.el('span', { class: 'pl-fill' }),
      track = U.el('span', { class: 'pl-track', role: 'slider', 'aria-label': U.tx('Position', '위치'), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', tabindex: '-1' }, bar),
      time = U.el('span', { class: 'pl-time', 'data-act': 'player-time' }, '0:00');
    var b = U.el('button', { class: 'pl-btn', type: 'button', 'aria-label': U.tx('Play', '재생'), 'data-act': 'player-play' }, ico);
    var box = U.el('div', { class: 'player', 'data-act': opts.act || 'player', 'data-state': 'paused' }, b, track, time, U.speedPill('in-player'));   // T090 속도
    box._audio = au;
    function paint() {
      var d = dur(), c = au.currentTime || 0, pct = d ? Math.min(100, c / d * 100) : 0;
      bar.style.width = pct + '%'; track.setAttribute('aria-valuenow', String(Math.round(pct)));
      time.textContent = (c > 0 || !au.paused ? fmt(c) + ' / ' : '') + fmt(d);
    }
    function state(s) { box.setAttribute('data-state', s); b.setAttribute('aria-label', s === 'playing' ? U.tx('Pause', '멈춤') : U.tx('Play', '재생')); }
    au.addEventListener('loadedmetadata', paint); au.addEventListener('durationchange', paint); au.addEventListener('timeupdate', paint);
    au.addEventListener('playing', function () { state('playing'); paint(); });
    au.addEventListener('pause', function () { state('paused'); paint(); });
    au.addEventListener('ended', function () { state('paused'); try { au.currentTime = 0; } catch (e) { /* 무시 */ } paint(); });
    function play() {
      if (PLAYING && PLAYING !== au) PLAYING.pause();
      PLAYING = au;
      U.playSafe(au, function () { state('paused'); U.toast(U.tx("Can't play the sound", '소리를 틀 수 없어요'), 1500); }, function () { return PLAYING === au; });
    }
    b.onclick = function () { if (au.paused) play(); else au.pause(); };
    track.addEventListener('click', function (e) { var d = dur(), r = track.getBoundingClientRect(); if (!d || !r.width) return; try { au.currentTime = Math.max(0, Math.min(d, (e.clientX - r.left) / r.width * d)); } catch (x) { /* 아직 안 열림 */ } paint(); });
    paint();
    if (opts.auto) play();
    return box;
  };
  /*SP T146zv 줄글 → 구조: 문장마다 한 줄 · 'A: x, y, z' 나 '→' 둘 이상 나열 = 머리말 + 항목 목록. 화면과 검사기(results\T146zv\prose_check.js)가 같은 함수 */
  function spTop(s) {
    var out = [], cur = '', d = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '(' || ch === '‘' || ch === '“' || ch === '[') d++; else if ((ch === ')' || ch === '’' || ch === '”' || ch === ']') && d) d--;
      if (!d && (ch === ',' || ch === ';') && s.charAt(i + 1) === ' ') { out.push(cur); cur = ''; i++; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(function (x) { return x.replace(/^\s*(and|or)\s+/, '').trim(); }).filter(Boolean);
  }
  function structParts(s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); if (!s) return [];
    var sents = [], cur = '', d = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i); cur += ch;
      if (ch === '(' || ch === '‘' || ch === '“') d++; else if ((ch === ')' || ch === '’' || ch === '”') && d) d--;
      if (/[.!?]/.test(ch) && !d && cur.trim().length > 5 && !/(?:^|\s)(?:e\.g|i\.e|etc|vs|cf)\.$/.test(cur)) {
        var q = /['"’”]/.test(s.charAt(i + 1)) ? 1 : 0, nx = s.charAt(i + 2 + q);   // 따옴표 안에서 끝난 문장('…왔어요.' means)은 뒤가 대문자·한글일 때만 나눔
        if (s.charAt(i + 1 + q) === ' ' && (q ? /[A-Z]/.test(nx) : !/[a-z.]/.test(nx) && s.charAt(i - 1) !== '.')) { cur += q ? s.charAt(i + 1) : ''; i += q; sents.push(cur.trim()); cur = ''; }
      }
    }
    if (cur.trim()) sents.push(cur.trim());
    return sents.map(function (x) {
      var c = x.indexOf(': '), body = x.replace(/[.]$/, '');
      if (c > 0 && c < 140) { var it = spTop(body.slice(c + 2)); if (it.length >= 3 && it.every(function (y) { return y.length <= 70; })) return { lead: x.slice(0, c + 1), items: it }; }
      if ((x.match(/→/g) || []).length >= 2) { var it2 = spTop(body); if (it2.length >= 2) return { lead: '', items: it2 }; }
      var ch3 = /^(.*?)(\S+(?: → \S+){2,})(.*)$/.exec(body);   // 순서 사슬 '어제 → 오늘 → 내일 → 모레' = 항목 줄(가로)
      if (ch3) return { lead: (ch3[1] + ch3[3]).trim().replace(/\s+(?:is|are|는|은)?\s*$/, ''), items: ch3[2].split(' → '), chain: true, raw: x };
      return { lead: x, items: [] };
    });
  }
  /*SP-END*/
  U.structParts = structParts;
  /** 설명 글 → 노드: 한 문장 = <p> 하나 그대로, 여러 문장 = 줄마다 <p>, 나열 = 머리말 + <ul> */
  U.structNode = function (text, lang, cls) {
    var parts = structParts(text);
    if (parts.length <= 1 && !(parts[0] && parts[0].items.length)) return U.el('p', { class: 'st-p' + (cls ? ' ' + cls : ''), lang: lang || null }, String(text || ''));
    return U.el('div', { class: 'st-text' + (cls ? ' ' + cls : ''), lang: lang || null, 'data-act': 'struct' }, parts.map(function (p) {
      if (p.chain) return U.el('p', { class: 'st-p' }, p.raw.replace(/(\S+(?: → \S+){2,})/, ''), U.el('span', { class: 'st-chain' }, p.items.map(function (y, i) { return [i ? U.el('span', { class: 'st-arr', 'aria-hidden': 'true' }, '→') : null, U.el('b', {}, y)]; })));
      return [p.lead ? U.el('p', { class: 'st-p' }, p.lead) : null, p.items.length ? U.el('ul', { class: 'st-list' }, p.items.map(function (y) { return U.el('li', {}, y); })) : null];
    }));
  };
  /* T146zx 말하기 문제 단서(R61): 나열형 문제(':' 뒤 · → 쉼표, 괄호 안 ·, 띄어 쓴 ' · ' 3개 이상) → 단서 목록. 짝 = tools/speak_cues.py (고치면 둘 다) */
  var SC_START = [[/인사|greet/i, 0, '안녕하세요.', '안녕하십니까.'], [/^이름|^name/i, 0, '저는 ___이에요/예요.', '저는 ___입니다.'], [/나라|출신|country/i, 1, '___에서 왔어요.', '___에서 왔습니다.'],
    [/하는 일|직업|^job|^work/i, 1, '저는 ___에서 일해요.', '저는 ___에서 일합니다.'], [/이유|^why/i, 2, '___ 때문에 한국어를 배워요.', '___ 때문에 한국어를 배웁니다.'], [/다짐|마무리|promise|closing/i, 2, '앞으로 열심히 할게요.', '앞으로 열심히 하겠습니다.']];   // [기본안] 레벨 안 시작 표현
  function scSplit(x, en) {
    var s = String(x || '').replace(/\s+/g, ' ').trim(); if (!s) return null;
    s = s.replace(/[.。]\s*$/, '');
    var lim = en ? 40 : 24, lead = '', body = s, m = /^([^:：]{2,60})[:：]\s*(.+)$/.exec(s), items = null, pm = /\(([^()]*·[^()]*)\)/.exec(s);
    if (m) { lead = m[1].trim(); body = m[2].trim(); }
    if (pm && !m) { var pp = pm[1].split(/\s*·\s*/).filter(function (y) { return y.trim(); }); if (pp.length >= 2) return [(s.slice(0, pm.index) + s.slice(pm.index + pm[0].length)).trim(), pp.map(function (y) { return y.trim(); }), '']; }
    var seps = m ? [/\s*·\s*/, /\s*→\s*/] : [/\s+·\s+/, /\s*→\s*/];
    for (var i = 0; i < seps.length && !items; i++) { var p = body.split(seps[i]).filter(function (y) { return y.trim(); }); if (p.length >= (m ? 2 : 3)) items = p; }
    if (!items && (lead || en)) { var pc = body.split(/\s*,\s*/).filter(function (y) { return y.trim(); }); if (pc.length >= 3) items = pc; }
    if (!items) return null;
    items = items.map(function (y) { return y.trim().replace(/^(?:and|or|then)\s+/i, '').trim().replace(/^[ .]+|[ .]+$/g, ''); });
    var tail = '', mm = /^(.+?)[.。!?]\s+(.+)$/.exec(items[items.length - 1]);
    if (mm) { items[items.length - 1] = mm[1].trim(); tail = mm[2].trim(); }
    if (items.length > 9 || items.some(function (y) { return !y || y.length > lim; })) return null;
    return [lead, items, tail];
  }
  /** 시작 표현 하나 (학생 레벨 안, 문제 높임 따라) [기본안] */
  U.cueStart = function (ko, en, reg, lv) {
    var out = ''; lv = typeof lv === 'number' ? lv : (/\d/.exec(String(lv || '')) ? Number(/\d/.exec(String(lv))[0]) : 0);
    SC_START.some(function (r) { if (lv >= r[1] && (r[0].test(ko || '') || r[0].test(en || ''))) { out = reg === 'formal' ? r[3] : r[2]; return true; } return false; });
    return out;
  };
  U.speakCues = function (ko, en, level) {
    var k = scSplit(ko), e = en ? scSplit(en, true) : null; if (!k && !e) return null;
    var reg = /면접|격식|합니다|습니다|십시오|interview|formal/i.test((ko || '') + ' ' + (en || '')) ? 'formal' : 'polite';
    var lv = /\d/.exec(String(level || '')); lv = lv ? Number(lv[0]) : 0;
    var ki = k ? k[1] : [], ei = e ? e[1] : [];
    if (k && e && ei.length !== ki.length) ei = [];
    var base = ki.length ? ki : ei;
    return { lead_ko: k ? k[0] : String(ko || '').replace(/\s+/g, ' ').trim(), lead_en: e ? e[0] : (en || ''), tail_ko: k ? k[2] : '', tail_en: e ? e[2] : '', reg: reg,
      items: base.map(function (x, i) {
        var ko_i = ki.length ? x : '', en_i = ei.length && ki.length ? ei[i] : (ki.length ? '' : x);
        return { ko: ko_i, en: en_i, start: U.cueStart(ko_i, en_i, reg, lv) };
      }) };
  };
  /** 단서 상자: 머리말(설정 언어) + 번호 목록(한국어 단서 + 작은 영어 + 시작 표현) — 서버 cues 가 있으면 그것, 없으면 글에서 나눔 */
  U.cueNode = function (c) {
    if (!c || !c.items || c.items.length < 2) return null;
    var en = U.lang() !== 'ko', lead = en ? (c.lead_en || c.lead_ko) : (c.lead_ko || c.lead_en), tail = en ? (c.tail_en || c.tail_ko) : (c.tail_ko || c.tail_en);
    return U.el('div', { class: 'cues2', 'data-act': 'cues' },
      lead ? U.el('p', { class: 'cue-lead', lang: lead === c.lead_ko ? 'ko' : 'en' }, lead) : null,
      U.el('ol', { class: 'cue-list' }, c.items.map(function (x) {
        return U.el('li', {}, x.ko ? U.el('span', { class: 'cue-ko', lang: 'ko' }, x.ko) : null, x.en ? U.el('span', { class: x.ko ? 'cue-en' : 'cue-ko', lang: 'en' }, x.en) : null,
          x.start ? U.el('span', { class: 'cue-start', lang: 'ko', 'data-act': 'cue-start' }, x.start) : null);
      })),
      tail ? U.el('p', { class: 'cue-tail', lang: tail === c.tail_ko ? 'ko' : 'en' }, tail) : null);
  };
  /** T146zx 메모 칸(접힘 'Notes'): 녹음 전 낱말 적기. 이 기기에만 저장(제출물 아님) [기본안] */
  U.notesNode = function (id) {
    var k = 'hw_note_' + id, v = U.store.get(k, '') || '';
    var ta = U.el('textarea', { class: 'notes-ta', rows: '4', lang: 'ko', 'data-act': 'notes-text', placeholder: U.tx('Key words before you speak…', '말하기 전에 낱말을 적어요…'), 'aria-label': U.tx('Notes', '메모') });
    ta.value = v;
    var tmr = null; ta.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { U.store.set(k, ta.value); }, 300); });
    ta.addEventListener('blur', function () { U.store.set(k, ta.value); });
    var d = U.el('details', { class: 'notes2', 'data-act': 'notes' }, U.el('summary', {}, U.tx('Notes', '메모'), U.el('span', { class: 'notes-sub' }, U.tx(' · only on this phone', ' · 이 폰에만 저장'))), ta);
    if (v) d.open = true;
    return d;
  };
  U.store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  /** T146zp 저장 공간 비우기: 서버에서 다시 받을 수 있는 화면 저장본만 지움 (답 줄 hw2_outbox_* 은 건드리지 않음) */
  U.freeStore = function () {
    try { for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && /^hw_day_/.test(k)) localStorage.removeItem(k); } } catch (e) { /* 무시 */ }
  };
  /** T146zp 저장 실패를 서버 기록으로 (선생님·부서가 봄). 실패해도 화면엔 영향 없음 */
  U.clientLog = function (key, kind, data) {
    if (U.PREVIEW || !key || !window.HW_CONFIG || !window.HW_CONFIG.API_URL) return;
    try { U.call0('student.client_log', { key: key, kind: kind, data: data || {} }).catch(function () {}); } catch (e) { /* 무시 */ }
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
  /* T146zb bg = 화면이 기다리지 않는 호출(기기 줄 보내기·뒤에서 새 값 받기) → 줄·알약 안 보임 (선생님 11/01 'Sending…이 자주 보임') */
  U.call = function (action, payload, bg) {
    if (bg) return U.call0(action, payload);
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
  U.PREVIEW_WRITES = ['student.open', 'student.notif', 'student.step', 'student.skip', 'student.skip_task', 'student.mark', 'student.consent', 'student.push_sub', 'student.device', 'student.check_save'];
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
  /** T090b 품사만 다른 답(교환 ↔ 교환하다 · 조용히 ↔ 조용하다) → { target, mine, theirs } (mine/theirs = 'noun'|'verb'|'adverb'), 아니면 null.
      [기본안] 뜻은 맞음 = '거의 맞음'(close) 점수 + 한 줄 설명. 하다 꼴은 해요·했어요·합니다·해 도 같은 하다로 봄 */
  var HA_END = ['하다', '해요', '했어요', '합니다', '해', '했다', '할게요', '하세요'];
  function koNorm(s) { return String(s || '').replace(/\s+/g, '').replace(/[.?!~]+$/, ''); }
  function haStem(s) { for (var i = 0; i < HA_END.length; i++) { var e = HA_END[i]; if (s.length > e.length && s.slice(-e.length) === e) return s.slice(0, -e.length); } return null; }
  U.posDiff = function (answer, targets) {
    var a = koNorm(answer); if (!/[가-힣]/.test(a)) return null;
    for (var i = 0; i < (targets || []).length; i++) {
      var tg = koNorm(String(targets[i]).replace(/\s*\(.*?\)\s*/g, '')); if (!tg || tg === a) continue;
      var ta = haStem(tg), aa = haStem(a), tAdv = tg.length > 1 && tg.slice(-1) === '히' ? tg.slice(0, -1) : null, aAdv = a.length > 1 && a.slice(-1) === '히' ? a.slice(0, -1) : null;
      if (ta && ta.length >= 1 && a === ta) return { target: targets[i], mine: 'noun', theirs: 'verb' };
      if (aa && aa.length >= 1 && aa === tg) return { target: targets[i], mine: 'verb', theirs: 'noun' };
      if (tAdv && aa === tAdv) return { target: targets[i], mine: 'verb', theirs: 'adverb' };
      if (aAdv && ta === aAdv) return { target: targets[i], mine: 'adverb', theirs: 'verb' };
    }
    return null;
  };
  /** 카드 쓴 답 채점 = Hangul.check + 품사만 다르면 'close' + pd */
  U.cardCheck = function (v, c) {
    var tg = U.cardTargets(c), ck = window.Hangul.check(v, tg);
    if (ck.status !== 'correct') { var pd = U.posDiff(v, tg); if (pd) { ck.status = 'close'; ck.target = pd.target; ck.pd = pd; ck.credit = Math.max(ck.credit || 0, 0.75); } }
    return ck;
  };
  var POS_NAME = { noun: ['a noun', '명사'], verb: ['a verb', '동사'], adverb: ['an adverb', '부사'] };
  U.posLine = function (pd) {
    if (!pd) return null;
    var m = POS_NAME[pd.mine], t = POS_NAME[pd.theirs];
    return U.el('p', { class: 'hint1 pos-note', 'data-act': 'pos-note' },
      U.tx('Right meaning, different part of speech: you wrote ' + m[0] + '; this card is ' + t[0] + ' (', '뜻은 맞아요, 품사가 달라요: 쓴 말은 ' + m[1] + ', 이 카드는 ' + t[1] + '예요 ('),
      U.el('b', { lang: 'ko' }, String(pd.target)), ').');
  };
  /** T090b 카드 앞면 품사·뜻 갈림 = 플래시카드 데이터(web/cn 의 pe·amb·ax, 앱 t90) 그대로. 과제 쪽에서 만들지 않음 */
  U.posTag = function (c, wordEl) {
    U.cardNote(c).then(function (n) {
      if (!n || !n.pe || !wordEl || !wordEl.isConnected || !wordEl.parentNode) return;
      var box = U.el('p', { class: 'pos-tag', 'data-act': 'pos-tag', lang: 'en' }, U.el('span', { class: 'pos-pe' }, n.pe));
      if (n.amb && n.ax) box.appendChild(U.el('span', { class: 'pos-ax', 'data-act': 'pos-ax' }, n.ax));
      wordEl.parentNode.insertBefore(box, wordEl.nextSibling);
    });
  };
  /** T146g 단어 카드 뒷면 = 플래시카드 앱과 같은 데이터(tools/card_notes.py → web/cn/<nn>.json). nn = 글자 코드 합 % 256 */
  /** T146zc (선생님 11/02 Diamonique) 로마자 = 한국어가 보이는 모든 칸. 칸마다 romanNode 를 붙이지 않고 화면에 붙는 글을 한 번에 봄(MutationObserver).
   *  ① lang="ko" 칸(가장 바깥) = 아래 작은 줄(지문은 줄마다), 짧은 inline 칸은 뒤에 (…) ② 영어 글 속 한글(선생님 설명·꼴 안내) = 한글 덩어리 뒤 (…)
   *  뺌 = 입력칸·첫 글자 힌트·발음 [ ]·채점 diff·버튼·위아래 줄·설정 미리 보기·이미 로마자 짝이 있는 칸. 끄면 아무것도 안 함(다음 그리기 때 사라짐). */
  var RZ_SKIP = 'input,textarea,select,script,style,.roman,[data-act="ko-hint"],[data-act="pron"],[data-act="pron-box"],[data-act="pron-note"],.diff,.lprev,[data-act="lang-preview"],.bar-top,.foot,.pvbar,.sheet,[data-noroman],[data-act="hub-homework"]';
  var RZ_HG = /[가-힣]/, RZ_RUN = /[가-힣]+(?:\s+[가-힣]+)*/g;
  var rzDone = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  function rzSpan(r, cls) { return U.el('span', { class: 'roman ' + cls, lang: 'ko-Latn', 'data-act': 'roman' }, r); }
  function rzHasPair(u) {
    if (u.querySelector('.roman')) return true;
    var n = u.nextElementSibling, pn = u.parentElement && u.parentElement.nextElementSibling;
    return !!((n && n.classList.contains('roman')) || (u.parentElement && u.parentElement.classList.contains('mk') && pn && pn.classList.contains('roman')));
  }
  function rzUnit(u) {   // ① 한국어 칸
    if (rzDone.has(u)) return; rzDone.add(u);
    if (rzHasPair(u) || !RZ_HG.test(u.textContent)) return;
    var R = window.Pron.roman, inl = /^inline/.test(getComputedStyle(u).display) && u.textContent.length <= 24;
    if (inl) { var r0 = R(u.textContent.trim()); if (r0) u.appendChild(rzSpan(' (' + r0 + ')', 'in')); return; }
    // 줄마다: 줄바꿈 글 노드 앞에 그 줄 로마자(block)를 넣고 줄바꿈 하나를 뺌 (pre-wrap 지문에서 빈 줄이 늘지 않게)
    var line = '', kids = [].slice.call(u.childNodes), any = false;
    kids.forEach(function (n) {
      if (n.nodeType === 3 && /\n/.test(n.textContent) && !/\S/.test(n.textContent)) {
        if (RZ_HG.test(line)) { u.insertBefore(rzSpan(R(line.trim()), 'sm ln'), n); n.textContent = n.textContent.replace('\n', ''); any = true; }
        line = ''; return;
      }
      line += n.textContent;
    });
    if (RZ_HG.test(line)) u.appendChild(rzSpan(R(line.trim()), any ? 'sm ln' : 'sm'));
  }
  function rzMixed(tn) {   // ② 영어 글 속 한글
    rzDone.add(tn);
    var s = tn.textContent, out = [], last = 0, m; RZ_RUN.lastIndex = 0;
    while ((m = RZ_RUN.exec(s))) { out.push(document.createTextNode(s.slice(last, m.index + m[0].length))); out.push(rzSpan(' (' + window.Pron.roman(m[0]) + ')', 'in')); last = m.index + m[0].length; }
    if (!out.length) return;
    if (last < s.length) out.push(document.createTextNode(s.slice(last)));
    var p = tn.parentNode; out.forEach(function (x) { if (x.nodeType === 3) rzDone.add(x); p.insertBefore(x, tn); }); p.removeChild(tn);
  }
  U.romanize = function (root) {
    if (!rzDone || !U.roman() || !window.Pron || !window.Pron.roman || !root) return 0;
    var units = [], mixed = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), tn;
    while ((tn = tw.nextNode())) {
      if (rzDone.has(tn) || !RZ_HG.test(tn.textContent)) continue;
      var pe = tn.parentElement; if (!pe || pe.closest(RZ_SKIP)) continue;
      var ko = pe.closest('[lang="ko"]');
      if (ko) { var up; while ((up = ko.parentElement && ko.parentElement.closest('[lang="ko"]'))) ko = up; if (units.indexOf(ko) < 0) units.push(ko); continue; }
      var en = pe.closest('[lang="en"]');
      if (en || /[A-Za-z]/.test(tn.textContent)) mixed.push(tn); else rzDone.add(tn);   // 한국어 화면 글(버튼 밖 안내 등)은 그대로
    }
    units.forEach(function (u) { if (!u.closest(RZ_SKIP)) rzUnit(u); });
    mixed.forEach(rzMixed);
    return units.length + mixed.length;
  };
  /** 학생 화면 root 를 지켜봄: 그린 뒤·늦게 온 노트(cardNote)·예문 영어 모두 다음 프레임에 한 번 */
  U.romanWatch = function (root) {
    if (!root || typeof MutationObserver === 'undefined' || root._rzw) return;
    var queued = false; root._rzw = 1;
    var run = function () { queued = false; try { U.romanize(root); } catch (e) { /* 로마자가 화면을 막지 않게 */ } };
    new MutationObserver(function () { if (!queued && U.roman()) { queued = true; (window.requestAnimationFrame || setTimeout)(run); } }).observe(root, { childList: true, subtree: true, characterData: true });
    run();
  };
  U.cnKey = function (ko) { var h = 0; Array.from(String(ko || '')).forEach(function (ch) { h = (h + ch.codePointAt(0)) % 256; }); return (h < 16 ? '0' : '') + h.toString(16); };
  var CN = {};
  /** 카드에 맞는 앱 노트 1개 → Promise({x, xe, p, e} 또는 null).
   *  T094d R80 (Chasity 11/07 '-아/어도 돼요' 카드에 '되다 = become' 예문): ① 판정표 d._s['ko\ten'] (tools/cn_sense.py, '' = 맞는 노트 없음)
   *  ② card.note_id ③ 뜻 낱말(CN_STOP 뺌) 겹침 최대 — 하나도 안 겹치면 노트 없음(다른 뜻 노트를 보이지 않음). = cn_sense.default_pick */
  var CN_STOP = ' the and for one someone something with about that this not are was get have very out off its into from but all some who what when how you your ';
  U.cardNote = function (c) {
    var ko = String(c.ko || '').trim(), k = U.cnKey(ko);
    if (!CN[k]) CN[k] = fetch('cn/' + k + '.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete CN[k]; return {}; });
    return CN[k].then(function (d) {
      var list = d[ko] || []; if (!list.length) return null;
      var en = String(c.en || '').trim(), s = d._s && d._s[ko + '\t' + en];
      if (typeof s === 'string') return s ? (list.filter(function (n) { return n.i === s; })[0] || null) : null;
      var hit = list.filter(function (n) { return c.note_id && n.i === c.note_id; })[0]; if (hit) return hit;
      var nm = function (x) { return String(x || '').toLowerCase().replace(/[^a-z ]/g, '').trim(); };
      hit = list.filter(function (n) { return nm(n.en) === nm(en); })[0]; if (hit) return hit;
      var ws = (en.toLowerCase().match(/[a-z]+/g) || []).filter(function (w) { return w.length > 2 && CN_STOP.indexOf(' ' + w + ' ') < 0; });
      var best = list.map(function (n) { var e = String(n.en || '').toLowerCase(); return [ws.filter(function (w) { return e.indexOf(w) >= 0; }).length, n]; })
        .sort(function (a, b) { return b[0] - a[0]; })[0];
      return best[0] > 0 ? best[1] : null;
    });
  };
  /** T146j 카드 예문 영어(tools/ex_en.py → web/xe/<nn>.json {예문: 영어}) → Promise(문자열 또는 '') */
  var XE = {};
  U.exEn = function (ko) {
    ko = String(ko || '').replace(/\s+/g, ' ').trim(); if (!ko) return Promise.resolve('');
    var k = U.cnKey(ko);
    if (!XE[k]) XE[k] = fetch('xe/' + k + '.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete XE[k]; return {}; });
    return XE[k].then(function (d) { var v = d[ko] || ''; return v === U.XE_HIDE ? '' : v; });
  };
  /** T088 입문·초급 예문 중 '자연스러운 영어 + 한국어 구조 그대로'가 안 되는 것 = xe 값 '#hide' → 그 예문 줄을 숨김(tools/ex_en_beginner.py) */
  U.XE_HIDE = '#hide';
  U.exHide = function (ko, node) {
    ko = String(ko || '').replace(/\s+/g, ' ').trim(); if (!ko || !node) return;
    U.exEn(ko); XE[U.cnKey(ko)].then(function (d) { if (d[ko] !== U.XE_HIDE) return; node.hidden = true; node.style.display = "none"; if (node.parentNode) node.parentNode.removeChild(node); });
  };
  /** T146zh R48 읽기 낱말 뜻(tools/read_gloss.py → web/gl/<nn>.json {어절: {display, en}}) → Promise(뜻 또는 null). 과제 gloss 에 없는 어절용 */
  var GL = {}, GLR = {};
  U.readGloss = function (tok, text) {
    tok = String(tok || ''); if (!tok) return Promise.resolve(null);
    var k = U.cnKey(tok);
    if (!GL[k]) GL[k] = fetch('gl/' + k + '.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete GL[k]; return {}; });
    return U.textGloss(text).then(function (o) {
      if (o[tok] && o[tok].en) return o[tok];
      return GL[k].then(function (d) { var g = d[tok]; return g && g.en ? g : null; });
    });
  };
  /** T146zj 지문 열쇠 = 공백 뺀 글자 FNV-1a 32bit (tools/gloss_review.py text_key 와 같음) */
  U.textKey = function (s) {
    s = String(s || '').replace(/\s+/g, ''); var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  };
  /** T146zj 읽기마다 그 지문의 뜻(web/glr/<xx>.json {열쇠: {어절: {display, en}}}) → Promise({어절: 뜻}). 과제 gloss·gl 보다 먼저 */
  U.textGloss = function (text) {
    if (!text) return Promise.resolve({});
    var tk = U.textKey(text), b = tk.slice(0, 2);
    if (!GLR[b]) GLR[b] = fetch('glr/' + b + '.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete GLR[b]; return {}; });
    return GLR[b].then(function (d) { return d[tk] || {}; });
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
  /* T090 lv = 그 카드 과제 난도(서버 과제 줄 lv, '쉬워요' + 카드 정답률 높음 → +1, '어려워요' + 카드 약함 → −1):
     +1 = 힌트 없음 · −1 = 첫 글자 + 남은 글자 수(전□□) · 0 = 위 R34 그대로. tools/day_tilt.py 와 같은 뜻 */
  U.koHint = function (c, lv) {
    var w = String((c && (c.display || c.ko)) || '').replace(/\s*\(.*?\)\s*/g, '').trim(), syl = w.match(/[가-힣]/g) || [];
    var f = w.charAt(0), code = f.charCodeAt(0) - 0xac00;
    if (!syl.length || code < 0 || code > 11171) return '';
    if (Number(lv) > 0) return '';
    if (Number(lv) < 0 && syl.length >= 2) return f + new Array(syl.length).join('□');
    return (syl.length <= 2 ? CHO.charAt(Math.floor(code / 588)) : f) + '…';
  };
  /* T094 (선생님 11/07, 전원) 한국어 답 칸 글자 수 모양 + [힌트]. tools/ko_shape.py 와 같은 규칙.
     모양 = 정답 한글 음절마다 □, 띄어쓰기는 그대로, 끝 음절이 '다'·'요'면 그 글자는 보임(2음절 이상일 때) — 먹다 → □다, 좋아요 → □□요.
     대표 정답 = '/' 앞 첫 꼴, 괄호 설명·문장부호 뺌. 5어절 넘으면 모양 대신 '한 문장' 안내(sentence).
     힌트 = 3음절 이상 첫 음절(도서관 → 도□□), 1~2음절 첫 자음(학교 → ㅎ□, 물 → ㅁ, 먹다 → ㅁ다). */
  /* T094c (대표 결정 11/07) 정답 여럿 = ' / ' 로 나눈 꼴 + 붙은 'A/B'(을/를·아/어)는 두 꼴로 펼침.
     꼴마다 모양이 다르면(음절 수·띄어쓰기·끝 글자) 모양 대신 {multi} = '답 여러 개 가능' 안내, 모양은 같고 힌트만 다르면 hint null(단추 숨김) */
  U.koAlts = function (s) {
    var out = [];
    String(s || '').split(/\s+\/\s*|\s*\/\s+/).forEach(function (p) {
      var vs = /[가-힣]\/[가-힣]/.test(p) ? [0, 1].map(function (k) { return p.replace(/([가-힣]+)\/([가-힣]+)/g, function (m, a, b) { return k ? b : a.length === 1 && b.length > 1 ? a + b.slice(1) : a; }); }) : [p];   // '-아/어야' = 아야·어야 (왼쪽 한 글자 + 오른쪽 꼬리)
      vs.forEach(function (v) { v = v.replace(/\([^)]*\)/g, ' ').replace(/[\/.?!,;:"“”‘’…·]+/g, ' ').replace(/\s+/g, ' ').trim(); if (/[가-힣]/.test(v) && out.indexOf(v) < 0) out.push(v); });
    });
    return out;
  };
  U.koShapeSrc = function (s) { return U.koAlts(s)[0] || ''; };
  U.koShape = function (s) {
    var al = U.koAlts(s);
    if (!al.length) return null;
    var rs = al.map(U.koShape1), r0 = rs[0];
    if (rs.length < 2) return r0;
    if (!rs.every(function (r) { return r0.sentence ? r.sentence : !r.sentence && r.shape === r0.shape; })) return { multi: true, sentence: false, shape: null, hint: null, syl: r0.syl, n: rs.length };
    if (!r0.sentence && rs.some(function (r) { return r.hint !== r0.hint; })) return { shape: r0.shape, hint: null, syl: r0.syl, sentence: false };
    return r0;
  };
  U.koShape1 = function (w) {
    var syl = w.match(/[가-힣]/g) || [];
    if (!syl.length) return null;
    if (w.split(' ').length > 5) return { sentence: true, words: w.split(' ').length, syl: syl.length };
    var last = -1, first = -1;
    for (var i = 0; i < w.length; i++) if (/[가-힣]/.test(w.charAt(i))) { if (first < 0) first = i; last = i; }
    var keep = syl.length >= 2 && /[다요]/.test(w.charAt(last)) ? last : -1;
    function draw(hintAt, hintCh) {
      var o = '';
      for (var j = 0; j < w.length; j++) { var ch = w.charAt(j); o += j === hintAt ? hintCh : j === keep ? ch : /[가-힣]/.test(ch) ? '□' : ch; }
      return o;
    }
    var f = w.charAt(first), hc = syl.length <= 2 ? CHO.charAt(Math.floor((f.charCodeAt(0) - 0xac00) / 588)) : f;
    if (first === keep) hc = CHO.charAt(Math.floor((f.charCodeAt(0) - 0xac00) / 588));
    return { shape: draw(-1), hint: draw(first, hc), syl: syl.length, sentence: false };
  };
  /** T094 답 칸 위 한 줄: 모양(□□요) + [힌트] 단추. st = { used, onHint() } — 누르면 모양 자리에 힌트, 다시 그려도 씀 표시 유지 */
  U.shapeRow = function (ans, st) {
    var sh = U.koShape(ans); st = st || {};
    if (!sh) return null;
    if (sh.sentence) return U.el('p', { class: 'ko-shape sent', 'data-act': 'ko-shape', 'data-sentence': '1' }, U.tx('Answer: one sentence in Korean', '답: 한국어 문장 하나'));
    if (sh.multi) return U.el('p', { class: 'ko-shape multi tiny', 'data-act': 'ko-shape', 'data-multi': '1' }, U.tx('More than one answer works', '답 여러 개 가능'));   // T094c
    var box = U.el('b', { class: 'shape-tx', lang: 'ko', 'data-act': 'ko-shape-tx', 'aria-label': U.tx(sh.syl + ' Korean syllables', '한글 ' + sh.syl + '글자') }, st.used && sh.hint ? sh.hint : sh.shape);
    if (!sh.hint) return U.el('div', { class: 'ko-shape', 'data-act': 'ko-shape', 'data-nohint': '1' }, box);   // T094c 정답마다 첫 음절이 달라 힌트 단추 없음
    var hb = st.used ? U.el('span', { class: 'tiny', 'data-act': 'hint-used' }, U.tx('Hint used', '힌트 씀'))
      : U.btn(U.tx('Hint', '힌트'), 'ghost xs', function () {
        if (st.used) return; st.used = true; box.textContent = sh.hint;
        hb.replaceWith(U.el('span', { class: 'tiny', 'data-act': 'hint-used' }, U.tx('Hint used', '힌트 씀')));
        if (st.onHint) st.onHint();
      }, { 'data-act': 'hint' });
    return U.el('div', { class: 'ko-shape', 'data-act': 'ko-shape' }, box, hb);
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
    // T146zp 서버가 받지 않은 답(no day·no step 등)은 버리지 않고 여기 둠 → 화면 완료 유지 + '저장 안 됨 · 다시 보내기' (7일 지나면 정리)
    this.failKey = this.key + '_failed'; this.failed = (U.store.get(this.failKey, []) || []).filter(function (it) { return it && it.payload && Date.now() - (it.failed_at || 0) < 7 * 864e5; });
    var self = this;
    window.addEventListener('online', function () { self.flush(); });
    // T127 탭이 안 보이면 다시 보내기 멈춤 · 실패 뒤 기다리는 시간(2초→60초) 전에는 15초 타이머도 안 보냄
    var due = function () { if (!document.hidden && Date.now() >= self.next) self.flush(); };
    this.next = 0;
    setInterval(due, 15000);
    document.addEventListener('visibilitychange', due);
    // T146zx 아직 못 보낸 답이 있으면 탭 닫기 전에 한 번 묻기(데스크톱 브라우저만 보임 — 답은 이 기기에 남아 다음에 열면 이어서 보냄)
    window.addEventListener('beforeunload', function (e) { if (self.mem.length && !U.PREVIEW) { e.preventDefault(); e.returnValue = ''; } });
  };
  /** T146zx 보내기 상태 하나: saving(보내는 중) · retry(다시 보내는 중, 1~2번 실패) · stuck(3번 넘게 실패 — 답은 이 폰에) · failed(서버가 안 받음) · saved(모두 저장) */
  U.Outbox.prototype.state = function () {
    var q = this.mem.length, nf = this.failed.length, tries = this.mem.reduce(function (m, it) { return Math.max(m, it.tries || 0); }, 0);
    return { q: q, nf: nf, tries: tries, media: this.mem.filter(function (it) { return it.payload && (it.payload.media || it.payload.media2); }).length,
      s: nf && !q ? 'failed' : !q ? 'saved' : tries >= 3 ? 'stuck' : tries ? 'retry' : 'saving' };
  };
  U.Outbox.prototype.save = function () {
    // T146zp 폰 저장 공간이 차면 답 줄이 저장되지 않아 앱을 닫으면 사라졌음 → 다시 받을 수 있는 화면 저장본(hw_day_*)부터 비우고 다시
    var ok = U.store.set(this.key, this.mem);
    if (!ok) { U.freeStore(); ok = U.store.set(this.key, this.mem); }
    if (!ok) ok = U.store.set(this.key, this.mem.filter(function (m) { return !m.payload.media; }));
    U.store.set(this.failKey, this.failed);
    if (!ok && !this._storeWarned && this.mem[0]) { this._storeWarned = 1; U.clientLog(this.mem[0].payload.key, 'store_fail', { n: this.mem.length }); }
    var n = this.mem.length; this.listeners.forEach(function (f) { f(n); });
  };
  /** T146zp 서버가 받지 않은 답 → 실패 줄(기기에 남김) + 서버 기록. 'already submitted' = 서버에 이미 있음 → 남기지 않음 */
  U.Outbox.prototype.rejected = function (item, msg) {
    if (/already submitted|미리 보기/.test(String(msg || ''))) return;
    item.err = String(msg || 'error').slice(0, 80); item.failed_at = Date.now(); item.tries = 0;
    this.failed.push(item);
  };
  /** T146zp '다시 보내기': 실패 줄을 보낼 줄 뒤로 */
  U.Outbox.prototype.retryFailed = function () {
    if (!this.failed.length) return;
    this.mem = this.mem.concat(this.failed.map(function (it) { delete it.err; it.tries = 0; return it; })); this.failed = [];
    this.save(); this.flush();
  };
  U.Outbox.prototype.onChange = function (f) { this.listeners.push(f); };
  /** T146zy 서버에 닿은 뒤 한 번: 이 기기에 10분 넘게 못 보낸 답·실패 줄이 있으면 '못 보낸 답 N개'를 서버 기록으로 (hw_save_errors 에 pending) */
  U.Outbox.prototype.report = function (key) {
    if (this._reported || U.PREVIEW) return; this._reported = true;
    var now = Date.now(), old = this.mem.filter(function (it) { return now - (it.at || 0) > 600000; }), f = this.failed.length;
    if (!old.length && !f) return;
    var p = (old[0] || this.failed[0] || {}).payload || {};
    U.clientLog(key, 'pending', { n: old.length + f, err: 'queued=' + old.length + ' failed=' + f + ' oldest=' + Math.round((now - Math.min.apply(null, old.concat(this.failed).map(function (it) { return it.at || it.failed_at || now; }))) / 60000) + 'm', dayset_id: p.dayset_id, task_id: p.task_id, step_id: p.step_id });
  };
  U.Outbox.prototype.send = function (action, payload) {
    var self = this;
    if (U.PREVIEW) { var pe = new Error('미리 보기 — 저장 안 함'); pe.server = true; pe.preview = true; return Promise.reject(pe); }
    payload.client_id = payload.client_id || U.cid();
    var item = { action: action, payload: payload, tries: 0, at: Date.now() };
    this.mem.push(item); this.save();
    return new Promise(function (resolve, reject) { item.resolve = resolve; item.reject = reject; self.flush(); });
  };
  /* T146zb 소리·사진 없는 제출이 줄에 여럿이면 한 번에 (student.steps, 최대 20개) — 서버 한 번 여는 데 2~5초라 카드 10장이 50초 → 한 번 */
  U.Outbox.prototype.batch = function () {
    if (this.noBatch || U.PREVIEW) return null;
    var out = [];
    for (var i = 0; i < this.mem.length && out.length < 20; i++) {
      var it = this.mem[i], p = it.payload || {};
      if (it.action !== 'student.step' || p.media || p.media2 || (out.length && p.key !== out[0].payload.key)) break;
      out.push(it);
    }
    return out.length > 1 ? out : null;
  };
  U.Outbox.prototype.flush = function () {
    var self = this;
    if (this.busy || !this.mem.length) return;
    this.busy = true;
    var many = this.batch();
    if (many) {
      U.call('student.steps', { key: many[0].payload.key, items: many.map(function (it) { var q = Object.assign({}, it.payload); delete q.key; return q; }) }, true).then(function (res) {
        var rs = (res && res.results) || [];
        self.mem.splice(0, many.length); self.busy = false; self.wait = 2000; self.next = 0;
        many.forEach(function (it, i) {
          var r = rs[i] || { ok: false, error: 'no result' };
          if (r.ok) { if (it.resolve) it.resolve(r.data); }
          else { self.rejected(it, r.error); if (it.reject) { var e = new Error(r.error); e.server = true; it.reject(e); } }
        });
        self.save();
        self.flush();
      }, function (err) {
        self.busy = false;
        if (err.server && /unknown action/i.test(String(err.message || ''))) { self.noBatch = true; return self.flush(); }   // 옛 서버
        self.fail(many[0], err);
      });
      return;
    }
    var item = this.mem[0];
    U.call(item.action, item.payload, true).then(function (res) {
      self.mem.shift(); self.busy = false; self.wait = 2000; self.next = 0; self.save();
      if (item.resolve) item.resolve(res);
      self.flush();
    }, function (err) { self.busy = false; self.fail(item, err); });
  };
  U.Outbox.prototype.fail = function (item, err) {
    var self = this;
    (function () {
      var transient = err.server && /^server: |lock|timed out|시간/i.test(String(err.message || ''));   // 서버가 바쁨(잠금 대기) → 다시 보냄. 잘못된 요청만 버림
      if (err.server && !transient) { self.mem.shift(); self.rejected(item, err.message); self.save(); if (item.reject) item.reject(err); self.flush(); return; }
      item.tries++; self.save();
      // 화면은 '보낼 예정'으로 — T119: 앞 줄이 막혀 있어도 뒤에 쌓인 제출까지 모두 바로 '저장함'으로 (화면이 '보내는 중…'에 멈추지 않게)
      self.mem.forEach(function (it) { if (it.resolve) { it.resolve({ queued: true }); it.resolve = null; it.reject = null; } });
      self.wait = Math.min(self.wait * 2, 60000); self.next = Date.now() + self.wait;
      setTimeout(function () { if (!document.hidden) self.flush(); }, self.wait);
    })();
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
      box.appendChild(U.player(URL.createObjectURL(result.blob), { sec: result.sec, act: 'my-rec' }));   // T146zv 앱과 같은 작은 플레이어
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

  /* T094 획 모양 = perfect-freehand(MIT, web/vendor) — 손글씨 칸을 처음 만들 때 불러옴, 오기 전·실패면 옛 선 그리기 */
  var UI_BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '');
  U.loadPF = function () {
    if (window.PerfectFreehand || U._pfL) return; U._pfL = 1;
    var sc = document.createElement('script'); sc.src = UI_BASE + 'vendor/perfect-freehand.js'; sc.async = true;
    sc.onerror = function () { U._pfL = 0; }; document.head.appendChild(sc);
  };
  /* T094 펜 획: 펜 = 압력 따라 굵기(thinning), 손가락·마우스 = 고른 굵기(OCR) · streamline 0.3 = 떨림 덜고 끝이 늦지 않게 [기본안] */
  U.PF_OPTS = { pen: { size: 5, thinning: 0.55, smoothing: 0.5, streamline: 0.3, simulatePressure: false }, other: { size: 4.2, thinning: 0.12, smoothing: 0.5, streamline: 0.3, simulatePressure: false } };
  U.strokePath = function (s, done, extra) {
    var PF = window.PerfectFreehand; if (!PF || !window.Path2D || !s || s.length < 2) return null;
    var pts = s.map(function (p) { return [p.x, p.y, p.p || 0.5]; }); if (extra) pts = pts.concat(extra);
    var o = Object.assign({ last: !!done }, U.PF_OPTS[s.t === 'pen' ? 'pen' : 'other']);
    var q = PF.getStroke(pts, o); if (q.length < 3) return null;
    var path = new Path2D(); path.moveTo(q[0][0], q[0][1]);
    for (var i = 1; i < q.length; i++) { var a = q[i], b = q[(i + 1) % q.length]; path.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    path.closePath(); return path;
  };
  U._penSeen = false;   // T094 클래스룸 kwd-board ink.ts hasPenHistory 와 같은 뜻: 이 화면에서 펜을 한 번 쓰면 손가락은 안 그림(모든 손글씨 칸)

  /* ---------- 손글씨 판: 손가락·펜으로 쓰기(펜 압력 반영) 또는 종이 사진 ---------- */
  U.handPad = function (opts) {
    U.loadPF();
    var wrap = U.el('div'), pad = U.el('div', { class: 'pad' }), canvas = U.el('canvas', { 'aria-label': U.tx('Handwriting area', '손글씨 칸') }), strokes = [], cur = null, photo = null;
    var lineOn = U.store.get('hw_pad_line', 1) !== 0;   // T093 세 줄 → 아래 기준선 한 줄 (끄기 가능, 이 기기 기억)
    pad.classList.toggle('noline', !lineOn);
    pad.appendChild(U.el('div', { class: 'guide' })); pad.appendChild(canvas); pad.appendChild(U.el('div', { class: 'hint' }, opts.hint || U.tx('Write here with your finger or pen', '손가락이나 펜으로 여기에 쓰세요')));
    var ctx = canvas.getContext('2d'), dpr = Math.max(1, window.devicePixelRatio || 1);
    var INK = '#1b1a17', RED = '#d0021b', pen = INK;   // T146t 빨간 펜 = 사전·노트를 보고 쓴 말 (채점 감점 없음, 복습 단어로)
    function size() {
      var w = canvas.clientWidth || 320, h = canvas.clientHeight || 240;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        if (base && strokes.length && (base.w !== w || base.h !== h)) {   // T093 크게 쓰기 ↔ 보통: 획을 같은 비율로 (둘 중 작은 쪽)
          var f = Math.min(w / base.w, h / base.h);
          strokes.forEach(function (s) { s._path = null; s.forEach(function (p) { p.x *= f; p.y *= f; }); });
        }
        base = { w: w, h: h }; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); redraw();
      }
    }
    function redraw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.forEach(function (s) {
        var path = s === cur ? U.strokePath(s, false, pred) : (s._path || (s._path = U.strokePath(s, true)));   // T094 다 쓴 획은 한 번만 계산 · 쓰는 획 끝에 예측 점(화면만)
        if (path) { ctx.fillStyle = s.c || INK; ctx.fill(path); return; }
        ctx.strokeStyle = s.c || INK; for (var i = 1; i < s.length; i++) { ctx.lineWidth = s[i].w; ctx.beginPath(); ctx.moveTo(s[i - 1].x, s[i - 1].y); ctx.lineTo(s[i].x, s[i].y); ctx.stroke(); }
      });
    }
    var raf = 0, pred = null;
    function soon() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; redraw(); }); }
    /* T090b (Kitty #19 태블릿: 펜을 대면 글자 전체가 선택되고 획이 끊김) — 판 안에서는 선택·길게 누르기 메뉴·스크롤·확대 0,
       펜이 한 번 닿으면 그 판에서는 손가락·손바닥 무시(펜 압력 그대로), 획 하나 = 포인터 하나(pointerId), 사이 점은 getCoalescedEvents 로 촘촘히.
       pointerleave 로 끊지 않음(포인터 캡처 중엔 판 밖으로 나가도 이어 그림), 끝 = pointerup·pointercancel·lostpointercapture */
    var curId = null, rect = null, base = null, touches = {};
    /* T093 (학생 공통: 손바닥이 닿아 선이 그어짐) 손바닥 = 접촉 폭·높이가 PALM_PX 넘는 touch [기본안] · 손가락은 처음 닿은 하나만(다른 touch 가 닿아 있으면 새 획 0)
       · 손가락 획 중에 펜이 오면 그 획(손바닥일 가능성) 지우고 펜으로 · 쓰는 중 접촉이 커지면(손바닥) 그 획 지움 */
    var PALM_PX = 40;
    function palm(e) { return e.pointerType === 'touch' && ((e.width || 0) > PALM_PX || (e.height || 0) > PALM_PX); }
    function dropCur() { var i = strokes.indexOf(cur); if (i >= 0) strokes.splice(i, 1); cur = null; curId = null; redraw(); }
    function untouch(e) { if (e.pointerType === 'touch') delete touches[e.pointerId]; }
    window.addEventListener('pointerup', untouch, true); window.addEventListener('pointercancel', untouch, true);
    function pt(e, r) { var p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5; return { x: e.clientX - r.left, y: e.clientY - r.top, w: 1.6 + p * 3.2, p: p }; }
    function noDef(e) { if (e.cancelable) e.preventDefault(); }
    ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (ev) { canvas.addEventListener(ev, noDef, { passive: false }); pad.addEventListener(ev, noDef, { passive: false }); });
    function selGuard(e) { if (cur && e.cancelable) e.preventDefault(); }   // 쓰는 중엔 화면 다른 곳 글자 선택도 막음
    document.addEventListener('selectstart', selGuard, { passive: false });
    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'pen') { U._penSeen = true; if (cur && cur.t === 'touch') dropCur(); }   // 손바닥으로 시작된 획 버림
      else if (U._penSeen && e.pointerType === 'touch') { noDef(e); return; }   // 펜을 쓴 화면에서 손바닥·손가락 = 무시
      if (e.pointerType === 'touch') {
        var others = Object.keys(touches).length; touches[e.pointerId] = 1;
        if (others && cur && cur.t === 'touch') { dropCur(); noDef(e); return; }   // T094 ink.ts 와 같음: 두 번째 손가락 = 손바닥·확대 → 지금 획도 버림
        if (others || palm(e)) { noDef(e); return; }   // T093 두 번째 손가락·손바닥 = 무시
      }
      if (cur && curId !== null && curId !== e.pointerId) { noDef(e); return; }   // 두 번째 포인터 = 무시
      if (e.button > 0 && e.pointerType === 'mouse') return;
      size(); rect = canvas.getBoundingClientRect();
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* 옛 브라우저 */ }
      curId = e.pointerId; cur = [pt(e, rect)]; cur.c = pen; cur.t = e.pointerType; ctx.strokeStyle = pen; strokes.push(cur);
      var hn = pad.querySelector('.hint'); if (hn) hn.style.display = 'none';
      try { var sl = window.getSelection && window.getSelection(); if (sl && sl.removeAllRanges) sl.removeAllRanges(); } catch (x) { /* 없음 */ }
      noDef(e);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!cur || e.pointerId !== curId) return;
      if (palm(e)) { dropCur(); noDef(e); return; }   // T093 쓰는 중 접촉이 커짐 = 손바닥
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || []; if (!list.length) list = [e];
      ctx.strokeStyle = cur.c || INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var pf = !!window.PerfectFreehand;
      list.forEach(function (ce) { var p = pt(ce, rect), q = cur[cur.length - 1]; if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) < 0.3) return; cur.push(p); if (!pf) { ctx.lineWidth = p.w; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); } });
      // T094 펜 예측 점(getPredictedEvents, 2개까지) = 화면에만, 다음 움직임에서 버림 — 클래스룸 ink.ts 와 같음
      pred = null;
      if (pf && e.pointerType === 'pen' && e.getPredictedEvents) { var lp = cur[cur.length - 1].p; pred = e.getPredictedEvents().slice(0, 2).map(function (pe) { return [pe.clientX - rect.left, pe.clientY - rect.top, lp]; }); U._predN = (U._predN || 0) + pred.length; }
      if (pf) soon();
      noDef(e);
    });
    function end(e) { if (!cur || (e && e.pointerId !== undefined && e.pointerId !== curId)) return; if (cur.length === 1) { var q = cur[0]; cur.push({ x: q.x + 0.01, y: q.y + 0.01, w: q.w, p: q.p }); } cur = null; curId = null; pred = null; redraw(); changed(); }   // T094 끝나면 예측 점 지우고 다 쓴 획 모양으로   // 점 하나(받침 점·마침표)도 남김
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);
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
      U.attachKoAssist(typeInp);   // T146zh R49
      switchBtn = U.btn(U.tx('Type instead', '타자로 쓰기'), 'ghost xs', function () { setTyping(!typing); }, { 'data-act': 'type-toggle' });
    }
    function penBtn(c, en, ko, act) {
      var b = U.btn([U.el('span', { class: 'pen-dot', style: { background: c } }), U.tx(en, ko)], 'ghost xs' + (c === pen ? ' on' : ''), function () {
        pen = c; [penK, penR].forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }, { 'data-act': act, 'aria-pressed': c === pen ? 'true' : 'false' });
      return b;
    }
    var penK = penBtn(INK, 'Black', '검정', 'pen-black'), penR = penBtn(RED, 'Red', '빨강', 'pen-red');
    var penRow = U.el('div', { class: 'actions pen-row' }, penK, penR, U.el('span', { class: 'tiny grow', 'data-act': 'pen-note' }, U.tx('Red = words you looked up. No points off.', '빨강 = 찾아보고 쓴 말. 감점 없어요.')));
    function undo() { strokes.pop(); redraw(); changed(); }
    function clear() { strokes = []; photo = null; layout(); redraw(); changed(); }
    /* T093 크게 쓰기 = 화면 가득(폭 전체·높이 화면 70% 넘게) + 되돌리기·지우기·다 썼어요. 판(pad)을 통째로 옮겨 획·포인터 처리 그대로 */
    var bigSheet = null, holder = null;
    function bigOpen() {
      if (bigSheet) return;
      holder = U.el('div', { class: 'pad-holder' }); pad.parentNode.insertBefore(holder, pad);
      bigSheet = U.el('div', { class: 'pad-sheet', role: 'dialog', 'aria-label': U.tx('Write big', '크게 쓰기'), 'data-act': 'pad-sheet' },
        U.el('div', { class: 'pad-sheet-top' }, U.el('b', null, U.tx('Write big', '크게 쓰기')), U.el('span', { class: 'grow' }),
          U.btn(U.tx('Done', '다 썼어요'), 'primary sm', bigClose, { 'data-act': 'pad-big-done' })),
        pad,
        U.el('div', { class: 'actions pad-sheet-tools' },
          U.btn(U.tx('Undo', '되돌리기'), 'ghost sm', undo, { 'data-act': 'pad-big-undo' }),
          U.btn(U.tx('Clear', '지우기'), 'ghost sm', clear, { 'data-act': 'pad-big-clear' }),
          U.el('span', { class: 'grow' }),
          U.btn(U.tx('Done', '다 썼어요'), 'primary', bigClose, { 'data-act': 'pad-big-done2' })));
      document.body.appendChild(bigSheet); document.body.classList.add('pad-big-on');
      setTimeout(size, 0);
    }
    function bigClose() {
      if (!bigSheet) return;
      holder.parentNode.insertBefore(pad, holder); holder.remove(); bigSheet.remove(); bigSheet = null; holder = null;
      document.body.classList.remove('pad-big-on'); setTimeout(size, 0); changed();
    }
    var lineBtn = U.btn(U.tx('Line', '기준선'), 'ghost xs' + (lineOn ? ' on' : ''), function () {
      lineOn = !lineOn; U.store.set('hw_pad_line', lineOn ? 1 : 0); pad.classList.toggle('noline', !lineOn);
      lineBtn.classList.toggle('on', lineOn); lineBtn.setAttribute('aria-pressed', lineOn ? 'true' : 'false');
    }, { 'data-act': 'pad-line', 'aria-pressed': lineOn ? 'true' : 'false', 'aria-label': U.tx('Show or hide the guide line', '기준선 보이기·숨기기') });
    var tools = U.el('div', { class: 'actions pad-tools' },
      U.btn(U.tx('Write big', '크게 쓰기'), 'ghost xs', bigOpen, { 'data-act': 'pad-big' }),
      U.btn(U.tx('Undo', '되돌리기'), 'ghost xs', undo, { 'data-act': 'undo' }),
      U.btn(U.tx('Clear', '지우기'), 'ghost xs', clear, { 'data-act': 'clear' }),
      lineBtn,
      U.el('span', { class: 'grow' }),
      U.btn([U.icon('camera'), U.tx('Photo', '사진')], 'ghost xs', function () { U.camera().then(usePhoto); }, { 'data-act': 'photo', 'aria-label': U.tx('Take a photo of your paper', '종이 사진 찍기') }),   // T146zq 보조 단추 = 작은 한 줄
      U.btn([U.icon('image'), U.tx('File', '파일')], 'ghost xs', function () { file.value = ''; file.click(); }, { 'data-act': 'photo-pick', 'aria-label': U.tx('Choose a photo file', '사진 파일 고르기') }));
    wrap.appendChild(penRow); wrap.appendChild(pad); wrap.appendChild(paperBox); wrap.appendChild(photoBox); wrap.appendChild(tools); wrap.appendChild(file);
    if (opts.allowType) { wrap.appendChild(typeBox); wrap.appendChild(U.el('div', { class: 'row' }, U.el('span', { class: 'grow' }), switchBtn)); if (mode0 === 'type') setTimeout(function () { setTyping(true); }, 0); }
    layout();
    setTimeout(size, 0); window.addEventListener('resize', size);
    return {
      node: wrap, ready: ready, big: bigOpen, close: bigClose, _strokes: function () { return strokes; },   // _strokes = 시험용
      /** PNG(흰 바탕, 글씨 둘레만 잘라서) 또는 사진 → {b64, mime, mode} */
      export: function () {
        if (typing) return Promise.resolve({ typed: typeInp.value.trim(), mode: 'typed' });
        if (photo) return U.blobToB64(photo).then(function (b64) { return { b64: b64, mime: photo.type || 'image/jpeg', mode: 'photo' }; });
        var minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
        strokes.forEach(function (s) { s.forEach(function (p) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }); });
        var pad2 = 16, w = Math.max(40, maxX - minX + pad2 * 2), h = Math.max(40, maxY - minY + pad2 * 2);
        var k = Math.min(2, 1400 / Math.max(w, h));   // T093 크게 써도 OCR 되게: 둘레만 자르고 긴 쪽 ≤ 1400px
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
        x.setTransform(k, 0, 0, k, (-minX + pad2) * k, (-minY + pad2) * k); x.lineCap = 'round'; x.lineJoin = 'round';
        strokes.forEach(function (s) { var path = s._path || (s._path = U.strokePath(s, true)); if (path) { x.fillStyle = s.c === RED ? RED : '#111'; x.fill(path); return; } x.strokeStyle = s.c === RED ? RED : '#111'; for (var i = 1; i < s.length; i++) { x.lineWidth = Math.max(s[i].w, 2 / k); x.beginPath(); x.moveTo(s[i - 1].x, s[i - 1].y); x.lineTo(s[i].x, s[i].y); x.stroke(); } });
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
    if (opts.lang === 'ko' && !opts.noAssist) U.attachKoAssist(inp);   // T146zh R49 노트북 한국어 타자
    return inp;
  };
  /* ---------- T146zh R49 노트북 한국어 타자 (11/03 선생님 Chasity: 폰엔 한글 자판이 있는데 노트북은 어려움) [기본안] ----------
     한국어 칸 아래 작은 줄(노트북·마우스 기기만): [한글 자판] [영어 글자로 쓰기 annyeong → 안녕] [이 컴퓨터에 한국어 자판 켜기].
     자판 = 두벌식(누른 자모를 바로 글자로 묶음, 켜 두면 실제 키보드 dkssud → 안녕 도 됨). 로마자 = 소리 나는 대로(했어요 = haesseoyo, 끊기 '-').
     처음 한 번 'Typing Korean on a computer?' 안내. 자판이 없으면 종이 사진·말하기로 답해도 된다는 줄. */
  var CJ = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', VJ = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', TJ = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
  var VV = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
  var TT = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
  function isC(j) { return !!j && CJ.indexOf(j) >= 0; }
  function isV(j) { return !!j && VJ.indexOf(j) >= 0; }
  /** 자모 줄 → 한글 (두벌식 묶기: 받침 뒤에 모음이 오면 받침이 다음 글자로) */
  U.composeJamo = function (s) {
    var a = Array.from(s || ''), out = '', i = 0;
    while (i < a.length) {
      var c = a[i];
      if (isC(c) && isV(a[i + 1])) {
        var v = a[i + 1], n = i + 2, t = '';
        if (VV[v + (a[n] || '')]) { v = VV[v + a[n]]; n++; }
        if (isC(a[n]) && TJ.indexOf(a[n]) > 0 && !isV(a[n + 1])) {
          t = a[n]; n++;
          if (isC(a[n]) && TT[t + a[n]] && !isV(a[n + 1])) { t = TT[t + a[n]]; n++; }
        }
        out += String.fromCharCode(0xAC00 + (CJ.indexOf(c) * 21 + VJ.indexOf(v)) * 28 + (t ? TJ.indexOf(t) : 0));
        i = n;
      } else if (isV(c) && VV[c + (a[i + 1] || '')]) { out += VV[c + a[i + 1]]; i += 2; }
      else { out += c; i++; }
    }
    return out;
  };
  /** 로마자(소리 나는 대로) → 한글. annyeong → 안녕, haesseoyo → 했어요, yeongeo → 영어, '-' = 글자 끊기(han-geul → 한글) */
  var RV = [['yae', 'ㅒ'], ['wae', 'ㅙ'], ['yeo', 'ㅕ'], ['ae', 'ㅐ'], ['ya', 'ㅑ'], ['eo', 'ㅓ'], ['ye', 'ㅖ'], ['wa', 'ㅘ'], ['oe', 'ㅚ'], ['yo', 'ㅛ'], ['wo', 'ㅝ'], ['we', 'ㅞ'], ['wi', 'ㅟ'], ['yu', 'ㅠ'], ['eu', 'ㅡ'], ['ui', 'ㅢ'], ['a', 'ㅏ'], ['e', 'ㅔ'], ['o', 'ㅗ'], ['u', 'ㅜ'], ['i', 'ㅣ']];
  var RC = [['kk', 'ㄲ', 'ㄲ'], ['tt', 'ㄸ', 'ㄸ'], ['pp', 'ㅃ', 'ㅃ'], ['ss', 'ㅆ', 'ㅆ'], ['jj', 'ㅉ', 'ㅉ'], ['ch', 'ㅊ', 'ㅊ'], ['ng', 'ㅇ', 'ㅇ'], ['g', 'ㄱ', 'ㄱ'], ['k', 'ㅋ', 'ㄱ'], ['n', 'ㄴ', 'ㄴ'], ['d', 'ㄷ', 'ㄷ'], ['t', 'ㅌ', 'ㅅ'],
    ['r', 'ㄹ', 'ㄹ'], ['l', 'ㄹ', 'ㄹ'], ['m', 'ㅁ', 'ㅁ'], ['b', 'ㅂ', 'ㅂ'], ['p', 'ㅍ', 'ㅂ'], ['s', 'ㅅ', 'ㅅ'], ['j', 'ㅈ', 'ㅈ'], ['h', 'ㅎ', 'ㅎ']];
  function romanWord(w) {
    var tk = [], i = 0;
    while (i < w.length) {
      if (w[i] === '-' || w[i] === "'") { tk.push({ br: 1 }); i++; continue; }
      var hit = null;
      RV.some(function (x) { if (w.substr(i, x[0].length) === x[0]) { hit = { v: x[1], n: x[0].length }; return true; } return false; });
      if (!hit) RC.some(function (x) { if (w.substr(i, x[0].length) === x[0]) { hit = { c: x[1], t: x[2], r: x[0], n: x[0].length }; return true; } return false; });
      if (!hit) { tk.push({ raw: w[i] }); i++; continue; }
      tk.push(hit); i += hit.n;
    }
    var j = [], onset = false;
    tk.forEach(function (x, k) {
      var prev = tk[k - 1] || {}, next = tk[k + 1] || {};
      if (x.br || x.raw) { if (x.raw) j.push(x.raw); onset = false; return; }
      if (x.v) { if (!onset) j.push('ㅇ'); j.push(x.v); onset = false; return; }
      var coda = !!prev.v && (!next.v || x.r === 'ng' || x.r === 'ss');   // 모음 뒤 + (뒤가 모음 아님 · ng·ss 는 받침으로: 영어·했어요)
      j.push(coda ? x.t : x.c); onset = !coda;
    });
    return U.composeJamo(j.join(''));
  }
  U.romanToHangul = function (s) { return String(s || '').replace(/[a-zA-Z'\-]+/g, function (w) { return romanWord(w.toLowerCase()); }); };
  U.isLaptop = function () { return /[?&#]kb=1/.test(location.search + location.hash) || (!!window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches); };
  var KB = [['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'], ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'], ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']];
  var KB_SH = { 'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ', 'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ' };
  var QW = 'qwertyuiopasdfghjklzxcvbnm', QJ = 'ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔㅁㄴㅇㄹㅎㅗㅓㅏㅣㅋㅌㅊㅍㅠㅜㅡ';
  /** 한국어 칸 아래 도움 줄. inp = input/textarea → node (휴대폰·터치 기기면 null) */
  U.koAssist = function (inp) {
    if (!inp || !U.isLaptop()) return null;
    var wrap = U.el('div', { class: 'koa', 'data-act': 'ko-assist' }), panel = U.el('div', { class: 'koa-panel hidden' });
    var buf = [], base = null, shift = false, kbOn = false, cur = '';
    function fire() { inp.dispatchEvent(new Event('input', { bubbles: true })); }
    function put() { inp.value = base + U.composeJamo(buf.join('')); fire(); }
    function key(j) { if (base === null) { base = inp.value; buf = []; } buf.push(j); put(); }
    function back() { if (base !== null && buf.length) { buf.pop(); put(); } else { inp.value = inp.value.slice(0, -1); fire(); } }
    function commit() { base = null; buf = []; }
    function keep(e) { e.preventDefault(); }   // 자판 단추를 눌러도 칸 초점이 그대로
    inp.addEventListener('mousedown', commit);
    inp.addEventListener('input', function (e) { if (e.isTrusted) commit(); });   // 직접 지우거나 붙여 넣으면 묶던 글자 끝
    inp.addEventListener('keydown', function (e) {   // 자판을 켜면 실제 키보드도 두벌식 (dkssud → 안녕)
      if (!kbOn || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      var k = String(e.key || ''), ix = k.length === 1 ? QW.indexOf(k.toLowerCase()) : -1;
      if (ix >= 0) { e.preventDefault(); var j = QJ[ix]; if (e.shiftKey && KB_SH[j]) j = KB_SH[j]; key(j); }
      else if (k === 'Backspace' && base !== null && buf.length && inp.selectionStart === inp.selectionEnd) { e.preventDefault(); back(); }
      else if (k.length === 1 || k === 'Enter' || k.indexOf('Arrow') === 0) commit();
    });
    function kb() {
      var box = U.el('div', { class: 'koa-kb', role: 'group', 'aria-label': U.tx('Korean keyboard', '한글 자판') });
      function redraw() { panel.innerHTML = ''; panel.appendChild(kb()); }
      KB.forEach(function (row, r) {
        var rw = U.el('div', { class: 'koa-row' });
        if (r === 2) rw.appendChild(U.el('button', { type: 'button', class: 'koa-k wide' + (shift ? ' on' : ''), 'data-act': 'kb-shift', 'aria-pressed': String(shift), 'aria-label': 'Shift (ㄲ ㄸ ㅃ ㅆ ㅉ ㅒ ㅖ)', onmousedown: keep, onclick: function () { shift = !shift; redraw(); } }, '⇧'));
        row.forEach(function (j0) {
          var jj = shift && KB_SH[j0] ? KB_SH[j0] : j0;
          rw.appendChild(U.el('button', { type: 'button', class: 'koa-k', lang: 'ko', 'data-k': jj, onmousedown: keep, onclick: function () { key(jj); if (shift) { shift = false; redraw(); } } }, jj));
        });
        if (r === 2) rw.appendChild(U.el('button', { type: 'button', class: 'koa-k wide', 'data-act': 'kb-back', 'aria-label': U.tx('Delete', '지우기'), onmousedown: keep, onclick: back }, '⌫'));
        box.appendChild(rw);
      });
      box.appendChild(U.el('div', { class: 'koa-row' }, U.el('button', { type: 'button', class: 'koa-k space', 'data-act': 'kb-space', onmousedown: keep, onclick: function () { commit(); inp.value += ' '; fire(); } }, U.tx('space', '띄어쓰기'))));
      box.appendChild(U.el('div', { class: 'tiny' }, U.tx('While this is open, your computer keys type Korean too (dkssud → 안녕).', '이 자판을 켜 두면 컴퓨터 키보드로도 한글이 나와요 (dkssud → 안녕).')));
      return box;
    }
    function roman() {
      var rIn = U.el('input', { class: 'text', type: 'text', lang: 'en', 'data-act': 'roman-in', placeholder: 'annyeonghaseyo', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': U.tx('Type Korean with English letters', '영어 글자로 한국어 쓰기') });
      var out = U.el('div', { class: 'koa-out grow', lang: 'ko', 'data-act': 'roman-out', 'aria-live': 'polite' });
      var add = U.btn(U.tx('Add', '넣기'), 'primary xs', function () {
        if (!out.textContent) return;
        commit(); inp.value = (inp.value && !/\s$/.test(inp.value) ? inp.value + ' ' : inp.value) + out.textContent; fire();
        rIn.value = ''; out.textContent = ''; rIn.focus();
      }, { 'data-act': 'roman-add' });
      rIn.addEventListener('input', function () { out.textContent = U.romanToHangul(rIn.value); });
      rIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add.click(); } });
      return U.el('div', { class: 'koa-roman' }, rIn, U.el('div', { class: 'row', style: { gap: '8px', marginTop: '6px' } }, out, add),
        U.el('div', { class: 'tiny' }, U.tx('Spelled by sound, so check it before you send. Use - to split: chin-gu → 친구.', '소리 나는 대로 바꿔요. 보내기 전에 맞춤법을 봐 주세요. 끊을 곳은 - (chin-gu → 친구).')));
    }
    function setup() {
      return U.el('div', { class: 'koa-setup small', 'data-act': 'kb-setup', lang: 'en' },
        U.el('p', {}, U.el('b', {}, 'Windows: '), 'Settings → Time & language → Language & region → Add a language → Korean. Switch with the 한/영 key or Windows + Space.'),
        U.el('p', {}, U.el('b', {}, 'Mac: '), 'System Settings → Keyboard → Text Input → Edit → + → Korean → 2-Set Korean. Switch with Control + Space.'),
        U.el('p', {}, U.el('b', {}, 'Chromebook: '), 'Settings → Device → Keyboard and inputs → Input → Add input methods → Korean.'),
        U.el('p', { class: 'tiny' }, U.tx('No Korean keyboard? Write on paper and send a photo, or say your answer. Both count.', '한글 자판이 없으면 종이에 써서 사진을 보내거나 말로 답해도 돼요.')));
    }
    var bar = U.el('div', { class: 'koa-bar' });
    function open(which) {
      cur = cur === which ? '' : which; kbOn = cur === 'kb'; commit();
      panel.innerHTML = ''; panel.classList.toggle('hidden', !cur);
      if (cur === 'kb') { panel.appendChild(kb()); inp.focus({ preventScroll: true }); }
      else if (cur === 'roman') { panel.appendChild(roman()); setTimeout(function () { var r = panel.querySelector('[data-act="roman-in"]'); if (r) r.focus({ preventScroll: true }); }, 0); }
      else if (cur === 'setup') panel.appendChild(setup());
      [].forEach.call(bar.querySelectorAll('[data-w]'), function (b) { var on = b.getAttribute('data-w') === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    }
    [['kb', 'kb-open', 'Korean keyboard', '한글 자판'], ['roman', 'roman-open', 'Type with English letters', '영어 글자로 쓰기'], ['setup', 'kb-help', 'Korean keyboard on this computer?', '이 컴퓨터에 한국어 자판 켜기']].forEach(function (x) {
      bar.appendChild(U.el('button', { type: 'button', class: 'linkbtn', 'data-w': x[0], 'data-act': x[1], 'aria-pressed': 'false', onclick: function () { open(x[0]); } }, U.tx(x[2], x[3])));
    });
    if (!U.store.get('hw_kb_seen', false)) {   // 처음 한 번 안내
      U.store.set('hw_kb_seen', true);
      wrap.appendChild(U.el('div', { class: 'koa-first small', 'data-act': 'kb-first' }, U.tx('Typing Korean on a computer? Use the Korean keyboard, type with English letters (annyeong → 안녕), or turn on Korean on this computer.', '컴퓨터에서 한국어를 쓰나요? 한글 자판, 영어 글자로 쓰기(annyeong → 안녕), 또는 이 컴퓨터에 한국어 자판 켜기를 쓰세요.')));
    }
    wrap.appendChild(bar); wrap.appendChild(panel);
    return wrap;
  };
  /** 한국어 칸이 화면 틀에 붙으면 아래에 도움 줄을 붙임 (U.textInput lang ko · 손글씨 판 타자 칸)
      T146zn: 칸이 가로 줄([칸][마이크]·[칸][Check]) 안에 있으면 그 줄 '다음'에 넣는다(줄 가운데 끼우지 않음). */
  function rowLike(p) {
    if (!p || p.nodeType !== 1 || p === document.body) return false;
    if (/(^|\s)(row|ans-row|card-in|actions)(\s|$)/.test(p.className || '')) return true;
    if (!p.isConnected || !window.getComputedStyle) return false;
    var cs = getComputedStyle(p), d = cs.display;
    if (/flex/.test(d)) return !/column/.test(cs.flexDirection);
    if (/grid/.test(d)) return String(cs.gridTemplateColumns || '').trim().split(/\s+/).length > 1;
    return false;
  }
  U.attachKoAssist = function (inp, after) {
    var tries = 0;
    (function go() {
      var at = after || inp; if (inp._koa) return;
      if (!at.isConnected && tries++ < 20) { setTimeout(go, 50); return; }   // 화면 틀에 붙은 뒤에 줄 모양을 봄
      var par = at.parentNode; if (!par) return;
      while (rowLike(par) && par.parentNode) { at = par; par = par.parentNode; }
      var n = U.koAssist(inp); if (!n) return; inp._koa = n;
      par.insertBefore(n, at.nextSibling);
    })();
  };
  U.diffNode = function (answer, target) {
    var d = window.Hangul.diff(answer || '', target || '');
    return U.el('span', { class: 'diff', lang: 'ko' }, d.map(function (x) { return U.el('span', { class: x.op === 'same' ? '' : x.op }, x.ch); }));
  };
  U.stars = function (n) { return U.el('span', { class: 'stars', 'aria-label': n + ' / 5' }, '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)); };
  window.UI = U;
})();
