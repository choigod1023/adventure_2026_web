"use client";

import { useEffect, useState } from "react";

type Status = {
  mode?: string;
  line1?: string;
  line2?: string;
  danger?: boolean;
  ts?: number;
  receivedAt?: number;
  empty?: boolean;
};

const POLL_MS = 1000; // 폴링 주기
const STALE_MS = 8000; // 이 시간 넘게 갱신 없으면 '연결 끊김'

export default function Page() {
  const [status, setStatus] = useState<Status | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/status", { cache: "no-store" });
        const j = (await r.json()) as Status;
        if (alive) {
          setStatus(j);
          setErr(false);
        }
      } catch {
        if (alive) setErr(true);
      }
    };
    tick();
    const poll = setInterval(tick, POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const empty = !status || status.empty;
  const danger = !!status?.danger;
  const stale = status?.receivedAt ? now - status.receivedAt > STALE_MS : true;
  const active = danger && !stale;
  const agoSec = status?.receivedAt
    ? Math.max(0, Math.round((now - status.receivedAt) / 1000))
    : null;

  return (
    <main className={`screen ${active ? "danger" : ""}`}>
      {empty ? (
        <div className="big muted">대기 중…</div>
      ) : (
        <>
          <div className="mode">
            {status!.mode}
            {stale ? " · 연결 끊김" : ""}
          </div>
          <div className="line1">{status!.line1 || "—"}</div>
          <div className="line2">{status!.line2 || ""}</div>
          <div className={`state ${active ? "on" : ""}`}>
            {stale ? "신호 없음" : active ? "⚠ 위험 — 고개 들어!" : "안전"}
          </div>
        </>
      )}
      <div className="foot">
        {err
          ? "서버 연결 오류"
          : agoSec === null
            ? ""
            : `갱신 ${agoSec}s 전`}
      </div>
    </main>
  );
}
