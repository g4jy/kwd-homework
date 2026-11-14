/* teacher-install.js — T120b 선생님 화면을 바탕화면·홈 화면에 설치. teacher.html 에서만 읽음.
 * PC·안드로이드: 설치 창(beforeinstallprompt). 키는 브라우저 저장소를 설치 앱과 같이 씀 → manifest 에 키 없음.
 * 아이폰·아이패드: 홈 화면 앱은 사파리와 저장소가 따로라, 단추를 누른 동안만 주소에 #t=키 를 넣어 그 주소로 추가하게 함(안내를 닫으면 지움). */
(function () {
  'use strict';
  var FLAG = 'hw2_t_installed', prompted = null, slot = null;
  var ua = navigator.userAgent || '';
  var IOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var PHONE = IOS || /Android/.test(ua);
  var LABEL = PHONE ? '홈 화면에 설치' : '바탕화면에 설치';

  function standalone() { return navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  function flag(v) { try { if (v) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch (e) { /* 저장 못 함 */ } }
  function flagged() { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }

  function guideLines() {
    if (IOS) return ['화면의 공유 단추(네모에 위쪽 화살표)를 누르세요.', "'홈 화면에 추가'를 누르고 '추가'를 누르면 끝나요."];
    var chromium = /Chrome|Edg\//.test(ua) && !/SamsungBrowser|OPR\//.test(ua);
    if (PHONE && chromium) return ['오른쪽 위 메뉴(점 세 개)를 누르세요.', "'앱 설치' 또는 '홈 화면에 추가'를 누르세요."];
    if (chromium) return ['주소창 오른쪽의 설치 표시를 누르세요.', "안 보이면 메뉴(점 세 개) → '앱' 또는 '전송, 저장, 공유'에서 설치를 고르세요."];
    return ['이 브라우저는 앱 설치를 지원하지 않아요.', '크롬이나 엣지에서 선생님 링크를 열고 이 단추를 다시 눌러 주세요.'];
  }

  /* 아이폰: 안내가 열린 동안만 주소에 키 */
  var plainUrl = null;
  function keyInAddress() {
    var k = window.UI && UI.store.get('hw2_tkey', null);
    if (!k) return;
    plainUrl = location.pathname + location.search + location.hash;
    history.replaceState(null, '', location.pathname + location.search + '#t=' + encodeURIComponent(k));
  }
  function keyOutOfAddress() { if (plainUrl !== null) { history.replaceState(null, '', plainUrl); plainUrl = null; } }

  function closeGuide() { keyOutOfAddress(); paint(false); }

  function paint(guide) {
    if (!slot) return;
    slot.innerHTML = '';
    if (standalone() || (flagged() && !prompted) || !(window.UI && UI.store.get('hw2_tkey', null))) { slot.hidden = true; return; }
    slot.hidden = false;
    var row = document.createElement('div'); row.className = 'tinst-row';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ghost sm'; b.setAttribute('data-act', guide ? 'install-close' : 'install');
    b.textContent = guide ? '닫기' : LABEL;
    b.onclick = guide ? closeGuide : press;
    row.appendChild(b); slot.appendChild(row);
    if (guide) {
      var box = document.createElement('div'); box.className = 'tinst-guide'; box.setAttribute('role', 'status'); box.setAttribute('data-act', 'install-guide');
      guideLines().forEach(function (t) { var p = document.createElement('p'); p.textContent = t; box.appendChild(p); });
      slot.appendChild(box);
    }
  }

  function press() {
    if (prompted) {
      var ev = prompted; prompted = null;
      ev.prompt();
      (ev.userChoice || Promise.resolve({})).then(function (c) { if (c && c.outcome === 'accepted') flag(true); else prompted = ev; paint(false); });
      return;
    }
    if (IOS) keyInAddress();
    paint(true);
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); prompted = e; flag(false); paint(false); });
  window.addEventListener('appinstalled', function () { prompted = null; flag(true); paint(false); });

  function start() {
    var app = document.getElementById('app'); if (!app) return;
    slot = document.createElement('div'); slot.className = 'wrap wide tinst'; slot.setAttribute('data-act', 'install-bar');
    app.parentNode.insertBefore(slot, app);
    paint(false);
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw-teacher.js', { scope: './teacher.html' }).catch(function () { /* 설치만 안 될 뿐 화면은 그대로 */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
