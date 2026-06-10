# adventure_2026 web — 큰 화면 디스플레이

UNO R4 WiFi 기기가 보낸 경고 상태를 **폰/태블릿/모니터 브라우저에 큰 글씨로** 표시하는 Next.js 앱.
작은 OLED 대신(또는 함께) 멀리서도 보이게 하는 보조 디스플레이.

## 구조 (Supabase Realtime)

- `app/page.tsx` — 큰 디스플레이. **Supabase Realtime 구독** → 기기가 쏘는 즉시 갱신(폴링 X).
  Supabase env 가 없으면 `/api/status` 폴링으로 자동 폴백.
- `app/api/status/route.ts` — 기기 수신 API (`POST`), 폴백용 `GET`.
- `lib/store.ts` — 서버에서 Supabase `device_status` 단일 행(id=1) upsert/select. env 없으면 인메모리 폴백.
- `supabase/schema.sql` — 테이블/RLS/Realtime 설정 (1회 실행).

데이터 흐름: **기기 → POST /api/status → (서버, service key) Supabase upsert → Realtime → 브라우저 즉시 갱신.**

## Supabase 설정 (1회)

1. **Vercel → Storage(또는 Marketplace) → Supabase 생성 → 이 프로젝트에 Connect**
   → env 자동 주입: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. **Supabase 대시보드 → SQL Editor** 에서 [`supabase/schema.sql`](./supabase/schema.sql) 실행 (테이블+RLS+Realtime).
3. 재배포(자동). 끝.

> env 미설정 시에도 앱은 동작(인메모리+폴링) — 단 다중 인스턴스 깜빡임이 남음. 실시간/안정성은 위 설정 후 적용.

## 로컬 실행

```bash
cd web
npm install
npm run dev        # http://localhost:3000  (env 없으면 폴링 폴백)
```

## Vercel 배포

```bash
cd web
vercel --prod
```

배포 URL(예: `https://adventure-2026-web.vercel.app`)을 펌웨어 `config.h` 의
`WEB_PUSH_HOST` 에 넣고 `ENABLE_WEB_PUSH 1` 로.

## 디바이스 → 서버 전송 규약 (POST /api/status)

```http
POST /api/status
Content-Type: application/json

{ "mode": "CITS", "line1": "번동사거리", "line2": "녹색", "danger": true, "ts": 123456 }
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `mode` | string | BUS / SUBWAY / CITS / SENSOR |
| `line1` | string | 컨텍스트 (정류장/역/교차로) |
| `line2` | string | 상세 |
| `danger` | boolean | 위험 여부 (true → 화면 빨강 점멸) |
| `ts` | number? | 기기 타임스탬프(선택) |

> Supabase 연결 시 위 값이 단일 행(id=1)에 upsert 되고, 브라우저는 그 행을 Realtime 으로 구독한다.
