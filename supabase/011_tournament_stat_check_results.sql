-- Tournament admins, stat check under tournaments, tournament results, trophy for wins

-- Tournament admins (owner can appoint)
create table if not exists public.tournament_admins (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(tournament_id, user_id)
);
create index if not exists idx_tournament_admins_tournament on public.tournament_admins(tournament_id);
alter table public.tournament_admins enable row level security;
drop policy if exists "Tournament admins viewable" on public.tournament_admins;
create policy "Tournament admins viewable" on public.tournament_admins for select using (true);
drop policy if exists "Tournament owner add admins" on public.tournament_admins;
create policy "Tournament owner add admins" on public.tournament_admins for insert with check (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);
drop policy if exists "Tournament owner remove admins" on public.tournament_admins;
create policy "Tournament owner remove admins" on public.tournament_admins for delete using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

-- Stat check submissions scoped to tournament
alter table public.stat_check_submissions add column if not exists tournament_id uuid references public.tournaments(id) on delete set null;
create index if not exists idx_stat_check_tournament on public.stat_check_submissions(tournament_id);
alter table public.stat_check_submissions add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
drop policy if exists "Tournament owner/admin update stat check" on public.stat_check_submissions;
create policy "Tournament owner/admin update stat check" on public.stat_check_submissions for update using (
  exists (
    select 1 from public.tournaments t
    left join public.tournament_admins ta on ta.tournament_id = t.id and ta.user_id = auth.uid()
    where t.id = stat_check_submissions.tournament_id
    and (t.created_by = auth.uid() or ta.user_id = auth.uid())
  )
);

-- Tournament results (admin records winner)
create table if not exists public.tournament_results (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  winner_profile_id uuid references public.profiles(id) on delete cascade not null,
  team_name text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_tournament_results_tournament on public.tournament_results(tournament_id);
create index if not exists idx_tournament_results_winner on public.tournament_results(winner_profile_id);
alter table public.tournament_results enable row level security;
drop policy if exists "Tournament results viewable" on public.tournament_results;
create policy "Tournament results viewable" on public.tournament_results for select using (true);
drop policy if exists "Tournament owner/admin submit result" on public.tournament_results;
create policy "Tournament owner/admin submit result" on public.tournament_results for insert with check (
  exists (
    select 1 from public.tournaments t
    left join public.tournament_admins ta on ta.tournament_id = t.id and ta.user_id = auth.uid()
    where t.id = tournament_id
    and (t.created_by = auth.uid() or ta.user_id = auth.uid())
  )
);

-- Allow authenticated users to insert trophies (tournament_win when submitting result as admin)
drop policy if exists "Trophies insert" on public.trophies;
create policy "Trophies insert" on public.trophies for insert with check (auth.uid() is not null);
