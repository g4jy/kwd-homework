/* teacher.js — 선생님 화면 v3 (한국어)
 * 학생: 목적 × 레벨 표 (칸마다 학생 카드) · 학생 한 명: 한 화면 개요(이번 주·정확도·속도·오늘 + 이유 + 다음 수업 + 그림) → 자세히는 그 자리에서 펼침
 * 검토 대기: 학생 중심 / 태스크 중심, 오래 기다린 순·요금 순·유형 순, 질문 요청 따로. 카드 단위 'AI 초안 → 확인·보내기' + 음성 답장
 * 기준: 레벨 × 어려운 점 × 과제 유형 (criteria.js)
 */
(function () {
  'use strict';
  var U = window.UI, el = U.el, btn = U.btn, Ch = window.Charts;
  var PURPOSES = [['topik', 'TOPIK', 'TOPIK 시험'], ['travel', '여행', '여행·일상 회화'], ['career', '취업', '취업·학업'], ['personal', '개인', '개인적 목표'], ['undecided', '미정', '목적 미정']];
  // 10/19: 우리 레벨 (L0 씨앗 … L6 나무). 예전 A1 같은 값은 맨 아래 '레벨 미정' 줄에
  var BANDS = [['L0', '', 'L0 씨앗', '입문 U001–030'], ['L1', '', 'L1 새싹', '초급 U031–069'], ['L2', '', 'L2 새싹+', '초급 U034–070'], ['L3', '', 'L3 잎새', '중급 U071–130'], ['L4', '', 'L4 꽃', '중상급 U131–170'], ['L5', '', 'L5 열매', '고급 U171–215'], ['L6', '', 'L6 나무', '고급+']];
  var BAND_KEYS = BANDS.map(function (b) { return b[0]; });
  function bandRow(s) { return BAND_KEYS.indexOf(s.band) >= 0 ? s.band : '?'; }
  function purposeKey(s) { return PURPOSES.some(function (p) { return p[0] === s.purpose; }) && s.purpose ? s.purpose : 'undecided'; }
  var TODAY = { done: '완료', partial: '하는 중', not_started: '아직', none: '세트 없음', late: '늦게 완료', skipped: '안 함', rest: '쉼' };
  var PROFILE_DESC = { standard: '목적별 기본 섞기', busy: '하루 15분 권장 · 짧은 문항 위주 · 읽기·쓰기는 주말에', anxious: '말하기 미션 대신 읽기 · 질문→대답 하루 1개',
    heritage: '한영 번역 빼고 영한 번역·문형 손글씨 늘림 (맞춤법·받침 먼저)', perfectionist: '개수는 속도 계수로 자동 조절', rushing: '문맥 고르기 줄이고 영→한(만들기) 늘림', teen: '큰 과제를 맨 앞에' };
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var SKILL = { recall: '단어 떠올리기', form: '문형', context: '문맥 고르기', read: '읽기', translate: '뜻 쓰기(영어)', comprehension: '독해 답', answer_ko: '읽기 답(한국어)', write_hand: '한국어 손글씨', speak: '말하기(녹음)' };
  var SKILL_SEC = { recall: 21, form: 30, context: 30, read: 180, translate: 36, comprehension: 150, answer_ko: 120, write_hand: 60, speak: 36 };
  var TYPE_KO = { cards_review: '복습 단어', cards_new: '새 단어', ctx: '문맥 고르기', sp_ko_en: '한영 번역', sp_en_ko: '영한 번역', sp_qa: '질문에 답하기', mission: '말하기 미션', grammar: '문형', reading: '읽기', write: '쓰기' };
  var GROUP_KO = { words: '단어', ko_en: '한영 번역', en_ko: '영한 번역', qa: '질문에 답하기', sentence: '문장 연습', reading: '읽기' };
  var KIND_KO = { record: '녹음', type_en: '영어 뜻', hand: '손글씨', choice: '고르기', read: '읽기', answers: '독해 답', card: '단어 녹음', ko_answer: '한국어 답' };
  var MARK_KO = { word: '단어', grammar: '어법', pron: '발음', meaning: '뜻 모름', '': '종류 없음' };
  var QUAD = { struggling: '버거움 — 느리고 덜 정확', easy: '쉬움 — 늘려도 됨', accurate_slow: '정확하지만 느림', hard: '어려움 — 줄이기', rushing: '서두름 — 정확도 먼저', ok: '적당함', none: '기록 부족' };
  var WAIT = { needs_teacher_review: 1, ai_held: 1 };
  function purposeOf(k) { return PURPOSES.filter(function (p) { return p[0] === (k || 'undecided'); })[0] || PURPOSES[PURPOSES.length - 1]; }
  function typeKey(t) { return t.type === 'cards' ? 'cards_' + t.mode : t.type; }
  function preview(t) { return t.type === 'cards' ? t.cards.length + '장' : t.ko || t.en || t.q_ko || t.sentence || (t.title ? String(t.title).replace(/\s*\(.*\)$/, '') : '') || t.prompt || t.instruction || (t.targets || []).join(', '); }
  function ago(iso) { var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? m + '분' : m < 1440 ? Math.round(m / 60) + '시간' : Math.round(m / 1440) + '일'; }
  function hm(h) { h = (h + 24) % 24; var H = Math.floor(h), M = Math.round((h - H) * 60); return ('0' + H).slice(-2) + ':' + ('0' + M).slice(-2); }
  function weekLbl(w) { return w.slice(5).replace('-', '/'); }
  function cw(half) { var full = Math.min(window.innerWidth, 1180) - 32 - 30; return half && window.innerWidth > 760 ? Math.floor((full - 12) / 2) : full; }
  function won(p) { return p ? '$' + p : '—'; }

  function App(root, opts) {
    this.root = root; this.tkey = opts.tkey; this.view = 'board';
    this.f = { q: '', filter: 'all', sort: 'attention', layout: 'grid' };
    this.qf = { mode: 'student', sort: 'oldest', type: 'all' }; this.qOpenG = {}; this.qOpen = null; this.marksOpen = true;
    this.openSec = {}; this.tags = null; this.mediaCache = {};
  }
  App.prototype.call = function (a, p) { return U.call(a, Object.assign({ tkey: this.tkey }, p || {})); };
  App.prototype.go = function (view, arg) { this.view = view; this.arg = arg; this.render(); window.scrollTo(0, 0); };
  App.prototype.render = function () {
    var self = this;
    this.root.innerHTML = '';
    var w = el('div', { class: 'wrap wide' });
    w.appendChild(el('div', { class: 'top' }, el('div', { class: 'brand' }, 'KWD ', el('b', {}, '숙제'), el('span', { class: 'tiny' }, ' · 선생님')), el('span', { class: 'grow' }),
      el('div', { class: 'tabs', role: 'tablist' },
        el('button', { type: 'button', class: this.view === 'board' || this.view === 'student' ? 'on' : '', 'data-act': 'tab-board', onclick: function () { self.go('board'); } }, '학생'),
        el('button', { type: 'button', class: this.view === 'queue' ? 'on' : '', 'data-act': 'tab-queue', onclick: function () { self.qf.student = null; self.go('queue'); } }, '검토 대기 ', el('span', { class: 'badge', id: 'qBadge' }, '…')),
        el('button', { type: 'button', class: this.view === 'criteria' ? 'on' : '', 'data-act': 'tab-criteria', onclick: function () { self.go('criteria'); } }, '기준'))));
    var main = el('div', { id: 'main' }, U.loading('불러오는 중…'));
    w.appendChild(main); this.root.appendChild(w);
    var v = this.view, pr = v === 'board' ? this.renderBoard(main) : v === 'student' ? this.renderStudent(main, this.arg) : v === 'criteria' ? this.renderCriteria(main) : this.renderQueue(main);
    return pr.catch(function (e) { main.innerHTML = ''; main.appendChild(el('div', { class: 'state-t', role: 'alert', 'data-act': 'load-error' }, el('h2', {}, '불러오지 못했어요'), el('p', { class: 'small' }, e.message), btn('다시 시도', 'primary', function () { self.render(); }))); });
  };
  /** 같은 자리에서 다시 그리기 (스크롤 유지) */
  App.prototype.refresh = function () {
    var y = window.scrollY, self = this;
    this.root.style.minHeight = document.documentElement.scrollHeight + 'px';
    return this.render().then(function () { window.scrollTo(0, y); self.root.style.minHeight = ''; });
  };
  App.prototype.setBadge = function (n) { var b = this.root.querySelector('#qBadge'); if (b) { b.textContent = n; b.style.background = n ? '' : 'var(--ink-3)'; } };

  /* ================= 학생 표: 목적 × 레벨 ================= */
  App.prototype.renderBoard = function (main) {
    var self = this;
    return this.call('teacher.board').then(function (d) {
      self.board = d; self.setBadge(d.review_queue);
      main.innerHTML = '';
      var S = d.students, cnt = function (st) { return S.filter(function (s) { return s.today.status === st; }).length; };
      main.appendChild(el('div', { class: 'row wrapr', style: { margin: '4px 0 10px' } }, el('h1', {}, '학생 ', el('span', { class: 'en' }, S.length + '명')), el('span', { class: 'grow' }),
        el('span', { class: 'small' }, '오늘 완료 ' + cnt('done') + ' · 하는 중 ' + cnt('partial') + ' · 아직 ' + cnt('not_started'))));
      var att = S.filter(function (s) { return s.attention.score >= 15; }).sort(function (a, b) { return b.attention.score - a.attention.score; }).slice(0, 3);
      if (att.length) {
        main.appendChild(el('div', { class: 'group-label' }, '먼저 볼 학생'));
        main.appendChild(el('div', { class: 'attn', id: 'attn' }, att.map(function (s) {
          return el('div', { class: 'card', role: 'button', tabindex: '0', 'data-sid': s.student_id, onclick: function () { self.go('student', s.student_id); } },
            el('div', { class: 'row' }, U.flag(s.country), el('b', { class: 'grow' }, s.name), el('span', { class: 'chip bad' }, '주의 ' + s.attention.score)),
            el('div', { class: 'small', style: { marginTop: '4px' } }, s.attention.reasons.slice(0, 2).join(' · ')));
        })));
      }
      var q = U.textInput({ placeholder: '이름 찾기', lang: 'ko', value: self.f.q, onChange: function (v) { self.f.q = v; draw(); } });
      var sel = el('select', { 'aria-label': '정렬', 'data-act': 'sort', onchange: function (e) { self.f.sort = e.target.value; draw(); } },
        [['attention', '주의 순'], ['name', '이름 순'], ['acc', '정확도 낮은 순'], ['streak', '연속 짧은 순'], ['price', '요금 높은 순'], ['local', '현지 시각 순']].map(function (o) { return el('option', { value: o[0], selected: self.f.sort === o[0] ? 'selected' : null }, o[1]); }));
      var fseg = el('div', { class: 'seg', role: 'group', 'aria-label': '필터' }, [['all', '전체'], ['not_started', '오늘 아직'], ['review', '검토 대기'], ['attention', '주의']].map(function (o) {
        return el('button', { type: 'button', class: self.f.filter === o[0] ? 'on' : '', 'data-filter': o[0], onclick: function () { self.f.filter = o[0]; fseg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-filter') === o[0]); }); draw(); } }, o[1]);
      }));
      var lseg = el('div', { class: 'seg', role: 'group', 'aria-label': '보기' }, [['grid', '표'], ['list', '목록']].map(function (o) {
        return el('button', { type: 'button', class: self.f.layout === o[0] ? 'on' : '', 'data-layout': o[0], onclick: function () { self.f.layout = o[0]; lseg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-layout') === o[0]); }); draw(); } }, o[1]);
      }));
      main.appendChild(el('div', { class: 'filters' }, q, fseg, sel, el('span', { class: 'grow' }), lseg));
      var out = el('div', { id: 'boardOut' }); main.appendChild(out);
      function draw() {
        var list = S.filter(function (s) {
          if (self.f.q && s.name.toLowerCase().indexOf(self.f.q.toLowerCase()) < 0) return false;
          if (self.f.filter === 'not_started') return s.today.status === 'not_started' || s.today.status === 'none';
          if (self.f.filter === 'review') return s.review_n > 0;
          if (self.f.filter === 'attention') return s.attention.score >= 15;
          return true;
        });
        var key = { attention: function (s) { return -s.attention.score; }, name: function (s) { return s.name; }, acc: function (s) { return s.acc === null ? 9 : s.acc; },
          streak: function (s) { return s.streak; }, price: function (s) { return -(s.price || 0); }, local: function (s) { return s.local_time; } }[self.f.sort];
        list.sort(function (a, b) { var x = key(a), y = key(b); return x < y ? -1 : x > y ? 1 : 0; });
        out.innerHTML = '';
        if (!list.length) { out.appendChild(el('div', { class: 'card small' }, '조건에 맞는 학생이 없어요.')); return; }
        if (self.f.layout === 'grid') { out.appendChild(self.matrix(list)); out.appendChild(self.mobileGroups(list)); }
        else out.appendChild(self.table(list));
      }
      draw();
    });
  };
  /** 학생 카드: 국기 · 이름 · 칩 1–2개 (오늘 상태 + 가장 급한 것 하나) */
  App.prototype.stuCard = function (s, showPurpose) {
    var self = this, chips = [];
    if (isTest(s)) chips.push(el('span', { class: 'chip test', title: '시험용 가상 학생' }, '테스트'));
    chips.push(el('span', { class: 'chip ' + ({ done: 'done', partial: 'doing', late: 'sent', rest: 'rest' }[s.today.status] || 'todo') }, TODAY[s.today.status] || s.today.status));
    if (s.attention.score >= 15) chips.push(el('span', { class: 'chip bad', title: s.attention.reasons.join(' / ') }, s.attention.reasons[0] ? s.attention.reasons[0].replace(/최근 7일 중 /, '').slice(0, 14) : '주의'));
    else if (s.review_n) chips.push(el('span', { class: 'chip sent' }, '검토 ' + s.review_n));
    return el('button', { class: 'scard', type: 'button', 'data-sid': s.student_id, title: s.name + ' · 현지 ' + s.local_time + (s.plan ? ' · ' + s.plan : ''), onclick: function () { self.go('student', s.student_id); } },
      el('span', { class: 'row', style: { gap: '6px' } }, U.flag(s.country), showPurpose ? el('span', { class: 'chip k', title: purposeOf(s.purpose)[2] }, purposeOf(s.purpose)[1]) : null, el('b', { class: 'nm' }, s.name)),
      el('span', { class: 'row', style: { gap: '4px', flexWrap: 'wrap' } }, chips.slice(0, 2)));
  };
  App.prototype.matrix = function (list) {
    var self = this;
    var thead = el('thead', {}, el('tr', {}, el('th', { scope: 'col', class: 'corner' }, '레벨 \\ 목적'), PURPOSES.map(function (p) { return el('th', { scope: 'col' }, p[2]); })));
    var rows = BANDS.concat(list.some(function (s) { return bandRow(s) === '?'; }) ? [['?', '', '레벨 미정', '']] : []);
    var tbody = el('tbody', {}, rows.map(function (b) {
      return el('tr', {}, el('th', { scope: 'row' }, b[2], el('small', {}, b[3])),
        PURPOSES.map(function (p) {
          var xs = list.filter(function (s) { return bandRow(s) === b[0] && purposeKey(s) === p[0]; });
          return el('td', { 'data-cell': b[0] + '|' + p[0] }, xs.map(function (s) { return self.stuCard(s); }));
        }));
    }));
    return el('table', { class: 'mtx', id: 'matrix' }, thead, tbody);
  };
  App.prototype.mobileGroups = function (list) {
    var self = this, box = el('div', { class: 'only-mobile' });
    BANDS.concat([['?', '', '레벨 미정', '']]).forEach(function (b) {
      var xs = list.filter(function (s) { return bandRow(s) === b[0]; });
      if (!xs.length) return;
      box.appendChild(el('div', { class: 'group-label' }, b[2] + (b[3] ? ' · ' + b[3] : '')));
      box.appendChild(el('div', { class: 'acc' }, xs.map(function (s) { return self.stuCard(s, true); })));
    });
    return box;
  };
  App.prototype.table = function (list) {
    var self = this;
    return el('div', { style: { overflowX: 'auto' } }, el('table', { class: 'list-table', id: 'listTable' },
      el('thead', {}, el('tr', {}, ['이름', '레벨', '목적', '오늘', '최근 정확도', '연속', '주의', '요금', '현지'].map(function (h) { return el('th', {}, h); }))),
      el('tbody', {}, list.map(function (s) {
        return el('tr', { class: 'click', 'data-sid': s.student_id, onclick: function () { self.go('student', s.student_id); } },
          el('td', {}, el('span', { class: 'row' }, U.flag(s.country), el('b', {}, s.name))), el('td', {}, s.band), el('td', {}, purposeOf(s.purpose)[2]),
          el('td', {}, el('span', { class: 'row' }, el('span', { class: 'dot ' + s.today.status }), TODAY[s.today.status] || s.today.status)),
          el('td', {}, el('span', { class: 'row' }, Ch.spark(s.spark, { min: 0.4, max: 1 }), U.pct(s.acc))), el('td', {}, s.streak + '일'),
          el('td', { title: s.attention.reasons.join(' / ') }, s.attention.score ? String(s.attention.score) : '—'), el('td', {}, won(s.price)), el('td', {}, s.local_time));
      }))));
  };

  /* ================= 학생 한 명 — 중요도 순 (5 이상만 첫 화면, 4 는 작은 메모, 1–3 은 '자세히') =================
   * 7·6 지금 할 일 (검토 대기, 학생 질문, 며칠 안 함, 정확도 급락, 숙제가 너무 김)   5 이번 주·오늘 / 다음 수업에 할 것 / 숙제 양 / 수업 기록
   * 4 정확도·속도·연속·다음 알림 (한 줄 메모)   3 숙제 하는 모습·오늘 목록·유형·예외   2 추이·단원별·단어 복습·알림 기록   1 결제 정보 */
  App.prototype.renderStudent = function (main, sid) {
    var self = this;
    return this.call('teacher.student', { student_id: sid }).then(function (d) {
      self.cur = d; main.innerHTML = ''; self.setBadge(d.review_queue);
      main.appendChild(btn('← 학생 목록', 'ghost sm', function () { self.go('board'); }, { 'data-act': 'back' }));
      main.appendChild(self.spHead(d));
      main.appendChild(self.todoBox(d));
      main.appendChild(self.pulse(d));
      main.appendChild(el('div', { class: 'sp-grid' }, self.nextCard(d), self.amountCard(d)));
      main.appendChild(self.lessonCard(d));
      main.appendChild(self.details(d));
    });
  };
  function isTest(s) { return /^test_/.test(s.student_id); }
  function openStudent(s) {   // 진짜 학생 = 미리 보기(저장 안 함) · 시험 학생 = 학생처럼 직접 해 보기
    var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'student.html?k=' + s.key + (isTest(s) ? '' : '#preview');
    window.open(url, '_blank', 'noopener');
  }
  function copyLink(s) {
    var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'student.html?k=' + s.key;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { U.toast('학생 링크를 복사했어요'); }, function () { U.toast(url); }); else U.toast(url);
  }
  /** T093 적응형: 최근 2회 정답률로 정한 난도(선생님 레벨 ±1). 더 가야 하면 '확인' 표시만 */
  function adaptTag(ad) {
    if (!ad || (!ad.g && !ad.v && !ad.g_beyond && !ad.v_beyond)) return null;
    var sg = function (n) { return n > 0 ? '+1' : n < 0 ? '−1' : '0'; }, bey = ad.g_beyond || ad.v_beyond;
    return el('span', { class: 'tiny', 'data-k': 'adaptive', title: '최근 2회 정답률 85% 이상 한 칸 위 · 60% 미만 한 칸 아래 (선생님 레벨 ±1까지 자동)' + (bey ? ' — ' + [ad.g_beyond, ad.v_beyond].filter(Boolean).join(' / ') : '') },
      '난도 문법 ' + sg(ad.g) + ' · 단어 ' + sg(ad.v) + (bey ? ' · 레벨 확인' : ''));
  }
  App.prototype.spHead = function (d) {
    var self = this, s = d.student, st = s.settings;
    var prof = st.profile !== 'standard' ? (st.profile === 'custom' ? '기타' : (st.profiles.filter(function (p) { return p[0] === st.profile; })[0] || [0, ''])[1]) : null;
    return el('header', { class: 'sp-head' },
      el('div', { class: 'who' }, el('h1', {}, s.name),
        el('div', { class: 'meta' }, U.flag(s.country), el('span', {}, s.band), el('span', {}, purposeOf(s.purpose)[2]), prof ? el('span', {}, prof) : null, s.minor ? el('span', {}, '미성년') : null,
          el('span', { class: 'tiny' }, '현지 ' + s.local_time), adaptTag(st.exceptions && st.exceptions.adaptive))),
      el('div', { class: 'acts' },
        btn('알림 보내기', 'primary sm', function () { self.nudge(s); }, { 'data-act': 'nudge' }),
        btn(isTest(s) ? '학생으로 해 보기' : '학생 화면', 'ghost sm', function () { openStudent(s); }, { 'data-act': 'open-student', title: isTest(s) ? '시험 학생 — 눌러서 숙제를 직접 해 볼 수 있어요' : '학생이 보는 화면 (미리 보기 — 저장 안 됨)' }),
        btn('학생 링크 복사', 'ghost sm', function () { copyLink(s); }, { 'data-act': 'copy-link', title: '학생 숙제 화면 주소 복사 — 학생에게 보내기' })));
  };
  /** 지금 할 일 (중요도 6–7): 할 수 있는 일과 버튼을 한 줄씩. 없으면 한 줄 '급한 일 없음' */
  App.prototype.todoBox = function (d) {
    var self = this, s = d.student, a = d.analytics, items = [], used = {};
    (d.lesson_asks || []).forEach(function (q) { items.push({ lvl: 6, node: self.lessonAsk(d, q) }); });
    if (d.next_lesson && d.next_lesson.warn) items.push({ lvl: 6, node: self.forecastRow(d) });
    if (d.review_mine) items.push({ lvl: 6, text: '검토 기다림 ' + d.review_mine + '개', why: '녹음·손글씨 — AI 초안 확인하고 보내기', b: '검토하기', act: 'todo-review', fn: function () { self.qf.student = s.student_id; self.go('queue'); } });
    if (d.marks_waiting) items.push({ lvl: 6, text: '학생 질문 ' + d.marks_waiting + '개', why: '“모르겠어요” 표시 — 설명하면 학생 단어 카드가 돼요', b: '질문 보기', act: 'todo-marks', fn: function () { self.qf.student = s.student_id; self.marksOpen = true; self.go('queue'); } });
    var skipped = a.days.slice(-8, -1).filter(function (x) { return x.status === 'skipped'; }).length;
    if (skipped >= 2) { used.skip = 1; items.push({ lvl: skipped >= 3 ? 7 : 6, text: '최근 7일 중 ' + skipped + '일 숙제 안 함', why: '“바빠요”로 쉰 날은 빼고 셌어요', b: '알림 보내기', act: 'todo-nudge', fn: function () { self.nudge(s); } }); }
    d.attention.reasons.forEach(function (r) {
      if (/^정확도/.test(r)) { used[r] = 1; items.push({ lvl: 6, text: r, why: '지난 2주보다 떨어졌어요 — 아래 “다음 수업에 할 것”을 수업 첫 10분에' }); }
      else if (/^숙제가 길어요/.test(r)) { used[r] = 1; items.push({ lvl: 6, text: r, why: '약속한 하루 시간보다 오래 걸려요 — 숙제 양에서 줄이기' }); }
      else if (/바빠요/.test(r)) { used[r] = 1; items.push({ lvl: 6, text: r, why: '자주 쉬어요 — 하루 시간이 맞는지 물어보기' }); }
    });
    this._notes = d.attention.reasons.filter(function (r) { return !used[r] && !/안 함$/.test(r) && !/^질문/.test(r); });   // 나머지는 중요도 4 메모로
    items.sort(function (x, y) { return y.lvl - x.lvl; });
    if (!items.length) return el('div', { class: 'todo ok', 'data-act': 'todo' }, el('span', { class: 'dot done' }), el('span', { class: 'small' }, '급한 일 없음'));
    return el('section', { class: 'todo', 'data-act': 'todo', 'aria-label': '지금 할 일' }, el('h2', {}, '지금 할 일'),
      el('ul', {}, items.map(function (it) {
        if (it.node) return it.node;
        return el('li', { class: 'lv' + it.lvl }, el('span', { class: 'mark', 'aria-hidden': 'true' }),
          el('div', { class: 'grow' }, el('b', {}, it.text), el('div', { class: 'tiny' }, it.why)),
          it.b ? btn(it.b, 'sm', it.fn, { 'data-act': it.act }) : null);
      })));
  };
  function mdDow(ymd) { var x = new Date(ymd + 'T12:00:00Z'); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate() + '(' + ['일', '월', '화', '수', '목', '금', '토'][x.getUTCDay()] + ')'; }
  /** 다음 수업(캘린더) 전에 지금 단원 숙제가 안 끝날 것 같을 때 — 하루 시간은 그대로, 선생님이 정함 */
  App.prototype.forecastRow = function (d) {
    var self = this, s = d.student, f = d.next_lesson, acts = el('div', { class: 'row wrapr', style: { gap: '6px' } });
    if (f.need_min) acts.appendChild(btn('하루 ' + f.need_min + '분으로', 'primary sm', function () {
      self.call('teacher.settings', { student_id: s.student_id, fields: { daily_min: f.need_min }, source: 'forecast' }).then(function () {
        U.toast('하루 ' + f.need_min + '분 — 내일 세트부터', 0, { label: '되돌리기', fn: function () { self.undoTune(s, 'daily_min'); } }); self.refresh();
      }, function (e) { U.toast('바꾸지 못했어요: ' + e.message); });
    }, { 'data-act': 'forecast-more', title: '이 수업 전에 단원 숙제를 다 하려면' }));
    acts.appendChild(btn('괜찮음 (수업에서)', 'ghost sm', function () {
      self.call('teacher.settings', { student_id: s.student_id, dismiss: f.key }).then(function () { U.toast('이번 수업은 그대로 둘게요'); self.refresh(); });
    }, { 'data-act': 'forecast-ok', title: '남은 부분은 수업에서 다루기 — 이 수업에 대해서는 다시 안 물어봐요' }));
    var unitName = (f.unit_id || '').replace('KWD-', '') + ' ' + (f.title_ko || '');
    return el('li', { class: 'lv6', 'data-act': 'forecast' }, el('span', { class: 'mark', 'aria-hidden': 'true' }),
      el('div', { class: 'grow' }, el('b', {}, '다음 수업 ' + mdDow(f.date) + ' 전에 ' + unitName + ' 숙제 약 ' + Math.round(f.ratio * 100) + '%만 끝나요'),
        el('div', { class: 'tiny' }, '남은 숙제 약 ' + Math.round(f.left_min) + '분 · 수업 전 숙제 날 ' + f.days + '일 · 지금 하루 ' + s.daily_min + '분 (캘린더 기준)' + (f.need_min ? '' : ' — 하루 시간을 두 배 넘게 늘려야 해서, 남은 부분은 수업에서 다루는 게 나아요')), acts));
  };
  var WRITE_KO = { pad: '쓰기: 화면 손글씨', paper: '쓰기: 종이+사진', type: '쓰기: 타자' };
  /** 이번 주 · 오늘 (5) + 한 줄 메모 (4) */
  App.prototype.pulse = function (d) {
    var a = d.analytics, t = d.today, ratio = t ? t.ratio : 0, last7 = a.days.slice(-7);
    var NAME = { on_time: '제때', late: '늦게', partial: '덜 함', skipped: '안 함', rest: '쉼', today: '오늘', none: '세트 없음' };
    var week = el('div', { class: 'week', role: 'list', 'aria-label': '최근 7일' }, last7.map(function (x) {
      var dw = new Date(x.date + 'T12:00:00Z').getUTCDay();
      return el('span', { class: 'wd ' + x.status, role: 'listitem', title: x.date + ' · ' + (NAME[x.status] || x.status) }, el('b', {}, ['일', '월', '화', '수', '목', '금', '토'][dw]), el('i', {}, NAME[x.status] || ''));
    }));
    var w = a.weekly.filter(function (x) { return x.acc !== null; }), accs = w.map(function (x) { return x.acc; });
    var cur = accs.length ? accs[accs.length - 1] : null, prev = accs.length > 2 ? (accs[accs.length - 2] + accs[accs.length - 3]) / 2 : null, dl = cur !== null && prev !== null ? Math.round((cur - prev) * 100) : null;
    var r = d.recommend, notes = [];
    notes.push(el('span', {}, '정확도 ', el('b', {}, U.pct(cur)), dl !== null && dl !== 0 ? ' (' + (dl > 0 ? '▲' : '▼') + Math.abs(dl) + '%p)' : ''));
    if (r.speed !== null) notes.push(el('span', { title: '1 = 예상한 시간. 1보다 크면 오래 걸림' }, '속도 ×' + r.speed));
    notes.push(el('span', {}, '연속 ' + d.streak + '일'));
    notes.push(el('span', {}, '다음 알림 ' + (d.next_reminder.mode === 'off' ? '끔' : '현지 ' + d.next_reminder.local)));
    (this._notes || []).forEach(function (x) { notes.push(el('span', {}, x)); });
    if (d.device && WRITE_KO[d.device.mode]) notes.push(el('span', { 'data-act': 'device-note', title: '학생이 처음 열 때 고른 쓰기 방법 (마지막으로 고른 기기)' }, WRITE_KO[d.device.mode] + (d.device.mode !== 'type' && !d.device.touch ? ' (펜 없는 기기)' : '')));
    var wr = a.writing || {};
    if (wr.n >= 4 && wr.share >= 0.3) notes.push(el('span', { 'data-act': 'typed-note', title: '한국어 쓰기 칸을 손글씨 대신 타자로 한 비율 (최근 2주)' }, '쓰기 타자 ' + Math.round(wr.share * 100) + '%'));
    var todayLine = !t ? '오늘 세트 없음' : t.skipped_at ? (t.skip_reason === 'rest' ? '오늘은 쉬는 요일' : '오늘은 쉼 — 학생이 “바빠요”를 눌렀어요') : '오늘 ' + Math.round(ratio * 100) + '% 했음 · 오늘 숙제 약 ' + Math.round(t.est_min) + '분';
    return el('section', { class: 'sp-pulse', 'data-act': 'pulse' },
      el('div', { class: 'sp-pulse-top' }, week,
        el('div', { class: 'sp-today' }, el('div', { class: 'small' }, todayLine), el('div', { class: 'progress' }, el('i', { style: { width: Math.round(ratio * 100) + '%' } })))),
      el('div', { class: 'notes', 'data-act': 'notes' }, notes));
  };
  App.prototype.nextCard = function (d) {
    return el('section', { class: 'panel', 'data-act': 'next-lesson' }, el('h2', {}, '다음 수업에 할 것'), this.nextLesson(d));
  };
  App.prototype.nextLesson = function (d) {
    var nl = d.recommend.next_lesson, ul = el('ul', { class: 'nl' });
    nl.items.slice(0, 3).forEach(function (it) { ul.appendChild(el('li', {}, el('span', { lang: 'ko' }, it.label), el('span', { class: 'tiny' }, ' · 맞힘 ' + U.pct(it.acc) + ' (' + it.n + '번)'))); });
    var le = (d.leeches || []).filter(function (x) { return x.leech; });
    if (le.length) ul.appendChild(el('li', {}, el('b', {}, '계속 틀리는 단어: '), el('span', { lang: 'ko' }, le.map(function (x) { return x.display; }).join(', ')), el('span', { class: 'tiny' }, ' — 다른 방법으로 다시')));
    else if (nl.lapsed_words.length) ul.appendChild(el('li', {}, '자꾸 잊는 단어: ', el('span', { lang: 'ko' }, nl.lapsed_words.slice(0, 5).join(', '))));
    if (nl.top_tags.length) ul.appendChild(el('li', { class: 'tiny' }, '자주 나온 문제: ' + nl.top_tags.map(function (t) { return t.tag; }).join(', ')));
    if (!ul.childNodes.length) ul.appendChild(el('li', { class: 'small' }, '아직 모을 기록이 적어요.'));
    return ul;
  };
  /** 숙제 양 (5): 추천 하나 + 하루 시간·새 단어 */
  App.prototype.amountCard = function (d) {
    var self = this, s = d.student, r = d.recommend, box = el('section', { class: 'panel', 'data-act': 'amount' }, el('h2', {}, '숙제 양'),
      el('div', { class: 'tiny' }, '난이도: ' + (QUAD[r.quadrant] || r.quadrant) + ' (2주 정확도 ' + U.pct(r.acc) + ')'));
    (r.suggest || []).slice(0, 1).forEach(function (sg) { box.appendChild(self.suggestRow(s, sg)); });   // 한 번에 하나만
    box.appendChild(this.tunePanel(d));
    return box;
  };
  /** 수업 기록 (5): 숙제는 기록한 단원에서만 나옴 — 수업 끝나면 한 번 */
  function unameOf(u) { return u ? u.unit_id.replace('KWD-', '') + ' ' + u.title_ko : ''; }
  function unitSelect(units, sel, taught) {
    return el('select', { 'data-act': 'lesson-unit', 'aria-label': '단원' }, units.map(function (u) { return el('option', { value: u.unit_id, selected: sel === u.unit_id ? 'selected' : null }, unameOf(u) + (taught && taught[u.unit_id] ? ' ✓' : '')); }));
  }
  /** 수업 후 자동화가 확신하지 못한 기록 → '지금 할 일' 한 줄: [맞아요] [다른 단원] [수업 아님] */
  App.prototype.lessonAsk = function (d, q) {
    var self = this, s = d.student, units = d.units || [], u = units.filter(function (x) { return x.unit_id === q.unit_id; })[0];
    var day = U.fmtTime(q.at, s.tz).split(' ')[0], acts = el('div', { class: 'row wrapr', style: { gap: '6px' } });
    function send(body, msg) {
      self.call('teacher.lesson_confirm', Object.assign({ lesson_id: q.lesson_id }, body)).then(function (x) {
        U.toast(msg || ('기록했어요 — 내일 숙제부터 이 단원' + (x.review_cards ? ' (단어는 하루 ' + x.per_day + '개씩 복습 카드로)' : ''))); self.refresh();
      });
    }
    function pickOther() {
      acts.innerHTML = '';
      var taught = {}; d.analytics.progress.units.forEach(function (x) { taught[x.unit_id] = 1; });
      var lastI = -1; units.forEach(function (x, k) { if (taught[x.unit_id]) lastI = k; });
      var nx = units.filter(function (x, k) { return k > lastI && !taught[x.unit_id]; })[0] || units[Math.max(0, lastI)] || {};
      var sel = unitSelect(units, q.unit_id || nx.unit_id, taught);
      acts.appendChild(sel); acts.appendChild(btn('이 단원으로 기록', 'primary sm', function () { send({ unit_id: sel.value }); }, { 'data-act': 'ask-save' }));
    }
    if (u) {
      acts.appendChild(btn('맞아요', 'primary sm', function () { send({}); }, { 'data-act': 'ask-ok' }));
      acts.appendChild(btn('다른 단원', 'sm', pickOther, { 'data-act': 'ask-other' }));
      acts.appendChild(btn('수업 아님', 'ghost sm', function () { send({ no: true }, '기록하지 않았어요'); }, { 'data-act': 'ask-no' }));
    } else {
      acts.appendChild(btn('단원 고르기', 'primary sm', pickOther, { 'data-act': 'ask-other' }));
      acts.appendChild(btn('수업 아님', 'ghost sm', function () { send({ no: true }, '기록하지 않았어요'); }, { 'data-act': 'ask-no' }));
    }
    var text = u ? day + ' 수업: ' + unameOf(u) + ' 맞나요?' : day + ' 수업에서 단원을 못 찾았어요';
    var why = (u ? '수업 녹화에서 찾은 단원 · 확신 ' + Math.round(q.confidence * 100) + '%' : '수업 녹화') + (q.evidence ? ' · ' + q.evidence : '');
    return el('li', { class: 'lv6', 'data-act': 'lesson-ask', 'data-lesson': q.lesson_id }, el('span', { class: 'mark', 'aria-hidden': 'true' }),
      el('div', { class: 'grow' }, el('b', {}, text), el('div', { class: 'tiny' }, why), acts));
  };
  /** 수업 기록 (4): 보통은 수업 후 자동화가 녹화·화이트보드에서 알아서 기록. 여기는 마지막 기록 한 줄 + 직접 기록(숨김) */
  App.prototype.lessonCard = function (d) {
    var self = this, s = d.student, p = d.analytics.progress, units = d.units || [];
    var taught = {}; p.units.forEach(function (u) { taught[u.unit_id] = 1; });
    var lastL = p.lessons.length ? p.lessons[p.lessons.length - 1] : null, lastU = lastL ? units.filter(function (u) { return u.unit_id === lastL.unit_id; })[0] : null;
    var lastI = -1; units.forEach(function (u, k) { if (taught[u.unit_id]) lastI = k; });
    var next = units.filter(function (u, k) { return k > lastI && !taught[u.unit_id]; })[0];
    var box = el('div', { class: 'row wrapr hidden', 'data-act': 'lesson-manual', style: { gap: '10px', marginTop: '8px' } });
    var wt = el('input', { type: 'checkbox', checked: true, 'data-act': 'lesson-words' });
    var pick = unitSelect(units, next ? next.unit_id : (lastU || {}).unit_id, taught);
    box.appendChild(pick);
    box.appendChild(btn('기록', 'primary sm', function () {
      self.call('teacher.lesson', { student_id: s.student_id, unit_id: pick.value, words_taught: wt.checked }).then(function (x) {
        U.toast('기록했어요 — 내일 숙제부터 이 단원' + (x.review_cards ? ' (단어는 하루 ' + x.per_day + '개씩 복습 카드로)' : '')); self.refresh();
      });
    }, { 'data-act': 'lesson-save' }));
    box.appendChild(el('label', { class: 'small row', style: { gap: '6px' }, title: '수업에서 다룬 단어는 “새 단어” 소개 카드 없이 바로 복습 카드로 나와요' }, wt, '단어도 수업에서 다룸'));
    var src = lastL ? (lastL.source && lastL.source !== 'teacher' ? el('span', { class: 'chip k', title: '수업 녹화·화이트보드에서 자동으로 기록' }, '자동') : el('span', { class: 'chip' }, '직접')) : null;
    return el('section', { class: 'panel lesson', 'data-act': 'lesson' },
      el('div', { class: 'row wrapr', style: { gap: '8px' } }, el('h2', { class: 'grow', style: { margin: 0 } }, '수업 기록'),
        el('span', { class: 'small' }, lastU ? '마지막 ' + unameOf(lastU) + ' · ' + U.fmtTime(lastL.at, s.tz).split(' ')[0] : '아직 기록 없음'), src,
        el('span', { class: 'small', 'data-act': 'next-lesson-date', title: '수업 캘린더(Preply Schedule)에서 — 하루 한 번, 오늘 수업은 매시간 갱신' }, d.next_lesson ? '· 다음 수업 ' + mdDow(d.next_lesson.date) + (d.next_lesson.warn ? ' (확인 필요)' : '') + (d.next_lesson.unit_id && d.next_lesson.ratio < 0.8 ? ' (그때까지 ' + d.next_lesson.unit_id.replace('KWD-', '') + ' 숙제 약 ' + Math.round(d.next_lesson.ratio * 100) + '%)' : '') : '· 다음 수업: 캘린더에 없음'),
        el('button', { class: 'linkbtn', type: 'button', 'data-act': 'lesson-other', onclick: function (e) { box.classList.remove('hidden'); e.currentTarget.remove(); } }, '직접 기록')),
      el('p', { class: 'tiny', style: { margin: '4px 0 0' } }, '수업이 끝나면 녹화·화이트보드에서 자동으로 기록돼요. 확실하지 않을 때만 “지금 할 일”에서 물어봐요. 숙제는 기록된 단원에서만 나와요.'),
      box);
  };
  /** 자세히 (중요도 1–3) — 눌러야 보임 */
  App.prototype.details = function (d) {
    var self = this, a = d.analytics, n = d.notifications, st = d.student.settings;
    var weak = a.progress.units.filter(function (u) { return u.acc !== null && u.acc < 0.7; }).length;
    var secs = [
      ['pattern', '숙제 하는 모습', (a.window ? '보통 ' + hm(a.window.from) + '–' + hm(a.window.to) : ''), function (b) { self.secPattern(b, d); }],
      ['today', '오늘 숙제 목록', d.today ? d.today.tasks.length + '개 · ' + Math.round(d.today.ratio * 100) + '%' : '없음', function (b) { self.secToday(b, d); }],
      ['units', '단원별 정확도', weak ? '다시 볼 단원 ' + weak + '개' : '', function (b) { self.secUnits(b, d); }],
      ['srs', '단어 복습', a.srs.overdue ? '밀린 카드 ' + a.srs.overdue + '장' : '밀린 것 없음', function (b) { self.secSrs(b, d); }],
      ['trend', '정확도·속도 추이', null, function (b) { self.secTrend(b, d); }],
      ['notif', '알림 기록', n.open_rate !== null ? '열어 봄 ' + U.pct(n.open_rate) : '', function (b) { self.secNotif(b, d); }],
      ['set', '학생 유형 · 예외 · 알림 시간', setSummary(st), function (b) { self.secSettings(b, d); }],
      ['pay', '결제 정보', d.student.plan ? d.student.plan : '', function (b) { self.secPay(b, d); }]
    ];
    var acc = el('div', { class: 'acc', id: 'secs' });
    secs.forEach(function (x) {
      var open = !!self.openSec[x[0]], item = el('div', { class: 'acc-item' + (open ? ' open' : ''), 'data-sec': x[0] });
      var body = el('div', { class: 'acc-body' + (open ? '' : ' hidden') });
      item.appendChild(el('button', { class: 'acc-head', type: 'button', 'aria-expanded': String(open), onclick: function () {
        var o = !self.openSec[x[0]]; self.openSec[x[0]] = o; item.classList.toggle('open', o); body.classList.toggle('hidden', !o);
        if (o && !body.childNodes.length) x[3](body);
      } }, el('span', { class: 'ttl' }, el('span', { class: 'k2' }, x[1])), x[2] ? el('span', { class: 'tiny' }, x[2]) : null, el('span', { class: 'chev' }, '›')));
      item.appendChild(body);
      if (open) x[3](body);
      acc.appendChild(item);
    });
    return el('div', { class: 'more' }, el('h2', { class: 'more-h' }, '자세히'), acc);
  };
  function bw(b) { return Math.max(300, (b.clientWidth || Math.min(window.innerWidth, 1180) - 64) - 4); }
  /** 숙제 하는 모습: 언제(요일×시각) · 제때/늦게 · 난이도 그림 · 유형별 */
  App.prototype.secPattern = function (b, d) {
    var a = d.analytics, counts = { on_time: 0, late: 0, partial: 0, skipped: 0, rest: 0 };
    a.days.forEach(function (x) { if (counts[x.status] !== undefined) counts[x.status]++; });
    var wrap = el('div', { class: 'pat' });
    b.appendChild(wrap);
    var w1 = el('div', {}, el('h3', {}, '언제 하나 (현지 시각)'), Ch.heatDow({ width: 360, byDow: a.heat, fmt: function (v) { return v + '개 제출'; } }));
    var w2 = el('div', {}, el('h3', {}, '6주 동안'), Ch.donut({ size: 110, parts: [{ label: '제때', value: counts.on_time, color: 'var(--ok)' }, { label: '늦게', value: counts.late, color: 'var(--warn)' },
      { label: '덜 함', value: counts.partial, color: 'var(--seq2)' }, { label: '안 함', value: counts.skipped, color: 'var(--bad)' }, { label: '쉼', value: counts.rest, color: 'var(--line-2)' }],
      center: U.pct(counts.on_time / Math.max(1, counts.on_time + counts.late + counts.partial + counts.skipped)) }),
      el('h3', {}, '유형별 정확도 (6주)'),
      Ch.bars(a.skills.filter(function (x) { return x.acc !== null; }).map(function (x) {
        var arrow = x.trend === null ? '' : x.trend > 0.03 ? ' ↑' : x.trend < -0.03 ? ' ↓' : '';
        return { label: SKILL[x.skill] || x.skill, value: x.acc, note: U.pct(x.acc) + arrow, title: x.n + '번', color: x.acc < 0.7 ? 'var(--bad)' : 'var(--s1)' };
      })));
    var w3 = el('div', {}, el('h3', {}, '난이도 (주별: 정확도 × 속도)'), this.quadrant(a));
    wrap.appendChild(w1); wrap.appendChild(w2); wrap.appendChild(w3);
  };
  App.prototype.quadrant = function (a) {
    var pts = a.weekly.map(function (w) { return { x: w.speed === undefined ? null : w.speed, y: w.acc, label: weekLbl(w.week) + ' 주' }; });
    return Ch.quadrant({ width: 360, points: pts, xMin: 0.4, xMax: 2, yMin: 0.4, yMax: 1, xMid: 1, yMid: 0.8, xLabel: '속도 (오른쪽 = 느림)', yLabel: '정확도',
      quad: { tl: '쉬움', tr: '정확·느림', bl: '서두름', br: '어려움' } });
  };
  App.prototype.secToday = function (b, d) {
    if (!d.today) { b.appendChild(el('div', { class: 'small' }, '오늘 세트가 아직 없어요.')); return; }
    if (d.today.skipped_at) b.appendChild(el('div', { class: 'chip rest', style: { margin: '6px 0' }, 'data-act': 'today-rest' },
      d.today.skip_reason === 'rest' ? '오늘은 쉬는 요일 (예외 설정)' : '학생이 “오늘 너무 바빠요 😭”를 눌렀어요 · ' + U.fmtHM(d.today.skipped_at, d.student.tz)));
    b.appendChild(el('div', { class: 'tiny', style: { margin: '4px 0' } }, '이 학생 기준 약 ' + Math.round(d.today.est_min) + '분 · 하루 ' + d.student.daily_min + '분'));
    var groups = {};
    d.today.tasks.forEach(function (t) { (groups[t.group] = groups[t.group] || []).push(t); });
    Object.keys(GROUP_KO).forEach(function (g) {
      if (!groups[g]) return;
      b.appendChild(el('div', { class: 'group-label' }, GROUP_KO[g] + ' ' + groups[g].length));
      groups[g].forEach(function (t) {
        var chipC = { todo: 'todo', doing: 'doing', sent: 'sent', done: 'done' }[t.status];
        b.appendChild(el('div', { class: 'row', style: { padding: '6px 4px', borderBottom: '1px solid var(--line)' } }, el('span', { class: 'small', style: { width: '90px', flex: 'none' } }, TYPE_KO[typeKey(t)] || t.type),
          el('span', { class: 'grow', lang: 'ko' }, preview(t), t.repeat ? el('span', { class: 'tiny' }, ' · 다시') : null, t.part ? el('span', { class: 'tiny' }, ' (' + t.part.n + '/' + t.part.of + '일째)') : null),
          el('span', { class: 'chip ' + chipC }, { todo: '아직', doing: t.n_done + '/' + t.n_steps, sent: '확인 대기', done: '끝' }[t.status])));
      });
    });
  };
  App.prototype.secTrend = function (b, d) {
    var a = d.analytics, keys = ['speak', 'write_hand', 'answer_ko', 'recall'];
    var labels = a.weekly.map(function (w) { return weekLbl(w.week); });
    b.appendChild(el('h3', {}, '정확도 (주별, 유형별)'));
    b.appendChild(Ch.line({ width: bw(b), labels: labels, series: keys.map(function (k) { return { name: SKILL[k], values: a.weekly.map(function (w) { return w.acc_by[k] === undefined ? null : w.acc_by[k]; }) }; }),
      yMin: 0.4, yMax: 1, yTicks: [0.4, 0.55, 0.7, 0.85, 1], yFmt: function (v) { return Math.round(v * 100) + '%'; } }));
    b.appendChild(el('h3', {}, '속도 (주별, 1 = 예상한 시간)'));
    b.appendChild(Ch.line({ width: bw(b), labels: labels, series: [{ name: '속도', values: a.weekly.map(function (w) { return w.speed === undefined ? null : w.speed; }) }],
      yMin: 0.4, yMax: 2, yTicks: [0.5, 1, 1.5, 2], yFmt: function (v) { return '×' + Math.round(v * 100) / 100; }, height: 150 }));
    b.appendChild(el('h3', {}, '시작 시각 (현지, 날마다)'));
    b.appendChild(Ch.line({ width: bw(b), labels: a.days.map(function (x) { return x.date.slice(5).replace('-', '/'); }),
      series: [{ name: '시작 시각', values: a.days.map(function (x) { return x.start_hour === null ? null : x.start_hour < 5 ? x.start_hour + 24 : x.start_hour; }) }],
      yMin: 6, yMax: 27, yTicks: [6, 9, 12, 15, 18, 21, 24, 27], yFmt: function (v) { return hm(v); }, height: 160 }));
  };
  /** 단원별: 정확도 70% 아래 단원만 먼저 (수업에서 다시 볼 것), 나머지는 접어 둠 */
  App.prototype.secUnits = function (b, d) {
    var p = d.analytics.progress, s = d.student;
    var row = function (u) {
      return { label: u.unit_id.replace('KWD-', '') + ' ' + u.title_ko, value: u.acc === null ? 0 : u.acc, color: u.acc !== null && u.acc < 0.7 ? 'var(--bad)' : 'var(--s1)',
        note: u.acc === null ? '—' : U.pct(u.acc), title: '핵심 내용 받은 비율 ' + U.pct(u.ratio) + ' · 이 학생에게 약 ' + u.est_days + '일' };
    };
    var weak = p.units.filter(function (u) { return u.acc !== null && u.acc < 0.7; });
    b.appendChild(el('p', { class: 'small' }, '숙제에서 맞힌 비율을 단원별로 봐요. 70% 아래 단원은 수업에서 다시 짚으면 좋아요.'));
    if (weak.length) { b.appendChild(el('h3', {}, '수업에서 다시 볼 단원')); b.appendChild(Ch.bars(weak.map(row), { wide: true })); }
    else b.appendChild(el('div', { class: 'small' }, '70% 아래 단원 없음 ✓'));
    var gaps = []; for (var i = 1; i < p.lessons.length; i++) gaps.push((new Date(p.lessons[i].at) - new Date(p.lessons[i - 1].at)) / 864e5);
    var avgGap = gaps.length ? gaps.reduce(function (x, y) { return x + y; }, 0) / gaps.length : null;
    var avgEst = p.units.length ? p.units.reduce(function (x, u) { return x + (u.est_days || 0); }, 0) / p.units.length : null;
    if (avgGap && avgEst) b.appendChild(el('p', { class: 'small' }, '수업은 평균 ', el('b', {}, Math.round(avgGap * 10) / 10 + '일'), '마다, 숙제로 단원 하나 끝내는 데 약 ', el('b', {}, Math.round(avgEst * 10) / 10 + '일'),
      ' (하루 ' + s.daily_min + '분). ', avgGap < avgEst - 0.5 ? '수업이 숙제보다 빨라요 — 숙제가 단원을 다 못 따라가요.' : avgGap > avgEst + 1 ? '숙제가 남아요 — 복습·문장 다시로 채워져요.' : '속도가 맞아요.'));
    var all = el('details', { class: 'passage-box' }, el('summary', {}, '배운 단원 전체 (' + p.units.length + '개)'), Ch.bars(p.units.map(row), { wide: true }));
    b.appendChild(all);
  };
  /** 단어 복습: 날마다 (복습은 매일 하는 것). 밀린 카드 = 기한이 지났는데 아직 못 한 카드 */
  App.prototype.secSrs = function (b, d) {
    var r = d.analytics.srs;
    b.appendChild(el('p', { class: 'small' }, '단어 카드는 잊을 때쯤 다시 나와요(간격 반복). 하루 숙제의 약 4분의 1이 복습이에요.'));
    b.appendChild(el('div', { class: 'stats', style: { margin: '8px 0' } },
      el('div', { class: 'stat' }, el('b', {}, r.due_today), el('span', {}, '오늘 볼 카드')),
      el('div', { class: 'stat' }, el('b', { style: { color: r.overdue > 30 ? 'var(--bad)' : '' } }, r.overdue), el('span', {}, '밀린 카드 — 기한 지났는데 못 본 것. 많으면 새 단어가 자동으로 줄어요')),
      el('div', { class: 'stat' }, el('b', {}, U.pct(r.retention_14d)), el('span', {}, '바로 기억한 비율 (2주, 85–90%가 알맞음)')),
      el('div', { class: 'stat' }, el('b', {}, r.mature + ' / ' + r.total), el('span', {}, '오래 기억하는 단어 / 전체'))));
    if ((d.leeches || []).length) b.appendChild(el('div', { class: 'small' }, '자주 틀리는 단어: ', d.leeches.map(function (x) { return el('span', { class: 'chip ' + (x.leech ? 'bad' : 'k'), lang: 'ko', style: { margin: '2px' } }, x.display + ' ×' + x.lapses); })));
    var dl = r.daily || [];
    b.appendChild(el('h3', {}, '최근 14일 — 본 카드 수 · 바로 기억한 비율'));
    b.appendChild(Ch.line({ width: bw(b), labels: dl.map(function (x) { return x.date.slice(5).replace('-', '/'); }), series: [{ name: '바로 기억', values: dl.map(function (x) { return x.ok; }) }],
      yMin: 0.4, yMax: 1, yTicks: [0.4, 0.6, 0.8, 1], yFmt: function (v) { return Math.round(v * 100) + '%'; }, height: 140, extra: dl.map(function (x) { return x.n + '장'; }) }));
  };
  App.prototype.secNotif = function (b, d) {
    var self = this, n = d.notifications, s = d.student, nr = d.next_reminder;
    b.appendChild(el('div', { class: 'stats', style: { margin: '8px 0' } },
      el('div', { class: 'stat' }, el('b', {}, n.sent), el('span', {}, '보낸 알림 (최근 30)')), el('div', { class: 'stat' }, el('b', {}, U.pct(n.open_rate)), el('span', {}, '열어 봄')),
      el('div', { class: 'stat' }, el('b', {}, n.median_open_min === null ? '—' : n.median_open_min + '분'), el('span', {}, '열기까지 (중앙값)')),
      el('div', { class: 'stat' }, el('b', {}, n.started), el('span', {}, '알림 뒤 숙제 시작'))));
    b.appendChild(el('div', { class: 'small' }, '다음 자동 알림: ', el('b', {}, nr.mode === 'off' ? '끔' : '현지 ' + nr.local + ' (' + (nr.mode === 'usual' ? '평소 시작 15분 전' : '약속한 시간') + ') · ' + chName(nr.channel)), ' — 자동 알림 문장도 날마다 바뀌어요'));
    var t = el('table', { class: 'list-table', id: 'notifLog' }, el('thead', {}, el('tr', {}, ['보낸 때(현지)', '종류', '채널', '받음', '열어 봄', '숙제 시작'].map(function (h) { return el('th', {}, h); }))),
      el('tbody', {}, n.log.map(function (x) {
        return el('tr', { 'data-nid': x.notif_id, title: String(x.message || '').replace('\n', ' — ') }, el('td', {}, U.fmtTime(x.created_at, s.tz)), el('td', {}, { reminder: '자동', reminder_late: '자동(늦게)', teacher_nudge: '선생님' }[x.kind] || x.kind),
          el('td', {}, chName(x.channel)), el('td', {}, x.delivered_at ? U.fmtHM(x.delivered_at, s.tz) : x.status === 'failed' ? '실패' : x.status === 'queued' ? '보내는 중' : '—'),
          el('td', { 'data-col': 'opened' }, x.opened_at ? U.fmtHM(x.opened_at, s.tz) + ' (' + Math.round((new Date(x.opened_at) - new Date(x.created_at)) / 60000) + '분)' : el('span', { class: 'tiny' }, '아직')),
          el('td', {}, x.homework_started_at ? U.fmtHM(x.homework_started_at, s.tz) : '—'));
      })));
    b.appendChild(el('div', { style: { overflowX: 'auto' } }, t));
    b.appendChild(el('div', { class: 'actions' }, btn('알림 보내기', 'primary sm', function () { self.nudge(s); }, { 'data-act': 'nudge2' })));
  };
  function chName(c) { return { push: '앱 푸시', email: '이메일', manual: '직접(메신저)' }[c] || c; }
  /** 알림 보내기: 먼저 미리 보기 — 문장 후보(말투 표시) · 다른 문장 · 고쳐 쓰기 · 어디로 보낼지 */
  App.prototype.nudge = function (s) {
    var self = this;
    this.call('teacher.notify_preview', { student_id: s.student_id }).then(function (pv) {
      var i = 0, vs = pv.variants, ch = pv.channel;
      var title = el('input', { class: 'text', 'data-act': 'nf-title', 'aria-label': '알림 제목', value: vs[0].title });
      var body = el('textarea', { class: 'text', 'data-act': 'nf-body', 'aria-label': '알림 내용', rows: 3 }, vs[0].body);
      var tone = el('span', { class: 'chip k', 'data-act': 'nf-tone' }, '말투: ' + vs[0].tone);
      var count = el('span', { class: 'tiny' }, '1 / ' + vs.length);
      function show() { title.value = vs[i].title; body.value = vs[i].body; tone.textContent = '말투: ' + vs[i].tone; count.textContent = (i + 1) + ' / ' + vs.length; }
      var opts = [['push', '앱 푸시', pv.push], ['email', '이메일', pv.email], ['manual', '메신저로 직접', true]].filter(function (o) { return o[2]; });
      if (!opts.some(function (o) { return o[0] === ch; })) ch = opts[0][0];
      var seg = el('div', { class: 'seg', role: 'group', 'aria-label': '보낼 곳' }, opts.map(function (o) {
        return el('button', { type: 'button', class: ch === o[0] ? 'on' : '', 'data-ch': o[0], onclick: function () { ch = o[0]; seg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-ch') === ch); }); } }, o[1]);
      }));
      var sheet = el('div', { class: 'sheet bottom', role: 'dialog', 'aria-label': '알림 미리 보기', 'data-act': 'nf-sheet' }, el('div', { class: 'wrap' },
        el('h2', {}, s.name + '에게 알림'),
        el('div', { class: 'nf-phone' }, el('div', { class: 'tiny' }, '학생 폰에 이렇게 보여요'), title, body),
        el('div', { class: 'row wrapr', style: { gap: '8px', margin: '8px 0' } }, tone, count, el('span', { class: 'grow' }),
          btn('↻ 다른 문장', 'sm', function () { i = (i + 1) % vs.length; show(); }, { 'data-act': 'nf-next' })),
        el('div', { class: 'row wrapr', style: { gap: '8px', margin: '4px 0 12px' } }, el('span', { class: 'small' }, '보낼 곳'), seg),
        el('div', { class: 'actions' }, btn('보내기', 'primary', function () {
          sheet.remove();
          self.call('teacher.notify', { student_id: s.student_id, channel: ch, title: title.value.trim(), message: body.value.trim() }).then(function (r) { self.afterNudge(s, r); }, function (e) { U.toast('보내지 못했어요: ' + e.message); });
        }, { 'data-act': 'nf-send' }), btn('취소', 'ghost', function () { sheet.remove(); }, { 'data-act': 'nf-cancel' }))));
      sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.remove(); });
      document.body.appendChild(sheet);
    }, function (e) { U.toast('미리 보기를 못 만들었어요: ' + e.message); });
  };
  App.prototype.afterNudge = function (s, r) {
    var self = this;
    if (r.channel === 'manual') {
      var text = r.text.body + ' ' + r.url;
      var sheet = el('div', { class: 'sheet bottom', 'data-act': 'manual-sheet' }, el('div', { class: 'wrap' }, el('h2', {}, '메신저로 직접 보내기'), el('p', { class: 'small' }, 'WhatsApp·카카오톡으로 보내세요. 학생이 링크를 누르면 “열어 봄”이 기록돼요.'),
        el('textarea', { class: 'text', readonly: true, rows: 3 }, text),
        el('div', { class: 'actions' }, el('a', { class: 'btn primary sm', href: 'https://wa.me/?text=' + encodeURIComponent(text), target: '_blank', rel: 'noopener' }, 'WhatsApp 열기'),
          btn('복사 (카카오톡)', 'sm', function () { if (navigator.clipboard) navigator.clipboard.writeText(text); U.toast('복사했어요'); }), btn('닫기', 'ghost sm', function () { sheet.remove(); self.refresh(); }))));
      document.body.appendChild(sheet); return;
    }
    U.toast(chName(r.channel) + '으로 보냈어요' + (r.channel === 'push' ? ' — 받으면 알림 기록에 “받음”' : ''));
    setTimeout(function () { if (self.view === 'student') self.refresh(); }, 1600);
  };
  function setSummary(st) {
    var e = st.exceptions, out = [st.profile === 'custom' ? '기타' + (st.custom && st.custom.rules ? ': ' + (st.custom.rules.summary || '') : '') : (st.profiles.filter(function (p) { return p[0] === st.profile; })[0] || [0, '기본'])[1]];
    if (e.weekend_big) out.push('주말 몰기');
    if (e.rest_dows.length) out.push(e.rest_dows.map(function (x) { return DOW[x]; }).join('·') + ' 쉼');
    if (e.typing === false) out.push('손글씨만');
    return out.join(' · ');
  }
  /** 추천 제안 한 줄: 💡 제목 + 이유 · [적용] [✕] */
  App.prototype.suggestRow = function (s, sg) {
    var self = this;
    return el('div', { class: 'sugg', 'data-sugg': sg.id },
      el('span', { 'aria-hidden': 'true', class: 'ic' }, U.icon('bulb')),
      el('div', { class: 'grow' }, el('b', {}, sg.title), el('div', { class: 'why' }, sg.why)),
      btn('적용', 'primary xs', function () {
        var f = {}; f[sg.field] = sg.to;
        self.call('teacher.settings', { student_id: s.student_id, fields: f, source: 'suggest:' + sg.id }).then(function () {
          U.toast(sg.title + ' — 내일 세트부터', 0, { label: '되돌리기', fn: function () { self.undoTune(s, sg.field); } });
          self.refresh();
        }, function (e) { U.toast('바꾸지 못했어요: ' + e.message); });
      }, { 'data-act': 'apply-suggest' }),
      btn('✕', 'ghost xs', function () {
        self.call('teacher.settings', { student_id: s.student_id, dismiss: sg.id }).then(function () { U.toast('이 제안은 7일 동안 숨겨요'); self.refresh(); });
      }, { 'aria-label': '이 제안 숨기기', title: '괜찮아요 (7일 동안 숨김)', 'data-act': 'dismiss-suggest' }));
  };
  App.prototype.undoTune = function (s, field) {
    var self = this;
    return this.call('teacher.settings', { student_id: s.student_id, undo: field }).then(function () { U.toast('되돌렸어요'); self.refresh(); });
  };
  /** 숙제 양: 하루 시간 · 하루 새 단어 — −/+ 로 바로 (잠깐 멈추면 저장), 권장 범위·자동 값·최근에 바꾼 것 되돌리기 */
  App.prototype.tunePanel = function (d) {
    var self = this, s = d.student, st = s.settings, box = el('div', { class: 'tune', id: 'tune', 'data-act': 'tune' });
    function row(field, label, val, min, max, step, unit, okRange, hint) {
      var cur = val, timer = null, sp;
      // 숫자는 눌러서 바로 적을 수도 있음 (하루 2–3시간 학생: 120, 180 …)
      var out = el('input', { type: 'number', inputmode: 'numeric', min: min, max: max, step: step, value: val, 'data-out': field, 'aria-label': label + ' (' + unit + ')',
        onchange: function (e) { var v = Math.round(Number(e.target.value)); if (isNaN(v)) v = val; cur = Math.max(min, Math.min(max, v)); paint(); bump(0); },
        onkeydown: function (e) { if (e.key === 'Enter') e.target.blur(); } });
      var unitEl = el('span', { class: 'unit' }, unit);
      function paint() {
        out.value = cur;
        sp.classList.toggle('off', !!okRange && (cur < okRange[0] || cur > okRange[1]));
        minus.disabled = cur <= min; plus.disabled = cur >= max;
      }
      function bump(dv) {
        cur = Math.max(min, Math.min(max, cur + dv)); paint();
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (cur === val) return;
          var f = {}; f[field] = cur;
          self.call('teacher.settings', { student_id: s.student_id, fields: f }).then(function () {
            U.toast(label + ' ' + val + ' → ' + cur + unit + ' — 내일 세트부터', 0, { label: '되돌리기', fn: function () { self.undoTune(s, field); } });
            self.refresh();
          }, function (e) { U.toast('저장하지 못했어요: ' + e.message); cur = val; paint(); });
        }, 900);
      }
      var minus = el('button', { type: 'button', 'aria-label': label + ' 줄이기', 'data-step': field + '-', onclick: function () { bump(-step); } }, '−');
      var plus = el('button', { type: 'button', 'aria-label': label + ' 늘리기', 'data-step': field + '+', onclick: function () { bump(step); } }, '+');
      sp = el('span', { class: 'stepper', role: 'group', 'aria-label': label }, minus, el('label', { class: 'num' }, out, unitEl), plus);
      paint();
      var ch = st.changed[field];
      return el('div', { class: 'trow', 'data-tune': field }, el('span', { class: 'lbl' }, label), sp, el('span', { class: 'hint grow' }, hint),
        ch ? el('span', { class: 'hint', 'data-act': 'changed-' + field }, U.fmtTime(ch.at, null).split(' ')[0] + ' 바꿈 (' + (ch.prev === null ? '자동' : ch.prev) + ' → ' + (field === 'new_cap' && !st.new_cap_manual ? '자동' : val) + ') · ',
          el('button', { class: 'linkbtn', type: 'button', 'data-act': 'undo-' + field, onclick: function () { self.undoTune(s, field); } }, '되돌리기')) : null);
    }
    var rg = st.new_cap_range;
    box.appendChild(el('span', { class: 'hidden' }));
    box.appendChild(row('daily_min', '하루 시간', st.daily_min, 5, 600, 5, '분', null,
      el('span', {}, '한영·영한 번역 5개씩이면 30분 이상', s.speed_k && Math.abs(s.speed_k - 1) >= 0.1 ? el('span', {}, ' · 이 학생은 예상의 ', el('b', {}, '×' + s.speed_k)) : null)));
    box.appendChild(row('new_cap', '하루 새 단어', st.new_cap, 0, st.new_cap_max, 1, '개', rg,
      el('span', {}, '권장 ', el('b', {}, rg[0] + '–' + rg[1] + '개'), st.new_cap_manual ? el('span', {}, ' · ', el('button', { class: 'linkbtn', type: 'button', 'data-act': 'cap-auto', title: '하루 시간에 맞춰 자동 (' + st.new_cap_auto + '개)', onclick: function () {
        self.call('teacher.settings', { student_id: s.student_id, fields: { new_cap: null } }).then(function () { U.toast('새 단어: 자동(' + st.new_cap_auto + '개) — 하루 시간에 맞춰요', 0, { label: '되돌리기', fn: function () { self.undoTune(s, 'new_cap'); } }); self.refresh(); });
      } }, '자동(' + st.new_cap_auto + ')으로')) : ' · 자동')));
    box.appendChild(el('div', { class: 'hint' }, '둘 다 상한 없음. 수업에서 다룬 단어도 하루 이만큼씩 (바로 복습 카드로) 들어오고, 복습이 밀리면 새 단어는 자동으로 줄어요.'));
    return box;
  };
  /** 학생 유형 · 예외 · 알림 시간 — 고르는 것은 버튼으로 (드롭다운 없이) */
  App.prototype.secSettings = function (b, d) {
    var self = this, s = d.student, st = s.settings, e = st.exceptions;
    var f = { remind_mode: s.remind_mode, remind_time: s.remind_time, channel: s.channel, profile: st.profile };
    var ex = { weekend_big: e.weekend_big, rest_dows: e.rest_dows.slice(), note: e.note, custom_text: st.custom ? st.custom.text : '', typing: e.typing !== false };
    var touchedWb = false;
    function line(label) { return el('div', { class: 'srow' }, el('span', { class: 'slbl' }, label), el('div', { class: 'sval' }, Array.prototype.slice.call(arguments, 1))); }
    function chips(name, options, curv, onpick) {
      var box = el('div', { class: 'choice', role: 'radiogroup', 'aria-label': name }, options.map(function (o) {
        return el('button', { type: 'button', role: 'radio', 'aria-checked': String(curv === o[0]), class: curv === o[0] ? 'on' : '', 'data-v': o[0], onclick: function () {
          box.querySelectorAll('button').forEach(function (x) { var on = x.getAttribute('data-v') === o[0]; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
          onpick(o[0]);
        } }, o[1]);
      }));
      return box;
    }
    // 학생 유형 (기타 = 적으면 AI 가 맞춤)
    var pdesc = el('div', { class: 'tiny', 'data-act': 'profile-desc' }, PROFILE_DESC[f.profile] || '');
    var ctext = el('textarea', { class: 'text', rows: 2, 'data-set': 'custom_text', placeholder: '예: 회사 일로 평일엔 15분뿐, 말하기는 자신 있는데 맞춤법이 약함', oninput: function (ev) { ex.custom_text = ev.target.value; } }, ex.custom_text || '');
    var cr = st.custom && st.custom.rules;
    var cnote = el('div', { class: 'tiny', 'data-act': 'custom-rules' }, cr ? (cr.by === 'ai' ? 'AI가 정한 것: ' : '임시(낱말로 짐작, AI 확인 중): ') + (cr.summary || '') : '적고 저장하면 AI가 숙제 섞는 비율을 맞춰요');
    var cbox = el('div', { class: f.profile === 'custom' ? '' : 'hidden', 'data-act': 'custom-box' }, ctext, cnote);
    var pchips = chips('학생 유형', st.profiles.map(function (p) { return [p[0], p[0] === 'custom' ? '기타 (직접 적기)' : p[1]]; }), f.profile, function (v) {
      f.profile = v; pdesc.textContent = PROFILE_DESC[v] || ''; cbox.classList.toggle('hidden', v !== 'custom');
      if (v === 'busy' && !touchedWb) { ex.weekend_big = true; wb.checked = true; }
      if (v === 'custom') setTimeout(function () { ctext.focus(); }, 0);
    });
    pchips.setAttribute('data-set', 'profile');
    b.appendChild(line('학생 유형', pchips, pdesc, cbox));
    // 예외
    var wb = el('input', { type: 'checkbox', checked: ex.weekend_big ? true : null, 'data-set': 'weekend_big', onchange: function (ev) { ex.weekend_big = ev.target.checked; touchedWb = true; } });
    b.appendChild(line('예외', el('label', { class: 'row small', style: { gap: '6px' } }, wb, '읽기·쓰기는 주말에 몰아서 (평일은 짧은 문항·미션만)')));
    var dp = el('span', { class: 'dowpick', role: 'group', 'aria-label': '쉬는 요일' }, [1, 2, 3, 4, 5, 6, 0].map(function (k) {
      return el('button', { type: 'button', class: ex.rest_dows.indexOf(k) >= 0 ? 'on' : '', 'aria-pressed': String(ex.rest_dows.indexOf(k) >= 0), 'data-dow': String(k), onclick: function (ev) {
        var i = ex.rest_dows.indexOf(k); if (i >= 0) ex.rest_dows.splice(i, 1); else ex.rest_dows.push(k);
        ev.currentTarget.classList.toggle('on', i < 0); ev.currentTarget.setAttribute('aria-pressed', String(i < 0));
      } }, DOW[k]);
    }));
    b.appendChild(line('쉬는 요일', dp, el('div', { class: 'tiny' }, '그날은 숙제 없음 · 연속 기록 안 끊김')));
    var tchips = chips('한국어 쓰기', [['hand', '손글씨만'], ['both', '손글씨 + 타자도 허용']], ex.typing === false ? 'hand' : 'both', function (v) { ex.typing = v === 'both'; });
    tchips.setAttribute('data-set', 'typing');
    var wst = d.analytics.writing || {};
    b.appendChild(line('한국어 쓰기', tchips, el('div', { class: 'tiny' }, '손글씨가 기본. 펜·태블릿이 없는 학생은 “Type instead”로 칠 수 있어요' + (wst.n ? ' · 최근 2주 타자 ' + Math.round(wst.share * 100) + '% (' + wst.typed + '/' + wst.n + ')' : ''))));
    var note = el('textarea', { class: 'text', 'data-set': 'note', rows: 2, placeholder: '예: 시험 기간 11/3–11/14', oninput: function (ev) { ex.note = ev.target.value; } }, ex.note || '');
    b.appendChild(line('메모', note));
    // 알림 시간
    var time = el('input', { type: 'time', value: f.remind_time, 'data-set': 'remind_time', class: f.remind_mode === 'promised' ? '' : 'hidden', onchange: function (ev) { f.remind_time = ev.target.value; } });
    var mode = chips('자동 알림', [['promised', '정한 시간'], ['usual', '평소 하는 시간 15분 전'], ['off', '끔']], f.remind_mode, function (v) { f.remind_mode = v; time.classList.toggle('hidden', v !== 'promised'); });
    mode.setAttribute('data-set', 'remind_mode');
    b.appendChild(line('자동 알림', mode, time, el('div', { class: 'tiny' }, '학생 현지 시간 (' + s.tz + ')')));
    var chn = chips('알림 채널', [['push', '앱 푸시 (안 되면 이메일)'], ['email', '이메일']], f.channel, function (v) { f.channel = v; });
    chn.setAttribute('data-set', 'channel');
    b.appendChild(line('알림 채널', chn));
    b.appendChild(el('div', { class: 'actions' }, btn('저장', 'primary sm', function () {
      var ff = Object.assign({}, f, { exceptions: ex });
      self.call('teacher.settings', { student_id: s.student_id, fields: ff }).then(function (x) { U.toast('저장했어요 — ' + x.note); self.refresh(); });
    }, { 'data-act': 'save-settings' })));
  };
  /** 결제 정보 (중요도 1): 지금은 손으로 — 예약·결제 시스템을 붙이면 거기서 자동으로 */
  App.prototype.secPay = function (b, d) {
    var self = this, s = d.student, f = { plan: s.plan, price: s.price };
    b.appendChild(el('p', { class: 'tiny' }, '검토 대기 “요금 순” 정렬에만 써요. 예약·결제 시스템과 연결하면 자동으로 채워져서 적을 필요가 없어져요.'));
    var plan = el('input', { class: 'text', value: f.plan || '', 'data-set': 'plan', placeholder: '예: 주 2회 · 50분', style: { maxWidth: '240px' }, onchange: function (ev) { f.plan = ev.target.value; } });
    var price = el('input', { class: 'text', type: 'number', value: f.price || 0, 'data-set': 'price', style: { width: '110px' }, onchange: function (ev) { f.price = Number(ev.target.value); } });
    b.appendChild(el('div', { class: 'row wrapr', style: { gap: '8px' } }, el('span', { class: 'small' }, '요금제'), plan, el('span', { class: 'small' }, '월 $'), price,
      btn('저장', 'sm', function () { self.call('teacher.settings', { student_id: s.student_id, fields: f }).then(function () { U.toast('저장했어요'); self.refresh(); }); }, { 'data-act': 'save-pay' })));
  };

  /* ================= 검토 대기 ================= */
  App.prototype.renderQueue = function (main) {
    var self = this;
    return Promise.all([this.call('teacher.queue'), this.call('teacher.board')]).then(function (rs) {
      var d = rs[0], bd = rs[1]; self.tags = d.tags; self.qdata = d; self.setBadge(d.queue.length);
      main.innerHTML = '';
      main.appendChild(el('div', { class: 'row wrapr', style: { margin: '4px 0 8px' } }, el('h1', {}, '검토 대기 ', el('span', { class: 'en' }, d.queue.length + '개')), el('span', { class: 'grow' }),
        el('span', { class: 'small', id: 'policyLine' }, 'AI 초안 자동 공개: ' + bd.release.filter(function (r) { return KIND_KO[r.kind]; }).map(function (r) { return KIND_KO[r.kind] + ' ' + (r.auto ? '자동' : r.streak + '/' + r.need); }).join(' · '))));
      main.appendChild(el('div', { class: 'tiny', style: { marginBottom: '8px' } }, 'AI 가 먼저 다 봤어요: 받아쓰기·손글씨 읽기·초안 코멘트. 선생님은 확인하고 보내기만. 영어 뜻은 AI 가 확실하면 바로 공개(여기 안 옴).'));
      var mseg = el('div', { class: 'seg', role: 'group', 'aria-label': '묶기' }, [['student', '학생 중심'], ['type', '태스크 중심']].map(function (o) {
        return el('button', { type: 'button', class: self.qf.mode === o[0] ? 'on' : '', 'data-qmode': o[0], onclick: function () { self.qf.mode = o[0]; self.qOpenG = {}; draw(); mseg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-qmode') === o[0]); }); } }, o[1]);
      }));
      var ssel = el('select', { 'data-act': 'qsort', 'aria-label': '정렬', onchange: function (e) { self.qf.sort = e.target.value; draw(); } }, [['oldest', '오래 기다린 순'], ['price', '요금 높은 순'], ['type', '유형 순']].map(function (o) { return el('option', { value: o[0], selected: self.qf.sort === o[0] ? 'selected' : null }, o[1]); }));
      var tsel = el('select', { 'data-act': 'qtype', 'aria-label': '유형', onchange: function (e) { self.qf.type = e.target.value; draw(); } }, [['all', '모든 유형']].concat(Object.keys(GROUP_KO).map(function (k) { return [k, GROUP_KO[k]]; })).map(function (o) { return el('option', { value: o[0], selected: self.qf.type === o[0] ? 'selected' : null }, o[1]); }));
      var who = self.qf.student ? (bd.students.filter(function (x) { return x.student_id === self.qf.student; })[0] || {}).name : null;
      main.appendChild(el('div', { class: 'filters' }, mseg, ssel, tsel,
        who ? el('span', { class: 'chip k', 'data-act': 'qstudent' }, who + '만 ', el('button', { class: 'linkbtn', type: 'button', 'aria-label': '모든 학생 보기', onclick: function () { self.qf.student = null; self.render(); } }, '✕ 모두 보기')) : null));
      var out = el('div', { id: 'queueList' }); main.appendChild(out);
      function draw() { out.innerHTML = ''; out.appendChild(self.marksSection((d.marks || []).filter(function (m) { return !self.qf.student || m.student_id === self.qf.student; }))); out.appendChild(self.queueGroups(d.queue)); }
      draw();
      var op = self.qOpen && out.querySelector('[data-q="' + self.qOpen + '"]');
      if (op) setTimeout(function () { op.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); }, 30);
    });
  };
  App.prototype.queueGroups = function (queue) {
    var self = this, items = queue.filter(function (g) { return (self.qf.type === 'all' || g.group === self.qf.type) && (!self.qf.student || g.student_id === self.qf.student); });
    var sorters = { oldest: function (a, b) { return a.oldest < b.oldest ? -1 : 1; }, price: function (a, b) { return (b.price || 0) - (a.price || 0) || (a.oldest < b.oldest ? -1 : 1); },
      type: function (a, b) { return a.group < b.group ? -1 : a.group > b.group ? 1 : a.oldest < b.oldest ? -1 : 1; } };
    items.sort(sorters[this.qf.sort]);
    var key = this.qf.mode === 'student' ? function (g) { return g.student_id; } : function (g) { return g.group; };
    var order = [], by = {};
    items.forEach(function (g) { var k = key(g); if (!by[k]) { by[k] = []; order.push(k); } by[k].push(g); });
    var box = el('div', { class: 'acc' });
    if (!items.length) box.appendChild(el('div', { class: 'card' }, '모두 확인했어요'));
    order.forEach(function (k, gi) {
      var gs = by[k], open = self.qOpenG[k] !== undefined ? self.qOpenG[k] : gi === 0 || gs.some(function (g) { return g.key === self.qOpen; });
      var oldest = gs.reduce(function (m, g) { return g.oldest < m ? g.oldest : m; }, gs[0].oldest);
      var head = self.qf.mode === 'student'
        ? [U.flag(gs[0].country), el('b', {}, gs[0].student_name), el('span', { class: 'tiny' }, (gs[0].band || '') + (gs[0].plan ? ' · ' + gs[0].plan : '') + ' · ' + won(gs[0].price))]
        : [el('b', {}, GROUP_KO[k] || k)];
      var sec = el('section', { class: 'grp' + (open ? ' open' : ''), 'data-qgroup': k });
      sec.appendChild(el('button', { class: 'grp-head', type: 'button', 'aria-expanded': String(open), onclick: function () { self.qOpenG[k] = !open; var o = self.root.querySelector('#queueList'); o.replaceChild(self.queueGroups(self.qdata.queue), o.lastChild); } },
        el('span', { class: 'ttl row', style: { gap: '8px' } }, head), el('span', { class: 'chip sent' }, gs.length + '개'), el('span', { class: 'tiny' }, '가장 오래 ' + ago(oldest)), el('span', { class: 'chev' }, '›')));
      if (open) { var body = el('div', { class: 'grp-body' }); gs.forEach(function (g) { body.appendChild(self.queueItem(g)); }); sec.appendChild(body); }
      box.appendChild(sec);
    });
    return box;
  };
  App.prototype.queueItem = function (g) {
    var self = this, open = this.qOpen === g.key, it = el('div', { class: 'acc-item' + (open ? ' open' : ''), 'data-q': g.key, 'data-sid': g.student_id, 'data-type': g.type });
    var body = el('div', { class: 'acc-body' + (open ? '' : ' hidden') });
    var who = this.qf.mode === 'student' ? '' : g.student_name + ' · ';
    it.appendChild(el('button', { class: 'acc-head', type: 'button', onclick: function () {
      var was = self.qOpen === g.key; self.qOpen = was ? null : g.key;
      it.classList.toggle('open', !was); body.classList.toggle('hidden', was);
      if (!was && !body.childNodes.length) self.reviewCard(body, g);
    } }, el('span', { class: 'ttl' }, el('span', { class: 'k1' }, who + (TYPE_KO[g.type] || g.type) + ' · ' + ago(g.oldest) + ' 기다림' + (g.task.register ? ' · ' + g.task.register : '')),
      el('span', { class: 'k2', lang: 'ko' }, preview(g.task))), el('span', { class: 'chip sent' }, g.waiting + '개'), el('span', { class: 'chev' }, '›')));
    it.appendChild(body);
    if (open) this.reviewCard(body, g);
    return it;
  };
  /** 카드 하나: 녹음·손글씨·타자·AI 가 읽은 것·AI 초안을 한 곳에 → 확인·보내기 */
  App.prototype.reviewCard = function (body, g) {
    var self = this, t = g.task, ctx = el('div', { class: 'res wait', style: { marginTop: '8px' } });
    if (t.type === 'sp_ko_en') ctx.appendChild(el('div', {}, el('span', { lang: 'ko', class: 'ctx-ko' }, t.ko), el('div', { class: 'tiny' }, '모범 뜻: ' + (t.en_answers || []).join(' / '))));
    if (t.type === 'sp_en_ko') ctx.appendChild(el('div', {}, el('span', { class: 'ctx-ko' }, t.en), el('div', { class: 'tiny', lang: 'ko' }, '모범: ' + (t.ko_answers || []).join(' / '))));
    if (t.type === 'sp_qa') ctx.appendChild(el('div', {}, el('span', { lang: 'ko', class: 'ctx-ko' }, t.q_ko), el('div', { class: 'tiny', lang: 'ko' }, '예시 대답: ' + (t.model_a || ''))));
    if (t.type === 'reading') ctx.appendChild(el('div', {}, el('b', {}, String(t.title || '').replace(/\s*\(.*\)$/, '')), el('div', { class: 'tiny' }, (t.questions || []).map(function (q, i) { return 'Q' + (i + 1) + ' ' + q.q; }).join(' · '))));
    if (t.type === 'grammar' || t.type === 'write') ctx.appendChild(el('div', {}, t.instruction || t.prompt, el('div', { class: 'tiny', lang: 'ko' }, '모범: ' + (t.model || ''))));
    if (t.type === 'mission') ctx.appendChild(el('div', {}, el('b', {}, '목표 표현: '), el('span', { lang: 'ko' }, (t.targets || []).join(', ')), el('div', { class: 'tiny', lang: 'ko' }, (t.turns || []).join(' / '))));
    if (t.type === 'cards') ctx.appendChild(el('div', { class: 'small' }, '단어 녹음 — 받아쓰기가 단어와 달라서 들어 볼 것만 왔어요.'));
    body.appendChild(ctx);
    var waiting = g.steps.filter(function (x) { return x.sub && WAIT[x.sub.grade_status]; });
    var shown = t.type === 'cards' ? waiting : g.steps;
    var edits = {};
    shown.forEach(function (st) { body.appendChild(self.stepView(g, st, edits)); });
    // AI 초안 (카드 단위)
    var drafts = [], kinds = {};
    waiting.forEach(function (st) {
      kinds[st.kind] = 1;
      var a = st.sub.auto || {};
      if (a.comment_en) drafts.push(a.comment_en);
      (a.issues || []).forEach(function (is) { if (is.note_en) drafts.push(is.note_en); });
      if (a.mission_report) drafts.push('Mission: used ' + (a.mission_report.used || []).join(', ') + '; try next time: ' + (a.mission_report.not_tried || []).join(', ') + '.');
    });
    var uniq = drafts.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 3).join(' ');
    var panel = el('div', { class: 'approve', 'data-act': 'approve-panel' });
    panel.appendChild(el('div', { class: 'row' }, el('b', {}, 'AI 초안 → 확인·보내기'), el('span', { class: 'grow' }), el('span', { class: 'tiny' }, waiting.length + '개 단계를 한 번에')));
    var hasRec = kinds.record || kinds.card, score = hasRec ? 4 : null;
    if (hasRec) {
      var sc = el('div', { class: 'score5', role: 'group', 'aria-label': '점수' });
      [1, 2, 3, 4, 5].forEach(function (n) { sc.appendChild(el('button', { type: 'button', 'data-score': String(n), class: n === 4 ? 'on' : '', onclick: function () { score = n; sc.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', Number(x.getAttribute('data-score')) === n); }); } }, String(n))); });
      panel.appendChild(el('div', { class: 'row wrapr', style: { margin: '6px 0', gap: '10px' } }, el('span', { class: 'small' }, '발음·억양 (AI 제안 4)'), sc));
    }
    var chosen = [], tagKind = kinds.record || kinds.card ? 'record' : kinds.hand || kinds.ko_answer ? 'hand' : 'text';
    panel.appendChild(this.tagPicker(tagKind, chosen));
    var com = el('textarea', { class: 'text', 'data-act': 'draft', 'aria-label': '학생에게 보낼 코멘트', placeholder: '학생에게 보낼 한 줄' });
    com.value = uniq;
    panel.appendChild(el('div', { style: { marginTop: '8px' } }, com));
    // 음성 답장: 녹음 또는 파일 · Dongjae AI 음성(준비 중)
    var voice = null, vbox = el('div', { class: 'row wrapr', style: { gap: '8px', marginTop: '8px' } });
    var vw = U.recWidget({ label: '음성 답장 녹음', max: 60, onReady: function (r) { voice = r; } });
    var file = el('input', { type: 'file', accept: 'audio/*', class: 'hidden', 'data-act': 'voice-file', onchange: function () { var f = file.files && file.files[0]; if (f) { voice = { blob: f, mime: f.type || 'audio/mp4' }; fileName.textContent = f.name; } } });
    var fileName = el('span', { class: 'tiny' });
    vbox.appendChild(vw.node);
    vbox.appendChild(btn('파일 올리기', 'ghost xs', function () { file.click(); }, { 'data-act': 'voice-upload' }));
    vbox.appendChild(fileName); vbox.appendChild(file);
    vbox.appendChild(btn('Dongjae AI 음성 (준비 중)', 'ghost xs', null, { disabled: true, title: '나중에: 모범 답을 선생님 목소리(복제 음성)로 만들어 붙임. 데이터 칸 feedback.tts 준비됨', 'data-act': 'tts' }));
    panel.appendChild(vbox);
    var send = btn('확인·보내기', 'primary sm', function () {
      send.disabled = true;
      var aud = voice ? U.blobToB64(voice.blob).then(function (b64) { return { b64: b64, mime: voice.mime }; }) : Promise.resolve(null);
      aud.then(function (au) {
        return self.call('teacher.approve_card', { dayset_id: g.dayset_id, task_id: g.task_id, score: score, tags: chosen.slice(), comment: com.value, edits: edits, audio: au });
      }).then(function (r) { self.tags = r.tags; U.toast('보냈어요 (' + r.done + '개 단계)'); self.qOpen = null; setTimeout(function () { self.render(); }, 120); }, function (e) { send.disabled = false; U.toast(e.message); });
    }, { 'data-act': 'approve-card' });
    panel.appendChild(el('div', { class: 'actions' }, send, el('span', { class: 'tiny' }, '고친 문장은 위 단계 칸에서 바꾸면 같이 보내져요.')));
    body.appendChild(panel);
  };
  App.prototype.stepView = function (g, st, edits) {
    var self = this, s = st.sub, box = el('div', { class: 'rstep' + (s && WAIT[s.grade_status] ? ' wait' : ''), 'data-rstep': st.step_id, 'data-kind': st.kind });
    var label = st.label_ko || KIND_KO[st.kind] || st.kind;
    if (st.kind === 'card') { var c = (g.task.cards || []).filter(function (x) { return 'c:' + x.item_id === st.step_id; })[0]; label = '단어 녹음 · ' + (c ? c.display : ''); }
    box.appendChild(el('div', { class: 'row' }, el('b', {}, label), el('span', { class: 'grow' }), s ? el('span', { class: 'tiny' }, U.fmtTime(s.submitted_at) + ' · ' + Math.round((s.time_ms || 0) / 1000) + '초') : el('span', { class: 'chip todo' }, '아직 안 함')));
    if (!s) return box;
    var a = s.auto || {}, aud = st.kind === 'card' ? (a.audio || {}) : a;
    if (st.kind === 'ko_answer') {
      var q = (g.task.questions || [])[st.q] || {};
      box.appendChild(el('div', { class: 'small', lang: 'ko' }, 'Q. ' + q.q, q.type === 'content' ? el('span', { class: 'chip k', style: { marginLeft: '6px' } }, '내용') : el('span', { class: 'chip k', style: { marginLeft: '6px' } }, '내 생각')));
      if (s.answer.en) box.appendChild(el('div', { class: 'small' }, '영어 한 줄: ', el('b', {}, s.answer.en), a.en_check ? el('span', { class: 'tiny' }, ' · AI: ' + a.en_check) : null));
    }
    var media = el('div', { class: 'row wrapr', style: { gap: '10px', marginTop: '6px' } });
    if (st.kind === 'record' || st.kind === 'card') media.appendChild(this.audioSlot(s.media_file_id, s.media_purged));
    if ((st.kind === 'hand' || st.kind === 'ko_answer') && s.answer && s.answer.typed) media.appendChild(el('div', { class: 'typed-ans', 'data-act': 'typed-answer' }, el('span', { class: 'chip k' }, '타자로 씀'), ' ', el('b', { lang: 'ko' }, s.answer.typed)));
    else if (st.kind === 'hand' || st.kind === 'ko_answer') media.appendChild(this.imageSlot(s.media_file_id));
    if (st.kind === 'ko_answer' && s.media2_file_id) media.appendChild(this.audioSlot(s.media2_file_id));
    if (media.childNodes.length) box.appendChild(media);
    if (st.kind === 'type_en') box.appendChild(el('div', { class: 'small' }, '학생: ', el('b', {}, s.answer.text || '')));
    if (st.kind === 'choice') box.appendChild(el('div', { class: 'small' }, a.status === 'correct' ? '✓ 맞음' : '✗ 틀림 (' + (a.correct || '') + ')'));
    if (st.kind === 'read') box.appendChild(el('div', { class: 'small' }, '뜻을 본 낱말: ', (s.answer.looked_up || []).join(', ') || '없음', s.answer.marked ? ' · 모르겠어요 ' + s.answer.marked + '개' : ''));
    if (aud.transcript) box.appendChild(el('div', { class: 'small', style: { marginTop: '6px' } }, 'AI 받아쓰기: ', aud.target ? U.diffNode(aud.transcript, aud.target) : el('span', { lang: 'ko' }, aud.transcript), aud.similarity !== undefined && aud.similarity !== null ? el('span', { class: 'tiny' }, '  일치 ' + U.pct(aud.similarity)) : null));
    if (a.ocr_text) box.appendChild(el('div', { class: 'small', style: { marginTop: '4px' } }, a.typed ? '맞춤 비교: ' : 'AI 가 읽은 글씨: ', U.diffNode(a.ocr_text, a.corrected || a.target || a.ocr_text), a.confidence !== undefined ? el('span', { class: 'tiny' }, '  확신 ' + U.pct(a.confidence)) : null));
    if (a.mission_report) box.appendChild(el('div', { class: 'small' }, '미션: ✓ ' + (a.mission_report.used || []).join(', ') + ' · △ ' + (a.mission_report.tried || []).join(', ') + ' · ○ ' + (a.mission_report.not_tried || []).join(', ') + ((a.mission_report.other || []).length ? ' · 기타 ' + a.mission_report.other.join(', ') : '')));
    if (s.grade_status === 'ai_held' && (st.kind === 'hand' || st.kind === 'ko_answer' || st.kind === 'type_en')) {
      var inp = U.textInput({ value: a.corrected || a.ocr_text || '', lang: st.kind === 'type_en' ? 'en' : 'ko', placeholder: '고친 문장', onChange: function (v) { edits[s.submission_id] = { corrected: v }; } });
      box.appendChild(el('div', { class: 'kv', style: { margin: '6px 0 0' } }, el('dt', {}, 'AI 점수'), el('dd', {}, U.pct(a.score) + ((a.issues || []).length ? ' · ' + a.issues.map(function (x) { return x.type + (x.original ? ' (' + x.original + '→' + x.fix + ')' : ''); }).join(', ') : '')),
        el('dt', {}, '고친 문장'), el('dd', {}, inp)));
    }
    if (!WAIT[s.grade_status]) box.appendChild(el('div', { class: 'tiny' }, { auto_checked: '자동 확인됨', ai_approved: '승인함', teacher_reviewed: '검토함' }[s.grade_status] || s.grade_status));
    void self;
    return box;
  };
  App.prototype.audioSlot = function (fid, purged) {
    var au = el('div', { class: 'recbox' }, el('span', { class: 'tiny' }, '녹음…'));
    if (purged || !fid) { au.textContent = purged ? '(90일 지나 지움)' : ''; return au; }
    this.media(fid).then(function (m) { au.innerHTML = ''; au.appendChild(el('audio', { controls: true, src: U.b64Url(m) })); if (m.b64.length < 200) au.appendChild(el('span', { class: 'tiny' }, '(체험용 빈 녹음)')); }, function () { au.textContent = '녹음을 못 불러왔어요'; });
    return au;
  };
  App.prototype.imageSlot = function (fid) {
    var im = el('div', {}, el('span', { class: 'tiny' }, '손글씨…'));
    this.media(fid).then(function (m) { im.innerHTML = ''; im.appendChild(el('img', { class: 'pad-img', src: U.b64Url(m), alt: '학생 손글씨', style: { maxHeight: '160px' } })); if (m.b64.length < 200) im.appendChild(el('div', { class: 'tiny' }, '(체험용 빈 그림)')); }, function () { im.textContent = '그림을 못 불러왔어요'; });
    return im;
  };
  /** 질문 요청 ('모르겠어요'): AI 진단 초안 → 고쳐서 카드 만들기 / 넘기기 */
  App.prototype.marksSection = function (marks) {
    var self = this, open = this.marksOpen && marks.length > 0;
    var sec = el('section', { class: 'grp' + (open ? ' open' : ''), 'data-qgroup': 'marks', style: { marginBottom: '10px' } });
    sec.appendChild(el('button', { class: 'grp-head', type: 'button', 'aria-expanded': String(open), onclick: function () { self.marksOpen = !open; var o = self.root.querySelector('#queueList'); o.replaceChild(self.marksSection(marks), o.firstChild); } },
      el('span', { class: 'typeicon', 'aria-hidden': 'true' }, U.icon('help')), el('span', { class: 'ttl' }, el('b', {}, '질문 요청'), ' ', el('span', { class: 'small' }, '학생이 "모르겠어요"로 표시한 곳')),
      el('span', { class: 'chip ' + (marks.length ? 'sent' : 'k') }, marks.length + '개'), el('span', { class: 'chev' }, '›')));
    if (!open) return sec;
    var body = el('div', { class: 'grp-body' });
    marks.slice().sort(function (a, b) { return self.qf.sort === 'price' ? (b.price || 0) - (a.price || 0) : a.created_at < b.created_at ? -1 : 1; }).forEach(function (m) {
      var ai = m.ai || {}, card = ai.card || {};
      var ctx = String(m.context || ''), k = ctx.indexOf(m.text);
      var ctxNode = k >= 0 ? el('span', { lang: 'ko' }, ctx.slice(0, k), el('mark', {}, m.text), ctx.slice(k + m.text.length)) : el('span', { lang: 'ko' }, ctx);
      var f = { ko: el('input', { class: 'text', value: card.ko || m.text, 'data-f': 'ko' }), en: el('input', { class: 'text', value: card.en || '', 'data-f': 'en' }),
        note: el('input', { class: 'text', value: card.note || '', 'data-f': 'note' }), example: el('input', { class: 'text', value: card.example || m.context || '', 'data-f': 'example' }),
        explain: el('textarea', { class: 'text', 'data-f': 'explain' }) };
      f.explain.value = ai.explain_en || '';
      var form = el('div', { class: 'kv hidden', 'data-act': 'mark-form', style: { marginTop: '6px' } }, el('dt', {}, '설명'), el('dd', {}, f.explain), el('dt', {}, '카드 앞(뜻)'), el('dd', {}, f.en), el('dt', {}, '카드 뒤'), el('dd', {}, f.ko), el('dt', {}, '메모'), el('dd', {}, f.note), el('dt', {}, '예문'), el('dd', {}, f.example));
      var item = el('div', { class: 'card mark-item', 'data-mark': m.mark_id, style: { marginTop: '8px' } },
        el('div', { class: 'row wrapr' }, U.flag(m.country), el('b', {}, m.student_name), el('span', { class: 'chip k' }, MARK_KO[m.kind] || m.kind || '종류 없음'), el('span', { class: 'tiny' }, ago(m.created_at) + ' 전 · ' + (m.where || '')),
          el('span', { class: 'grow' }), el('span', { class: 'ctx-ko' }, '“', ctxNode, '”')),
        m.status === 'ai_drafted' ? el('div', { class: 'ai' }, el('span', { class: 'tiny' }, 'AI 진단 · '), ai.explain_en || '') : el('div', { class: 'tiny' }, 'AI 진단 기다리는 중 — 직접 써도 돼요'),
        card.ko ? el('div', { class: 'sug' }, '제안 카드: ', el('b', {}, card.en || '…'), ' → ', el('b', { lang: 'ko' }, card.ko), card.note ? el('span', { class: 'tiny' }, ' · ' + card.note) : null) : null,
        form,
        el('div', { class: 'actions' }, btn('카드 만들기 · 보내기', 'primary sm', function () {
          self.call('teacher.mark', { mark_id: m.mark_id, decision: 'approve', card: { ko: f.ko.value, en: f.en.value, note: f.note.value, example: f.example.value, explain: f.explain.value }, reply: f.explain.value })
            .then(function () { U.toast('학생 카드 묶음에 넣었어요 (다음 복습에 나와요)'); self.render(); });
        }, { 'data-act': 'mark-approve' }), btn('고치기', 'sm', function () { form.classList.toggle('hidden'); }, { 'data-act': 'mark-edit' }), btn('수업에서 설명 (넘기기)', 'ghost sm', function () { self.call('teacher.mark', { mark_id: m.mark_id, decision: 'dismiss' }).then(function () { self.render(); }); }, { 'data-act': 'mark-dismiss' })));
      body.appendChild(item);
    });
    sec.appendChild(body);
    return sec;
  };
  /** 태그: 기본 + 내가 만든 태그(점선) + 기타 → 새 태그 → 저장되어 다음에 다시 나옴 */
  App.prototype.tagPicker = function (kind, chosen) {
    var self = this, list = (this.tags && this.tags[kind]) || [], wrap = el('div', { style: { marginTop: '6px' } }), row = el('div', { class: 'tags', 'data-tags': kind });
    var BUILT = { record: ['받침', '연음', '억양', '속도·끊어 읽기', '된소리·거센소리', '모음 ㅓ/ㅗ', '끝 올림·내림', '자신감', '말투(해요/합니다)', '기타'], text: ['뜻 틀림', '빠뜨림', '시제', '어휘', '영어 철자', '기타'], hand: ['조사', '어미', '맞춤법', '받침', '띄어쓰기', '어순', '글자 모양', '기타'] }[kind] || [];
    function chip(t, mine) {
      var c = el('button', { type: 'button', class: 'tagc' + (mine ? ' mine' : '') + (chosen.indexOf(t) >= 0 ? ' on' : ''), 'data-tag': t, 'aria-pressed': String(chosen.indexOf(t) >= 0), onclick: function () {
        if (t === '기타') { other.classList.toggle('hidden'); if (!other.classList.contains('hidden')) inp.focus(); return; }
        var i = chosen.indexOf(t); if (i >= 0) chosen.splice(i, 1); else chosen.push(t);
        c.classList.toggle('on', i < 0); c.setAttribute('aria-pressed', String(i < 0));
      } }, t);
      return c;
    }
    list.forEach(function (t) { row.appendChild(chip(t, BUILT.indexOf(t) < 0)); });
    chosen.forEach(function (t) { if (list.indexOf(t) < 0) row.insertBefore(chip(t, true), row.lastChild); });
    var inp = U.textInput({ placeholder: '새 태그 (예: 이중모음 ㅢ)', lang: 'ko', onEnter: function () { add(); } });
    function add() { var v = inp.value.trim(); if (!v) return; if (chosen.indexOf(v) < 0) chosen.push(v); if (list.indexOf(v) < 0) list.splice(Math.max(0, list.length - 1), 0, v); wrap.replaceWith(self.tagPicker(kind, chosen)); }
    var other = el('div', { class: 'row hidden', style: { marginTop: '6px' } }, inp, btn('추가', 'sm', add, { 'data-act': 'tag-add' }));
    wrap.appendChild(row); wrap.appendChild(other);
    return wrap;
  };
  App.prototype.media = function (fid) { if (!this.mediaCache[fid]) this.mediaCache[fid] = this.call('media.get', { file_id: fid }); return this.mediaCache[fid]; };

  /* ================= 기준: 레벨 × 어려운 점 × 과제 ================= */
  App.prototype.renderCriteria = function (main) {
    var C = window.KWD_CRITERIA;
    main.innerHTML = '';
    main.appendChild(el('h1', {}, '과제 설계 기준 ', el('span', { class: 'en' }, '레벨 × 어려운 점 × 과제')));
    main.appendChild(el('div', { class: 'tiny', style: { marginBottom: '8px' } }, '생성기가 이 표대로 섞어요 (목적별 비중 + 레벨별 형식). 근거: design.md 4절.'));
    main.appendChild(el('div', { style: { overflowX: 'auto' } }, el('table', { class: 'list-table crit', id: 'critTable' },
      el('thead', {}, el('tr', {}, ['레벨', '한국어에서 어려운 점', '단어', '문장', '읽기', '말하기'].map(function (h) { return el('th', {}, h); }))),
      el('tbody', {}, C.levels.map(function (r) { return el('tr', {}, el('th', {}, r.level), el('td', {}, r.hard), el('td', {}, r.words), el('td', {}, r.sentence), el('td', {}, r.reading), el('td', {}, r.speaking)); })))));
    main.appendChild(el('div', { class: 'split', style: { marginTop: '14px' } },
      el('div', { class: 'card' }, el('h3', { style: { marginTop: 0 } }, '목적별 비중'), el('div', { class: 'small' }, C.purpose.map(function (p) { return el('div', { style: { margin: '4px 0' } }, el('b', {}, p[0]), ' — ' + p[1]); }))),
      el('div', { class: 'card' }, el('h3', { style: { marginTop: 0 } }, '지키는 규칙 (연구 보고서)'), el('div', { class: 'small' }, C.rules.map(function (x) { return el('div', { style: { margin: '4px 0' } }, el('b', {}, x[0]), ' ', el('span', { class: 'chip k' }, x[2]), ' — ' + x[1]); })))));
    return Promise.resolve();
  };

  window.TeacherApp = {
    mount: function (root, opts) {
      var a = new App(root, opts);
      window.addEventListener('hw-demo-graded', function () { if (root.isConnected && a.view === 'board') a.render(); });
      a.render();
      return a;
    }
  };
})();
