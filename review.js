/* review.js — 선생님 숙제 검토 (10/20 선생님 지시: 처음에는 선생님이 보고 승인한 세트만 학생에게)
 * review.html#t=<선생님 키> — 폰에서도. 학생 목록 → 학생마다 날짜별 세트(지난 7일 + 앞으로 7일, 없으면 지금 만듦)
 * 세트마다: [학생 화면 보기](student.html?k=…#preview&t=…&d=…) · [정답·출처] · 메모(한두 줄, 수업 후 자동화가 다음 과제 만들 때 읽음) · [승인]
 * 승인 전 세트는 학생에게 지난 복습만 보임. 선생님 키는 # 뒤에만 (서버 주소로 보내는 요청 안에만 들어감)
 */
(function () {
  'use strict';
  var U = window.UI, el = U.el, btn = U.btn;
  var TK = U.hs('t');
  var KIND = { cards_review: '복습', cards_new: '새 단어', ctx: '문맥', grammar: '문형', grammar_choice: '문형 고르기', grammar_hand: '문형 손글씨', sp_ko_en: '한영', sp_en_ko: '영한', sp_qa: '질문', mission: '미션', reading: '읽기', write: '쓰기' };
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var root = document.getElementById('app');

  function call(a, p) { return U.call(a, Object.assign({ tkey: TK }, p || {})); }
  function md(ymd) { var d = new Date(ymd + 'T12:00:00Z'); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '(' + DOW[d.getUTCDay()] + ')'; }
  function show(node) { root.innerHTML = ''; root.appendChild(node); window.scrollTo(0, 0); }
  function fail(e) { show(el('div', { class: 'wrap' }, el('div', { class: 'card' }, el('h2', {}, '열 수 없어요'), el('p', { class: 'small' }, e && e.message === 'bad teacher key' ? '선생님 링크를 다시 확인해 주세요.' : '인터넷을 확인하고 다시 열어 주세요. (' + (e && e.message) + ')')))); }

  function list() {
    show(U.loading('불러오는 중…'));
    call('teacher.board').then(function (b) {
      var w = el('div', { class: 'wrap' }, el('div', { class: 'top' }, el('div', { class: 'brand' }, '숙제 ', el('b', {}, '검토')), el('span', { class: 'grow' })),
        el('p', { class: 'small' }, '학생을 눌러 날짜별 숙제를 보고 [승인]하세요. 승인 전 숙제는 학생에게 안 나가요 (지난 복습만 보여요).'));
      b.students.slice().sort(function (a, c) { return String(a.name).localeCompare(String(c.name)); }).forEach(function (s) {
        w.appendChild(el('button', { class: 'rv-stu', type: 'button', 'data-sid': s.student_id, onclick: function () { student(s.student_id); } },
          el('span', { class: 'grow' }, el('b', {}, s.name), ' ', el('span', { class: 'small' }, s.student_id + ' · ' + (s.band || '') + ' · 하루 ' + (s.daily_min || '') + '분')),
          el('span', { class: 'chev' }, '›')));
      });
      show(w);
    }, fail);
  }

  function student(sid) {
    show(U.loading('날짜별 숙제 만드는 중… (처음엔 조금 걸려요)'));
    call('teacher.plan', { student_id: sid, days: 7 }).then(function (pl) {
      var s = pl.student, w = el('div', { class: 'wrap' });
      w.appendChild(btn('← 학생 목록', 'ghost sm', list, { 'data-act': 'back' }));
      w.appendChild(el('h2', {}, s.name, ' ', el('span', { class: 'small' }, s.student_id + ' · ' + s.band + (s.level ? ' · ' + s.level : '') + ' · 하루 ' + s.daily_min + '분')));
      if (!pl.gate) w.appendChild(el('p', { class: 'small' }, '지금은 검토 관문이 꺼져 있어요 (승인 없이도 학생에게 나감).'));
      var waiting = pl.days.filter(function (d) { return !d.past && !d.approved_at; });
      if (waiting.length) w.appendChild(btn('앞으로 ' + waiting.length + '일 모두 승인', 'sm', function () {
        if (!confirm(waiting.length + '일치를 한 번에 승인할까요?')) return;
        call('teacher.approve_day', { dayset_ids: waiting.map(function (d) { return d.dayset_id; }), approve: true }).then(function () { U.toast('승인했어요'); student(sid); }, function (e) { U.toast('실패: ' + e.message); });
      }, { 'data-act': 'approve-all' }));
      var re = function () { student(sid); };
      pl.days.filter(function (d) { return !d.past; }).forEach(function (d) { w.appendChild(dayCard(s, d, re)); });   // 오늘·앞날 먼저
      var past = pl.days.filter(function (d) { return d.past; }).reverse();
      if (past.length) { w.appendChild(el('h3', { class: 'small', style: { marginTop: '18px' } }, '지난 날 (보기·메모만)')); past.forEach(function (d) { w.appendChild(dayCard(s, d, re)); }); }
      show(w);
    }, fail);
  }

  function dayCard(s, d, reload) {
    var box = el('div', { class: 'rv-day' + (d.approved_at ? ' ok' : '') + (d.past ? ' past' : ''), 'data-day': d.dayset_id });
    var chips = el('div', { class: 'rv-chips' });
    if (!d.blocks) Object.keys(d.kinds).forEach(function (k) { chips.appendChild(el('span', { class: 'chip' }, (KIND[k] || k) + ' ' + d.kinds[k])); });
    d.custom.forEach(function (c) { chips.appendChild(el('span', { class: 'chip k' }, '맞춤 ' + c + '일차')); });
    if (d.mode === 'lite') chips.appendChild(el('span', { class: 'chip' }, '가볍게(절반)'));
    var state = d.approved_at ? '✓ 승인됨' : d.past ? '지난 날' : '승인 대기';
    box.appendChild(el('div', { class: 'rv-head' }, el('b', {}, md(d.date)), el('span', { class: 'small' }, '약 ' + Math.round(d.est_min) + '분 / 하루 ' + d.budget_min + '분'),
      el('span', { class: 'grow' }), el('span', { class: 'chip ' + (d.approved_at ? 'done' : 'todo'), 'data-act': 'state' }, state)));
    box.appendChild(chips);
    if (d.blocks) box.appendChild(blockTable(d.blocks));
    if (d.opened_at || d.skipped_at) box.appendChild(el('div', { class: 'small' }, d.skipped_at ? '학생이 쉬는 날로 넘김' : '학생이 열어 봄 · ' + d.status));
    var key = el('div', { class: 'rv-key', hidden: true });
    var note = el('textarea', { class: 'rv-note', placeholder: '메모 (한두 줄) — 다음 과제 만들 때 반영돼요', 'data-act': 'note' });
    note.value = d.review_note || '';
    var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'student.html?k=' + encodeURIComponent(s.key) + '#preview&t=' + encodeURIComponent(TK) + '&d=' + encodeURIComponent(d.dayset_id);
    var acts = el('div', { class: 'rv-actions' },
      el('a', { class: 'btn sm', href: url, target: '_blank', rel: 'noopener', 'data-act': 'preview' }, '학생 화면'),
      el('a', { class: 'btn ghost sm', href: url.replace('student.html', 'student2.html'), target: '_blank', rel: 'noopener', 'data-act': 'preview-v2' }, '새 화면(시안)'),
      btn('정답·출처', 'ghost sm', function () { toggleKey(s, d, key); }, { 'data-act': 'key' }),
      btn('메모 저장', 'ghost sm', function () { save({ note: note.value }, '메모 저장했어요'); }, { 'data-act': 'save-note' }),
      d.past ? null : d.approved_at ? btn('승인 취소', 'ghost sm', function () { save({ approve: false, note: note.value }, '승인 취소'); }, { 'data-act': 'unapprove' })
        : btn('✓ 승인', 'primary sm', function () { save({ approve: true, note: note.value }, '승인했어요 — 학생에게 나가요'); }, { 'data-act': 'approve' }));
    function save(f, msg) { call('teacher.approve_day', Object.assign({ dayset_id: d.dayset_id }, f)).then(function () { U.toast(msg); reload(); }, function (e) { U.toast('실패: ' + e.message); }); }
    box.appendChild(note); box.appendChild(acts); box.appendChild(key);
    return box;
  }

  // T106: 블록 하나 = 안의 항목 n개 × 항목당 분. 근거 = Code.gs COST_BY(이 레벨) × 이 학생 속도, 시간표 hw_time_model.json item_minutes 열쇠
  var UNIT = { card: '장', question: '질문', task: '개' };
  function blockTable(bs) {
    var tb = el('table', { class: 'rv-blocks', 'data-act': 'blocks' }, el('tr', {}, el('th', {}, '블록'), el('th', { class: 'n' }, '항목'), el('th', { class: 'n' }, '항목당'), el('th', { class: 'n' }, '합')));
    bs.forEach(function (b) {
      var why = b.base_min != null ? b.cost_key + ' ' + b.base_min + '분 × 속도 ' + b.speed : b.cost_key === 'reading' ? '읽기 식(글자·질문·낭독) × 속도 ' + b.speed : '맞춤 문항 값 × 속도 ' + b.speed;
      tb.appendChild(el('tr', { 'data-kind': b.kind },
        el('td', {}, el('div', {}, (KIND[b.kind] || b.kind) + (b.custom ? ' (맞춤)' : '')), el('div', { class: 'why' }, why + (b.model_key ? ' · 시간표 ' + b.model_key : ''))),
        el('td', { class: 'n' }, b.items + UNIT[b.unit]), el('td', { class: 'n' }, b.per_item.toFixed(2) + '분'), el('td', { class: 'n' }, b.est.toFixed(1) + '분')));
    });
    return tb;
  }

  function toggleKey(s, d, box) {
    if (!box.hidden) { box.hidden = true; return; }
    box.hidden = false; box.innerHTML = ''; box.appendChild(el('div', { class: 'small' }, '불러오는 중…'));
    call('teacher.day', { student_id: s.student_id, dayset_id: d.dayset_id }).then(function (r) {
      box.innerHTML = '';
      r.day.tasks.forEach(function (t) {
        var k = t.answer_key || {}, src = k.source || {}, lines = [];
        if (k.words) lines.push(k.words.map(function (w) { return w.display + ' = ' + w.en; }).join(' · '));
        ['en_answers', 'ko_answers'].forEach(function (f) { if (k[f]) lines.push('정답: ' + k[f].join(' / ')); });
        if (k.model_a) lines.push('모범 답: ' + k.model_a);
        if (k.model) lines.push('모범: ' + k.model);
        if (k.options && k.answer !== undefined) lines.push('정답 보기: ' + k.options[k.answer] + '  (보기 ' + k.options.join(' · ') + ')');
        if (k.answers) lines.push(((t.questions || []).some(function (q) { return q && q.type === 'opinion'; }) ? '읽기 답 예시(학생마다 다름): ' : '읽기 답: ') + k.answers.filter(String).join(' / '));   // T128b 학생에게 묻는 질문은 정답이 아니라 예시
        if (k.full) lines.push('문장: ' + k.full + (k.sentence_en ? ' — ' + k.sentence_en : ''));
        box.appendChild(el('div', { class: 't' }, (t.title_ko || t.type) + ' · ' + String(t.preview || '').slice(0, 40)));
        lines.forEach(function (l) { box.appendChild(el('div', {}, l)); });
        box.appendChild(el('div', { class: 'small' }, '출처: ' + (src.unit_id || '') + (src.item_id ? ' · ' + src.item_id : '') + (src.custom ? ' · 맞춤 ' + src.custom.day + '일차' : '') + (src.repeat ? ' · 다시 하는 문장' : '') + (k.why ? ' · 이유: ' + k.why : '') + (k.src ? ' · 예문 ' + k.src : '')));
      });
    }, function (e) { box.innerHTML = ''; box.appendChild(el('div', { class: 'small' }, '못 불러왔어요: ' + e.message)); });
  }

  if (!TK) show(el('div', { class: 'wrap' }, el('div', { class: 'card' }, el('h2', {}, '선생님 링크가 필요해요'), el('p', { class: 'small' }, '바탕 화면의 “KWD 숙제 검토” 바로가기로 여세요.'))));
  else list();
})();
