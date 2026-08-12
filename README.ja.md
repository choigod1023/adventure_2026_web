# adventure_2026 web — 大画面ディスプレイ

[한국어](README.md) · **日本語** · [English](README.en.md)

UNO R4 WiFi デバイスが送る警告状態を、**スマホ／タブレット／モニタのブラウザに大きな文字で** 表示する Next.js アプリ。
小さな OLED の代わりに（あるいは併用して）遠くからでも見えるようにする補助ディスプレイです。

🔗 **ライブデモ: [adventure-2026-web.vercel.app](https://adventure-2026-web.vercel.app)**

## 構成（Supabase Realtime）

- `app/page.tsx` — 大画面ディスプレイ。**Supabase Realtime を購読** し、デバイスが送信した瞬間に更新（ポーリング不要）。
  Supabase の env が無い場合は `/api/status` のポーリングへ自動フォールバック。
- `app/api/status/route.ts` — デバイス受信 API（`POST`）、フォールバック用の `GET`。
- `lib/store.ts` — サーバー側で Supabase `device_status` の単一行（id=1）を upsert / select。env が無ければインメモリにフォールバック。
- `supabase/schema.sql` — テーブル／RLS／Realtime の設定（1 回だけ実行）。

データの流れ: **デバイス → POST /api/status →（サーバー, service key）Supabase upsert → Realtime → ブラウザが即時更新。**

## Supabase 設定（初回のみ）

1. **Vercel → Storage（または Marketplace）→ Supabase を作成 → このプロジェクトに Connect**
   → env が自動注入されます: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. **Supabase ダッシュボード → SQL Editor** で [`supabase/schema.sql`](./supabase/schema.sql) を実行（テーブル＋RLS＋Realtime）。
3. 再デプロイ（自動）。以上です。

> env 未設定でもアプリは動作します（インメモリ＋ポーリング）。ただし複数インスタンス間でのちらつきが残ります。リアルタイム性と安定性は上記設定後に有効になります。

## ローカル実行

```bash
npm install
npm run dev        # http://localhost:3000  (env が無ければ 2 秒ポーリングにフォールバック)
```

## Vercel へのデプロイ

```bash
vercel --prod
```

デプロイ URL（例: `https://adventure-2026-web.vercel.app`）をファームウェアの `config.h` の
`WEB_PUSH_HOST` に設定し、`ENABLE_WEB_PUSH 1` にします。

## デバイス → サーバー送信仕様（POST /api/status）

```http
POST /api/status
Content-Type: application/json

{ "mode": "CITS", "line1": "번동사거리", "line2": "녹색", "danger": true, "ts": 123456 }
```

| フィールド | 型 | 説明 |
|---|---|---|
| `mode` | string | BUS / SUBWAY / CITS / SENSOR |
| `line1` | string | コンテキスト（バス停／駅／交差点） |
| `line2` | string | 詳細 |
| `danger` | boolean | 危険かどうか（true → 画面が赤く点滅） |
| `ts` | number? | デバイスのタイムスタンプ（任意） |

> Supabase に接続している場合、上記の値が単一行（id=1）へ upsert され、ブラウザはその行を Realtime で購読します。

---

## 👤 コントリビューションと開発環境

| 項目 | 内容 |
|---|---|
| **貢献比率** | **100%**（単独開発） |
| **コミット** | 7 / 7（本人 / 全人力コミット） |
| **参加人数** | 1 名 |
| **AI コーディングツール** | Claude Code |

<sub>貢献比率はコミットの author メールアドレス基準で集計し、ボット・自動化コミットは除外しています。</sub>
