-- Live groups for multi-view (add to SS-Tournaments)
-- Run in Supabase SQL Editor after strikerclips_schema.sql

create table if not exists public.live_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  creator_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.live_group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.live_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stream_id uuid references public.live_streams(id) on delete set null,
  accepted boolean default false,
  unique(group_id, user_id)
);

create table if not exists public.user_youtube_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  url text not null,
  title text,
  created_at timestamptz default now()
);

alter table public.live_groups enable row level security;
alter table public.live_group_members enable row level security;
alter table public.user_youtube_links enable row level security;

create policy "Live groups viewable" on public.live_groups for select using (true);
create policy "Users create live groups" on public.live_groups for insert with check (auth.uid() is not null);
create policy "Creators update live groups" on public.live_groups for update using (creator_id = auth.uid());
create policy "Creators delete live groups" on public.live_groups for delete using (creator_id = auth.uid());

create policy "Live group members viewable" on public.live_group_members for select using (true);
create policy "Users insert live group members" on public.live_group_members for insert
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.live_groups g where g.id = group_id and g.creator_id = auth.uid())
  );
create policy "Users update own live group members" on public.live_group_members for update using (auth.uid() = user_id);
create policy "Users delete own live group members" on public.live_group_members for delete using (auth.uid() = user_id);

create policy "User youtube links viewable by owner" on public.user_youtube_links for select using (auth.uid() = user_id);
create policy "Users insert youtube links" on public.user_youtube_links for insert with check (auth.uid() = user_id);
create policy "Users delete own youtube links" on public.user_youtube_links for delete using (auth.uid() = user_id);
