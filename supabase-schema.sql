create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key,
  reward jsonb not null,
  amount numeric not null default 0,
  mobile text,
  upi_ref text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz
);

alter table public.app_state enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "Majisa app_state read" on public.app_state;
drop policy if exists "Majisa app_state write" on public.app_state;
drop policy if exists "Majisa app_state update" on public.app_state;
drop policy if exists "Majisa coupons read" on public.coupons;
drop policy if exists "Majisa coupons write" on public.coupons;
drop policy if exists "Majisa coupons update" on public.coupons;

create policy "Majisa app_state read"
on public.app_state for select
to anon, authenticated
using (true);

create policy "Majisa app_state write"
on public.app_state for insert
to anon, authenticated
with check (true);

create policy "Majisa app_state update"
on public.app_state for update
to anon, authenticated
using (true)
with check (true);

create policy "Majisa coupons read"
on public.coupons for select
to anon, authenticated
using (true);

create policy "Majisa coupons write"
on public.coupons for insert
to anon, authenticated
with check (true);

create policy "Majisa coupons update"
on public.coupons for update
to anon, authenticated
using (true)
with check (true);
