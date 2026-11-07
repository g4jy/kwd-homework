/* student.js — 학생 화면 v3
 * 오늘 숙제 = 묶음(단어 · 한영 번역 · 영한 번역 · 질문에 답하기 · 문장 연습 · 읽기) → 묶음을 펼치면 카드 목록 → 카드를 펼치면 단계(✓).
 * 꺼내기 먼저(뜻 → 말하기/타자 → 답 + [발음] + 소리), 말하기 먼저(단어·문형·읽기에도 녹음),
 * 한국어 글은 어디서나 '모르겠어요' 표시(낱말 누르기 / 끌어서 고르기) → 선생님에게. 순서 강요 없음. '시작하기 전에'는 학생마다 한 번.
 */
(function () {
  'use strict';
  var U = window.UI, el = U.el, btn = U.btn;
  var GROUPS = [
    ['preview', 'bookmark', 'Preview — read first', '예습'],   // 10/20: 다음 수업 예습이 맨 위
    ['words', 'cards', 'Words', '단어'], ['ko_en', 'mic', 'Korean → English', '한영 번역'], ['en_ko', 'pen', 'English → Korean', '영한 번역'],
    ['qa', 'chat', 'Questions & speaking', '질문에 답하기'], ['sentence', 'lines', 'Sentences', '문장 연습'], ['reading', 'book', 'Reading', '읽기'],
    ['listen', 'speaker', 'Listening', '듣기'],   // T114 수업후자동화 듣기 (소리 파일이 있는 문항만 옴)
    ['feedback', 'repeat', 'From your last class', '수업 피드백'],
    ['check', 'check', 'Quick check', '실력 확인']   // T154b 레벨 진단 (선생님이 승인한 학생만)
  ];
  var TYPE = {
    cards_review: 'Review words', cards_new: 'New words', ctx: 'Words in context', sp_ko_en: 'Korean → English', sp_en_ko: 'English → Korean',
    sp_qa: 'Question → Answer', mission: 'Speaking mission', grammar: 'Grammar check', reading: 'Reading', write: 'Writing', listen: 'Listening', diag: 'Quick check'
  };
  var HOW = {
    sp_ko_en: 'Read the Korean aloud, then type what it means in English.',
    sp_en_ko: 'Write it in Korean by hand, then say your sentence.',
    sp_qa: 'Read the question aloud, type its meaning, then write your answer in Korean by hand and say it.',
    reading: 'Read and mark what you don’t get. Then answer each question in Korean — write it and say it. Last: read the whole text aloud.',
    write: 'Write by hand — on screen or on paper (take a photo). Then read it aloud.',
    write_short: 'Write by hand — on screen or on paper (take a photo).',   // T093b 짧은 쓰기 = 손글씨 한 단계(녹음 없음)
    grammar: 'Do it, then read the finished sentence aloud.',
    ctx: 'Which word fits the sentence?',
    mission: 'Try to use the green words. Dongjae gets a short report.',
    listen: 'Play the sound. You can play it again as many times as you like.'
  };
  var HOW_KO = {
    sp_ko_en: '한국어를 소리 내어 읽고, 뜻을 영어로 쓰세요.',
    sp_en_ko: '한국어로 손으로 쓰고, 쓴 문장을 말해 보세요.',
    sp_qa: '질문을 소리 내어 읽고 뜻을 쓴 다음, 한국어 대답을 손으로 쓰고 소리 내어 읽어요.',
    reading: '읽으면서 모르는 곳을 표시하세요. 질문마다 한국어로 쓰고 말해요. 마지막에 글 전체를 소리 내어 읽어요.',
    write: '손으로 쓰세요. 화면에 쓰거나 종이에 쓰고 사진을 찍어요. 그다음 소리 내어 읽어요.',
    write_short: '손으로 쓰세요. 화면에 쓰거나 종이에 쓰고 사진을 찍어요.',
    grammar: '문제를 풀고, 완성한 문장을 소리 내어 읽어요.',
    ctx: '문장에 맞는 낱말은 무엇일까요?',
    mission: '초록색 낱말을 써 보세요. 선생님이 짧은 결과를 받아요.',
    listen: '소리를 들어 보세요. 몇 번이든 다시 들을 수 있어요.'
  };
  function how(type) { return U.lang() === 'ko' ? HOW_KO[type] : HOW[type]; }
  /** T109e 서버 단계 이름(label_en)을 설정 언어로. 한국어 글은 학생이 읽는 말로 (서버 label_ko 는 선생님용 줄임말) */
  var STEP_KO = {
    'Read the Korean aloud': '한국어를 소리 내어 읽기', 'Type the meaning in English': '뜻을 영어로 쓰기',
    'Write it in Korean — by hand': '한국어로 손으로 쓰기', 'Say your Korean sentence': '쓴 문장 말하기',
    'Read the question aloud': '질문을 소리 내어 읽기', 'What does the question mean? (English)': '질문의 뜻을 영어로 쓰기',
    'Answer in Korean — say it': '한국어로 대답하기 (말하기)', 'Write your answer in Korean — by hand': '대답을 한국어로 손으로 쓰기',
    'Choose the word that fits': '알맞은 낱말 고르기', 'Write it by hand (canvas or photo of paper)': '손으로 쓰기 (화면 또는 종이 사진)',
    'Read what you wrote aloud': '쓴 글을 소리 내어 읽기', 'Read it. Mark what you don’t get': '읽고 모르는 곳 표시하기',
    'Read the first part aloud (the box below)': '앞부분을 소리 내어 읽기 (아래 글)', 'Read the whole text aloud': '글 전체를 소리 내어 읽기',
    'Choose the right sentence': '알맞은 문장 고르기', 'Write the whole sentence by hand': '문장 전체를 손으로 쓰기',
    'Read the completed sentence aloud': '완성한 문장을 소리 내어 읽기',
    'Listen and type what you hear': '듣고 들은 대로 쓰기', 'Listen and choose the meaning': '듣고 뜻 고르기',
    'Listen to the conversation and answer': '대화를 듣고 답 고르기'
  };
  function stepLabel(st) {
    var en = st.label_en || '';
    if (U.lang() !== 'ko') return en || st.label_ko || '';
    if (STEP_KO[en]) return STEP_KO[en];
    var m = /^Q(\d+) · answer in Korean/.exec(en); if (m) return '질문 ' + m[1] + ' · 한국어로 대답 (쓰기 + 말하기)';
    m = /^Answer (\d+) — say it in Korean/.exec(en); if (m) return '대답 ' + m[1] + ' · 한국어로 말하기';
    return st.label_ko || en;
  }
  /** T126 지난 수업 피드백 맥락 (automation T122 fb: situation_en · together · said · mistake_en · correct).
   *  상황 → 함께 배운 말 → 내가 한 말 → 무엇이 틀렸나 → 고쳐 쓰기. correct 는 제출 뒤에만 서버가 줌(모범 답 칸). fb 없으면 null */
  function fbNode(t) {
    var f = t.fb; if (!f || !(f.said || f.situation_en)) return null;
    var box = el('div', { class: 'fbctx', 'data-act': 'fb-context' });
    if (f.situation_en) box.appendChild(el('p', { class: 'fb-sit', lang: 'en', 'data-act': 'fb-situation' }, el('span', { class: 'lab' }, U.tx('In class', '수업에서')), String(f.situation_en)));
    var tg = (f.together || []).filter(function (w) { return w && w.ko; }).slice(0, 4);
    if (tg.length) box.appendChild(el('div', { 'data-act': 'fb-together' }, el('span', { class: 'lab' }, U.tx('Words from that talk', '그때 함께 배운 말')),
      el('div', { class: 'tags fb-words' }, tg.map(function (w) { return el('span', { class: 'chip' }, el('b', { lang: 'ko' }, String(w.ko)), w.en ? el('span', { lang: 'en' }, String(w.en)) : null); }))));
    if (f.said) {   // T146q R33 고칠 곳(t.fix 첫 글자 묶음)에 밑줄·색
      var sd = String(f.said), fx = [].concat(t.fix || []).filter(function (x) { return x && sd.indexOf(x) >= 0; })[0], sp = el('span', { class: 'said', lang: 'ko' });
      if (fx) { var i = sd.indexOf(fx); sp.appendChild(document.createTextNode(sd.slice(0, i))); sp.appendChild(el('mark', { class: 'fixme', 'data-act': 'fix-mark' }, fx)); sp.appendChild(document.createTextNode(sd.slice(i + fx.length))); }
      else sp.textContent = sd;
      box.appendChild(el('p', { class: 'fb-said', 'data-act': 'fb-said' }, el('span', { class: 'lab' }, U.tx('You said', '내가 한 말')), sp));
    }
    if (f.mistake_en) box.appendChild(el('p', { class: 'fb-why', lang: 'en', 'data-act': 'fb-mistake' }, String(f.mistake_en)));
    box.appendChild(el('p', { class: 'prompt2', 'data-act': 'fb-task' }, U.tx('Write it correctly.', '바르게 고쳐 써 보세요.')));
    return box;
  }
  var KINDS = [['word', 'Word', '단어'], ['grammar', 'Grammar', '어법'], ['pron', 'Sound', '발음'], ['meaning', 'Meaning', '뜻 모름']];

  function App(root, opts) { this.root = root; this.key = opts.key; this.box = new U.Outbox('s_' + opts.key); this.open = null; this.gOpen = null; this.timers = {}; this.dayOverride = null; }
  App.prototype.tm = function (tid) { return this.timers[tid] || (this.timers[tid] = { dwell: 0, openAt: null, stepStart: null }); };
  /** T146a 저장본이 오늘 것이면 (그 학생 시간대 기준) 바로 그림. 다른 날·지난 세트·선생님 검토(t=)는 저장본 안 씀 */
  App.prototype.cached = function () {
    if (this.dayOverride || (U.PREVIEW && U.hs('t'))) return null;
    var c = U.dayCache.get(this.key);
    return c && c.d.day.local_date === U.todayIn(c.d.student.tz) ? c : null;
  };
  App.prototype.load = function (silent) {
    var self = this, t0 = Date.now();
    // 10/20 선생님 검토: student.html?k=…#preview&t=<선생님 키>&d=<세트> → 그 세트 전체 (승인 전이어도), 아무것도 기록 안 함
    var tk = U.PREVIEW ? U.hs('t') : null;
    var c = this.cached(), n = U.qs('n'), drew = false;
    // T146a ① 저장본으로 바로 그림 → ② 서버에 버전만 물음(student.ver, 시트 안 엶) → 같으면 끝, 다르면 그때만 student.today
    if (c && !this.data) { drew = true; this.fromCache = true; this.gotData(c.d, true); window.KWD_PERF = { cache: true, first_ms: Date.now() - t0 }; }
    else if (!silent && !this.data) this.root.innerHTML = '<div class="loading" role="status"><span class="spin" aria-hidden="true"></span><span>Loading… 불러오는 중</span></div>';
    var full = function () {
      var req = tk ? U.call('teacher.preview', { tkey: tk, key: self.key, dayset_id: U.hs('d') || '' }) : U.call('student.today', { key: self.key, n: n }, drew);   // T146zb 저장본으로 그렸으면 뒤에서 (줄 안 보임)
      return req.then(function (d) {
        if (!tk && !self.dayOverride) U.dayCache.set(self.key, d);
        var same = drew && JSON.stringify(Object.assign({}, c.d, { ver: null, local_now: null })) === JSON.stringify(Object.assign({}, d, { ver: null, local_now: null }));
        if (same) { self.data.ver = d.ver; return self.afterServer(d); }
        self.gotData(d, false, drew);
        return self.afterServer(d);
      });
    };
    var p = drew && !n && !tk ? U.call('student.ver', { key: this.key }, true).then(function (r) {
      if (r && r.v && r.v === c.v) { if (window.KWD_PERF) window.KWD_PERF.ver_same = true; return self.afterServer(c.d, true); }
      return full();
    }, function () { return full(); }) : full();
    return p.then(function () { if (window.KWD_PERF) window.KWD_PERF.server_ms = Date.now() - t0; else window.KWD_PERF = { cache: false, first_ms: Date.now() - t0 }; }, function (e) {
      if (e.message === 'unknown key') U.dayCache.drop(self.key);
      if (drew && e.message !== 'unknown key') return;   // 인터넷이 없어도 저장본으로 계속 (제출은 기기에 줄 세움)
      self.root.innerHTML = '';
      self.root.appendChild(el('div', { class: 'wrap' }, el('div', { class: 'state err', role: 'alert', 'data-act': 'load-error' }, el('div', { class: 'state-ic', 'aria-hidden': 'true' }, '!'), el('h2', {}, 'Could not load'), el('p', { class: 'small' }, e.message === 'unknown key' ? 'This link is not valid. Please ask Dongjae for your link. 링크를 확인해 주세요.' : 'Check your internet and try again. 인터넷 연결을 확인해 주세요. (' + e.message + ')'), btn('Try again', 'primary', function () { self.load(); }, { 'data-act': 'retry' }))));
    });
  };
  /** 받은 화면 값 넣기. again = 저장본으로 이미 그린 뒤 새 값 → 보던 문항 화면이면 다시 그리지 않고 돌아갈 때 반영 */
  App.prototype.gotData = function (d, fromCache, again) {
    var self = this;
    if (d && d.student && !this._pf) { this._pf = true; U.prefs(d.student.student_id).then(function (ch) { if (ch) { window.dispatchEvent(new Event('hw-prefs')); if (self.day) self.render(); } }); }   // T146k 학생 기본 설정(언어·로마자)
    var prevDay = this.day;   // T146zr 저장본으로 그린 뒤 늦게 온 서버 값: 이 기기에서 이미 한 단계는 남김
    if (again && !this.dayOverride && !U.PREVIEW && this.view === 'task') { this.dirty = true; return; }   // T146zs 문항 화면: day 를 바꾸지 않음(단추가 옛 문항을 잡음) → 목록으로 갈 때 뒤에서 다시 받음
    if (again && !this.dayOverride && /^(task|progress|settings|langs)$/.test(this.view || '')) {   // v2 문항·진척·설정 화면에 있을 때만 (목록은 바로 다시 그림)
      var keep = {}; (this.day ? this.day.tasks : []).forEach(function (t) { keep[t.task_id] = t; });
      this.data = d;
      this.day = d.day; this.overlayOutbox(); this.keepLocal(prevDay);
      // 보던 문항의 이 기기 상태(카드 순서·답면·방금 쓴 답)는 그대로
      this.day.tasks.forEach(function (t) { var o = keep[t.task_id]; if (o) ['_q', '_att', '_first', '_phase', '_typed', '_rec', '_more', '_draft', '_lastImg', '_lastTyped', '_skipW', '_enPick'].forEach(function (f) { if (o[f] !== undefined) t[f] = o[f]; }); });
      return;
    }
    this.data = d;
    if (this.dayOverride) return U.call('student.history', { key: self.key, dayset_id: self.dayOverride }).then(function (h) { self.day = h.day; self.overlayOutbox(); self.keepLocal(prevDay); self.render(); });
    this.day = d.day; this.overlayOutbox(); this.keepLocal(prevDay); this.render();
  };
  /** T146zr 서버 값으로 day 를 바꿀 때 이 기기에서 이미 끝낸 단계·넘긴 문항은 그대로 둔다.
   * 서버 값은 요청한 때의 것이라 그 뒤에 한 단계(미리 보기는 서버에 아예 없음)를 지우면 목록이 0/4 로 돌아가고
   * 카드 순서(_q)만 남아 '9 cards done' ↔ 목록 1/9 · Continue 무한 반복이 됨 (Chi 11/04) */
  App.prototype.keepLocal = function (prev) {
    var self = this, day = this.day, hit = false;
    if (!prev || !day || !day.tasks || prev.dayset_id !== day.dayset_id) return;
    var old = {}; (prev.tasks || []).forEach(function (t) { old[t.task_id] = t; });
    day.tasks.forEach(function (t) {
      var o = old[t.task_id]; if (!o) return;
      var ch = false, os = {}; (o.steps || []).forEach(function (s) { if (s.sub) os[s.step_id] = s.sub; });
      t.steps.forEach(function (s) { if (!s.sub && os[s.step_id]) { s.sub = os[s.step_id]; ch = true; } });
      if (ch) { self.localCard(t); hit = true; }
      if (o.status === 'skipped' && !finished(t) && t.status !== 'skipped') { t.status = 'skipped'; hit = true; }
    });
    if (hit) this.localRatio();
  };
  /* T146zr 미리 보기: 이 탭(sessionStorage)에서만 한 단계·넘긴 문항을 기억 — 서버 저장 0, 새로 고침·허브 다녀와도 그대로 */
  var PVK = 'hw_pv_done';
  function pvGet() { try { return JSON.parse(sessionStorage.getItem(PVK) || '{}'); } catch (e) { return {}; } }
  function pvPut(fn) { if (!U.PREVIEW) return; var m = pvGet(); fn(m); try { sessionStorage.setItem(PVK, JSON.stringify(m)); } catch (e) { /* 사생활 모드 = 메모리만 */ } }
  function pvKey(day, t) { return (day && day.dayset_id) + '|' + t.task_id; }
  App.prototype.pvStep = function (t, st) { var k = pvKey(this.day, t); pvPut(function (m) { var x = m[k] || (m[k] = { s: {} }); x.s[st.step_id] = 1; }); };
  App.prototype.pvSkip = function (t, on) { var k = pvKey(this.day, t); pvPut(function (m) { var x = m[k] || (m[k] = { s: {} }); if (on) x.k = 1; else delete x.k; }); };
  App.prototype.pvClear = function (t, st) { var k = pvKey(this.day, t); pvPut(function (m) { var x = m[k]; if (!x) return; if (st) delete x.s[st.step_id]; else delete m[k]; }); };
  /** 서버에서 받은 뒤 한 번: 연 시각 기록 · '바빠요' 링크 */
  App.prototype.afterServer = function (d, verOnly) {
    var self = this;
    this.fromServer = true;
    this.sendOpen(d);
    this.watchDay(); this.box.report(this.key);   // T146zy 날 바뀜 감시 · 오래 못 보낸 답 서버에 알림
    // 알림·이메일의 'Too busy today 😭' 링크(&busy=1) — 한 번 누른 것으로 끝 (화면에서 되돌리기 가능)
    if (U.qs('busy') === '1' && !self.busyDone) {
      self.busyDone = true;
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])busy=1&?/, '$1').replace(/[?&]$/, '')); } catch (e) { /* 무시 */ }
      if (!d.day.skipped_at && d.day.ratio < 0.999) self.skip(false);
    }
  };
  /** T146zy 열람 기록은 세트마다 한 번 (옛: 앱 한 번 → 날이 바뀐 탭은 새 날 열람이 안 감) */
  App.prototype.sendOpen = function (d) {
    if (!d || !d.day || d.day.opened_at || this.openSent === d.day.dayset_id) return;
    this.openSent = d.day.dayset_id; U.call('student.open', { key: this.key, dayset_id: d.day.dayset_id }, true).catch(function () {});
  };
  /* T146zy 탭·앱을 열어 둔 채 다음 날이 되면 옛 날 세트를 계속 보여 주던 것 (Chasity 11/02~04: 서버 흔적 0, 학생은 '했다').
   * 화면이 다시 보일 때·1분마다 학생 시간대 오늘과 비교 → 바뀌었으면 오늘 세트를 받음 (쓰는 중이면 목록으로 갈 때) */
  App.prototype.watchDay = function () {
    if (this._dw || U.PREVIEW) return; this._dw = true;
    try { this._dayFor = U.todayIn(this.data.student.tz); } catch (e) { /* 없음 */ }
    var self = this, chk = function () { if (!document.hidden) self.dayCheck(); };
    document.addEventListener('visibilitychange', chk); window.addEventListener('focus', chk); window.addEventListener('pageshow', chk);
    setInterval(chk, 60000);
  };
  App.prototype.dayCheck = function () {
    var d = this.data; if (!d || !d.day || !d.student || this.dayOverride || this._dayBusy) return false;
    if (d.schedule_mode === 'on_demand' || !d.day.local_date) return false;
    var today = U.todayIn(d.student.tz);
    if (today <= d.day.local_date || this._dayFor === today) return false;   // 오늘 세트가 없어 서버가 옛 날을 준 경우: 한 날에 한 번만 다시 받음
    if (this.midTask()) { this.dirty = true; return false; }
    var self = this; this._dayFor = today; this._dayBusy = true; this.open = null; this.view = 'list';
    U.toast(U.tx('New day — loading today’s homework.', '새 날이에요. 오늘 숙제를 불러와요.'));
    this.data = null; this.day = null;
    var p = this.load(); return (p && p.then ? p : Promise.resolve()).then(function () { self._dayBusy = false; }, function () { self._dayBusy = false; });
  };
  /* T146zs 이 폰의 완료 기록(localStorage, 10일): 한 단계·넘긴 문항. 저장본(hw_day_*)이 옛것이거나 서버 값이 늦게·비어 와도 '완료'가 이김.
   * 보낸 뒤 줄(Outbox)에서 빠진 답은 overlayOutbox 가 못 보던 것 → 다시 열면 저장본으로 0/1 이 보이던 원인 */
  function doneKey(key) { return 'hw_done_' + String(key || '').slice(0, 80); }
  App.prototype.ledger = function (fn) {
    if (U.PREVIEW) return {};
    var k = doneKey(this.key), m = U.store.get(k, {}) || {};
    if (fn) { fn(m); var now = Date.now(); Object.keys(m).forEach(function (x) { if (now - m[x] > 10 * 864e5) delete m[x]; }); U.store.set(k, m); }
    return m;
  };
  App.prototype.markDone = function (t, st, on) { var id = this.day.dayset_id + '|' + t.task_id + '|' + (st ? st.step_id : '*skip'); this.ledger(function (m) { if (on === false) delete m[id]; else m[id] = Date.now(); }); };
  App.prototype.clearDone = function (t) { var pre = this.day.dayset_id + '|' + t.task_id + '|'; this.ledger(function (m) { Object.keys(m).forEach(function (x) { if (x.indexOf(pre) === 0) delete m[x]; }); }); };
  var RANK = { todo: 0, open: 0, doing: 1, sent: 2, done: 3 };
  /** T146zs 서버가 준 카드 상태와 이 기기 상태 합치기: 완료가 이김 (앞 단계의 늦은 답이 'doing'·n_done 1 을 주어도 되돌리지 않음) */
  App.prototype.mergeCard = function (t, card) {
    var wasSkip = t.status === 'skipped';
    this.localCard(t);
    if (wasSkip && t.status !== 'sent') { t.status = 'skipped'; this.localRatio(); return; }   // 앞 단계 답이 넘긴 뒤에 와도 '넘김' 그대로
    if (card && (RANK[card.status] || 0) > (RANK[t.status] || 0)) t.status = card.status;
    if (card && card.score != null) t.score = card.score;
    if (card && card.n_done > t.n_done) t.n_done = card.n_done;
  };
  /** T146a 아직 서버에 못 보낸 제출(기기 줄)을 화면에 반영 — 저장본·새 값 모두 (같은 단계를 두 번 하지 않게) */
  App.prototype.overlayOutbox = function () {
    var self = this, day = this.day, hit = false; if (!day || !day.tasks) return;
    var led = this.ledger();   // T146zs 이 폰의 완료 기록
    day.tasks.forEach(function (t) {
      var pre = day.dayset_id + '|' + t.task_id + '|', ch = false;
      t.steps.forEach(function (s) { if (!s.sub && led[pre + s.step_id]) { s.sub = { grade_status: 'pending', _local: 1, auto: null, feedback: [] }; ch = true; } });
      if (ch) { self.localCard(t); hit = true; }
      if (led[pre + '*skip'] && !finished(t) && t.status !== 'skipped') { t.status = 'skipped'; hit = true; }
    });
    if (U.PREVIEW) {   // T146zr 미리 보기: 이 탭에서 한 것
      var pv = pvGet();
      day.tasks.forEach(function (t) {
        var x = pv[pvKey(day, t)]; if (!x) return; var ch = false;
        t.steps.forEach(function (s) { if (!s.sub && x.s && x.s[s.step_id]) { s.sub = { grade_status: 'preview', auto: null, feedback: [] }; ch = true; } });
        if (ch) self.localCard(t);
        if (x.k && !finished(t)) t.status = 'skipped';
        hit = hit || ch || !!x.k;
      });
    }
    (this.box.mem || []).concat(this.box.failed || []).forEach(function (it) {   // T146zp 서버가 받지 않은 답(실패 줄)도 이 기기에선 한 것으로 — 다시 불러와도 0으로 돌아가지 않게
      var p = it.payload || {}; if (p.dayset_id !== day.dayset_id) return;
      var t = day.tasks.filter(function (x) { return x.task_id === p.task_id; })[0]; if (!t) return;
      hit = true;
      if (it.action === 'student.step') { var st = t.steps.filter(function (x) { return x.step_id === p.step_id; })[0]; if (st && !st.sub) { st.sub = { grade_status: 'pending', _local: 1, _failed: it.err || undefined, auto: null, feedback: [] }; self.localCard(t); } }
      if (it.action === 'student.skip_task') { if (p.undo) self.localCard(t); else if (t.status !== 'sent' && t.status !== 'done') t.status = 'skipped'; }
    });
    if (hit) this.localRatio();
  };
  App.prototype.render = function () {
    var d = this.data, self = this;
    this.root.innerHTML = '';
    if (!d.student.consent_at) return this.renderIntro();
    var w = el('div', { class: 'wrap' });
    w.appendChild(el('div', { class: 'top' }, el('div', { class: 'brand' }, 'Korean ', el('b', {}, 'with Dongjae')), el('span', { class: 'grow' }),
      btn([U.icon('chart'), 'Progress'], 'ghost sm', function () { self.renderProgress(); }, { 'data-act': 'progress' })));
    if (!U.writeMode() && !U.PREVIEW) w.appendChild(this.deviceAsk());
    (d.unread_notifs || []).slice(0, 1).forEach(function (n) {
      w.appendChild(el('button', { class: 'banner', type: 'button', 'data-act': 'notif', onclick: function () { self.openNotif(n); } },
        el('span', { class: 'ic' }, U.icon('bell')), el('span', { class: 'grow' }, el('b', {}, n.kind === 'teacher_nudge' ? 'Dongjae sent you a reminder' : 'Reminder'), el('br'), el('span', { class: 'small' }, n.message || 'Today’s Korean is ready. Tap to start.'))));
    });
    var answered = (d.marks || []).filter(function (m) { return m.status === 'approved'; });
    if (answered.length && !this.dayOverride) w.appendChild(el('div', { class: 'banner', style: { background: 'var(--accent-soft)', cursor: 'default' }, 'data-act': 'marks-answered' },
      el('span', { class: 'ic' }, U.icon('bulb')), el('span', { class: 'grow small' }, el('b', {}, 'Dongjae explained ' + answered.map(function (m) { return '“' + m.text + '”'; }).slice(0, 2).join(', ')), ' — now in your review cards.')));
    if (this.dayOverride) w.appendChild(btn('← Back to today', 'ghost sm', function () { self.dayOverride = null; self.open = null; self.load(true); }, { 'data-act': 'back-today' }));
    else (d.previous || []).filter(function (p) { return p.feedback || p.status === 'partial'; }).slice(0, 1).forEach(function (p) {
      w.appendChild(el('button', { class: 'banner', type: 'button', style: { background: 'var(--surface-2)' }, onclick: function () { self.dayOverride = p.dayset_id; self.open = null; self.load(true); } },
        el('span', { class: 'ic' }, U.icon(p.feedback ? 'chat' : 'clock')), el('span', { class: 'grow small' }, el('b', {}, dayName(p.local_date, d.day.local_date)), ' · ',
          p.feedback ? p.feedback + ' comment' + (p.feedback > 1 ? 's' : '') + ' from Dongjae' : 'not finished — you can still finish it'), el('span', { class: 'chev' }, '›')));
    });
    if (this.day.skipped_at && !this.dayOverride) { w.appendChild(this.renderRest()); this.root.appendChild(w); return; }
    if (this.day.waiting_review) w.appendChild(el('div', { class: 'banner', style: { background: 'var(--accent-soft)', cursor: 'default' }, 'data-act': 'waiting-review' },
      el('span', { class: 'ic' }, U.icon('calendar')), el('span', { class: 'grow small' }, el('b', {}, 'Dongjae is preparing today’s homework.'), ' ',
        this.day.tasks.length ? 'For now, review your words below.' : this.day.fallback ? 'Meanwhile you can finish an earlier set.' : 'Check back a little later!')));
    var fb = this.day.waiting_review && !this.dayOverride ? this.day.fallback : null;   // T037: 비지 않게 — 다 못 한 지난 세트 이어서 하기
    if (fb) w.appendChild(el('button', { class: 'banner', type: 'button', 'data-act': 'fallback', onclick: function () { self.dayOverride = fb.dayset_id; self.open = null; self.load(true); } },
      el('span', { class: 'ic' }, U.icon('book')), el('span', { class: 'grow small' }, el('b', {}, 'Finish ' + dayName(fb.local_date, d.day.local_date)), ' — continue where you stopped'), el('span', { class: 'chev' }, '›')));
    if (!this.day.tasks.length && this.day.waiting_review) { this.root.appendChild(w); return; }
    if (!this.day.tasks.length) {   // T077 빈 날: 이유 한 줄 + 다음 행동 하나
      w.appendChild(el('div', { class: 'state empty-day', 'data-act': 'empty-day' }, el('div', { class: 'state-ic', 'aria-hidden': 'true' }, U.icon('inbox')),
        el('h2', {}, 'No homework today'), el('p', { class: 'small' }, 'New homework shows up here. 새 숙제가 오면 여기에 나와요.'),
        btn('See my progress', '', function () { self.renderProgress(); }, { 'data-act': 'empty-progress' })));
      this.root.appendChild(w); return;
    }
    w.appendChild(this.renderHero());
    w.appendChild(this.renderGroups());
    this.root.appendChild(w);
  };
  /** 쉬는 날 (학생이 '바빠요'를 눌렀거나 선생님이 정한 쉬는 요일) — 할 일 목록 대신 한 줄 + 되돌리기 */
  App.prototype.renderRest = function () {
    var self = this, d = this.data, planned = this.day.skip_reason === 'rest';
    return el('div', { class: 'hero rest', 'data-act': 'rest-day' },
      el('div', { class: 'meta' }, el('h1', {}, planned ? 'Rest day' : 'Resting today', ' ', el('span', { class: 'en', style: { fontSize: '17px' } }, '오늘은 쉬어요')), el('span', { class: 'grow' }),
        d.streak ? el('span', { class: 'chip k', title: 'Days in a row' }, U.icon('flame'), ' ' + d.streak) : null),
      el('p', { class: 'small', style: { margin: '6px 0 12px' } }, planned ? 'No homework today — enjoy your day off. See you tomorrow!'
        : 'No problem — your streak is safe. What you didn’t start moves to tomorrow. 내일 만나요!'),
      btn(planned ? 'Study anyway' : 'I can do it after all', 'sm', function () { self.skip(true); }, { 'data-act': 'unskip' }));
  };
  App.prototype.skip = function (undo) {
    var self = this;
    return U.call('student.skip', { key: this.key, undo: !!undo, reason: 'busy' }).then(function (r) {
      self.data.day = r.day; self.day = r.day; self.data.streak = r.streak; self.open = null; self.render(); window.scrollTo(0, 0);
      U.toast(undo ? U.tx('Welcome back — let’s go!', '다시 시작해요!') : U.tx('Rest today — see you tomorrow', '오늘은 쉬어요. 내일 만나요'));
    }, function (e) { U.toast(U.tx('Could not change — try again', '바꾸지 못했어요. 다시 해 주세요') + ' (' + e.message + ')'); });
  };
  App.prototype.askSkip = function () {
    var self = this;
    var sheet = el('div', { class: 'sheet bottom', role: 'dialog', 'aria-label': 'Take a rest day?', 'data-act': 'skip-sheet' }, el('div', { class: 'wrap' },
      el('h2', {}, 'Take a rest day?'),
      el('p', { class: 'small' }, 'Your streak stays, and what you haven’t started moves to tomorrow. 오늘은 쉬어도 괜찮아요.'),
      el('div', { class: 'actions' }, btn('Rest today', 'primary', function () { sheet.remove(); self.skip(false); }, { 'data-act': 'skip-confirm' }),
        btn('Keep going', 'ghost', function () { sheet.remove(); }, { 'data-act': 'skip-cancel' }))));
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.remove(); });
    document.body.appendChild(sheet);
  };
  function dayName(ymd, today) {
    var diff = Math.round((new Date(today) - new Date(ymd)) / 864e5);
    if (diff === 1) return U.tx('Yesterday', '어제');
    return new Date(ymd + 'T12:00:00Z').toLocaleDateString(U.lang() === 'ko' ? 'ko-KR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  function finished(t) { return t.status === 'sent' || t.status === 'done' || t.status === 'skipped'; }   // T119 넘긴 문항도 '끝난 것'으로 (다음으로)
  App.prototype.renderHero = function () {
    var self = this, day = this.day, done = day.tasks.filter(finished).length, d = this.data;
    var mins = Math.round(day.est_min), left = Math.round(day.tasks.filter(function (t) { return !finished(t); }).reduce(function (a, t) { return a + (t.est || 0) * (1 - t.n_done / Math.max(1, t.n_steps)); }, 0));
    var title = this.dayOverride ? dayName(day.local_date, d.day.local_date) : 'Today';
    return el('div', { class: 'hero' },
      el('div', { class: 'meta' }, el('h1', {}, title, ' ', el('span', { class: 'en', style: { fontSize: '17px' } }, this.dayOverride ? '' : '오늘의 숙제')), el('span', { class: 'grow' }),
        d.streak ? el('span', { class: 'chip k', title: 'Days in a row · freezes left', 'data-act': 'streak' }, U.icon('flame'), ' ' + d.streak, d.freezes_left !== undefined ? [' · ', U.icon('snow'), ' ' + d.freezes_left] : null) : null),
      el('div', { class: 'small', id: 'heroLine' }, done === day.tasks.length ? 'All done for today — 수고했어요!' : done + ' of ' + day.tasks.length + ' done · about ' + (done ? left : mins) + ' min ' + (done ? 'left' : 'in total')),
      el('div', { class: 'progress', 'aria-hidden': 'true' }, el('i', { style: { width: Math.round(day.ratio * 100) + '%' } })),
      day.mode === 'lite' ? el('div', { class: 'small', 'data-act': 'lite' }, 'Light restart: a shorter set today. Finish two days in a row and we go back to your usual amount.') : null,
      !this.dayOverride && done < day.tasks.length ? el('div', { class: 'row', style: { marginTop: '4px' } }, el('span', { class: 'grow' }),
        btn('Too busy today? 😭', 'ghost xs', function () { self.askSkip(); }, { 'data-act': 'busy' })) : null);
  };
  App.prototype.chip = function (t) {
    var seen = U.store.get('hw2_seen', {});
    if (t.has_teacher && !seen[this.day.dayset_id + t.task_id]) return el('span', { class: 'chip new' }, 'New feedback');
    if (t.status === 'todo') return el('span', { class: 'chip todo' }, 'To do');
    if (t.status === 'doing') return el('span', { class: 'chip doing' }, t.n_done + '/' + t.n_steps);
    if (t.status === 'sent') return el('span', { class: 'chip sent' }, 'Sent ✓');
    if (t.status === 'skipped') return el('span', { class: 'chip rest', 'data-act': 'skipped' }, U.tx('Skipped', '넘김'));
    return el('span', { class: 'chip done' }, t.type === 'cards' ? 'Done ✓' : t.score !== null ? '✓ ' + Math.round(t.score * 100) + '%' : 'Checked ✓');
  };
  function typeKey(t) { return t.type === 'cards' ? 'cards_' + t.mode : t.type; }
  function listenName(t) { if (t.mode === 'dialogue') return U.tx('Listen to a conversation from class', '수업 대화 듣기'); return t.mode === 'meaning' ? U.tx('Listen and choose the meaning', '듣고 뜻 고르기') : U.tx('Listen and write it in Korean', '듣고 받아쓰기'); }
  function mainTitle(s) { return String(s || '').replace(/\s*\(.*\)\s*$/, ''); }
  function subTitle(s) { var m = String(s || '').match(/\((.*)\)\s*$/); return m ? m[1] : ''; }
  function preview(t) {
    if (t.type === 'cards') return t.cards.length + ' cards' + (t.mode === 'new' ? ' · guess first' : '');
    if (t.type === 'sp_ko_en') return t.ko;
    if (t.type === 'sp_en_ko') return t.en;
    if (t.type === 'sp_qa') return t.q_ko;
    if (t.type === 'reading') return mainTitle(t.title);
    if (t.type === 'write') return t.prompt;
    if (t.type === 'grammar') return t.instruction;
    if (t.type === 'ctx') return t.sentence;
    if (t.type === 'mission') return (t.turns || []).length + ' questions · ' + (t.targets || []).join(', ');
    if (t.type === 'listen') return listenName(t);
    return '';
  }

  /* ---------- 묶음 → 카드 ---------- */
  App.prototype.renderGroups = function () {
    var self = this, box = el('div', { class: 'acc', id: 'taskList' });
    var firstOpen = null;
    GROUPS.forEach(function (g) {
      var ts = self.day.tasks.filter(function (t) { return U.grp(t) === g[0]; });
      if (ts.length && !firstOpen && ts.some(function (t) { return !finished(t); })) firstOpen = g[0];
    });
    if (this.gOpen === null) { this.gOpen = {}; if (firstOpen) this.gOpen[firstOpen] = true; }
    GROUPS.forEach(function (g) {
      var ts = self.day.tasks.filter(function (t) { return U.grp(t) === g[0]; });
      if (!ts.length) return;
      var nDone = ts.filter(finished).length, open = !!self.gOpen[g[0]] || ts.some(function (t) { return t.task_id === self.open; });
      var grp = el('section', { class: 'grp' + (open ? ' open' : ''), 'data-group': g[0] });
      grp.appendChild(el('button', { class: 'grp-head', type: 'button', 'aria-expanded': String(open), 'data-act': 'group', onclick: function () { self.gOpen[g[0]] = !open; if (open && ts.some(function (t) { return t.task_id === self.open; })) self.open = null; self.rerenderList(); } },
        el('span', { class: 'typeicon', 'aria-hidden': 'true' }, U.icon(g[1])), el('span', { class: 'ttl' }, el('b', {}, g[3]), ' ', el('span', { class: 'small' }, g[2])),
        el('span', { class: 'chip ' + (nDone === ts.length ? 'done' : nDone ? 'doing' : 'todo') }, nDone + '/' + ts.length), el('span', { class: 'chev', 'aria-hidden': 'true' }, '›')));
      if (open) {
        var inner = el('div', { class: 'grp-body' });
        ts.forEach(function (t) { inner.appendChild(self.renderItem(t)); });
        grp.appendChild(inner);
      }
      box.appendChild(grp);
    });
    return box;
  };
  App.prototype.renderItem = function (t) {
    var self = this, isOpen = this.open === t.task_id;
    var item = el('div', { class: 'acc-item' + (isOpen ? ' open' : ''), 'data-task': t.task_id, 'data-type': typeKey(t) });
    item.appendChild(el('button', { class: 'acc-head', type: 'button', 'aria-expanded': String(isOpen), onclick: function () { self.toggle(t.task_id); } },
      el('span', { class: 'ttl' }, el('span', { class: 'k1' }, (TYPE[typeKey(t)] || t.type) + (t.repeat ? ' · again' : '') + (t.register ? ' · ' + t.register : '')),
        el('span', { class: 'k2', lang: /^(sp_en_ko|write|grammar|mission)$/.test(t.type) || t.type === 'cards' ? 'en' : 'ko' }, preview(t))),
      this.chip(t), el('span', { class: 'chev', 'aria-hidden': 'true' }, '›')));
    if (isOpen) item.appendChild(this.renderBody(t));
    return item;
  };
  App.prototype.toggle = function (tid) {
    var now = U.actMs();   // T146s 활동 시계(벽시계 아님)
    if (this.open) { var a = this.tm(this.open); if (a.openAt) { a.dwell += now - a.openAt; a.openAt = null; } }
    this.open = this.open === tid ? null : tid;
    if (this.open) {
      var b = this.tm(this.open); b.openAt = now; b.stepStart = now;
      var t = this.task(tid); if (t && t.has_teacher) { var seen = U.store.get('hw2_seen', {}); seen[this.day.dayset_id + tid] = 1; U.store.set('hw2_seen', seen); }
      if (this.data.unread_notifs && this.data.unread_notifs.length) this.openNotif(this.data.unread_notifs[0], true);
    }
    if (this.dirty) { this.dirty = false; this.reloadDay(); } else this.rerenderList();
    var openEl = this.root.querySelector('.acc-item.open');
    if (openEl && openEl.scrollIntoView) { var r = openEl.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * 0.6) openEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  };
  App.prototype.task = function (tid) { return this.day.tasks.filter(function (t) { return t.task_id === tid; })[0]; };
  App.prototype.rerenderList = function () {
    var old = this.root.querySelector('#taskList'); if (old) old.replaceWith(this.renderGroups());
    var hero = this.root.querySelector('.hero'); if (hero) hero.replaceWith(this.renderHero());
  };
  App.prototype.openNotif = function (n, quiet) {
    var self = this;
    this.data.unread_notifs = (this.data.unread_notifs || []).filter(function (x) { return x.notif_id !== n.notif_id; });
    U.call('student.notif', { key: this.key, notif_id: n.notif_id, event: 'opened' }).catch(function () {});
    var b = this.root.querySelector('[data-act="notif"]'); if (b) b.remove();
    if (!quiet) { var first = this.day.tasks.filter(function (t) { return !finished(t); })[0]; if (first && !self.open) self.toggle(first.task_id); }
  };

  /* ---------- '모르겠어요' 표시: 낱말 누르기(다시 누르면 닫힘) 또는 끌어서 고르기 ---------- */
  App.prototype.markable = function (text, opts) {
    opts = opts || {};
    var self = this, wrap = el('div', { class: 'mk' }), box = el('div', { class: opts.cls || 'passage', lang: 'ko' }), bar = el('div', { class: 'mark-bar hidden', role: 'status' });
    var active = null, tapped = opts.tapped || {}, lookup = 'gloss' in opts && !!U.readGloss;   // T146zh 읽기 지문만 (번역 문장은 뜻 = 답이라 안 보임)
    var over = {};   // T146zj 이 지문만의 뜻(web/glr) — 과제 gloss·gl 보다 먼저
    if (lookup && U.textGloss) U.textGloss(text).then(function (o) { over = o || {}; });
    String(text || '').split(/(\s+)/).forEach(function (tok) {
      if (!tok || /^\s+$/.test(tok)) { box.appendChild(document.createTextNode(tok)); return; }
      var core = (tok.match(/[가-힣]+/) || [''])[0], g = (opts.gloss || {})[core];
      if (g && U.glossOk && !U.glossOk(core, g)) g = null;   // T146t R35
      var sp = el('span', { class: 'w' + (g ? ' g' : ''), 'data-w': core, onclick: function (e) {
        if (!core) return;
        var sel = window.getSelection && window.getSelection(); if (sel && String(sel).trim().length > 1) return;   // 끌어서 고르는 중
        e.stopPropagation();
        if (active === sp) { sp.classList.remove('on'); active = null; bar.classList.add('hidden'); return; }   // 다시 누르면 닫힘
        if (active) active.classList.remove('on');
        active = sp; sp.classList.add('on'); tapped[core] = 1;
        var g1 = over[core] && over[core].en ? over[core] : g;
        show(core, g1);
        if (!g1 && lookup) U.readGloss(core, text).then(function (g2) { if (g2) tapped[core] = 2; if (active === sp) show(core, g2, true); });   // T146zh R48 과제 gloss 에 없으면 gl 파일
      } }, tok);
      box.appendChild(sp);
    });
    function show(span, g, looked) {
      bar.classList.remove('hidden'); bar.innerHTML = '';
      bar.appendChild(el('div', { class: 'row wrapr', style: { gap: '8px' } },
        g ? el('span', { class: 'grow' }, el('b', { lang: 'ko' }, g.display), ' — ' + g.en) : el('span', { class: 'grow' }, el('b', { lang: 'ko' }, span), !lookup || looked === 'sel' ? null : el('span', { class: 'tiny', 'data-act': 'gloss-wait' }, ' — ' + (looked ? U.tx('no meaning saved yet. Tap “I don’t get this” to ask Dongjae.', '아직 뜻이 없어요. “모르겠어요”로 선생님께 물어요.') : '…'))),
        btn(U.tx('I don’t get this', '모르겠어요'), 'xs', function () { ask(span); }, { 'data-act': 'mark-open' }),
        btn('✕', 'ghost xs', function () { if (active) active.classList.remove('on'); active = null; bar.classList.add('hidden'); }, { 'aria-label': U.tx('Close', '닫기'), 'data-act': 'mark-close' })));
    }
    function ask(span) {
      var kind = '';
      bar.innerHTML = '';
      var kinds = el('div', { class: 'tags', role: 'group', 'aria-label': U.tx('What is hard?', '무엇이 어려워요?') }, KINDS.map(function (k) {
        return el('button', { type: 'button', class: 'tagc', 'data-kind': k[0], onclick: function (e) { kind = kind === k[0] ? '' : k[0]; kinds.querySelectorAll('.tagc').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-kind') === kind); }); e.stopPropagation(); } }, U.tx(k[1], k[2]));
      }));
      bar.appendChild(U.lang() === 'ko' ? el('div', { class: 'small' }, '“', el('b', { lang: 'ko' }, span), '”을(를) 선생님께 보낼까요? (어떤 점이 어려운지 골라도 돼요)')
        : el('div', { class: 'small' }, 'Send “', el('b', { lang: 'ko' }, span), '” to Dongjae? (optional: what kind)'));
      bar.appendChild(kinds);
      bar.appendChild(el('div', { class: 'actions' }, btn(U.tx('Send', '보내기'), 'primary xs', function () {
        U.call('student.mark', { key: self.key, dayset_id: self.day.dayset_id, task_id: opts.task_id || '', text: span, kind: kind, context: String(text).slice(0, 200), where: opts.where || '' })
          .then(function () { box.querySelectorAll('.w').forEach(function (w) { if (span.indexOf(w.getAttribute('data-w')) >= 0 && w.getAttribute('data-w')) w.classList.add('marked'); }); if (opts.onMark) opts.onMark(span); bar.classList.add('hidden'); if (active) active.classList.remove('on'); active = null; U.toast(U.tx('Sent to Dongjae — he will explain.', '선생님께 보냈어요. 설명해 줄 거예요.')); }, function (e) { U.toast(e.message); });
      }, { 'data-act': 'mark-send' }), btn(U.tx('Cancel', '취소'), 'ghost xs', function () { bar.classList.add('hidden'); }, {})));
    }
    function onSelect() {
      var sel = window.getSelection && window.getSelection(); if (!sel || sel.isCollapsed) return;
      var txt = String(sel).trim();
      if (txt.length < 1 || txt.length > 40 || !box.contains(sel.anchorNode) || !/[가-힣]/.test(txt)) return;
      if (active) { active.classList.remove('on'); active = null; }
      show(txt, null, 'sel');
    }
    box.addEventListener('mouseup', function () { setTimeout(onSelect, 0); });
    box.addEventListener('touchend', function () { setTimeout(onSelect, 250); });
    wrap.appendChild(box); wrap.appendChild(bar);
    wrap.tapped = tapped;
    return wrap;
  };
  /* T146c 듣기 = 선생님 목소리만(선생님 녹음·Dongjae 클론, 앱 T150 소리 창고). 목록 tts/<n>.json(tools/tts_map.py)에 있으면 틀고,
     없으면 버튼을 흐리게 + 누르면 1.5초 '준비 중'(바깥 누르면 닫힘). 녹음할 말 목록은 PC가 만듦(_want_hw.json). 브라우저 음성은 안 씀 */
  var TTS_BASE = 'https://g4jy.github.io/kwd-app-preview/a/', ttsBk = {}, ttsAu = null, ttsToast = 0;
  function ttsNorm(s) { return String(s || '').trim().replace(/[\s.?!,~]+$/, ''); }
  function ttsFind(text) {
    var k = ttsNorm(text); if (!k) return Promise.resolve(null);
    var b = (k.charCodeAt(0) % 16).toString(16);
    if (!ttsBk[b]) ttsBk[b] = fetch('tts/' + b + '.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { delete ttsBk[b]; return {}; });
    return ttsBk[b].then(function (m) { return m[k] || null; });
  }
  function ttsSoon() {
    U.toast(U.tx("Dongjae is recording this one — coming soon", '선생님 목소리로 준비 중이에요'), 1500); ttsToast = Date.now();
  }
  document.addEventListener('click', function (e) {
    if (ttsToast && Date.now() - ttsToast < 1500 && !(e.target.closest && e.target.closest('[data-act=listen]'))) {
      document.querySelectorAll('.toast').forEach(function (x) { x.remove(); }); ttsToast = 0;
    }
  }, true);
  /* T146k 두 꼴(읽다 / 읽어요)이 같이 보이면 둘 다 차례로(R19). 없는 꼴은 '준비 중' 알림(녹음할 말 목록은 tools/tts_map.py 가 카드 표시 꼴까지 넣음) */
  function speakBtn(text) {
    var list = [].concat(text).map(ttsNorm).filter(function (x, i, a) { return x && a.indexOf(x) === i; }), ids = list.map(function () { return null; });
    var b = btn(U.icon('speaker'), 'ghost xs off', function () {
      if (!ids.some(Boolean)) { ttsSoon(); return; }
      if (ttsAu) ttsAu.pause();
      var k = 0, miss = false;
      (function next() {
        while (k < ids.length && !ids[k]) { miss = true; k++; }
        if (k >= ids.length) { if (miss) ttsSoon(); return; }
        var au = ttsAu = new Audio(TTS_BASE + 'w/' + ids[k++] + '.mp3');
        au.onended = function () { if (ttsAu === au) next(); };
        U.playSafe(au, function () { U.toast(U.tx("Can't play the sound", '소리를 틀 수 없어요'), 1500); }, function () { return ttsAu === au; });   // T146zv 진짜 실패만 알림
      })();
    }, { 'aria-label': U.tx('Listen', '듣기'), 'data-act': 'listen', 'data-forms': String(list.length) });
    var pill = U.speedPill('off');   // T090 속도 알약 = 소리가 있을 때만 보임(소리 단추 바로 오른쪽)
    list.forEach(function (x, i) { ttsFind(x).then(function (id) { ids[i] = id; if (id) { b.classList.remove('off'); pill.classList.remove('off'); } }); });
    var fr = document.createDocumentFragment(); fr.appendChild(b); fr.appendChild(pill);
    return fr;
  }
  /** 카드에 보이는 꼴들: '읽다 / 읽어요' → [읽다, 읽어요] (표시가 한 꼴이면 c.ko 하나) */
  function cardForms(c) { var f = String(c.display || '').split(' / ').map(function (x) { return x.trim(); }).filter(Boolean); return f.length > 1 ? f : [c.ko]; }
  /* T146k 발음(R18) = 실제 소리 [익따]. T146q L3: 규칙 설명은 줄글로 펼치지 않고 '왜?' 버튼(처음 닫힘) 안에 —
     앱 노트에 자모 움직임 재료(web/cn wc·wl = 앱 pron_why.ch·long)가 있으면 플래시카드 앱 '왜?'처럼 받침이 옮겨 가는 움직임 + 규칙 한 줄 */
  var CHO_ = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split(''), JUNG_ = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split(''),
    JONG_ = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
    DBL_ = { 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ' };
  function jamoOf(ch) { var c = String(ch || '').charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? [CHO_[Math.floor(c / 588)], JUNG_[Math.floor(c % 588 / 28)], JONG_[c % 28]] : null; }
  function whyStage(ko, wl) {
    var st = el('div', { class: 'stage', 'data-act': 'pron-stage' });
    ko.split('').forEach(function (ch, i) {
      var j = jamoOf(ch), syl = el('span', { class: 'syl' });
      if (!j) syl.appendChild(el('i', { class: 't x' }, ch));
      else ['c', 'v', 'f'].forEach(function (s, k) { var x = k === 1 ? j[1] + ((wl || []).indexOf(i) >= 0 ? 'ː' : '') : j[k]; if (x) syl.appendChild(el('i', { class: 't ' + s, 'data-i': String(i), 'data-s': s }, x)); });
      st.appendChild(syl);
    });
    return st;
  }
  function runWhy(box, ko, pr, wc, wl) {
    var st = box.querySelector('.stage'), res = box.querySelector('.res'); if (!st) return;
    wl = wl || [];
    [].forEach.call(st.querySelectorAll('.fly'), function (f) { f.remove(); }); res.classList.remove('on');
    function T(i, s) { return st.querySelector('.t[data-i="' + i + '"][data-s="' + s + '"]'); }
    function sp(i) { return jamoOf(pr[i]) || ['', '', '']; }
    var d = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1, tt = 500 * d;
    [].forEach.call(st.querySelectorAll('.t'), function (x) { var i = +x.getAttribute('data-i'), s = x.getAttribute('data-s'), j = jamoOf(ko[i]); if (!j) return; x.className = 't ' + s; x.style.transform = ''; x.textContent = s === 'c' ? j[0] : s === 'v' ? j[1] + (wl.indexOf(i) >= 0 ? 'ː' : '') : j[2]; });
    wc.forEach(function (w) { var x = T(w[0], w[1]); if (x) x.classList.add('will'); });
    wc.forEach(function (w) {
      var i = w[0], s = w[1], to = w[3], x = T(i, s); if (!x) return; var b = sp(i);
      if (s === 'f' && to >= 0) {
        var tgt = T(to, 'c'), j = jamoOf(ko[i]), mv = DBL_[j[2]] ? DBL_[j[2]][1] : j[2];
        setTimeout(function () {
          if (!tgt || !x.isConnected) return; tgt.classList.add('ghost');
          var fly = x.cloneNode(true), r0 = x.getBoundingClientRect(), r1 = tgt.getBoundingClientRect(), rs = st.getBoundingClientRect();
          fly.className = 't fly'; fly.textContent = mv; fly.style.left = (r0.left - rs.left) + 'px'; fly.style.top = (r0.top - rs.top) + 'px';
          st.appendChild(fly); x.textContent = b[2];
          requestAnimationFrame(function () { fly.style.transform = 'translate(' + (r1.left - r0.left) + 'px,' + (r1.top - r0.top) + 'px)'; });
          setTimeout(function () { if (!b[2]) x.classList.add('gone'); fly.remove(); tgt.classList.remove('ghost'); tgt.classList.add('new'); tgt.textContent = sp(to)[0]; }, 650 * d);
        }, tt); tt += 800 * d;
      } else {
        setTimeout(function () { x.classList.add('hot'); setTimeout(function () { x.classList.remove('hot'); x.classList.add('new'); x.textContent = s === 'c' ? b[0] : s === 'v' ? b[1] + (wl.indexOf(i) >= 0 ? 'ː' : '') : b[2]; if (s === 'f' && !b[2]) x.classList.add('gone'); }, 350 * d); }, tt); tt += 500 * d;
      }
    });
    setTimeout(function () { res.classList.add('on'); }, tt + 100 * d);
  }
  function pronLine(text, note) {
    if (!window.Pron) return null;
    var P = window.Pron, ko = String(text || '').split('/')[0].trim().replace(/[?!.]+$/, ''), p = P.pron(ko), pr = note && note.pr ? note.pr.replace(/[?!.]+$/, '') : p.text;
    if (pr.length !== ko.length && p.text.length === ko.length) pr = p.text;   // T146zv 노트 발음이 다른 꼴(배웅하다 → [배웅])이거나 띄어쓰기를 붙였으면 이 낱말 계산값으로
    var ids = (note && note.w ? note.w : p.rules.map(P.ruleId)).filter(function (x, i, a) { return x && P.RULES[x] && a.indexOf(x) === i; });
    if (pr === ko && !ids.length) return null;
    var line = el('div', { class: 'pron', 'data-act': 'pron' }, el('span', { lang: 'ko' }, '[' + pr + ']'), note && note.pn ? el('span', { class: 'small', lang: 'ko', 'data-act': 'pron-note' }, ' ' + note.pn) : null);   // T146u M2 '[머딛따]도 표준 발음이에요.'
    var wc = note && note.wc && note.wc.length ? note.wc : P.changes ? P.changes(ko, pr) : [], wl = note && note.wl || [];   // T146zv wc 없는 카드도 글자↔소리 비교로 움직임
    var anim = !!(wc.length && ko.length === pr.length);
    if (!ids.length && !anim) return line;
    var panel = el('div', { class: 'why2', hidden: true, 'data-act': 'pron-panel' });
    if (anim) { panel.appendChild(whyStage(ko, wl)); panel.appendChild(el('div', { class: 'res', lang: 'ko', 'aria-live': 'polite' }, '[' + pr + ']')); }
    ids.forEach(function (id) { var R = P.RULES[id]; panel.appendChild(el('div', { class: 'pron-why', 'data-act': 'pron-why', 'data-rule': id }, el('p', {}, U.tx(R[1], R[0], 3)), R[2] ? el('p', { class: 'pron-ex', lang: 'ko' }, U.tx('e.g. ', '예: '), R[2]) : null)); });   // T146zv 규칙 한 줄 + 예 한 줄(줄글 0)
    if (anim) panel.appendChild(el('button', { class: 'more', type: 'button', 'data-act': 'pron-replay', onclick: function () { runWhy(panel, ko, pr, wc, wl); } }, U.tx('Replay', '다시 보기', 1)));
    var wb = el('button', { class: 'more why-btn', type: 'button', 'aria-expanded': 'false', 'data-act': 'pron-why-btn', onclick: function (e) {
      var o = panel.hasAttribute('hidden');
      if (o) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      e.currentTarget.setAttribute('aria-expanded', String(o));
      if (o && anim) runWhy(panel, ko, pr, wc, wl);
    } }, U.tx('Why does it sound like this?', '왜 이렇게 소리 나요?', 1));
    line.appendChild(wb); line.appendChild(panel);
    return line;
  }
  /* T146q L4 두 꼴 카드(계획하다 / 계획해요) = 꼴마다 소리 버튼 하나씩, 늘 보임. 녹음 없는 꼴은 흐린 버튼 + 누르면 '준비 중' */
  function formsNode(c) {
    var f = cardForms(c);
    if (f.length < 2) return el('span', {}, c.display || c.ko, ' ', speakBtn(f));
    return el('span', { class: 'forms', 'data-act': 'forms' }, f.map(function (x, i) { return el('span', { class: 'form1', 'data-form': String(i) }, i ? el('span', { class: 'sep', 'aria-hidden': 'true' }, '/') : null, x, ' ', speakBtn([x])); }));
  }

  /* ---------- 카드 몸통 ---------- */
  App.prototype.renderBody = function (t) {
    var self = this, body = el('div', { class: 'acc-body' });
    if (t.type === 'cards') { body.appendChild(this.renderCards(t)); if (!finished(t)) body.appendChild(this.skipRow(t)); return body; }
    if (t.type === 'diag') { body.appendChild(this.diagNode(t, function () { self.rerenderList(); })); if (!finished(t)) body.appendChild(this.skipRow(t)); return body; }
    if (t.type === 'sp_ko_en') body.appendChild(this.markable(t.ko, { cls: 'prompt-big', task_id: t.task_id, where: 'sentence' }));
    if (t.type === 'sp_en_ko') body.appendChild(el('div', { class: 'prompt-big en', lang: 'en' }, t.en));
    if (t.type === 'sp_qa') body.appendChild(this.markable(t.q_ko, { cls: 'prompt-big', task_id: t.task_id, where: 'question' }));
    if (t.type === 'write' && t.frame_ko) body.appendChild(el('div', { 'data-act': 'short-write' }, el('div', { class: 'small', lang: 'en' }, t.prompt), el('div', { class: 'prompt-big', lang: 'ko', 'data-act': 'frame' }, t.frame_ko), t.frame_en ? el('div', { class: 'small', lang: 'en' }, t.frame_en) : null));   // T093b 짧은 쓰기
    else if (t.type === 'write') body.appendChild(el('div', { class: 'prompt-big en', lang: 'en', style: { fontSize: '17px' } }, t.prompt));
    if (t.type === 'grammar') body.appendChild(fbNode(t) || this.markable(t.instruction, { cls: 'prompt-big en', task_id: t.task_id, where: 'grammar' }));
    if (t.type === 'ctx') body.appendChild(this.markable(t.sentence, { cls: 'prompt-big', task_id: t.task_id, where: 'context' }));
    if (t.type === 'mission') {
      body.appendChild(el('div', { class: 'small', style: { marginTop: '8px' } }, t.scene_en));
      body.appendChild(el('div', { class: 'tags', style: { margin: '6px 0' } }, el('span', { class: 'tiny' }, 'Try to use:'), (t.targets || []).map(function (x) { return el('span', { class: 'chip target', lang: 'ko' }, x); })));
    }
    if (t.type === 'listen') body.appendChild(this.listenNode(t));
    if (t.type === 'listen' && t.q_en) body.appendChild(el('div', { class: 'prompt', lang: 'en', style: { marginTop: '8px', fontWeight: 600 }, 'data-act': 'dialogue-q' }, t.q_en));   // T146z 대화 확인 질문
    if (t.type === 'reading') body.appendChild(el('div', { style: { marginTop: '8px' } }, el('div', { lang: 'ko', style: { fontWeight: 700, fontSize: '18px' } }, mainTitle(t.title)), subTitle(t.title) ? el('div', { class: 'tiny' }, subTitle(t.title)) : null));
    if (t.part) body.appendChild(el('div', { class: 'chip k', style: { margin: '6px 0 2px' }, 'data-act': 'part-note' }, 'Part ' + t.part.n + ' of ' + t.part.of + (t.part.n < t.part.of ? ' · the rest comes tomorrow' : ' · finish it today')));
    if (HOW[t.type] && !t.part) body.appendChild(el('div', { class: 'tiny' }, HOW[t.type]));
    // 읽기: 질문에 답할 때도 글을 다시 볼 수 있게 (읽기 단계를 끝냈거나, 이틀째 부분이면)
    if (t.type === 'reading' && t.text && (!t.steps[0] || t.steps[0].kind !== 'read' || t.steps[0].sub)) {
      body.appendChild(el('details', { class: 'passage-box', 'data-act': 'passage-again', open: t.part && t.part.n > 1 && !t.steps.some(function (x) { return x.sub; }) ? true : null },
        el('summary', {}, 'The text · 글 다시 보기'), this.markable(t.text, { cls: 'passage', gloss: t.gloss, task_id: t.task_id, where: 'reading' })));
    }
    var steps = el('ol', { class: 'steps' }), active = this.activeStep(t);
    t.steps.forEach(function (st, i) {
      var done = !!st.sub, isAct = st.step_id === active;
      var li = el('li', { class: 'step' + (done ? ' done' : '') + (isAct ? ' active' : ''), 'data-step': st.step_id, 'data-kind': st.kind });
      li.appendChild(el('div', { class: 'step-h', onclick: function () { if (!done) { t._active = st.step_id; self.rerenderList(); } } },
        el('span', { class: 'n' }, done ? '✓' : String(i + 1)), el('span', { class: 'grow' }, st.label_en),
        done ? el('span', { class: 'tiny' }, isWaiting(st.sub) ? U.tx('Dongjae is checking', '선생님 확인 중') : st.kind === 'record' ? 'recorded' : st.kind === 'hand' ? 'written' : 'done') : null));
      if (done) { var rs = self.stepResult(t, st); if (rs) li.appendChild(rs); }
      else if (isAct) li.appendChild(self.stepInput(t, st));
      steps.appendChild(li);
    });
    body.appendChild(steps);
    if (t.steps.some(function (x) { return isWaiting(x.sub); })) body.appendChild(el('div', { class: 'res wait', style: { marginTop: '10px' } }, U.tx('Sent. Dongjae is checking it and will reply here.', '보냈어요. 선생님이 확인 중이에요.')));
    if (finished(t)) body.appendChild(this.modelBox(t));
    (t.card_feedback || []).forEach(function (f) { body.appendChild(self.feedbackBox(f)); });
    if (t.type === 'mission') { var rep = null; t.steps.forEach(function (s) { if (s.sub && s.sub.auto && s.sub.auto.mission_report) rep = s.sub.auto.mission_report; }); if (rep) body.appendChild(missionReport(rep)); }
    var next = this.day.tasks.filter(function (x) { return x.task_id !== t.task_id && !finished(x); })[0];
    if (finished(t) && next) body.appendChild(el('div', { class: 'actions' }, el('span', { class: 'grow' }), btn('Next: ' + (TYPE[typeKey(next)] || '') + ' ›', 'ghost sm', function () { self.toggle(next.task_id); }, { 'data-act': 'next' })));
    if (!finished(t)) body.appendChild(this.skipRow(t));
    return body;
  };
  function missionReport(r) {
    function row(ic, label, xs) { return xs && xs.length ? el('div', {}, ic + ' ' + label + ': ', el('b', { lang: 'ko' }, xs.join(', '))) : null; }
    return el('div', { class: 'res ok', style: { marginTop: '10px' }, 'data-act': 'mission-report' }, el('div', { class: 'tiny' }, U.tx('Mission report', '미션 결과')),
      row('✓', U.tx('Used well', '잘 썼어요'), r.used), row('△', U.tx('Tried — small error', '써 봤어요 (작은 실수)'), r.tried), row('○', U.tx('Not tried yet', '아직 안 썼어요'), r.not_tried), row('•', U.tx('Other', '그 밖'), r.other));
  }
  App.prototype.feedbackBox = function (f) {
    var self = this, box = el('div', { class: 'fb', 'data-act': 'card-feedback' }, el('div', { class: 'row' }, el('b', {}, U.tx('Dongjae', '선생님')), f.score5 ? U.stars(f.score5) : null),
      (f.tags || []).length ? el('div', { class: 'tags', style: { margin: '4px 0' } }, f.tags.map(function (x) { return el('span', { class: 'chip k' }, x); })) : null,
      f.comment ? el('div', { lang: 'ko' }, f.comment) : null);
    if (f.audio_file_id) {
      var slot = el('div', { class: 'recbox', style: { marginTop: '6px' } }, btn([U.icon('speaker'), U.tx('Dongjae’s voice', '선생님 목소리')], 'xs', function () {
        slot.innerHTML = '<span class="tiny">…</span>';
        U.call('student.media', { key: self.key, file_id: f.audio_file_id }).then(function (m) { slot.innerHTML = ''; slot.appendChild(U.player(blobUrl(m), { auto: true, act: 'teacher-voice-player' })); }, function () { slot.textContent = U.tx('Could not load.', '불러오지 못했어요.'); });
      }, { 'data-act': 'teacher-voice' }));
      box.appendChild(slot);
    }
    return box;
  };
  /** data: 주소 소리는 Chrome 이 범위 요청 오류를 콘솔에 남김 → Blob 주소로 */
  function blobUrl(m) { try { var bin = atob(m.b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], { type: m.mime })); } catch (e) { return U.b64Url(m); } }
  /** T114 듣기 소리: 누르면 student.media 로 받아 재생 (한 번 받은 소리는 다시 쓰고, 다시 누르면 처음부터) */
  var LA = null;   // 듣기 소리는 화면 밖 Audio 하나로 (화면을 다시 그려도 끊기거나 다시 받지 않음)
  U._rateHook = function () { U.applyRate(LA); U.applyRate(ttsAu); };   // T090 재생 중 알약을 누르면 화면 밖 소리도 바로
  App.prototype.listenNode = function (t) {
    var self = this, slot = el('div', { class: 'listen-box', 'data-act': 'listen-audio' }), msg = el('div', { class: 'tiny', role: 'status', 'aria-live': 'polite' });
    function play(url) {
      if (!LA) {
        LA = new Audio();
        // 다 들으면 소리를 놓음 — 붙잡고 있으면 뒤에 마이크를 켤 때 Chrome 이 이 소리를 다시 읽으며 범위 오류를 남김
        LA.addEventListener('ended', function () { LA.removeAttribute('src'); LA.setAttribute('data-src', ''); try { LA.load(); } catch (e) { /* 무시 */ } });
      }
      if (LA.getAttribute('data-src') !== url) { LA.setAttribute('data-src', url); LA.src = url; } else { try { LA.currentTime = 0; } catch (e) { /* 아직 안 열림 */ } }
      window.KWD_LISTEN = LA;   // 시험용
      U.applyRate(LA);   // T090 속도
      var pr = LA.play(); if (pr && pr.catch) pr.catch(function () { msg.textContent = U.tx('Tap again to play.', '한 번 더 눌러 주세요.'); });
      msg.textContent = U.tx('Playing… tap to hear it again.', '재생 중… 다시 들으려면 또 누르세요.');
    }
    var b = btn([U.icon('speaker'), U.tx('Play the sound', '소리 듣기')], 'sm', function () {
      if (t._audioUrl) return play(t._audioUrl);
      b.disabled = true;
      U.call('student.media', { key: self.key, file_id: t.audio_file_id }).then(function (m) { b.disabled = false; t._audioUrl = blobUrl(m); play(t._audioUrl); },
        function () { b.disabled = false; msg.textContent = U.tx('Could not load the sound. Try again.', '소리를 불러오지 못했어요. 다시 눌러 보세요.'); });
    }, { 'data-act': 'listen-play' });
    slot.appendChild(el('div', { class: 'row listen-row' }, b, U.speedPill())); slot.appendChild(msg);   // T090 속도 알약
    return slot;
  };
  App.prototype.activeStep = function (t) {
    if (t._active && t.steps.some(function (s) { return s.step_id === t._active && !s.sub; })) return t._active;
    var s = t.steps.filter(function (x) { return !x.sub; })[0];
    return s ? s.step_id : null;
  };
  /** T146u M4b 서버가 섞어 보낸 모범 답·고르기 정답(Code.gs mkPack_) — 보낸 단계가 있을 때만 풂 */
  function unmk(t) {
    if (t._mkd !== undefined) return t._mkd;
    try { t._mkd = t._mk ? JSON.parse(String(t._mk).split('.').map(function (x) { return String.fromCharCode(parseInt(x, 36) ^ 90); }).join('')) : null; } catch (e) { t._mkd = null; }
    return t._mkd;
  }
  /** T146zq 단원 설명 읽기(preview_plan DOC: text = 핵심 한 줄 + 빈 줄 + 예문, 질문 q_en = 문형 이름 — 영어 설명 — 할 일) → 나눈 조각. 아니면 null */
  function docParts(t) {
    if (!t || t.type !== 'reading' || !/-DOC$/.test(String(t.item_id || ''))) return null;
    var tx = String(t.text || ''), cut = tx.indexOf('\n\n');
    if (cut < 0) return null;
    var sents = tx.slice(cut + 2).split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!sents.length) return null;
    var q = (t.questions || [])[0] || {}, parts = String(q.q_en || '').split(' — '), task = parts.length > 1 ? parts.pop() : String(q.q_en || '');
    var name = parts.length > 1 ? parts.shift() : '', expl = parts.join(' — ').trim();
    var nk = name.split(' ')[0];
    if (nk && expl.indexOf(nk + ':') === 0) expl = expl.slice(nk.length + 1).trim();   // 'N(으)로: 로 after…' 이름 되풀이 뺌
    var m = expl.match(/^.{20,110}?[.!?](?=\s|$)/), short = m ? m[0] : expl;
    var um = String(t.item_id || '').match(/(KWD-U\d+)-DOC$/);
    return { key: tx.slice(0, cut).trim(), sents: sents, name: name, expl: expl, short: short, task_en: task, task_ko: q.q || '', unit: um ? um[1] : '' };
  }
  /** T146zu 단원별 형태 표(tools/doc_how.py → web/dh/units.json {unit: {r: [[붙는 말, 영어, 모양, 예]], c: 머리|null, me, mk}}) → Promise(단원 또는 null) */
  var DH = null;
  function docHowData(unit) {
    if (!unit) return Promise.resolve(null);
    if (!DH) DH = fetch('dh/units.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { DH = null; return {}; });
    return DH.then(function (d) { return d[unit] || null; });
  }
  /** T146zu 형태 표: 줄마다 하나 (붙는 말 | 모양 | 예). 꼴 표가 아닌 단원은 그 표 머리 그대로 */
  function docTable(o) {
    var en = U.lang() !== 'ko', head, rows;
    if (o.c) {
      head = o.c.map(function (c) { return en && c[1] ? c[1] : c[0]; });
      rows = o.r.map(function (r) { return r.slice(0, head.length); });
    } else {
      head = [U.tx('With', '붙는 말'), U.tx('Form', '모양'), U.tx('Example', '예')];
      rows = o.r.map(function (r) { return [en && r[1] ? r[1] : r[0], r[2], r[3]]; });
    }
    return el('table', { class: 'doc-tbl', 'data-act': 'doc-table' },
      el('thead', null, el('tr', null, head.map(function (h) { return el('th', { scope: 'col' }, h); }))),
      el('tbody', null, rows.map(function (r) {
        return el('tr', null, r.map(function (x, i) { return el('td', { lang: !o.c && i === 0 && en ? 'en' : 'ko', class: !o.c && i === 1 ? 'doc-form' : null }, x); }));
      })));
  }
  /** T146zq 설명 상자: 문형 이름 + 설명 · T146zu: 단원 형태 표가 있으면 = 이름 → 뜻 한 줄 → 표 (한 문단 나열 0) */
  function docHow(dp) {
    var en = U.lang() !== 'ko' && dp.expl;
    var expl = en ? U.structNode(dp.expl, 'en', 'doc-expl') : U.structNode(dp.key, 'ko', 'doc-expl');   // T146zv 나열은 목록
    var box = el('div', { class: 'doc-how', 'data-act': 'doc-how' },
      el('p', { class: 'doc-lbl' }, U.tx('How it works', '문형')),
      dp.name ? el('p', { class: 'doc-name', lang: 'ko' }, dp.name.replace(/\s*\(([^)]*[가-힣][^)]*)\)\s*$/, '')) : null,
      expl);
    docHowData(dp.unit).then(function (o) {
      if (!o || !o.r || !o.r.length) return;
      var m = U.lang() !== 'ko' ? o.me : o.mk || dp.key;
      if (m) { var nx = U.structNode(m, U.lang() !== 'ko' ? 'en' : 'ko', 'doc-expl doc-mean'); expl.replaceWith(nx); expl = nx; } else expl.remove();
      box.appendChild(docTable(o));
    });
    return box;
  }
  /** T146zq 읽을 문장: 한 줄씩 [문장 + (선생님 소리 있으면) 소리] + 영어 뜻 한 줄. 낱말 누르기·끌어 표시는 그대로 */
  App.prototype.docSents = function (t, dp, opts) {
    var self = this, list = el('div', { class: 'doc-sents', 'data-act': 'doc-sents' });
    dp.sents.forEach(function (s) {
      var row = el('div', { class: 'doc-s' }), top = el('div', { class: 'doc-top' }, self.markable(s, Object.assign({}, opts, { cls: 'passage doc-p' })));
      row.appendChild(top);
      ttsFind(s).then(function (id) { if (id) top.appendChild(speakBtn(s)); });   // R53 선생님 소리만 (없으면 단추 없음)
      var en = el('div', { class: 'tiny doc-en', lang: 'en', 'data-act': 'doc-en' });
      U.exEn(s).then(function (v) { if (v) en.textContent = v; else en.remove(); });
      row.appendChild(en);
      list.appendChild(row);
      U.exHide(s, row);   // T088 입문 예문 숨김(xe '#hide')
    });
    return list;
  };
  /* T093 §4 (선생님 11/07) 문항마다 같은 자리(답 칸 바로 위): 답 형식 한 줄 + 형식 예 1개(다른 낱말, 이 문제 답과 겹치지 않음).
     정답 첫 글자·글자 수·정답 낱말 든 예 금지. 예는 아래 고정 목록에서 이 문항 글(정답·보기·지문)과 낱말이 겹치지 않는 첫 것. 검사 tests/test_t093_cue.js */
  var CUE_EX = {
    ko1: ['학교', '사과', '물', '친구', '가방', '책상'],
    kop: ['책을 읽다', '물을 마시다', '음악을 듣다', '친구를 만나다', '길이 막히다'],   // T093 구 카드 형식 예
    ko: ['저는 학생이에요.', '물을 마셔요.', '책이 있어요.', '친구를 만나요.', '사과가 좋아요.'],
    en: ['I drink water.', 'I have a bag.', 'My friend is here.', 'I like apples.', 'The cat sleeps.', 'We eat bread.', 'Birds sing.'],
    en1: ['school', 'apple', 'water', 'friend'],
    enq: ['Where is the bank?', 'What time is it?', 'Do you like tea?', 'Who is that?', 'Is it cold today?']
  };
  function cueWords(t) {
    var parts = [t.ko, t.en, t.q_ko, t.model_a, t.model, t.full, t.sentence, t.text_ko, t.answer, t.instruction, t.text, t.prompt]
      .concat(t.ko_answers || [], t.en_answers || [], t.options || [], t.model_answers || [], (t.questions || []).map(function (q) { return q.q + ' ' + (q.q_en || ''); }));
    var w = {}; parts.forEach(function (p) { String(p == null ? '' : p).toLowerCase().split(/[^a-z가-힣]+/).forEach(function (x) { if (x.length >= 1) w[x] = 1; }); });
    return w;
  }
  function cueStem(x) { return x.replace(/(이에요|예요|해요|어요|아요|요|를|을|이|가|은|는|도)$/, ''); }
  function cuePick(list, t) {
    var w = cueWords(t), ks = Object.keys(w);
    for (var i = 0; i < list.length; i++) {
      var toks = list[i].toLowerCase().split(/[^a-z가-힣]+/).filter(Boolean), bad = false;
      toks.forEach(function (x) { var s = cueStem(x); if (w[x] || (s.length >= 1 && ks.some(function (k) { return k.indexOf(s) === 0 && /[가-힣]/.test(s); }))) bad = true; });
      if (!bad) return list[i];
    }
    return null;
  }
  /** T094 글자 수 모양을 보일 정답(대표 정답 하나) — 정해진 답이 있는 칸만. 자유 쓰기(write·sp_qa·짧은 쓰기 틀)·글 질문은 null */
  function koTarget(t, st) {
    var k = st && st.kind, mk = unmk(t) || {};
    if (k === 'dictation') return t.answer || t.text_ko || mk.m || null;
    if (k !== 'hand') return null;
    // T094c 정답 여럿이면 ' / ' 로 모두 넘김 → U.koShape 가 모양이 다르면 '답 여러 개 가능'. 안 낸 과제는 서버가 답을 mk(m 첫 답, a 다른 답)로만 줌
    var al = [];
    function add(x) { x = String(x || '').trim(); if (x && al.indexOf(x) < 0) al.push(x); }
    if (t.type === 'sp_en_ko') { ((t.ko_answers || []).length ? t.ko_answers : [mk.m].concat(mk.a || [])).forEach(add); }
    else if (t.type === 'grammar') { add(t.model || mk.m); ((t.ko_answers || []).length ? t.ko_answers : mk.a || []).forEach(add); }
    else if (t.type === 'ctx') add(t.full || mk.m);
    return al.length ? al.join(' / ') : null;
  }
  function cueOneWord(t) { var m = (t.ko_answers || [])[0] || t.model || ''; return m && !/\s/.test(String(m).trim().replace(/[.?!]$/, '')); }
  /** → { fmt: [en, ko], ex: 예 글 | null, exLang } — 화면·시험 같은 규칙 */
  function cueOf(t, st) {
    var k = st && st.kind, ty = t.type, one = cueOneWord(t);
    var sts = t.steps || [], ix = sts.indexOf(st), prev = ix > 0 ? sts[ix - 1] : null;   // T093 단계 차례 따라 (앞 단계에서 쓴·고른 것을 말하기 등)
    if (k === 'record') {
      if (prev && /^(hand|choice|ko_answer)$/.test(prev.kind)) return { fmt: [prev.kind === 'choice' ? 'Say the sentence you chose out loud: tap the mic, speak, tap stop' : 'Say what you wrote out loud: tap the mic, speak, tap stop', prev.kind === 'choice' ? '고른 문장을 소리 내어 말하기: 마이크 누르고 말한 뒤 멈춤' : '방금 쓴 것을 소리 내어 말하기: 마이크 누르고 말한 뒤 멈춤'], ex: null };
      if (!prev && (t.ko || t.q_ko || t.text)) return { fmt: [ty === 'sp_qa' ? 'Read the Korean question out loud. You answer it in a later step' : 'Read the Korean out loud. The meaning comes next', ty === 'sp_qa' ? '한국어 질문을 소리 내어 읽기. 답은 다음 단계에서' : '한국어를 소리 내어 읽기. 뜻은 다음 단계에서'], ex: null };
      return { fmt: ['Say it out loud: tap the mic, speak, tap stop', '소리 내어 말하기: 마이크 누르고 말한 뒤 멈춤'], ex: null };
    }
    if (k === 'type_en') { var isQ = /\?\s*$/.test(String(t.ko || t.q_ko || '')); return { fmt: [isQ ? 'Type what the Korean question means in English' : 'Type what the Korean means in English (a full sentence)', isQ ? '한국어 질문의 뜻을 영어로 타자' : '한국어 뜻을 영어로 문장 하나 (타자)'], ex: cuePick(isQ ? CUE_EX.enq : CUE_EX.en, t), exLang: 'en' }; }
    if (k === 'hand' && ty === 'write' && t.frame_ko) return { fmt: ['Answer in Korean: one sentence. Put your own word in the blank, by hand', '한국어로: 빈칸에 내 낱말을 넣어 문장 하나, 손글씨'], ex: t.ex || null, exLang: 'ko' };   // T093b 짧은 쓰기(예 = 틀에 다른 낱말)
    if (k === 'hand') return ty === 'write' ? { fmt: ['Answer in Korean: a few sentences, by hand', '한국어로: 문장 몇 개, 손글씨'], ex: cuePick(CUE_EX.ko, t), exLang: 'ko' }
      : one ? { fmt: ['Answer in Korean: one word, by hand', '한국어로: 낱말 하나, 손글씨'], ex: cuePick(CUE_EX.ko1, t), exLang: 'ko' }
      : { fmt: ['Answer in Korean: a full sentence, by hand', '한국어로: 문장 하나, 손글씨'], ex: cuePick(CUE_EX.ko, t), exLang: 'ko' };
    var q_ = k === 'ko_answer' ? ((t.questions || [])[st.q || 0] || {}) : null;
    if (q_ && q_.type === 'content' && /^L[01]$/.test(String(t.band || ''))) return { fmt: ['Answer in Korean: a few words are OK (write it, then say it)', '한국어로: 낱말 몇 개도 돼요 (쓰고 말하기)'], ex: cuePick(CUE_EX.ko1, t), exLang: 'ko' };   // T093 §3 L0~1 글 내용 질문(Amari 11/02 건너뜀)
    if (k === 'ko_answer') return { fmt: ['Answer in Korean: a short sentence (write it, then say it)', '한국어로: 짧은 문장 (쓰고 말하기)'], ex: cuePick(CUE_EX.ko, t), exLang: 'ko' };
    if (k === 'choice') return { fmt: ['Tap one answer. No writing on this step', '답 하나 누르기. 이 단계는 쓰지 않아요'], ex: null };
    if (k === 'dq') return { fmt: ['Tap one answer, or “I don’t know”', '답 하나 누르기. 모르면 ‘모르겠어요’'], ex: null };
    if (k === 'dictation') return { fmt: ['Type in Korean exactly what you hear', '들은 한국어를 그대로 타자'], ex: cuePick(CUE_EX.ko, t), exLang: 'ko' };
    if (k === 'read') return { fmt: ['Read it. Tap any word you don’t know', '읽기만 해요. 모르는 낱말은 누르기'], ex: null };
    var cd_ = k === 'card' ? (t.cards || []).filter(function (c) { return st && 'c:' + c.item_id === st.step_id; })[0] : null;
    if (cd_ && /\s/.test(String(cd_.ko || '').trim())) return { fmt: ['Answer in Korean: a short phrase (type it or say it)', '한국어로: 짧은 말 (타자 또는 말하기)'], ex: cuePick(CUE_EX.kop, t), exLang: 'ko' };   // T093 '안경을 쓰다' 같은 구 = 낱말 하나 아님
    if (k === 'card') return { fmt: ['Answer in Korean: one word (type it or say it)', '한국어로: 낱말 하나 (타자 또는 말하기)'], ex: cuePick(CUE_EX.ko1, t), exLang: 'ko' };
    return null;
  }
  function cueNode(t, st) {
    var c = cueOf(t, st); if (!c) return null;
    return el('div', { class: 'ask-cue', 'data-act': 'ask-cue' }, el('p', { class: 'ask-fmt', 'data-act': 'ask-fmt' }, U.tx(c.fmt[0], c.fmt[1])),
      c.ex ? el('p', { class: 'ask-ex tiny', 'data-act': 'ask-ex' }, U.tx('Answer looks like: ', '답 모양 예: '), el('span', { lang: c.exLang }, c.ex), U.tx(' (only an example)', ' (모양만 보는 예)')) : null);
  }
  /** T146zq 읽기 질문 상자: 'About you' 이름표 → 할 일 한 줄(굵게) → (설명 읽기) 문형 설명 한 줄 + 예 1개 / (보통) 한국어 질문 밑 영어 */
  function qBox(t, st, q2) {
    var lbl = el('p', { class: 'doc-lbl', 'data-act': 'q-kind' }, q2.type === 'content' ? U.tx('About the text', '글 내용') : U.tx('About you', '내 이야기'));
    var dp = st.q === 0 ? docParts(t) : null;
    if (dp) {
      var task = U.lang() !== 'ko' && dp.task_en ? dp.task_en : dp.task_ko || dp.task_en, ex = dp.sents[0];
      var exEn = el('span', { class: 'tiny', lang: 'en' });
      U.exEn(ex).then(function (v) { if (v) exEn.textContent = ' = ' + v; });
      // T146zv 문형 = 이름 한 줄 → (단원 형태 표 있으면) 붙는 말|모양|예 표 · 없으면 설명을 줄마다·나열은 목록 (한 문단 나열 0)
      var pat = el('div', { class: 'small doc-pat', 'data-act': 'q-pattern' }, dp.name ? el('p', { class: 'doc-name', lang: 'ko' }, dp.name.replace(/\s*\(([^)]*[가-힣][^)]*)\)\s*$/, '')) : null);
      var ex0 = U.lang() !== 'ko' && dp.expl ? U.structNode(dp.expl, 'en', 'doc-expl') : null;
      if (ex0) pat.appendChild(ex0);
      docHowData(dp.unit).then(function (o) {
        if (!o || !o.r || !o.r.length) return;
        var m = U.lang() !== 'ko' ? o.me : o.mk || dp.key, nx = m ? U.structNode(m, U.lang() !== 'ko' ? 'en' : 'ko', 'doc-expl doc-mean') : null;
        if (ex0) ex0.remove();
        if (nx) pat.appendChild(nx);
        pat.appendChild(docTable(o));
      });
      // T093 §3 설명 읽기 질문이 진짜 질문(…?)이면 영어 화면에도 한국어 질문 + 영어 뜻(xe)을 보임 (Amari 11/07 '주말은 보통 뭐 안 해요?'가 안 보였음)
      var realQ = task !== dp.task_ko && /\?\s*$/.test(dp.task_ko) ? dp.task_ko : '', qEn = el('span', { class: 'tiny', lang: 'en' });
      if (realQ) U.exEn(realQ).then(function (v) { if (v) qEn.textContent = v; });
      return el('div', { class: 'qbox doc-q' }, lbl, el('div', { lang: task === dp.task_ko ? 'ko' : 'en', 'data-act': 'q-main', class: 'doc-task' }, task, task === dp.task_ko && U.romanNode ? U.romanNode(task, true) : null),
        realQ ? el('div', { class: 'doc-realq', 'data-act': 'q-real' }, el('b', { lang: 'ko' }, realQ), U.romanNode ? U.romanNode(realQ, true) : null, el('div', null, qEn)) : null,
        dp.name || ex0 ? pat : null,
        el('div', { class: 'small doc-ex', 'data-act': 'q-example' }, U.tx('Example: ', '예: '), el('b', { lang: 'ko' }, ex), exEn), ideasNode(q2));
    }
    var qm = U.dirTx(q2.q, q2.q_en);
    return el('div', { class: 'qbox' }, lbl, el('div', { lang: qm === q2.q ? 'ko' : 'en', class: 'doc-task', 'data-act': 'q-main' }, qm, qm === q2.q && U.romanNode ? U.romanNode(qm, true) : null), q2.q_en && q2.q_en !== q2.q && qm === q2.q ? el('div', { class: 'tiny' }, q2.q_en) : null, ideasNode(q2));
  }
  /** T146zv 내 문장(About you) 예시 영어 3개 — 떠올리기 어려우면 하나 골라 한국어로 (서버 question.ideas, tools/own_ideas.py) */
  function ideasNode(q2) {
    var xs = ((q2 && q2.ideas) || []).map(function (x) { return typeof x === 'string' ? x : x && x.en; }).filter(Boolean).slice(0, 3);
    if (!xs.length) return null;
    return el('div', { class: 'doc-ideas', 'data-act': 'q-ideas' }, el('p', { class: 'doc-lbl' }, U.tx('Stuck? Pick one and write it in Korean', '떠오르지 않으면 하나 골라 한국어로 써 보세요', 2)),
      el('ul', { class: 'st-list' }, xs.map(function (x) { return el('li', { lang: 'en' }, x); })));
  }
  App.prototype.modelBox = function (t) {
    var mk = t.steps.some(function (s) { return s.sub; }) ? unmk(t) || {} : {};
    if (mk.m || mk.s || mk.e) { t = Object.create(t); if (t.type === 'sp_ko_en' && !(t.en_answers || []).length) t.en_answers = [mk.m]; if (t.type === 'sp_en_ko' && !(t.ko_answers || []).length) t.ko_answers = [mk.m]; if (t.type === 'sp_qa' && !t.model_a) t.model_a = mk.m; if ((t.type === 'grammar' || t.type === 'write') && !t.model) t.model = mk.m; if (t.type === 'ctx' && !t.full) { t.full = mk.m; t.sentence_en = t.sentence_en || mk.s; } if (t.type === 'listen' && !t.text_ko) { t.text_ko = mk.m; t.en = t.en || mk.e; } }
    var m = null;
    if (t.type === 'sp_ko_en') m = (t.en_answers || [])[0];
    if (t.type === 'sp_en_ko') m = (t.ko_answers || [])[0];
    if (t.type === 'sp_qa') m = t.model_a || null;
    if (t.type === 'grammar' && t.mode === 'hand') m = t.model;
    if (t.type === 'write') m = t.model || null;
    if (t.type === 'ctx') m = t.full;
    if (t.type === 'listen') m = t.text_ko || null;
    var dl = t.type === 'listen' && t.mode === 'dialogue' ? t.lines || mk.l || null : null;   // T146z 대화: 화자 + 한국어 + 영어 줄마다
    if (dl && dl.length) return el('div', { class: 'res wait', style: { marginTop: '10px' }, 'data-act': 'dialogue-lines' }, el('span', { class: 'tiny' }, U.tx('The conversation', '들은 대화')),
      dl.map(function (x) { return el('div', { style: { marginTop: '6px' } }, el('span', { class: 'tiny' }, x.speaker === 'student' ? U.tx('Student', '학생') : U.tx('Teacher', '선생님')), el('div', { lang: 'ko' }, x.text_ko), x.en ? el('div', { class: 'tiny', lang: 'en' }, x.en) : null); }));
    if (!m) return el('span');
    var korean = /[가-힣]/.test(m), mLine = el('div', { class: 'model-line', 'data-act': 'model-line' }, el('span', { lang: 'ko' }, m));
    if (korean && t.type !== 'listen') ttsFind(m).then(function (id) { if (id) mLine.appendChild(speakBtn(m)); });   // T146zq 모범 답 소리 = 선생님 소리 있을 때만(R53)
    return el('div', { class: 'res wait', style: { marginTop: '10px' }, 'data-act': 'model-box' }, el('span', { class: 'tiny' }, (t.type === 'sp_qa' || t.type === 'write') ? U.tx('Example answer', '답 예시') : t.type === 'listen' ? U.tx('What you heard', '들은 문장') : U.tx('Model answer', '모범 답')), mLine,
      korean ? pronLine(m) : null, t.type === 'ctx' && t.sentence_en ? el('div', { class: 'tiny', lang: 'en' }, t.sentence_en) : null, t.type === 'listen' && t.en ? el('div', { class: 'tiny', lang: 'en' }, t.en) : null);
  };
  /** T109e AI 한 줄 의견: 한국어 설정이면 comment_ko (채점기가 줌). 선생님이 고친 의견(edited)은 선생님 글 그대로 */
  function cmt(a) { return U.lang() === 'ko' && a.comment_ko && !a.edited ? a.comment_ko : a.comment_en; }
  /** T140 AI 의견은 학습 내용(영어 글에 한국어 낱말 섞임) — 언어 표시를 달아 틀 글자와 구분 */
  function cmtNode(a, cls) { var c = cmt(a); return c ? el('div', { class: cls, lang: c === a.comment_ko ? 'ko' : 'en', style: cls ? { marginTop: '4px' } : null }, c) : null; }
  /** 미션 장면: scene_ko 가 없으면 정해진 안내 문장만 한국어로 */
  var SCENE_KO = { "Talk with Dongjae's assistant. Answer each question out loud in Korean.": '선생님 도우미와 이야기해요. 질문마다 한국어로 소리 내어 대답하세요.' };
  function scene(t) { return U.lang() === 'ko' ? t.scene_ko || SCENE_KO[t.scene_en] || t.scene_en : t.scene_en; }
  /* T146zb 고르기 결과 = 맞음/아쉬움 + '고른 것' + (틀리면) '정답' 두 줄 */
  function choiceRes(t, chosen, ok, answer, act) {
    var lg = t.type === 'listen' ? 'en' : 'ko';
    return el('div', { class: 'res ' + (ok ? 'ok' : 'bad'), 'data-act': act, 'data-ok': ok ? '1' : '0' },
      el('div', { style: { fontWeight: 600 } }, ok ? U.tx('Correct!', '맞아요!') : U.tx('Not quite', '아쉬워요')),
      chosen != null ? el('div', { class: 'small', 'data-act': 'your-choice' }, U.tx('Your choice: ', '고른 것: '), el('b', { lang: lg }, chosen)) : null,
      !ok && answer ? el('div', { class: 'small', 'data-act': 'right-answer' }, U.tx('Answer: ', '정답: '), el('b', { lang: lg }, answer)) : null);
  }
  /* T146zg 자동 채점 카드: 판정 한 줄 + 쓴 문장(틀린 곳 표시) + 고친 문장/모범 문장 + 짧은 설명. 녹음 = 들린 말 + 다르게 들린 낱말 */
  var VERDICT = { same: ['ok', 'Correct!', '맞아요!'], ok_nuance: ['ok', 'Correct — the nuance is a little different', '맞아요 — 느낌이 조금 달라요'],
    error: ['close', 'Almost — fix the marked part', '거의 맞아요 — 표시한 곳을 고쳐요'], meaning_diff: ['bad', 'The meaning is different', '뜻이 달라요'] };
  function marked(text, wrong) {
    text = String(text || ''); var parts = [text];
    (wrong || []).forEach(function (w) {
      if (!w) return; var out = [];
      parts.forEach(function (p) { if (typeof p !== 'string') { out.push(p); return; } var i = p.indexOf(w); if (i < 0) { out.push(p); return; } out.push(p.slice(0, i), el('mark', { 'data-act': 'wrong-part' }, w), p.slice(i + w.length)); });
      parts = out;
    });
    return el('span', { lang: 'ko' }, parts.filter(function (p) { return p !== ''; }));
  }
  function why(a) { return U.lang() === 'ko' ? a.why_ko || a.why_en : a.why_en || a.why_ko; }
  function verdictCard(t, st, a) {
    var v = VERDICT[a.verdict]; if (!v) return null;
    var free = t.type === 'sp_qa' || t.type === 'write' || st.kind === 'ko_answer', w = why(a), mine = a.ocr_text || '';
    return el('div', { class: 'res ' + v[0], 'data-act': 'verdict', 'data-v': a.verdict },
      el('div', { style: { fontWeight: 600 } }, U.tx(v[1], v[2])),
      el('div', { class: 'small', 'data-act': 'your-sentence' }, a.typed ? U.tx('You wrote: ', '쓴 답: ') : U.tx('We read: ', '읽은 글자: '), marked(mine, a.verdict === 'same' ? [] : a.wrong)),
      a.verdict === 'error' && a.corrected && a.corrected !== mine ? el('div', { class: 'small', 'data-act': 'fixed' }, U.tx('Fixed: ', '고친 문장: '), U.diffNode(mine, a.corrected)) : null,
      a.verdict !== 'same' && a.model ? el('div', { class: 'small', 'data-act': 'model' }, free ? U.tx('Example: ', '답 예시: ') : U.tx('Model: ', '모범 문장: '), el('span', { lang: 'ko' }, a.model)) : null,
      w ? el('div', { class: 'small', 'data-act': 'why', lang: w === a.why_ko ? 'ko' : 'en' }, w) : null);
  }
  /* T146zj 녹음 결과 '모범 소리 듣고 다시': 선생님 녹음(또는 선생님 클론, tts/ 목록)에 있는 문장일 때만 단추. 없으면 단추 없음(브라우저 TTS 안 씀).
     문장 = 모범 문장(mkPack_ m) → 고친 문장 → 녹음 목표(target) 순서로 첫 번째로 소리가 있는 것. 누르면 듣고 → 이 녹음 단계만 다시(student.skip_task redo + step_id) */
  function modelRedo(self, t, st, a, card) {
    if (!self || !t || !st || t.type === 'reading' || t.type === 'mission') return;
    var mk = unmk(t) || {}, cand = [mk.m, a.corrected, a.target].map(ttsNorm).filter(function (x, i, l) { return x && /[가-힣]/.test(x) && l.indexOf(x) === i; });
    (function tryAt(i) {
      if (i >= cand.length) return;
      ttsFind(cand[i]).then(function (id) {
        if (!id) { tryAt(i + 1); return; }
        var row = el('div', { class: 'actions', 'data-act': 'model-redo-row' });
        var b = btn(U.tx('Hear Dongjae, try again', '모범 소리 듣고 다시'), 'sm', function () {
          if (ttsAu) ttsAu.pause();
          b.disabled = true;
          var au = ttsAu = new Audio(TTS_BASE + 'w/' + id + '.mp3'), went = false;
          function go() { if (went) return; went = true; self.redoStep(t, st); }
          au.onended = go;
          U.playSafe(au, function () { b.disabled = false; U.toast(U.tx("Can't play the sound", '소리를 틀 수 없어요'), 1500); }, function () { return ttsAu === au; });   // T146zv
        }, { 'data-act': 'model-redo', 'data-say': cand[i] });
        row.appendChild(b); card.appendChild(row);
      });
    })(0);
  }
  /* T146zw 음절별 '다르게 들림': 내 문장에서 diff_syl 번호(한글 음절 순서) 음절만 표시 */
  function sylMarked(text, idx) {
    text = String(text || ''); var on = {}, k = 0, out = [], buf = '';
    (idx || []).forEach(function (i) { on[i] = 1; });
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i), h = c >= '가' && c <= '힣';
      if (h && on[k]) { if (buf) out.push(buf); buf = ''; out.push(el('mark', { 'data-act': 'diff-syl' }, c)); } else buf += c;
      if (h) k++;
    }
    if (buf) out.push(buf);
    return el('span', { lang: 'ko' }, out);
  }
  function heardCard(a, t, st, self) {
    var hw = a.heard_words || [], v = a.verdict === 'same' ? ['ok', 'Clear — we heard your sentence', '잘 들렸어요'] : hw.length ? ['close', 'Some parts sounded different', '다르게 들린 곳이 있어요'] : ['wait', 'What we heard', '들린 말'];
    var ps = typeof a.pron_score === 'number' ? a.pron_score : null;   // T146zk R56 발음 점수 1~5 + 다르게 들린 낱말 한 줄
    if (ps !== null) v[0] = ps >= 4 ? 'ok' : 'close';
    var card = el('div', { class: 'res ' + v[0], 'data-act': 'heard-card', 'data-v': a.verdict || '' },
      el('div', { style: { fontWeight: 600 } }, U.tx(v[1], v[2]), ps !== null ? el('span', { 'data-act': 'pron-score', style: { float: 'right' } }, U.tx('Pronunciation ', '발음 ') + ps + ' / 5') : null),
      a.transcript ? el('div', { class: 'small', 'data-act': 'heard' }, U.tx('We heard: ', '들린 말: '), marked(a.transcript, hw.map(function (x) { return x.heard; }))) : null,
      (a.diff_syl || []).length && a.target ? el('div', { class: 'small', 'data-act': 'syl-line' }, U.tx('Sounds to practise: ', '다시 연습할 소리: '), sylMarked(a.target, a.diff_syl)) : null,
      ps !== null ? (hw.length ? el('div', { class: 'small', 'data-act': 'heard-line' }, U.tx('Sounded different: ', '다르게 들린 낱말: '), hw.slice(0, 3).map(function (x, i) {
        return el('span', { lang: 'ko' }, (i ? ', ' : ''), '“' + (x.want || x.heard) + '”', x.want && x.heard ? ' → “' + x.heard + '”' : x.want ? U.tx(' (not heard)', ' (안 들림)') : U.tx(' (extra)', ' (더 들림)'));
      })) : null) : hw.slice(0, 3).map(function (x) {
        if (!x.want) return el('div', { class: 'small', 'data-act': 'heard-word' }, U.tx('Extra: ', '더 들린 말: '), el('b', { lang: 'ko' }, x.heard));
        return el('div', { class: 'small', 'data-act': 'heard-word' }, el('span', { lang: 'ko' }, '“' + x.want + '”'), x.heard ? U.tx(' sounded like ', ' → ') : U.tx(' — not heard', ' — 안 들렸어요'), x.heard ? el('b', { lang: 'ko' }, '“' + x.heard + '”') : null);
      }));
    if (a.verdict !== 'same') modelRedo(self, t, st, a, card);   // T146zj 잘 들린 녹음엔 단추 없음
    return card;
  }
  function isWaiting(s) { return !!s && !s._local && (s.grade_status === 'pending' || s.grade_status === 'ai_held' || s.grade_status === 'needs_teacher_review'); }
  App.prototype.stepResult = function (t, st) {
    var s = st.sub, box = el('div', { class: 'step-res' }), self = this;
    if (s.local_error && s.local_error !== 'already submitted' && st._retry) return el('div', { class: 'res bad', 'data-act': 'send-failed' }, el('div', { class: 'small' }, U.tx('This answer was not sent.', '이 답을 보내지 못했어요.')),   // T146u M4b 보내기 실패 → 다시 보내기
      btn(U.tx('Send again', '다시 보내기'), 'sm', function () { var r = st._retry; st._retry = null; r(); }, { 'data-act': 'resend' }));
    if (s.grade_status === 'pending' && s._choice !== undefined && st.kind === 'choice' && t.options) {   // T146zb 인터넷 없어 기기에 줄 선 고르기도 바로 결과
      var qm = unmk(t) || {}, qc = t.options[s._choice];
      if (qc != null && qm.k && qm.k.length) return choiceRes(t, qc, qm.k.indexOf(qc) >= 0, qm.k.join(' / '), 'local-result');
    }
    if (isWaiting(s)) return null;
    if (s._local) return el('div', { class: 'tiny', 'data-act': 'saved-local' }, U.tx('Saved on this phone ✓ It will send when the internet works.', '이 폰에 저장했어요 ✓ 인터넷이 되면 보내요.'));   // T146zf
    if (s.grade_status === 'sending') {   // T146q A9 · T146u M4b 고르기는 서버 답 전에 맞고 틀림을 바로 (정답 = mkPack_ k)
      var mk = unmk(t) || {}, ch = st.kind === 'choice' && s._choice !== undefined && t.options ? t.options[s._choice] : null;
      if (ch !== null && mk.k && mk.k.length) return choiceRes(t, ch, mk.k.indexOf(ch) >= 0, mk.k.join(' / '), 'local-result');
      if (ch !== null) return el('div', { class: 'res wait', 'data-act': 'sending-note' }, U.tx('Your choice: ', '고른 것: '), el('b', { lang: t.type === 'listen' ? 'en' : 'ko' }, ch));
      return el('div', { class: 'tiny', 'data-act': 'sending-note', 'data-hand': (st.kind === 'hand' || st.kind === 'ko_answer') ? '1' : null }, (st.kind === 'hand' || st.kind === 'ko_answer') && !U.PREVIEW ? U.tx('Sending… Your mark comes a few minutes after it is saved.', '보내는 중… 저장되면 몇 분 뒤에 채점 결과가 나와요.') : U.tx('Sending…', '보내는 중…'));   // T146zx 선생님 11/04: 저장 전엔 '보내는 중'(옛 T146zb '저장했어요 ✓'는 보내기 전에도 떠서 틀림) — 위 색 띠가 Done ✓ 로 바뀜
    }
    if (s.grade_status === 'preview') {   // T146zb 미리 보기도 고르기는 고른 것·정답 (모범 답 묶음이 있을 때)
      var pm = unmk(t) || {}, pc = st.kind === 'choice' && s._choice !== undefined && t.options ? t.options[s._choice] : null;
      var pn = el('div', { class: 'tiny', 'data-act': 'preview-note' }, U.tx('Preview — not saved', '미리 보기 — 저장하지 않았어요'));
      if (pc !== null && pm.k && pm.k.length) { box.appendChild(choiceRes(t, pc, pm.k.indexOf(pc) >= 0, pm.k.join(' / '), 'local-result')); box.appendChild(pn); return box; }
      return pn;
    }   // T119 미리 보기에서도 다음 단계로
    var a = s.auto || {};
    if (st.kind === 'choice') {
      var an = s.answer || {}, chS = an.choice !== undefined && t.options ? t.options[an.choice] : s._choice !== undefined && t.options ? t.options[s._choice] : null;
      box.appendChild(choiceRes(t, chS, a.status === 'correct', a.correct, 'choice-result'));
    } else if (st.kind === 'dictation') {
      var c3 = a.status === 'correct' ? 'ok' : a.status === 'close' ? 'close' : 'bad';
      box.appendChild(el('div', { class: 'res ' + c3, 'data-act': 'dictation-result' }, el('div', { class: 'tiny' }, a.status === 'correct' ? U.tx('Correct!', '맞아요!') : U.tx('Compare with the sentence', '들은 문장과 비교')), U.diffNode(a.typed || '', a.target || a.correct || '')));
    } else if (st.kind === 'read') {
      box.appendChild(el('div', { class: 'tiny' }, (a.looked_up || []).length ? U.tx('Words you looked up come back in review: ', '찾아본 낱말은 복습에 다시 나와요: ') + a.looked_up.join(', ') : U.tx('Read ✓', '읽음 ✓')));
    } else if ((st.kind === 'hand' || st.kind === 'ko_answer') && a.verdict && VERDICT[a.verdict] && !a.edited) {   // T146zg
      box.appendChild(verdictCard(t, st, a));
    } else if (st.kind === 'record' && a.release && s.grade_status === 'auto_checked') {   // T146zg 문장 말하기
      box.appendChild(heardCard(a, t, st, this));
    } else if ((st.kind === 'hand' || st.kind === 'ko_answer') && a.ocr_text) {
      var cls = a.status === 'correct' ? 'ok' : a.status === 'close' ? 'close' : 'bad';
      box.appendChild(el('div', { class: 'res ' + cls }, el('div', { class: 'tiny' }, (a.typed ? U.tx('You typed', '쓴 답') : U.tx('What we read from your writing', '손글씨에서 읽은 글자'))), U.diffNode(a.ocr_text, a.corrected || a.target || a.ocr_text),
        cmtNode(a, 'small')));
    } else if (st.kind === 'type_en' && s.grade_status !== 'teacher_reviewed') {
      var c2 = a.status === 'correct' ? 'ok' : a.status === 'close' ? 'close' : 'bad';
      box.appendChild(el('div', { class: 'res ' + c2 }, a.ocr_text && !(s.answer || {}).text ? el('div', { class: 'small', 'data-act': 'heard' }, (s.answer || {}).mode === 'audio' ? U.tx('What we heard: ', '들린 말: ') : U.tx('What we read: ', '읽은 글자: '), el('span', { lang: 'en' }, a.ocr_text)) : null, cmtNode(a, '') || U.tx('Checked', '확인함'), a.corrected && a.status !== 'correct' ? el('div', { class: 'small' }, U.tx('Better: ', '더 좋은 답: '), el('span', { lang: 'en' }, a.corrected)) : null));
    }
    (s.feedback || []).forEach(function (f) {
      if (f.source !== 'teacher') return;
      box.appendChild(el('div', { class: 'fb' }, el('div', { class: 'row' }, el('b', {}, U.tx('Dongjae', '선생님')), U.stars(f.score5 || 0)), f.comment ? el('div', { lang: 'ko' }, f.comment) : null));
    });
    return box.childNodes.length ? box : null;
  };
  /** T146w C3 녹음 단계 위 '내 답' (모든 쓰기→녹음: sp_en_ko·grammar·write). slot 없으면 화면에서 찾음 */
  App.prototype.fillMine = function (t, st, slot) {
    slot = slot || document.querySelector('[data-act="my-writing-slot"][data-task="' + t.task_id + '"]');
    if (!slot) return;
    st = st || t.steps.filter(function (x) { return x.kind === 'record' && !x.sub && t.steps.some(function (h) { return h.kind === 'hand' && t.steps.indexOf(h) < t.steps.indexOf(x); }); })[0] || t.steps.filter(function (x) { return x.kind === 'record' && !x.sub; })[0];   // T146y sp_qa = 쓰기 뒤 녹음(s3)
    if (!st) return;
    var prev = null; t.steps.forEach(function (x) { if (x !== st && x.sub && t.steps.indexOf(x) < t.steps.indexOf(st)) { var an = x.sub.answer || {}, au = x.sub.auto || {}; if (an.typed || au.ocr_text) prev = an.typed || au.ocr_text; } });
    var wrote = t.steps.some(function (x) { return x.kind === 'hand' && t.steps.indexOf(x) < t.steps.indexOf(st); });
    var myTx = t._lastTyped || (!t._lastImg ? prev : null), chosen = null;
    if (t.type === 'grammar') { var s0 = t.steps[0].sub; chosen = s0 && s0.answer && s0.answer.choice !== undefined && t.options ? t.options[s0.answer.choice] : null; }
    slot.innerHTML = '';
    if (t.type !== 'reading' && t.type !== 'mission' && wrote && (t._lastImg || myTx)) slot.appendChild(el('div', { class: 'mine', 'data-act': 'my-writing' }, el('p', { class: 'steplbl' }, U.tx('Your answer — read it aloud', '내 답 — 소리 내어 읽어요')),
      t._lastImg ? el('img', { class: 'thumb', src: t._lastImg, alt: U.tx('Your answer', '내 답') }) : el('div', { class: 'prompt-big', lang: 'ko', style: { fontSize: '19px' } }, myTx)));
    else if (t.type === 'grammar' && !chosen) slot.appendChild(el('div', { class: 'tiny' }, U.tx('Read the sentence you wrote.', '내가 쓴 문장을 읽어요.')));
    else if (t.type === 'sp_en_ko') slot.appendChild(el('div', { class: 'tiny' }, U.tx('Read your own Korean sentence aloud.', '내가 쓴 한국어 문장을 소리 내어 읽어요.')));
  };
  /** T146zx 말하기 단서: 서버 cues(생성기, 차례별) > 글에서 나눔(옛 과제). 나열 아니면 null */
  App.prototype.cuesOf = function (t, turn) {
    var stu = (this.data || {}).student || {}, lv = stu.level || stu.band, ts = t.turns || [], c = t.cues && t.cues[turn || 0];
    if (c && c.items && c.items.length >= 2) return Object.assign({}, c, { items: c.items.map(function (x) { return Object.assign({}, x, { start: U.cueStart(x.ko, x.en, c.reg, lv) }); }) });   // 생성기 단서 + 이 학생 레벨 시작 표현
    return U.speakCues(ts[turn || 0], ts.length === 1 ? t.scene_en : null, lv);
  };
  App.prototype.stepInput = function (t, st) {
    var self = this, b = el('div', { class: 'step-b' }), getAns = null, getMedia = null, getMedia2 = null;
    var doneBtn = btn(U.tx('Done ✓', '완료 ✓'), 'primary sm', function () { self.submitStep(t, st, getAns ? getAns() : {}, getMedia, doneBtn, getMedia2); }, { 'data-act': 'done', disabled: true });
    // T119 꺼진 완료 버튼 옆에는 왜 꺼졌는지 한 줄 (켜지면 사라지거나 '녹음은 선택' 안내)
    var why = el('div', { class: 'tiny why', 'data-act': 'why', role: 'status', 'aria-live': 'polite' });
    var cardB = !!t._cardB;   // T146zd B안 카드: 버튼·이름표와 같은 말은 안 씀
    function setReady(v, note) { doneBtn.disabled = !v; why.textContent = v ? (note || '') : (WHY[st.kind] && !(cardB && st.kind === 'choice') ? U.tx(WHY[st.kind][0], WHY[st.kind][1]) : ''); why.hidden = !why.textContent; }
    var recNote = U.tx('Recording is optional.', '녹음은 선택이에요.');
    // T094 (선생님 11/07) 정답이 정해진 한국어 칸(번역·문형·빈칸 문장 손글씨, 받아쓰기) = 글자 수 모양 + [힌트]. 5어절 넘으면 단서 줄('문장 하나')만
    var shT = koTarget(t, st), shSt = { used: !!(t._hint && t._hint[st.step_id]), onHint: function () { (t._hint = t._hint || {})[st.step_id] = 1; } };
    var shNode = shT && U.koShape(shT) && !U.koShape(shT).sentence ? U.shapeRow(shT, shSt) : null;
    if (shNode) b.appendChild(shNode);
    if (st.kind === 'record') {
      var say = null;
      if (t.type === 'reading') say = this.markable(docParts(t) ? docParts(t).sents.join('\n') : t.read_aloud, { cls: 'passage', task_id: t.task_id, where: 'read-aloud', gloss: t.gloss });   // T146zq 설명 읽기 = 예문만 소리 내어
      if (t.type === 'sp_qa' && st.step_id === 's3' && !t.steps.some(function (x) { return x.kind === 'hand' && t.steps.indexOf(x) < t.steps.indexOf(st); })) b.appendChild(el('div', { class: 'tiny' }, U.tx('Answer about yourself — in Korean.', '내 이야기로 한국어로 대답하세요.')));   // 옛 순서(녹음 → 쓰기) 세트만
      if (t.type === 'grammar') {
        var chosen = t.steps[0].sub && t.steps[0].sub.answer && t.steps[0].sub.answer.choice !== undefined && t.options ? t.options[t.steps[0].sub.answer.choice] : null;
        if (chosen) b.appendChild(el('div', { class: 'prompt-big', lang: 'ko', style: { fontSize: '19px' } }, chosen));
      }
      // T146u M3 (선생님 10/31 Amari) 녹음 단추 위에 내가 쓴 답 — 이 기기 손글씨·사진·타자, 없으면 서버에 간 앞 단계(타자·손글씨에서 읽은 글자)
      // T146w C3: 실제 학생(미리 보기 아님)은 앞 단계 보내기를 기다리지 않고 녹음 화면을 먼저 그림 → 그때는 아직 _lastTyped/_lastImg 없음.
      //   그래서 자리(slot)를 두고, 앞 단계 내보내기가 끝나면 fillMine 이 채움.
      var slot = el('div', { 'data-act': 'my-writing-slot', 'data-task': t.task_id });
      this.fillMine(t, st, slot);
      b.appendChild(slot);
      if (t.type === 'mission') {
        var q = (t.turns || [])[st.turn] || '', qd = U.dirTx(q, t.scene_en), cq = this.cuesOf(t, st.turn);
        if (cq) b.appendChild(U.cueNode(cq));   // T146zx 나열형 = 번호 단서(녹음 중에도 보임)
        else b.appendChild(el('div', { class: 'bubble', lang: qd === q ? 'ko' : 'en', 'data-act': 'mission-q' }, el('span', { class: 'tiny' }, 'Q' + (st.turn + 1) + ' '), qd, qd === q ? speakBtn(q) : null));
      }
      if (t.type === 'mission') b.appendChild(U.notesNode(t.task_id));   // T146zx 메모 칸 (이 기기만, 제출물 아님)
      if (say) b.appendChild(say);
      // T119 녹음은 선택: 녹음 없이 완료하면 소리 없이 기록 (마이크 거부·고장이어도 갇히지 않음)
      var w = U.recWidget({ label: U.tx('Record', '녹음'), max: t.type === 'reading' ? 180 : t.type === 'mission' ? 60 : 45, onReady: function (r) { setReady(true, r ? '' : recNote); }, onNoMic: function () { setReady(true); } });
      b.appendChild(w.node);
      setReady(true, recNote);
      getAns = function () { var r = w.result(); return { sec: r ? r.sec : 0 }; };
      getMedia = function () { var r = w.result(); return r ? U.blobToB64(r.blob).then(function (b64) { return { b64: b64, mime: r.mime }; }) : Promise.resolve(null); };
    } else if (st.kind === 'type_en' && (!U.enMode() || t._enPick)) {   // T146a 처음 한 번(또는 '답 방식 바꾸기'): 어떻게 답할까요?
      b.appendChild(this.enModePick(t));
      return b;
    } else if (st.kind === 'type_en' && U.enMode() !== 'type') {
      var em = U.enMode(), got = null;
      b.appendChild(el('div', { class: 'tiny', 'data-act': 'en-mode-note' }, em === 'speak' ? U.tx('Say your answer in English.', '답을 영어로 말하세요.') : U.tx('Write your answer in English on paper, then take a photo.', '답을 영어로 종이에 쓰고 사진을 찍으세요.')));
      if (em === 'speak') {
        var wE = U.recWidget({ label: U.tx('Record', '녹음'), max: 45, onReady: function (r) { got = r ? { blob: r.blob, mime: r.mime, sec: r.sec } : null; setReady(!!got); } });
        b.appendChild(wE.node);
      } else {
        var shot = el('div', { class: 'en-photo', 'data-act': 'en-photo' });
        var useE = function (f) { if (!f) return; U.shrinkImage(f, 1600).then(function (x) { return x; }, function () { return f; }).then(function (bl) { got = { blob: bl, mime: bl.type || 'image/jpeg' }; shot.innerHTML = ''; var u = URL.createObjectURL(bl); t._lastImg = u; shot.appendChild(el('img', { class: 'thumb', src: u, alt: U.tx('Your answer', '내 답') })); setReady(true); }); };
        var fileE = el('input', { type: 'file', accept: 'image/*', class: 'hidden', 'data-act': 'en-photo-file', onchange: function () { useE(fileE.files && fileE.files[0]); } });
        b.appendChild(el('div', { class: 'actions' },
          btn(U.tx('Take photo', '사진 찍기'), 'sm', function () { U.camera().then(useE); }, { 'data-act': 'en-photo-take' }),
          btn(U.tx('Choose photo', '사진 고르기'), 'sm', function () { fileE.value = ''; fileE.click(); }, { 'data-act': 'en-photo-pick' })));
        b.appendChild(shot); b.appendChild(fileE);
      }
      getAns = function () { return { text: '', mode: em === 'speak' ? 'audio' : 'photo', sec: (got && got.sec) || 0 }; };
      getMedia = function () { return got ? U.blobToB64(got.blob).then(function (b64) { return { b64: b64, mime: got.mime }; }) : Promise.resolve(null); };
      b.appendChild(this.enModeLink(t));
      setReady(false);
    } else if (st.kind === 'type_en') {
      var inp = U.textInput({ placeholder: t.type === 'sp_qa' ? U.tx('The question means…', '질문 뜻 (영어로)…') : U.tx('In English…', '영어로…'), lang: 'en', onChange: function (v) { setReady(v.trim().length > 1); }, onEnter: function () { if (!doneBtn.disabled) doneBtn.click(); } });
      b.appendChild(inp); getAns = function () { return { text: inp.value.trim() }; };
      b.appendChild(this.enModeLink(t));
      setTimeout(function () { inp.focus({ preventScroll: true }); }, 30);
    } else if (st.kind === 'hand') {
      if (t.type === 'sp_qa') b.appendChild(el('div', { class: 'tiny' }, U.tx('Answer about yourself — in Korean. You will read it aloud next.', '내 이야기로 한국어로 대답을 쓰세요. 다음에 소리 내어 읽어요.')));   // T146y 3 쓰기 → 녹음
      var pad = U.handPad({ allowType: self.data.student.allow_type, hint: t.type === 'write' ? U.tx('Write here — or take a photo of your paper', '여기에 쓰거나 종이 사진을 찍으세요') : U.tx('Write the Korean here', '여기에 한국어로 쓰세요'), onChange: function (v) { setReady(v); } });
      b.appendChild(pad.node);
      getAns = function () { return {}; };
      getMedia = function () { return pad.export().then(function (m) { if (m.typed !== undefined) { t._lastTyped = m.typed; t._lastImg = null; } else { t._lastImg = 'data:' + m.mime + ';base64,' + m.b64; t._lastTyped = null; } setTimeout(function () { self.fillMine(t); }, 0); return m; }); };   // T146w C3 녹음 화면이 먼저 그려졌으면 채움
    } else if (st.kind === 'choice') {
      // T146zb (선생님 11/01 Elvira) 누르면 고른 표시만 → [Check] 를 눌러야 채점 (다시 고를 수 있음). 결과에 고른 것 + 정답
      var opts = el('div', { class: 'opts', role: 'radiogroup' }), pickK = null;
      t.options.forEach(function (o, k) { opts.appendChild(el('button', { class: 'opt', type: 'button', lang: t.type === 'listen' ? 'en' : 'ko', role: 'radio', 'aria-checked': 'false', 'data-opt': String(k), onclick: function (e) {
        if (opts._sent) return; pickK = k;
        [].forEach.call(opts.children, function (x) { var on = x === e.currentTarget; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
        setReady(true);
      } }, o)); });
      b.appendChild(opts);
      doneBtn.textContent = U.tx('Check', '확인'); doneBtn.setAttribute('data-label', U.tx('Check', '확인')); doneBtn.setAttribute('data-act', 'check');
      getAns = function () { opts._sent = true; return { choice: pickK }; };
      setReady(false);
    } else if (st.kind === 'dictation') {
      var dIn = U.textInput({ placeholder: U.tx('Type what you heard in Korean', '들은 문장을 한국어로'), lang: 'ko', onChange: function (v) { setReady(v.trim().length > 0); }, onEnter: function () { if (!doneBtn.disabled) doneBtn.click(); } });
      b.appendChild(dIn); getAns = function () { return { typed: dIn.value.trim() }; };
    } else if (st.kind === 'read') {
      var tapped = {}, marked = 0;
      var mo = { cls: 'passage', gloss: t.gloss, tapped: tapped, task_id: t.task_id, where: 'reading', onMark: function () { marked++; } }, dp = docParts(t);
      if (dp) { b.appendChild(docHow(dp)); b.appendChild(this.docSents(t, dp, mo)); }   // T146zq 설명과 읽을 문장 나눔
      else b.appendChild(this.markable(t.text, mo));
      b.appendChild(el('div', { class: 'tiny', style: { marginTop: '6px' }, 'data-act': 'read-help' }, cardB ? U.tx('Tap a word for its meaning. Drag across what you don’t get.', '낱말을 누르면 뜻이 나와요. 모르는 곳은 끌어서 고르세요.')
        : U.tx('Tap a word for its meaning (tap again to close). Drag across words — or tap “I don’t get this” — to tell Dongjae what you don’t get.', '낱말을 누르면 뜻이 나와요(다시 누르면 닫혀요). 모르는 곳은 끌어서 고르거나 “모르겠어요”를 눌러 선생님께 알려요.')));
      setReady(true); doneBtn.textContent = U.tx('I’ve read it ✓', '다 읽었어요 ✓');
      getAns = function () { return { looked_up: Object.keys(tapped).filter(function (k) { var g = (t.gloss || {})[k]; return tapped[k] === 2 || (g && U.glossOk(k, g)); }), marked: marked }; };
    } else if (st.kind === 'ko_answer') {
      var q2 = (t.questions || [])[st.q] || {}, enInp = null, padReady = false, rec = null;
      b.appendChild(qBox(t, st, q2));   // T146zq 이름표(위) → 할 일(굵게) → 설명·예(보통)
      if (q2.type === 'content') {
        enInp = U.textInput({ placeholder: U.tx('(optional) In English first — what is the answer?', '(선택) 먼저 영어로 — 답이 뭘까요?'), lang: 'en' });
        b.appendChild(el('div', { style: { margin: '6px 0' } }, enInp));
      }
      if (!cardB) b.appendChild(el('div', { class: 'tiny' }, U.tx('Now answer in Korean — write it by hand', '이제 한국어로 손으로 써서 대답하세요') + (self.data.student.allow_type ? U.tx(' (or type it)', ' (타자도 돼요)') : '')));
      var pad2 = U.handPad({ allowType: self.data.student.allow_type, hint: U.tx('Write it in Korean', '한국어로 써 보세요'), onChange: function (v) { padReady = v; setReady(padReady || !!rec, padReady && !rec ? recNote : ''); } });
      b.appendChild(pad2.node);
      b.appendChild(el('div', { class: 'tiny', style: { marginTop: '6px' } }, U.tx('Then say your answer aloud (optional)', '그다음 대답을 소리 내어 말하세요 (선택)')));
      // T119 쓰기만 / 말하기만 / 둘 다 — 어느 쪽이든 완료 가능
      var w2 = U.recWidget({ label: U.tx('Say it', '말하기'), max: 60, onReady: function (r) { rec = r; setReady(padReady || !!rec, padReady && !rec ? recNote : ''); } });
      b.appendChild(w2.node);
      setReady(false);
      getAns = function () { var o = { mode: padReady ? 'canvas' : 'audio', sec: rec ? rec.sec : 0 }; if (enInp && enInp.value.trim()) o.en = enInp.value.trim(); return o; };
      getMedia = function () { return padReady ? pad2.export() : Promise.resolve(null); };
      getMedia2 = function () { return rec ? U.blobToB64(rec.blob).then(function (b64) { return { b64: b64, mime: rec.mime }; }) : Promise.resolve(null); };
    }
    if (st.kind === 'type_en' || st.kind === 'hand' || st.kind === 'dictation') setReady(false);
    if (shNode) { var g0 = getAns; getAns = function () { var o = g0 ? g0() : {}; if (shSt.used) o.hint = 1; return o; }; }   // T094 서버가 점수 상한·선생님 화면 '힌트 씀'
    b.appendChild(why);
    b.appendChild(el('div', { class: 'actions' }, doneBtn));
    return b;
  };
  /** T146a 영어 답 방식 고르기 (처음 한 번 · 바꾸기). 고른 것은 이 기기에 기억 → 다음 문항·다음 날도 같음. 설정에서도 바꿈 */
  App.prototype.enModePick = function (t) {
    var self = this, cur = U.enMode();
    return el('div', { class: 'en-pick', role: 'group', 'aria-label': U.tx('How will you answer?', '어떻게 답할까요?'), 'data-act': 'en-mode-pick' },
      el('b', {}, U.tx('How will you answer?', '어떻게 답할까요?')),
      el('div', { class: 'tiny' }, U.tx('We remember your choice. You can change it any time.', '고른 방식을 기억해요. 언제든 바꿀 수 있어요.')),
      el('div', { class: 'opts' }, ['type', 'speak', 'photo'].map(function (m) {
        return el('button', { class: 'opt' + (m === cur ? ' on' : ''), type: 'button', 'data-mode': m, onclick: function () { U.setEnMode(m); t._enPick = false; self.rerenderList(); } },
          el('span', {}, U.tx(U.EN_MODES[m][0], U.EN_MODES[m][1])));
      })));
  };
  App.prototype.enModeLink = function (t) {
    var self = this;
    return el('button', { class: 'linkbtn en-switch', type: 'button', 'data-act': 'en-mode-change', onclick: function () { t._enPick = true; self.rerenderList(); } }, U.tx('Change how to answer', '답 방식 바꾸기'));
  };
  var WHY = {
    type_en: ['Type your answer first.', '먼저 답을 쓰세요.'], hand: null,   // T146u M5 손글씨 판 안내와 겹침 → 뺌
   
    choice: ['Pick one, then tap Check.', '하나 고르고 확인을 누르세요.'],
    dictation: ['Type what you heard first.', '먼저 들은 문장을 쓰세요.'], ko_answer: ['Write or say your answer first.', '먼저 쓰거나 말해서 대답하세요.']
  };
  /** T146zy 같은 날 다른 카드(다른 단원 item)에 같은 낱말이 또 있으면 한 번 한 것으로 같이 냄 — Alice 11/04 '무슨 뜻이에요'×2·'잘 모르겠어요'×2 에서 멈춤.
   * 소리는 안 붙임(같은 답 두 번 녹음 0). 서버엔 dup_of 로 남음 */
  function koK(ko) { return String(ko || '').replace(/[\s.,!?~·]/g, ''); }
  App.prototype.dupCards = function (t, idx, ans) {
    var self = this, c = t.cards && t.cards[idx], k = c && koK(c.ko); if (!k || !this.day) return 0;
    var n = 0;
    this.day.tasks.forEach(function (t2) {
      if (t2.type !== 'cards' || !t2.cards || t2.status === 'skipped') return;
      t2.cards.forEach(function (c2, j) {
        var s2 = t2.steps[j]; if (!s2 || s2.sub || (t2 === t && j === idx) || koK(c2.ko) !== k) return;
        if (t2._q) t2._q = t2._q.filter(function (x) { return x !== j; });
        var a2 = { attempts: ans.attempts, dup_of: c.item_id }; if (ans.rating !== undefined) a2.rating = ans.rating; if (ans.typed !== undefined) a2.typed = ans.typed;
        self.submitStep(t2, s2, a2, null, null); n++;
      });
    });
    return n;
  };
  App.prototype.submitStep = function (t, st, ans, getMedia, doneBtn, getMedia2) {
    var cur = this.task(t.task_id);   // T146zs 화면을 그린 뒤 day 가 바뀌었으면 지금 day 의 같은 문항·단계에 씀 (옛 객체에 쓰면 완료가 사라짐)
    if (cur && cur !== t) { var cs = cur.steps.filter(function (x) { return x.step_id === st.step_id; })[0]; if (cs) { ['_q', '_att', '_first', '_skipW'].forEach(function (f) { if (t[f] !== undefined && cur[f] === undefined) cur[f] = t[f]; }); t = cur; st = cs; } }
    var self = this, tm = this.tm(t.task_id), now = U.actMs();
    if (doneBtn) { doneBtn.disabled = true; doneBtn.textContent = U.tx('Sending…', '보내는 중…'); }
    var m1 = getMedia ? getMedia() : Promise.resolve(null), m2 = getMedia2 ? getMedia2() : Promise.resolve(null);
    // T146q (선생님 A8·A9) 서버 답(녹음은 10초 걸리기도)을 기다리지 않음: 이 기기에서 이 단계를 먼저 끝난 것으로 → 목록 숫자·다음 단계가 바로.
    // 보내기는 Outbox 가 뒤에서 차례로(화면 아래 '보내는 중' 알약, ui.js netBusy). 카드는 부르는 쪽이 바로 다음 카드를 그림
    var optimistic = true;   // T146w C3: 미리 보기도 학생과 같은 순서(앞 단계 답을 기다리지 않음) — 미리 보기 시험이 학생 화면 문제를 놓치지 않게
    if (ans && ans.text) t._lastEn = ans.text;   // T146u M4b 끝 화면 '내 답'
    if (optimistic) { st.sub = { grade_status: 'sending', auto: null, feedback: [], _choice: ans ? ans.choice : undefined }; t._active = null; this.localCard(t); if (t.type !== 'cards' && t.type !== 'diag') this.rerenderList(); }
    Promise.all([m1, m2]).then(function (ms) {
      var m = ms[0];
      if (m && m.mode) { ans.mode = m.mode; delete m.mode; }
      if (m && m.typed !== undefined) { ans.typed = m.typed; m = null; }   // 한국어를 타자로 씀 (사진 없음)
      var payload = { key: self.key, dayset_id: self.day.dayset_id, task_id: t.task_id, step_id: st.step_id, answer: ans, media: m, media2: ms[1],
        time_ms: now - (tm.stepStart || now), dwell_ms: tm.dwell + (tm.openAt ? now - tm.openAt : 0) };
      if (U.PREVIEW) { self.pvStep(t, st); return { preview: true }; }   // T146zr 이 탭에서 기억 · T119 미리 보기: 서버에 쓰지 않고 학생과 똑같이 다음으로
      self.markDone(t, st);   // T146zs 폰의 완료 기록 (보내기 전에)
      return self.box.send('student.step', payload);
    }).then(function (res) {
      tm.stepStart = U.actMs();
      if (res.queued) U.toast(U.tx('Saved — will send when you are online.', '저장했어요. 인터넷이 되면 보내요.'));
      if (res.preview || res.queued) st.sub = { grade_status: res.preview ? 'preview' : 'pending', _local: res.queued ? 1 : undefined, auto: null, feedback: [], _choice: ans ? ans.choice : undefined };   // T146zf _local = 이 폰에만 (서버 아직)   // T146zb 고른 것 유지
      else st.sub = res.step;
      t._active = null;
      self.mergeCard(t, res.card);   // T146zs 옛: t.status = res.card.status (앞 단계의 늦은 답 'doing' 이 끝난 문항을 0/1 로 되돌림)
      if (res.day && res.day.ratio > self.day.ratio) self.day.ratio = res.day.ratio;   // 진척 막대도 줄지 않게
      if (optimistic && self.open === t.task_id && !finished(t)) return;   // T146q 학생은 벌써 이 문항의 다음 단계를 하는 중 — 쓰던 것을 지우지 않게 다시 그리지 않음
      var away = self.open && self.open !== t.task_id;   // T146a 보내는 사이 다른 문항을 엶 → 그 화면(녹음·쓰던 답)은 다시 그리지 않고, 새 값은 닫을 때 받음
      if (res.card && (self.dirty || res.card.status === 'sent' || res.card.status === 'done')) { if (away) { self.dirty = true; return; } self.dirty = false; return self.reloadDay(); }
      if (!away) self.rerenderList();
    }).catch(function (e) {
      if (e.message === 'consent required') { st.sub = null; self.markDone(t, st, false); self.localCard(t); if (doneBtn) { doneBtn.disabled = false; doneBtn.textContent = doneBtn.getAttribute('data-label') || U.tx('Done ✓', '완료 ✓'); } self.data.student.consent_at = null; self.render(); return; }
      // T119 보내지 못해도 제자리에 멈추지 않음: 이 단계는 끝난 것으로 보고 다음으로 (네트워크 문제는 위 queued 길로 기기에 저장됨)
      st.sub = { grade_status: 'pending', auto: null, feedback: [], local_error: e.message }; t._active = null; self.localCard(t);
      st._retry = function () { st.sub = null; self.localCard(t); self.submitStep(t, st, ans, getMedia, null, getMedia2); };   // T146u M4b
      U.toast(e.message === 'already submitted' ? U.tx('Already sent.', '이미 보냈어요.') : U.tx('Could not send this step — moving on.', '이 단계는 보내지 못했어요. 다음으로 넘어가요.') + ' (' + e.message + ')');
      if (!(self.open && self.open !== t.task_id)) self.rerenderList();
    });
  };
  /** 서버 답 없이(미리 보기·오프라인 저장·보내기 실패) 이 기기에서 카드 상태를 셈 */
  App.prototype.localCard = function (t) {
    var n = t.steps.filter(function (x) { return x.sub; }).length;
    t.n_done = n; t.status = n >= t.steps.length ? 'sent' : n ? 'doing' : 'todo';
    this.localRatio();
  };
  App.prototype.localRatio = function () {
    var tot = 0, dn = 0; this.day.tasks.forEach(function (x) { if (x.status === 'skipped') return; tot += x.steps.length; dn += x.steps.filter(function (y) { return y.sub; }).length; });
    this.day.ratio = tot ? dn / tot : 0;
  };
  /* ---------- T119 문항 넘어가기: 언제나 켜짐, 확인 없이 다음 문항으로. 서버에는 skipped (채점·과제율에서 빠짐) ---------- */
  App.prototype.skipRow = function (t) {
    var self = this;
    var cards = t.type === 'cards';   // T146a 단어 카드: 이 버튼은 단어 시험 전체 → 글자로 분명히 + 확인 한 번
    return el('div', { class: 'actions skip-row' }, el('span', { class: 'grow' }), btn(cards ? U.tx('Skip the whole word test ›', '단어 시험 전체 건너뛰기 ›') : U.tx('Skip this question ›', '이 문제 건너뛰기 ›'), 'ghost xs', function () { if (cards) self.askSkipAll(t); else self.skipTask(t); }, { 'data-act': cards ? 'skip-all' : 'skip-task' }));
  };
  /** T146a 단어 시험 전체 건너뛰기 확인 (남은 단어 수 + 나중에 다시 할 수 있음) */
  App.prototype.askSkipAll = function (t) {
    var self = this, left = (t._q && t._q.length) || t.steps.filter(function (s) { return !s.sub; }).length;
    var sh = el('div', { class: 'sheet bottom', role: 'dialog', 'aria-label': U.tx('Skip the whole word test?', '단어 시험 전체를 건너뛸까요?'), 'data-act': 'skip-all-sheet' }, el('div', { class: 'wrap' },
      el('h2', {}, U.tx('Skip the whole word test?', '단어 시험 전체를 건너뛸까요?')),
      el('p', { class: 'small' }, U.tx(left + ' words are left. You can come back from the list any time: “Skipped · Redo”.', '남은 단어 ' + left + '개를 건너뛰어요. 목록의 ‘건너뜀 · 다시 하기’로 언제든 돌아올 수 있어요.')),
      el('div', { class: 'actions' }, btn(U.tx('Skip all', '전체 건너뛰기'), 'primary', function () { sh.remove(); self.skipTask(t); }, { 'data-act': 'skip-all-confirm' }),
        btn(U.tx('Keep going', '계속하기'), 'ghost', function () { sh.remove(); }, { 'data-act': 'skip-all-cancel' }))));
    sh.addEventListener('click', function (e) { if (e.target === sh) sh.remove(); });
    document.body.appendChild(sh);
    return sh;
  };
  /** T146a 단어 하나 건너뛰기: 이 단어는 맨 뒤로 (이번 시험 끝에 다시 나옴, 서버 기록 없음) */
  App.prototype.skipWord = function (t, idx) {
    t._skipW = t._skipW || {}; t._skipW[idx] = 1;
    if (t._q && t._q[0] === idx && t._q.length > 1) t._q.push(t._q.shift());
    t._phase = null; t._typed = null; t._rec = null;
    U.toast(U.tx('Skipped this word — it comes back at the end.', '이 단어는 건너뛰었어요. 마지막에 다시 나와요.'));
    this.rerenderList();
  };
  /** T146a 건너뛴 문제·단어 시험 다시 하기: 이 기기에서 바로 열고, 서버 기록은 '다시 풂'으로 (student.skip_task undo) */
  App.prototype.unskipTask = function (t) {
    var self = this;
    t._q = null; t.status = 'open'; t.skipped = false; this.localCard(t);
    this.markDone(t, null, false);   // T146zs
    if (U.PREVIEW) this.pvSkip(t, false);
    if (U.PREVIEW) U.toast(U.tx('Preview — not saved', '미리 보기 — 저장 안 함'));
    else this.box.send('student.skip_task', { key: this.key, dayset_id: this.day.dayset_id, task_id: t.task_id, undo: true })
      .then(function (res) { self.localRatio();   /* T146zs 서버 비율은 보낸 때 것 — 이 기기 값으로 */ },
        function (e) { U.toast(U.tx('Could not save — try again later', '저장하지 못했어요. 나중에 다시 해 주세요') + ' (' + e.message + ')'); });
    this.open = t.task_id; this.rerenderList();
  };
  /** T146t 보낸 뒤(채점 뒤에도) '다시 하기': 이 기기에서 문항을 다시 열고, 서버는 앞 기록을 남긴 채 새로 보낸 것을 씀 (student.skip_task redo) */
  App.prototype.redoTask = function (t) {
    var self = this;
    t.steps.forEach(function (s) { s.sub = null; }); t._q = null; t._phase = null; t._typed = null; t._rec = null; t._lastImg = null; t._lastTyped = null;
    this.clearDone(t);   // T146zs
    this.localCard(t); t.status = 'open';
    if (U.PREVIEW) this.pvClear(t);
    if (U.PREVIEW) U.toast(U.tx('Preview — not saved', '미리 보기 — 저장 안 함'));
    else this.box.send('student.skip_task', { key: this.key, dayset_id: this.day.dayset_id, task_id: t.task_id, redo: true })
      .then(function (res) { self.localRatio();   /* T146zs 서버 비율은 보낸 때 것 — 이 기기 값으로 */ },
        function (e) { U.toast(U.tx('Could not save — try again later', '저장하지 못했어요. 나중에 다시 해 주세요') + ' (' + e.message + ')'); });
    this.open = t.task_id; this.rerenderList();
  };
  /** T146zj 녹음 한 단계만 다시: 앞 녹음은 서버에 남기고(superseded) 이 단계만 엶 */
  App.prototype.redoStep = function (t, st) {
    var self = this;
    st.sub = null; t._rec = null; t._phase = null; t._q = null;
    this.markDone(t, st, false);   // T146zs
    this.localCard(t); t.status = 'open';
    if (U.PREVIEW) this.pvClear(t, st);
    if (U.PREVIEW) U.toast(U.tx('Preview — not saved', '미리 보기 — 저장 안 함'));
    else this.box.send('student.skip_task', { key: this.key, dayset_id: this.day.dayset_id, task_id: t.task_id, step_id: st.step_id, redo: true })
      .then(function (res) { self.localRatio();   /* T146zs 서버 비율은 보낸 때 것 — 이 기기 값으로 */ },
        function (e) { U.toast(U.tx('Could not save — try again later', '저장하지 못했어요. 나중에 다시 해 주세요') + ' (' + e.message + ')'); });
    this.open = t.task_id; this.rerenderList();
  };
  App.prototype.skipTask = function (t) {
    var self = this, tm = this.tm(t.task_id), now = U.actMs();
    t.status = 'skipped'; t._phase = null; t._typed = null; t._rec = null;
    this.localRatio(); this.markDone(t, null);   // T146zs
    if (U.PREVIEW) this.pvSkip(t, true);
    if (U.PREVIEW) U.toast(U.tx('Preview — skipped, not saved', '미리 보기 — 넘겼어요 (저장 안 함)'));
    else this.box.send('student.skip_task', { key: this.key, dayset_id: this.day.dayset_id, task_id: t.task_id, dwell_ms: tm.dwell + (tm.openAt ? now - tm.openAt : 0) })
      .then(function (res) { if (res.queued) U.toast(U.tx('Saved — will send when you are online.', '저장했어요. 인터넷이 되면 보내요.')); else self.localRatio(); },
        function (e) { U.toast(U.tx('Skipped here, but not saved', '넘겼지만 저장하지 못했어요') + ' (' + e.message + ')'); });
    this.afterTask(t);
  };
  /** 문항 하나를 끝내거나 넘긴 뒤: 다음 안 끝난 문항을 엶. 없으면 목록(결과) */
  App.prototype.afterTask = function (t) {
    var next = this.day.tasks.filter(function (x) { return x.task_id !== t.task_id && !finished(x); })[0];
    if (next) return this.toggle(next.task_id);
    this.open = null; this.rerenderList();
  };
  /** T146zs 지금 안 끝난 문항 화면(쓰는 중) — 뒤에서 온 서버 값으로 다시 그리지 않음 */
  App.prototype.midTask = function () {
    if (this.view !== 'task' || !this.cur) return false;
    var t = this.task(this.cur); return !!(t && !finished(t) && t.steps.some(function (s) { return !s.sub; }));
  };
  App.prototype.reloadDay = function () {
    var self = this;
    var p = this.dayOverride ? U.call('student.history', { key: this.key, dayset_id: this.dayOverride }, true) : U.call('student.today', { key: this.key }, true);   // T146zb 화면은 이미 이 기기 값으로 그렸음 → 뒤에서
    return p.then(function (d) {
      if (self.midTask()) { self.dirty = true; return; }   // T146zs 쓰는 중: day 를 바꾸면 화면 단추가 옛 문항을 잡아 Done 이 안 먹음 → 목록으로 갈 때 다시
      if (d.student) { self.data = d; U.dayCache.set(self.key, d); if (!self.dayOverride) self.sendOpen(d); }   // T146a 저장본도 새 값으로 · T146zy 날이 바뀌어 새 세트면 열람
      var keep = {}, prevDay = self.day; (self.day ? self.day.tasks : []).forEach(function (t) { keep[t.task_id] = t; });
      self.day = d.day;
      self.day.tasks.forEach(function (t) { var o = keep[t.task_id]; if (o) { t._lastImg = o._lastImg; t._lastTyped = o._lastTyped; t._q = o._q; t._att = o._att; t._first = o._first; t._skipW = o._skipW; } });
      self.overlayOutbox(); self.keepLocal(prevDay);   // T146zr
      self.rerenderList();
    });
  };

  /* ---------- 단어 카드: 뜻 → (말하기 또는 타자) → 답 + [발음] + 소리 → 2버튼. 틀리면 이번에 3번까지 다시 ---------- */
  App.prototype.renderCards = function (t) {
    var self = this, wrap = el('div');
    if (t._q && !t._q.filter(function (i) { return !t.steps[i].sub; }).length && t.steps.some(function (s) { return !s.sub; })) t._q = null;   // T146zr 순서표가 비었는데 안 한 카드가 있으면 다시 셈
    if (!t._q) { t._q = []; t._att = {}; t._first = {}; t.steps.forEach(function (s, i) { if (!s.sub) t._q.push(i); }); }
    t._q = t._q.filter(function (i) { return !t.steps[i].sub; });
    var total = t.cards.length, doneN = t.steps.filter(function (s) { return s.sub; }).length;
    if (!t._q.length) {
      var again = t.steps.filter(function (s) { return s.sub && s.sub.auto && s.sub.auto.rating === 1; }).length;
      wrap.appendChild(el('div', { class: 'res ok', style: { marginTop: '10px' } }, total + ' cards done. ' + (again ? again + ' will come back soon.' : 'Great memory!')));
      return wrap;
    }
    var idx = t._q[0], c = t.cards[idx], step = t.steps[idx], phase = t._phase === idx ? 'back' : 'front', typedRes = t._typed && t._typed.idx === idx ? t._typed : null;
    var flash = el('div', { class: 'flash', 'data-card': c.item_id, 'data-phase': phase });
    flash.appendChild(el('div', { class: 'tiny' }, t.mode === 'new' ? 'New word — guess first, then check' : 'Say it in Korean', c.leech ? ' · ' : '', c.leech ? el('span', { class: 'chip bad' }, 'tricky word') : null,
      c.mine ? ' · ' : '', c.mine ? el('span', { class: 'chip k' }, 'from your question') : null, (t._att[idx] || 0) ? el('span', { class: 'tiny' }, ' · again') : null));
    flash.appendChild(el('div', { class: 'front' }, c.en));
    if (c.hint) flash.appendChild(el('div', { class: 'tiny', 'data-act': 'word-hint', lang: 'en' }, c.hint));   // T140 disambig 꼬리표
    t._hint = t._hint || {};   // T094 글자 수 모양 + [힌트] (student-v2.js 와 같음)
    var shr = phase === 'front' ? U.shapeRow(cardForms(c)[0] || c.display || c.ko, { used: !!t._hint[idx], onHint: function () { t._hint[idx] = 1; } }) : null;
    if (shr) flash.appendChild(shr);
    if (c.chunk && phase === 'front') flash.appendChild(el('div', { class: 'tiny' }, '(a phrase — include the particle)'));
    var rec = t._rec && t._rec.idx === idx ? t._rec.r : null;
    if (phase === 'back') {
      flash.appendChild(el('div', { class: 'back', lang: 'ko' }, formsNode(c), U.romanNode(c.ko)));
      var pl = pronLine(c.ko); if (pl) flash.appendChild(pl);
      if (typedRes) flash.appendChild(el('div', { class: 'res ' + (typedRes.status === 'correct' ? 'ok' : typedRes.status === 'close' ? 'close' : 'bad'), style: { textAlign: 'left' } }, 'You typed: ', U.diffNode(typedRes.text, typedRes.target)));
      if (typedRes && typedRes.pd) flash.appendChild(U.posLine(typedRes.pd));   // T090b
      if (c.note || c.explain) flash.appendChild(el('details', { class: 'small', 'data-act': 'more', style: { textAlign: 'left' } }, el('summary', {}, U.tx('Teacher’s note', '선생님 설명', 2)),   // T146k (R17) 처음엔 닫힘
        c.note ? U.structNode(c.note) : null, c.explain ? U.structNode(c.explain) : null));   // T146zv
      if (c.example) flash.appendChild(this.markable(c.example, { cls: 'ex', task_id: t.task_id, where: 'card-example' }));
      if (rec) flash.appendChild(U.player(URL.createObjectURL(rec.blob), { sec: rec.sec, act: 'my-rec' }));
    }
    wrap.appendChild(flash);
    var gone = false;
    function finish(rating) {
      if (gone) return; gone = true;   // T140 답 기다리는 동안 두 번 누름 → 같은 카드 두 번·다음 카드 건너뜀 막기
      var first = t._first[idx] !== undefined ? t._first[idx] : rating;
      var att = (t._att[idx] || 0) + 1;
      if (rating === 1 && att < 3) {   // 이번에 다시 (최대 3번)
        t._first[idx] = first; t._att[idx] = att; t._q.push(t._q.shift()); t._phase = null; t._typed = null; self.rerenderList(); return;
      }
      var r = rec, typed = typedRes;
      t._phase = null; t._typed = null; t._rec = null; t._q.shift();
      var ans = { rating: first, attempts: att };
      if (typed) { ans.typed = typed.text; delete ans.rating; }
      if (t._hint && t._hint[idx]) { ans.hint = 1; if (ans.rating > 2) ans.rating = 2; }   // T094
      if (r) ans.said = 1;
      self.submitStep(t, step, ans, r ? function () { return U.blobToB64(r.blob).then(function (b64) { return { b64: b64, mime: r.mime }; }); } : null, null);
      self.dupCards(t, idx, ans);   // T146zy
      self.rerenderList();
    }
    if (phase === 'front') {
      var row = el('div', { class: 'card-tools' });
      var w = U.recWidget({ label: 'Say it', max: 8, onReady: function (r) { if (r) { t._rec = { idx: idx, r: r }; t._phase = idx; self.rerenderList(); } } });
      row.appendChild(w.node);
      var typeBox = el('div', { class: 'hidden', style: { marginTop: '8px' } });
      var inp = U.textInput({ placeholder: '한국어로 (Korean)', lang: 'ko', onEnter: function () { check(); } });
      function check() {
        var v = inp.value.trim(); if (!v) return;
        var ck = U.cardCheck(v, c);   // T090b 품사만 다름 = 거의 맞음
        t._typed = { idx: idx, text: v, status: ck.status, target: ck.target, pd: ck.pd || null }; t._phase = idx; self.rerenderList();
      }
      typeBox.appendChild(el('div', { class: 'row' }, inp, btn('Check', 'sm', check, { 'data-act': 'type-check' })));
      row.appendChild(btn('Type', 'ghost sm', function () { typeBox.classList.toggle('hidden'); if (!typeBox.classList.contains('hidden')) inp.focus(); }, { 'data-act': 'type' }));
      row.appendChild(el('span', { class: 'grow' }));
      row.appendChild(btn('Show answer', 'primary sm', function () { if (inp.value.trim()) return check(); t._phase = idx; self.rerenderList(); }, { 'data-act': 'show' }));   // T146g 쓴 답이 있으면 채점해 같이 보냄
      wrap.appendChild(row); wrap.appendChild(typeBox);
    } else if (typedRes) {
      var rt = typedRes.status === 'correct' ? 3 : typedRes.status === 'close' ? 2 : 1;
      wrap.appendChild(el('div', { class: 'rate two' }, el('span', { class: 'small', style: { alignSelf: 'center' } }, rt === 3 ? '✓ Correct' : rt === 2 ? 'Almost' : 'Not yet'),
        el('button', { class: 'btn', type: 'button', 'data-rate': String(rt), onclick: function () { finish(rt); } }, 'Next', el('small', {}, rt === 1 ? 'comes back' : 'auto-graded'))));
    } else {
      var rate = el('div', { class: 'rate two' });
      rate.appendChild(el('button', { class: 'btn', type: 'button', 'data-rate': '1', onclick: function () { finish(1); } }, 'Missed', el('small', {}, 'show again')));
      rate.appendChild(el('button', { class: 'btn', type: 'button', 'data-rate': '3', onclick: function () { finish(3); } }, 'Got it', el('small', {}, 'next card')));
      wrap.appendChild(rate);
    }
    wrap.appendChild(el('div', { class: 'counter' }, (doneN + 1) + ' / ' + total));
    return wrap;
  };

  /* ---------- T154b 레벨 진단 'Quick check': 한 화면에 한 문항 · 보기 4개 + '모르겠어요'(같은 크기) · 맞고 틀림은 안 보임 · 누르면 바로 다음 ---------- */
  function diagStem(q) {
    var box = el('div', { class: 'dq-stem', lang: 'ko', 'data-act': 'dq-stem' }), parts = String(q.stem_ko || '').split('___');
    parts.forEach(function (p, i) { if (i) box.appendChild(el('span', { class: 'dq-blank', 'aria-label': U.tx('blank', '빈칸') }, '\u00a0')); box.appendChild(document.createTextNode(p)); });
    return box;
  }
  App.prototype.diagNode = function (t, after) {
    var self = this, wrap = el('div', { class: 'dq', 'data-act': 'diag' });
    var left = t.steps.filter(function (s) { return !s.sub; }), total = t.steps.length, doneN = total - left.length;
    if (!left.length) { wrap.appendChild(el('div', { class: 'res ok', 'data-act': 'diag-done' }, U.tx('Thank you! ' + total + ' questions done.', '고마워요! ' + total + '문항 끝.'))); return wrap; }
    var st = left[0], q = st.q || {};
    wrap.setAttribute('data-step', st.step_id); wrap.setAttribute('data-qtype', q.qtype || '');
    if (!doneN) wrap.appendChild(el('p', { class: 'dq-note', 'data-act': 'diag-note' }, U.tx('Skip anything you don’t know — that helps us more than guessing.', '모르는 것은 ‘모르겠어요’를 누르세요. 찍는 것보다 그게 더 도움이 돼요.')));
    if (t.preview_only) wrap.appendChild(el('p', { class: 'tiny', 'data-act': 'diag-unapproved' }, U.tx('Teacher preview — not sent to the student yet', '선생님 미리 보기 — 아직 학생에게 안 감')));
    wrap.appendChild(el('p', { class: 'dq-q', lang: 'en', 'data-act': 'dq-prompt' }, q.prompt_en || ''));
    wrap.appendChild(diagStem(q));
    var wh = q.word_help || {}, wk = Object.keys(wh);
    if (wk.length) wrap.appendChild(el('div', { class: 'dq-help', 'data-act': 'dq-help' }, wk.map(function (k) { return el('span', { class: 'dq-w' }, el('span', { lang: 'ko' }, k), ' = ', el('span', { lang: 'en' }, wh[k])); })));
    var dcue = cueNode(t, st); if (dcue) wrap.appendChild(dcue);   // T093 §4
    var opts = el('div', { class: 'opts dq-opts', role: 'radiogroup', 'aria-label': q.prompt_en || '' }), sent = false;
    function pick(k, b) {
      if (sent) return; sent = true; b.classList.add('on');
      self.submitStep(t, st, { choice: k }, null, null);
      if (after) after();
    }
    (q.choices || []).forEach(function (c, k) {
      opts.appendChild(el('button', { class: 'opt', type: 'button', role: 'radio', lang: q.qtype === 'form' ? 'ko' : 'en', 'data-opt': String(k), onclick: function (e) { pick(k, e.currentTarget); } }, c));
    });
    opts.appendChild(el('button', { class: 'opt dq-unk', type: 'button', role: 'radio', 'data-opt': '-1', 'data-act': 'dq-unknown', onclick: function (e) { pick(-1, e.currentTarget); } }, U.tx('I don’t know', '모르겠어요', 1)));
    wrap.appendChild(opts);
    wrap.appendChild(el('div', { class: 'counter', 'data-act': 'dq-count' }, (doneN + 1) + ' / ' + total));
    return wrap;
  };

  /* ---------- 처음 한 번: 시작하기 전에 ---------- */
  App.prototype.renderIntro = function () {
    var self = this, s = this.data.student, minor = s.minor, ok = !minor;
    var go = btn('Start · 시작하기', 'primary block', function () {
      go.disabled = true;
      U.call('student.consent', { key: self.key, guardian: minor ? true : false }).then(function () { self.data.student.consent_at = new Date().toISOString(); self.render(); },
        function (e) { go.disabled = false; U.toast(e.message); });
    }, { 'data-act': 'consent', disabled: !ok });
    var w = el('div', { class: 'wrap' }, el('div', { class: 'intro' },
      el('div', { class: 'top' }, el('div', { class: 'brand' }, 'Korean ', el('b', {}, 'with Dongjae'))),
      el('h1', {}, 'Before you start ', el('span', { class: 'en' }, '· 시작하기 전에')),
      el('p', { class: 'muted' }, 'You will see this only once.'),
      el('ul', {},
        el('li', {}, 'Homework comes ', el('b', {}, 'once a day'), ', about ', el('b', {}, s.daily_min + ' minutes'), '. Do the items in any order.'),
        el('li', {}, 'You will ', el('b', {}, 'speak a lot'), ' (record your voice) and ', el('b', {}, 'write Korean by hand'), ' (on screen or a photo of paper). English can be typed.'),
        el('li', {}, 'Don’t understand something? Tap or drag over it and send it to Dongjae. He turns it into a card for you.'),
        el('li', {}, 'Only Dongjae sees your work. An AI on his computer drafts the checking; he approves before you see it.'),
        el('li', {}, 'Recordings and handwriting photos are ', el('b', {}, 'deleted after 90 days'), '. Your scores stay.')),
      el('p', { class: 'small', lang: 'ko' }, '녹음·손글씨 사진은 선생님만 보고, 90일 뒤에 지워져요.'),
      minor ? el('label', { class: 'check' }, el('input', { type: 'checkbox', 'data-act': 'guardian', onchange: function (e) { go.disabled = !e.target.checked; } }),
        el('span', {}, 'A parent or guardian has read this and agrees. ', el('span', { class: 'small' }, '보호자(부모님)가 읽고 동의했어요.'))) : null,
      el('div', { style: { marginTop: '16px' } }, go)));
    this.root.appendChild(w);
  };

  /** 처음 열 때 한 번 (이 기기): 한국어를 어떻게 쓸까요? — 펜 없는 노트북이면 '종이+사진'을 먼저 권함 */
  App.prototype.deviceAsk = function () {
    var self = this, touch = U.hasTouch(), allowType = this.data.student.allow_type;
    var opts = [['pad', 'On the screen', 'finger or pen — phone, tablet'], ['paper', 'On paper, then a photo', 'no pen? write in a notebook']];
    if (allowType) opts.push(['type', 'Type with a Korean keyboard', 'you can switch back any time']);
    var rec = touch ? 'pad' : 'paper';
    function pick(m) {
      U.setWriteMode(m);
      U.call('student.device', { key: self.key, mode: m, touch: touch }).catch(function () {});
      U.toast(m === 'paper' ? 'OK — write on paper and take a photo. 종이에 쓰고 사진 찍기' : m === 'type' ? 'OK — typing. 타자로 쓰기' : 'OK — write on the screen. 화면에 쓰기');
      self.render();
    }
    return el('div', { class: 'card device-ask', 'data-act': 'device-ask', role: 'group', 'aria-label': 'How will you write Korean?' },
      el('b', {}, 'How will you write Korean on this device?'), el('div', { class: 'tiny', lang: 'ko' }, '이 기기에서 한국어를 어떻게 쓸까요? (Writing by hand helps you remember spelling.)'),
      el('div', { class: 'opts', style: { marginTop: '8px' } }, opts.map(function (o) {
        return el('button', { class: 'opt' + (o[0] === rec ? ' rec' : ''), type: 'button', 'data-mode': o[0], onclick: function () { pick(o[0]); } },
          el('span', {}, o[1]), el('span', { class: 'tiny' }, ' — ' + o[2] + (o[0] === rec ? ' · suggested' : '')));
      })),
      el('div', { class: 'tiny', style: { marginTop: '6px' } }, 'You can change this later in Progress.'));
  };
  /* ---------- 진도 (작은 버튼) ---------- */
  App.prototype.renderProgress = function () {
    var self = this, sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Progress' });
    var w = el('div', { class: 'wrap' }, el('div', { class: 'top' }, btn('← Back', 'ghost sm', function () { sheet.remove(); }, { 'data-act': 'close' }), el('span', { class: 'grow' })), el('div', { class: 'loading' }, 'Loading…'));
    sheet.appendChild(w); document.body.appendChild(sheet);
    U.call('student.progress', { key: this.key }).then(function (p) {
      w.lastChild.remove();
      w.appendChild(el('h1', {}, 'Your progress'));
      w.appendChild(el('div', { class: 'stats', style: { margin: '10px 0 16px' } },
        el('div', { class: 'card stat' }, el('b', {}, U.icon('flame'), ' ' + p.streak), el('span', {}, 'days in a row · ', U.icon('snow'), ' ' + (self.data.freezes_left !== undefined ? self.data.freezes_left : 2) + ' freezes')),
        el('div', { class: 'card stat' }, el('b', {}, p.words_known), el('span', {}, 'words you know well (of ' + p.words_total + ')'))));
      w.appendChild(el('h3', {}, 'Last 6 weeks'));
      var cal = el('div', { class: 'calgrid', 'aria-label': 'Calendar' });
      p.calendar.forEach(function (c) { cal.appendChild(el('i', { class: c.status, title: c.date + ' · ' + c.status.replace('_', ' ') })); });
      w.appendChild(cal);
      w.appendChild(el('div', { class: 'legend', style: { marginTop: '8px' } }, [['on_time', 'var(--ok)', 'done'], ['late', 'var(--warn)', 'late'], ['partial', 'var(--seq2)', 'part'], ['skipped', 'var(--bad-soft)', 'missed'], ['rest', 'var(--surface-2)', 'rest']].map(function (x) { return el('span', {}, el('i', { style: { background: x[1] } }), x[2]); })));
      w.appendChild(el('h3', {}, 'Your questions to Dongjae'));
      var mk = self.data.marks || [];
      w.appendChild(mk.length ? el('div', { class: 'small' }, mk.map(function (m) { return el('div', {}, el('b', { lang: 'ko' }, m.text), ' · ', m.status === 'approved' ? 'answered ✓ (in your cards)' : m.status === 'dismissed' ? 'answered in class' : 'waiting'); })) : el('div', { class: 'tiny' }, 'Tap or drag over any Korean text you don’t get.'));
      w.appendChild(el('h3', {}, 'Lessons · 단원'));
      p.units.forEach(function (u) { w.appendChild(el('div', { class: 'bar-row' }, el('span', { lang: 'ko' }, u.title_ko), el('span', { class: 'track' }, el('i', { style: { width: Math.round(u.ratio * 100) + '%', background: 'var(--accent)' } })), el('span', { class: 'tiny' }, U.pct(u.ratio)))); });
      w.appendChild(el('h3', {}, 'Writing on this device'));
      w.appendChild(el('div', { class: 'card small', 'data-act': 'write-mode' }, (U.WRITE_MODES[U.writeMode()] || 'Not chosen yet') + ' ',
        btn('Change', 'sm', function () { U.store.set('hw_write_mode', null); U.store.set('hw_type_mode', false); sheet.remove(); self.render(); }, { 'data-act': 'write-mode-change' })));
      w.appendChild(el('h3', {}, 'Reminders'));
      w.appendChild(el('div', { class: 'card small' }, 'Get a phone notification when today’s set is ready. ', btn('Turn on', 'sm', function () { self.enablePush(); }, { 'data-act': 'push' }),
        el('div', { class: 'tiny', style: { marginTop: '6px' } }, 'iPhone: first tap Share → “Add to Home Screen”, then open from the icon.')));
    }, function (e) { w.lastChild.textContent = e.message; });
  };
  App.prototype.enablePush = function () {
    var self = this, C = window.HW_CONFIG || {};
    if (window.DemoApi && window.DemoApi.enabled()) { U.toast('Demo: in the real app your phone asks “Allow notifications?” here.'); return; }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !C.VAPID_PUBLIC_KEY) { U.toast('This browser cannot get notifications. You will get email instead.'); return; }
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      return Notification.requestPermission().then(function (perm) {
        if (perm !== 'granted') throw new Error('not allowed');
        var raw = atob(C.VAPID_PUBLIC_KEY.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((C.VAPID_PUBLIC_KEY.length + 3) % 4)), key = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) key[i] = raw.charCodeAt(i);
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }).then(function (sub) {
        var j = sub.toJSON();
        if (reg.active) reg.active.postMessage({ type: 'key', key: self.key, api: C.API_URL });
        return U.call('student.push_sub', { key: self.key, subscription: { endpoint: j.endpoint, keys: j.keys }, ua: navigator.userAgent });
      });
    }).then(function () { U.toast('Reminders on'); }, function (e) { U.toast('Could not turn on (' + e.message + ')'); });
  };

  window.StudentApp = {
    App: App,   // T108c: student-v2.js 가 화면만 바꿔 씀 (서버 호출·단계 처리는 그대로)
    _h: { formsNode: formsNode, fbNode: fbNode, GROUPS: GROUPS, TYPE: TYPE, HOW: HOW, how: how, stepLabel: stepLabel, finished: finished, dayName: dayName, typeKey: typeKey, mainTitle: mainTitle, subTitle: subTitle, isWaiting: isWaiting, scene: scene, speakBtn: speakBtn, pronLine: pronLine, cardForms: cardForms, missionReport: missionReport, listenName: listenName, docParts: docParts, docHow: docHow, qBox: qBox, cueOf: cueOf, cueNode: cueNode, koTarget: koTarget },
    mount: function (root, opts) {
      document.documentElement.classList.add('sx');   // T077 앱 디자인 (app.css 'html.sx')
      var a = new App(root, opts);
      if (U.romanWatch) U.romanWatch(root);   // T146zc 로마자 = 한국어 보이는 모든 칸
      window.addEventListener('hw-demo-graded', function () { if (!root.isConnected) return; if (a.open) a.dirty = true; else a.reloadDay(); });
      window.addEventListener('hw-demo-changed', function () { if (root.isConnected && !a.open) a.load(true); });
      a.load();
      return a;
    }
  };
})();
