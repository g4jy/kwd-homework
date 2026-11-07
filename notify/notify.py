#!/usr/bin/env python3
"""notify.py — 앱 푸시 보내기 (GitHub Actions 에서 10분마다 + Apps Script 가 '지금 보내기' 때 바로 깨움).

비밀은 GitHub 저장소 Secrets 에만: HW_API_URL, HW_TEACHER_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT(mailto:…)
흐름: notify.due(보낼 푸시) → pywebpush 로 보냄 → notify.result(성공/실패, 사라진 구독) → 실패면 서버가 이메일로 대신
      폰이 받으면 서비스 워커(sw.js)가 student.notif {event:'delivered'} 를 직접 기록, 누르면 학생 화면이 'opened' 기록
"""
import json
import os
import sys
import urllib.request

from pywebpush import WebPushException, webpush  # pip install pywebpush


def call(action, **p):
    body = json.dumps({"action": action, "tkey": os.environ["HW_TEACHER_KEY"], **p}).encode()
    req = urllib.request.Request(os.environ["HW_API_URL"], data=body, headers={"Content-Type": "text/plain;charset=utf-8"})
    with urllib.request.urlopen(req, timeout=60) as r:
        res = json.loads(r.read())
    if not res.get("ok"):
        raise RuntimeError(res.get("error"))
    return res["data"]


def main():
    due = call("notify.due")["due"]
    results = []
    for n in due:
        payload = json.dumps({"title": n["title"], "body": n["body"], "url": n["url"], "n": n["n"], "k": n["k"], "api": os.environ["HW_API_URL"]})
        ok, gone, err = False, [], ""
        for sub in n["subs"]:
            try:
                webpush(subscription_info=sub, data=payload, vapid_private_key=os.environ["VAPID_PRIVATE_KEY"],
                        vapid_claims={"sub": os.environ.get("VAPID_SUBJECT", "mailto:teacher@example.com")}, ttl=6 * 3600)
                ok = True
            except WebPushException as e:
                code = getattr(e.response, "status_code", 0)
                if code in (404, 410):
                    gone.append(sub["endpoint"])
                err = f"{code} {str(e)[:120]}"
        results.append({"notif_id": n["notif_id"], "ok": ok, "gone": gone, "error": err if not ok else ""})
    if results:
        call("notify.result", results=results)
    print(f"due={len(due)} sent={sum(r['ok'] for r in results)} failed={sum(not r['ok'] for r in results)}")


if __name__ == "__main__":
    sys.exit(main())
