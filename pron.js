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
  function word(w, rules) {
    var S = parse(w), i, a, b, add = function (r) { if (rules.indexOf(r) < 0) rules.push(r); };
    // 1) ㅎ 받침
    for (i = 0; i < S.length - 1; i++) {
      a = S[i]; b = S[i + 1];
      if (a.raw !== undefined || b.raw !== undefined) continue;
      var hj = a.j === 'ㅎ' ? '' : a.j === 'ㄶ' ? 'ㄴ' : a.j === 'ㅀ' ? 'ㄹ' : null;
      if (hj !== null) {
        if (b.c === 'ㅇ') { a.j = hj; add('ㅎ 탈락'); }
        else if (ASP[b.c]) { a.j = hj; b.c = ASP[b.c]; add('격음화'); }
        else if (b.c === 'ㅅ') { a.j = hj; b.c = 'ㅆ'; add('경음화'); }
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
      else if (NASAL[a.j] && TENSE[b.c]) { b.c = TENSE[b.c]; add('경음화'); }
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
  root.Pron = { pron: pron };
})(typeof window !== 'undefined' ? window : globalThis);
