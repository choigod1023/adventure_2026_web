import { NextRequest, NextResponse } from "next/server";
import { getStatus, setStatus, type DeviceStatus } from "@/lib/store";

// 항상 최신값 — 캐시 금지
export const dynamic = "force-dynamic";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

// 브라우저(큰 화면)가 폴링 → 최신 상태 반환
export async function GET() {
  return NextResponse.json(getStatus() ?? { empty: true }, { headers: CORS });
}

// 디바이스(R4)가 평가 때마다 상태 push
export async function POST(req: NextRequest) {
  let body: Partial<DeviceStatus>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400, headers: CORS },
    );
  }

  const status: DeviceStatus = {
    mode: String(body.mode ?? "?"),
    line1: String(body.line1 ?? ""),
    line2: String(body.line2 ?? ""),
    danger: Boolean(body.danger),
    ts: typeof body.ts === "number" ? body.ts : undefined,
    receivedAt: Date.now(),
  };
  setStatus(status);
  return NextResponse.json({ ok: true }, { headers: CORS });
}
