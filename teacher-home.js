/* teacher-home.js — T166 선생님 허브 (teacher.html 첫 화면)
 * 위: 오늘·내일 수업(시각·학생·레벨·단원·오늘 과제) → 학생을 누르면 학생 카드(학생 화면·앱 허브·판·과제 점검·정리본 3·다음 수업안·앞으로의 과제·정보)
 * 아래: 학생 찾기 · 링크 묶음(teacher_links.json) · 최근 수업 처리(녹화·전사·정리본·다음 수업안)
 * 학생별 글은 서버(teacher.home · teacher.home_doc, 선생님 키)에서만 받음. 이 파일·공개 저장소에는 학생 정보 없음.
 * 첫 그림 = 이 기기에 남긴 지난 값(바로) → 서버 값으로 다시 그림. */
(function () {
  'use strict';
  var T = window.TeacherApp; if (!T || !T.App) return;
  var App = T.App, U = window.UI, el = U.el, btn = U.btn;
  var STORE = 'hw2_home';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var DAY = { none: ['세트 없음', 'todo'], wait: ['승인 대기', 'sent'], open: ['공개 · 안 열림', 'todo'], doing: ['하는 중', 'doing'], done: ['끝냄', 'done'], skipped: ['안 함', 'bad'], rest: ['쉼', 'rest'] };
  var PURPOSE = { topik: 'TOPIK', travel: '여행·일상 회화', career: '취업·학업', personal: '개인적 목표', undecided: '목적 미정' };

  function pad(n) { return ('0' + n).slice(-2); }
  function ymdLocal(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function md(ymd) { if (!ymd) return ''; var x = new Date(ymd + 'T12:00:00Z'); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate() + '(' + DOW[x.getUTCDay()] + ')'; }
  function hhmm(iso) { var d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function ago(iso) { if (!iso) return ''; var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; }
  function unitShort(u) { return u ? String(u).replace(/^KWD-/, '') : ''; }
  function list(v) { return Array.isArray(v) ? v.filter(Boolean).join(' · ') : (v || ''); }
  function dayChip(state) { var d = DAY[state] || [state || '—', 'todo']; if (d[1] === 'todo') d = [d[0], 'none']; return el('span', { class: 'chip ' + d[1], 'data-state': state || '' }, d[0]); }
  function siteUrl(f) { return location.origin + location.pathname.replace(/[^/]*$/, '') + f; }
  function extLink(label, url, act, cls) { return el('a', { class: 'btn ' + (cls || 'sm'), href: url, target: '_blank', rel: 'noopener', 'data-act': act }, label); }
  function copy(text, ok) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { U.toast(ok); }, function () { U.toast(text); }); else U.toast(text);
  }

  /** 서버에서 허브 값 받기(+ 이 기기에 저장). fresh = 서버 캐시 무시 */
  App.prototype.homeLoad = function (fresh) {
    var self = this;
    return this.call('teacher.home', fresh ? { fresh: 1 } : {}).then(function (d) {
      d.got_at = new Date().toISOString(); self.home = d;
      try { U.store.set(STORE, d); } catch (e) { /* 저장 공간 없음 — 다음엔 서버에서 */ }
      return d;
    });
  };
  App.prototype.homeData = function () {
    if (this.home) return Promise.resolve(this.home);
    var c = U.store.get(STORE, null);
    if (c && c.students) { this.home = c; return Promise.resolve(c); }
    return this.homeLoad(false);
  };
  App.prototype.homeStu = function (sid) { return ((this.home && this.home.students) || []).filter(function (s) { return s.student_id === sid; })[0] || null; };

  /* ================= T087c 확인할 것: 애매 글씨 보류만 · 한 줄 = 학생·잘라낸 글씨·채점기 읽기 → [✓ 맞음] [✗ 틀림] 한 번 (누르면 바로 사라지고 뒤에서 보냄) ================= */
  var HOLD = 'hw2_hold';
  App.prototype.holdBox = function () {
    var self = this, box = el('section', { class: 'hold-box', 'data-act': 'hold-box' });
    var paint = function (d) {
      box.innerHTML = '';
      var rows = ((d && d.rows) || []).filter(function (r) { return !(self.holdGone || {})[r.submission_id]; });
      if (!rows.length) { box.hidden = true; return; }
      box.hidden = false;
      box.appendChild(el('div', { class: 'group-label', 'data-act': 'hold-count' }, '확인할 것 ' + rows.length));
      rows.forEach(function (r) { box.appendChild(self.holdRow(r, box)); });
    };
    var c = U.store.get(HOLD, null); if (c && c.rows) paint(c); else box.hidden = true;
    if (!this.holdP) this.holdP = this.call('teacher.hold_list', {}).then(function (d) { try { U.store.set(HOLD, d); } catch (e) { /* 크기 */ } return d; });
    this.holdP.then(paint, function () { /* 못 받으면 지난 값 그대로 */ });
    return box;
  };
  function holdRead(r) {
    var t = String(r.read || ''), out = el('span', { lang: 'ko' }), marks = (r.unsure || []).map(function (u) { return u.read; }).filter(Boolean);
    if (!marks.length) { out.textContent = t; return out; }
    while (t) {   // 애매한 낱말마다 표시 (가장 앞에 나오는 것부터)
      var at = -1, m = '';
      marks.forEach(function (x) { var i = t.indexOf(x); if (i >= 0 && (at < 0 || i < at)) { at = i; m = x; } });
      if (at < 0) { out.appendChild(document.createTextNode(t)); break; }
      if (at) out.appendChild(document.createTextNode(t.slice(0, at)));
      out.appendChild(el('mark', { class: 'hold-mark' }, m));
      t = t.slice(at + m.length);
    }
    return out;
  }
  App.prototype.holdRow = function (r, box) {
    var self = this, alt = (r.unsure || []).map(function (u) { return u.read + ' → ' + u.alt + (u.why ? ' (' + u.why + ')' : ''); }).join(' · ');
    var img = el('div', { class: 'hold-img', 'data-act': 'hold-img' });
    if (r.crop) img.appendChild(el('img', { src: 'data:image/jpeg;base64,' + r.crop, alt: '학생 손글씨 잘라낸 것' }));
    else if (r.media) { img.textContent = '사진 받는 중…'; this.media(r.media).then(function (m) { img.innerHTML = ''; img.appendChild(el('img', { src: U.b64Url(m), alt: '학생 손글씨' })); }, function () { img.textContent = '사진을 못 불러왔어요'; }); }
    var row = el('div', { class: 'card hold-row', 'data-act': 'hold-row', 'data-id': r.submission_id },
      el('div', { class: 'row hold-who' }, el('b', {}, (r.name ? r.name + ' ' : '') + '(S' + String(r.student_id).replace(/^st_/, '') + ')'), el('span', { class: 'grow' }), el('span', { class: 'tiny' }, ago(r.at))),
      img,
      el('div', { class: 'hold-read' }, el('span', { class: 'tiny' }, '채점기 읽기 '), holdRead(r)),
      alt ? el('div', { class: 'tiny hold-alt', 'data-act': 'hold-alt' }, '애매한 곳: ' + alt + ' · ✓ = 오른쪽 글자로 씀') : null,
      r.target ? el('div', { class: 'tiny', lang: 'ko' }, '모범: ' + r.target) : null,
      el('div', { class: 'row hold-btns' },
        btn('✓ 맞음', 'primary', function () { self.holdDecide(r, true, row, box); }, { 'data-act': 'hold-ok' }),
        btn('✗ 틀림', 'ghost', function () { self.holdDecide(r, false, row, box); }, { 'data-act': 'hold-bad' })));
    return row;
  };
  App.prototype.holdDecide = function (r, ok, row, box) {
    var self = this; this.holdGone = this.holdGone || {}; this.holdGone[r.submission_id] = 1;
    row.remove();
    var n = box.querySelectorAll('[data-act="hold-row"]').length, lab = box.querySelector('[data-act="hold-count"]');
    if (!n) box.hidden = true; else if (lab) lab.textContent = '확인할 것 ' + n;
    var c = U.store.get(HOLD, null); if (c && c.rows) { c.rows = c.rows.filter(function (x) { return x.submission_id !== r.submission_id; }); U.store.set(HOLD, c); }
    this.call('teacher.hold_decide', { submission_id: r.submission_id, ok: ok, by: 'teacher' }).catch(function (e) {
      delete self.holdGone[r.submission_id];
      U.toast('보내지 못했어요 — 다시 눌러 주세요 (' + e.message + ')');
      box.hidden = false; box.appendChild(self.holdRow(r, box));
    });
  };

  /* ================= 허브 첫 화면 ================= */
  App.prototype.renderHome = function (main) {
    this.holdP = null;
    var self = this, cached = this.home || U.store.get(STORE, null), fresh = this.homeFresh; this.homeFresh = false;
    if (cached && cached.students) { this.home = cached; this.drawHome(main, cached, true); }
    return this.homeLoad(fresh).then(function (d) {
      if (self.view !== 'home') return;
      var y = window.scrollY; self.drawHome(main, d, false); window.scrollTo(0, y);
    }, function (e) {
      if (!(cached && cached.students)) throw e;
      var bar = main.querySelector('[data-act="home-stale"]');
      if (bar) { bar.textContent = '서버에 닿지 못했어요 — ' + ago(cached.got_at || cached.made_at) + ' 값을 보여 줘요 (' + e.message + ')'; bar.classList.add('warn'); }
    });
  };
  App.prototype.drawHome = function (main, d, stale) {
    var self = this, S = {}; (d.students || []).forEach(function (s) { S[s.student_id] = s; });
    main.innerHTML = '';
    var now = new Date(), today = ymdLocal(now), tm = new Date(now.getTime() + 864e5), tomorrow = ymdLocal(tm);
    main.appendChild(el('div', { class: 'row wrapr hub-top' }, el('h1', {}, '선생님 허브'), el('span', { class: 'grow' }),
      el('span', { class: 'tiny', 'data-act': 'home-stale' }, stale ? ago(d.got_at || d.made_at) + ' 값 · 새로 받는 중…' : '서버 ' + ago(d.made_at) + ' 기준'),
      btn('새로 고침', 'ghost sm', function () { self.homeFresh = true; self.go('home'); }, { 'data-act': 'home-refresh' })));
    main.appendChild(this.holdBox());   // T087c 맨 위 '확인할 것 n' (애매 글씨 보류만)
    // T090 학생 끝 화면 '쉬워요/어려워요' → 다음 세트 난도 바뀜(최근 3일, 한 줄씩: 'Aisha: 쉬움 → 카드·듣기 난도↑')
    var hc = (d.hw_changes || []).slice(-8).reverse();
    if (hc.length) {
      var cb = el('section', { class: 'hub-sec', 'data-act': 'home-hw-changes' }, el('div', { class: 'group-label' }, '과제 난도 바뀜 · 최근 3일'));
      hc.forEach(function (x) { cb.appendChild(el('div', { class: 'small hub-chg', 'data-sid': x.sid || '' }, el('b', {}, md(x.date) + ' '), x.text)); });
      main.appendChild(cb);
    }

    // 1) 오늘·내일 수업
    var L = (d.lessons || []).slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    [[today, '오늘'], [tomorrow, '내일']].forEach(function (g) {
      var xs = L.filter(function (x) { return ymdLocal(new Date(x.start)) === g[0]; });
      var box = el('section', { class: 'hub-day', 'data-act': 'home-day', 'data-day': g[1] }, el('div', { class: 'group-label' }, g[1] + ' ' + md(g[0]) + ' · 수업 ' + xs.length));
      if (!xs.length) box.appendChild(el('div', { class: 'card small hub-empty' }, g[1] + ' 수업이 없어요 (캘린더 기준).'));
      xs.forEach(function (x) { box.appendChild(self.homeLessonRow(x, S[x.sid], now)); });
      main.appendChild(box);
    });

    // 2) 학생 찾기 (수업이 없는 학생도 두 번 안에)
    var names = (d.students || []).slice().sort(function (a, b) { return (a.name || a.student_id) < (b.name || b.student_id) ? -1 : 1; });
    var find = el('section', { class: 'hub-sec', 'data-act': 'home-all' }, el('div', { class: 'group-label' }, '모든 학생 ' + names.length + '명'));
    var wrapN = el('div', { class: 'hub-names' });
    names.forEach(function (s) {
      wrapN.appendChild(el('button', { type: 'button', class: 'chip k hub-name', 'data-sid': s.student_id, onclick: function () { self.go('home_st', s.student_id); } },
        s.name || s.student_id, s.status === 'paused' ? el('span', { class: 'tiny' }, ' 쉼') : null));
    });
    if (!names.length) wrapN.appendChild(el('div', { class: 'small' }, '아직 받은 학생이 없어요. PC 동기화(teacher_home.py)가 10분 안에 채워요.'));
    find.appendChild(wrapN); main.appendChild(find);

    // 3) 링크 묶음
    var links = el('section', { class: 'hub-sec', 'data-act': 'home-links' }, el('div', { class: 'group-label' }, '과제 화면'));
    links.appendChild(el('div', { class: 'hub-btns' },
      btn('과제 현황판', 'sm', function () { self.hw = { at: 'board' }; self.go('hw'); }, { 'data-act': 'home-go-hw' }),
      btn('보내기 확인', 'sm', function () { self.tqTab = 'main'; self.go('tq'); }, { 'data-act': 'home-go-tq' }),
      btn('보류함', 'sm', function () { self.tqTab = 'hold'; self.go('tq'); }, { 'data-act': 'home-go-hold' }),
      btn('검토 대기', 'sm', function () { self.qf.student = null; self.go('queue'); }, { 'data-act': 'home-go-queue' }),
      btn('학생 표', 'sm', function () { self.go('board'); }, { 'data-act': 'home-go-board' })));
    var groups = {}, order = [];
    (d.links || []).forEach(function (x) { if (!groups[x.group]) { groups[x.group] = []; order.push(x.group); } groups[x.group].push(x); });
    order.forEach(function (gname) {
      links.appendChild(el('div', { class: 'group-label' }, gname));
      links.appendChild(el('div', { class: 'hub-btns' }, groups[gname].map(function (x) { return extLink(x.name, x.url, 'home-link'); })));
    });
    main.appendChild(links);

    // 4) 최근 수업 처리 (녹화·전사·정리본·다음 수업안)
    var R = (d.recent || []).slice().sort(function (a, b) { return a.start < b.start ? 1 : -1; });
    var rec = el('section', { class: 'hub-sec', 'data-act': 'home-recent' }, el('div', { class: 'group-label' }, '최근 3일 수업 처리 (녹화 · 전사 · 정리본 · 다음 수업안)'));
    if (!R.length) rec.appendChild(el('div', { class: 'card small hub-empty' }, '최근 3일에 끝난 수업이 없어요.'));
    R.forEach(function (x) {
      var ok = function (v, lbl) { return el('span', { class: 'chip ' + (v === true || v === 'done' ? 'done' : v === 'failed' ? 'bad' : 'none') }, lbl + ' ' + (v === true || v === 'done' ? '됨' : v === 'failed' ? '실패' : '아직')); };
      var row = el(x.sid ? 'button' : 'div', { type: x.sid ? 'button' : null, class: 'card hub-rec', 'data-sid': x.sid || '', onclick: x.sid ? function () { self.go('home_st', x.sid); } : null },
        el('span', { class: 'row', style: { gap: '8px' } }, el('b', {}, md(ymdLocal(new Date(x.start))) + ' ' + hhmm(x.start)), el('span', { class: 'grow' }, x.label + (x.n ? ' #' + x.n : ''))),
        x.sid ? el('span', { class: 'row hub-chips' }, ok(x.rec, '녹화'), ok(x.stt, '전사'), ok(x.doc, '정리본'), ok(x.plan_after, '다음 수업안'))
          : el('span', { class: 'tiny' }, '학생 기록 없음 (체험·새 학생)'));
      rec.appendChild(row);
    });
    main.appendChild(rec);
    main.appendChild(el('div', { class: 'tiny hub-foot' }, '캘린더 ' + (d.cal_at ? ago(d.cal_at) : '모름') + ' · 학생 카드는 PC가 10분마다 맞춤'));
  };
  App.prototype.homeLessonRow = function (x, s, now) {
    var self = this, st = new Date(x.start), en = new Date(x.end), live = now >= st && now <= en, past = now > en;
    var chips = [];
    if (live) chips.push(el('span', { class: 'chip new' }, '수업 중'));
    else if (past) chips.push(el('span', { class: 'chip k' }, '끝남'));
    if (s) {
      chips.push(el('span', { class: 'chip k' }, s.level || s.band || 'L?'));
      if (s.next_unit) chips.push(el('span', { class: 'chip k' }, unitShort(s.next_unit)));
      chips.push(dayChip(s.today && s.today.state));
    }
    var body = [el('span', { class: 'row', style: { gap: '10px' } }, el('b', { class: 'hub-time' }, hhmm(x.start)), el('b', { class: 'grow hub-who' }, (s && s.name) || x.label)),
      el('span', { class: 'row hub-chips' }, chips)];
    if (!s) body.push(el('span', { class: 'tiny' }, x.sid ? '학생 카드 아직 없음' : '학생 기록 없음 (체험·새 학생)'));
    return el(s ? 'button' : 'div', { type: s ? 'button' : null, class: 'card hub-lesson' + (past ? ' past' : '') + (live ? ' live' : ''), 'data-sid': x.sid || '',
      onclick: s ? function () { self.go('home_st', x.sid); } : null }, body);
  };

  /* ================= 학생 카드 ================= */
  App.prototype.renderHomeStudent = function (main, sid) {
    var self = this;
    return this.homeData().then(function (d) {
      var s = self.homeStu(sid);
      main.innerHTML = '';
      main.appendChild(btn('← 허브', 'ghost sm', function () { self.go('home'); }, { 'data-act': 'home-back' }));
      if (!s) { main.appendChild(el('div', { class: 'state-t', 'data-act': 'home-nostu' }, el('h2', {}, '이 학생 카드가 없어요'), el('p', { class: 'small' }, '허브에서 새로 고침을 눌러 보세요.'))); return; }
      var now = new Date(), next = (d.lessons || []).filter(function (x) { return x.sid === sid && new Date(x.end) >= now; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; })[0];
      var meta = [s.sno, s.level ? '레벨 ' + s.level : '', s.next_unit ? '다음 단원 ' + unitShort(s.next_unit) : '', s.daily_min ? '하루 ' + s.daily_min + '분' : '', s.status === 'paused' ? '쉼' : ''].filter(Boolean);
      main.appendChild(el('header', { class: 'hub-head', 'data-act': 'home-head' }, el('h1', {}, s.name || sid),
        el('div', { class: 'small' }, meta.join(' · ')),
        next ? el('div', { class: 'small hub-next' }, '다음 수업 ' + md(ymdLocal(new Date(next.start))) + ' ' + hhmm(next.start)) : null));

      // 열기 버튼 — 두 칸 격자
      var key = s.key ? encodeURIComponent(s.key) : '', isTest = T.isTest({ student_id: sid });
      var acts = el('div', { class: 'hub-acts', 'data-act': 'home-acts' });
      if (key) {
        acts.appendChild(extLink(isTest ? '학생 과제 화면 (해 보기)' : '학생 과제 화면 (미리 보기)', siteUrl('student.html?k=' + key + (isTest ? '' : '#preview')), 'home-open-student', 'sm primary'));
        acts.appendChild(extLink('학생 앱 허브', siteUrl('me.html?k=' + key + (isTest ? '' : '#preview')), 'home-open-me'));
      }
      if (s.board_t) acts.appendChild(extLink('판 열기 (선생님)', s.board_t, 'home-open-board'));
      if (s.board_c) acts.appendChild(btn('판 학생 링크 복사', 'sm', function () { copy(s.board_c, '판 학생 링크를 복사했어요'); }, { 'data-act': 'home-copy-board' }));
      acts.appendChild(btn('과제 점검', 'sm', function () { self.hwGo('student', { sid: sid }); }, { 'data-act': 'home-go-check' }));
      acts.appendChild(btn('학생 기록 자세히', 'sm', function () { self.go('student', sid); }, { 'data-act': 'home-go-student' }));
      if (key) acts.appendChild(btn('학생 과제 링크 복사', 'sm', function () { copy(siteUrl('student.html?k=' + key), '학생 과제 링크를 복사했어요'); }, { 'data-act': 'home-copy-hw' }));
      main.appendChild(acts);
      if (!s.board_t) main.appendChild(el('div', { class: 'tiny' }, '판 고정 링크 없음 — 클래스룸 표에 이 학생 코드가 없어요.'));

      // 다음 수업안 · 지난 정리본
      var docs = el('section', { class: 'panel hub-panel', 'data-act': 'home-docs' }, el('h2', {}, '수업 문서'));
      if (s.plan) docs.appendChild(self.homeDocRow(sid, s.plan, '다음 수업안', s.plan.date && s.plan.date < ymdLocal(now) ? '지난 날짜 — 새 수업안이 아직 없어요' : ''));
      else docs.appendChild(el('div', { class: 'small' }, '다음 수업안이 아직 없어요.'));
      (s.docs || []).forEach(function (x) { docs.appendChild(self.homeDocRow(sid, x, '정리본', x.qa === 'AI 초안' ? 'AI 초안 · 확인 전' : '')); });
      if (!(s.docs || []).length) docs.appendChild(el('div', { class: 'small' }, '정리본이 아직 없어요.'));
      main.appendChild(docs);

      // 앞으로의 과제
      var fut = s.future || [], nW = fut.filter(function (x) { return x.state === 'wait'; }).length;
      var hw = el('section', { class: 'panel hub-panel', 'data-act': 'home-future' }, el('h2', {}, '과제 ', el('span', { class: 'en' }, '앞으로 ' + fut.length + '일' + (nW ? ' · 승인 대기 ' + nW : ''))));
      var row = function (date, state, est, mode, lbl) {
        return el('div', { class: 'hub-frow', 'data-date': date }, el('span', { class: 'hub-fdate' }, lbl || md(date)), dayChip(state),
          el('span', { class: 'tiny grow' }, (est ? '약 ' + est + '분' : '') + (mode === 'lite' ? ' · 가볍게' : '')));
      };
      if (s.today) hw.appendChild(row(s.today.date, s.today.state, s.today.est, '', '오늘 ' + md(s.today.date)));
      fut.forEach(function (x) { hw.appendChild(row(x.date, x.state, x.est, x.mode)); });
      if (!fut.length) hw.appendChild(el('div', { class: 'small' }, '앞으로 만든 과제 날이 없어요.'));
      var p7 = s.past7 || [];
      if (p7.length) {
        var cnt = {}; p7.forEach(function (x) { cnt[x.state] = (cnt[x.state] || 0) + 1; });
        hw.appendChild(el('div', { class: 'tiny hub-p7' }, '지난 ' + p7.length + '일: ' + Object.keys(cnt).map(function (k) { return (DAY[k] || [k])[0] + ' ' + cnt[k]; }).join(' · ')));
      }
      main.appendChild(hw);

      // 학생 정보 요약(정본 기본 정보)
      var info = el('section', { class: 'panel hub-panel', 'data-act': 'home-info' }, el('h2', {}, '학생 정보 ', el('span', { class: 'en' }, '정본 · ' + (s.updated || ''))));
      var irow = function (k, v) { if (!v) return; info.appendChild(el('div', { class: 'hub-irow' }, el('span', { class: 'hub-ik' }, k), el('span', { class: 'hub-iv', lang: 'ko' }, v))); };
      irow('목적', PURPOSE[s.purpose] || s.purpose);
      irow('레벨', [s.grammar_level ? '문법 ' + s.grammar_level : '', s.vocab_level ? '단어 ' + s.vocab_level : '', s.stage].filter(Boolean).join(' · '));
      irow('사는 곳', list(s.residence)); irow('출신', list(s.nationality)); irow('직업', list(s.job));
      irow('알아 둘 것', list(s.know)); irow('피할 주제', list(s.avoid));
      (s.memo || []).forEach(function (m) { irow('메모 ' + (m[0] || '').slice(5).replace('-', '/'), m[1]); });
      if (info.childNodes.length === 1) info.appendChild(el('div', { class: 'small' }, '정본에 적힌 정보가 아직 없어요.'));
      main.appendChild(info);
    });
  };
  App.prototype.homeDocRow = function (sid, x, kind, note) {
    var self = this;
    return el('button', { type: 'button', class: 'hub-doc', 'data-doc': x.id, onclick: function () { self.go('home_doc', { sid: sid, id: x.id }); } },
      el('span', { class: 'chip k' }, kind), el('span', { class: 'grow hub-dt' }, (x.n ? '#' + x.n + ' ' : '') + (x.date ? md(x.date) : '')),
      note ? el('span', { class: 'tiny' }, note) : null, el('span', { class: 'hub-open' }, '열기'));
  };

  /* ================= 문서 읽기 (정리본·수업안) ================= */
  App.prototype.renderHomeDoc = function (main, a) {
    var self = this; this.docCache = this.docCache || {};
    var k = a.sid + ':' + a.id, hit = this.docCache[k];
    var back = btn('← 학생 카드', 'ghost sm', function () { self.go('home_st', a.sid); }, { 'data-act': 'home-doc-back' });
    var p = hit ? Promise.resolve(hit) : this.call('teacher.home_doc', { student_id: a.sid, id: a.id });
    return p.then(function (d) {
      self.docCache[k] = d; main.innerHTML = ''; main.appendChild(back);
      var art = el('article', { class: 'panel md-doc', 'data-act': 'home-doc', lang: 'ko' });
      renderMd(d.body || '', art);
      main.appendChild(art);
    });
  };
  /** 아주 작은 마크다운 → DOM (머리말·목록·표·인용·굵게·코드). innerHTML 안 씀 */
  function inline(text, parent) {
    var re = /(\*\*[^*]+\*\*|`[^`]+`)/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      var t = m[0]; parent.appendChild(t[0] === '`' ? el('code', {}, t.slice(1, -1)) : el('b', {}, t.slice(2, -2)));
      last = m.index + t.length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
    return parent;
  }
  function renderMd(src, out) {
    var lines = String(src).replace(/\r/g, '').split('\n'), i = 0, ul = null, para = [];
    function flushP() { if (para.length) { out.appendChild(inline(para.join(' '), el('p', {}))); para = []; } }
    while (i < lines.length) {
      var ln = lines[i], m;
      if (/^\s*\|/.test(ln)) {
        flushP(); ul = null;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|')); i++; }
        var tb = el('table', { class: 'md-tbl' });
        rows.forEach(function (r, ri) { tb.appendChild(el('tr', {}, r.map(function (c) { return inline(c.trim(), el(ri ? 'td' : 'th', {})); }))); });
        out.appendChild(el('div', { class: 'md-scroll' }, tb));
        continue;
      }
      if ((m = /^(#{1,4})\s+(.*)$/.exec(ln))) { flushP(); ul = null; out.appendChild(inline(m[2], el(m[1].length <= 1 ? 'h2' : 'h3', {}))); }
      else if ((m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(ln))) { flushP(); if (!ul) { ul = el('ul', {}); out.appendChild(ul); } ul.appendChild(inline(m[1], el('li', {}))); }
      else if ((m = /^>\s?(.*)$/.exec(ln))) { flushP(); ul = null; out.appendChild(inline(m[1], el('blockquote', {}))); }
      else if (!ln.trim()) { flushP(); ul = null; }
      else para.push(ln.trim());
      i++;
    }
    flushP();
  }
  T.renderMd = renderMd;   // 시험용
})();
