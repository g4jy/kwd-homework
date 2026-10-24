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
  function normalize(s) {
    return String(s || '').normalize('NFC').replace(/[.,!?~·…"'“”‘’]/g, '').replace(/\s+/g, ' ').trim();
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
  /** 0..1 자모 유사도. 같으면 1, 띄어쓰기만 틀리면 0.95, 그 밖에는 최대 0.9. */
  function similarity(answer, target) {
    var a = normalize(answer), t = normalize(target);
    if (!a && !t) return 1;
    if (a === t) return 1;
    var ja = disassemble(a.replace(/ /g, '')), jt = disassemble(t.replace(/ /g, ''));
    if (ja === jt) return 0.95; // 띄어쓰기만 다름
    var d = lev(ja, jt);
    // 철자가 하나라도 다르면 '맞음'이 될 수 없음 → 최대 0.9 (거의 맞음)
    return Math.min(0.9, Math.max(0, 1 - d / Math.max(ja.length, jt.length, 1)));
  }
  /** 정답 후보 여러 개 중 최고 점수. status: correct / close / wrong */
  function check(answer, targets) {
    var best = { score: 0, target: targets[0] || '' };
    for (var i = 0; i < targets.length; i++) {
      var s = similarity(answer, targets[i]);
      if (s > best.score) best = { score: s, target: targets[i] };
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
  root.Hangul = { disassemble: disassemble, similarity: similarity, check: check, diff: diff, hint: hint, normalize: normalize };
})(typeof window !== 'undefined' ? window : this);
