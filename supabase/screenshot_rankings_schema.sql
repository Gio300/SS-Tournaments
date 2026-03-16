-- Screenshot rankings, power level, trophies, stat check
-- Run in Supabase SQL Editor after posts_schema.sql

-- 1.1 Profiles extension
do $$ begin
  alter table public.profiles add column if not exists power_level integer default 0;
  alter table public.profiles add column if not exists country text;
  alter table public.profiles add column if not exists dashboard_override jsonb default '{}';
exception when others then null;
end $$;

-- 1.2 Match results (screenshot-based)
create table if not exists public.match_results (
  id uuid default uuid_generate_v4() primary key,
  uploader_id uuid references public.profiles(id) on delete cascade not null,
  screenshot_url text not null,
  match_type text check (match_type in ('survival', 'quick_match', 'red_white', 'ninja_world_league', 'tournament')) not null,
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending',
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.match_result_players (
  id uuid default uuid_generate_v4() primary key,
  result_id uuid references public.match_results(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('winner', 'loser', 'participant')) not null,
  score integer,
  team text check (team in ('red', 'white')),
  created_at timestamptz default now()
);

create table if not exists public.power_ratings (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  match_type text check (match_type in ('survival', 'quick_match', 'red_white', 'ninja_world_league', 'tournament')) not null,
  rating integer default 1000,
  wins integer default 0,
  losses integer default 0,
  updated_at timestamptz default now(),
  unique(profile_id, match_type)
);

create table if not exists public.trophies (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  trophy_type text not null,
  earned_at timestamptz default now(),
  metadata jsonb default '{}'
);

-- 1.3 Stat check (buff verification)
create table if not exists public.stat_check_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  character_name text,
  description text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- RLS
alter table public.match_results enable row level security;
alter table public.match_result_players enable row level security;
alter table public.power_ratings enable row level security;
alter table public.trophies enable row level security;
alter table public.stat_check_submissions enable row level security;

create policy "Match results viewable" on public.match_results for select using (true);
create policy "Users insert own match results" on public.match_results for insert with check (auth.uid() = uploader_id);
create policy "Users update own match results" on public.match_results for update using (auth.uid() = uploader_id);

create policy "Match result players viewable" on public.match_result_players for select using (true);
create policy "Users insert players for own results" on public.match_result_players for insert
  with check (exists (select 1 from public.match_results where id = result_id and uploader_id = auth.uid()));

create policy "Power ratings viewable" on public.power_ratings for select using (true);
create policy "Power ratings insert" on public.power_ratings for insert with check (auth.uid() is not null);
create policy "Power ratings update" on public.power_ratings for update using (auth.uid() is not null);

create policy "Trophies viewable" on public.trophies for select using (true);
create policy "Trophies insert" on public.trophies for insert with check (auth.uid() is not null);

create policy "Stat check viewable" on public.stat_check_submissions for select using (true);
create policy "Users insert own stat check" on public.stat_check_submissions for insert with check (auth.uid() = user_id);
create policy "Users update own stat check" on public.stat_check_submissions for update using (auth.uid() = user_id);

-- Indexes
create index if not exists match_results_uploader on public.match_results(uploader_id);
create index if not exists match_results_status on public.match_results(status);
create index if not exists match_results_match_type on public.match_results(match_type);
create index if not exists match_result_players_result on public.match_result_players(result_id);
create index if not exists match_result_players_profile on public.match_result_players(profile_id);
create index if not exists power_ratings_profile on public.power_ratings(profile_id);
create index if not exists power_ratings_match_type on public.power_ratings(match_type);
create index if not exists power_ratings_rating on public.power_ratings(rating desc);
create index if not exists trophies_profile on public.trophies(profile_id);
create index if not exists stat_check_user on public.stat_check_submissions(user_id);
create index if not exists stat_check_status on public.stat_check_submissions(status);

-- Storage: screenshots bucket
insert into storage.buckets (id, name, public)
select 'screenshots', 'screenshots', true where not exists (select 1 from storage.buckets where id = 'screenshots');

create policy "Screenshots viewable" on storage.objects for select using (bucket_id = 'screenshots');
create policy "Users upload screenshots" on storage.objects for insert
  with check (bucket_id = 'screenshots' and auth.uid() is not null);
create policy "Users update own screenshots" on storage.objects for update
  using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own screenshots" on storage.objects for delete
  using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage: stat-check-videos bucket
insert into storage.buckets (id, name, public)
select 'stat-check-videos', 'stat-check-videos', true where not exists (select 1 from storage.buckets where id = 'stat-check-videos');

create policy "Stat check videos viewable" on storage.objects for select using (bucket_id = 'stat-check-videos');
create policy "Users upload stat check videos" on storage.objects for insert
  with check (bucket_id = 'stat-check-videos' and auth.uid() is not null);
create policy "Users update own stat check videos" on storage.objects for update
  using (bucket_id = 'stat-check-videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own stat check videos" on storage.objects for delete
  using (bucket_id = 'stat-check-videos' and auth.uid()::text = (storage.foldername(name))[1]);
