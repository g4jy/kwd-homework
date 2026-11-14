/* hangul.js — 작은 한글 자모 유틸 (es-hangul 방식, 의존성 없음)
 * 브라우저(window.Hangul)와 Apps Script(전역 Hangul) 양쪽에서 동작.
 * Code.gs 안에 같은 코드가 복사되어 있습니다. 수정하면 두 곳 모두 바꾸세요.
 */
(function (root) {
  var CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  var JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  // 겹모음·겹받침을 기본 자모로 (es-hangul disassemble 과 같은 방식)
  var SPLIT = {
    'ㅘ':'ㅗㅏ','ㅙ':'ㅗㅐ','ㅚ':'ㅗㅣ','ㅝ':'ㅜㅓ','ㅞ':'ㅜㅔ','ㅟ':'ㅜㅣ','ㅢ':'ㅡㅣ',
    'ㄳ':'ㄱㅅ','ㄵ':'ㄴㅈ','ㄶ':'ㄴㅎ','ㄺ':'ㄹㄱ','ㄻ':'ㄹㅁ','ㄼ':'ㄹㅂ','ㄽ':'ㄹㅅ','ㄾ':'ㄹㅌ','ㄿ':'ㄹㅍ','ㅀ':'ㄹㅎ','ㅄ':'ㅂㅅ'
  };
  function isSyllable(c) { var n = c.charCodeAt(0); return n >= 0xAC00 && n <= 0xD7A3; }
  function disassembleChar(c) {
    if (!isSyllable(c)) return SPLIT[c] || c;
    var n = c.charCodeAt(0) - 0xAC00;
    var cho = CHO[Math.floor(n / 588)], jung = JUNG[Math.floor((n % 588) / 28)], jong = JONG[n % 28];
    return cho + (SPLIT[jung] || jung) + (SPLIT[jong] || jong);
  }
  function disassemble(s) { var out = ''; for (var i = 0; i < s.length; i++) out += disassembleChar(s[i]); return out; }
  function normalize(s) {   // T093 '-'·'~' 표기 기호도 지움 (-도 = 도)
    return String(s || '').normalize('NFC').replace(/[.,!?~∼〜·…"'“”‘’\-‐–—•‧∙・●◦。．｡，、！？]/g, '').replace(/\s+/g, ' ').trim();
  }
  var JONG_OF = { 'ㄹ': 8, 'ㄴ': 4, 'ㅁ': 16, 'ㅂ': 17, 'ㅆ': 20 };
  function compose(s) {   // '으ㄹ' → '을' (받침 없는 글자 + 홀로 선 받침 자모)
    return s.replace(/([가-힣])([ㄹㄴㅁㅂㅆ])/g, function (m, a, j) { var n = a.charCodeAt(0) - 0xAC00; return n % 28 ? m : String.fromCharCode(a.charCodeAt(0) + JONG_OF[j]); });
  }
  /** T093 (선생님 11/07 학생) 조사·어미 정답 표기 펼치기: '-도'→도 · '(으)로'→으로·로 · '이/가'→이·가 · '-아/어요'→아요·어요 · '이에요/예요'. 원래 꼴도 남김 */
  function expand(target) {
    var out = [], seen = {};
    function add(x) { x = compose(normalize(x)); if (x && !seen[x]) { seen[x] = 1; out.push(x); } }
    var T0 = String(target || '').normalize('NFC');
    // T183 낱말 뒤 꼴 안내 괄호('발표 (발표하다 / 발표해요)') = 앞 낱말만 써도, 괄호째 따라 써도 맞음(전: 괄호 속 ' / '에서 둘로 쪼개져 무엇을 써도 '거의')
    var ann = /^(.*[가-힣?!.])\s*\(([^()]*(?:\s\/\s|→)[^()]*)\)\s*$/.exec(T0);
    if (ann) {   // 괄호가 앞 낱말의 꼴 안내일 때만: 괄호 속 말에 앞 낱말이 들었거나, 괄호 속 말의 줄기(앞 두 글자)가 앞 낱말에 듦 ('가방이 (있어요 / 없어요)'는 아님)
      var hd = normalize(ann[1]).replace(/ /g, ''), okAnn = false;
      ann[2].split(/\s*(?:\/|→)\s*/).forEach(function (p) {
        var q = normalize(p).replace(/ /g, ''), st = q.replace(/다$/, '').slice(0, 2);
        if (q && (q.indexOf(hd) >= 0 || (st && hd.indexOf(st) >= 0))) okAnn = true;
      });
      if (!okAnn) ann = null;
    }
    if (ann) {
      add(ann[1] + ' ' + ann[2]);
      ann[2].split(/\s*(?:\/|→)\s*/).forEach(function (p) { if (p) add(ann[1] + ' ' + p); });
      T0 = ann[1];
    }
    T0.split(/\s+\/\s+/).forEach(function (alt) {
      var paren = [];
      (function rec(x) {
        var m = /\(([^()]*)\)/.exec(x);
        if (!m) { paren.push(x); return; }
        var a = x.slice(0, m.index), b = x.slice(m.index + m[0].length);
        rec(a + b);
        if (/^[가-힣]{1,2}$/.test(m[1].replace(/[\-~]/g, ''))) rec(a + m[1] + b);
      })(alt);
      paren.forEach(function (x) {
        var alts = [[]];
        normalize(x).split(' ').forEach(function (tk) {
          var opts = [tk];
          if (tk.indexOf('/') > 0 && tk.length <= 12) {
            var ps = tk.split('/').filter(Boolean), last = ps[ps.length - 1]; opts = [];
            ps.forEach(function (p, i) { opts.push(p); if (i < ps.length - 1 && last.length > p.length) opts.push(p + last.slice(p.length)); });
          }
          var nx = []; alts.forEach(function (a) { opts.forEach(function (o) { nx.push(a.concat([o])); }); }); alts = nx.slice(0, 16);
        });
        alts.forEach(function (a) { add(a.join(' ')); });
      });
    });
    return out;
  }
  function lev(a, b) {
    var m = a.length, n = b.length, prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  /** T092b (11/07 '말해주세요' = '말해 주세요') 보조 용언 띄어쓰기는 둘 다 맞음(표준 맞춤법 47항) → 그 자리 띄어쓰기만 붙임.
   *  ① '-아/어' 끝(받침 없는 ㅏ·ㅐ·ㅓ·ㅕ·ㅘ·ㅙ·ㅝ, '-러' 빼고) + 주다·드리다·보다·놓다·두다·버리다·있다·계시다·가다·오다
   *  ② 받침 ㄴ·ㄹ 끝 + 듯·척·체·만·법·성 + 하다/싶다. 명사로 자주 끝나는 낱말(나·저·거·뭐…)은 안 붙임 [기본안] */
  var AUX_VERB = /^(주|줘|줬|줄|줍|준|드리|드려|드렸|드릴|드립|드린|보|봐|봤|볼|봅|본|놓|놔|놨|두|둬|뒀|둘|둡|둔|버리|버려|버렸|버릴|버립|버린|있|계시|계세|계셔|계신|계실|가|갈|갑|간|갔|와|왔|오|올|옵|온)/;
  var AUX_DEP = /^(듯|척|체|만|법|성)(하|해|했|한|할|합|싶)/;
  var AUX_SKIP = { '나': 1, '너': 1, '저': 1, '거': 1, '그거': 1, '이거': 1, '저거': 1, '뭐': 1, '머': 1, '엄마': 1, '아빠': 1, '오빠': 1, '누나': 1, '사과': 1, '바나나': 1, '치마': 1, '여기서': 1, '거기서': 1, '저기서': 1, '나라': 1, '다': 1, '또': 1, '너무': 1, '자주': 1 };
  function auxJoin(s) {
    var tk = String(s || '').replace(/(^| )(듯|척|체|만|법|성) (?=하|해|했|한|할|합|싶)/g, '$1$2').split(' '), out = [];
    for (var i = 0; i < tk.length; i++) {
      var p = out.length ? out[out.length - 1] : '', c = tk[i], last = p.slice(-1), n = last ? last.charCodeAt(0) - 0xAC00 : -1, join = false;
      if (p && n >= 0 && n < 11172 && !AUX_SKIP[p]) {
        var jung = Math.floor((n % 588) / 28), jong = n % 28;
        if (jong === 0 && [0, 1, 4, 6, 9, 10, 14].indexOf(jung) >= 0 && last !== '러' && AUX_VERB.test(c)) join = true;
        else if ((jong === 4 || jong === 8) && AUX_DEP.test(c)) join = true;
      }
      if (join) out[out.length - 1] = p + c; else out.push(c);
    }
    return out.join(' ');
  }
  /** 0..1 자모 유사도. 같으면 1(보조 용언 띄어쓰기는 같음), 띄어쓰기만 틀리면 0.95, 그 밖에는 최대 0.9. */
  function similarity(answer, target) {
    var a = normalize(answer), t = normalize(target);
    if (!a && !t) return 1;
    if (a === t || auxJoin(a) === auxJoin(t)) return 1;
    var ja = disassemble(a.replace(/ /g, '')), jt = disassemble(t.replace(/ /g, ''));
    if (ja === jt) return 0.95; // 띄어쓰기만 다름
    var d = lev(ja, jt);
    // 철자가 하나라도 다르면 '맞음'이 될 수 없음 → 최대 0.9 (거의 맞음)
    var s = Math.min(0.9, Math.max(0, 1 - d / Math.max(ja.length, jt.length, 1)));
    // T146g [기본안] 두 글자 이상 낱말에서 한 글자(음절)만 다르면 '거의 맞음'(0.75) 아래로 내리지 않음
    var sa = Array.from(a.replace(/ /g, '')), st = Array.from(t.replace(/ /g, ''));
    // T131b (선생님 11/10 학생 초등학생 → 초등학교) 한 음절이 통째로 다르면(자모 하나도 안 겹침) 다른 낱말 = 틀림. 받침·모음 하나 다른 오타만 '거의'
    if (sa.length === st.length && st.length >= 2) {
      for (var q = 0; q < st.length; q++) if (sa[q] !== st[q] && isSyllable(sa[q]) && isSyllable(st[q])) {
        var x = disassembleChar(sa[q]), y = disassembleChar(st[q]);
        if (lev(x, y) >= Math.max(x.length, y.length)) return Math.min(s, 0.7);
      }
    }
    if (s < 0.75 && st.length >= 2 && lev(sa, st) === 1) s = 0.75;
    return s;
  }
  /** T131b (학생 11/10 'ㅇ유치원') 조합 중에 남은 홀자모 정리: 다음 글자 첫소리와 같은 홀자음 지움 · 받침 없는 글자 뒤 홀자음 = 받침 · 남은 홀자모 지움.
   *  글자(음절)가 하나도 없는 답·정답이 자모인 문항(한글 코스)은 그대로 */
  var JONG_ALL = {}; JONG.forEach(function (j, i) { if (j) JONG_ALL[j] = i; });
  function cleanJamo(s) {
    s = String(s || '').normalize('NFC');
    if (!/[가-힣]/.test(s) || !/[ㄱ-ㅣ]/.test(s)) return s;
    s = s.replace(/([ㄱ-ㅎ])(?=([가-힣]))/g, function (m, j, nx) { return CHO[Math.floor((nx.charCodeAt(0) - 0xAC00) / 588)] === j ? '' : m; });
    s = s.replace(/([가-힣])([ㄱ-ㅎ])(?![ㅏ-ㅣ])/g, function (m, a, j) { var n = a.charCodeAt(0) - 0xAC00; return n % 28 || !JONG_ALL[j] ? m : String.fromCharCode(a.charCodeAt(0) + JONG_ALL[j]); });
    return s.replace(/[ㄱ-ㅣ]/g, '').replace(/\s+/g, ' ').trim();
  }
  /** 정답 후보 여러 개 중 최고 점수. status: correct / close / wrong */
  function check(answer, targets) {
    var best = { score: 0, target: targets[0] || '' };
    answer = String(answer || '').replace(/[()]/g, '');   // T093 학생이 '(으)로'를 그대로 써도
    if (!targets.some(function (x) { return /[ㄱ-ㅣ]/.test(String(x || '')); })) answer = cleanJamo(answer);   // T131b
    for (var i = 0; i < targets.length; i++) {
      var vs = [targets[i]].concat(expand(targets[i]));
      for (var k = 0; k < vs.length; k++) {
        var s = similarity(answer, vs[k]);
        if (s > best.score) best = { score: s, target: targets[i] };
      }
    }
    best.score = Math.round(best.score * 100) / 100;
    best.status = best.score >= 0.95 ? 'correct' : best.score >= 0.75 ? 'close' : 'wrong';
    // 부분 점수: 0.75 미만은 0점 처리 (오답을 "조금 맞음"으로 보이지 않게)
    best.credit = best.status === 'wrong' ? 0 : best.score;
    return best;
  }
  /** 음절 단위 diff (LCS). [{ch, op:'same'|'del'|'add'}] — del=정답에만, add=답에만 */
  function diff(answer, target) {
    var a = Array.from(normalize(answer)), t = Array.from(normalize(target));
    var m = a.length, n = t.length, L = [], i, j;
    for (i = 0; i <= m; i++) { L[i] = []; for (j = 0; j <= n; j++) L[i][j] = 0; }
    for (i = m - 1; i >= 0; i--) for (j = n - 1; j >= 0; j--)
      L[i][j] = a[i] === t[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = []; i = 0; j = 0;
    while (i < m && j < n) {
      if (a[i] === t[j]) { out.push({ ch: a[i], op: 'same' }); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ ch: a[i], op: 'add' }); i++; }
      else { out.push({ ch: t[j], op: 'del' }); j++; }
    }
    while (i < m) out.push({ ch: a[i++], op: 'add' });
    while (j < n) out.push({ ch: t[j++], op: 'del' });
    return out;
  }
  /** 힌트: 첫 음절의 초성만 (예: 이에요 → ㅇ…) */
  function hint(target) {
    var t = normalize(target); if (!t) return '';
    return disassembleChar(t[0])[0] + '…';
  }
  root.Hangul = { disassemble: disassemble, similarity: similarity, check: check, diff: diff, hint: hint, normalize: normalize, expand: expand, auxJoin: auxJoin, cleanJamo: cleanJamo };
})(typeof window !== 'undefined' ? window : this);
