"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Status = {
  mode?: string;
  line1?: string;
  line2?: string;
  danger?: boolean;
  ts?: number;
  receivedAt?: number;
  empty?: boolean;
};

const POLL_MS = 2000; // Supabase 미설정 시 폴백 폴링 주기
const STALE_MS = 20000; // 이 시간 넘게 갱신 없으면 '연결 끊김'

// Supabase 브라우저 클라이언트 (env 있으면 실시간 구독, 없으면 null → 폴링 폴백)
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase =
  SB_URL && SB_ANON
    ? createClient(SB_URL, SB_ANON, { auth: { persistSession: false } })
    : null;

// 기기 모드 코드 → 클라이언트/시연용 친근한 한글 라벨 (OLED 관리자 화면은 코드 그대로)
const MODE_LABEL: Record<string, string> = {
  BUS: "버스",
  SUBWAY: "지하철",
  CITS: "보행자 신호등",
  SENSOR: "주변 감지",
};
const modeLabel = (m?: string) => (m ? (MODE_LABEL[m] ?? m) : "");

// DB 행(received_at) / API(receivedAt) 양쪽 형태를 Status 로 정규화
function normalize(x: Record<string, unknown> | null): Status | null {
  if (!x || x.empty) return null;
  return {
    mode: x.mode as string,
    line1: x.line1 as string,
    line2: x.line2 as string,
    danger: Boolean(x.danger),
    ts: (x.ts as number) ?? undefined,
    receivedAt: Number(x.received_at ?? x.receivedAt ?? 0) || undefined,
  };
}

export default function Page() {
  const [status, setStatus] = useState<Status | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const clock = setInterval(() => setNow(Date.now()), 1000);

    if (supabase) {
      // 실시간 모드: 초기 1회 로드 + 변경 구독
      supabase
        .from("device_status")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data }) => {
          if (alive) setStatus(normalize(data));
        });
      const ch = supabase
        .channel("device_status")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "device_status",
            filter: "id=eq.1",
          },
          (payload) => {
            if (alive) setStatus(normalize(payload.new as Record<string, unknown>));
          },
        )
        .subscribe();
      return () => {
        alive = false;
        clearInterval(clock);
        supabase.removeChannel(ch);
      };
    }

    // 폴백: /api/status 폴링
    const tick = async () => {
      try {
        const r = await fetch("/api/status", { cache: "no-store" });
        const j = await r.json();
        if (alive) setStatus(normalize(j));
      } catch {
        /* noop */
      }
    };
    tick();
    const poll = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(clock);
      clearInterval(poll);
    };
  }, []);

  const empty = !status;
  const danger = !!status?.danger;
  const stale = status?.receivedAt ? now - status.receivedAt > STALE_MS : true;
  const agoSec = status?.receivedAt
    ? Math.max(0, Math.round((now - status.receivedAt) / 1000))
    : null;

  // 화면 색: CITS(보행자 신호등)는 '실제 신호색'을 따라감 (녹색→초록, 적색→빨강).
  //   그 외 모드는 danger=true 일 때만 빨강 점멸.
  const line2 = status?.line2 ?? "";
  const isCits = status?.mode === "CITS";
  const citsGreen = isCits && line2.includes("녹색");
  const citsRed = isCits && line2.includes("적색");

  let theme = ""; // "" 평상 / go 초록점멸 / stop 빨강 / danger 빨강점멸
  let stateText = "안전";
  let stateClass = "";
  if (stale) {
    stateText = "신호 없음";
  } else if (citsGreen) {
    theme = "go";
    stateText = "보행 녹색 — 건너는 중 주의";
    stateClass = "ok";
  } else if (citsRed) {
    theme = "stop";
    stateText = "보행 적색 — 정지";
    stateClass = "on";
  } else if (danger) {
    theme = "danger";
    stateText = "⚠ 위험 — 고개 들어!";
    stateClass = "on";
  }

  return (
    <main className={`screen ${theme}`}>
      {empty ? (
        <div className="big muted">대기 중…</div>
      ) : (
        <>
          <div className="mode">
            {modeLabel(status!.mode)}
            {stale ? " · 연결 끊김" : ""}
          </div>
          <div className="line1">{status!.line1 || "—"}</div>
          <div className="line2">{status!.line2 || ""}</div>
          <div className={`state ${stateClass}`}>{stateText}</div>
        </>
      )}
      <div className="foot">
        {agoSec === null ? "" : `갱신 ${agoSec}s 전`}
        {supabase ? " · 실시간" : ""}
      </div>
    </main>
  );
}
