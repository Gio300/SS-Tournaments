-- Tournaments with optional server_id for in-clan tournaments
create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  server_id uuid references public.servers(id) on delete set null,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.tournaments enable row level security;
create policy "Tournaments viewable" on public.tournaments for select using (true);
create policy "Users create tournaments" on public.tournaments for insert with check (auth.uid() is not null);
create policy "Users update tournaments" on public.tournaments for update using (auth.uid() is not null);
create policy "Users delete tournaments" on public.tournaments for delete using (auth.uid() is not null);
