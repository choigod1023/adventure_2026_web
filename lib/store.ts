// 디바이스(R4)가 POST 한 '최신 상태' 하나를 메모리에 보관 (데모용).
//   · 서버리스 warm 인스턴스 내에서만 유지되고, 콜드스타트/다중 인스턴스에선 초기화됨.
//   · dev 에서 HMR 간 유지되도록 globalThis 에 매단다.
//   · 영속/이력이 필요해지면 이 모듈만 Vercel KV(Upstash) 등으로 교체하면 됨.

export type DeviceStatus = {
  mode: string; // "BUS" | "SUBWAY" | "CITS" | "SENSOR"
  line1: string; // 컨텍스트 (정류장/역/교차로)
  line2: string; // 상세
  danger: boolean; // 위험 여부
  ts?: number; // 디바이스 측 타임스탬프(선택)
  receivedAt: number; // 서버 수신 시각(epoch ms)
};

const g = globalThis as unknown as { __deviceStatus?: DeviceStatus | null };

export function setStatus(s: DeviceStatus): void {
  g.__deviceStatus = s;
}

export function getStatus(): DeviceStatus | null {
  return g.__deviceStatus ?? null;
}
