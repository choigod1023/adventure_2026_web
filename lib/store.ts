// 디바이스(R4)가 POST 한 '최신 상태' 1건을 보관 (서버 측).
//   · Supabase(Postgres) 의 단일 행(device_status, id=1)에 upsert/select.
//   · 브라우저는 이 행을 Supabase Realtime 으로 구독 → 기기가 쏘면 즉시 화면 갱신(폴링 X).
//   · Supabase 환경변수가 없으면 인메모리로 폴백 (로컬/미설정 시에도 동작).
//
// Vercel 설정: Marketplace → Supabase 연결 시 자동 주입되는 env:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   (테이블/RLS/Realtime 은 supabase/schema.sql 을 SQL Editor 에서 1회 실행)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DeviceStatus = {
  mode: string;
  line1: string;
  line2: string;
  danger: boolean;
  ts?: number;
  receivedAt: number;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let sb: SupabaseClient | null | undefined;
function getSb(): SupabaseClient | null {
  if (sb !== undefined) return sb;
  sb =
    URL && SERVICE_KEY
      ? createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
      : null;
  return sb;
}

// 폴백용 인메모리 (Supabase 미설정 시)
const g = globalThis as unknown as { __deviceStatus?: DeviceStatus | null };

export async function setStatus(s: DeviceStatus): Promise<void> {
  const c = getSb();
  if (!c) {
    g.__deviceStatus = s;
    return;
  }
  await c.from("device_status").upsert({
    id: 1,
    mode: s.mode,
    line1: s.line1,
    line2: s.line2,
    danger: s.danger,
    ts: s.ts ?? null,
    received_at: s.receivedAt,
  });
}

export async function getStatus(): Promise<DeviceStatus | null> {
  const c = getSb();
  if (!c) return g.__deviceStatus ?? null;
  const { data } = await c
    .from("device_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return null;
  return {
    mode: data.mode,
    line1: data.line1,
    line2: data.line2,
    danger: data.danger,
    ts: data.ts ?? undefined,
    receivedAt: Number(data.received_at),
  };
}
