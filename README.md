# adventure_2026 web — 큰 화면 디스플레이

UNO R4 WiFi 기기가 보낸 경고 상태를 **폰/태블릿/모니터 브라우저에 큰 글씨로** 표시하는 Next.js 앱.
작은 OLED 대신(또는 함께) 멀리서도 보이게 하는 보조 디스플레이.

## 구조

- `app/page.tsx` — 큰 디스플레이 (1초마다 `/api/status` 폴링, 위험 시 빨강 점멸)
- `app/api/status/route.ts` — 상태 API
  - `POST /api/status` ← 기기(R4)가 평가 때마다 push
  - `GET  /api/status` → 브라우저가 폴링
- `lib/store.ts` — **인메모리** 최신 상태 1건 (데모용). 영속/이력 필요 시 이 파일만 Vercel KV 로 교체.

## 로컬 실행

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Vercel 배포

```bash
cd web
vercel             # 프리뷰
vercel --prod      # 프로덕션
```

배포 후 나온 URL(예: `https://adventure-web.vercel.app`)을 기기 펌웨어의
`STATUS_POST_URL` 에 넣으면 됨 (`secrets.h`).

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

> ⚠️ 인메모리 저장이라 서버리스 콜드스타트/다중 인스턴스에서 상태가 사라질 수 있음.
> 데모엔 충분하지만, 안정성이 필요하면 `lib/store.ts` 를 Vercel KV(Upstash Redis)로 교체.
