/* config.js — 바꿀 곳은 여기뿐. 비밀은 넣지 않습니다 (선생님 키·VAPID 개인 키는 여기 없음).
 * APPS_SCRIPT_URL: Apps Script 웹 앱 주소 (SETUP.md) · VAPID_PUBLIC_KEY: 앱 푸시 공개 키 (공개해도 됨, notify/SETUP 참고)
 */
window.HW_CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzfasitMV64GEhj65A-YSm7sgs6STki7-Gwi2cqMn7Jml8aEHpFPlSLaUVGItjMSG8n/exec',
  VAPID_PUBLIC_KEY: 'BI_Xq9a7Y8VPf-5xkwpl24SUR4h6KWYLLLvTy0sS4Tpx50oDmyXBkK6tuaXTbTBpAhKikER3jzj5wmVtAaxQDFM',
  get API_URL() { return this.APPS_SCRIPT_URL; }
};
