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
    ['feedback', 'repeat', 'From your last class', '수업 피드백']
  ];
  var TYPE = {
    cards_review: 'Review words', cards_new: 'New words', ctx: 'Words in context', sp_ko_en: 'Korean → English', sp_en_ko: 'English → Korean',
    sp_qa: 'Question → Answer', mission: 'Speaking mission', grammar: 'Grammar check', reading: 'Reading', write: 'Writing'
  };
  var HOW = {
    sp_ko_en: 'Read the Korean aloud, then type what it means in English.',
    sp_en_ko: 'Write it in Korean by hand, then say your sentence.',
    sp_qa: 'Read the question aloud, type its meaning, then answer in Korean — say it and write it by hand.',
    reading: 'Read and mark what you don’t get. Then answer each question in Korean — write it and say it. Last: read the whole text aloud.',
    write: 'Write by hand — on screen or on paper (take a photo). Then read it aloud.',
    grammar: 'Do it, then read the finished sentence aloud.',
    ctx: 'Which word fits the sentence?',
    mission: 'Try to use the green words. Dongjae gets a short report.'
  };
  var KINDS = [['word', 'Word', '단어'], ['grammar', 'Grammar', '어법'], ['pron', 'Sound', '발음'], ['meaning', 'Meaning', '뜻 모름']];

  function App(root, opts) { this.root = root; this.key = opts.key; this.box = new U.Outbox('s_' + opts.key); this.open = null; this.gOpen = null; this.timers = {}; this.dayOverride = null; }
  App.prototype.tm = function (tid) { return this.timers[tid] || (this.timers[tid] = { dwell: 0, openAt: null, stepStart: null }); };
  App.prototype.load = function (silent) {
    var self = this;
    if (!silent) this.root.innerHTML = '<div class="loading" role="status"><span class="spin" aria-hidden="true"></span><span>Loading… 불러오는 중</span></div>';
    // 10/20 선생님 검토: student.html?k=…#preview&t=<선생님 키>&d=<세트> → 그 세트 전체 (승인 전이어도), 아무것도 기록 안 함
    var tk = U.PREVIEW ? U.hs('t') : null;
    var req = tk ? U.call('teacher.preview', { tkey: tk, key: this.key, dayset_id: U.hs('d') || '' }) : U.call('student.today', { key: this.key, n: U.qs('n') });
    return req.then(function (d) {
      self.data = d;
      if (self.dayOverride) return U.call('student.history', { key: self.key, dayset_id: self.dayOverride }).then(function (h) { self.day = h.day; self.render(); });
      self.day = d.day; self.render();
      if (!d.day.opened_at) U.call('student.open', { key: self.key, dayset_id: d.day.dayset_id }).catch(function () {});
      // 알림·이메일의 'Too busy today 😭' 링크(&busy=1) — 한 번 누른 것으로 끝 (화면에서 되돌리기 가능)
      if (U.qs('busy') === '1' && !self.busyDone) {
        self.busyDone = true;
        try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])busy=1&?/, '$1').replace(/[?&]$/, '')); } catch (e) { /* 무시 */ }
        if (!d.day.skipped_at && d.day.ratio < 0.999) self.skip(false);
      }
    }, function (e) {
      self.root.innerHTML = '';
      self.root.appendChild(el('div', { class: 'wrap' }, el('div', { class: 'state err', role: 'alert', 'data-act': 'load-error' }, el('div', { class: 'state-ic', 'aria-hidden': 'true' }, '!'), el('h2', {}, 'Could not load'), el('p', { class: 'small' }, e.message === 'unknown key' ? 'This link is not valid. Please ask Dongjae for your link. 링크를 확인해 주세요.' : 'Check your internet and try again. 인터넷 연결을 확인해 주세요. (' + e.message + ')'), btn('Try again', 'primary', function () { self.load(); }, { 'data-act': 'retry' }))));
    });
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
      U.toast(undo ? 'Welcome back — let’s go!' : 'Rest today — see you tomorrow');
    }, function (e) { U.toast('Could not change — try again (' + e.message + ')'); });
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
    if (diff === 1) return 'Yesterday';
    return new Date(ymd + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  function finished(t) { return t.status === 'sent' || t.status === 'done'; }
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
    return el('span', { class: 'chip done' }, t.type === 'cards' ? 'Done ✓' : t.score !== null ? '✓ ' + Math.round(t.score * 100) + '%' : 'Checked ✓');
  };
  function typeKey(t) { return t.type === 'cards' ? 'cards_' + t.mode : t.type; }
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
    return '';
  }

  /* ---------- 묶음 → 카드 ---------- */
  App.prototype.renderGroups = function () {
    var self = this, box = el('div', { class: 'acc', id: 'taskList' });
    var firstOpen = null;
    GROUPS.forEach(function (g) {
      var ts = self.day.tasks.filter(function (t) { return (t.group || 'sentence') === g[0]; });
      if (ts.length && !firstOpen && ts.some(function (t) { return !finished(t); })) firstOpen = g[0];
    });
    if (this.gOpen === null) { this.gOpen = {}; if (firstOpen) this.gOpen[firstOpen] = true; }
    GROUPS.forEach(function (g) {
      var ts = self.day.tasks.filter(function (t) { return (t.group || 'sentence') === g[0]; });
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
    var now = Date.now();
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
    var active = null, tapped = opts.tapped || {};
    String(text || '').split(/(\s+)/).forEach(function (tok) {
      if (!tok || /^\s+$/.test(tok)) { box.appendChild(document.createTextNode(tok)); return; }
      var core = (tok.match(/[가-힣]+/) || [''])[0], g = (opts.gloss || {})[core];
      var sp = el('span', { class: 'w' + (g ? ' g' : ''), 'data-w': core, onclick: function (e) {
        if (!core) return;
        var sel = window.getSelection && window.getSelection(); if (sel && String(sel).trim().length > 1) return;   // 끌어서 고르는 중
        e.stopPropagation();
        if (active === sp) { sp.classList.remove('on'); active = null; bar.classList.add('hidden'); return; }   // 다시 누르면 닫힘
        if (active) active.classList.remove('on');
        active = sp; sp.classList.add('on'); tapped[core] = 1;
        show(core, g);
      } }, tok);
      box.appendChild(sp);
    });
    function show(span, g) {
      bar.classList.remove('hidden'); bar.innerHTML = '';
      bar.appendChild(el('div', { class: 'row wrapr', style: { gap: '8px' } },
        g ? el('span', { class: 'grow' }, el('b', { lang: 'ko' }, g.display), ' — ' + g.en) : el('span', { class: 'grow' }, el('b', { lang: 'ko' }, span)),
        btn('I don’t get this', 'xs', function () { ask(span); }, { 'data-act': 'mark-open' }),
        btn('✕', 'ghost xs', function () { if (active) active.classList.remove('on'); active = null; bar.classList.add('hidden'); }, { 'aria-label': 'Close', 'data-act': 'mark-close' })));
    }
    function ask(span) {
      var kind = '';
      bar.innerHTML = '';
      var kinds = el('div', { class: 'tags', role: 'group', 'aria-label': 'What is hard?' }, KINDS.map(function (k) {
        return el('button', { type: 'button', class: 'tagc', 'data-kind': k[0], onclick: function (e) { kind = kind === k[0] ? '' : k[0]; kinds.querySelectorAll('.tagc').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-kind') === kind); }); e.stopPropagation(); } }, k[1] + ' · ' + k[2]);
      }));
      bar.appendChild(el('div', { class: 'small' }, 'Send “', el('b', { lang: 'ko' }, span), '” to Dongjae? (optional: what kind)'));
      bar.appendChild(kinds);
      bar.appendChild(el('div', { class: 'actions' }, btn('Send', 'primary xs', function () {
        U.call('student.mark', { key: self.key, dayset_id: self.day.dayset_id, task_id: opts.task_id || '', text: span, kind: kind, context: String(text).slice(0, 200), where: opts.where || '' })
          .then(function () { box.querySelectorAll('.w').forEach(function (w) { if (span.indexOf(w.getAttribute('data-w')) >= 0 && w.getAttribute('data-w')) w.classList.add('marked'); }); if (opts.onMark) opts.onMark(span); bar.classList.add('hidden'); if (active) active.classList.remove('on'); active = null; U.toast('Sent to Dongjae — he will explain. 선생님에게 보냈어요'); }, function (e) { U.toast(e.message); });
      }, { 'data-act': 'mark-send' }), btn('Cancel', 'ghost xs', function () { bar.classList.add('hidden'); }, {})));
    }
    function onSelect() {
      var sel = window.getSelection && window.getSelection(); if (!sel || sel.isCollapsed) return;
      var txt = String(sel).trim();
      if (txt.length < 1 || txt.length > 40 || !box.contains(sel.anchorNode) || !/[가-힣]/.test(txt)) return;
      if (active) { active.classList.remove('on'); active = null; }
      show(txt, null);
    }
    box.addEventListener('mouseup', function () { setTimeout(onSelect, 0); });
    box.addEventListener('touchend', function () { setTimeout(onSelect, 250); });
    wrap.appendChild(box); wrap.appendChild(bar);
    wrap.tapped = tapped;
    return wrap;
  };
  function speakBtn(text) {   // 지금은 브라우저 한국어 음성, 나중에 'Dongjae AI 음성'으로 바꿀 자리
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return null;
    var hasKo = (speechSynthesis.getVoices() || []).some(function (v) { return /^ko/i.test(v.lang); });
    if (!hasKo) return null;
    return btn(U.icon('speaker'), 'ghost xs', function () { var u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }, { 'aria-label': 'Listen', 'data-act': 'listen' });
  }
  function pronLine(text) {
    if (!window.Pron) return null;
    var p = window.Pron.pron(text);
    return p.rules.length ? el('div', { class: 'pron', 'data-act': 'pron' }, '[' + p.text + '] ', el('span', { class: 'tiny' }, p.rules.join(' · '))) : null;
  }

  /* ---------- 카드 몸통 ---------- */
  App.prototype.renderBody = function (t) {
    var self = this, body = el('div', { class: 'acc-body' });
    if (t.type === 'cards') { body.appendChild(this.renderCards(t)); return body; }
    if (t.type === 'sp_ko_en') body.appendChild(this.markable(t.ko, { cls: 'prompt-big', task_id: t.task_id, where: 'sentence' }));
    if (t.type === 'sp_en_ko') body.appendChild(el('div', { class: 'prompt-big en', lang: 'en' }, t.en));
    if (t.type === 'sp_qa') body.appendChild(this.markable(t.q_ko, { cls: 'prompt-big', task_id: t.task_id, where: 'question' }));
    if (t.type === 'write') body.appendChild(el('div', { class: 'prompt-big en', lang: 'en', style: { fontSize: '17px' } }, t.prompt));
    if (t.type === 'grammar') body.appendChild(this.markable(t.instruction, { cls: 'prompt-big en', task_id: t.task_id, where: 'grammar' }));
    if (t.type === 'ctx') body.appendChild(this.markable(t.sentence, { cls: 'prompt-big', task_id: t.task_id, where: 'context' }));
    if (t.type === 'mission') {
      body.appendChild(el('div', { class: 'small', style: { marginTop: '8px' } }, t.scene_en));
      body.appendChild(el('div', { class: 'tags', style: { margin: '6px 0' } }, el('span', { class: 'tiny' }, 'Try to use:'), (t.targets || []).map(function (x) { return el('span', { class: 'chip target', lang: 'ko' }, x); })));
    }
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
        done ? el('span', { class: 'tiny' }, isWaiting(st.sub) ? 'checking…' : st.kind === 'record' ? 'recorded' : st.kind === 'hand' ? 'written' : 'done') : null));
      if (done) { var rs = self.stepResult(t, st); if (rs) li.appendChild(rs); }
      else if (isAct) li.appendChild(self.stepInput(t, st));
      steps.appendChild(li);
    });
    body.appendChild(steps);
    if (t.steps.some(function (x) { return isWaiting(x.sub); })) body.appendChild(el('div', { class: 'res wait', style: { marginTop: '10px' } }, 'Sent. Dongjae will check and reply here. 선생님이 확인해요.'));
    if (finished(t)) body.appendChild(this.modelBox(t));
    (t.card_feedback || []).forEach(function (f) { body.appendChild(self.feedbackBox(f)); });
    if (t.type === 'mission') { var rep = null; t.steps.forEach(function (s) { if (s.sub && s.sub.auto && s.sub.auto.mission_report) rep = s.sub.auto.mission_report; }); if (rep) body.appendChild(missionReport(rep)); }
    var next = this.day.tasks.filter(function (x) { return x.task_id !== t.task_id && !finished(x); })[0];
    if (finished(t) && next) body.appendChild(el('div', { class: 'actions' }, el('span', { class: 'grow' }), btn('Next: ' + (TYPE[typeKey(next)] || '') + ' ›', 'ghost sm', function () { self.toggle(next.task_id); }, { 'data-act': 'next' })));
    return body;
  };
  function missionReport(r) {
    function row(ic, label, xs) { return xs && xs.length ? el('div', {}, ic + ' ' + label + ': ', el('b', { lang: 'ko' }, xs.join(', '))) : null; }
    return el('div', { class: 'res ok', style: { marginTop: '10px' }, 'data-act': 'mission-report' }, el('div', { class: 'tiny' }, 'Mission report · 미션 결과'),
      row('✓', 'Used well', r.used), row('△', 'Tried — small error', r.tried), row('○', 'Not tried yet', r.not_tried), row('•', 'Other', r.other));
  }
  App.prototype.feedbackBox = function (f) {
    var self = this, box = el('div', { class: 'fb', 'data-act': 'card-feedback' }, el('div', { class: 'row' }, el('b', {}, 'Dongjae'), f.score5 ? U.stars(f.score5) : null),
      (f.tags || []).length ? el('div', { class: 'tags', style: { margin: '4px 0' } }, f.tags.map(function (x) { return el('span', { class: 'chip k' }, x); })) : null,
      f.comment ? el('div', { lang: 'ko' }, f.comment) : null);
    if (f.audio_file_id) {
      var slot = el('div', { class: 'recbox', style: { marginTop: '6px' } }, btn([U.icon('speaker'), 'Dongjae’s voice'], 'xs', function () {
        slot.innerHTML = '<span class="tiny">…</span>';
        U.call('student.media', { key: self.key, file_id: f.audio_file_id }).then(function (m) { slot.innerHTML = ''; var a = el('audio', { controls: true, src: U.b64Url(m) }); slot.appendChild(a); try { a.play(); } catch (e) { /* 자동 재생 막힘 */ } }, function () { slot.textContent = 'Could not load.'; });
      }, { 'data-act': 'teacher-voice' }));
      box.appendChild(slot);
    }
    return box;
  };
  App.prototype.activeStep = function (t) {
    if (t._active && t.steps.some(function (s) { return s.step_id === t._active && !s.sub; })) return t._active;
    var s = t.steps.filter(function (x) { return !x.sub; })[0];
    return s ? s.step_id : null;
  };
  App.prototype.modelBox = function (t) {
    var m = null;
    if (t.type === 'sp_ko_en') m = (t.en_answers || [])[0];
    if (t.type === 'sp_en_ko') m = (t.ko_answers || [])[0];
    if (t.type === 'sp_qa') m = t.model_a ? 'Example answer: ' + t.model_a : null;
    if (t.type === 'grammar' && t.mode === 'hand') m = t.model;
    if (t.type === 'write') m = t.model ? 'Example: ' + t.model : null;
    if (t.type === 'ctx') m = t.full;
    if (!m) return el('span');
    var korean = /[가-힣]/.test(m);
    return el('div', { class: 'res wait', style: { marginTop: '10px' } }, el('span', { class: 'tiny' }, 'Model · 모범 답'), el('div', { lang: 'ko' }, m),
      korean ? pronLine(m.replace(/^Example( answer)?: /, '')) : null, t.type === 'ctx' && t.sentence_en ? el('div', { class: 'tiny' }, t.sentence_en) : null);
  };
  function isWaiting(s) { return !!s && (s.grade_status === 'pending' || s.grade_status === 'ai_held' || s.grade_status === 'needs_teacher_review'); }
  App.prototype.stepResult = function (t, st) {
    var s = st.sub, box = el('div', { class: 'step-res' });
    if (isWaiting(s)) return null;
    var a = s.auto || {};
    if (st.kind === 'choice') {
      box.appendChild(el('div', { class: 'res ' + (a.status === 'correct' ? 'ok' : 'bad') }, a.status === 'correct' ? 'Correct! 맞아요' : 'Not quite. Answer: ', a.status === 'correct' ? null : el('b', { lang: 'ko' }, a.correct)));
    } else if (st.kind === 'read') {
      box.appendChild(el('div', { class: 'tiny' }, (a.looked_up || []).length ? 'Words you looked up come back in review: ' + a.looked_up.join(', ') : 'Read ✓'));
    } else if ((st.kind === 'hand' || st.kind === 'ko_answer') && a.ocr_text) {
      var cls = a.status === 'correct' ? 'ok' : a.status === 'close' ? 'close' : 'bad';
      box.appendChild(el('div', { class: 'res ' + cls }, el('div', { class: 'tiny' }, 'What we read from your writing'), U.diffNode(a.ocr_text, a.corrected || a.target || a.ocr_text),
        a.comment_en ? el('div', { class: 'small', style: { marginTop: '4px' } }, a.comment_en) : null));
    } else if (st.kind === 'type_en' && s.grade_status !== 'teacher_reviewed') {
      var c2 = a.status === 'correct' ? 'ok' : a.status === 'close' ? 'close' : 'bad';
      box.appendChild(el('div', { class: 'res ' + c2 }, a.comment_en || 'Checked', a.corrected && a.status !== 'correct' ? el('div', { class: 'small' }, 'Better: ' + a.corrected) : null));
    }
    (s.feedback || []).forEach(function (f) {
      if (f.source !== 'teacher') return;
      box.appendChild(el('div', { class: 'fb' }, el('div', { class: 'row' }, el('b', {}, 'Dongjae'), U.stars(f.score5 || 0)), f.comment ? el('div', { lang: 'ko' }, f.comment) : null));
    });
    return box.childNodes.length ? box : null;
  };
  App.prototype.stepInput = function (t, st) {
    var self = this, b = el('div', { class: 'step-b' }), getAns = null, getMedia = null, getMedia2 = null;
    var doneBtn = btn('Done ✓', 'primary sm', function () { self.submitStep(t, st, getAns ? getAns() : {}, getMedia, doneBtn, getMedia2); }, { 'data-act': 'done', disabled: true });
    function setReady(v) { doneBtn.disabled = !v; }
    if (st.kind === 'record') {
      var say = null;
      if (t.type === 'reading') say = this.markable(t.read_aloud, { cls: 'passage', task_id: t.task_id, where: 'read-aloud', gloss: t.gloss });
      if (t.type === 'sp_en_ko') b.appendChild(el('div', { class: 'tiny' }, 'Read your own Korean sentence aloud.'));
      if (t.type === 'sp_qa' && st.step_id === 's3') b.appendChild(el('div', { class: 'tiny' }, 'Answer about yourself — in Korean. 한국어로 대답하세요.'));
      if (t.type === 'grammar') {
        var chosen = t.steps[0].sub && t.steps[0].sub.answer && t.steps[0].sub.answer.choice !== undefined && t.options ? t.options[t.steps[0].sub.answer.choice] : null;
        b.appendChild(chosen ? el('div', { class: 'prompt-big', lang: 'ko', style: { fontSize: '19px' } }, chosen) : el('div', { class: 'tiny' }, 'Read the sentence you wrote.'));
        if (t._lastImg) b.appendChild(el('img', { class: 'thumb', src: t._lastImg, alt: 'Your sentence' }));
        else if (t._lastTyped) b.appendChild(el('div', { class: 'prompt-big', lang: 'ko', style: { fontSize: '19px' } }, t._lastTyped));
      }
      if (t.type === 'write' && t._lastImg) b.appendChild(el('img', { class: 'thumb', src: t._lastImg, alt: 'Your writing' }));
      if ((t.type === 'write' || t.type === 'sp_en_ko') && t._lastTyped) b.appendChild(el('div', { class: 'prompt-big', lang: 'ko', style: { fontSize: '19px' } }, t._lastTyped));
      if (t.type === 'mission') { var q = (t.turns || [])[st.turn] || ''; b.appendChild(el('div', { class: 'bubble', lang: 'ko' }, el('span', { class: 'tiny' }, 'Q' + (st.turn + 1) + ' '), q, speakBtn(q))); }
      if (say) b.appendChild(say);
      var w = U.recWidget({ label: 'Record', max: t.type === 'reading' ? 180 : t.type === 'mission' ? 60 : 45, onReady: function (r) { setReady(!!r); } });
      b.appendChild(w.node);
      getAns = function () { var r = w.result(); return { sec: r ? r.sec : 0 }; };
      getMedia = function () { var r = w.result(); return U.blobToB64(r.blob).then(function (b64) { return { b64: b64, mime: r.mime }; }); };
    } else if (st.kind === 'type_en') {
      var inp = U.textInput({ placeholder: t.type === 'sp_qa' ? 'The question means…' : 'In English…', lang: 'en', onChange: function (v) { setReady(v.trim().length > 1); }, onEnter: function () { if (!doneBtn.disabled) doneBtn.click(); } });
      b.appendChild(inp); getAns = function () { return { text: inp.value.trim() }; };
      setTimeout(function () { inp.focus({ preventScroll: true }); }, 30);
    } else if (st.kind === 'hand') {
      if (t.type === 'sp_qa') b.appendChild(el('div', { class: 'tiny' }, 'Write the answer you just said.'));
      var pad = U.handPad({ allowType: self.data.student.allow_type, hint: t.type === 'write' ? 'Write here — or take a photo of your paper' : 'Write the Korean here', onChange: function (v) { setReady(v); } });
      b.appendChild(pad.node);
      getAns = function () { return {}; };
      getMedia = function () { return pad.export().then(function (m) { if (m.typed !== undefined) { t._lastTyped = m.typed; t._lastImg = null; } else { t._lastImg = 'data:' + m.mime + ';base64,' + m.b64; t._lastTyped = null; } return m; }); };
    } else if (st.kind === 'choice') {
      var opts = el('div', { class: 'opts', role: 'radiogroup' });
      t.options.forEach(function (o, k) { opts.appendChild(el('button', { class: 'opt', type: 'button', lang: 'ko', role: 'radio', 'data-opt': String(k), onclick: function () { self.submitStep(t, st, { choice: k }, null, null); } }, o)); });
      b.appendChild(opts); return b;
    } else if (st.kind === 'read') {
      var tapped = {}, marked = 0;
      var mk = this.markable(t.text, { cls: 'passage', gloss: t.gloss, tapped: tapped, task_id: t.task_id, where: 'reading', onMark: function () { marked++; } });
      b.appendChild(mk);
      b.appendChild(el('div', { class: 'tiny', style: { marginTop: '6px' } }, 'Tap a word for its meaning (tap again to close). Drag across words — or tap “I don’t get this” — to tell Dongjae what you don’t get.'));
      setReady(true); doneBtn.textContent = 'I’ve read it ✓';
      getAns = function () { return { looked_up: Object.keys(tapped).filter(function (k) { return (t.gloss || {})[k]; }), marked: marked }; };
    } else if (st.kind === 'ko_answer') {
      var q2 = (t.questions || [])[st.q] || {}, enInp = null, padReady = false, rec = null;
      b.appendChild(el('div', { class: 'qbox' }, el('div', { lang: 'ko', style: { fontWeight: 600 } }, q2.q), q2.q_en && q2.q_en !== q2.q ? el('div', { class: 'tiny' }, q2.q_en) : null,
        el('span', { class: 'chip k', style: { marginTop: '4px' } }, q2.type === 'content' ? 'About the text' : 'About you')));
      if (q2.type === 'content') {
        enInp = U.textInput({ placeholder: '(optional) In English first — what is the answer?', lang: 'en' });
        b.appendChild(el('div', { style: { margin: '6px 0' } }, enInp));
      }
      b.appendChild(el('div', { class: 'tiny' }, 'Now answer in Korean — write it by hand' + (self.data.student.allow_type ? ' (or type it)' : '')));
      var pad2 = U.handPad({ allowType: self.data.student.allow_type, hint: '한국어로 써 보세요', onChange: function (v) { padReady = v; setReady(padReady && !!rec); } });
      b.appendChild(pad2.node);
      b.appendChild(el('div', { class: 'tiny', style: { marginTop: '6px' } }, 'Then say your answer aloud'));
      var w2 = U.recWidget({ label: 'Say it', max: 60, onReady: function (r) { rec = r; setReady(padReady && !!rec); } });
      b.appendChild(w2.node);
      getAns = function () { var o = { mode: 'canvas', sec: rec ? rec.sec : 0 }; if (enInp && enInp.value.trim()) o.en = enInp.value.trim(); return o; };
      getMedia = function () { return pad2.export(); };
      getMedia2 = function () { return U.blobToB64(rec.blob).then(function (b64) { return { b64: b64, mime: rec.mime }; }); };
    }
    b.appendChild(el('div', { class: 'actions' }, doneBtn));
    return b;
  };
  App.prototype.submitStep = function (t, st, ans, getMedia, doneBtn, getMedia2) {
    var self = this, tm = this.tm(t.task_id), now = Date.now();
    if (doneBtn) { doneBtn.disabled = true; doneBtn.textContent = 'Sending…'; }
    var m1 = getMedia ? getMedia() : Promise.resolve(null), m2 = getMedia2 ? getMedia2() : Promise.resolve(null);
    Promise.all([m1, m2]).then(function (ms) {
      var m = ms[0];
      if (m && m.mode) { ans.mode = m.mode; delete m.mode; }
      if (m && m.typed !== undefined) { ans.typed = m.typed; m = null; }   // 한국어를 타자로 씀 (사진 없음)
      var payload = { key: self.key, dayset_id: self.day.dayset_id, task_id: t.task_id, step_id: st.step_id, answer: ans, media: m, media2: ms[1],
        time_ms: now - (tm.stepStart || now), dwell_ms: tm.dwell + (tm.openAt ? now - tm.openAt : 0) };
      return self.box.send('student.step', payload);
    }).then(function (res) {
      tm.stepStart = Date.now();
      if (res.queued) { U.toast('Saved — will send when you are online. 저장했어요'); st.sub = { grade_status: 'pending', auto: null, feedback: [] }; }
      else st.sub = res.step;
      t._active = null;
      if (res.card) { t.status = res.card.status; t.n_done = res.card.n_done; t.score = res.card.score; }
      if (res.day) self.day.ratio = res.day.ratio;
      if (self.dirty || (res.card && (res.card.status === 'sent' || res.card.status === 'done'))) { self.dirty = false; return self.reloadDay(); }
      self.rerenderList();
    }).catch(function (e) {
      if (doneBtn) { doneBtn.disabled = false; doneBtn.textContent = 'Done ✓'; }
      if (e.message === 'consent required') { self.data.student.consent_at = null; self.render(); return; }
      if (e.preview) { U.toast('미리 보기 — 저장하지 않았어요'); return; }
      U.toast('Could not send — try again (' + e.message + ')');
    });
  };
  App.prototype.reloadDay = function () {
    var self = this;
    var p = this.dayOverride ? U.call('student.history', { key: this.key, dayset_id: this.dayOverride }) : U.call('student.today', { key: this.key });
    return p.then(function (d) {
      if (d.student) self.data = d;
      var keep = {}; (self.day ? self.day.tasks : []).forEach(function (t) { keep[t.task_id] = t; });
      self.day = d.day;
      self.day.tasks.forEach(function (t) { var o = keep[t.task_id]; if (o) { t._lastImg = o._lastImg; t._lastTyped = o._lastTyped; t._q = o._q; t._att = o._att; t._first = o._first; } });
      self.rerenderList();
    });
  };

  /* ---------- 단어 카드: 뜻 → (말하기 또는 타자) → 답 + [발음] + 소리 → 2버튼. 틀리면 이번에 3번까지 다시 ---------- */
  App.prototype.renderCards = function (t) {
    var self = this, wrap = el('div');
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
    if (c.chunk && phase === 'front') flash.appendChild(el('div', { class: 'tiny' }, '(a phrase — include the particle)'));
    var rec = t._rec && t._rec.idx === idx ? t._rec.r : null;
    if (phase === 'back') {
      flash.appendChild(el('div', { class: 'back', lang: 'ko' }, c.display, ' ', speakBtn(c.ko)));
      var pl = pronLine(c.ko); if (pl) flash.appendChild(pl);
      if (typedRes) flash.appendChild(el('div', { class: 'res ' + (typedRes.status === 'correct' ? 'ok' : typedRes.status === 'close' ? 'close' : 'bad'), style: { textAlign: 'left' } }, 'You typed: ', U.diffNode(typedRes.text, typedRes.target)));
      if (c.note) flash.appendChild(el('div', { class: 'small', style: { textAlign: 'left' } }, U.icon('bulb'), ' ' + c.note));
      if (c.explain) flash.appendChild(el('div', { class: 'small', style: { textAlign: 'left' } }, U.icon('chat'), ' ' + c.explain));
      if (c.example) flash.appendChild(this.markable(c.example, { cls: 'ex', task_id: t.task_id, where: 'card-example' }));
      if (rec) flash.appendChild(el('audio', { controls: true, src: URL.createObjectURL(rec.blob), style: { height: '34px', margin: '4px auto 0' } }));
    }
    wrap.appendChild(flash);
    function finish(rating) {
      var first = t._first[idx] !== undefined ? t._first[idx] : rating;
      var att = (t._att[idx] || 0) + 1;
      if (rating === 1 && att < 3) {   // 이번에 다시 (최대 3번)
        t._first[idx] = first; t._att[idx] = att; t._q.push(t._q.shift()); t._phase = null; t._typed = null; self.rerenderList(); return;
      }
      var r = rec, typed = typedRes;
      t._phase = null; t._typed = null; t._rec = null; t._q.shift();
      var ans = { rating: first, attempts: att };
      if (typed) { ans.typed = typed.text; delete ans.rating; }
      if (r) ans.said = 1;
      self.submitStep(t, step, ans, r ? function () { return U.blobToB64(r.blob).then(function (b64) { return { b64: b64, mime: r.mime }; }); } : null, null);
    }
    if (phase === 'front') {
      var row = el('div', { class: 'card-tools' });
      var w = U.recWidget({ label: 'Say it', max: 8, onReady: function (r) { if (r) { t._rec = { idx: idx, r: r }; t._phase = idx; self.rerenderList(); } } });
      row.appendChild(w.node);
      var typeBox = el('div', { class: 'hidden', style: { marginTop: '8px' } });
      var inp = U.textInput({ placeholder: '한국어로 (Korean)', lang: 'ko', onEnter: function () { check(); } });
      function check() {
        var v = inp.value.trim(); if (!v) return;
        var ck = window.Hangul.check(v, [c.ko].concat(String(c.display).split(' / ')));
        t._typed = { idx: idx, text: v, status: ck.status, target: ck.target }; t._phase = idx; self.rerenderList();
      }
      typeBox.appendChild(el('div', { class: 'row' }, inp, btn('Check', 'sm', check, { 'data-act': 'type-check' })));
      row.appendChild(btn('Type', 'ghost sm', function () { typeBox.classList.toggle('hidden'); if (!typeBox.classList.contains('hidden')) inp.focus(); }, { 'data-act': 'type' }));
      row.appendChild(el('span', { class: 'grow' }));
      row.appendChild(btn('Show answer', 'primary sm', function () { t._phase = idx; self.rerenderList(); }, { 'data-act': 'show' }));
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
    mount: function (root, opts) {
      document.documentElement.classList.add('sx');   // T077 앱 디자인 (app.css 'html.sx')
      var a = new App(root, opts);
      window.addEventListener('hw-demo-graded', function () { if (!root.isConnected) return; if (a.open) a.dirty = true; else a.reloadDay(); });
      window.addEventListener('hw-demo-changed', function () { if (root.isConnected && !a.open) a.load(true); });
      a.load();
      return a;
    }
  };
})();
