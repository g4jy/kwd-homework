/* student-v2.js — T108c 학생 화면 v2 (website 시안 T108b: 목록 · 문항 · 진척 + 빈·로딩·오류)
 * student.js 의 App 위에 화면만 다시 그린다. 서버 호출·단계 처리(stepInput·submitStep·reloadDay)는 그대로 씀.
 * 켜는 곳: student2.html(미리보기 주소) · demo.html?v=2. student.html(지금 학생 화면)은 이 파일을 읽지 않는다.
 * 글자는 설정 언어 하나(S 사전 = T108b build_proto.py). 학습 내용(한국어)은 언제나 한국어.
 */
(function () {
  'use strict';
  var SA = window.StudentApp;
  if (!SA || !SA.App) return;
  if (!(window.HW_V2 === true || /[?&]v=2(&|$)/.test(location.search))) return;
  var U = window.UI, el = U.el, App = SA.App, H = SA._h, finished = H.finished;

  var S = {
    en: { today: 'Today', go: 'Continue', next: 'Next', done: 'Done', show: 'Show answer', again: 'Again', got: 'Got it', first: 'Guess first, then check',
      ctx: 'In a sentence', prog: 'Progress', streak: 'days in a row', known: 'words known', week: 'this week', weeks: '6 weeks', qs: 'Questions to Dongjae', ls: 'Lessons',
      empty: 'No homework today', err: 'Could not load', badKey: 'This link is not valid', retry: 'Try again', back: 'Back', close: 'Close', say: 'Say it', stop: 'Stop',
      menu: 'Menu', busy: 'Too busy today?', rest: 'Resting today', restPlanned: 'Rest day', unskip: 'Study anyway', restOk: 'Rest today', keep: 'Keep going',
      restQ: 'Take a rest day? Your streak stays.', wait: 'Dongjae is preparing today’s homework', waitShort: 'More homework is coming', finishOld: 'Finish an earlier set',
      writing: 'Writing Korean', typeCards: 'Type answers on word cards', on: 'On', off: 'Off', lang: 'Language', remind: 'Reminders',
      howWrite: 'How will you write Korean?', pad: 'On the screen', paper: 'On paper + photo', typing: 'Typing', explained: 'Dongjae explained', comments: 'comments from Dongjae', notDone: 'not finished',
      part: 'Part', sent: 'Sent. Dongjae will check.', cardsDone: 'cards done', phrase: 'A phrase — include the particle', camHint: 'Hold your paper flat and fill the frame.', you: 'You typed', yours: 'Your answer', noMic: 'No microphone', allDone: 'All done for today', noneYet: 'Nothing yet',
      typeHere: 'In Korean', check: 'Check', model: 'Model answer', text: 'Text', cardsN: 'cards', newW: 'New words', revW: 'Review',
      skip: 'Skip this question', skipped: 'Skipped', skippedNote: 'You skipped this one. You can do it now.', previewNote: 'Preview — not saved',
      skipWord: 'Skip this word', skipAll: 'Skip the whole word test', skipAllQ: 'Skip the whole word test?', skipAllNote: '{n} words are left. You can come back any time from the list: “Skipped · Redo”.',
      skipAllOk: 'Skip all', redo: 'Redo', skippedRedo: 'Skipped · Redo', settings: 'Settings', ansEn: 'Answering in English', langQ: 'How much Korean on the screen?',
      langNote: 'Words and sentences you study are always in Korean.', ansNote: 'Used for “Translate to English” and question meanings. You can change it on each question too.',
      typeNote: 'Type the Korean word before you see the answer.', cnMore: 'Teacher’s note · more examples', tNote: 'Teacher’s note', tAlso: 'Surprising uses', tCommon: 'Common phrases', tCasual: 'Casual Korean', tEx: 'More examples', roman: 'Show romanization (ikda)', romanNote: 'Turn it off once Hangul feels easy.', recOk: 'Recorded — tap Show answer when ready',
      introT: 'Before you start', introOnce: 'You will see this only once.', start: 'Start', guardian: 'A parent or guardian has read this and agrees.',
      intro: ['Homework comes once a day, about {m} minutes. Do the items in any order.', 'You will speak (record your voice) and write Korean by hand, on screen or on paper with a photo.', 'Don’t understand something? Tap it and send it to Dongjae.', 'Only Dongjae sees your work. An AI drafts the checking and Dongjae approves it before you see it.', 'Recordings and handwriting photos are deleted after 90 days. Your scores stay.'],
      g: { preview: 'Before class', words: 'Words', ko_en: 'Translate to English', en_ko: 'Translate to Korean', qa: 'Speaking', sentence: 'Sentences', reading: 'Reading', listen: 'Listening', feedback: 'From last class', check: 'Quick check' } },
    ko: { today: '오늘', go: '이어서', next: '다음', done: '완료', show: '답 보기', again: '다시', got: '알아요', first: '먼저 떠올리고, 눌러서 확인',
      ctx: '문장 속 쓰임', prog: '진도', streak: '일 연속', known: '아는 단어', week: '이번 주', weeks: '6주', qs: '동재 선생님께 한 질문', ls: '단원',
      empty: '오늘 숙제가 없어요', err: '불러오지 못했어요', badKey: '링크가 맞지 않아요', retry: '다시 시도', back: '뒤로', close: '닫기', say: '말하기', stop: '멈춤',
      menu: '메뉴', busy: '오늘 너무 바빠요', rest: '오늘은 쉬어요', restPlanned: '쉬는 날', unskip: '그래도 할래요', restOk: '오늘 쉬기', keep: '계속하기',
      restQ: '오늘 쉴까요? 연속 기록은 그대로예요.', wait: '선생님이 오늘 숙제를 준비하고 있어요', waitShort: '숙제가 더 올 거예요', finishOld: '지난 숙제 마저 하기',
      writing: '한국어 쓰기', typeCards: '단어 카드에서 타자로 답하기', on: '켬', off: '끔', lang: '언어', remind: '알림',
      howWrite: '한국어를 어떻게 쓸까요?', pad: '화면에 쓰기', paper: '종이에 쓰고 사진', typing: '타자', explained: '선생님 설명', comments: '선생님 의견', notDone: '다 못 함',
      part: '부분', sent: '보냈어요. 선생님이 확인해요.', cardsDone: '장 끝', phrase: '조사까지 함께', camHint: '종이를 평평하게 두고 화면 가득 맞추세요.', you: '쓴 답', yours: '내 답', noMic: '마이크가 없어요', allDone: '오늘 숙제 끝', noneYet: '아직 없어요',
      typeHere: '한국어로', check: '확인', model: '모범 답', text: '글', cardsN: '장', newW: '새 단어', revW: '복습',
      skip: '이 문제 건너뛰기', skipped: '건너뜀', skippedNote: '건너뛴 문항이에요. 지금 다시 할 수 있어요.', previewNote: '미리 보기 — 저장하지 않았어요',
      skipWord: '이 단어 건너뛰기', skipAll: '단어 시험 전체 건너뛰기', skipAllQ: '단어 시험 전체를 건너뛸까요?', skipAllNote: '남은 단어 {n}개를 건너뛰어요. 목록의 ‘건너뜀 · 다시 하기’로 언제든 돌아올 수 있어요.',
      skipAllOk: '전체 건너뛰기', redo: '다시 하기', skippedRedo: '건너뜀 · 다시 하기', settings: '설정', ansEn: '영어로 답하는 방식', langQ: '화면에 한국어를 얼마나 쓸까요?',
      langNote: '공부하는 단어와 문장은 언제나 한국어예요.', ansNote: '‘영어로 옮기기’와 질문 뜻 쓰기에 써요. 문항마다 바꿀 수도 있어요.',
      typeNote: '답을 보기 전에 한국어 단어를 타자로 써요.', cnMore: '선생님 설명 · 예문 더 보기', tNote: '선생님 설명', tAlso: '뜻밖의 쓰임', tCommon: '자주 쓰는 표현', tCasual: '편한 말 · 줄임말', tEx: '예문 더 보기', roman: '로마자 보기 (ikda)', romanNote: '한글이 익숙해지면 끄는 게 좋아요.', recOk: '녹음했어요 — 준비되면 답 보기를 누르세요',
      introT: '시작하기 전에', introOnce: '이 화면은 한 번만 나와요.', start: '시작하기', guardian: '보호자(부모님)가 읽고 동의했어요.',
      intro: ['숙제는 하루 한 번, 약 {m}분이에요. 순서는 자유예요.', '소리 내어 말하고(녹음), 한국어는 손으로 써요. 화면에 쓰거나 종이에 쓰고 사진을 찍어요.', '모르는 것이 있으면 눌러서 선생님께 보내요.', '숙제는 선생님만 봐요. AI가 먼저 채점하고, 선생님이 확인한 뒤에 보여요.', '녹음과 손글씨 사진은 90일 뒤에 지워져요. 점수는 남아요.'],
      g: { preview: '예습', words: '단어', ko_en: '영어로 옮기기', en_ko: '한국어로 옮기기', qa: '말하기', sentence: '문장', reading: '읽기', listen: '듣기', feedback: '지난 수업', check: '실력 확인' } }
  };
  /* T146a 4단계 언어 (플래시카드 앱과 같음): 1 = 버튼 · 2 = 제목 · 3 = 설명. 고른 단계 이상인 말만 한국어 */
  var T1 = 'go next done show again got retry back close say stop check start skip keep restOk unskip redo skipWord skipAll skipAllOk on off'.split(' ');
  var T2 = 'cnMore tNote tAlso tCommon tCasual tEx today prog menu settings lang writing typeCards remind ansEn g newW revW cardsN skipped skippedRedo yours model text ls qs streak known week weeks allDone empty busy rest restPlanned pad paper typing explained comments notDone'.split(' ');
  function tierOf(k) { return T1.indexOf(k) >= 0 ? 1 : T2.indexOf(k) >= 0 ? 2 : 3; }
  function mkL() { var n = U.TIER[U.level()] || 0, o = {}; Object.keys(S.en).forEach(function (k) { o[k] = n >= tierOf(k) ? S.ko[k] : S.en[k]; }); return o; }
  var L = mkL();
  window.addEventListener('hw-prefs', function () { L = mkL(); });   // T146k 학생 기본 설정이 늦게 오면
  var LANGS = [['en', 'English', 'Just starting Korean · 한국어를 막 시작했어요', 'Everything in English: [Next] · Teacher’s note'],
    ['mix1', 'English + 쉬운 한국어', 'I can read Hangul and basic words · 한글을 읽어요', 'Buttons in Korean: [다음] [답 보기] · the rest in English'],
    ['mix2', '한국어 + English 설명', 'I understand simple Korean · 쉬운 한국어를 알아요', 'Buttons and titles in Korean: [다음] · 선생님 설명 · only help text in English'],
    ['ko', '한국어', 'I want Korean only · 한국어로만 공부할래요', '모두 한국어: [다음] · 선생님 설명 · 도움말']];
  var GI = { preview: 'bookmark', words: 'cards', ko_en: 'swap', en_ko: 'pen', qa: 'mic', sentence: 'lines', reading: 'book', listen: 'speaker', feedback: 'repeat', check: 'check' };
  var GORDER = ['preview', 'words', 'ko_en', 'en_ko', 'qa', 'sentence', 'reading', 'listen', 'feedback', 'check'];   // T154b 실력 확인은 맨 끝
  var P = {
    flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2-.5-3 0-6 1-8z', chat: 'M4 5h16v11H9l-5 4z',
    cards: 'M7 7h13v13H7zM4 16V6a2 2 0 0 1 2-2h10', swap: 'M4 8h13m-3-3 3 3-3 3M20 16H7m3-3-3 3 3 3', pen: 'M4 20l1-4L16 5l3 3L8 19z',
    mic: 'M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3', lines: 'M5 7h14M5 12h14M5 17h9',
    book: 'M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z', bookmark: 'M6 3h12v18l-6-4-6 4z',
    repeat: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4', check: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6L6 18',
    back: 'M15 5l-7 7 7 7', chev: 'M9 5l7 7-7 7', inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5a4 4 0 0 0 8 0h5',
    wifi: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01M3 3l18 18', stop: 'M7 7h10v10H7z',
    clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2', moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
    speaker: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
    menu: 'M4 7h16M4 12h16M4 17h16', gear: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1', bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', chart: 'M4 20h16M7 17v-5M12 17V7M17 17v-8'
  };
  function ic(n) { return el('span', { class: 'ico v', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (P[n] || '') + '"/></svg>' }); }
  function B(label, cls, fn, attrs) { return U.btn(label, cls, fn, attrs); }
  function iconBtn(name, label, fn, attrs) { return el('button', Object.assign({ class: 'icon', type: 'button', 'aria-label': label, onclick: fn }, attrs || {}), ic(name)); }
  function prog(r) { return el('div', { class: 'prog', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(r * 100)) }, el('i', { style: { width: Math.round(Math.max(0, Math.min(1, r)) * 100) + '%' } })); }
  function state(icon, text, act) { return el('section', { class: 'state2', role: act === 'load-error' ? 'alert' : 'status', 'data-act': act }, el('div', { class: 'big' }, ic(icon)), el('p', {}, text)); }
  function once(key) { var s = U.store.get('hw_v2_once', {}); if (s[key]) return false; return true; }
  function seen(key) { var s = U.store.get('hw_v2_once', {}); s[key] = 1; U.store.set('hw_v2_once', s); }
  function grpOf(t) { return U.grp(t); }   // T126 지시형은 문장 묶음
  function long(s) { return String(s || '').length > 14; }

  /* ---------- 판: 위 줄 + 가운데 + 아래 고정줄 ---------- */
  App.prototype.shell = function (top, mid, foot) {
    this.root.innerHTML = '';
    var app = el('main', { class: 'app', 'data-view': this.view });
    app.appendChild(top); app.appendChild(mid);
    if (foot && foot.childNodes.length) app.appendChild(foot);
    this.root.appendChild(app);
    return app;
  };
  App.prototype.topToday = function (title) {
    var self = this, d = this.data || {}, hasNote = this.hasNotice();
    if (this.dayOverride) return el('header', { class: 'bar-top back' }, iconBtn('back', L.back, function () { self.dayOverride = null; self.view = 'list'; self.load(true); }, { 'data-act': 'back-today' }), el('h1', {}, title));
    return el('header', { class: 'bar-top' }, el('h1', {}, title || L.today),
      d.streak ? el('button', { class: 'streak', type: 'button', 'aria-label': L.prog + ' · ' + d.streak + ' ' + L.streak, 'data-act': 'streak', onclick: function () { self.renderProgress(); } }, ic('flame'), String(d.streak)) : null,
      d.student ? el('button', { class: 'icon', type: 'button', 'aria-label': L.menu, 'data-act': 'menu', onclick: function () { self.openMenu(); } }, ic(hasNote ? 'bell' : 'menu'), hasNote ? el('i', { class: 'dot' }) : null) : null);
  };
  App.prototype.hasNotice = function () {
    var d = this.data || {};
    if (this.dayOverride) return false;
    return !!((d.unread_notifs || []).length || (d.marks || []).some(function (m) { return m.status === 'approved'; }) || (d.previous || []).some(function (p) { return p.feedback; }));
  };

  /* ---------- 불러오기: 로딩 = 빈 칸 4개, 오류 = 한 줄 + 다시 시도 ---------- */
  var oldLoad = App.prototype.load;
  App.prototype.load = function (silent) {
    var self = this;
    if (!silent) { this.view = 'list'; if (!this.cached()) this.skeleton(); }   // T146a 저장본이 있으면 빈 칸 없이 바로 그림
    var p = oldLoad.call(this, true);
    return p && p.then ? p.then(function (r) { if (self.root.querySelector('[data-act="load-error"]')) self.renderError(self._lastErr); return r; }) : p;
  };
  App.prototype.skeleton = function () {
    this.shell(el('header', { class: 'bar-top' }, el('h1', {}, L.today)),
      el('section', { class: 'screen', 'aria-busy': 'true', 'data-act': 'loading' }, el('div', { class: 'skel', style: { minHeight: '96px' } }), el('div', { class: 'skel' }), el('div', { class: 'skel' }), el('div', { class: 'skel' })));
  };
  App.prototype.renderError = function () {
    var self = this, msg = (this.root.querySelector('[data-act="load-error"] p') || {}).textContent || '';
    var bad = /not valid/.test(msg);
    this.shell(el('header', { class: 'bar-top' }, el('h1', {}, L.today)), state('wifi', bad ? L.badKey : L.err, 'load-error'),
      bad ? null : el('footer', { class: 'foot' }, B(L.retry, 'pri', function () { self.load(); }, { 'data-act': 'retry' })));
  };

  /* ---------- 화면 고르기 ---------- */
  App.prototype.render = function () {
    U.camHint = L.camHint;   // T108e 카메라 안내도 설정 언어 하나
    if (!this.data.student.consent_at) { this.root.innerHTML = ''; return this.renderIntro(); }
    if (this.view === 'task' && this.task(this.cur)) return this.renderTask();
    if (this.view === 'progress' && this._prog) return this.drawProgress(this._prog);
    if (this.view === 'settings') return this.renderSettings();
    if (this.view === 'langs') return this.renderLangs();
    this.view = 'list'; this.open = null;
    var out = this.renderList(); this.hello(); return out;
  };
  /* T146t 처음 열 때·업데이트 뒤 한 번: 짧은 인사 + 화면 언어 안내 (기본 = 영어). 알겠어요 = 그대로 · 설정할게요 = 언어 칸으로 */
  var HELLO_V = '2026-10-31';
  App.prototype.hello = function () {
    if (this._hello || document.querySelector('[data-act="hello-sheet"]')) return;
    if (U.PREVIEW ? !/hello/.test(location.hash) : U.store.get('hw_hello', '') === HELLO_V) return;   // 선생님 미리 보기는 #preview&hello 일 때만
    var self = this; this._hello = 1;
    var done = function () { if (!U.PREVIEW) U.store.set('hw_hello', HELLO_V); };
    var sh = el('div', { class: 'sheet bottom', role: 'dialog', 'aria-label': 'Hello', 'data-act': 'hello-sheet' }, el('div', { class: 'wrap' },
      el('h2', {}, U.tx('Hi! Welcome to your homework.', '안녕하세요! 과제에 오신 걸 환영해요.')),
      el('p', { class: 'small', 'data-act': 'hello-note' }, U.tx('The screen is in English. You can use more Korean in Settings → Language.', '화면은 영어로 시작해요. 설정 → 언어에서 한국어를 더 쓸 수 있어요.')),
      el('div', { class: 'actions' },
        B(U.tx('Got it', '알겠어요'), 'pri', function () { done(); sh.remove(); }, { 'data-act': 'hello-ok' }),
        B(U.tx('Set language', '설정할게요'), '', function () { done(); sh.remove(); self._back = 'list'; self.view = 'langs'; self.render(); window.scrollTo(0, 0); }, { 'data-act': 'hello-lang' }))));
    document.body.appendChild(sh);
  };
  App.prototype.rerenderList = function () { this.render(); };
  App.prototype.toggle = function (tid) { this.goTask(tid); };
  App.prototype.openNotif = function (n) {
    this.data.unread_notifs = (this.data.unread_notifs || []).filter(function (x) { return x.notif_id !== n.notif_id; });
    U.call('student.notif', { key: this.key, notif_id: n.notif_id, event: 'opened' }).catch(function () {});
  };

  /* ---------- 처음 한 번: 동의 (T108d, 설정 언어 하나) ---------- */
  App.prototype.renderIntro = function () {
    var self = this, s = this.data.student, minor = s.minor;
    var go = B(L.start, 'pri', function () {
      go.disabled = true;
      U.call('student.consent', { key: self.key, guardian: !!minor }).then(function () { self.data.student.consent_at = new Date().toISOString(); self.render(); },
        function (e) { go.disabled = false; U.toast(e.message); });
    }, { 'data-act': 'consent', disabled: minor ? true : null });
    var scr = el('section', { class: 'screen intro2', 'data-act': 'intro' }, el('p', { class: 'cap' }, L.introOnce),
      el('ul', { class: 'intro-list' }, L.intro.map(function (x) { return el('li', {}, x.replace('{m}', String(s.daily_min || 30))); })),
      minor ? el('label', { class: 'row-card static check2' }, el('input', { type: 'checkbox', 'data-act': 'guardian', onchange: function (e) { go.disabled = !e.target.checked; } }), el('span', { class: 't wrap2' }, L.guardian)) : null);
    this.view = 'intro';
    return this.shell(el('header', { class: 'bar-top' }, el('h1', {}, L.introT)), scr, el('footer', { class: 'foot' }, go));
  };

  /* ---------- ① 목록: 제목 + 핵심 숫자(끝낸 묶음/전체) + 묶음 행 + 「이어서」 하나 ---------- */
  App.prototype.groups = function () {
    var tasks = this.day.tasks;
    return GORDER.map(function (g) {
      var ts = tasks.filter(function (t) { return grpOf(t) === g; });
      return { g: g, ts: ts, n: ts.filter(finished).length };
    }).filter(function (x) { return x.ts.length; });
  };
  App.prototype.renderList = function () {
    var self = this, d = this.data, day = this.day;
    var title = this.dayOverride ? H.dayName(day.local_date, d.day.local_date) : L.today;
    var top = this.topToday(title), foot = el('footer', { class: 'foot' });
    if (day.skipped_at && !this.dayOverride) {
      var planned = day.skip_reason === 'rest';
      foot.appendChild(B(L.unskip, 'pri', function () { self.skip(true); }, { 'data-act': 'unskip' }));
      return this.shell(top, state('moon', planned ? L.restPlanned : L.rest, 'rest-day'), foot);
    }
    if (!day.tasks.length) {
      var fb = day.waiting_review && !this.dayOverride ? day.fallback : null;
      if (fb) foot.appendChild(B(L.finishOld, 'pri', function () { self.dayOverride = fb.dayset_id; self.load(true); }, { 'data-act': 'fallback' }));
      return this.shell(top, day.waiting_review ? state('clock', L.wait, 'waiting-review') : state('inbox', L.empty, 'empty-day'), foot);
    }
    var gs = this.groups(), doneG = gs.filter(function (x) { return x.n === x.ts.length; }).length;
    var scr = el('section', { class: 'screen' });
    scr.appendChild(el('div', { class: 'hero2', 'data-act': 'hero' },
      el('div', { class: 'hero-n', 'aria-label': doneG + ' / ' + gs.length }, String(doneG), el('small', {}, ' / ' + gs.length)), prog(gs.length ? doneG / gs.length : 0),
      day.waiting_review ? el('p', { class: 'hint1', style: { textAlign: 'left' }, 'data-act': 'waiting-review' }, L.waitShort) : null));
    // T108d: 묶음 행을 누르면 그 아래 문항 목록이 펼쳐짐(새 화면 아님, 한 번에 하나, 300ms ease-out, 줄이기 설정이면 바로). 문항 행 → 문항 화면
    var list = el('div', { class: 'list', id: 'taskList' });
    if (this._openG && !gs.some(function (x) { return x.g === self._openG; })) this._openG = null;
    gs.filter(function (x) { return x.n < x.ts.length; }).concat(gs.filter(function (x) { return x.n === x.ts.length; })).forEach(function (x) {
      var all = x.n === x.ts.length, open = self._openG === x.g, pid = 'sub-' + x.g;
      var sub = el('div', { class: 'sub' + (open ? ' open' : ''), id: pid, 'data-act': 'group-body', 'data-group': x.g },
        el('div', { class: 'sub-in' }, x.ts.map(function (t) { return self.subRow(t); })));
      var row = el('button', { class: 'row-card' + (all ? ' done' : ''), type: 'button', 'data-group': x.g, 'data-act': 'group', 'aria-expanded': String(open), 'aria-controls': pid,
        onclick: function () { self.toggleGroup(x.g); } },
        el('span', { class: 'ic' }, ic(GI[x.g] || 'lines')), el('span', { class: 't' }, L.g[x.g] || x.g),
        all ? el('span', { class: 'chk', 'aria-label': L.done }, ic('check')) : el('span', { class: 'n' }, x.n + '/' + x.ts.length),
        el('span', { class: 'chev' }, ic('chev')));
      list.appendChild(el('div', { class: 'grp' + (open ? ' open' : '') }, row, sub));
    });
    scr.appendChild(list);
    var nextG = gs.filter(function (x) { return x.n < x.ts.length; })[0];
    if (nextG) foot.appendChild(B(L.go, 'pri', function () { self.goGroup(nextG.g); }, { 'data-act': 'continue' }));
    else { scr.appendChild(el('p', { class: 'hint1', 'data-act': 'all-done' }, L.allDone)); scr.appendChild(this.endCard()); this.moreButtons(foot); }
    U.activeDay(day.dayset_id);   // T146q A4 이 세트를 보고 있는 시간
    return this.shell(top, scr, foot);
  };
  /* T146q (선생님 A4) 끝 화면: 회색 글 한 줄 대신 — 화면을 보고 있던 시간 + 분량·난도 3단계(이모지 + 낱말, 설정 언어). 답은 서버(daysets.end_json) */
  function END_Q() { return [['amount', U.tx('How much was it?', '양은 어땠어요?', 1), [['less', '🙂', U.tx('Too little', '적어요', 1)], ['ok', '👌', U.tx('Just right', '적당해요', 1)], ['more', '😮‍💨', U.tx('Too much', '많아요', 1)]]],
    ['difficulty', U.tx('How hard was it?', '난이도는 어땠어요?', 1), [['easy', '😌', U.tx('Easy', '쉬워요', 1)], ['ok', '👌', U.tx('Just right', '적당해요', 1)], ['hard', '🤯', U.tx('Hard', '어려워요', 1)]]]]; }
  App.prototype.endCard = function () {
    var self = this, day = this.day, id = day.dayset_id, mine = U.store.get('hw_end_' + id, null) || (!this.dayOverride && (this.data || {}).day_end) || {};
    var sec = U.activeSec(id), min = Math.max(1, Math.round(sec / 60));
    var box = el('section', { class: 'endcard', 'data-act': 'end-card' },
      el('div', { class: 'big-ok' }, ic('check')),
      el('p', { class: 'end-t' }, U.tx('All done for this day!', '이날 과제를 다 했어요!', 1)),
      sec >= 30 ? el('p', { class: 'end-min', 'data-act': 'active-min', 'data-sec': String(sec) }, U.tx('You studied ' + min + ' min on this screen', '이 화면에서 ' + min + '분 공부했어요', 1)) : null);
    END_Q().forEach(function (q) {
      var row = el('div', { class: 'end-row', role: 'group', 'aria-label': q[1], 'data-q': q[0] });
      q[2].forEach(function (o) {
        var b = el('button', { class: 'end-opt' + (mine[q[0]] === o[0] ? ' on' : ''), type: 'button', 'aria-pressed': String(mine[q[0]] === o[0]), 'data-act': 'end-' + q[0], 'data-v': o[0], onclick: function () {
          mine[q[0]] = o[0]; U.store.set('hw_end_' + id, mine);
          [].forEach.call(row.querySelectorAll('.end-opt'), function (x) { var on = x.getAttribute('data-v') === o[0]; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
          var pl = { key: self.key, dayset_id: id, active_sec: U.activeSec(id) }; pl[q[0]] = o[0];
          if (U.PREVIEW) return;
          U.call('student.day_end', pl).then(function () { U.toast(U.tx('Thanks! Dongjae will see this.', '고마워요! 선생님이 볼게요.', 1), 1500); }, function (e) { U.toast(e.message); });
        } }, el('span', { class: 'emo', 'aria-hidden': 'true' }, o[1]), el('span', {}, o[2]));
        row.appendChild(b);
      });
      box.appendChild(el('p', { class: 'end-q' }, q[1])); box.appendChild(row);
    });
    return box;
  };
  /** T146q 다른 날 열기 = 바로 빈 칸 로딩 화면(누르고 아무 일 없는 것처럼 보이지 않게) → 그 날 */
  App.prototype.goDay = function (id) { this.dayOverride = id; this.view = 'list'; this.open = null; this.skeleton(); this.load(true); window.scrollTo(0, 0); };
  /** T146j 다 끝낸 뒤: 밀린 날은 학생이 누를 때만 하나씩('Want more?') · 수시 갱신 학생은 '다음 과제 받기' */
  App.prototype.moreButtons = function (foot) {
    var self = this, d = this.data || {};
    this._blDone = this._blDone || {};
    if (this.dayOverride) this._blDone[this.dayOverride] = 1;
    if (d.schedule_mode === 'on_demand' && !this.dayOverride) {
      if (!d.next_set) { foot.appendChild(el('p', { class: 'hint1', 'data-act': 'next-wait' }, U.tx('Your next homework is being prepared.', '다음 과제를 준비하고 있어요.'))); return; }
      var nb = B(U.tx('Get next homework', '다음 과제 받기', 1), 'pri', function () {
        nb.disabled = true;
        U.call('student.next_set', { key: self.key }).then(function (r) {
          if (!r.moved) { nb.disabled = false; U.toast(U.tx('Your next homework is being prepared.', '다음 과제를 준비하고 있어요.')); return; }
          self.load(true);
        }, function (e) { nb.disabled = false; U.toast(e.message); });
      }, { 'data-act': 'next-set' });
      foot.appendChild(nb); return;
    }
    // T146q (선생님 L6·A3·A10) 밀린 날이 있으면 'Do an earlier day', 없으면 다음 날 미리 하기. 첫 과제 학생(밀린 날 없음)도 같은 규칙
    var nx = (d.backlog || []).filter(function (x) { return !self._blDone[x.dayset_id] && x.dayset_id !== self.dayOverride; })[0];
    if (nx) { foot.appendChild(B(U.tx('Want more? Do an earlier day', '더 할래요? 밀린 과제 하기', 1), 'pri', function () { self.goDay(nx.dayset_id); }, { 'data-act': 'more-backlog' })); return; }
    var ah = (d.ahead || []).filter(function (x) { return !self._blDone[x.dayset_id] && x.dayset_id !== self.dayOverride; })[0];
    if (ah) foot.appendChild(B(U.tx('Get ahead: try tomorrow’s', '내일 과제 미리 하기', 1), 'pri', function () { self.goDay(ah.dayset_id); }, { 'data-act': 'more-ahead', 'data-date': ah.local_date }));
  };

  // 묶음 펼치기: 다시 그리지 않고 class 만 바꿔서 CSS 가 높이를 0fr → 1fr 로 움직이게
  App.prototype.toggleGroup = function (g) {
    this._openG = this._openG === g ? null : g;
    var cur = this._openG;
    [].forEach.call(this.root.querySelectorAll('#taskList .grp'), function (w) {
      var row = w.querySelector('[data-act="group"]'), on = row.getAttribute('data-group') === cur;
      w.classList.toggle('open', on); w.querySelector('.sub').classList.toggle('open', on); row.setAttribute('aria-expanded', String(on));
    });
  };
  function itemText(t) {
    if (t.type === 'cards') return { s: (t.mode === 'new' ? L.newW : L.revW) + ' · ' + (t.cards || []).length, lang: null };
    if (t.type === 'sp_en_ko') return { s: t.en, lang: 'en' };
    if (t.type === 'mission') return { s: (t.targets || []).join(', '), lang: 'ko' };
    if (t.type === 'listen') return { s: H.listenName(t), lang: null };   // T114 문장은 끝난 뒤에만 옴
    if (t.type === 'diag') return { s: L.g.check + ' · ' + (t.steps || []).length, lang: null };   // T154b
    if (t.type === 'grammar' && t.fb && t.fb.said) return { s: U.tx('You said: ', '내가 한 말: ') + t.fb.said, lang: null };   // T126
    var s = t.type === 'sp_ko_en' ? t.ko : t.type === 'sp_qa' ? t.q_ko : t.type === 'reading' ? H.mainTitle(t.title) : t.type === 'write' ? t.prompt : t.type === 'grammar' ? t.instruction : t.type === 'ctx' ? t.sentence : (t.title || '');
    return { s: s, lang: 'ko' };
  }
  App.prototype.subRow = function (t) {
    var self = this, it = itemText(t), fin = finished(t);
    var dn = (t.steps || []).filter(function (s) { return s.sub; }).length, n = (t.steps || []).length;
    return el('button', { class: 'sub-row' + (fin ? ' done' : ''), type: 'button', 'data-act': 'task', 'data-task': t.task_id, onclick: function () { self.goTask(t.task_id); } },
      el('span', { class: 't', lang: it.lang }, it.s || (L.g[grpOf(t)] || '')),
      t.status === 'skipped' ? el('span', { class: 'n redo', 'data-act': 'skipped' }, L.skippedRedo) : fin ? el('span', { class: 'chk', 'aria-label': L.done }, ic('check')) : dn && n > 1 ? el('span', { class: 'n' }, dn + '/' + n) : null);
  };

  /* ---------- 이동 ---------- */
  App.prototype.goGroup = function (g) {
    var ts = this.day.tasks.filter(function (t) { return grpOf(t) === g; });
    var t = ts.filter(function (x) { return !finished(x); })[0] || ts[0];
    if (t) this.goTask(t.task_id);
  };
  App.prototype.goTask = function (tid) {
    var self = this, now = U.actMs();   // T146s 활동 시계
    if (this.open && this.open !== tid) { var a = this.tm(this.open); if (a.openAt) { a.dwell += now - a.openAt; a.openAt = null; } }
    var t = this.task(tid); if (!t) { this.view = 'list'; this.open = null; return this.render(); }
    if (this.open !== tid) { var b = this.tm(tid); b.openAt = now; b.stepStart = now; }
    this.open = tid; this.cur = tid; this.g = grpOf(t); this.view = 'task';
    if (t.has_teacher) { var sn = U.store.get('hw2_seen', {}); sn[this.day.dayset_id + tid] = 1; U.store.set('hw2_seen', sn); }
    var needWrite = t.steps.some(function (s) { return !s.sub && (s.kind === 'hand' || s.kind === 'ko_answer'); });
    if (needWrite && !U.writeMode() && !U.PREVIEW) return this.askWrite(function () { self.goTask(tid); });
    if (this.dirty) { this.dirty = false; return this.reloadDay(); }
    this.render(); window.scrollTo(0, 0);
  };
  App.prototype.closeTask = function () {
    var now = U.actMs();
    if (this.open) { var a = this.tm(this.open); if (a.openAt) { a.dwell += now - a.openAt; a.openAt = null; } }
    this.open = null; this.view = 'list'; if (this.g) this._openG = this.g;   // 돌아오면 하던 묶음이 펼쳐진 채로
    if (this.dirty) { this.dirty = false; return this.reloadDay(); }
    this.render(); window.scrollTo(0, 0);
  };
  App.prototype.nextTask = function () {
    var self = this, cur = this.cur;
    var ts = this.day.tasks.filter(function (t) { return grpOf(t) === self.g; });
    var nx = ts.filter(function (t) { return t.task_id !== cur && !finished(t); })[0];
    if (nx) return this.goTask(nx.task_id);
    this.closeTask();
  };

  App.prototype.afterTask = function () { this.nextTask(); };   // T119 넘어가기 뒤: 같은 묶음 다음 문항, 없으면 목록

  /* ---------- ② 문항: ✕ + 막대 + 1/5 · 가운데 하나 · 아래 버튼 ---------- */
  App.prototype.renderTask = function () {
    var self = this, t = this.task(this.cur), ts = this.day.tasks.filter(function (x) { return grpOf(x) === self.g; });
    var i = ts.indexOf(t), r, cnt;
    if ((t.type === 'cards' || t.type === 'diag') && !finished(t)) {   // T154b 진단도 문항 수로
      var dn = t.steps.filter(function (s) { return s.sub; }).length, nn = t.steps.length;
      r = dn / Math.max(1, nn); cnt = Math.min(nn, dn + 1) + '/' + nn;
    } else { r = ts.filter(finished).length / Math.max(1, ts.length); cnt = (i + 1) + '/' + ts.length; }
    var top = el('header', { class: 'bar-top back' }, iconBtn('x', L.close, function () { self.closeTask(); }, { 'data-act': 'close-task' }), prog(r), el('span', { class: 'count', 'data-act': 'count' }, cnt));
    var foot = el('footer', { class: 'foot' }), stage;
    if (t.type === 'cards' && !finished(t) && t.steps.some(function (s) { return !s.sub; })) stage = this.cardStage(t, foot);
    else if (t.type === 'diag' && !finished(t) && t.steps.some(function (s) { return !s.sub; })) stage = this.diagStage(t);
    else if (finished(t) || !t.steps.some(function (s) { return !s.sub; })) stage = this.doneStage(t, foot);
    else stage = this.stepStage(t, foot);
    if (!finished(t) && t.type === 'diag') stage.appendChild(el('div', { class: 'skip2' }, B(U.tx('Skip the whole quick check', '실력 확인 전체 건너뛰기', 1), 'ghost', function () { self.skipTask(t); }, { 'data-act': 'skip-task' })));
    else if (!finished(t)) stage.appendChild(el('div', { class: 'skip2' }, t.type === 'cards'   // T146a 단어 시험: 이 버튼은 전체 → 확인 한 번. 단어 하나는 카드 안 '이 단어 건너뛰기'
      ? B(L.skipAll, 'ghost', function () { self.askSkipAll(t); }, { 'data-act': 'skip-all' })
      : B(L.skip, 'ghost', function () { self.skipTask(t); }, { 'data-act': 'skip-task' })));
    var app = this.shell(top, stage, foot);
    app.setAttribute('data-task', t.task_id); app.setAttribute('data-type', H.typeKey(t));
    return app;
  };

  /** T146j 카드 첫 예문 + 영어 뜻 (card.example_en, 없으면 web/xe) — '예문 더 보기'와 같은 꼴 */
  App.prototype.exNode = function (c, t) {
    var en = el('span', { class: 'small', lang: 'en', 'data-act': 'ex-en' }, c.example_en || '');
    if (!c.example_en) U.exEn(c.example).then(function (x) { if (x) en.textContent = x; else en.remove(); });
    return el('div', { class: 'cn-ex', 'data-act': 'card-example' }, this.markable(c.example, { cls: 'ex', task_id: t.task_id, where: 'card-example' }), U.romanNode(c.example, true), en);
  };
  /** T146g 카드 뒷면 앱 노트: 선생님 설명(t3 = 한국어, 아니면 영어 설명) · 이렇게도 써요 · 예문(앱 예문 중 카드 예문과 다른 것 2개) */
  App.prototype.fillNote = function (box, c, t, onAny) {
    var self = this;
    U.cardNote(c).then(function (n) {
      if (!n || !box.isConnected) return;
      var pb = box.closest && box.closest('[data-act="card"]'), po = pb && pb.querySelector('[data-act="pron-box"]');
      if (po && (n.pr || n.w)) { var pl = H.pronLine(c.ko, n); po.innerHTML = ''; if (pl) po.appendChild(pl); }   // T146k 앱 노트의 실제 발음·규칙
      var stg = box.closest && box.closest('[data-act="card"]');
      if (n.k === 'pattern' && stg && !stg.querySelector('[data-act="pattern-tag"]')) stg.firstChild.insertBefore(el('span', { class: 'ptag', 'data-act': 'pattern-tag' }, U.tx('Grammar pattern', '문형', 2)), stg.firstChild.firstChild);
      var ko3 = (U.TIER[U.level()] || 0) >= 3, x = ko3 ? (n.x || n.xe) : (n.xe || n.x);
      if (x) box.appendChild(el('div', { class: 'cn-card', 'data-act': 'cn-explain' }, el('b', {}, L.tNote), el('span', { lang: x === n.x ? 'ko' : 'en' }, x)));
      // T146q (선생님 S4) 표현 = 뜻밖의 쓰임(p[5] 's') · 편한 말·줄임말('c') · 그 밖(자주 쓰는 표현) 따로 — card_notes.py phrase_kinds [기본안]
      [['s', L.tAlso, 'cn-phrases'], ['', L.tCommon, 'cn-common'], ['c', L.tCasual, 'cn-casual']].forEach(function (g) {
        var ps = (n.p || []).filter(function (p) { return (p[5] || '') === g[0]; }); if (!ps.length) return;
        box.appendChild(el('div', { class: 'cn-card', 'data-act': g[2] }, el('b', {}, g[1]), ps.map(function (p) {
          var nu = ko3 ? (p[3] || p[4]) : (p[4] || p[3]);
          return el('div', { class: 'cn-ph' }, el('span', { lang: 'ko', class: 'cn-k' }, p[0]), p[1] ? el('span', { class: 'small', lang: 'en' }, p[1]) : null,
            p[2] ? self.markable(p[2], { cls: 'ex', task_id: t.task_id, where: 'card-example' }) : null, nu ? el('span', { class: 'small' }, nu) : null);
        })));
      });
      var ex = (n.e || []).filter(function (e) { return e[0] !== c.example; }).slice(0, 2);
      if (ex.length) box.appendChild(el('div', { class: 'cn-card', 'data-act': 'cn-examples' }, el('b', {}, L.tEx), ex.map(function (e) {
        return el('div', { class: 'cn-ex' }, self.markable(e[0], { cls: 'ex', task_id: t.task_id, where: 'card-example' }), U.romanNode(e[0], true), e[1] ? el('span', { class: 'small', lang: 'en' }, e[1]) : null);
      })));
      if (onAny && box.childNodes.length) onAny();   // T146p 내용이 생겼을 때만 버튼을 보임
    });
  };
  /* 단어 카드: 단어 46px → [마이크][답 보기] → 뜻 + 「문장 속 쓰임」 → [다시][알아요] */
  App.prototype.cardStage = function (t, foot) {
    var self = this, inn = el('div', { class: 'in' }), stage = el('section', { class: 'center-stage', 'data-act': 'card' }, inn);
    if (!t._q) { t._q = []; t._att = {}; t._first = {}; t.steps.forEach(function (s, k) { if (!s.sub) t._q.push(k); }); }
    t._q = t._q.filter(function (k) { return !t.steps[k].sub; });
    if (!t._q.length) return this.doneStage(t, foot);
    var idx = t._q[0], c = t.cards[idx], step = t.steps[idx], phase = t._phase === idx ? 'back' : 'front';
    var typedRes = t._typed && t._typed.idx === idx ? t._typed : null, rec = t._rec && t._rec.idx === idx ? t._rec.r : null;
    stage.setAttribute('data-card', c.item_id); stage.setAttribute('data-phase', phase);
    var cen = U.cardEn(c);   // T146j 형용사 = to be ___
    if (U.isPattern(c)) inn.appendChild(el('span', { class: 'ptag', 'data-act': 'pattern-tag' }, U.tx('Grammar pattern', '문형', 2)));   // T146j 문형은 단어 카드가 아님
    inn.appendChild(el('div', { class: 'word' + (long(cen) ? ' long' : '') + (phase === 'back' ? ' after' : ''), lang: 'en' }, cen));
    if (c.hint) inn.appendChild(el('p', { class: 'hint1 whint', 'data-act': 'word-hint', lang: 'en' }, c.hint));   // T140 뜻 같은 다른 말 꼬리표
    var kh = phase === 'front' ? U.koHint(c) : '';   // T146t 첫 자음·첫 글자 힌트 (뒷면엔 답이 보이니 안 씀)
    if (kh) inn.appendChild(el('p', { class: 'hint1 whint', 'data-act': 'ko-hint' }, U.tx('Starts with ', '첫 글자 '), el('b', { lang: 'ko' }, kh)));
    var gone = false;
    function finish(rating) {
      if (gone) return; gone = true;   // T140 서버 답을 기다리는 동안 한 번 더 누르면 같은 카드를 또 보내고 다음 카드를 건너뛰던 것
      var first = t._first[idx] !== undefined ? t._first[idx] : rating, att = (t._att[idx] || 0) + 1;
      if (rating === 1 && att < 3) { t._first[idx] = first; t._att[idx] = att; t._q.push(t._q.shift()); t._phase = null; t._typed = null; t._rec = null; self.render(); return; }
      var rr = rec, typed = typedRes;
      t._phase = null; t._typed = null; t._rec = null; t._q.shift();
      var ans = { rating: first, attempts: att };
      if (typed) { ans.typed = typed.text; delete ans.rating; }
      if (rr) ans.said = 1;
      self.submitStep(t, step, ans, rr ? function () { return U.blobToB64(rr.blob).then(function (b64) { return { b64: b64, mime: rr.mime }; }); } : null, null);
      self.render();   // T140 다음 카드를 바로 (보내기는 줄에서 차례로)
    }
    if (phase === 'front') {
      if (c.chunk) inn.appendChild(el('p', { class: 'hint1' }, L.phrase));
      if (t.mode === 'new' && once('cards')) inn.appendChild(el('p', { class: 'hint1', 'data-act': 'first-hint' }, L.first));
      // T146k (R20) 답 칸 한 줄 = [In Korean 입력칸][마이크]: 타자·녹음·둘 다 같은 자리. 답 보기는 그 아래 따로, 녹음만 해도 누를 수 있음
      var inp = U.textInput({ placeholder: L.typeHere, lang: 'ko', onEnter: function () { reveal(); } });
      if (t._draft && t._draft.idx === idx) inp.value = t._draft.v;
      inp.addEventListener('input', function () { t._draft = { idx: idx, v: inp.value }; });
      inn.appendChild(el('div', { class: 'card-in ans-row', 'data-act': 'ans-row' }, inp, this.micSq(t, idx)));
      if (rec) inn.appendChild(el('div', { class: 'rec-ok', 'data-act': 'rec-ok' }, el('p', { class: 'hint1' }, L.recOk), el('audio', { controls: true, src: URL.createObjectURL(rec.blob) })));
      var reveal = function () {
        if (t.mode === 'new') seen('cards');
        var v = inp && inp.value.trim();
        if (v) { var ck = window.Hangul.check(v, U.cardTargets(c)); t._typed = { idx: idx, text: v, status: ck.status, target: ck.target }; }
        t._phase = idx; t._draft = null; self.render();
      };
      foot.appendChild(B(L.show, 'pri', reveal, { 'data-act': 'show' }));
      if (t._q.length > 1) inn.appendChild(el('div', { class: 'word-skip' }, B(L.skipWord, 'ghost sm', function () { self.skipWord(t, idx); }, { 'data-act': 'skip-word' })));
      else if (t._skipW && t._skipW[idx]) inn.appendChild(el('p', { class: 'hint1', 'data-act': 'skip-word-last' }, U.tx('This is the word you skipped. Use “Skip the whole word test” below to stop here.', '건너뛴 단어예요. 여기서 그만하려면 아래 ‘단어 시험 전체 건너뛰기’를 누르세요.')));
    } else {
      inn.appendChild(el('p', { class: 'mean' + (long(c.display) ? ' long' : ''), lang: 'ko', 'data-act': 'mean' }, H.formsNode(c)));   // T146q L4 두 꼴이면 꼴마다 소리 버튼
      var rn = U.romanNode(H.cardForms(c).join(' / ')); if (rn) inn.appendChild(rn);
      if (typedRes) inn.appendChild(el('div', { class: 'res ' + (typedRes.status === 'correct' ? 'ok' : typedRes.status === 'close' ? 'close' : 'bad'), style: { textAlign: 'left', width: '100%' } }, U.diffNode(typedRes.text, typedRes.target)));
      // T146g 답을 본 뒤 = 플래시카드 앱 카드처럼 선생님 설명 · 이렇게도 써요 · 예문 (같은 데이터 web/cn)
      // T146k (R17) 발음·첫 예문·내 녹음은 보이고, 선생님 설명·예문 더 보기는 처음엔 닫힘(누르면 열림, 이 카드에서 연 것만 기억)
      var cnBox = el('div', { class: 'cn', 'data-act': 'card-note' });
      [el('div', { class: 'pron-box', 'data-act': 'pron-box' }, H.pronLine(c.ko)), c.example ? this.exNode(c, t) : null,
        rec ? el('audio', { controls: true, src: URL.createObjectURL(rec.blob), style: { width: '100%' } }) : null].filter(Boolean).forEach(function (x) { inn.appendChild(x); });
      var extra = [c.note ? el('div', { class: 'small' }, c.note) : null, c.explain ? el('div', { class: 'small' }, c.explain) : null, cnBox].filter(Boolean);
      // T146p 설명·예문이 하나도 없으면 버튼을 안 만듦(앱 노트가 늦게 오면 그때 보임) · 있으면 접힌 채
      var shut = t._more !== idx + 1, body = el('div', { class: 'more-body', hidden: shut ? true : null }, extra), has = !!(c.note || c.explain);
      var moreBtn = el('button', { class: 'more', type: 'button', hidden: has ? null : true, 'aria-expanded': String(!shut), 'data-act': 'more', onclick: function (e) { var o = body.hasAttribute('hidden'); if (o) body.removeAttribute('hidden'); else body.setAttribute('hidden', ''); t._more = o ? idx + 1 : null; e.currentTarget.setAttribute('aria-expanded', String(o)); } }, L.cnMore);
      inn.appendChild(moreBtn);
      inn.appendChild(body);
      this.fillNote(cnBox, c, t, function () { moreBtn.removeAttribute('hidden'); });
      if (typedRes) {
        var rt = typedRes.status === 'correct' ? 3 : typedRes.status === 'close' ? 2 : 1;
        foot.appendChild(B(L.next, 'pri', function () { finish(rt); }, { 'data-rate': String(rt) }));
      } else {
        foot.appendChild(B(L.again, '', function () { finish(1); }, { 'data-rate': '1' }));
        foot.appendChild(B(L.got, 'pri', function () { finish(3); }, { 'data-rate': '3' }));
      }
    }
    return stage;
  };
  /* 마이크 정사각 버튼: 누르면 녹음, 다시 누르면 멈추고 답 보기 (최대 8초) */
  App.prototype.micSq = function (t, idx) {
    var self = this, R = null, stopping = false;
    var b = el('button', { class: 'btn sq', type: 'button', 'aria-label': L.say, 'data-act': 'say' }, ic('mic'));
    function stop() {
      if (stopping || !R) return; stopping = true;
      R.stop().then(function (r) { if (r) { t._rec = { idx: idx, r: r }; if (t.mode === 'new') seen('cards'); } self.render(); });   // T146k 녹음 뒤에도 앞면 — 답 보기는 학생이 누름
    }
    b.addEventListener('click', function () {
      if (R) return stop();
      R = new U.Recorder(8, function (s) { if (s >= 8) stop(); });
      R.start().then(function () { b.classList.add('on'); b.innerHTML = ''; b.appendChild(ic('stop')); b.setAttribute('aria-label', L.stop); b.setAttribute('data-act', 'say-stop'); },
        function () { R = null; U.toast(L.noMic); });
    });
    return b;
  };

  /* T146q (선생님 K2·S5, R28) 문장 과제 = 상황 한두 줄(누가·어디서·왜) — 설정 언어(한국어 단계면 scene_ko) */
  function sceneNode(t) {
    if (t.type === 'mission' || !(t.scene_en || t.scene_ko)) return null;
    if ((t.type === 'sp_en_ko' || t.type === 'sp_ko_en') && (t.tk === 'translate' || (!t.tk && !U.isDirective(t)))) return null;   // T146w C2·R38 번역 = 문장만, 상황 줄 없음
    var ko = U.lang() === 'ko' && t.scene_ko, x = ko ? t.scene_ko : t.scene_en;   // T146w C2 영어 설정이면 scene_ko 로 대신하지 않음(R41)
    if (!x) return null;
    return el('p', { class: 'scene2', 'data-act': 'scene', lang: x === t.scene_ko ? 'ko' : 'en' }, x);
  }
  /* T146q (선생님 S2, R30) 번역 힌트 낱말 1~2개 = [[ko, en], …] 칩 */
  function hintsNode(t) {
    var h = (t.hints || []).filter(function (x) { return x && x[0]; }); if (!h.length) return null;
    return el('div', { class: 'hints2', 'data-act': 'hints' }, el('span', { class: 'cap' }, U.tx('Helpful words', '도움 낱말', 1)),
      h.map(function (x) { return el('span', { class: 'chip' }, el('span', { lang: 'ko' }, x[0]), x[1] ? el('span', { class: 'small', lang: 'en' }, ' = ' + x[1]) : null); }));
  }
  /* T146q (선생님 S6, R33) 고치기 문항: 고칠 곳(t.fix = 문장 안 글자들)을 밑줄·색으로 */
  function fixMarked(node, fix) {
    var fx = [].concat(fix || []).filter(Boolean); if (!fx.length || !node) return node;
    var walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), list = [], n;
    while ((n = walk.nextNode())) list.push(n);
    list.forEach(function (tn) {
      var txt = tn.nodeValue, hit = null;
      fx.forEach(function (f) { var i = txt.indexOf(f); if (i >= 0 && (!hit || i < hit[0])) hit = [i, f]; });
      if (!hit) return;
      var frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(txt.slice(0, hit[0])));
      frag.appendChild(el('mark', { class: 'fixme', 'data-act': 'fix-mark' }, hit[1]));
      frag.appendChild(document.createTextNode(txt.slice(hit[0] + hit[1].length)));
      tn.parentNode.replaceChild(frag, tn);
    });
    return node;
  }
  /* 단어 카드 밖 문항: 문제 + 지금 단계 하나. 단계의 「완료」 버튼은 아래 고정줄로 */
  App.prototype.promptNode = function (t) {
    if (t.type === 'sp_ko_en') return this.markable(t.ko, { cls: 'prompt2 mat2', task_id: t.task_id, where: 'sentence' });   // T146u M5 재료 상자
    if (t.type === 'sp_en_ko') return t.form ? el('div', { class: 'pgroup' }, el('div', { class: 'prompt2 en mat2', lang: 'en' }, t.en), el('p', { class: 'dir2 form2', lang: 'en', 'data-act': 'form-hint' }, t.form)) : el('div', { class: 'prompt2 en mat2', lang: 'en' }, t.en);   // T146w C4 쓸 꼴 안내
    if (t.type === 'sp_qa') return this.markable(t.q_ko, { cls: 'prompt2 mat2', task_id: t.task_id, where: 'question' });
    if (t.type === 'write') return el('div', { class: 'prompt2 en', lang: 'en' }, t.prompt);
    if (t.type === 'grammar') {   // T146u M5 지시(보통 굵기) + 재료(가장 큼·한국어 글꼴·따로 상자) — 'Rewrite …: 영화를 보고 집에 갔어요.'
      var fbn = H.fbNode(t); if (fbn) return fbn;
      var ins = String(t.instruction || ''), cut = ins.search(/:\s*(?=[^:]*[가-힣])[^:]*$/);
      if (cut > 0 && /[A-Za-z]/.test(ins.slice(0, cut))) return el('div', { class: 'pgroup' }, el('p', { class: 'dir2', lang: 'en', 'data-act': 'directive' }, ins.slice(0, cut).trim()),
        fixMarked(this.markable(ins.slice(cut + 1).trim(), { cls: 'mat2', task_id: t.task_id, where: 'grammar' }), t.fix));
      return fixMarked(this.markable(ins, { cls: 'prompt2 en', task_id: t.task_id, where: 'grammar' }), t.fix);
    }
    if (t.type === 'ctx') return fixMarked(this.markable(t.sentence, { cls: 'prompt2 mat2', task_id: t.task_id, where: 'context' }), t.fix);
    if (t.type === 'reading') return el('div', { class: 'prompt2', lang: 'ko' }, H.mainTitle(t.title));
    if (t.type === 'listen') return this.listenNode(t);
    if (t.type === 'mission') return el('div', {}, el('div', { class: 'small' }, H.scene(t)), el('div', { class: 'tags', style: { marginTop: '6px' } }, (t.targets || []).map(function (x) { return el('span', { class: 'chip target', lang: 'ko' }, x); })));
    return null;
  };
  App.prototype.stepStage = function (t, foot) {
    var inn = el('div', { class: 'in' }), stage = el('section', { class: 'center-stage flow', 'data-act': 'step-stage' }, inn);
    var sc = sceneNode(t); if (sc) inn.appendChild(sc);   // T146q R28
    inn.appendChild(this.promptNode(t));
    var hn = hintsNode(t); if (hn) inn.appendChild(hn);   // T146q R30
    if (t.part && t.part.n && t.part.of > 1) inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'part-note' }, L.part + ' ' + t.part.n + ' / ' + t.part.of));   // 맞춤 과제는 part 가 글자('preview' 등)
    if (H.HOW[t.type] && once('how_' + t.type)) { inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'how' }, H.how(t.type))); if (!U.PREVIEW) seen('how_' + t.type); }
    if (t.type === 'reading' && t.text && (!t.steps[0] || t.steps[0].kind !== 'read' || t.steps[0].sub))
      inn.appendChild(el('details', { class: 'passage-box', 'data-act': 'passage-again' }, el('summary', { lang: H.mainTitle(t.title) ? 'ko' : null }, H.mainTitle(t.title) || L.text), this.markable(t.text, { cls: 'passage', gloss: t.gloss, task_id: t.task_id, where: 'reading' })));
    var doneSteps = t.steps.filter(function (s) { return s.sub; }), last = doneSteps[doneSteps.length - 1];
    if (last) { var rs = this.stepResult(t, last); if (rs) inn.appendChild(rs); }
    if (t.steps.some(function (s) { return H.isWaiting(s.sub); })) inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'waiting' }, L.sent));
    var aid = this.activeStep(t), st = t.steps.filter(function (s) { return s.step_id === aid; })[0], k = t.steps.indexOf(st);
    inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'step-label', 'data-step': st.step_id, 'data-kind': st.kind }, (k + 1) + '/' + t.steps.length + ' · ' + H.stepLabel(st)));
    var box = this.stepInput(t, st);
    box.setAttribute('data-step', st.step_id);
    var db = box.querySelector('[data-act="done"]');
    if (db) { var holder = db.parentNode; db.className = 'btn pri'; if (/Done|완료/.test(db.textContent)) { db.textContent = L.done; db.setAttribute('data-label', L.done); } foot.appendChild(db); if (holder && holder !== box && !holder.childNodes.length) holder.remove(); }
    inn.appendChild(box);
    return stage;
  };
  /* T154b 실력 확인: 가운데 문항 하나 (student.js diagNode) — 누르면 바로 다음 문항 */
  App.prototype.diagStage = function (t) {
    var self = this, inn = el('div', { class: 'in' }), stage = el('section', { class: 'center-stage flow', 'data-act': 'diag-stage' }, inn);
    inn.appendChild(this.diagNode(t, function () { if (self.view === 'task' && self.cur === t.task_id) self.render(); }));
    return stage;
  };
  /* 끝난 문항: 결과·모범 답·선생님 의견 + 「다음」 */
  App.prototype.doneStage = function (t, foot) {
    var self = this, inn = el('div', { class: 'in' }), stage = el('section', { class: 'center-stage' + (t.type === 'cards' ? '' : ' flow'), 'data-act': 'done-stage' }, inn);
    if (t.status === 'skipped') {
      var pn0 = t.type === 'cards' ? null : this.promptNode(t); if (pn0) inn.appendChild(pn0);
      inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'skipped-note' }, L.skippedNote));
      foot.appendChild(B(L.redo, 'pri', function () { self.unskipTask(t); }, { 'data-act': 'redo' }));
      foot.appendChild(B(L.next, '', function () { self.nextTask(); }, { 'data-act': 'next' }));
      (t.card_feedback || []).forEach(function (f) { inn.appendChild(self.feedbackBox(f)); });
      return stage;
    } else if (t.type === 'cards') {
      inn.appendChild(el('div', { class: 'big-ok' }, ic('check')));
      inn.appendChild(el('p', { class: 'prompt2' }, t.cards.length + ' ' + L.cardsDone));
    } else if (t.type === 'diag') {   // T154b 맞고 틀림은 안 보임
      inn.appendChild(el('div', { class: 'big-ok' }, ic('check')));
      inn.appendChild(el('p', { class: 'prompt2', 'data-act': 'diag-done' }, U.tx('Thank you! ' + t.steps.length + ' questions done.', '고마워요! ' + t.steps.length + '문항 끝.')));
    } else {
      var pn = this.promptNode(t); if (pn) inn.appendChild(pn);
      if (t._lastImg || t._lastTyped || t._lastEn) inn.appendChild(el('div', { class: 'mine', 'data-act': 'my-answer' }, el('p', { class: 'steplbl' }, L.yours),   // T108e 이 기기에서 방금 쓴 손글씨·사진·타자 (T146u M4b 영어 타자 답도)
        t._lastImg ? el('img', { class: 'thumb', src: t._lastImg, alt: L.yours }) : t._lastTyped ? el('div', { class: 'prompt2', lang: 'ko' }, t._lastTyped) : el('div', { class: 'prompt2 en', lang: 'en' }, t._lastEn)));
      var pv = false;
      t.steps.forEach(function (s) { if (!s.sub) return; if (s.sub.grade_status === 'preview') { pv = true; return; } var rs = self.stepResult(t, s); if (rs) inn.appendChild(rs); });
      if (pv) inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'preview-note' }, L.previewNote));   // T119 미리 보기: 한 줄만
      if (t.steps.some(function (s) { return H.isWaiting(s.sub); })) inn.appendChild(el('p', { class: 'steplbl', 'data-act': 'waiting' }, L.sent));
      var mb = this.modelBox(t); if (mb && mb.childNodes.length) { var lab = mb.querySelector('.tiny'); inn.appendChild(mb); }   // T109e 이름표는 modelBox 가 설정 언어로 (모범 답 / 답 예시)
      if (t.type === 'mission') { var rep = null; t.steps.forEach(function (s) { if (s.sub && s.sub.auto && s.sub.auto.mission_report) rep = s.sub.auto.mission_report; }); if (rep) inn.appendChild(H.missionReport(rep)); }
    }
    (t.card_feedback || []).forEach(function (f) { inn.appendChild(self.feedbackBox(f)); });
    if (t.type !== 'diag') foot.appendChild(B(L.redo, '', function () { self.redoTask(t); }, { 'data-act': 'redo-done' }));   // T146t 보낸 뒤에도 다시 풀기
    foot.appendChild(B(L.next, 'pri', function () { self.nextTask(); }, { 'data-act': 'next' }));
    return stage;
  };

  /* ---------- ③ 진척: 숫자 3개 + 막대 1개 + 접힌 행 2개 ---------- */
  App.prototype.renderProgress = function () {
    var self = this;
    this.view = 'progress'; this._prog = null;
    var top = el('header', { class: 'bar-top back' }, iconBtn('back', L.back, function () { self.view = 'list'; self._prog = null; self.render(); }, { 'data-act': 'close' }), el('h1', {}, L.prog));
    this.shell(top, el('section', { class: 'screen', 'aria-busy': 'true', 'data-act': 'loading' }, el('div', { class: 'skel', style: { minHeight: '96px' } }), el('div', { class: 'skel', style: { minHeight: '200px' } }), el('div', { class: 'skel' })));
    Promise.all([U.call('student.progress', { key: this.key }), U.call('student.lessons', { key: this.key }).catch(function () { return null; })]).then(function (r) {
      if (self.view !== 'progress') return; var p = r[0]; p.lessons = r[1]; self._prog = p; self.drawProgress(p); },
      function () { if (self.view !== 'progress') return; self.shell(top, state('wifi', L.err, 'load-error'), el('footer', { class: 'foot' }, B(L.retry, 'pri', function () { self.renderProgress(); }, { 'data-act': 'retry' }))); });
  };
  App.prototype.drawProgress = function (p) {
    var self = this, DONE = { on_time: 1, late: 1, partial: 1 };
    var cal = p.calendar || [], weeks = [];
    for (var e = cal.length; e > 0 && weeks.length < 6; e -= 7) weeks.unshift(cal.slice(Math.max(0, e - 7), e));
    var cnt = weeks.map(function (w) { return w.filter(function (c) { return DONE[c.status]; }).length; });
    var thisWeek = cnt.length ? cnt[cnt.length - 1] : 0;
    var top = el('header', { class: 'bar-top back' }, iconBtn('back', L.back, function () { self.view = 'list'; self._prog = null; self.render(); }, { 'data-act': 'close' }), el('h1', {}, L.prog));
    var scr = el('section', { class: 'screen', 'data-act': 'progress' });
    scr.appendChild(el('div', { class: 'card2' }, el('div', { class: 'big-n', 'data-act': 'p-streak' }, ic('flame'), String(p.streak || 0)), el('p', { class: 'cap' }, L.streak)));
    scr.appendChild(el('div', { class: 'card2' },
      el('div', { class: 'pair' }, el('div', {}, el('b', { 'data-act': 'p-known' }, String(p.words_known || 0)), el('p', { class: 'cap' }, L.known)),
        el('div', {}, el('b', { 'data-act': 'p-week' }, thisWeek + '/7'), el('p', { class: 'cap' }, L.week))),
      el('div', { class: 'bars', 'aria-hidden': 'true', 'data-act': 'p-bars' }, cnt.map(function (n, k) { return el('i', { class: k === cnt.length - 1 ? 'on' : '', style: { height: Math.max(4, Math.round(n / 7 * 100)) + '%' } }); })),
      el('p', { class: 'cap', style: { marginTop: '10px' } }, L.weeks)));
    var mk = this.data.marks || [];
    function fold(label, n, body, act) {
      var open = false, box = el('div', { class: 'fold', hidden: true, 'data-act': act + '-body' }, body);
      var row = el('button', { class: 'row-card', type: 'button', 'aria-expanded': 'false', 'data-act': act, onclick: function () { open = !open; if (open) box.removeAttribute('hidden'); else box.setAttribute('hidden', ''); row.setAttribute('aria-expanded', String(open)); } },
        el('span', { class: 't' }, label), n !== null ? el('span', { class: 'n' }, String(n)) : null, el('span', { class: 'chev' }, ic('chev')));
      return [row, box];
    }
    var qBody = mk.length ? mk.map(function (m) { return el('div', {}, el('b', { lang: 'ko' }, m.text), ' · ', m.status === 'approved' ? '✓' : m.status === 'dismissed' ? '✓' : '…'); }) : [el('div', { class: 'cap' }, L.noneYet)];
    // T146j 단원: 단원마다 한 줄(여러 날이어도) + 수업 복습 따로 한 줄. 누르면 단원 상세
    var Ls = p.lessons || { units: [], reviews: [] }, items = Ls.units.map(function (u) { return { u: u }; }).concat(Ls.reviews.map(function (r) { return { r: r }; }))
      .sort(function (a, b) { var x = (a.u || a.r).last, y = (b.u || b.r).last; return x < y ? 1 : x > y ? -1 : 0; });
    var uBody = items.length ? items.map(function (x) {
      var o = x.u || x.r, r = o.total ? o.done / o.total : 0;
      return el('button', { class: 'ls-row', type: 'button', 'data-act': 'lesson', 'data-unit': x.u ? x.u.unit_id : 'review-' + x.r.lesson_date, onclick: function () { self.renderLesson(x); } },
        el('span', { class: 'ls-t' }, x.u ? unitLabel(x.u) : reviewLabel(x.r)), el('span', { class: 'prog' }, el('i', { style: { width: Math.round(r * 100) + '%' } })), el('span', { class: 'cap' }, o.done + '/' + o.total));
    }) : [el('div', { class: 'cap' }, L.noneYet)];
    scr.appendChild(el('div', { class: 'list' }, fold(L.qs, mk.length, qBody, 'p-questions'), fold(L.ls, items.length, uBody, 'p-lessons')));
    return this.shell(top, scr, null);
  };

  /* T146j 단원 이름 = 학생 언어로 ("Unit 44 · Places — 어디에 있어요?" / "44과 · 어디에 있어요?"). 내부 이름(st_·예습·MY-) 안 씀 */
  function umeta(u) { return (window.UNIT_META || {})[u.unit_id] || {}; }
  function unitLabel(u) {
    var m = umeta(u), t = m.t || (/st_|예습|MY-/.test(u.title_ko || '') ? '' : u.title_ko || ''), n = m.n || u.n;
    return U.tx('Unit ' + n + (m.te ? ' · ' + m.te : '') + (t ? ' — ' + t : ''), n + '과' + (t ? ' · ' + t : ''), 2);
  }
  function mdy(s) { var p = String(s || '').split('-'); return Number(p[1]) + '/' + Number(p[2]); }
  function reviewLabel(r) {
    var us = (r.units || []).slice().sort(function (a, b) { return a - b; });
    return U.tx(mdy(r.lesson_date) + ' lesson review · ' + (us.length ? 'words from units ' + us.join(', ') : 'words from several units'),
      mdy(r.lesson_date) + ' 수업 복습 · ' + (us.length ? us.join(', ') + '과 단어' : '여러 단원 단어'), 2);
  }
  var FLASH_BASE = 'https://g4jy.github.io/kwd-app-preview/';   // T146q = 서버 FLASHCARD_URL_DEFAULT
  /** 단원 상세: 이름 · 진행(끝낸 문항/전체) · 문형 · 배울 단어 · 예문 · 그 날 과제로 가기 */
  App.prototype.renderLesson = function (x) {
    var self = this, o = x.u || x.r, m = x.u ? umeta(x.u) : {};
    this.view = 'lesson';
    var top = el('header', { class: 'bar-top back' }, iconBtn('back', L.back, function () { self.view = 'progress'; self.drawProgress(self._prog); }, { 'data-act': 'lesson-back' }), el('h1', {}, L.ls));
    var scr = el('section', { class: 'screen', 'data-act': 'lesson-detail' });
    scr.appendChild(el('div', { class: 'card2' }, el('h2', { class: 'ls-h' }, x.u ? unitLabel(x.u) : reviewLabel(x.r)),
      prog(o.total ? o.done / o.total : 0), el('p', { class: 'cap', 'data-act': 'lesson-progress' }, o.done + ' / ' + o.total + ' ' + U.tx('items done', '문항 끝'))));
    if (m.g) scr.appendChild(el('div', { class: 'card2', 'data-act': 'lesson-pattern' }, el('b', {}, U.tx('Pattern', '문형', 2)), el('p', { lang: 'ko', class: 'ls-k' }, m.g), m.ge ? el('p', { class: 'small', lang: 'en' }, m.ge) : null));
    var ws = x.u ? (x.u.words || []) : (x.r.words || []).map(function (k) { return [k, '', '']; });
    if (ws.length) scr.appendChild(el('div', { class: 'card2', 'data-act': 'lesson-words' }, el('b', {}, U.tx('Words', '단어', 2)),
      el('div', { class: 'ls-words' }, ws.map(function (w) { return el('span', { class: 'ls-w' }, el('span', { lang: 'ko' }, w[0]), w[1] ? el('span', { class: 'small', lang: 'en' }, U.cardEn({ en: w[1], pos: w[2] })) : null); }))));
    var exs = x.u ? (x.u.examples || []) : [];
    if (exs.length) scr.appendChild(el('div', { class: 'card2', 'data-act': 'lesson-examples' }, el('b', {}, U.tx('Examples', '예문', 2)), exs.map(function (e) {
      var en = el('span', { class: 'small', lang: 'en' }, e[1] || '');
      if (!e[1]) U.exEn(e[0]).then(function (v) { if (v) en.textContent = v; else en.remove(); });
      return el('div', { class: 'cn-ex' }, el('span', { lang: 'ko' }, e[0]), en);
    })));
    // T146q (선생님 A11) 이 단원 공부하기: 앱 단어 카드(그 단원 K세트, 링크 꼴은 앱 T155 와 맞춤 [기본안]) · 연습 = 이 단원 과제 날 중 오늘까지 가장 최근 날
    var study = el('div', { class: 'ls-study', 'data-act': 'lesson-study' });
    if ((m.k || []).length) study.appendChild(el('a', { class: 'btn pri', href: FLASH_BASE + '?sets=' + encodeURIComponent(m.k.join(',')), target: '_blank', rel: 'noopener', 'data-act': 'lesson-flash' }, U.tx('Study these words with flashcards', '이 단원 단어 카드로 공부', 1)));
    var td = ((self.data || {}).day || {}).local_date || '', dl = (o.days || []).slice().sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var pick = dl.filter(function (dd) { return !td || dd[0] <= td; }).pop() || dl[0];   // 오늘까지 중 가장 최근 날(없으면 첫날)
    if (pick) study.appendChild(B(U.tx('Practice this unit', '이 단원 연습 문제', 1), '', function () { self.goDay(pick[1]); }, { 'data-act': 'lesson-practice', 'data-date': pick[0] }));
    if (study.childNodes.length) scr.appendChild(study);
    scr.appendChild(el('div', { class: 'card2', 'data-act': 'lesson-days' }, el('b', {}, U.tx('Homework days', '과제 날', 2)),
      el('div', { class: 'ls-days' }, (o.days || []).slice().reverse().map(function (dd) {
        return B(mdy(dd[0]), 'ghost sm', function () { self.dayOverride = dd[1]; self.view = 'list'; self.load(true); }, { 'data-act': 'lesson-day', 'data-date': dd[0] });
      }))));
    return this.shell(top, scr, null);
  };

  /* ---------- 메뉴(알림 옆): 알림·선생님 설명·지난 세트 · 쉬기 · 쓰기 방식 · 카드 타자 · 언어 · 알림 받기 ---------- */
  App.prototype.sheet = function (title, rows, act) {
    var sh = el('div', { class: 'sheet bottom', role: 'dialog', 'aria-label': title, 'data-act': act }, el('div', { class: 'wrap' }, el('h2', {}, title), rows,
      B(L.close, '', function () { sh.remove(); }, { 'data-act': act + '-close' })));
    sh.addEventListener('click', function (e) { if (e.target === sh) sh.remove(); });
    document.body.appendChild(sh);
    return sh;
  };
  function mrow(icon, text, right, fn, act) {
    return el(fn ? 'button' : 'div', { class: 'row-card' + (fn ? '' : ' static'), type: fn ? 'button' : null, 'data-act': act, onclick: fn || null },
      icon ? el('span', { class: 'ic' }, ic(icon)) : null, el('span', { class: 't wrap2' }, text), right ? el('span', { class: 'n' }, right) : null);
  }
  App.prototype.openMenu = function () {
    var self = this, d = this.data, rows = [], sh = null;
    function go(fn) { return function () { if (sh) sh.remove(); fn(); }; }
    (d.unread_notifs || []).slice(0, 2).forEach(function (n) { rows.push(mrow('bell', n.message || L.today, null, go(function () { self.openNotif(n); self.render(); }), 'notif')); });
    var ans = (d.marks || []).filter(function (m) { return m.status === 'approved'; });
    if (ans.length) rows.push(mrow('chat', L.explained + ': ' + ans.slice(0, 2).map(function (m) { return m.text; }).join(', '), null, null, 'marks-answered'));
    (d.previous || []).filter(function (p) { return p.feedback || p.status === 'partial'; }).slice(0, 2).forEach(function (p) {
      rows.push(mrow(p.feedback ? 'chat' : 'clock', H.dayName(p.local_date, d.day.local_date) + ' · ' + (p.feedback ? p.feedback + ' ' + L.comments : L.notDone), null, go(function () { self.dayOverride = p.dayset_id; self.view = 'list'; self.load(true); }), 'previous'));
    });
    rows.push(mrow('chart', L.prog, null, go(function () { self.renderProgress(); }), 'progress'));
    var day = this.day;
    if (!this.dayOverride && day && !day.skipped_at && day.tasks.length && day.tasks.some(function (t) { return !finished(t); }))
      rows.push(mrow('moon', L.busy, null, go(function () { self.askSkip(); }), 'busy'));
    rows.push(mrow('gear', L.settings, null, go(function () { self.openSettings(); }), 'settings'));   // T146a 설정은 한 줄 → 설정 화면
    sh = this.sheet(L.menu, rows, 'menu-sheet');
  };
  /* ---------- T146a 설정 화면: 언어(4단계) · 한국어 쓰기 · 단어 카드 타자(스위치) · 영어 답 방식 · 알림 ---------- */
  App.prototype.openSettings = function () { this._back = this.view === 'task' ? 'task' : 'list'; this.view = 'settings'; this.render(); window.scrollTo(0, 0); };
  function grow(label, sub, right, fn, act, attrs) {
    return el(fn ? 'button' : 'div', Object.assign({ class: 'grow-row', type: fn ? 'button' : null, 'data-act': act, onclick: fn || null }, attrs || {}),
      el('span', { class: 'fill' }, el('span', {}, label), sub ? el('span', { class: 'sub1' }, sub) : null), right);
  }
  App.prototype.renderSettings = function () {
    var self = this, back = this._back || 'list';
    var top = el('header', { class: 'bar-top back' }, iconBtn('back', L.back, function () { self.view = back; self.render(); }, { 'data-act': 'close-settings' }), el('h1', {}, L.settings));
    var scr = el('section', { class: 'screen', 'data-act': 'settings' });
    var lv = U.level(), lname = LANGS.filter(function (x) { return x[0] === lv; })[0][1];
    scr.appendChild(el('div', { class: 'glabel' }, L.lang));
    var rsw = el('input', { type: 'checkbox', class: 'switch', role: 'switch', 'aria-label': L.roman, 'data-act': 'set-roman', onchange: function () { U.setRoman(rsw.checked); } });
    rsw.checked = U.roman();
    scr.appendChild(el('div', { class: 'glist' }, grow(lname, null, el('span', { class: 'chev' }, ic('chev')), function () { self.view = 'langs'; self.render(); window.scrollTo(0, 0); }, 'set-lang'),
      el('label', { class: 'grow-row', 'data-act': 'set-roman-row' }, el('span', { class: 'fill' }, el('span', {}, L.roman), el('span', { class: 'sub1' }, L.romanNote)), rsw)));   // T146k 로마자 (단어 + 예문 작은 줄)
    scr.appendChild(el('div', { class: 'glabel' }, L.writing));
    var wm = { pad: L.pad, paper: L.paper, type: L.typing }[U.writeMode()] || U.tx('Not chosen yet', '아직 안 골랐어요');
    scr.appendChild(el('div', { class: 'glist' },
      grow(L.writing, null, el('span', { class: 'val' }, wm), function () { self.askWrite(function () { self.render(); }, true); }, 'set-write')));   // T146k 카드 입력칸은 늘 있음(R20) → '카드 타자' 스위치 뺌
    scr.appendChild(el('div', { class: 'glabel' }, L.ansEn));
    var em = U.enMode();
    scr.appendChild(el('div', { class: 'glist', role: 'radiogroup', 'aria-label': L.ansEn }, ['type', 'speak', 'photo'].map(function (m) {
      return grow(U.tx(U.EN_MODES[m][0], U.EN_MODES[m][1], 2), null, el('span', { class: 'ok' }, m === em ? ic('check') : null), function () { U.setEnMode(m); self.render(); }, 'set-en-' + m, { role: 'radio', 'aria-checked': String(m === em) });
    })));
    scr.appendChild(el('p', { class: 'gfoot' }, L.ansNote));
    if (!U.PREVIEW) {
      scr.appendChild(el('div', { class: 'glabel' }, L.remind));
      scr.appendChild(el('div', { class: 'glist' }, grow(L.remind, null, el('span', { class: 'chev' }, ic('chev')), function () { self.enablePush(); }, 'set-push')));
    }
    return this.shell(top, scr, null);
  };
  App.prototype.renderLangs = function () {
    var self = this, cur = U.level();
    var top = el('header', { class: 'bar-top back' }, iconBtn('back', L.back, function () { self.view = 'settings'; self.render(); }, { 'data-act': 'close-langs' }), el('h1', {}, L.lang));
    var scr = el('section', { class: 'screen', 'data-act': 'langs' });
    scr.appendChild(el('div', { class: 'glabel' }, L.langQ));
    scr.appendChild(el('div', { class: 'glist', role: 'radiogroup', 'aria-label': L.lang }, LANGS.map(function (x) {
      return grow(x[1], x[2] + ' — ' + x[3], el('span', { class: 'ok' }, x[0] === cur ? ic('check') : null), function () {
        U.setLevel(x[0]); L = mkL(); self.render();
      }, 'lang-' + x[0], { role: 'radio', 'aria-checked': String(x[0] === cur), lang: x[0] === 'ko' ? 'ko' : null });
    })));
    scr.appendChild(el('p', { class: 'gfoot' }, L.langNote));
    scr.appendChild(langPreview(cur));
    return this.shell(top, scr, null);
  };
  /* T146g 고른 단계로 보이는 화면 미리 보기 (플래시카드 앱 설정 langPreview 와 같은 방식: 한국어로 바뀌는 곳에 표시) */
  function langPreview(k) {
    var n = U.TIER[k] || 0;
    function pk(key, sub) { var ko = n >= tierOf(key), v = sub ? S[ko ? 'ko' : 'en'][key][sub] : S[ko ? 'ko' : 'en'][key]; return ko ? el('mark', { lang: 'ko' }, v) : el('span', { lang: 'en' }, v); }
    var help = n >= 3 ? el('mark', { lang: 'ko' }, '‘안경을 쓰다’처럼 ‘쓰다’와 같이 써요.') : el('span', { lang: 'en' }, 'We say 안경을 쓰다 (“wear glasses”) with 쓰다.');
    return el('div', { class: 'lprev', 'data-act': 'lang-preview', 'aria-label': n >= 2 ? '미리 보기' : 'Preview' },
      el('div', { class: 'lp-cap' }, n >= 2 ? '미리 보기' : 'Preview'),
      el('div', { class: 'lp-title' }, pk('g', 'words')),
      el('div', { class: 'lp-word', lang: 'en' }, 'glasses'), el('div', { class: 'lp-mean', lang: 'ko' }, '안경'),
      el('div', { class: 'lp-card' }, el('b', {}, pk('tNote')), help),
      el('div', { class: 'lp-btns' }, el('span', { class: 'lp-btn' }, pk('again')), el('span', { class: 'lp-btn pri' }, pk('got'))));
  }
  /* T146a 단어 시험 전체 건너뛰기 확인 (v2 판) */
  App.prototype.askSkipAll = function (t) {
    var self = this, sh = null, left = (t._q && t._q.length) || t.steps.filter(function (s) { return !s.sub; }).length;
    sh = this.sheet(L.skipAllQ, [el('p', { class: 'small', 'data-act': 'skip-all-note' }, L.skipAllNote.replace('{n}', left)),
      el('div', { class: 'actions' }, B(L.skipAllOk, 'pri', function () { sh.remove(); self.skipTask(t); }, { 'data-act': 'skip-all-confirm' }))], 'skip-all-sheet');
    var cl = sh.querySelector('[data-act="skip-all-sheet-close"]'); if (cl) cl.textContent = L.keep;
    return sh;
  };
  App.prototype.askSkip = function () {
    var self = this, sh = null;
    sh = this.sheet(L.restQ, [el('div', { class: 'actions' }, B(L.restOk, 'pri', function () { sh.remove(); self.skip(false); }, { 'data-act': 'skip-confirm' }))], 'skip-sheet');
  };
  App.prototype.askWrite = function (then, change) {
    var self = this, touch = U.hasTouch(), sh = null, opts = [['pad', L.pad], ['paper', L.paper]];
    if (this.data.student.allow_type) opts.push(['type', L.typing]);
    var sug = touch ? 'pad' : 'paper';
    sh = this.sheet(L.howWrite, opts.map(function (o) {
      return mrow(o[0] === 'pad' ? 'pen' : o[0] === 'paper' ? 'book' : 'lines', o[1], o[0] === (change ? U.writeMode() : sug) ? '✓' : null, function () {
        U.setWriteMode(o[0]); U.call('student.device', { key: self.key, mode: o[0], touch: touch }).catch(function () {}); sh.remove(); then();
      }, 'mode-' + o[0]);
    }), 'device-ask');
  };
  App.prototype.deviceAsk = function () { return null; };

  /* 다시 불러와도 지금 보던 카드 면(답면·녹음·펼침)은 그대로 */
  var oldReload = App.prototype.reloadDay;
  App.prototype.reloadDay = function () {
    var keep = {}, F = ['_phase', '_typed', '_rec', '_more', '_draft', '_lastImg', '_lastTyped', '_skipW', '_enPick'];
    (this.day ? this.day.tasks : []).forEach(function (t) { keep[t.task_id] = t; });
    var self = this;
    return oldReload.call(this).then(function (r) {
      var again = false;
      self.day.tasks.forEach(function (t) { var o = keep[t.task_id]; if (o) F.forEach(function (f) { if (o[f] !== undefined && t[f] === undefined) { t[f] = o[f]; again = true; } }); });
      if (again) self.render();
      return r;
    });
  };

  /* 쉬기 · 되돌리기: 목록으로 */
  var oldSkip = App.prototype.skip;
  App.prototype.skip = function (undo) { this.view = 'list'; return oldSkip.call(this, undo); };

  var oldMount = SA.mount;
  SA.mount = function (root, opts) {
    document.documentElement.classList.add('v2');
    var a = oldMount(root, opts);
    return a;
  };
  SA.V2 = true;
})();
