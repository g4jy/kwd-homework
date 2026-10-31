/* conjugate.js — 동사·형용사 해요체(-아요/어요) 만들기 + 단어 표시 규칙 "가다 / 가요"
 * 브라우저(window.Conjugate)와 Apps Script(전역 Conjugate, apps_script/Conjugate.gs = 이 파일 복사본) 양쪽에서 동작.
 * 파이썬 짝: tools/conjugate.py (같은 규칙, 같은 시험 tests/conjugate_cases.json).
 *
 * 규칙 순서: 특수(이다·아니다·하다) → 뜻이 갈리는 낱말(묻다·걷다·굽다·이르다) → 불규칙(ㅂ·ㄷ·ㅅ·ㅎ·르·으) → 규칙(축약 포함)
 * 결과: { yo, rule, ambiguous, alts:[{sense, yo}] } 또는 null(동사·형용사가 아님)
 */
(function (root) {
  'use strict';
  var CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  var JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  function split(ch) {
    var n = ch.charCodeAt(0) - 0xAC00;
    if (n < 0 || n > 11171) return null;
    return { cho: CHO[Math.floor(n / 588)], jung: JUNG[Math.floor((n % 588) / 28)], jong: JONG[n % 28] };
  }
  function join(cho, jung, jong) {
    return String.fromCharCode(0xAC00 + CHO.indexOf(cho) * 588 + JUNG.indexOf(jung) * 28 + JONG.indexOf(jong || ''));
  }
  function bright(v) { return v === 'ㅏ' || v === 'ㅑ' || v === 'ㅗ'; }   // 양성 모음 → -아요

  // 같은 모양, 다른 뜻 → 활용이 갈림. gloss(영어 뜻)의 낱말로 고르고, 못 고르면 ambiguous=true
  var AMBIG = {
    '묻다': { def: 'ask', senses: [
      { sense: 'ask', yo: '물어요', keys: ['ask', 'question', 'inquire'] },
      { sense: 'bury', yo: '묻어요', keys: ['bury', 'stain', 'smear', 'stick'] }] },
    '걷다': { def: 'walk', senses: [
      { sense: 'walk', yo: '걸어요', keys: ['walk'] },
      { sense: 'roll up / collect', yo: '걷어요', keys: ['roll', 'fold', 'collect', 'gather', 'lift', 'clear'] }] },
    '굽다': { def: 'bake', senses: [
      { sense: 'bake / grill', yo: '구워요', keys: ['bake', 'grill', 'roast', 'toast', 'broil'] },
      { sense: 'bend', yo: '굽어요', keys: ['bend', 'bent', 'curve', 'crooked'] }] },
    '이르다': { def: 'early', senses: [
      { sense: 'early / tell on', yo: '일러요', keys: ['early', 'tell', 'premature', 'tattle'] },
      { sense: 'arrive / reach', yo: '이르러요', keys: ['arrive', 'reach', 'lead to'] }] }
  };
  // 불규칙 목록 (낱말 끝부분으로 확인: '갈아입다'는 '입다'로 끝남)
  var B_REGULAR = ['입다', '잡다', '좁다', '씹다', '뽑다', '업다', '접다', '집다', '수줍다', '뒤집다', '꼽다', '헤집다', '굽히다'];
  var B_WA = ['돕다', '곱다'];                                           // -와요
  var D_IRREG = ['듣다', '싣다', '깨닫다', '일컫다', '붇다', '눋다'];    // + 걷다(walk)·묻다(ask) 는 AMBIG
  var S_IRREG = ['낫다', '짓다', '붓다', '잇다', '젓다', '긋다'];
  var H_REGULAR = ['좋다', '놓다', '넣다', '낳다', '쌓다', '닿다', '찧다', '땋다', '빻다'];
  var REU_EU = ['따르다', '치르다', '들르다', '다다르다', '우러르다'];      // 르 이지만 '으' 탈락만
  var SPECIAL = { '푸다': '퍼요', '이다': '이에요', '아니다': '아니에요' };
  // 명사 + 이다 (T146q R29): '-는 편이다' → 편이에요. 보이다·높이다 같은 동사는 목록 밖이라 그대로.
  var NOUN_IDA = ['편', '중', '것', '때문', '셈', '예정', '생각', '뿐', '탓', '덕분', '정도', '마련', '모양', '법', '터', '참', '줄', '수', '적', '계획', '상태', '사이', '차례', '날'];
  function copula(noun) { var s = split(noun.slice(-1)); return s ? noun + (s.jong ? '이에요' : '예요') : null; }

  function endsWithAny(word, list) {
    for (var i = 0; i < list.length; i++) if (word.length >= list[i].length && word.slice(-list[i].length) === list[i]) return true;
    return false;
  }

  /** 받침 없는 어간 끝 음절 + 아/어 축약 */
  function contract(stem, a) {
    var last = stem.slice(-1), s = split(last), head = stem.slice(0, -1);
    var v = s.jung;
    if (v === 'ㅏ' || v === 'ㅓ' || v === 'ㅕ' || v === 'ㅐ' || v === 'ㅔ' || v === 'ㅒ' || v === 'ㅖ') return stem + '요';
    if (v === 'ㅗ') return head + join(s.cho, 'ㅘ') + '요';
    if (v === 'ㅜ') return head + join(s.cho, 'ㅝ') + '요';
    if (v === 'ㅚ') return head + join(s.cho, 'ㅙ') + '요';
    if (v === 'ㅣ') return head + join(s.cho, 'ㅕ') + '요';
    return stem + a + '요';                                               // ㅟ·ㅢ·ㅛ·ㅠ 등: 축약 없음 (쉬어요)
  }
  function regular(stem) {
    var s = split(stem.slice(-1));
    if (!s) return null;
    var a = bright(s.jung) ? '아' : '어';
    if (s.jong) return stem + a + '요';
    if (s.jung === 'ㅡ') return euDrop(stem);
    return contract(stem, a);
  }
  /** 으 탈락: 쓰다→써요, 바쁘다→바빠요, 예쁘다→예뻐요 */
  var EU_ONE = ['쓰', '끄', '뜨', '크', '트'];   // 한 음절 동사가 뒤에 붙은 합성어: 받아쓰다 → 받아써요
  function euDrop(stem) {
    var s = split(stem.slice(-1)), head = stem.slice(0, -1);
    var prev = head && EU_ONE.indexOf(stem.slice(-1)) < 0 ? split(head.slice(-1)) : null;
    var v = prev && bright(prev.jung) ? 'ㅏ' : 'ㅓ';
    return head + join(s.cho, v) + '요';
  }

  function conjugateWord(lemma, gloss) {
    if (!lemma || lemma.slice(-1) !== '다' || lemma.length < 2) return null;
    if (SPECIAL[lemma]) return { yo: SPECIAL[lemma], rule: 'special' };
    if (lemma.slice(-2) === '이다' && (NOUN_IDA.indexOf(lemma.slice(0, -2)) >= 0 || (lemma.length >= 4 && lemma.slice(-3, -2) === '적'))) return { yo: copula(lemma.slice(0, -2)), rule: '이다' };
    var stem = lemma.slice(0, -1);
    if (!split(stem.slice(-1))) return null;
    // 하다
    if (stem.slice(-1) === '하') return { yo: stem.slice(0, -1) + '해요', rule: '하다' };
    // 뜻이 갈리는 낱말
    var amb = Object.prototype.hasOwnProperty.call(AMBIG, lemma) ? AMBIG[lemma] : null;
    if (amb) {
      var g = String(gloss || '').toLowerCase();
      var hits = amb.senses.filter(function (s) { return s.keys.some(function (k) { return g.indexOf(k) >= 0; }); });
      var pick = hits.length === 1 ? hits[0] : null;   // 두 뜻이 다 맞으면 못 고른 것으로
      var alts = amb.senses.map(function (s) { return { sense: s.sense, yo: s.yo }; });
      if (pick) return { yo: pick.yo, rule: 'sense', ambiguous: false, sense: pick.sense, alts: alts };
      var d = amb.senses.filter(function (s) { return s.sense.indexOf(amb.def) === 0; })[0] || amb.senses[0];
      return { yo: d.yo, rule: 'sense', ambiguous: true, sense: d.sense, alts: alts };
    }
    var last = split(stem.slice(-1)), head = stem.slice(0, -1);
    // ㅂ 불규칙
    if (last.jong === 'ㅂ' && !endsWithAny(lemma, B_REGULAR)) {
      var w = endsWithAny(lemma, B_WA) ? '와요' : '워요';
      return { yo: head + join(last.cho, last.jung) + w, rule: 'ㅂ' };
    }
    // ㄷ 불규칙
    if (last.jong === 'ㄷ' && endsWithAny(lemma, D_IRREG)) {
      return { yo: regular(head + join(last.cho, last.jung, 'ㄹ')), rule: 'ㄷ' };
    }
    // ㅅ 불규칙 (축약 없음: 나아요, 지어요)
    if (last.jong === 'ㅅ' && endsWithAny(lemma, S_IRREG)) {
      return { yo: head + join(last.cho, last.jung) + (bright(last.jung) ? '아요' : '어요'), rule: 'ㅅ' };
    }
    // ㅎ 불규칙 (하얗다→하얘요, 그렇다→그래요)
    if (last.jong === 'ㅎ' && !endsWithAny(lemma, H_REGULAR)) {
      var nv = last.jung === 'ㅑ' ? 'ㅒ' : last.jung === 'ㅕ' ? 'ㅖ' : 'ㅐ';
      return { yo: head + join(last.cho, nv) + '요', rule: 'ㅎ' };
    }
    // 르 불규칙
    if (stem.slice(-1) === '르' && head) {
      if (endsWithAny(lemma, REU_EU)) return { yo: euDrop(stem), rule: '으' };
      if (lemma === '푸르다') return { yo: '푸르러요', rule: '러' };
      var p = split(head.slice(-1));
      if (p && !p.jong) {
        var h2 = head.slice(0, -1) + join(p.cho, p.jung, 'ㄹ');
        return { yo: h2 + (bright(p.jung) ? '라요' : '러요'), rule: '르' };
      }
    }
    // 으 탈락
    if (!last.jong && last.jung === 'ㅡ') return { yo: euDrop(stem), rule: '으' };
    return { yo: regular(stem), rule: 'regular' };
  }

  /** 띄어 쓴 표현은 마지막 낱말만 활용: '한국어를 배우다' → '한국어를 배워요' */
  function toYo(lemma, gloss) {
    lemma = String(lemma || '').trim();
    var m = lemma.match(/^(.*\s)?(\S+)$/);
    if (!m) return null;
    var r = conjugateWord(m[2], gloss);
    if (!r) return null;
    r.yo = (m[1] || '') + r.yo;
    if (r.alts) r.alts = r.alts.map(function (a) { return { sense: a.sense, yo: (m[1] || '') + a.yo }; });
    return r;
  }

  var PRED = { verb: 1, adjective: 1, 'descriptive verb': 1, 'action verb': 1, '동사': 1, '형용사': 1, v: 1, adj: 1 };
  /** 단어 카드 표시: 동사·형용사는 "사전형 / 요형". 그 밖에는 그대로. */
  function display(word) {
    var ko = String(word.ko || word.lemma || '').trim();
    var pos = String(word.pos || '').toLowerCase();
    var isPred = PRED[pos] || (!pos && /다$/.test(ko) && ko.length >= 2 && !/^(바다|다|모두다)$/.test(ko));
    if (!isPred) return { display: ko, yo: null, check: false };
    var r = toYo(ko, word.en || word.gloss || word.meaning);
    if (!r || !r.yo) return { display: ko, yo: null, check: true };
    return { display: ko + ' / ' + r.yo, yo: r.yo, check: !!r.ambiguous, rule: r.rule, alts: r.alts || null };
  }

  root.Conjugate = { toYo: toYo, display: display };
})(typeof window !== 'undefined' ? window : this);
