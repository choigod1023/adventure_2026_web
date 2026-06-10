-- adventure_2026 web — Supabase 스키마 (Supabase 대시보드 → SQL Editor 에서 1회 실행)
--
-- '최신 상태' 단일 행(id=1)만 유지. 서버(서비스 키)가 upsert, 브라우저(anon)가 Realtime 구독.

create table if not exists public.device_status (
  id          int  primary key default 1,
  mode        text not null default '?',
  line1       text not null default '',
  line2       text not null default '',
  danger      bool not null default false,
  ts          bigint,
  received_at bigint not null default 0,
  constraint device_status_single_row check (id = 1)
);

-- 초기 행 1개 시드 (없으면)
insert into public.device_status (id, received_at) values (1, 0)
on conflict (id) do nothing;

-- Realtime: 변경사항을 브라우저로 송출하도록 publication 에 추가
alter publication supabase_realtime add table public.device_status;

-- RLS: 브라우저(anon)는 읽기만. 쓰기는 서버의 service_role 키가 RLS 우회.
alter table public.device_status enable row level security;

drop policy if exists "anon read device_status" on public.device_status;
create policy "anon read device_status"
  on public.device_status for select
  to anon
  using (true);
