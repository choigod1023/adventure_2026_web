# adventure_2026 web — Big-Screen Display

[한국어](README.md) · [日本語](README.ja.md) · **English**

A Next.js app that shows the alert state pushed by an UNO R4 WiFi device **in large type on a phone, tablet, or monitor browser**.
It acts as a secondary display — instead of (or alongside) the small OLED — so the warning is readable from a distance.

🔗 **Live demo: [adventure-2026-web.vercel.app](https://adventure-2026-web.vercel.app)**

## Architecture (Supabase Realtime)

- `app/page.tsx` — the big display. **Subscribes to Supabase Realtime** so it updates the moment the device pushes (no polling).
  Falls back automatically to polling `/api/status` when Supabase env vars are absent.
- `app/api/status/route.ts` — device ingest API (`POST`), plus `GET` for the fallback path.
- `lib/store.ts` — server-side upsert/select of the single Supabase `device_status` row (id=1). In-memory fallback without env.
- `supabase/schema.sql` — table / RLS / Realtime setup (run once).

Data flow: **device → POST /api/status → (server, service key) Supabase upsert → Realtime → browser updates instantly.**

## Supabase setup (one time)

1. **Vercel → Storage (or Marketplace) → create Supabase → Connect it to this project**
   → env vars are injected automatically: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. In the **Supabase dashboard → SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql) (table + RLS + Realtime).
3. Redeploy (automatic). Done.

> The app still works without env vars (in-memory + polling), but flicker across multiple instances remains. Realtime behavior and stability require the setup above.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000  (falls back to 2s polling without env)
```

## Deploy to Vercel

```bash
vercel --prod
```

Put the deployment URL (e.g. `https://adventure-2026-web.vercel.app`) into `WEB_PUSH_HOST`
in the firmware's `config.h`, and set `ENABLE_WEB_PUSH 1`.

## Device → server protocol (POST /api/status)

```http
POST /api/status
Content-Type: application/json

{ "mode": "CITS", "line1": "번동사거리", "line2": "녹색", "danger": true, "ts": 123456 }
```

| Field | Type | Description |
|---|---|---|
| `mode` | string | BUS / SUBWAY / CITS / SENSOR |
| `line1` | string | Context (bus stop / station / intersection) |
| `line2` | string | Detail |
| `danger` | boolean | Whether it is dangerous (true → screen flashes red) |
| `ts` | number? | Device timestamp (optional) |

> When Supabase is connected, these values are upserted into a single row (id=1), and the browser subscribes to that row via Realtime.

---

## 👤 Contribution & development environment

| Item | Detail |
|---|---|
| **Contribution share** | **100%** (solo development) |
| **Commits** | 9 / 9 (mine / all human commits) |
| **Contributors** | 1 |
| **AI coding tool** | Claude Code |

<sub>Counting basis: commits reachable from **every branch** on origin (merge commits and empty commits excluded), counted by commit author email with one person’s multiple addresses merged; bot and automation commits are excluded.</sub>
