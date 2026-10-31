/* pron.js — 표준 발음 보여 주기: "먹어요 → [머거요] 연음". 단어 카드·문장 답 공개 때 씀 (한국어의 5가지 어려움 중 '소리 바뀜').
 * 어절 안에서만 적용: ㅎ 탈락·격음화 → 구개음화 → 연음 → 받침 대표음 → 비음화 → 유음화 → 경음화 (+ 관형사형 ㄹ 뒤 거/것/게/수/지 된소리)
 * 결과: { text: '머거요', rules: ['연음'] } — 철자와 같으면 rules = [].  예외(밟다, 읽고 등)는 다루지 않음 → 선생님이 카드에서 고칠 수 있음.
 */
(function (root) {
  'use strict';
  var CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  var JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  // 겹받침: [남는 것, 뒤로 넘어가는 것]
  var SPLIT = { 'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'] };
  var REP = { 'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄳ': 'ㄱ', 'ㄺ': 'ㄱ', 'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
    'ㅍ': 'ㅂ', 'ㅄ': 'ㅂ', 'ㄿ': 'ㅂ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ', 'ㄻ': 'ㅁ', 'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㅀ': 'ㄹ' };
  var ASP = { 'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅈ': 'ㅊ', 'ㅂ': 'ㅍ' };
  var TENSE = { 'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ' };
  var NASAL = { 'ㄱ': 'ㅇ', 'ㄷ': 'ㄴ', 'ㅂ': 'ㅁ' };

  function parse(word) {
    return Array.from(word).map(function (ch) {
      var n = ch.charCodeAt(0) - 0xAC00;
      if (n < 0 || n > 11171) return { raw: ch };
      return { c: CHO[Math.floor(n / 588)], v: JUNG[Math.floor((n % 588) / 28)], j: JONG[n % 28] };
    });
  }
  function build(syl) {
    return syl.map(function (s) { return s.raw !== undefined ? s.raw : String.fromCharCode(0xAC00 + CHO.indexOf(s.c) * 588 + JUNG.indexOf(s.v) * 28 + JONG.indexOf(s.j)); }).join('');
  }
  function word(w, rules, noTense) {
    var S = parse(w), i, a, b, add = function (r) { if (rules.indexOf(r) < 0) rules.push(r); };
    // 1) ㅎ 받침
    for (i = 0; i < S.length - 1; i++) {
      a = S[i]; b = S[i + 1];
      if (a.raw !== undefined || b.raw !== undefined) continue;
      var hj = a.j === 'ㅎ' ? '' : a.j === 'ㄶ' ? 'ㄴ' : a.j === 'ㅀ' ? 'ㄹ' : null;
      if (hj !== null) {
        if (b.c === 'ㅇ') { a.j = hj; add('ㅎ 탈락'); }
        else if (ASP[b.c]) { a.j = hj; b.c = ASP[b.c]; add('격음화'); }
        else if (b.c === 'ㅅ') { a.j = hj; if (!noTense) b.c = 'ㅆ'; add('경음화'); }
        else if (b.c === 'ㄴ' && hj === '') { a.j = 'ㄴ'; add('비음화'); }
      } else if (b.c === 'ㅎ' && a.j) {   // 받침 + ㅎ → 거센소리
        var keep = SPLIT[a.j] ? SPLIT[a.j][0] : '', last = SPLIT[a.j] ? SPLIT[a.j][1] : a.j;
        var base = REP[last] || last;
        if (ASP[base] || last === 'ㅅ' || last === 'ㅈ' || last === 'ㅊ') {
          var asp = ASP[base] || 'ㅌ';
          if (base === 'ㄷ' && b.v === 'ㅣ') asp = 'ㅊ';   // 닫히다 → 다치다 (구개음화)
          a.j = keep; b.c = asp; add(asp === 'ㅊ' && base === 'ㄷ' ? '구개음화' : '격음화');
        }
      }
    }
    // 2) 구개음화: ㄷ·ㅌ + 이
    for (i = 0; i < S.length - 1; i++) {
      a = S[i]; b = S[i + 1];
      if (a.raw !== undefined || b.raw !== undefined) continue;
      if (b.c === 'ㅇ' && b.v === 'ㅣ' && (a.j === 'ㄷ' || a.j === 'ㅌ' || a.j === 'ㄾ')) {
        b.c = a.j === 'ㄷ' ? 'ㅈ' : 'ㅊ'; a.j = a.j === 'ㄾ' ? 'ㄹ' : ''; add('구개음화');
      }
    }
    // 3) 연음: 받침 + 모음으로 시작하는 음절
    for (i = 0; i < S.length - 1; i++) {
      a = S[i]; b = S[i + 1];
      if (a.raw !== undefined || b.raw !== undefined) continue;
      if (b.c === 'ㅇ' && a.j && a.j !== 'ㅇ') {
        if (SPLIT[a.j]) { b.c = SPLIT[a.j][1]; a.j = SPLIT[a.j][0]; }
        else { b.c = a.j; a.j = ''; }
        add('연음');
      }
    }
    // 4) 받침 대표음 (뒤가 모음이 아닌 곳)
    for (i = 0; i < S.length; i++) { a = S[i]; if (a.raw === undefined && REP[a.j]) a.j = REP[a.j]; }
    // 5–7) 이어지는 자음
    for (i = 0; i < S.length - 1; i++) {
      a = S[i]; b = S[i + 1];
      if (a.raw !== undefined || b.raw !== undefined || !a.j) continue;
      if (b.c === 'ㄹ' && (a.j === 'ㅁ' || a.j === 'ㅇ')) { b.c = 'ㄴ'; add('비음화'); }
      else if (b.c === 'ㄹ' && NASAL[a.j]) { b.c = 'ㄴ'; a.j = NASAL[a.j]; add('비음화'); }
      if ((b.c === 'ㄴ' || b.c === 'ㅁ') && NASAL[a.j]) { a.j = NASAL[a.j]; add('비음화'); }
      else if (a.j === 'ㄴ' && b.c === 'ㄹ') { a.j = 'ㄹ'; add('유음화'); }
      else if (a.j === 'ㄹ' && b.c === 'ㄴ') { b.c = 'ㄹ'; add('유음화'); }
      else if (NASAL[a.j] && TENSE[b.c]) { if (!noTense) b.c = TENSE[b.c]; add('경음화'); }
    }
    return S;
  }
  /** 문장(띄어쓰기 유지) → {text, rules} */
  function pron(text) {
    var rules = [], parts = String(text || '').split(/(\s+)/), out = [];
    for (var k = 0; k < parts.length; k++) {
      var p = parts[k];
      if (!p || /^\s+$/.test(p)) { out.push(p); continue; }
      var S = word(p, rules);
      // 관형사형 ㄹ 뒤 된소리: 갈 거예요 → 갈 꺼예요
      var nxt = parts[k + 2];
      if (nxt && S.length && S[S.length - 1].j === 'ㄹ' && /^(거|것|게|수|지|데|줄)/.test(nxt) && /(을|ㄹ|할|갈|볼|올|먹을|살|될|일)$/.test(p)) {
        var first = nxt.charCodeAt(0) - 0xAC00, c = CHO[Math.floor(first / 588)];
        if (TENSE[c]) { parts[k + 2] = String.fromCharCode(nxt.charCodeAt(0) + (CHO.indexOf(TENSE[c]) - CHO.indexOf(c)) * 588) + nxt.slice(1); if (rules.indexOf('경음화') < 0) rules.push('경음화'); }
      }
      out.push(build(S));
    }
    var t = out.join('');
    return { text: t, rules: t === text ? [] : rules };
  }
  /* T146k 로마자(국어의 로마자 표기법): 소리 바뀜은 따르고 된소리는 표기하지 않음 — 읽다 → ikda, 학생 → haksaeng, 먹어요 → meogeoyo */
  var RC = { 'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h' };
  var RV = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  var RF = { 'ㄱ': 'k', 'ㄴ': 'n', 'ㄷ': 't', 'ㄹ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅇ': 'ng' };
  function roman(text) {
    var parts = String(text || '').split(/(\s+)/), out = [];
    parts.forEach(function (p) {
      if (!p || /^\s+$/.test(p)) { out.push(p); return; }
      var S = word(p, [], true), r = '';
      S.forEach(function (x, i) {
        if (x.raw !== undefined) { r += x.raw; return; }
        var prev = S[i - 1], c = RC[x.c];
        if (x.c === 'ㄹ' && prev && prev.j === 'ㄹ') c = 'l';
        r += c + RV[JUNG.indexOf(x.v)] + (x.j ? (RF[REP[x.j] || x.j] || RF[(SPLIT[x.j] || [x.j])[0]] || '') : '');
      });
      out.push(r);
    });
    return out.join('');
  }
  /* T146k 발음 규칙 한 줄 = 플래시카드 앱 scripts/pron_rules.py RULES 와 같은 글(ko, en, 예). 앱 노트의 pron_why.rules id 를 그대로 씀 */
  var RULES = {
    liaison: ['받침이 뒤의 빈 ㅇ 자리로 넘어가요.', 'A final consonant moves over to the next syllable when it starts with the silent ㅇ.', '먹어요 → [머거요]'],
    liaison2: ['겹받침은 하나만 남고 하나는 뒤로 넘어가요.', 'Of a double final consonant, one stays and one moves to the next syllable.', '읽어요 → [일거요]'],
    tense: ['받침 ㄱ·ㄷ·ㅂ 뒤에서 ㄱ ㄷ ㅂ ㅅ ㅈ는 된소리(ㄲ ㄸ ㅃ ㅆ ㅉ)가 돼요.', 'After a final ㄱ, ㄷ or ㅂ sound, ㄱ ㄷ ㅂ ㅅ ㅈ become tense (ㄲ ㄸ ㅃ ㅆ ㅉ).', '학생 → [학쌩]'],
    tense2: ['이 단어에서는 ㄴ·ㅁ·ㄹ 받침 뒤인데도 된소리로 읽어요. (단어마다 달라서 외워요)', 'In this word the consonant is tense even after ㄴ, ㅁ or ㄹ — it depends on the word, so just remember it.', '신발장 → [신발짱]'],
    nasal: ['ㄴ·ㅁ 앞에서 ㄱ은 ㅇ, ㄷ은 ㄴ, ㅂ은 ㅁ으로 소리 나요.', 'Before ㄴ or ㅁ, a final ㄱ sounds like ㅇ, ㄷ like ㄴ, and ㅂ like ㅁ.', '감사합니다 → [감사함니다]'],
    nasal_l: ['ㅁ·ㅇ 받침 뒤의 ㄹ은 ㄴ으로 소리 나요.', 'After a final ㅁ or ㅇ, ㄹ sounds like ㄴ.', '정류장 → [정뉴장]'],
    nasal_l2: ['ㄱ·ㅂ 받침과 ㄹ이 만나면 둘 다 바뀌어요: 받침은 ㅇ·ㅁ, ㄹ은 ㄴ.', 'When a final ㄱ or ㅂ meets ㄹ, both change: the final becomes ㅇ or ㅁ and the ㄹ becomes ㄴ.', '목록 → [몽녹]'],
    liquid: ['ㄴ은 ㄹ 옆에서 ㄹ로 소리 나요.', 'ㄴ next to ㄹ sounds like ㄹ.', '연락 → [열락]'],
    h_drop: ['ㅎ은 모음 앞에서 소리가 없어요.', 'ㅎ is silent before a vowel.', '좋아요 → [조아요]'],
    asp: ['ㅎ과 ㄱ·ㄷ·ㅂ·ㅈ가 만나면 ㅋ·ㅌ·ㅍ·ㅊ 하나로 합쳐져요.', 'ㅎ next to ㄱ, ㄷ, ㅂ or ㅈ merges into one sound: ㅋ, ㅌ, ㅍ or ㅊ.', '축하 → [추카]'],
    final: ['받침에서는 ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ이 모두 ㄷ, ㅋ ㄲ은 ㄱ, ㅍ은 ㅂ으로 소리 나요.', 'At the end of a syllable ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ all sound like ㄷ, ㅋ and ㄲ like ㄱ, and ㅍ like ㅂ.', '옷 → [옫]'],
    final2: ['겹받침은 소리가 하나만 나요.', 'Only one of a double final consonant is pronounced.', '여덟 → [여덜]'],
    palatal: ["받침 ㄷ·ㅌ 뒤에 '이'가 오면 지·치로 소리 나요.", 'A final ㄷ or ㅌ followed by 이 sounds like 지 or 치.', '같이 → [가치]'],
    n_add: ['받침 뒤에 이·야·여·요·유가 오면 ㄴ 소리가 생겨요.', 'After a final consonant, 이 야 여 요 유 get an added ㄴ sound.', '한여름 → [한녀름]'],
    saisiot: ['이 ㅅ(사이시옷)은 소리가 없고, 뒤의 자음을 된소리로 만들어요.', 'This ㅅ (사이시옷) is silent itself; it makes the next consonant tense.', '바닷가 → [바다까]'],
    oe: ['ㅚ는 요즘 [ㅞ]처럼 소리 내요. 둘 다 맞아요.', 'ㅚ is usually pronounced like ㅞ today; both are accepted.', '퇴근 → [퉤근]'],
    jyeo: ['ㅈ·ㅉ·ㅊ 뒤의 ㅕ는 ㅓ로 소리 나요.', 'After ㅈ, ㅉ or ㅊ, ㅕ sounds like ㅓ.', '가져요 → [가저요]'],
    n_add_l: ['받침 ㄹ 뒤에 이·야·여·요·유가 오면 ㄴ 소리가 생기고, 그 ㄴ은 ㄹ로 바뀌어요.', 'After a final ㄹ, 이 야 여 요 유 get an added ㄴ, which then turns into ㄹ.', '지하철역 → [지하철력]'],
    ui: ["ㅢ는 자음 뒤에서 ㅣ로, 조사 '의'는 ㅔ로 소리 나요.", "ㅢ sounds like ㅣ after a consonant; the particle 의 sounds like ㅔ.", '희망 → [히망]'],
    other: ['이 단어는 소리가 조금 달라요. 들리는 대로 외워요.', 'This word simply sounds a bit different from its spelling — learn it by ear.', '']
  };
  /* 이 파일의 규칙 이름 → 앱 규칙 id (앱 노트가 없을 때) */
  var RID = { '연음': 'liaison', '경음화': 'tense', '비음화': 'nasal', '유음화': 'liquid', 'ㅎ 탈락': 'h_drop', '격음화': 'asp', '구개음화': 'palatal' };
  root.Pron = { pron: pron, roman: roman, RULES: RULES, ruleId: function (k) { return RULES[k] ? k : RID[k] || null; } };
})(typeof window !== 'undefined' ? window : globalThis);
