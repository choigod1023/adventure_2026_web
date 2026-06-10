// 디바이스(R4)가 POST 한 '최신 상태' 1건을 보관.
//   · 우선 Vercel KV(Upstash Redis) 사용 → 모든 서버리스 인스턴스가 같은 값을 봄
//     (인메모리의 "인스턴스마다 따로라 빈 화면" 문제 해결).
//   · KV 환경변수가 없으면 인메모리로 자동 폴백 (로컬/미설정 시에도 동작).
//
// Vercel 설정: Storage → Upstash Redis(또는 KV) 생성 → 프로젝트 연결 →
//   KV_REST_API_URL / KV_REST_API_TOKEN (또는 UPSTASH_REDIS_REST_URL/TOKEN) 자동 주입.

import { Redis } from "@upstash/redis";

export type DeviceStatus = {
  mode: string; // "BUS" | "SUBWAY" | "CITS" | "SENSOR"
  line1: string; // 컨텍스트 (정류장/역/교차로)
  line2: string; // 상세
  danger: boolean; // 위험 여부
  ts?: number; // 디바이스 측 타임스탬프(선택)
  receivedAt: number; // 서버 수신 시각(epoch ms)
};

const KEY = "device:status";

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

// KV 미설정 시 폴백용 인메모리 (HMR 간 유지)
const g = globalThis as unknown as { __deviceStatus?: DeviceStatus | null };

export async function setStatus(s: DeviceStatus): Promise<void> {
  const r = getRedis();
  if (r) await r.set(KEY, s);
  else g.__deviceStatus = s;
}

export async function getStatus(): Promise<DeviceStatus | null> {
  const r = getRedis();
  if (r) return ((await r.get<DeviceStatus>(KEY)) as DeviceStatus | null) ?? null;
  return g.__deviceStatus ?? null;
}
